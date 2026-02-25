import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, verdict, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langLabels: Record<string, Record<string, string>> = {
      de: { major: "MAJOR INCIDENT – Meldepflicht", borderline: "GRENZFALL – Rücksprache empfohlen", none: "Kein Major Incident", instruction: "Schreibe eine kurze, prägnante Begründung (2-3 Sätze) auf Deutsch" },
      en: { major: "MAJOR INCIDENT – Reporting obligation", borderline: "BORDERLINE – Consultation recommended", none: "No Major Incident", instruction: "Write a short, concise reasoning (2-3 sentences) in English" },
      fr: { major: "INCIDENT MAJEUR – Obligation de notification", borderline: "CAS LIMITE – Consultation recommandée", none: "Pas d'incident majeur", instruction: "Rédigez une justification courte et concise (2-3 phrases) en français" },
    };

    const lang = langLabels[language] || langLabels.de;
    const verdictLabel = lang[verdict] || lang.none;

    const answersText = Object.entries(answers)
      .map(([key, val]: [string, any]) => `${key}: ${val.label} (${val.value})`)
      .join("\n");

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
            {
              role: "system",
              content: `Du bist ein DORA-Regulierungsexperte. Basierend auf den Antworten eines Incident-Checks und dem regelbasierten Ergebnis, ${lang.instruction}, warum der Vorfall als "${verdictLabel}" eingestuft wird. Beziehe dich auf konkrete DORA Art. 19 Kriterien. Antworte nur mit dem Begründungstext, keine Überschrift.`,
            },
            {
              role: "user",
              content: `Ergebnis: ${verdictLabel}\n\nAntworten:\n${answersText}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zu viele Anfragen, bitte später erneut versuchen." }),
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
      throw new Error("AI service error");
    }

    const data = await response.json();
    const reasoning = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dora-reasoning error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
