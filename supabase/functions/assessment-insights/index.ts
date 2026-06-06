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
// finished DETERMINISTIC findings/risks/score/recommendations and only
// ANALYSES and EXPLAINS them, acting as a "Virtual Internal Auditor"
// and "Virtual Compliance Advisor": root causes, gap/management themes,
// executive insights, transformation programs, a management roadmap,
// business impact and (optionally) a maturity narrative.
function buildSystemPrompt(standardName: string, langName: string): string {
  return `You are a senior cybersecurity & compliance consultant, internal auditor and virtual CISO advising on "${standardName}".

Your audience: Internal Auditors, Information Security Managers, CISOs, Compliance Managers, NIS2/DORA Program Managers, cybersecurity consultants, virtual CISOs and advisory firms.

You are given the results of a DETERMINISTIC compliance assessment ALREADY computed by a rule engine: per-control findings (pass/partial/fail), a readiness score, derived risks, recommendations and (optionally) a maturity level. These results are the SINGLE SOURCE OF TRUTH and are FIXED.

YOU ARE THE ANALYSIS LAYER ON TOP. You NEVER change, re-score or contradict a finding, risk, score, evidence, recommendation or compliance status. You add advisory value answering: "Where are we? Why are we there? What should we do next?" — not just "what score did we achieve?".

Produce the following (write all text in ${langName}, executive language, minimal technical jargon):

1. executiveNarrative: 4-6 sentence board-ready situation report on overall posture and the biggest weakness clusters and their business consequence.
2. executiveInsights: object with arrays (2-5 items each), executive language:
   - topWeaknesses, topStrengths, highestBusinessRisks, multiRegulatoryIssues (issues touching several requirements), managementFocus (what to act on first).
3. rootCauses: for the main weak areas, map the visible symptom to the LIKELY organizational root cause. 3-6 items. Explain WHY issues may exist. Each MUST include validationActivities: 2-4 concrete activities an internal auditor would perform to confirm the cause (e.g. "Interview process owners", "Review policies", "Review contracts", "Review audit logs", "Review change records", "Review access reviews", "Review risk registers").
4. gapClusters: group failing/partial controls into 2-5 CORE THEMES ("not 20 problems, but 4"). Each: title, one-sentence summary, related control ids, businessImpact, regulatoryImpact.
5. crossControlInsights: 2-4 statements linking deficits that may stem from a single missing capability.
6. managementThemes: 3-5 management-level themes. Each: title, currentState, riskExposure, improvementOpportunity, confidence.
7. transformationPrograms: 3-5 higher-level OUTCOME/CAPABILITY-focused programs that REPLACE long recommendation lists (e.g. "Cybersecurity Governance Enhancement"). Each: title, objectives, expectedBenefits, relatedControlIds, relatedRisks, complexity (low|medium|high), businessValue (low|medium|high), confidence.
8. managementRoadmap: phased plan grouped into "0-3", "3-6", "6-12", "12+". Each: phase, activities (array), rationale.
9. maturityNarrative: ONLY if a maturity level is explicitly provided in the input, give a short narrative explaining current vs target maturity. If no maturity is provided, return an empty string and DO NOT state any numeric maturity level — instead describe characteristics in qualitative terms (e.g. "characteristics typically associated with a managed security posture").
10. businessImpact: translate the major weaknesses/clusters into business consequences. 3-6 items, each: area, consequence.
11. roadmapRationale: 2-4 sentences explaining the sequencing logic.
12. auditorQuestions: 5-8 sharp follow-up questions a senior internal auditor, regulator or external assessor would ask next. Derive them from: missing evidence, contradictory answers, high risks, partial controls and unusual maturity patterns. They must encourage further investigation.
13. systemicWeaknesses: 2-5 RECURRING cross-finding patterns pointing to a systemic governance/capability weakness (e.g. Identity Governance, Third-Party Governance, Cybersecurity Governance, Operational Resilience, Incident Response, Business Continuity). Each: area, pattern (the recurring pattern across multiple findings), relatedControlIds, confidence, and validationActivities (2-4 concrete validation activities). This must identify patterns spanning multiple findings — one of the most valuable sections.
14. hypotheses: 2-5 explicit ASSUMPTIONS that are NOT directly evidenced by the assessment data but plausibly explain the results. Use this whenever a conclusion is speculative or confidence is medium/low. Each: statement (hedged, e.g. "The assessment results suggest that supplier governance may not yet be fully integrated into procurement processes."), confidence (medium|low — NEVER high, a confirmed item is not a hypothesis), validationActivities (2-4 activities to confirm/refute, e.g. "Procurement interviews", "Contract reviews", "Supplier assessment records"), and relatedControlIds. Hypotheses separate assumptions from supported observations and align the report with professional internal audit practice.
15. consultantObservations: 3-6 senior-consultant / virtual-CISO observations written as an experienced advisor would phrase them in a management debrief. Each: observation (a professional remark on the current posture, e.g. "The organisation has foundational controls in place but lacks consistent governance oversight."), implication (what this means for the business / audit), recommendation (a vendor-neutral, outcome-focused suggestion), and confidence. These should read like seasoned advisory commentary, not repeat the raw findings.
16. confidence: object giving an overall confidence (high|medium|low) for each AI category: executiveInsights, rootCauses, managementThemes, crossControlInsights, transformationPrograms, systemicWeaknesses.

LANGUAGE & CONFIDENCE RULES (non-negotiable):
- Root causes and any inferred cause MUST use hedged language ("may indicate", "suggests", "appears to", "likely reflects", "may be caused by") UNLESS directly evidenced by the assessment inputs. Never present an inferred cause as a proven fact. Example: instead of "Missing third-party risk management governance." write "The assessment results may indicate weaknesses in third-party risk governance."
- Confidence levels: high = assessment data strongly supports the insight; medium = reasonable inference based on available evidence; low = hypothesis requiring further validation. Apply confidence ONLY to AI interpretations, NEVER to deterministic findings, scores or risks.
- Recommendations / programs must focus on OUTCOMES and CAPABILITIES and stay VENDOR-NEUTRAL. Avoid prescribing specific products/technologies (e.g. "implement a vendor risk management portal"); prefer "establish a structured vendor risk management process" unless a specific technology is explicitly supported by the assessment data.
- Do NOT state a numeric maturity level unless it is explicitly provided in the input.

DATA-INTEGRITY POLICY (non-negotiable):
- Base every statement ONLY on the provided findings/risks/recommendations/score/maturity. Never invent controls, evidence, systems or facts.
- Never assert a control is compliant/non-compliant beyond what the findings already state.
- This output is EXPLANATORY and ADVISORY, not a compliance verdict.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "executiveNarrative": "...",
  "executiveInsights": { "topWeaknesses": ["..."], "topStrengths": ["..."], "highestBusinessRisks": ["..."], "multiRegulatoryIssues": ["..."], "managementFocus": ["..."] },
  "rootCauses": [ { "symptom": "...", "cause": "...", "confidence": "medium", "validationActivities": ["Interview process owners", "Review policies"] } ],
  "gapClusters": [ { "title": "...", "summary": "...", "controlIds": ["A21-1"], "businessImpact": "...", "regulatoryImpact": "..." } ],
  "crossControlInsights": ["..."],
  "managementThemes": [ { "title": "...", "currentState": "...", "riskExposure": "...", "improvementOpportunity": "...", "confidence": "medium" } ],
  "transformationPrograms": [ { "title": "...", "objectives": "...", "expectedBenefits": "...", "relatedControlIds": ["A21-1"], "relatedRisks": "...", "complexity": "medium", "businessValue": "high", "confidence": "medium" } ],
  "managementRoadmap": [ { "phase": "0-3", "activities": ["..."], "rationale": "..." } ],
  "maturityNarrative": "...",
  "businessImpact": [ { "area": "...", "consequence": "..." } ],
  "roadmapRationale": "...",
  "auditorQuestions": ["..."],
  "systemicWeaknesses": [ { "area": "...", "pattern": "...", "relatedControlIds": ["A21-1"], "confidence": "medium", "validationActivities": ["Review risk registers"] } ],
  "hypotheses": [ { "statement": "...", "confidence": "medium", "validationActivities": ["Procurement interviews", "Contract reviews"], "relatedControlIds": ["A21-1"] } ],
  "confidence": { "executiveInsights": "medium", "rootCauses": "medium", "managementThemes": "medium", "crossControlInsights": "medium", "transformationPrograms": "medium", "systemicWeaknesses": "medium" }
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
    const { standardName, language, score, findings, risks, recommendations, maturity } = body ?? {};

    if (typeof standardName !== "string" || standardName.length > 80) return bad("Invalid standardName");
    if (!Array.isArray(findings) || findings.length === 0 || findings.length > 80) return bad("Invalid findings");
    if (!Array.isArray(risks) || risks.length > 40) return bad("Invalid risks");
    if (recommendations !== undefined && (!Array.isArray(recommendations) || recommendations.length > 60)) return bad("Invalid recommendations");
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
    const recsText = Array.isArray(recommendations)
      ? recommendations.map((r: any) => `${String(r.title ?? "").slice(0, 160)} [${String(r.priority ?? "").slice(0, 12)}]`).join("\n")
      : "";
    const maturityText = maturity && typeof maturity === "object"
      ? `current ${Number((maturity as any).current) || 0}/5, target ${Number((maturity as any).target) || 0}/5`
      : "";

    const userContent = `STANDARD: ${standardName}
READINESS SCORE: ${typeof score === "number" ? score : "n/a"}%
MATURITY: ${maturityText || "(not enabled)"}

DETERMINISTIC FINDINGS (fixed, do not change):
${findingsText}

DERIVED RISKS:
${risksText || "(none)"}

DETERMINISTIC RECOMMENDATIONS:
${recsText || "(none)"}

Produce the advisory analysis JSON now.`;

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
        max_tokens: 6000,
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
    const arrStr = (x: unknown, max = 8) => Array.isArray(x) ? x.map(str).filter(Boolean).slice(0, max) : [];
    const filterIds = (x: unknown) => (Array.isArray(x) ? x.map(str) : []).filter((id: string) => knownIds.has(id)).slice(0, 12);
    const rating = (x: unknown): "low" | "medium" | "high" => {
      const v = str(x).toLowerCase();
      return v === "low" || v === "high" ? v : "medium";
    };
    const conf = (x: unknown): "high" | "medium" | "low" => {
      const v = str(x).toLowerCase();
      return v === "high" || v === "low" ? v : "medium";
    };
    const ei = parsed.executiveInsights ?? {};
    const phaseOf = (x: unknown): string => {
      const v = str(x).replace(/\s/g, "");
      return ["0-3", "3-6", "6-12", "12+"].includes(v) ? v : "0-3";
    };

    const out = {
      executiveNarrative: str(parsed.executiveNarrative),
      executiveInsights: {
        topWeaknesses: arrStr(ei.topWeaknesses, 6),
        topStrengths: arrStr(ei.topStrengths, 6),
        highestBusinessRisks: arrStr(ei.highestBusinessRisks, 6),
        multiRegulatoryIssues: arrStr(ei.multiRegulatoryIssues, 6),
        managementFocus: arrStr(ei.managementFocus, 6),
      },
      rootCauses: Array.isArray(parsed.rootCauses)
        ? parsed.rootCauses.slice(0, 6).map((r: any) => ({ symptom: str(r?.symptom), cause: str(r?.cause), confidence: conf(r?.confidence), validationActivities: arrStr(r?.validationActivities, 4) })).filter((r: any) => r.cause)
        : [],
      gapClusters: Array.isArray(parsed.gapClusters)
        ? parsed.gapClusters.slice(0, 5).map((c: any) => ({
            title: str(c?.title),
            summary: str(c?.summary),
            controlIds: filterIds(c?.controlIds),
            businessImpact: str(c?.businessImpact),
            regulatoryImpact: str(c?.regulatoryImpact),
          })).filter((c: any) => c.title)
        : [],
      crossControlInsights: arrStr(parsed.crossControlInsights),
      managementThemes: Array.isArray(parsed.managementThemes)
        ? parsed.managementThemes.slice(0, 6).map((m: any) => ({
            title: str(m?.title),
            currentState: str(m?.currentState),
            riskExposure: str(m?.riskExposure),
            improvementOpportunity: str(m?.improvementOpportunity),
            confidence: conf(m?.confidence),
          })).filter((m: any) => m.title)
        : [],
      transformationPrograms: Array.isArray(parsed.transformationPrograms)
        ? parsed.transformationPrograms.slice(0, 6).map((p: any) => ({
            title: str(p?.title),
            objectives: str(p?.objectives),
            expectedBenefits: str(p?.expectedBenefits),
            relatedControlIds: filterIds(p?.relatedControlIds),
            relatedRisks: str(p?.relatedRisks),
            complexity: rating(p?.complexity),
            businessValue: rating(p?.businessValue),
            confidence: conf(p?.confidence),
          })).filter((p: any) => p.title)
        : [],
      managementRoadmap: Array.isArray(parsed.managementRoadmap)
        ? parsed.managementRoadmap.slice(0, 4).map((r: any) => ({
            phase: phaseOf(r?.phase),
            activities: arrStr(r?.activities, 8),
            rationale: str(r?.rationale),
          })).filter((r: any) => r.activities.length)
        : [],
      maturityNarrative: str(parsed.maturityNarrative),
      businessImpact: Array.isArray(parsed.businessImpact)
        ? parsed.businessImpact.slice(0, 8).map((b: any) => ({ area: str(b?.area), consequence: str(b?.consequence) })).filter((b: any) => b.consequence)
        : [],
      roadmapRationale: str(parsed.roadmapRationale),
      auditorQuestions: arrStr(parsed.auditorQuestions, 10),
      systemicWeaknesses: Array.isArray(parsed.systemicWeaknesses)
        ? parsed.systemicWeaknesses.slice(0, 6).map((s: any) => ({
            area: str(s?.area),
            pattern: str(s?.pattern),
            relatedControlIds: filterIds(s?.relatedControlIds),
            confidence: conf(s?.confidence),
            validationActivities: arrStr(s?.validationActivities, 4),
          })).filter((s: any) => s.area)
        : [],
      hypotheses: Array.isArray(parsed.hypotheses)
        ? parsed.hypotheses.slice(0, 6).map((h: any) => {
            // A hypothesis is by definition not confirmed → never "high".
            const c = conf(h?.confidence);
            return {
              statement: str(h?.statement),
              confidence: c === "high" ? "medium" : c,
              validationActivities: arrStr(h?.validationActivities, 4),
              relatedControlIds: filterIds(h?.relatedControlIds),
            };
          }).filter((h: any) => h.statement)
        : [],
      confidence: {
        executiveInsights: conf(parsed.confidence?.executiveInsights),
        rootCauses: conf(parsed.confidence?.rootCauses),
        managementThemes: conf(parsed.confidence?.managementThemes),
        crossControlInsights: conf(parsed.confidence?.crossControlInsights),
        transformationPrograms: conf(parsed.confidence?.transformationPrograms),
        systemicWeaknesses: conf(parsed.confidence?.systemicWeaknesses),
      },
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
