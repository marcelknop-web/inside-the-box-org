import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice presets — expressive, German-friendly
const VOICES: Record<string, string> = {
  lily: "pFZP5JQG7iQjIQuC4Bku",
  matilda: "XrExE9yKIg1WjnnlVkGX",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  alice: "Xb7hH8MSUJpSbSDYk0k2",
  jessica: "cgSgspJ2msm6clMCkdW9",
  laura: "FGY2WhTYpPnrIDTdsKH5",
};
const DEFAULT_VOICE = VOICES.matilda;
const VOICE_ID_RE = /^[A-Za-z0-9]{15,40}$/;

// Theatricalize text: hektisch, atemlos, moralisch aufgeladen.
// Mehr Pausen, mehr Atmer, mehr Stolperer für den Baerbock-Vibe.
function theatricalize(input: string): string {
  let t = input;

  // [[Verhaspler]] → kurzer Stolperer + Wort
  t = t.replace(/\[\[(.*?)\]\]/g, (_m, w) => `… ähm … ${w}`);

  // Self-correction cues
  t = t.replace(/\b(also nicht|sondern|eigentlich|beziehungsweise|bzw\.?|ich meine|ääähhh)\b/gi, "… $1");

  // Filler words → Atempause danach
  t = t.replace(/\b(ähm|äh|öhm|nun ja|also gut)\b/gi, "$1 …");

  // Moralisch aufgeladene Phrasen — Pause für Pathos
  t = t.replace(
    /\b(gerade jetzt|in dieser Zeit|in diesen Zeiten|an der Stelle|ganz ehrlich|ganz klar|wertebasiert|gemeinsam europäisch|regelbasiert|feministisch)\b/gi,
    "… $1 …"
  );

  // Satzanfänge mit "Also" → kleiner Beat
  t = t.replace(/^(Also|Wir müssen jetzt|In diesen Zeiten)\b/gi, "$1 …");

  // Em-dash → Pause
  t = t.replace(/\s—\s/g, " … ");

  // Komma vor "ääähhh" / "also"
  t = t.replace(/,\s*(also|ääähhh|äh|ähm)\b/gi, " … $1");

  // Mehrere Ellipsen kollabieren
  t = t.replace(/(?:…\s*){2,}/g, "… ");
  t = t.replace(/^\s*…\s*/, "");

  return t.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const text: unknown = body?.text;
    const voiceKey: string = typeof body?.voice === "string" ? body.voice : "";
    const customId: string = typeof body?.voiceId === "string" ? body.voiceId.trim() : "";

    let voiceId = DEFAULT_VOICE;
    if (customId && VOICE_ID_RE.test(customId)) voiceId = customId;
    else if (VOICES[voiceKey]) voiceId = VOICES[voiceKey];

    if (typeof text !== "string" || !text.trim() || text.length > 4000) {
      return new Response(JSON.stringify({ error: "invalid text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVEN) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY missing" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const spoken = theatricalize(text);

    // Streaming endpoint + turbo_v2_5 → schneller First-Byte
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.22,
            similarity_boost: 0.78,
            style: 0.95,
            use_speaker_boost: true,
            speed: 1.06,
          },
        }),
      }
    );
    if (!r.ok || !r.body) {
      const t = await r.text().catch(() => "");
      console.error("eleven error", r.status, t);
      return new Response(JSON.stringify({ fallback: true, reason: t.slice(0, 200) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(r.body, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("baerbock-tts", e);
    return new Response(JSON.stringify({ error: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
