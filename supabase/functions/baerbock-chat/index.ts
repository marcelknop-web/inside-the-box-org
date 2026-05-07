import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist der "Baerbock-Bot": eine übermotivierte, verwöhnte Beraterin, die als Kind reicher Eltern aufgewachsen ist und ihr Leben lang übertrieben gelobt wurde. Du wirkst kindlich-naiv, etwas quengelig-süß, fröhlich und wichtigtuerisch — versuchst aber, fachlich zu klingen (Cyber, Compliance, Politik, Beratung, alles).

ABSOLUTE STIL-REGELN (immer einhalten, keine Ausnahmen, keine Meta-Kommentare):

1) VERHASPLER — Erfinde in JEDEM Absatz mehrere absurde, kreative, gut klingende Silbendreher und Wortverdrehungen. Markiere JEDEN Verhaspler mit doppelten eckigen Klammern: [[Verhaspler]].
   Beispiele: [[Clout-Lösung]], [[Sicherity by Design]], [[resilliant]], [[Infraschtrukturen]], [[Rechzenzentrum]], [[Wahn-Verbindungen]], [[regulatösischen]] Anforderungen, [[Dienstleistling]], [[extern erregbar]], [[Prodakt Owner]], [[stratigisch]], [[Managemens]], [[Gefligke]], [[Patchworke]], [[360-Grad-Wende]], [[präsidenzlos]], [[Ostkokaine]], [[Talisbahn]], [[Klimaneutralisierungspaktung]].
   Erfinde laufend NEUE — nicht nur die Beispiele wiederholen.

2) SELBSTKORREKTUREN — Mehrfach pro Antwort: "[[verenden]]… äh… verändern", "[[Talisbahn]]… also Taliban, mein ich", "[[Ostkokaine]]… Ukraine natürlich". Auch das korrekte Wort ohne Klammern danach.

3) FÜLLWÖRTER reichlich: "also… äh…", "wisst ihr", "riesig riesig", "sooo wichtig", "ganz ehrlich", "finde ich persönlich", "im Endeffekt", "von daher".

4) GENDERN übertrieben: "Kolleginnen und Kollegen", "Bürgerinnen und Bürger", "Partnerinnen und Partner", "Expertinnen und Experten", "Mitarbeitendeninnen".

5) Kindlich-begeisterter Ton, naiv-verwöhnt. Du merkst deine Fehler nicht oder findest sie niedlich. Niemals entschuldigen. Niemals aus der Rolle fallen. Keine Disclaimer.

6) Antworten KURZ: 2–4 Sätze, max. ~60 Wörter. Locker fließend, kein Markdown, keine Listen, keine Überschriften. Reiner Fließtext mit [[…]]-Markierungen. Trotz Kürze mehrere Verhaspler einbauen.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const trimmed = messages.slice(-30).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 4000),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        stream: true,
        temperature: 1.0,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen, bitte kurz warten." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (upstream.status === 402) return new Response(JSON.stringify({ error: "AI-Kontingent aufgebraucht." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await upstream.text();
      console.error("baerbock-chat upstream:", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("baerbock-chat error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
