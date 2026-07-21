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

const SYSTEM_BASE = `Du planst Krisenstabsübungen (TTX) für deutsche Genossenschaftsbanken. Erstelle EINEN durchgehenden, kausal verknüpften Fall (keine Episodensammlung).

Regeln (strikt):
- Kausalität: Jeder Inject (außer I-01) hat einen konkreten Vorgänger (Inject-ID oder Timeline-Ereignis) im Feld "abhaengigVon". Kein Inject ohne Ursache.
- Rollenverteilung der Themen: Leitthema = Haupthandlungsstrang (3–4 Injects), Kernthema = Nebenstrang (1–2), Randthema = Seiteneffekt (1).
- Ground Truth: "timeline" enthält mindestens (Injects + 2) Ereignisse; jede in Injects erwähnte Person, System oder Meldung MUSS in bankProfil oder timeline vorkommen. Keine Neu-Erfindungen im Inject-Text.
- Klassifizierungszeitpunkt ("klassifizierungsZeitpunkt", Format HH:MM) markiert, wann der Vorfall als schwerwiegend klassifiziert wurde. Meldepflichten-Fristen beziehen sich auf diesen Zeitpunkt und werden als konkrete Uhrzeit ODER "T+<Stunden>h" angegeben, nicht generisch.
- Rückfragen: Jede Antwort verweist auf ein Timeline-Fakt ODER lautet "Nicht bekannt – bitte als Annahme führen." Nichts erfinden.
- Rollen-Spannungsfeld: IMMER als Konflikt zwischen zwei benannten Zielen (z. B. "schnelle Wiederaufnahme vs. forensische Beweissicherung"), nie Charakterbeschreibung.
- Anti-Wiederholung: Diskussionsimpulse und Rückfragen dürfen inhaltlich zwischen Injects NICHT doppeln.
- Einspielkanal-Diversität: Kanäle über die Injects streuen (Telefon, E-Mail, Ticket, Mitarbeiter-Meldung, Medienanfrage, Aufsichtsschreiben, Chat) – nie 3× hintereinander derselbe Kanal.
- Kontext: Kernbank beim zentralen IT-Dienstleister, BaFin/Bundesbank als Aufsicht, genossenschaftlicher Verbund, Filialgeschäft.
- Nur fiktive Namen (keine realen Firmen/Banken). Sprache: Deutsch, generisches Maskulinum.

Antworte AUSSCHLIESSLICH mit validem JSON gemäß Schema. Kein Markdown, kein Prosa-Präfix.`;

const SYSTEM_DORA = ` DORA-Meldepflichten aktiv: BaFin-Erstmeldung 4h nach Klassifizierung als schwerwiegender Vorfall (spätestens 24h nach Kenntnis), Zwischenbericht 72h, Abschluss 1 Monat. Zusätzlich DSGVO Art. 33 (72h) bei Personendaten. Berechne konkrete Uhrzeiten aus klassifizierungsZeitpunkt.`;

const MODEL = "google/gemini-2.5-flash";
const PRICE_IN_PER_M = 0.30;
const PRICE_OUT_PER_M = 2.50;

async function callGateway(system: string, userPrompt: string, key: string, signal?: AbortSignal, maxTokens = 5500, temperature?: number) {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
  };
  if (typeof temperature === "number") body.temperature = temperature;
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

function tryParse(content: string): any | null {
  try { return JSON.parse(content); } catch {}
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

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
Rollen: ${rollen}. Jede Rolle mit szenariospezifischem Profil + Spannungsfeld (zwei konkurrierende Ziele).
Schwierigkeit: ${difficulty}.${dora ? " DORA-Fristen einbeziehen (konkrete Uhrzeiten aus klassifizierungsZeitpunkt)." : ""}

JSON-Schema (exakt diese Felder):
{
 "uebungsname":"Übung <CODENAME>",
 "kurzbeschreibung":"5 Sätze",
 "groundTruth":{
   "bankProfil":"",
   "angreiferOderUrsache":"",
   "klassifizierungsZeitpunkt":"HH:MM",
   "timeline":[{"zeitpunkt":"","ereignis":""}],
   "erschwernisse":[""]
 },
 "uebungsziele":["6 Ziele"],
 "ablaufplan":[{"zeit":"","abschnitt":"","inhalt":""}],
 "injects":[{"id":"I-01","zeitpunkt":"","phase":"","pflicht":true,"titel":"","themaTag":"","einspielkanal":"","abhaengigVon":"Timeline/I-XX oder leer bei I-01","inhalt":"3-6 Sätze wörtlich","erwarteteReaktion":"","regieanweisung":"","diskussionsimpulse":["3-5"],"rueckfragen":[{"frage":"","antwort":""}],"beobachtungsfokus":""}],
 "rollen":[{"name":"","profil":"","aufgaben":["4-6"],"spannungsfeld":"Ziel A vs. Ziel B"}],
 "meldepflichten":[{"adressat":"","frist":"T+4h / konkrete Uhrzeit"}],
 "hotwashHinweise":["6-8 Lessons Learned"]
}`;

    const system = SYSTEM_BASE + (dora ? SYSTEM_DORA : "");

    const t0 = Date.now();
    let response: Response;
    try {
      response = await callGateway(system, userPrompt, LOVABLE_API_KEY);
    } catch (e) {
      console.error("gateway fetch failed", e);
      return new Response(JSON.stringify({ error: "KI-Gateway nicht erreichbar" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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
    let promptTokens = usage.prompt_tokens ?? 0;
    let completionTokens = usage.completion_tokens ?? 0;
    let content: string = data.choices?.[0]?.message?.content || "{}";
    let parsed = tryParse(content);
    let retried = false;

    // Parse-Retry bei kaputtem JSON
    if (!parsed || !parsed.injects) {
      retried = true;
      console.warn("ernstfall_ai parse_failed, retrying once");
      const retryPrompt = userPrompt + `\n\nDie vorherige Antwort war kein valides JSON. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, das mit "{" beginnt und mit "}" endet. Keine Codefences, kein Prosa-Präfix.`;
      try {
        const r2 = await callGateway(system, retryPrompt, LOVABLE_API_KEY, undefined, 5500, 0.2);
        if (r2.ok) {
          const d2 = await r2.json();
          const u2 = d2?.usage ?? {};
          promptTokens += u2.prompt_tokens ?? 0;
          completionTokens += u2.completion_tokens ?? 0;
          content = d2.choices?.[0]?.message?.content || "{}";
          parsed = tryParse(content);
        }
      } catch (e) {
        console.error("retry failed", e);
      }
    }

    const totalTokens = promptTokens + completionTokens;
    const costUsd = (promptTokens / 1_000_000) * PRICE_IN_PER_M + (completionTokens / 1_000_000) * PRICE_OUT_PER_M;
    const responseBytes = content.length;
    console.log(JSON.stringify({
      evt: "ernstfall_ai_usage",
      model: MODEL,
      durationMs,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd: Number(costUsd.toFixed(6)),
      responseBytes,
      retried,
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
      meta: { injectCount, dora: !!dora, difficulty, rollenumfang, dauer, topics: Array.isArray(topics) ? topics.length : 0, responseBytes, retried },
    });

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
