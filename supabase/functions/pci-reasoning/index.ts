import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RATE LIMITING (in-memory, resets on cold start) ─────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_DAILY_REQUESTS = 300;

interface RateEntry { count: number; resetAt: number; }
const ipRateMap = new Map<string, RateEntry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function getRateLimitResult(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) return { allowed: false, retryAfter: 3600 };
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

// ─── HANDLER ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const rl = getRateLimitResult(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Zu viele Anfragen, bitte warte einen Moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  try {
    const body = await req.json();
    const { answers, verdict, language } = body;

    // Input validation
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "Invalid request: answers must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (Object.keys(answers).length > 50) {
      return new Response(JSON.stringify({ error: "Too many answers (max 50)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof verdict !== "string" || verdict.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid verdict" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (language !== undefined && (typeof language !== "string" || language.length > 5)) {
      return new Response(JSON.stringify({ error: "Invalid language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    for (const val of Object.values(answers)) {
      const v = val as any;
      if (!v || typeof v !== "object" || typeof v.label !== "string" || v.label.length > 500) {
        return new Response(JSON.stringify({ error: "Invalid answer entry" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langLabels: Record<string, Record<string, string>> = {
      de: {
        instruction: "Schreibe eine kurze, sachliche Begründung (3-4 Sätze) auf Deutsch",
      },
      en: {
        instruction: "Write a short, factual reasoning (3-4 sentences) in English",
      },
      fr: {
        instruction: "Rédigez une justification courte et factuelle (3-4 phrases) en français",
      },
    };

    const lang = langLabels[language] || langLabels.de;

    const answersText = Object.entries(answers)
      .map(([key, val]: [string, any]) => `${key}: ${val.label} (${val.value})`)
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Du bist ein PCI-DSS-Experte. Basierend auf den Antworten eines SAQ-Einstufungs-Checks und dem regelbasierten Ergebnis "${verdict}", ${lang.instruction}, warum dieser SAQ-Typ empfohlen wird. Beziehe dich auf konkrete PCI DSS v4.0 SAQ-Kriterien und die Kartenmarken-Regularien. Antworte nur mit dem Begründungstext, keine Überschrift.`,
            },
            {
              role: "user",
              content: `Ergebnis: ${verdict}\n\nAntworten:\n${answersText}`,
            },
          ],
          max_tokens: 1200,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen, bitte später erneut versuchen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service momentan nicht verfügbar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("[pci-reasoning] upstream error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reasoning = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pci-reasoning error:", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
