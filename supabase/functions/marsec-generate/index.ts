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

interface RateEntry { count: number; resetAt: number }
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

const SYSTEM_BASE = `You design cyber crisis tabletop exercises (TTX) for the maritime sector. Produce ONE continuous, causally linked case — never a collection of unrelated episodes.

Rules (strict):
- Causality: every inject except I-01 names a concrete predecessor (inject ID or timeline event) in "dependsOn". No inject without a cause.
- Topic roles: Lead thread = main storyline (3-4 injects), Core thread = secondary strand (1-2), Side thread = side effect (1).
- Ground truth: "timeline" contains at least (number of injects + 2) events. Every person, vessel, system, terminal or report mentioned in an inject MUST already appear in "organisationProfile" or "timeline". Never invent new facts inside inject text.
- Ship vs shore: state explicitly whether an event happens shore-side (IT) or on board (IT/OT), and keep the separation consistent. Respect the Master's authority at sea and satcom bandwidth limits.
- Classification time ("classificationTime", format HH:MM) marks when the incident was classified as major/significant. All reporting deadlines are anchored to it and expressed as a concrete clock time OR "T+<hours>h" — never generic.
- Clarification questions: every answer either cites a timeline fact or reads "Not known - carry as an assumption." Nothing invented.
- Role tension: ALWAYS a conflict between two named goals (e.g. "fast resumption of quay operations vs. forensic evidence preservation"), never a character description.
- Anti-repetition: discussion prompts and clarification questions must not duplicate content across injects.
- Channel diversity: spread the injection channels across injects (phone, e-mail, ticket, crew report via satcom, VHF, media enquiry, authority letter, chat, terminal operations radio) - never the same channel three times in a row.
- Realism: use maritime terminology correctly (TEU, berth, STS crane, TOS, ECDIS, AIS, VTS, ISPS, PFSO/CSO, charter party, port state control, class society).
- Fictional names only (no real companies, vessels, ports or vendors). Language: ENGLISH throughout.

Answer with valid JSON ONLY, matching the schema. No markdown, no prose prefix.`;

const MODEL = "google/gemini-2.5-flash";
const PRICE_IN_PER_M = 0.30;
const PRICE_OUT_PER_M = 2.50;

async function callGateway(system: string, userPrompt: string, key: string, maxTokens = 5500, temperature?: number) {
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
  });
}

function tryParse(content: string): any | null {
  try { return JSON.parse(content); } catch { /* fallthrough */ }
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateCheck(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) },
    });
  }

  try {
    const body = await req.json();
    const { sector, sectorContext, profile, topics, duration, injectCount, roleScope, roles, difficulty, obligations } = body ?? {};

    if (
      typeof sector !== "string" || sector.length > 40 ||
      !profile || typeof profile !== "object" ||
      !Array.isArray(topics) || topics.length === 0 || topics.length > 8 ||
      typeof injectCount !== "number" || injectCount < 4 || injectCount > 20
    ) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileLines = Object.entries(profile as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string" && v.trim())
      .map(([k, v]) => `- ${k}: ${String(v).slice(0, 300)}`)
      .join("\n");

    const topicLines = topics
      .map((t: any) => `- ${String(t?.name ?? "").slice(0, 200)} [${String(t?.weight ?? "Core thread")}]`)
      .join("\n");

    const obligationLines = Array.isArray(obligations) && obligations.length
      ? obligations.map((o: any) => `- ${String(o).slice(0, 400)}`).join("\n")
      : "- No external reporting obligations in scope; focus on internal escalation only.";

    const roleLine = Array.isArray(roles) && roles.length
      ? roles.map((r: any) => String(r).slice(0, 80)).join(", ")
      : roleScope === "compact" ? "6 core crisis team roles" : "8 crisis team roles";

    const userPrompt = `Sector: ${sector}
Sector context: ${String(sectorContext ?? "").slice(0, 1200)}

Organisation profile:
${profileLines || "- not specified"}

Scenario topics (weighting):
${topicLines}

Duration: ${String(duration ?? "3h")}. Exactly ${injectCount} injects (I-01 … I-${String(injectCount).padStart(2, "0")}), chronological from T+00, clock times starting 08:15.
Roles: ${roleLine}. Each role with a scenario-specific profile plus a tension field (two competing goals).
Difficulty: ${String(difficulty ?? "Intermediate")}.

Reporting obligations in scope (compute concrete clock times from classificationTime):
${obligationLines}

JSON schema (exactly these fields):
{
 "exerciseName":"Exercise <CODENAME>",
 "summary":"5 sentences",
 "groundTruth":{
   "organisationProfile":"",
   "adversaryOrCause":"",
   "classificationTime":"HH:MM",
   "timeline":[{"time":"","event":""}],
   "complications":[""]
 },
 "objectives":["6 objectives"],
 "schedule":[{"time":"","segment":"","content":""}],
 "injects":[{"id":"I-01","time":"","phase":"","mandatory":true,"title":"","topicTag":"","channel":"","dependsOn":"timeline event / I-XX, empty for I-01","content":"3-6 sentences, verbatim for delivery","expectedResponse":"","facilitatorNote":"","discussionPrompts":["3-5"],"clarifications":[{"question":"","answer":""}],"observationFocus":""}],
 "roles":[{"name":"","profile":"","tasks":["4-6"],"tension":"Goal A vs. Goal B"}],
 "reportingObligations":[{"addressee":"","deadline":"T+4h / concrete clock time","basis":""}],
 "hotwashNotes":["6-8 lessons-learned prompts"]
}`;

    const t0 = Date.now();
    let response: Response;
    try {
      response = await callGateway(SYSTEM_BASE, userPrompt, LOVABLE_API_KEY);
    } catch (e) {
      console.error("gateway fetch failed", e);
      return new Response(JSON.stringify({ error: "AI gateway unreachable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const durationMs = Date.now() - t0;

    if (!response.ok) {
      const status = response.status;
      const errText = await response.text().catch(() => "");
      console.error(JSON.stringify({ evt: "marsec_ai_error", status, durationMs, model: MODEL, injectCount, sector, err: errText.slice(0, 500) }));
      await logAiUsage({
        function_name: "marsec-generate",
        model: MODEL,
        status,
        duration_ms: durationMs,
        meta: { error: errText.slice(0, 500), injectCount, sector, difficulty, roleScope, duration },
      });
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402 || status === 403) return new Response(JSON.stringify({ error: "AI quota exhausted. Please top up workspace credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Generation failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const usage = data?.usage ?? {};
    let promptTokens = usage.prompt_tokens ?? 0;
    let completionTokens = usage.completion_tokens ?? 0;
    let content: string = data.choices?.[0]?.message?.content || "{}";
    let parsed = tryParse(content);
    let retried = false;

    if (!parsed || !parsed.injects) {
      retried = true;
      console.warn("marsec_ai parse_failed, retrying once");
      const retryPrompt = userPrompt + `\n\nThe previous answer was not valid JSON. Answer with a single JSON object ONLY, starting with "{" and ending with "}". No code fences, no prose.`;
      try {
        const r2 = await callGateway(SYSTEM_BASE, retryPrompt, LOVABLE_API_KEY, 5500, 0.2);
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
    console.log(JSON.stringify({
      evt: "marsec_ai_usage", model: MODEL, durationMs, promptTokens, completionTokens, totalTokens,
      costUsd: Number(costUsd.toFixed(6)), responseBytes: content.length, retried, injectCount, sector, difficulty, roleScope, duration,
    }));
    await logAiUsage({
      function_name: "marsec-generate",
      model: MODEL,
      status: 200,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      cost_usd: Number(costUsd.toFixed(6)),
      duration_ms: durationMs,
      meta: { injectCount, sector, difficulty, roleScope, duration, responseBytes: content.length, retried },
    });

    if (!parsed || !parsed.injects) {
      return new Response(JSON.stringify({ error: "Response could not be parsed. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ exercise: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("marsec-generate error", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
