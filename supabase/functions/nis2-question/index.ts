import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_DAILY_REQUESTS = 500;

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

const SYSTEM_PROMPT = `Du erzeugst Experten-Quizfragen für ein NIS-2 Awareness Quiz im „Wer wird Millionär?"-Stil.

Zielgruppe: ISMS-Verantwortliche, CISOs, Compliance-Manager und Geschäftsleitungen.

WICHTIG:
- Gib ausschließlich gültiges JSON zurück. Keine Erklärtexte, kein Markdown.
- Erzeuge genau 1 Frage pro Aufruf.
- Genau 4 Antwortoptionen (A, B, C, D).
- Genau 1 Option ist eindeutig korrekt.
- Die korrekte Antwort MUSS als Index (0-3) im Feld "correct" angegeben werden.
- Die Optionen MÜSSEN als Array von 4 Strings zurückgegeben werden.
- Vermeide „kommt drauf an"-Antworten. Wenn Kontext nötig ist, liefere ihn in der Frage.
- Bevor du ausgibst, führe einen Selbstcheck durch:
  (1) Ist genau 1 Antwort korrekt?
  (2) Sind die falschen Optionen plausibel, aber klar falsch?
  (3) Ist die Begründung knapp und fachlich korrekt?
  Wenn ein Check fehlschlägt, generiere die Frage neu.
- Verwende formale Ansprache (Siezen).

SCHWIERIGKEITSGRADE (1-10):
- 1-2: Grundlagen – Was ist NIS-2? Wer ist betroffen? Grundlegende Meldepflichten.
- 3-4: Anwendungswissen – Konkrete Szenarien, Fristen, Zuständigkeiten, Scope-Abgrenzung.
- 5-6: Fortgeschritten – Lieferketten, Outsourcing-Verantwortung, Zusammenspiel mit ISO 27001/TISAX.
- 7-8: Experte – Grenzfälle, Governance-Strukturen, OT/IT-Konvergenz, grenzüberschreitende Szenarien.
- 9-10: CISO-Level – Strategische Entscheidungen unter Druck, Haftungsfragen, regulatorische Grauzonen, Tabletop-Szenarien mit mehreren Stakeholdern.

THEMEN (wähle passend zur Schwierigkeit):
NIS-2 Scope & Anwendungsbereich, Meldepflichten (24h/72h/1 Monat), Persönliche Leitungshaftung,
Risikomanagement Art. 21, Lieferkettensicherheit, Aufsichtsregime, Krisenmanagement/BCM,
Zusammenspiel NIS-2/ISO 27001/TISAX/DORA, OT-Sicherheit, Schulungspflichten

AUSGABEFORMAT (JSON):
{
  "question": "...",
  "options": ["A ...", "B ...", "C ...", "D ..."],
  "correct": 0,
  "explanation": "..."
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
    const difficulty = Math.min(10, Math.max(1, body?.difficulty || 5));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langMap: Record<string, string> = { de: "Deutsch", en: "English", fr: "Français" };
    const langInstruction = `Sprache: ${langMap[language] || "Deutsch"}`;
    const diffInstruction = `Schwierigkeitsgrad: ${difficulty}/10`;

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
            { role: "user", content: `${langInstruction}\n${diffInstruction}\n\nErzeuge jetzt 1 Frage.` },
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
      console.error("[nis2-question] upstream error:", response.status, t);
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
      console.error("[nis2-question] JSON parse error:", content);
      return new Response(
        JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate response structure
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4 || typeof parsed.correct !== 'number' || !parsed.explanation) {
      console.error("[nis2-question] Invalid structure:", JSON.stringify(parsed));
      return new Response(
        JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nis2-question error:", e);
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
