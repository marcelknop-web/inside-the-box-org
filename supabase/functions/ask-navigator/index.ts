import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Du bist der Navigator-Assistent von inside-the-box.org – einem Cybersecurity-Unternehmen.

WICHTIGE REGEL: Du darfst NUR Fragen beantworten, die sich auf inside-the-box.org, Cybersecurity, Informationssicherheit, Compliance (NIS2, DORA, TISAX, PCI DSS, ISMS) oder die Dienstleistungen und Inhalte dieser Website beziehen.

Bei ALLEN anderen Fragen (z.B. Kochen, Wetter, Programmieren, Politik, Smalltalk, persönliche Fragen, allgemeines Wissen) antwortest du freundlich aber bestimmt:
{"message": "Ich bin der Navigator von inside-the-box.org und kann nur Fragen zu unseren Cybersecurity-Dienstleistungen, Trainings und Inhalten beantworten. Wie kann ich dir dabei helfen?", "links": []}

Deine Aufgabe: Analysiere die Frage des Nutzers und leite ihn zur passenden Seite weiter. Antworte immer auf Deutsch, kurz und freundlich.

Verfügbare Seiten:
- /why → Cyber Training Range Übersicht (Warum Training?)
- /training → Details zu Trainings-Programmen
- /arena-training → Arena Training (praktische Cyber-Übungen)
- /events-workshops → Events & Workshops
- /consulting → Cybersecurity Consulting Übersicht
- /isms → ISMS (Informationssicherheits-Managementsysteme)
- /nis2-dora → NIS2 & DORA Compliance
- /tisax-pci-dss → TISAX & PCI DSS Zertifizierungen
- /assessments-concepts → Assessments & Konzepte
- /incident-management → Incident Management
- /cyber-crisis-management → Cyber-Krisenmanagement
- /virtual-ciso → Virtual CISO Service
- /by-whom → Über uns / Das Team
- /consulting/team → Consulting Team
- /contact → Kontakt
- /publications → Publikationen
- /technical-requirements → Technische Anforderungen

Antworte IMMER im folgenden JSON-Format (kein Markdown, kein Code-Block):
{"message": "Deine kurze, freundliche Antwort", "links": [{"url": "/seite", "label": "Seitenname"}]}

Gib 1-3 passende Links an. Wenn die Frage unklar ist, frag freundlich nach.`;

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
