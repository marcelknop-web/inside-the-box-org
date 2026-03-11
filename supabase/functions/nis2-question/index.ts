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

const TOPIC_POOLS = [
  "Meldepflichten und Fristen bei Sicherheitsvorfällen",
  "Haftung der Geschäftsleitung und persönliche Verantwortung",
  "Lieferkettensicherheit und Drittanbieter-Risiken",
  "Risikomanagement-Maßnahmen nach Artikel 21",
  "Verhältnis NIS-2 zu ISO 27001 / TISAX / DORA",
  "Business Continuity und Notfallplanung",
  "Schwellenwerte und Anwendungsbereich (wichtige vs. wesentliche Einrichtungen)",
  "Sanktionen und Bußgelder bei Verstößen",
  "Technische Maßnahmen: Verschlüsselung, MFA, Netzwerksegmentierung",
  "OT-Sicherheit und Industrieanlagen",
  "Grenzüberschreitende Zusammenarbeit und EU-Koordination",
  "Schulungspflichten und Awareness-Programme",
  "Zugangskontrollen und Identity Management",
  "Schwachstellenmanagement und Patch-Prozesse",
  "Incident Response und forensische Sicherung",
  "Cloud-Sicherheit und Shared Responsibility",
  "Audit- und Nachweispflichten gegenüber Behörden",
  "Sektorspezifische Anforderungen (Energie, Gesundheit, Transport, Finanzen)",
  "NIS2UmsuCG – nationale Umsetzung in Deutschland",
  "Zusammenspiel von CISO, DPO und Geschäftsleitung",
  "Registrierungspflichten bei nationalen Behörden",
  "Krisenmanagement auf EU-Ebene (EU-CyCLONe)",
  "DNS-Sicherheit und Domainregistrierung",
  "Zero-Trust-Architektur im NIS-2-Kontext",
];

function pickTopics(count: number, seed: number): string[] {
  const shuffled = [...TOPIC_POOLS];
  // Fisher-Yates with seed-like behaviour
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 7) + 13) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const SYSTEM_PROMPT = `Du erzeugst anspruchsvolle Transferwissen-Fragen für ein NIS-2 Quiz im „Wer wird Millionär?"-Stil.

Zielgruppe: ISMS-Verantwortliche, CISOs, Compliance-Manager und Geschäftsleitungen.

KRITISCHE REGELN:
- Gib ausschließlich gültiges JSON zurück. Kein Markdown, keine Erklärungen außerhalb des JSON.
- Genau 1 Frage, genau 4 Optionen (A-D), genau 1 korrekte Antwort als Index (0-3).
- Verwende formale Ansprache (Siezen).

FRAGENPHILOSOPHIE – DAS WICHTIGSTE:
Du stellst KEINE Auswendiglern-Fragen. KEINE reinen Definitionsfragen. KEINE trivialen Fragen.

Stattdessen testest du TRANSFERWISSEN und URTEILSVERMÖGEN:
- "Was würden Sie in dieser Situation tun?"
- "Welche Konsequenz ergibt sich, wenn...?"
- "Ihr Unternehmen steht vor folgendem Problem – welcher Ansatz ist richtig?"
- "Warum ist Option X falsch, obwohl sie plausibel klingt?"

Jede Frage MUSS ein konkretes Szenario oder eine Entscheidungssituation enthalten.
Der Spieler muss NACHDENKEN und KOMBINIEREN – nicht erinnern.

SCHWIERIGKEITSGRADE (1-10) – WICHTIG, STRIKT EINHALTEN:
- 1-2: Einfache Szenarien. Grundverständnis reicht. Wer ist betroffen? Was passiert bei Untätigkeit? Kurze, klare Szenarien.
- 3-4: Etwas komplexer. Zwei Faktoren spielen zusammen. Meldepflichten in konkreten Situationen. Grundlegende Verantwortungsfragen.
- 5-6: Mittlere Komplexität. Lieferketten, Outsourcing, Zusammenspiel mehrerer Rollen. Szenarien mit Zeitdruck. Abgrenzungsfragen zwischen Regularien.
- 7-8: Anspruchsvoll. Grenzfälle mit mehreren Stakeholdern. Wechselwirkungen NIS-2/ISO 27001/DORA/TISAX. OT vs. IT. Haftungsfeinheiten. Grenzüberschreitend.
- 9: Sehr schwer. Regulatorische Grauzonen. Widersprüchliche Interessen. Entscheidung unter Unsicherheit mit unvollständiger Information. Mehrere plausible Antworten, nur eine wirklich korrekt.
- 10: Extremschwer. Mehrstufige Szenarien mit 3+ Stakeholdern, Zeitdruck, internationalen Aspekten und widersprüchlichen Rechtslagen. Nur Experten mit tiefer Praxiserfahrung können diese lösen.

FALSCHE ANTWORTEN:
- Müssen plausibel klingen – wie etwas, das ein gut informierter Laie für richtig halten könnte.
- Sollen typische Denkfehler oder verbreitete Missverständnisse widerspiegeln.
- KEINE offensichtlich absurden Optionen.
- Bei Schwierigkeit 7+: Die Distraktoren müssen so nah an der richtigen Antwort sein, dass echtes Nachdenken nötig ist.

ERKLÄRUNG:
- Kurz, lehrreich, praxisbezogen.
- Erkläre WARUM die richtige Antwort richtig ist UND warum die plausibelste falsche Antwort falsch ist.
- Wenn relevant: Bezug auf NIS-2-Artikel oder NIS2UmsuCG.

VIELFALT – EXTREM WICHTIG:
- Verwende NIEMALS Standardbeispiele. Erfinde immer neue, kreative Szenarien.
- Variiere: Branchen (Energie, Gesundheit, Transport, Finanzen, Produktion, Telco, Wasser, Abfall, Raumfahrt, Lebensmittel), Unternehmensgrößen, Rollen (CISO, CEO, IT-Leiter, Einkauf, Rechtsabteilung, Auditor).
- Variiere die Fragenstruktur: Situationsfrage, Priorisierungsfrage, Fehlerfindung, Konsequenzanalyse, Strategieentscheidung, Eskalationsszenarien.

SELBSTCHECK:
(1) Erfordert die Frage Nachdenken, nicht nur Erinnern?
(2) Enthält sie ein konkretes Szenario oder eine Entscheidung?
(3) Sind die falschen Antworten plausible Denkfehler?
(4) Passt die Schwierigkeit exakt zum angegebenen Level?
(5) Ist die Frage wirklich ANDERS als typische NIS-2-Quizfragen?
Falls nein → neu generieren.

AUSGABEFORMAT (JSON):
{
  "question": "...",
  "options": ["A ...", "B ...", "C ...", "D ..."],
  "correct": 0,
  "explanation": "..."
}

Erzeuge jetzt 1 Frage. Die Sprache MUSS der folgenden Sprachvorgabe entsprechen.`;

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

    // Pick 2 random topics to force variety
    const seed = Date.now() ^ (difficulty * 9973);
    const topics = pickTopics(2, seed);
    const topicInstruction = `Themenbereich für diese Frage (wähle EINEN davon): "${topics[0]}" ODER "${topics[1]}"`;
    const uniqueInstruction = `Einzigartigkeits-Seed: ${seed} – Nutze diesen Seed als Inspiration für ein komplett neues Szenario. Wiederhole KEINE typischen Standardfragen.`;

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
            { role: "user", content: `${langInstruction}\n${diffInstruction}\n${topicInstruction}\n${uniqueInstruction}\n\nErzeuge jetzt 1 Frage.` },
          ],
          max_tokens: 1200,
          temperature: 1.0,
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
