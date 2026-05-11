import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SKS_CATALOG } from "./catalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_DAILY_REQUESTS = 1500;
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function rateOk(ip: string) {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) return { ok: false, retry: 3600 };
  const e = ipRateMap.get(ip);
  if (!e || now > e.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { ok: true };
  }
  if (e.count >= MAX_REQUESTS_PER_WINDOW) return { ok: false, retry: Math.ceil((e.resetAt - now) / 1000) };
  e.count++; dailyCount++;
  return { ok: true };
}

const SYSTEM = `Du wandelst eine amtliche SKS-Prüfungsfrage in eine "Wer wird Millionär?"-Quizfrage um.

REGELN:
- Gib AUSSCHLIESSLICH gültiges JSON zurück, kein Markdown-Block.
- Sprache: Deutsch. Siezen. Formal.
- "question": KNAPP und prägnant formulieren (max. ~20 Wörter, möglichst 1 Satz). Unnötige Wiederholungen, Floskeln und einleitende Phrasen weglassen. Kernfrage erhalten, Bedeutung unverändert.
- Genau 4 Optionen. Genau 1 korrekte Antwort. correct = Index 0–3.
- WICHTIG: Verteile die korrekte Antwort ZUFÄLLIG auf eine der vier Positionen — NICHT immer 0. Würfle bewusst.
- Optionen kurz halten (1 Satz, max. ~15 Wörter), vergleichbar in Länge.
- Die amtliche Musterantwort IST inhaltlich die korrekte Option (sprachlich straffen erlaubt, Fakten und Zahlenwerte unverändert).
- Die 3 Distraktoren sind plausibel: typische Verwechslungen aus dem maritimen Kontext, klar falsch, nicht absurd.
- Optionen ohne Buchstaben-Präfix.
- "keywords": 2–5 zentrale Schlüsselwörter/Fachbegriffe aus der korrekten Antwort/Frage (Substantive, Werte, Abkürzungen wie "KVR", "WGS 84", "Backbord"). Werden im UI gehighlightet.
- "explanation": 1–2 prägnante Sätze, warum die Antwort richtig ist; nutze ggf. KVR, SeeSchStrO, BSH, WGS 84, NfS, Beaufort etc.
- SCHWIERIGKEIT (1–10): hoch → subtilere Distraktoren; niedrig → klarere Unterschiede.
- Bei Zahlen (Längen, Höhen, Sektoren, Bußgelder) bleibt der korrekte Wert exakt.

AUSGABE:
{
  "question": "...",
  "options": ["...","...","...","..."],
  "correct": 0,
  "keywords": ["...","..."],
  "explanation": "..."
}`;

const TOPIC_LABEL: Record<string, string> = {
  navigation: "Navigation",
  recht: "Schifffahrtsrecht",
  wetter: "Wetterkunde",
  seemannschaft: "Seemannschaft",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const rl = rateOk(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests, please wait." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retry ?? 60) } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const topicRaw = body?.topic as string | undefined;
    const validTopics = ["navigation", "recht", "wetter", "seemannschaft"] as const;
    const topic = validTopics.includes(topicRaw as any) ? (topicRaw as typeof validTopics[number]) : null;
    const difficulty = Math.min(10, Math.max(1, body?.difficulty || 5));
    const sourceIndex = Number.isInteger(body?.sourceIndex) ? body.sourceIndex : -1;

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve source question
    let resolvedTopic: typeof validTopics[number];
    let pool;
    let resolvedIndex: number;
    if (topic) {
      resolvedTopic = topic;
      pool = SKS_CATALOG[topic];
      resolvedIndex = sourceIndex >= 0 ? sourceIndex % pool.length : Math.floor(Math.random() * pool.length);
    } else {
      // Mixed mode – round-robin by sourceIndex across topics
      const allEntries: Array<{ t: typeof validTopics[number]; i: number }> = [];
      for (const t of validTopics) {
        for (let i = 0; i < SKS_CATALOG[t].length; i++) allEntries.push({ t, i });
      }
      const pick = sourceIndex >= 0 ? allEntries[sourceIndex % allEntries.length] : allEntries[Math.floor(Math.random() * allEntries.length)];
      resolvedTopic = pick.t;
      resolvedIndex = pick.i;
      pool = SKS_CATALOG[resolvedTopic];
    }
    const source = pool[resolvedIndex];

    const userMsg = `Themenbereich: ${TOPIC_LABEL[resolvedTopic]}
Schwierigkeitsgrad: ${difficulty}/10

ORIGINAL-FRAGE: ${source.q}
AMTLICHE ANTWORT: ${source.a}

Erzeuge jetzt die Multiple-Choice-Frage als JSON.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        max_tokens: 1200,
        temperature: 0.8,
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "Service temporarily unavailable." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("[sks-question] upstream:", r.status, t);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed: any;
    try { parsed = JSON.parse(content); } catch {
      console.error("[sks-question] parse fail:", content);
      return new Response(JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4 || typeof parsed.correct !== "number" || !parsed.explanation) {
      console.error("[sks-question] bad structure:", JSON.stringify(parsed));
      return new Response(JSON.stringify({ error: "Failed to generate question" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Server-side shuffle so correct answer position is truly random
    {
      const correctText = parsed.options[parsed.correct];
      const order = [0, 1, 2, 3];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const newOptions = order.map((o: number) => parsed.options[o]);
      parsed.options = newOptions;
      parsed.correct = newOptions.indexOf(correctText);
    }
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];
    parsed.topic = resolvedTopic;
    parsed.sourceIndex = resolvedIndex;
    parsed.topicLabel = TOPIC_LABEL[resolvedTopic];
    parsed.poolSize = pool.length;
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("sks-question error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
