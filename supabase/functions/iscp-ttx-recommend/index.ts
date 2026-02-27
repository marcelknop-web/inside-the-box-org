import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { iscps, language = "de" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const iscpSummary = iscps
      .map((i: any) => `- ${i.name}: Score ${i.score}, Maturity Level ${i.maturityLevel}, Letzter Test: ${i.lastTested}, Faktoren: BI=${i.factors.BI} TLT=${i.factors.TLT} CP=${i.factors.CP} AF=${i.factors.AF} PI=${i.factors.PI}`)
      .join("\n");

    const langMap: Record<string, string> = {
      de: "Antworte strukturiert auf Deutsch.",
      en: "Answer in structured English.",
      fr: "Réponds de manière structurée en français.",
    };

    const systemPrompt = `Du bist ein erfahrener Cybersecurity-Berater für Tabletop Exercises (TTX).
Analysiere die ISCP-Scores und antworte KURZ und PRÄGNANT:

1. **Priorisierung** — Liste die ISCPs nach Dringlichkeit. Pro ISCP maximal 5 Wörter Begründung.
2. **Szenario** — Ein realistisches Angriffsszenario in 3–4 Sätzen, das die kritischsten ISCPs abdeckt.

Keine langen Erklärungen. Keine Maturity-Level-Analyse. Verwende → als Aufzählungszeichen, KEINE * oder - Bullets.
${langMap[language] || langMap.de}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hier sind die aktuellen ISCP-Daten:\n\n${iscpSummary}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "Keine Empfehlung generiert.";

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("iscp-ttx-recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
