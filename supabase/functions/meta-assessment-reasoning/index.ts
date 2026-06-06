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

function buildSystemPrompt(standardName: string, regulation: string, langName: string): string {
  return `You are a senior compliance auditor specialising in "${standardName}" (${regulation}).

You receive an entity's intake data and a fixed list of requirements. Assess EACH requirement strictly against the supplied evidence and derive a concise risk landscape.

DATA-INTEGRITY POLICY (non-negotiable):
- NEVER invent facts, documents, systems, controls or findings that are not present in the intake. If evidence is missing, say so and rate accordingly.
- "evidence" must reference what the user actually provided (or explicitly state that none was provided).
- Do not assume best practice is in place unless the intake states it.

For EACH requirement decide a status:
- "pass": clear, specific evidence the requirement is met.
- "partial": some evidence but gaps remain.
- "fail": no evidence or evidence of non-compliance.

Risks: derive 5–10 concrete risks from the gaps. Each risk has likelihood (1–5) and impact (1–5). Higher = worse. Risks MUST map to weaknesses visible in the intake.

Write all human-readable text (evidence, gap, rationale, measure, name, component, summary) in ${langName}.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "summary": "2-3 sentence executive summary",
  "requirements": [
    { "id": "<requirement id>", "status": "pass|partial|fail", "evidence": "...", "gap": "...", "rationale": "...", "measure": "...", "priority": "high|medium|low" }
  ],
  "risks": [
    { "name": "...", "component": "...", "category": "...", "likelihood": 1-5, "impact": 1-5, "evidence": "...", "rationale": "..." }
  ]
}
For "pass" requirements, "gap" and "measure" may be empty strings and "priority" "low".`;
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
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  try {
    const body = await req.json();
    const { standardName, regulation, requirements, intakeText, language } = body ?? {};

    // ── Input validation ──
    if (typeof standardName !== "string" || standardName.length > 80) {
      return bad("Invalid standardName");
    }
    if (typeof regulation !== "string" || regulation.length > 160) {
      return bad("Invalid regulation");
    }
    if (!Array.isArray(requirements) || requirements.length === 0 || requirements.length > 60) {
      return bad("Invalid requirements list");
    }
    for (const r of requirements) {
      if (!r || typeof r.id !== "string" || typeof r.name !== "string" || r.id.length > 20 || r.name.length > 300) {
        return bad("Invalid requirement entry");
      }
    }
    if (typeof intakeText !== "string" || intakeText.length > 20_000) {
      return bad("Invalid intakeText");
    }
    const lang = typeof language === "string" && LANG_NAME[language] ? language : "de";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reqList = requirements
      .map((r: any) => `${r.id} [${r.article ?? ""}] ${r.name}${r.criteria ? ` — Criteria: ${r.criteria}` : ""}`)
      .join("\n");

    const userContent = `STANDARD: ${standardName} (${regulation})

REQUIREMENTS TO ASSESS (use these exact ids):
${reqList}

ENTITY INTAKE DATA:
${intakeText}

Assess every requirement id above. Return the JSON object now.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildSystemPrompt(standardName, regulation, LANG_NAME[lang]) },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 6000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("[meta-assessment-reasoning] upstream error:", response.status, t);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed: any;
    try {
      const cleaned = String(content).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[meta-assessment-reasoning] JSON parse error:", content);
      return new Response(JSON.stringify({ error: "Failed to generate assessment" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!parsed || !Array.isArray(parsed.requirements)) {
      console.error("[meta-assessment-reasoning] invalid structure:", JSON.stringify(parsed)?.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to generate assessment" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Normalise: clamp scores, coerce statuses, keep only known requirement ids.
    const knownIds = new Set(requirements.map((r: any) => r.id));
    const clamp = (n: unknown) => Math.min(5, Math.max(1, Math.round(Number(n) || 1)));
    const okStatus = (s: unknown) => (s === "pass" || s === "partial" || s === "fail") ? s : "fail";
    const okPrio = (p: unknown) => (p === "high" || p === "medium" || p === "low") ? p : "medium";

    const reqs = (parsed.requirements as any[])
      .filter((r) => knownIds.has(r?.id))
      .map((r) => ({
        id: String(r.id),
        status: okStatus(r.status),
        evidence: String(r.evidence ?? ""),
        gap: String(r.gap ?? ""),
        rationale: String(r.rationale ?? ""),
        measure: String(r.measure ?? ""),
        priority: r.status === "pass" ? "low" : okPrio(r.priority),
      }));

    const risks = Array.isArray(parsed.risks)
      ? (parsed.risks as any[]).slice(0, 12).map((r, i) => ({
          id: `R${i + 1}`,
          name: String(r?.name ?? ""),
          component: String(r?.component ?? ""),
          category: String(r?.category ?? ""),
          likelihood: clamp(r?.likelihood),
          impact: clamp(r?.impact),
          evidence: String(r?.evidence ?? ""),
          rationale: String(r?.rationale ?? ""),
        }))
      : [];

    return new Response(JSON.stringify({ summary: String(parsed.summary ?? ""), requirements: reqs, risks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meta-assessment-reasoning error:", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  function bad(msg: string) {
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
