import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function logAiUsage(row: Record<string, unknown>) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const supabase = createClient(url, key);
    await supabase.from("ai_usage_logs").insert(row);
  } catch (e) {
    console.error("ai_usage_logs insert failed", e);
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 4;
const MAX_DAILY_REQUESTS = 80;

interface RateEntry { count: number; resetAt: number; }
const ipRateMap = new Map<string, RateEntry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function rateCheck(ip: string) {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) return { allowed: false, retryAfter: 3600 };
  const e = ipRateMap.get(ip);
  if (!e || now > e.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { allowed: true };
  }
  if (e.count >= MAX_REQUESTS_PER_WINDOW) return { allowed: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  e.count++; dailyCount++;
  return { allowed: true };
}

const SYSTEM_BASE = `Du planst Krisenstabsübungen (TTX) für deutsche Genossenschaftsbanken. Erstelle EINEN durchgehenden, kausal verknüpften Fall (keine Episodensammlung). Leitthema = Haupthandlungsstrang (3–4 Injects), Kernthema = Nebenstrang (1–2), Randthema = Seiteneffekt (1). Kontext: Kernbank beim zentralen IT-Dienstleister, BaFin/Bundesbank als Aufsicht, genossenschaftlicher Verbund, Filialgeschäft. Nur fiktive Namen (keine realen Firmen/Banken). Sprache: Deutsch, generisches Maskulinum. Antworte ausschließlich mit validem JSON gemäß Schema, ohne Markdown.`;

const SYSTEM_DORA = ` DORA-Meldepflichten aktiv: BaFin-Erstmeldung 4h nach Klassifizierung als schwerwiegender Vorfall (spätestens 24h nach Kenntnis), Zwischenbericht 72h, Abschluss 1 Monat. Zusätzlich DSGVO Art. 33 (72h) bei Personendaten.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateCheck(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte kurz warten." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) },
    });
  }

  try {
    const body = await req.json();
    const { bank, topics, dauer, injectCount, rollenumfang, difficulty, dora } = body ?? {};
    if (!bank || !Array.isArray(topics) || topics.length === 0 || !injectCount) {
      return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service nicht konfiguriert" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kompakte Bankzeile – nur gesetzte Felder
    const bankParts = [
      bank.name || "Volksbank Musterregion eG",
      bank.bilanzsumme && `Bilanz ${bank.bilanzsumme}`,
      bank.mitarbeiter && `${bank.mitarbeiter} MA`,
      bank.filialen && `${bank.filialen} Filialen`,
      bank.itDienstleister && `IT: ${bank.itDienstleister}`,
      bank.besonderheiten && `Bes.: ${bank.besonderheiten}`,
    ].filter(Boolean).join(" · ");

    const topicLines = topics.map((t: any) => `- ${t.name} [${t.weight}]`).join("\n");
    const rollen = rollenumfang === "kompakt"
      ? "6 Rollen: Leiter Krisenstab, Vorstand, IT-Leiter, ISB, Kommunikation, Protokoll"
      : "8 Rollen: Leiter Krisenstab, Vorstand, IT-Leiter, ISB, Kommunikation, DSB/Recht, Personal, Protokoll";

    const userPrompt = `Bank: ${bankParts}
Themen (Gewichtung):
${topicLines}
Dauer: ${dauer}. Genau ${injectCount} Injects (I-01…I-${String(injectCount).padStart(2,"0")}), chronologisch T+00 bis Ende, Uhrzeiten ab 08:15.
Rollen: ${rollen}. Jede Rolle mit szenariospezifischem Profil + Spannungsfeld.
Schwierigkeit: ${difficulty}.${dora ? " DORA-Fristen einbeziehen." : ""}

JSON-Schema (exakt diese Felder, keine weiteren):
{
 "uebungsname":"Übung <CODENAME>",
 "kurzbeschreibung":"5 Sätze",
 "groundTruth":{"bankProfil":"","angreiferOderUrsache":"","timeline":[{"zeitpunkt":"","ereignis":""}],"erschwernisse":[""]},
 "uebungsziele":["6 Ziele"],
 "ablaufplan":[{"zeit":"","abschnitt":"","inhalt":""}],
 "injects":[{"id":"I-01","zeitpunkt":"","phase":"","pflicht":true,"titel":"","themaTag":"","einspielkanal":"","inhalt":"3-6 Sätze wörtlich","erwarteteReaktion":"","regieanweisung":"","diskussionsimpulse":["3-5"],"rueckfragen":[{"frage":"","antwort":""}],"beobachtungsfokus":""}],
 "rollen":[{"name":"","profil":"","aufgaben":["4-6"],"spannungsfeld":""}],
 "meldepflichten":[{"adressat":"","frist":""}],
 "hotwashHinweise":["6-8 Lessons Learned"]
}`;

    const system = SYSTEM_BASE + (dora ? SYSTEM_DORA : "");
    const MODEL = "google/gemini-2.5-flash";
    // Preisannahme (USD pro 1M Tokens) für gemini-2.5-flash: Input 0.30, Output 2.50
    const PRICE_IN_PER_M = 0.30;
    const PRICE_OUT_PER_M = 2.50;

    const t0 = Date.now();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const durationMs = Date.now() - t0;

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text().catch(() => "");
      console.error(JSON.stringify({ evt: "ernstfall_ai_error", status, durationMs, model: MODEL, injectCount, dora: !!dora, err: errText.slice(0, 500) }));
      await logAiUsage({
        function_name: "ernstfall-generate",
        model: MODEL,
        status,
        duration_ms: durationMs,
        meta: { error: errText.slice(0, 500), injectCount, dora: !!dora, difficulty, rollenumfang, dauer, topics: Array.isArray(topics) ? topics.length : 0 },
      });
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Kurz warten." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte Workspace-Credits aufladen." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 403) return new Response(JSON.stringify({ error: "KI-Kontingent des Workspaces erreicht. Bitte Limit anheben oder Credits aufladen." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Generierung fehlgeschlagen" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const usage = data?.usage ?? {};
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? (promptTokens + completionTokens);
    const costUsd = (promptTokens / 1_000_000) * PRICE_IN_PER_M + (completionTokens / 1_000_000) * PRICE_OUT_PER_M;
    console.log(JSON.stringify({
      evt: "ernstfall_ai_usage",
      model: MODEL,
      durationMs,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd: Number(costUsd.toFixed(6)),
      injectCount,
      topics: Array.isArray(topics) ? topics.length : 0,
      dora: !!dora,
      difficulty,
      rollenumfang,
      dauer,
    }));
    await logAiUsage({
      function_name: "ernstfall-generate",
      model: MODEL,
      status: 200,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: Number(costUsd.toFixed(6)),
      duration_ms: durationMs,
      meta: { injectCount, dora: !!dora, difficulty, rollenumfang, dauer, topics: Array.isArray(topics) ? topics.length : 0 },
    });
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = null; } }
    }
    if (!parsed || !parsed.injects) {
      return new Response(JSON.stringify({ error: "Antwort konnte nicht geparst werden. Bitte erneut versuchen." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ exercise: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ernstfall-generate error", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
