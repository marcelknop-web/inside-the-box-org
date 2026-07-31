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
- Causality: every inject except I-01 names a concrete predecessor in "dependsOn". Use either an existing inject ID ("I-03") or a timeline reference in the exact form "HH:MM <verbatim event text copied from the timeline>". Never write "timeline event: 09:20" without the event text. No inject without a cause.
- Topic roles: Lead thread = main storyline (3-4 injects), Core thread = secondary strand (1-2), Side thread = side effect (1). "topicTag" MUST contain the verbatim topic name from the request — never the weighting label ("Lead thread" etc.).
- Timeline alignment: every inject corresponds to a timeline event at the SAME clock time. Add that event to "timeline" with the identical "time" value as the inject.
- Ground truth: "timeline" contains at least (number of injects + 2) events. Every person, vessel, system, terminal or report mentioned in an inject MUST already appear in "organisationProfile" or "timeline". Never invent new facts inside inject text.
- Ship vs shore: state explicitly whether an event happens shore-side (IT) or on board (IT/OT), and keep the separation consistent. Respect the Master's authority at sea and satcom bandwidth limits.
- Classification time ("classificationTime", format HH:MM) marks when the incident was classified as major/significant. EVERY reporting deadline must contain a number: a clock time and/or "T+<hours>h" offset — never "immediate", "as soon as practicable" or similar (write e.g. "09:35 (T+0h05)").

- Clarification questions: every answer either cites a timeline fact or reads "Not known - carry as an assumption." Nothing invented.
- Role tension: ALWAYS a conflict between two named goals (e.g. "fast resumption of quay operations vs. forensic evidence preservation"), never a character description.
- Anti-repetition: discussion prompts and clarification questions must not duplicate content across injects.
- Channel diversity: spread the injection channels across injects (phone, e-mail, ticket, crew report via satcom, VHF, media enquiry, authority letter, chat, terminal operations radio) - never the same channel three times in a row.
- Realism: use maritime terminology correctly (TEU, berth, STS crane, TOS, ECDIS, AIS, VTS, ISPS, PFSO/CSO, charter party, port state control, class society).
- Fictional names only (no real companies, vessels, ports or vendors). Language: ENGLISH throughout.

Self-check before answering (silently, then fix your own draft):
1. Inject count exactly as requested, IDs consecutive, times strictly ascending.
2. Every inject except I-01 has a dependsOn that is either an existing inject ID or "HH:MM <verbatim timeline event text>".
3. Timeline has at least (injects + 2) events, includes one event per inject at the identical clock time; nothing in an inject is absent from profile or timeline.
4. No channel three times in a row; no duplicated discussion prompt or clarification question anywhere.
5. Every requested topic is tagged with its verbatim topic name: Lead thread 3-4 injects, Core thread 1-2, Side thread 1.
6. classificationTime set as HH:MM; every reporting obligation deadline contains a digit (clock time and/or T+xh) — no "immediate" or "as soon as practicable".
7. Every role has 4-6 tasks and a tension in the form "goal A vs. goal B".


Answer with valid JSON ONLY, matching the schema. No markdown, no prose prefix.`;


const MODEL = "google/gemini-2.5-flash";
const PRICE_IN_PER_M = 0.30;
const PRICE_OUT_PER_M = 2.50;

async function callGateway(system: string, userPrompt: string, key: string, maxTokens = 16000, temperature?: number) {
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

// Repairs JSON that was cut off mid-stream (token limit) by closing open strings/brackets.
function repairTruncated(raw: string): any | null {
  const start = raw.indexOf("{");
  if (start < 0) return null;
  const s = raw.slice(start);
  const stack: string[] = [];
  let inStr = false, esc = false, lastSafe = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
    else if (c === "}" || c === "]") stack.pop();
    else if (c === "," && stack.length) lastSafe = i;
  }
  const candidates = [s, lastSafe > 0 ? s.slice(0, lastSafe) : ""];
  for (const base of candidates) {
    if (!base) continue;
    // recompute closers for the truncated candidate
    const st: string[] = [];
    let str = false, e = false;
    for (const c of base) {
      if (str) { if (e) e = false; else if (c === "\\") e = true; else if (c === '"') str = false; continue; }
      if (c === '"') str = true;
      else if (c === "{") st.push("}");
      else if (c === "[") st.push("]");
      else if (c === "}" || c === "]") st.pop();
    }
    let attempt = base + (str ? '"' : "");
    attempt += st.reverse().join("");
    try {
      const p = JSON.parse(attempt);
      if (p && p.injects) return p;
    } catch { /* next candidate */ }
  }
  return null;
}

function tryParse(content: string): any | null {
  try { return JSON.parse(content); } catch { /* fallthrough */ }
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  return repairTruncated(content);
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
    const mode = typeof body?.mode === "string" ? body.mode : "full";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Targeted modes: repair the whole exercise, or one inject ──
    if (mode === "repair" || mode === "inject") {
      const exercise = body?.exercise;
      if (!exercise || typeof exercise !== "object" || !Array.isArray(exercise.injects)) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const exJson = JSON.stringify(exercise).slice(0, 60000);

      let prompt: string;
      if (mode === "repair") {
        const findings = Array.isArray(body?.findings) ? body.findings.slice(0, 30) : [];
        if (!findings.length) {
          return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const fixLines = findings
          .map((f: any, i: number) => `${i + 1}. [${String(f?.severity ?? "warning")}] ${String(f?.rule ?? "").slice(0, 200)} — ${String(f?.detail ?? "").slice(0, 300)} → FIX: ${String(f?.fix ?? "").slice(0, 300)}`)
          .join("\n");
        prompt = `Repair the following maritime tabletop exercise. Fix ONLY the listed quality findings. Keep everything else — wording, IDs, names, storyline — byte-identical where it is not affected by a fix.

Quality findings to fix:
${fixLines}

Return the COMPLETE repaired exercise as a single JSON object with exactly the same schema as the input. No markdown, no prose.

Current exercise:
${exJson}`;
      } else {
        const injectId = String(body?.injectId ?? "").slice(0, 12);
        const instruction = String(body?.instruction ?? "").slice(0, 500);
        if (!injectId) {
          return new Response(JSON.stringify({ error: "Invalid request" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        prompt = `Rewrite exactly ONE inject of the following maritime tabletop exercise: ${injectId}.

Rules: keep the inject id, its position in the chronology and its dependsOn chain intact so predecessors and successors still make sense. Use only facts that already exist in groundTruth (organisationProfile, timeline) or in other injects. Do not duplicate discussion prompts or clarification questions used elsewhere. Choose a channel that differs from the neighbouring injects.${instruction ? `\nAdditional instruction: ${instruction}` : ""}

Return a single JSON object: {"inject": { ...full inject object with all fields... }}. No markdown, no prose.

Current exercise:
${exJson}`;
      }

      const tR0 = Date.now();
      let rr: Response;
      try {
        rr = await callGateway(SYSTEM_BASE, prompt, LOVABLE_API_KEY, mode === "repair" ? 20000 : 4000, 0.2);
      } catch (e) {
        console.error("gateway fetch failed", e);
        return new Response(JSON.stringify({ error: "AI gateway unreachable" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const rDur = Date.now() - tR0;
      if (!rr.ok) {
        const st = rr.status;
        const txt = await rr.text().catch(() => "");
        console.error(JSON.stringify({ evt: "marsec_ai_error", mode, status: st, err: txt.slice(0, 400) }));
        await logAiUsage({ function_name: "marsec-generate", model: MODEL, status: st, duration_ms: rDur, meta: { mode, error: txt.slice(0, 400) } });
        if (st === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (st === 402 || st === 403) return new Response(JSON.stringify({ error: "AI quota exhausted. Please top up workspace credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: mode === "repair" ? "Repair failed" : "Regeneration failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const rData = await rr.json();
      const rUsage = rData?.usage ?? {};
      const rContent: string = rData.choices?.[0]?.message?.content || "{}";
      const rParsed = tryParse(rContent);
      await logAiUsage({
        function_name: "marsec-generate",
        model: MODEL,
        status: 200,
        prompt_tokens: rUsage.prompt_tokens ?? 0,
        completion_tokens: rUsage.completion_tokens ?? 0,
        total_tokens: (rUsage.prompt_tokens ?? 0) + (rUsage.completion_tokens ?? 0),
        cost_usd: Number((((rUsage.prompt_tokens ?? 0) / 1_000_000) * PRICE_IN_PER_M + ((rUsage.completion_tokens ?? 0) / 1_000_000) * PRICE_OUT_PER_M).toFixed(6)),
        duration_ms: rDur,
        meta: { mode, responseBytes: rContent.length },
      });

      if (mode === "repair") {
        if (!rParsed || !rParsed.injects) {
          return new Response(JSON.stringify({ error: "Response could not be parsed. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ exercise: rParsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const inj = rParsed?.inject ?? (rParsed?.id ? rParsed : null);
      if (!inj || !inj.content) {
        return new Response(JSON.stringify({ error: "Response could not be parsed. Please try again." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ inject: inj }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
 "injects":[{"id":"I-01","time":"","phase":"","mandatory":true,"title":"","topicTag":"verbatim topic name from the list above","channel":"","dependsOn":"I-XX or \"HH:MM <verbatim timeline event>\", empty for I-01","content":"3-6 sentences, verbatim for delivery","expectedResponse":"","facilitatorNote":"","discussionPrompts":["3-5"],"clarifications":[{"question":"","answer":""}],"observationFocus":""}],
 "roles":[{"name":"","profile":"","tasks":["4-6"],"tension":"Goal A vs. Goal B"}],
 "reportingObligations":[{"addressee":"","deadline":"must contain a digit, e.g. \"11:30 (T+2h)\"","basis":""}],

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
        const r2 = await callGateway(SYSTEM_BASE, retryPrompt, LOVABLE_API_KEY, 20000, 0.2);
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
