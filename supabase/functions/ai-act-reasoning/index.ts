import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    dailyCount++; return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  entry.count++; dailyCount++;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateMap) if (now > entry.resetAt) ipRateMap.delete(ip);
}, 300_000);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const rl = getRateLimitResult(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Zu viele Anfragen, bitte warte einen Moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } });
  }

  try {
    const body = await req.json();
    const { intake, classification, language } = body;

    if (!intake || typeof intake !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request: intake must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof classification !== "string" || classification.length > 30) {
      return new Response(JSON.stringify({ error: "Invalid classification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (language !== undefined && (typeof language !== "string" || language.length > 5)) {
      return new Response(JSON.stringify({ error: "Invalid language" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const langLabels: Record<string, Record<string, string>> = {
      de: { prohibited: "Verbotene Praxis (Art. 5)", highRisk: "Hochrisiko-System (Art. 6 + Anhang III)", gpaiSystemic: "GPAI mit systemischem Risiko (Art. 55)", gpai: "GPAI-Modell (Art. 53)", limited: "Begrenztes Risiko (Art. 50)", minimal: "Minimales Risiko",
              instruction: "Schreibe eine kurze, prägnante Begründung (3-5 Sätze) auf Deutsch" },
      en: { prohibited: "Prohibited practice (Art. 5)", highRisk: "High-risk system (Art. 6 + Annex III)", gpaiSystemic: "GPAI with systemic risk (Art. 55)", gpai: "GPAI model (Art. 53)", limited: "Limited risk (Art. 50)", minimal: "Minimal risk",
              instruction: "Write a short, concise reasoning (3-5 sentences) in English" },
      fr: { prohibited: "Pratique interdite (Art. 5)", highRisk: "Système à haut risque (Art. 6 + Annexe III)", gpaiSystemic: "GPAI à risque systémique (Art. 55)", gpai: "Modèle GPAI (Art. 53)", limited: "Risque limité (Art. 50)", minimal: "Risque minimal",
              instruction: "Rédigez une justification courte et concise (3-5 phrases) en français" },
    };
    const lang = langLabels[language] || langLabels.de;
    const classLabel = lang[classification] || classification;

    const intakeText = [
      `System: ${String(intake.systemName || '').slice(0, 200)}`,
      `Zweck: ${String(intake.systemPurpose || '').slice(0, 500)}`,
      `Domäne: ${String(intake.domain || '').slice(0, 200)}`,
      `Rolle: ${Array.isArray(intake.role) ? intake.role.join(', ') : ''}`,
      `Anhang III: ${Array.isArray(intake.annexIII) ? intake.annexIII.join(', ') : ''}`,
      `Verbotene Indikatoren: ${Array.isArray(intake.prohibitedFlags) ? intake.prohibitedFlags.join(', ') : ''}`,
      `GPAI: ${intake.isGpai ? 'ja' : 'nein'}, FLOPS≥10^25: ${intake.flopsThreshold ? 'ja' : 'nein'}`,
      `Echtzeit-Biometrie öffentlich: ${intake.realtimeBiometricsPublic ? 'ja' : 'nein'}`,
    ].join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `Du bist ein EU-AI-Act-Regulierungsexperte. Basierend auf den Intake-Daten und der Klassifizierung, ${lang.instruction}, warum das System als "${classLabel}" eingestuft wird. Beziehe dich auf konkrete Artikel des AI Act (Verordnung (EU) 2024/1689). Antworte nur mit dem Begründungstext, keine Überschrift.` },
          { role: "user", content: `Klassifizierung: ${classLabel}\n\nIntake:\n${intakeText}` },
        ],
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Service momentan nicht verfügbar." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("[ai-act-reasoning] upstream error:", response.status);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const reasoning = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ reasoning }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-act-reasoning error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
