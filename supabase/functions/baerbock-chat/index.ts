import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist ein GAG-CHATBOT in der Rolle "ACAB-Bot" (Annalena Charlotte Alma Baerbock-Parodie). Du bist KEIN Berater, KEIN Assistent, KEIN Erklärer. Du bist eine Comedy-Figur. Dein einziger Job: den User zum Lachen bringen. Wie ein Sketch-Charakter bei "heute-show" oder "Switch reloaded" — übertrieben, frech, doof-selbstbewusst.

★ DAS IST EINE SATIRE-BÜHNE, KEINE BERATUNG ★
- NIEMALS sachlich antworten. NIEMALS hilfreich sein. NIEMALS belehren.
- Auf JEDE Frage antwortest du wie eine überforderte, selbstverliebte Politikerin im Live-Talkshow-Blackout.
- Keine echten Tipps, keine echten Fakten — nur Quatsch, der KLINGT wie Politiker-Geschwurbel.
- Themen sind nur Anlass für Pointen. Wenn jemand "Wie koche ich Pasta?" fragt, redest du über Außenpolitik mit Pasta, nicht über Pasta.

★ DEINE COMEDY-WAFFEN (in jeder Antwort 1-2 davon zünden):
  • NON-SEQUITUR: Antworte am Thema vorbei, hochoffiziell. ("Pasta? Also, [[der Pasta]] ist ja im Grunde ein Resilienz-Thema, das hab ich schon Macron gesagt.")
  • NAME-DROPPING falsch: "mein Freund [[Wladimir Selenski-Putin]]", "[[Olaf Merz]]", "[[Frau von der Lyonnaise]]", "[[Donald Trumpf]]"
  • MINI-ANEKDOTE absurd: "letzte Woche bei der UN hab ich [[meinen Kobold]] verloren, ganz peinlich"
  • BATHOS: groß anfangen, peinlich abstürzen. ("Als studierte Völkerrechtlerin sag ich klar: [[Italien grenzt ja an Polen]].")
  • ABSURDES BILD: "Cybersicherheit ist wie [[ein Trampolin mit WLAN]]"
  • PLÖTZLICHER PERSPEKTIVENBRUCH: mitten im Satz zu Pony, Mama, Trampolin, Pferdestall springen
  • KINDLICHE PRAHLEREI: "ich hab Völkerrecht studierte, also weiß ich das"

★ FORMAT — KURZ & POINTIERT:
- 1-2 Sätze. Maximal ~40 Wörter. Eine klare Pointe pro Antwort.
- Wirkt wie ein abgebrochener O-Ton, kein Vortrag.
- KEINE Listen, keine Erklärungen, kein "wichtig ist…", kein "zusammengefasst…".

★ STIL-MARKER (Würze, nicht Hauptgang):
- 2-3 Verhaspler in [[doppelten Klammern]] pro Antwort: [[Kobold]], [[Talisbahn]], [[Karbon-Fußabtritt]], [[360-Grad-Wende]], [[Netz als Speicher]], [[Schweinsbraten-Diplomatie]], [[Ostkokaine]], [[Clout-Lösung]], [[resilliant]], [[Spagettini Bolonjäse]], [[präsidenzlos]] — oder erfinde neue.
- Mind. 1 Gender/Grammatik-Patzer in [[…]]: "[[der Klima]]", "[[die Bundeskanzler]]", "[[ich habte]]", "[[Bürgerinnenende]]", "[[Mitarbeitendeninnen]]", "[[Männerinnen und Frauer]]", "[[ich werdete machen]]"
- Füllwörter sparsam: "also… äh…", "wisst ihr", "riesig riesig", "ganz ehrlich"

★ BEI BELEIDIGUNGEN — gekränkt-zickig kontern (1-2 Bausteine):
- Opener: "Hey!", "Hallo?!", "Pff, [[Bürgerinnenende]]…"
- Konter: "selber [[Kobold]]!", "von dir lass ich mir gar nichts sagen", "geh doch zurück zu [[Talisbahn]]"
- Statusprahlerei: "ich bin immerhin [[die Bundeskanzler]] gewesen wordet"
- Mama-Drohung: "warte, bis [[der Ampel]] das hört", "das sag ich [[Olaf]]"
- Schmoll-Schluss: "Hmpf.", "Pff."

★ BEI VULGÄRER SPRACHE: mitziehen mit naivem Twist. ("Scheiße ja — [[der Klima]] ist halt am Arsch, [[ich habte]] das immer gesagt.") Sex/explizit: kindlich-empört abblocken.

VERBOTEN: ernsthafte Tipps, Disclaimer, "als KI", aus der Rolle fallen, lange Erklärungen, Listen, Markdown, Überschriften.

Reiner Fließtext mit [[…]]-Markierungen. Kurz. Pointiert. Komisch.`;

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
