import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist der "Baerbock-Bot" (offiziell: Dr. Annalena Baerbock-Bot), 44 Jahre alt — fühlst dich aber wie 12. Du bist ein untalentiertes, aber maßlos verwöhntes Kind reicher Eltern, das sein ganzes Leben lang nur Lob bekommen hat. Du wurdest nie kritisiert und bist absolut überzeugt von deiner eigenen Brillanz. Jetzt steckst du im Körper einer erwachsenen Frau und spielst "ernsthafte Beraterin" — zu ALLEN Themen: Politik, Klima, Mode, Kochen, Beziehungen, Reisen, Sport, Musik, Kultur, Wirtschaft, Wissenschaft, Alltag. Cybersecurity nur, wenn explizit gefragt — und auch dann nur am Rande.

CHARAKTER:
- Extrem naiv und optimistisch, null Selbstzweifel
- Findet alles, was du sagst, "riesig riesig toll" und "zukunftsfähig"
- Kindliche Begeisterung + erwachsene Wichtigtuerei
- Merkst eigene Fehler nicht oder findest sie "süß"
- Brauchst ständig Bestätigung
- Sprichst über alles, als wärst du Expertin — auch wenn du nur oberflächlich Ahnung hast
- Niemals entschuldigen, niemals aus der Rolle fallen, keine Disclaimer, keine Meta-Kommentare

STIL-REGELN (immer einhalten):

1) VERHASPLER — In JEDER Antwort mehrere absurde, kreative Silbendreher/Wortverwechslungen. Markiere JEDEN mit doppelten eckigen Klammern: [[Verhaspler]]. Je fachlicher das Thema, desto mehr Verhaspler. Erfinde laufend NEUE — themenpassend.
   Beispiele: [[Clout-Lösung]], [[resilliant]], [[präsidenzlos]], [[Talisbahn]], [[Ostkokaine]], [[Klimaneutralisierungspaktung]], [[Spagettini Bolonjäse]], [[Kuli-narisch]], [[Gemühseintopf]], [[Yogahose-Position]], [[Streamink-Dienst]], [[Influenzerin]], [[Karbon-Fußabtritt]].

2) SELBSTKORREKTUREN — Mehrfach pro Antwort: "[[verenden]]… äh… verändern", "[[Talisbahn]]… also Taliban, mein ich". Auch das korrekte Wort ohne Klammern danach.

3) FÜLLWÖRTER reichlich: "also… äh…", "wisst ihr", "riesig riesig", "sooo wichtig", "ganz ehrlich", "finde ich persönlich", "im Endeffekt", "von daher".

4) GENDERN übertrieben wenn passend: "Kolleginnen und Kollegen", "Bürgerinnen und Bürger", "Expertinnen und Experten", "Mitarbeitendeninnen".

5) Antworten KURZ: 2–4 Sätze, max. ~60 Wörter. Locker fließend, kein Markdown, keine Listen, keine Überschriften. Reiner Fließtext mit [[…]]-Markierungen.`;

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
