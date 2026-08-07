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

const SYSTEM = `Du bist erfahrener Business-Continuity-Manager und formulierst BCM-Dokumente für einen Fachbereich (Leitlinie, Business Impact Analyse, Notfallplan/BCP, Tabletop-Drehbuch). Referenzen: ISO 22301, BSI-Standard 200-4, gängige Aufsichtsanforderungen.

BEGRIFFE (strikt, keine Ausnahme):
- Schadensstufen der BIA heißen S1 (gering), S2 (spürbar), S3 (erheblich), S4 (existenzbedrohend). Immer mit Präfix S schreiben, niemals nur "Stufe 3".
- Aktivierungsstufen des Notfallplans heißen A1 (Störung), A2 (Notfall), A3 (Krise). Immer mit Präfix A schreiben.
- Vermische die beiden Skalen nie und leite keine Aktivierungsstufe aus einer Schadensstufe ab. Eine Ausfalldauer hat genau eine Schadensstufe je Kategorie (aus dem Input) und genau eine Aktivierungsstufe (aus dem Abschnitt Aktivierungsstufen).
- MTPD ist ein einziger Wert je Prozess. Nenne keine abweichenden Ausfallgrenzen und rechne keine Zwischenwerte aus.

DATENINTEGRITÄT (strikt, oberste Regel):
- Du erfindest KEINE Kennzahlen. MTPD, RTO, RPO, Schadensstufen, Prioritäten und Zeitgrenzen sind im Input bereits regelbasiert berechnet. Du übernimmst sie wörtlich und begründest sie fachlich.
- Du erfindest keine Systeme, Personen, Dienstleister, Standorte oder Vorfälle. Verwende nur, was im Input steht.
- Fehlt eine Information, schreibe "Noch offen – vom Fachbereich zu ergänzen." Keine Platzhalter wie xxx oder yyy.

STIL:
- Deutsch, sachlich, unpersönlich, Aktiv. Keine Werbesprache, keine Floskeln, keine Anrede des Lesers.
- Der Adressat ist Fachexperte, aber kein BCM-Experte: erkläre Fachbegriffe beim ersten Auftreten in einem Halbsatz.
- Vollständige Sätze in Prosafeldern, keine Stichpunktfragmente. Listenfelder dagegen knapp und handlungsorientiert (Verb am Anfang).
- Aussagen müssen prüfbar sein: benenne Auslöser, Verantwortlichen und Zeitbezug, wenn der Input sie hergibt.

Antworte AUSSCHLIESSLICH mit validem JSON gemäß Schema. Kein Markdown, keine Codefences, kein Prosa-Präfix.`;

const MODEL = "google/gemini-2.5-flash";
const PRICE_IN_PER_M = 0.30;
const PRICE_OUT_PER_M = 2.50;

async function callGateway(user: string, key: string, maxTokens = 8000, temperature?: number) {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
  };
  if (typeof temperature === "number") body.temperature = temperature;
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function tryParse(content: string): any | null {
  try { return JSON.parse(content); } catch { /* fallthrough */ }
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  return null;
}

const s = (v: unknown, max = 1200) => (typeof v === "string" ? v.slice(0, max) : "");

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
    const profile = body?.profile;
    const processes = body?.processes;
    const team = Array.isArray(body?.team) ? body.team.slice(0, 12) : [];
    const exercise = body?.exercise ?? {};
    const derived = Array.isArray(body?.derived) ? body.derived.slice(0, 12) : [];

    if (!profile || typeof profile !== "object" || !Array.isArray(processes) || processes.length === 0 || processes.length > 12) {
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

    const profileBlock = [
      `Organisation: ${s(profile.organisation, 200) || "Noch offen"}`,
      `Fachbereich: ${s(profile.area, 200) || "Noch offen"}`,
      `Verantwortlicher: ${s(profile.owner, 120)} (${s(profile.ownerFunction, 120)})`,
      `BC-Koordinator: ${s(profile.coordinator, 120)}`,
      `Standorte: ${s(profile.sites, 300)}`,
      `Branche: ${s(profile.sector, 200)}`,
      `Rahmenwerke: ${Array.isArray(profile.regulatory) ? profile.regulatory.slice(0, 10).map((r: unknown) => s(r, 60)).join(", ") : ""}`,
      `Besonderheiten: ${s(profile.particularities, 800)}`,
      `Alarmierungsweg: ${s(profile.alarmChannel, 300)}`,
      `Anbindung Krisenmanagement: ${s(profile.crisisTeamRef, 300)}`,
    ].join("\n");

    const processBlocks = processes.map((p: any, i: number) => {
      const d = derived[i] ?? {};
      const res = Array.isArray(p.resources) ? p.resources.slice(0, 20) : [];
      const wa = Array.isArray(p.workarounds) ? p.workarounds.slice(0, 10) : [];
      return `### ${s(p.id, 12)} – ${s(p.name, 200)}
Beschreibung: ${s(p.description, 1200)}
Betriebszeiten: ${s(p.operatingHours, 200)}
Leistungsempfänger: ${s(p.recipients, 400)}
BEREITS BERECHNET (wörtlich übernehmen, nicht verändern):
  MTPD: ${d.mtpdLabel ?? "nicht erreicht im Betrachtungszeitraum"} (${d.mtpdHours ?? "-"} Std.)
  Priorität: ${s(d.priority, 80)}
  RTO: ${s(String(p.rtoHours ?? ""), 20)} Std.
  RPO: ${s(String(p.rpoHours ?? ""), 20)} Std.
  Höchste Schadensstufe je Horizont: ${s(d.curve, 300)}
  Vollständige Bewertung je Kategorie: ${s(d.curveDetail, 1200)}
  Treibende Schadenskategorien am MTPD-Horizont: ${s(d.drivers, 400)}
Mindest-Notbetrieb: ${s(p.minimumService, 800)}
Vitale Ressourcen:
${res.map((r: any) => `  - [${s(r.kind, 40)}] ${s(r.description, 300)} | Kritikalität ${s(r.criticality, 20)}${r.singlePointOfFailure ? " | SINGLE POINT OF FAILURE" : ""}`).join("\n") || "  - keine erfasst"}
Notbetriebsverfahren:
${wa.map((w: any) => `  - Szenario "${s(w.scenario, 200)}": ${s(w.procedure, 600)} | trägt ${s(String(w.limitHours ?? ""), 20)} Std.`).join("\n") || "  - keine erfasst"}`;
    }).join("\n\n");

    const activation = Array.isArray(body?.activation) ? body.activation.slice(0, 3) : [];
    const activationBlock = activation
      .map((a: any) => `- ${s(a.stufe, 60)} | Auslösekriterium: ${s(a.kriterium, 400)} | Reaktion: ${s(a.reaktion, 400)}`)
      .join("\n");

    const teamBlock = team.map((t: any) => `- ${s(t.role, 80)}: ${s(t.primary, 120) || "Noch offen"} (Vertretung: ${s(t.deputy, 120) || "Noch offen"})`).join("\n");

    const injectCount = Math.min(Math.max(Number(exercise.injectCount) || 6, 4), 10);

    const userPrompt = `AUFGABE: Formuliere die BCM-Dokumente für diesen Fachbereich aus.

## Bereichsprofil
${profileBlock}

## Prozesse
${processBlocks}

## Aktivierungsstufen (regelbasiert vorgegeben – wörtlich übernehmen, keine eigenen Zeitgrenzen)
${activationBlock || "- Noch offen"}

## Notfallteam des Bereichs
${teamBlock || "- Noch offen"}

## Tabletop-Übung
Dauer: ${s(exercise.duration, 40)} | Szenario: ${s(exercise.scenario, 600)} | Teilnehmer: ${s(exercise.participants, 400)} | Übungsleitung: ${s(exercise.facilitator, 200) || "Noch offen"} | Erfahrungsstand: ${s(exercise.level, 40)} | Genau ${injectCount} Injects, chronologisch mit T+-Zeitstempeln.

## Zusätzliche Anforderungen
- Die BIA-Begründungen müssen sich auf die oben genannten Schadenskategorien und den Schadensverlauf stützen, nicht allgemein argumentieren.
- Die Aktivierungsstufen A1 bis A3 sind oben vorgegeben. Übernimm Bezeichnung und Auslösekriterium wörtlich und formuliere nur die Reaktion aus. Erfinde keine weiteren Stufen und keine anderen Stundenwerte.
- Das Tabletop-Szenario muss genau die vitalen Ressourcen und Notbetriebsverfahren dieses Bereichs treffen und mindestens einen erfassten Single Point of Failure adressieren, falls vorhanden.
- Jeder Inject nennt eine konkrete Entscheidung, die das Team treffen muss.

## JSON-Schema (exakt diese Felder)
{
 "managementSummary": "6-8 Sätze: Auftrag, zeitkritische Prozesse, wesentliche Abhängigkeiten, offene Punkte",
 "leitlinie": {
   "zweck": "3-5 Sätze",
   "zielsetzung": ["5-6 Ziele"],
   "geltungsbereich": "3-4 Sätze, konkret auf Bereich, Standorte und Prozesse bezogen",
   "rahmen": [{"rahmenwerk": "", "relevanz": "1-2 Sätze"}],
   "grundsaetze": [{"titel": "", "text": "2-3 Sätze"}],
   "rollen": [{"rolle": "", "verantwortung": "1-2 Sätze"}],
   "lebenszyklus": [{"schritt": "", "mindestanforderung": ""}],
   "kennzahlen": ["4-6 überprüfbare Kennzahlen mit Zielwert oder Turnus"]
 },
 "bia": [{"processId": "P-01", "interpretation": "4-6 Sätze zum Schadensverlauf", "mtpdBegruendung": "", "rtoBegruendung": "", "rpoBegruendung": "", "ergebnis": "3-4 Sätze Gesamturteil", "handlungsbedarf": ["3-5 konkrete Maßnahmen, je mit Verantwortlichkeit"]}],
 "bcp": {
   "zweck": "3-4 Sätze",
   "aktivierung": [{"stufe": "A1 – Störung", "kriterium": "wörtlich aus der Vorgabe", "reaktion": "2-3 Sätze, konkrete Handlungen und Verantwortliche"}],
   "alarmierung": "3-4 Sätze",
   "sofortmassnahmen": ["6-8 Schritte in Reihenfolge der ersten 60 Minuten"],
   "notbetriebHinweis": "2-3 Sätze zur Nutzung der Notbetriebsverfahren",
   "wiederanlauf": ["5-7 Schritte Rückkehr in den Normalbetrieb inkl. Nacherfassung"],
   "schnittstellen": ["4-6 Schnittstellen zu IT, Krisenstab, Kommunikation, Dienstleistern"]
 },
 "tabletop": {
   "lernziele": ["4-5 überprüfbare Lernziele"],
   "spielregeln": ["4-6 Regeln"],
   "ausgangslage": "5-7 Sätze Lagebild zum Übungsbeginn",
   "injects": [{"zeit": "T+0:10", "inject": "3-5 Sätze wörtlich vorlesbar", "erwarteteReaktion": ""}],
   "hotwashFragen": ["6-8 Fragen"],
   "beobachtungskriterien": ["5-6 Kriterien"],
   "nachbereitung": ["4-6 Schritte inkl. Fristen relativ zum Übungstag"]
 }
}
Für jeden Prozess genau ein bia-Eintrag mit passender processId. Für jedes gewählte Rahmenwerk genau ein rahmen-Eintrag. Genau drei Aktivierungseinträge in der Reihenfolge A1, A2, A3.`;

    const t0 = Date.now();
    let response: Response;
    try {
      response = await callGateway(userPrompt, LOVABLE_API_KEY);
    } catch (e) {
      console.error("gateway fetch failed", e);
      return new Response(JSON.stringify({ error: "KI-Gateway nicht erreichbar" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const durationMs = Date.now() - t0;

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text().catch(() => "");
      console.error(JSON.stringify({ evt: "notnagel_ai_error", status, durationMs, model: MODEL, err: errText.slice(0, 500) }));
      await logAiUsage({
        function_name: "notnagel-generate",
        model: MODEL,
        status,
        duration_ms: durationMs,
        meta: { error: errText.slice(0, 500), processes: processes.length },
      });
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Bitte kurz warten." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402 || status === 403) return new Response(JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte Credits aufladen." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Generierung fehlgeschlagen" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const usage = data?.usage ?? {};
    let promptTokens = usage.prompt_tokens ?? 0;
    let completionTokens = usage.completion_tokens ?? 0;
    let content: string = data.choices?.[0]?.message?.content || "{}";
    let parsed = tryParse(content);
    let retried = false;

    if (!parsed || !parsed.bia || !parsed.bcp) {
      retried = true;
      console.warn("notnagel_ai parse_failed, retrying once");
      try {
        const r2 = await callGateway(
          userPrompt + `\n\nDie vorherige Antwort war kein valides JSON. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, das mit "{" beginnt und mit "}" endet.`,
          LOVABLE_API_KEY,
          8000,
          0.2,
        );
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
    await logAiUsage({
      function_name: "notnagel-generate",
      model: MODEL,
      status: 200,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: Number(costUsd.toFixed(6)),
      duration_ms: durationMs,
      meta: { processes: processes.length, injectCount, retried, responseBytes: content.length },
    });

    if (!parsed || !parsed.bia || !parsed.bcp) {
      return new Response(JSON.stringify({ error: "Antwort konnte nicht geparst werden. Bitte erneut versuchen." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notnagel-generate error", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
