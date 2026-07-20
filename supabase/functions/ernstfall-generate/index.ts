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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
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
      if (status === 402) return new Response(JSON.stringify({ error: "KI-Kontingent erschöpft. Bitte Workspace-Credits aufladen." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 403) return new Response(JSON.stringify({ error: "KI-Kontingent des Workspaces erreicht. Bitte Limit anheben oder Credits aufladen." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
