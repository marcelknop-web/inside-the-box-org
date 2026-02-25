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
      de: {
        AL3: "AL3 – Erweiterter Audit (Prototypenschutz / hohe Vertraulichkeit)",
        AL2: "AL2 – Audit durch akkreditierten Prüfdienstleister erforderlich",
        AL1: "AL1 – Self-Assessment ausreichend",
        none: "Kein TISAX-Bedarf erkennbar",
        instruction: "Schreibe eine kurze, sachliche Begründung (3-4 Sätze) auf Deutsch",
      },
      en: {
        AL3: "AL3 – Extended audit (prototype protection / high confidentiality)",
        AL2: "AL2 – Audit by accredited provider required",
        AL1: "AL1 – Self-assessment sufficient",
        none: "No TISAX need identified",
        instruction: "Write a short, factual reasoning (3-4 sentences) in English",
      },
      fr: {
        AL3: "AL3 – Audit étendu (protection des prototypes / haute confidentialité)",
        AL2: "AL2 – Audit par prestataire accrédité requis",
        AL1: "AL1 – Auto-évaluation suffisante",
        none: "Aucun besoin TISAX identifié",
        instruction: "Rédigez une justification courte et factuelle (3-4 phrases) en français",
      },
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
              content: `Du bist ein TISAX- und Automotive-Security-Experte. Basierend auf den Antworten eines TISAX-Einstufungs-Checks und dem regelbasierten Ergebnis, ${lang.instruction}, warum die Organisation als "${verdictLabel}" eingestuft wird. Beziehe dich auf konkrete VDA ISA Kriterien und das ENX TISAX-Regelwerk. Antworte nur mit dem Begründungstext, keine Überschrift.`,
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
    console.error("tisax-reasoning error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
