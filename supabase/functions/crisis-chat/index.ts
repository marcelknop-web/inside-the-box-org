import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RATE LIMITING (in-memory, resets on cold start) ─────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 8;   // max 8 requests per minute per IP
const MAX_DAILY_REQUESTS = 200;      // global daily budget
const MAX_MESSAGES_PER_REQUEST = 30; // max conversation length
const MAX_CONTENT_LENGTH = 2000;     // max chars per message

interface RateEntry { count: number; resetAt: number; }
const ipRateMap = new Map<string, RateEntry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function getRateLimitResult(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Daily global budget
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) {
    return { allowed: false, retryAfter: 3600 };
  }

  // Per-IP rate limit
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

// Clean stale entries every 5 minutes
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

  // Only POST allowed
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";

  // Rate limit check
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

    // Validate structure
    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, system } = body;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "API-Limit erreicht. Bitte später erneut versuchen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Anthropic error ${response.status}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ content: data.content[0]?.text ?? "" }),
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
