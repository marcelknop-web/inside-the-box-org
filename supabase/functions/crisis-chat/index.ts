import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RATE LIMITING (in-memory, resets on cold start) ─────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MAX_DAILY_REQUESTS = 200;
const MAX_MESSAGES_PER_REQUEST = 30;
const MAX_CONTENT_LENGTH = 2000;

interface RateEntry { count: number; resetAt: number; }
const ipRateMap = new Map<string, RateEntry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function getRateLimitResult(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) {
    return { allowed: false, retryAfter: 3600 };
  }
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  dailyCount++;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateMap) {
    if (now > entry.resetAt) ipRateMap.delete(ip);
  }
}, 300_000);

// ─── VALIDATION ──────────────────────────────────────────────────
function validateRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") return { valid: false, error: "Invalid request body" };
  const { messages, system } = body as Record<string, unknown>;
  if (!system || typeof system !== "string") return { valid: false, error: "Missing system prompt" };
  if (!Array.isArray(messages) || messages.length === 0) return { valid: false, error: "Missing messages" };
  if (messages.length > MAX_MESSAGES_PER_REQUEST) return { valid: false, error: `Too many messages (max ${MAX_MESSAGES_PER_REQUEST})` };
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") return { valid: false, error: "Invalid message format" };
    if (!["user", "assistant"].includes(msg.role)) return { valid: false, error: `Invalid role: ${msg.role}` };
    if (typeof msg.content !== "string" || msg.content.length === 0) return { valid: false, error: "Empty message content" };
    if (msg.content.length > MAX_CONTENT_LENGTH) return { valid: false, error: `Message too long (max ${MAX_CONTENT_LENGTH} chars)` };
  }
  return { valid: true };
}

// ─── HANDLER ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";

  const rl = getRateLimitResult(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Zu viele Anfragen. Bitte warte einen Moment." }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter ?? 60),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, system } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call Lovable AI Gateway (OpenAI-compatible)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "API-Limit erreicht. Bitte später erneut versuchen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte Credits aufladen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("crisis-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
