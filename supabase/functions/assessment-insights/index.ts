import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── RATE LIMITING (in-memory, resets on cold start) ─────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
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

const LANG_NAME: Record<string, string> = { de: "Deutsch", en: "English", fr: "Français" };

// ─── Layer 2 + 3: AI INSIGHT / REPORTING ENGINE ─────────────────
// IMPORTANT: This function NEVER decides compliance. It receives the
// finished deterministic findings/risks/score and only EXPLAINS them:
// root causes, cross-control patterns, gap clusters, an executive
// narrative, a roadmap rationale and "virtual auditor" questions.
function buildSystemPrompt(standardName: string, langName: string): string {
  return `You are a senior management consultant and lead auditor for "${standardName}".

You are given the results of a DETERMINISTIC compliance assessment that has ALREADY been computed by a rule engine: per-control findings (pass/partial/fail), a readiness score, and derived risks. These results are the source of truth and are FIXED.

YOUR ROLE IS THE ANALYSIS LAYER ON TOP — you NEVER change, re-score, or contradict a finding. You add consulting value:
1. executiveNarrative: a 4-6 sentence management situation report describing the overall posture (reactive/managed/etc.), where the biggest weaknesses cluster, and the business consequence. Board-ready prose.
2. rootCauses: for the main weak areas, map the visible symptom to a likely underlying ROOT CAUSE (e.g. missing IAM strategy, no ITSM process). 2-5 items.
3. gapClusters: group the failing/partial controls into 2-4 CORE THEMES so the reader sees "not 20 problems, but 3 root themes". Each cluster: title, one-sentence summary, and the related control ids.
4. crossControlInsights: 2-4 statements linking deficits that are likely consequences of a single missing capability.
5. roadmapRationale: 2-4 sentences explaining the sequencing logic (why critical/high first, dependencies).
6. auditorQuestions: 4-6 sharp follow-up questions a human auditor would ask next ("virtual auditor").

DATA-INTEGRITY POLICY (non-negotiable):
- Base every statement ONLY on the provided findings/risks. Never invent controls, evidence, systems or facts.
- Never assert a control is compliant/non-compliant beyond what the findings already state.
- This output is EXPLANATORY, not a compliance verdict.

Write all text in ${langName}.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "executiveNarrative": "...",
  "rootCauses": [ { "symptom": "...", "cause": "..." } ],
  "gapClusters": [ { "title": "...", "summary": "...", "controlIds": ["A21-1"] } ],
  "crossControlInsights": ["..."],
  "roadmapRationale": "...",
  "auditorQuestions": ["..."]
}`;
}

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
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } },
    );
  }

  try {
    const body = await req.json();
    const { standardName, language, score, findings, risks } = body ?? {};

    if (typeof standardName !== "string" || standardName.length > 80) return bad("Invalid standardName");
    if (!Array.isArray(findings) || findings.length === 0 || findings.length > 80) return bad("Invalid findings");
    if (!Array.isArray(risks) || risks.length > 40) return bad("Invalid risks");
    if (score !== undefined && (typeof score !== "number" || score < 0 || score > 100)) return bad("Invalid score");
    const lang = typeof language === "string" && LANG_NAME[language] ? language : "de";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const findingsText = findings
      .map((f: any) => `${String(f.id).slice(0, 20)} [${String(f.status).slice(0, 10)}] ${String(f.name ?? "").slice(0, 200)}${f.gap ? ` — gap: ${String(f.gap).slice(0, 300)}` : ""}`)
      .join("\n");
    const risksText = risks
      .map((r: any) => `${String(r.name ?? "").slice(0, 200)} (L${Number(r.likelihood) || 0}×I${Number(r.impact) || 0})`)
      .join("\n");

    const userContent = `STANDARD: ${standardName}
READINESS SCORE: ${typeof score === "number" ? score : "n/a"}%

DETERMINISTIC FINDINGS (fixed, do not change):
${findingsText}

DERIVED RISKS:
${risksText || "(none)"}

Produce the analysis JSON now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(standardName, LANG_NAME[lang]) },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const tx = await response.text();
      console.error("[assessment-insights] upstream error:", response.status, tx);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: any;
    try {
      const cleaned = String(content).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[assessment-insights] JSON parse error:", content);
      return new Response(JSON.stringify({ error: "Failed to generate insights" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const knownIds = new Set(findings.map((f: any) => String(f.id)));
    const str = (x: unknown) => String(x ?? "");
    const arrStr = (x: unknown) => Array.isArray(x) ? x.map(str).filter(Boolean).slice(0, 8) : [];

    const out = {
      executiveNarrative: str(parsed.executiveNarrative),
      rootCauses: Array.isArray(parsed.rootCauses)
        ? parsed.rootCauses.slice(0, 6).map((r: any) => ({ symptom: str(r?.symptom), cause: str(r?.cause) })).filter((r: any) => r.cause)
        : [],
      gapClusters: Array.isArray(parsed.gapClusters)
        ? parsed.gapClusters.slice(0, 5).map((c: any) => ({
            title: str(c?.title),
            summary: str(c?.summary),
            controlIds: (Array.isArray(c?.controlIds) ? c.controlIds.map(str) : []).filter((id: string) => knownIds.has(id)).slice(0, 12),
          })).filter((c: any) => c.title)
        : [],
      crossControlInsights: arrStr(parsed.crossControlInsights),
      roadmapRationale: str(parsed.roadmapRationale),
      auditorQuestions: arrStr(parsed.auditorQuestions),
    };

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("assessment-insights error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  function bad(msg: string) {
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
