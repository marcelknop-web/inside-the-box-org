import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const SYSTEM = `Du bist ein erfahrener Übungsplaner für Krisenstabsübungen (Tabletop Exercises) in deutschen Genossenschaftsbanken. Du konstruierst aus den gewählten Themen EINEN durchgehenden, chronologisch schlüssigen Fall – keine Episodensammlung. Themen mit Gewichtung HOCH bilden den Haupthandlungsstrang (3–4 Injects), MITTEL Nebenstränge (1–2 Injects), NIEDRIG einzelne Seiteneffekte (1 Inject). Alle Stränge müssen kausal verknüpft sein (z. B. Phishing → Dienstleisterkompromittierung → Zahlungsverkehrsstörung). Der Fall muss für eine Genossenschaftsbank plausibel sein: Kernbankverfahren beim zentralen IT-Dienstleister, BaFin und Deutsche Bundesbank als Aufsicht, genossenschaftlicher Verbund, Filialgeschäft. Verwende ausschließlich fiktive Namen für Dienstleister, Angreifer und Personen – keine realen Firmen (nicht Atruvia, nicht real existierende Banken). Bei aktivierten DORA-Meldepflichten: Erstmeldung an die BaFin 4 Stunden nach Klassifizierung als schwerwiegender Vorfall, spätestens 24 Stunden nach Kenntnis; Zwischenbericht 72 Stunden; Abschlussbericht 1 Monat. Zusätzlich DSGVO Art. 33 (72 h) bei Personendatenbezug. Sprache: Deutsch, generisches Maskulinum, keine gegenderte Sprache. Antworte ausschließlich mit validem JSON gemäß Schema, ohne Markdown.`;

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

    const bankLine = `${bank.name || "Volksbank Musterregion eG"} · Bilanzsumme ${bank.bilanzsumme || "n/a"} · ${bank.mitarbeiter || "n/a"} Mitarbeiter · ${bank.filialen || "n/a"} Filialen · IT-Dienstleister: ${bank.itDienstleister || "genoDATA eG (fiktiv)"} · Besonderheiten: ${bank.besonderheiten || "keine"}`;
    const topicLines = topics.map((t: any) => `- ${t.name} (Gewichtung: ${t.weight})`).join("\n");
    const rollen = rollenumfang === "kompakt"
      ? "6 Rollen: Leiter Krisenstab, Vorstand, IT-Leiter, Informationssicherheitsbeauftragter, Kommunikation, Protokollführer"
      : "8 Rollen: Leiter Krisenstab, Vorstand, IT-Leiter, Informationssicherheitsbeauftragter, Kommunikation, Datenschutzbeauftragter/Recht, Personal, Protokollführer";

    const userPrompt = `Erstelle EINE Krisenstabsübung.

Bankprofil: ${bankLine}
Themen mit Gewichtung:
${topicLines}
Dauer: ${dauer} (genau ${injectCount} Injects, IDs I-01 bis I-${String(injectCount).padStart(2,"0")}, chronologisch von T+00 bis Ende, realistische Uhrzeiten ab 08:15).
Rollen: ${rollen}. Jede Rolle mit szenariospezifischem Profil und Spannungsfeld.
Schwierigkeitsgrad: ${difficulty}.
DORA-Meldepflichten: ${dora ? "AKTIVIERT – BaFin/Bundesbank Fristen 4h/24h/72h/1M einbeziehen" : "nicht relevant"}.

Antworte ausschließlich mit JSON in exakt diesem Schema:
{
  "uebungsname": "Übung <CODENAME>",
  "kurzbeschreibung": "5 Sätze Storyline",
  "groundTruth": { "bankProfil": "string", "angreiferOderUrsache": "string", "timeline": [{"zeitpunkt":"string","ereignis":"string"}], "erschwernisse": ["string"] },
  "uebungsziele": ["6 Ziele"],
  "ablaufplan": [{"zeit":"string","abschnitt":"string","inhalt":"string"}],
  "injects": [{"id":"I-01","zeitpunkt":"T+00 (08:15 Uhr)","phase":"string","pflicht":true,"titel":"string","themaTag":"string","einspielkanal":"string","inhalt":"3-6 Sätze wörtlich ausspielbar","erwarteteReaktion":"string","regieanweisung":"string","diskussionsimpulse":["3-5 Impulse"],"rueckfragen":[{"frage":"string","antwort":"string"}],"beobachtungsfokus":"string"}],
  "rollen": [{"name":"string","profil":"string","aufgaben":["4-6 Aufgaben"],"spannungsfeld":"string"}],
  "meldepflichten": [{"adressat":"string","frist":"string"}],
  "hotwashHinweise": ["6-8 erwartbare Lessons Learned"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text().catch(() => "");
      console.error("ernstfall AI error", status, errText);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit. Kurz warten." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Generierung fehlgeschlagen" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
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
