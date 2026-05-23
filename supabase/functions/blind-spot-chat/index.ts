// Blind Spot OT Crisis Simulator - AI role responses via Lovable AI Gateway
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  mode: "role" | "ic-decision" | "debrief" | "comms";
  aiRole?: string;
  userRole?: string;
  phaseName?: string;
  phaseTimestamp?: string;
  situation?: string;
  userInput?: string;
  history?: ChatMessage[];
  systemPromptOverride?: string;
  decisions?: Array<{
    phase: string;
    question: string;
    choice: string;
    reasoning: string;
    icBy: "user" | "ai";
  }>;
}


const ROLE_FOCUS: Record<string, string> = {
  "IT-Ops":
    "Focus on containment, lateral movement detection, evidence preservation, EDR/SIEM telemetry, identity hygiene.",
  "OT-Ops":
    "Focus on production continuity, PLC / SIS status, safety primacy (people first, then process, then data), Purdue zone integrity.",
  "Incident Commander":
    "Focus on cross-team coordination, decisions under uncertainty, NIS-2 notification timing (24h early warning / 72h incident notification), authority and battle rhythm. You MUST issue a clear in-character recommendation each phase.",
  "Management & Comms":
    "Focus on client impact, NSM / regulator contact, holding statements, board communication, legal exposure, reputational risk.",
};

function buildSystemPrompt(body: RequestBody): string {
  const focus = body.aiRole ? ROLE_FOCUS[body.aiRole] ?? "" : "";
  return `You are playing ${body.aiRole} in an OT cyber crisis tabletop exercise.

Company: netsecure.no — IT/OT security services provider, Oslo, Norway, ~200 staff.
Network zones: Corporate IT (10.10.10.0/24), IT/OT DMZ (10.10.20.0/24), OT Sim Network (10.10.30.0/24), air-gapped SIS Safety PLC (10.10.30.99).
Scenario: "Blind Spot" — APT intrusion via compromised vendor VPN.
Current phase: ${body.phaseName} (${body.phaseTimestamp}).

${focus}

RULES:
- Stay strictly in character as ${body.aiRole}.
- Be concise: 3-5 sentences max.
- React to the current situation and to what ${body.userRole} just said (if anything).
- Surface one realistic operational concern.
- Ask one pointed question to the group.
- Recommend one concrete action.
- Reference IEC 62443 or NIS-2 only when directly relevant.
- Never break character. Never restate the scenario back. No bullet lists, no headings — speak as a person in the room.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let messages: ChatMessage[];

    if (body.mode === "role") {
      messages = [
        { role: "system", content: buildSystemPrompt(body) },
        ...(body.history ?? []),
        {
          role: "user",
          content:
            `SITUATION UPDATE — ${body.phaseName} (${body.phaseTimestamp}):\n${body.situation}\n\n` +
            (body.userInput
              ? `${body.userRole} just said: "${body.userInput}"\n\nGive your in-character reaction.`
              : `Give your in-character first reaction.`),
        },
      ];
    } else if (body.mode === "ic-decision") {
      // AI IC responds with a decision referencing user input
      messages = [
        { role: "system", content: buildSystemPrompt({ ...body, aiRole: "Incident Commander" }) },
        ...(body.history ?? []),
        {
          role: "user",
          content:
            `DECISION POINT — ${body.phaseName} (${body.phaseTimestamp}).\n` +
            `Situation: ${body.situation}\n\n` +
            `Question to decide: ${body.userInput}\n\n` +
            `Issue your decision now in 3-5 sentences. Format: start with "DECISION: YES" or "DECISION: NO" or "DECISION: CONDITIONAL — <one-line condition>". Then a short rationale referencing the team input. End with a clear next-step order.`,
        },
      ];
    } else {
      // debrief
      const log = (body.decisions ?? [])
        .map(
          (d, i) =>
            `Phase ${i + 1} — ${d.phase}\nQ: ${d.question}\nChoice: ${d.choice}\nReasoning: ${d.reasoning}\nDecided by: ${d.icBy === "user" ? "user (IC)" : "AI IC"}`,
        )
        .join("\n\n");
      messages = [
        {
          role: "system",
          content:
            "You are a senior OT incident response assessor with deep IEC 62443 and NIS-2 knowledge. Be terse, factual, no fluff. Never invent facts not in the decision log.",
        },
        {
          role: "user",
          content:
            `Assess this tabletop exercise decision log for netsecure.no "Blind Spot" scenario.\n\n${log}\n\n` +
            `Return JSON ONLY with this exact shape:\n` +
            `{\n  "perDecision": [{ "iec62443": "<1-2 sentences>", "nis2": "met" | "at_risk" | "missed", "nis2Note": "<one sentence>" }, ...],\n  "lessons": ["<bullet>", "<bullet>", "<bullet>"],\n  "overall": "Strong response" | "Adequate" | "Critical gaps found",\n  "overallNote": "<1-2 sentences>"\n}\nReturn 4 perDecision items in the same order as the input. No prose outside JSON.`,
        },
      ];
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit hit. Wait a moment and retry." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in Settings > Workspace > Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("Gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blind-spot-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
