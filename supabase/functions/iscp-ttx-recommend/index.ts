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

// ─── INPUT VALIDATION ────────────────────────────────────────────
function validateRequest(body: any): string | null {
  const { iscps, language } = body;
  if (!Array.isArray(iscps)) return "iscps must be an array";
  if (iscps.length === 0 || iscps.length > 30) return "iscps must have 1-30 entries";
  for (const item of iscps) {
    if (!item || typeof item !== "object") return "Each ISCP must be an object";
    if (typeof item.name !== "string" || item.name.length > 200) return "Invalid ISCP name";
    if (item.factors && typeof item.factors !== "object") return "Invalid factors";
  }
  if (language !== undefined && (typeof language !== "string" || language.length > 5)) {
    return "Invalid language";
  }
  return null;
}

// ─── HANDLER ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { iscps, language = "de" } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const iscpSummary = iscps
      .map((i: any) => `- ${String(i.name).slice(0, 200)}: Score ${i.score}, Maturity Level ${i.maturityLevel}, Letzter Test: ${i.lastTested}, Faktoren: BI=${i.factors?.BI} TLT=${i.factors?.TLT} CP=${i.factors?.CP} AF=${i.factors?.AF} PI=${i.factors?.PI}`)
      .join("\n");

    const langMap: Record<string, string> = {
      de: "Antworte strukturiert auf Deutsch.",
      en: "Answer in structured English.",
      fr: "Réponds de manière structurée en français.",
    };

    const systemPrompt = `Du bist ein erfahrener Cybersecurity-Berater für Tabletop Exercises (TTX).
Analysiere die ISCP-Scores und antworte KURZ und PRÄGNANT:

1. **Priorisierung** — Liste die ISCPs nach Dringlichkeit. Pro ISCP maximal 5 Wörter Begründung.
2. **Szenario-Vorschlag** — Ein realistisches Angriffsszenario in 3–4 Sätzen, das die kritischsten ISCPs abdeckt.

Keine langen Erklärungen. Keine Maturity-Level-Analyse. Verwende • als Aufzählungszeichen, KEINE * oder - Bullets.
${langMap[language] || langMap.de}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hier sind die aktuellen ISCP-Daten:\n\n${iscpSummary}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "Keine Empfehlung generiert.";

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("iscp-ttx-recommend error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
