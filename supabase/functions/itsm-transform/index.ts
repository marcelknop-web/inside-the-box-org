import { corsHeaders } from "@supabase/supabase-js/cors";

const SYSTEM_PROMPT = `You are an ITSM data transformation specialist. You receive raw data that was imported but doesn't match the expected ARLANXEO ITSM schema.

Your task: Transform the input data into the correct ITSM JSON format. Return ONLY valid JSON with no markdown, no explanation.

The expected top-level structure is:
{
  "services": [{ "group", "service", "subservice", "svc_type", "description", "criticality", "ci_type", "notes", "source", "id" }],
  "businessProcesses": [{ "id", "name", "category", "owner", "criticality", "regulatory", "rto", "rpo", "description" }],
  "userGroups": [{ "id", "name", "type", "department", "location", "count", "manager", "systems" }],
  "permissions": [{ "id", "groupId", "groupName", "service", "scope", "level", "authType", "provisioning", "certRequired", "sodFlag", "notes" }],
  "bpServiceMap": [{ "bpId", "service", "depType", "notes" }],
  "serviceDeps": [{ "upstream", "downstream", "depType", "notes" }]
}

Valid service groups: Business Applications, Microsoft Services, Identity & Security, Network Services, Infrastructure Services, Manufacturing & OT, Workplace Services, Communication Services, ITSM / ServiceNow
Valid svc_type: SaaS, Platform, SAP S/4HANA, OT Platform, Infrastructure, Business Application, Communication, Identity, SAP Tool
Valid criticality: High, Medium, Low
Valid BP categories: Manufacturing, Finance, HR, Sales, Procurement, Quality, EHS, IT Operations, Supply Chain, Trade Compliance
Valid user group types: Business, IT, Vendor, Management
Valid permission levels: Read, Read-Write, Admin, Privileged, Limited

Rules:
- Map any recognizable fields to the correct schema fields, even if names differ (e.g. "name" → "subservice", "priority" → "criticality")
- Generate missing IDs (SVC-NNN, BP-CAT-NNN, GRP-NNN, PERM-NNN)
- If a field value doesn't match the expected enum, map it to the closest valid value
- Preserve as much data as possible; put unmapped info into "notes"
- If the input is CSV-like (rows of data), parse and structure accordingly
- If the input is a flat list, infer the data type and create the right array
- Always return ALL 6 top-level keys (empty arrays for missing categories)`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { rawData, rawText, formatInfo } = await req.json();

    if (!rawData && !rawText) {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent = rawText
      ? `The user imported a file with this content:\n\n${rawText.slice(0, 12000)}`
      : `The user imported a JSON file but the format doesn't match. Here's what was detected:\n${formatInfo}\n\nRaw data:\n${JSON.stringify(rawData).slice(0, 12000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit – bitte in einer Minute erneut versuchen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Kontingent erschöpft." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI transformation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let jsonStr = raw.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start >= 0 && end > start) jsonStr = jsonStr.slice(start, end + 1);

    const transformed = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ transformed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("itsm-transform error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
