import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting
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

const SYSTEM_PROMPT = `Du erzeugst Experten-Quizfragen für ein Website-Spiel („ThreatDrop").

Zielgruppe: ISMS- und Cybersecurity-Experten sowie potenzielle Kunden.

Stil: präzise, realistische Enterprise-Szenarien, keine Einsteigerfragen.

WICHTIG:
- Gib ausschließlich gültiges JSON zurück. Keine Erklärtexte, kein Markdown.
- Erzeuge genau 1 Frage pro Aufruf.
- Genau 4 Antwortoptionen.
- Genau 1 Option ist eindeutig korrekt.
- Vermeide „kommt drauf an"-Antworten. Wenn Kontext nötig ist, liefere ihn im Feld context.
- Das Niveau muss vergleichbar mit SOC Lead / ISMS Lead / CISO hands-on sein.
- Bevor du ausgibst, führe einen Selbstcheck durch:
  (1) Ist genau 1 Antwort korrekt?
  (2) Sind die falschen Optionen plausibel, aber klar falsch?
  (3) Ist die Begründung knapp und fachlich korrekt?
  Wenn ein Check fehlschlägt, generiere die Frage neu.

THEMENKATALOG (wähle 1–2 Tags je Frage):
IAM/Active Directory, Azure/M365, SIEM/SOC Detection, Incident Response, Forensics,
BCM/DR/ISCP, Third Party/Supplier Risk, DORA, NIS2, ISO27001

AUSGABEFORMAT (JSON):
{
  "id": "TD-####",
  "threat_title": "...",
  "context": "...",
  "options": ["A ...", "B ...", "C ...", "D ..."],
  "correct": 0,
  "rationale": "...",
  "domain_tags": ["...","..."],
  "difficulty": 4,
  "primary_skill": "Detection|IR|Governance|Risk|BCM",
  "confidence": 0.0
}

Erzeuge jetzt 1 Frage. Die Sprache der Frage MUSS der folgenden Sprachvorgabe entsprechen.`;

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
      JSON.stringify({ error: "Too many requests, please wait." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  try {
    const body = await req.json();
    const language = body?.language || "de";
    const usedIds = body?.usedIds || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langMap: Record<string, string> = { de: "Deutsch", en: "English", fr: "Français" };
    const langInstruction = `Sprache: ${langMap[language] || "Deutsch"}`;
    const avoidInstruction = usedIds.length > 0
      ? `\nVermeide folgende bereits verwendete IDs: ${usedIds.join(", ")}`
      : "";

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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${langInstruction}${avoidInstruction}\n\nErzeuge jetzt 1 Frage.` },
          ],
          max_tokens: 1200,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("[threatdrop-question] upstream error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[threatdrop-question] JSON parse error:", content);
      return new Response(
        JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("threatdrop-question error:", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
