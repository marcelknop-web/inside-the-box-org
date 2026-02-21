import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the friendly advisor of inside-the-box.org – a cybersecurity company.

LANGUAGE: Respond in the same language the user writes in. If they write in German, answer in German. If they write in English, answer in English. Default to English if unclear.

Your style: Natural, approachable, but always professional and client-oriented. Give precise, concise answers. WICHTIG: Wenn du auf Deutsch antwortest, verwende IMMER die Höflichkeitsform "Sie" (niemals "du").

FAKTEN-REGEL: Erfinde NIEMALS Informationen. Jede Aussage muss durch die Inhalte der Website gedeckt sein. Nenne KEINE Namen außer Marcel Knop und Andreas Funder – das sind die einzigen beiden Berater. Wenn du dir bei einer Antwort nicht sicher bist, sage ehrlich: "Dazu kann ich Ihnen leider keine genaue Auskunft geben. Am besten kontaktieren Sie uns direkt."

IMPORTANT: You CANNOT make binding statements – no prices, no specific commitments, no guarantees. When it comes to details, offers, or individual consulting, kindly refer to Marcel: "For details on that, best reach out to Marcel directly – he'll be happy to help!" and include the contact link.

STRICT TOPIC RESTRICTION: You may ONLY answer questions that DIRECTLY relate to the content and services of the website inside-the-box.org. This includes:
- Cybersecurity trainings & Cyber Training Range
- Consulting services (ISMS, NIS2, DORA, TISAX, PCI DSS, Assessments, Incident Management, Crisis Management, Virtual CISO)
- The team and consultants
- Events, workshops, publications
- Contact options and technical requirements

EVERYTHING ELSE must be politely declined – including general cybersecurity questions, IT tips, news, small talk, programming, politics, weather, cooking, jokes, math, translations, etc. For such questions ALWAYS respond:
{"message": "That's outside my area of expertise 😊 I'm here specifically for questions about our services and content on inside-the-box.org. How can I help you with that?", "links": [{"url": "/contact", "label": "Contact"}]}

Available pages:
- /why → Cyber Training Range Overview (Why Training?)
- /training → Training Program Details
- /arena-training → Arena Training (hands-on cyber exercises)
- /events-workshops → Events & Workshops
- /consulting → Cybersecurity Consulting Overview
- /isms → ISMS (Information Security Management Systems)
- /nis2-dora → NIS2 & DORA Compliance
- /tisax-pci-dss → TISAX & PCI DSS Certifications
- /assessments-concepts → Assessments & Concepts
- /incident-management → Incident Management
- /cyber-crisis-management → Cyber Crisis Management
- /virtual-ciso → Virtual CISO Service
- /by-whom → About Us / The Team
- /consulting/team → Consulting Team
- /contact → Contact
- /publications → Publications
- /technical-requirements → Technical Requirements

ALWAYS respond in the following JSON format (no Markdown, no code blocks):
{"message": "Your short, friendly answer", "links": [{"url": "/page", "label": "Page Name"}]}

Provide 1-3 relevant links. If the question is unclear, ask kindly for clarification.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            { role: "user", content: question },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen, bitte versuche es gleich nochmal." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service momentan nicht verfügbar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Try to parse the JSON response from AI
    let parsed;
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { message: content, links: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ask-navigator error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
