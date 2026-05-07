import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice presets — expressive, German-friendly
const VOICES: Record<string, string> = {
  lily: "pFZP5JQG7iQjIQuC4Bku",      // bright, energetic female
  matilda: "XrExE9yKIg1WjnnlVkGX",   // warm, mature female
  sarah: "EXAVITQu4vr4xnSDxMaL",     // soft, conversational female
  alice: "Xb7hH8MSUJpSbSDYk0k2",     // confident, articulate female
  jessica: "cgSgspJ2msm6clMCkdW9",   // expressive, dramatic female
  laura: "FGY2WhTYpPnrIDTdsKH5",     // upbeat, friendly female
};
const DEFAULT_VOICE = VOICES.matilda;

// Theatricalize text: insert pauses on self-corrections, fillers and [[verhaspler]]
// to make the voice feel more "Baerbock-haft" (hektisch, atemlos, moralisch).
function theatricalize(input: string): string {
  let t = input;

  // Strip [[ ]] markers but add a tiny stumble pause before the verhaspler
  t = t.replace(/\[\[(.*?)\]\]/g, (_m, w) => `… ${w}`);

  // Self-correction cues — add a beat before "also nicht", "sondern", "eigentlich"
  t = t.replace(/\b(also nicht|sondern|eigentlich|beziehungsweise|bzw\.?)\b/gi, "… $1");

  // Filler words get a short breath
  t = t.replace(/\b(ähm|äh|öhm|nun ja|also gut|ich meine)\b/gi, "$1 …");

  // Common Baerbock-style emphasis phrases — slight pause for moral weight
  t = t.replace(
    /\b(gerade jetzt|in dieser Zeit|an der Stelle|ganz ehrlich|wertebasiert|gemeinsam europäisch)\b/gi,
    "… $1 …"
  );

  // Long sentences with semicolons / dashes — make commas breathe
  t = t.replace(/\s—\s/g, " … ");

  // Multiple ellipses → single
  t = t.replace(/(?:…\s*){2,}/g, "… ");

  // Trim accidental leading ellipsis
  t = t.replace(/^\s*…\s*/, "");

  return t.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const text: unknown = body?.text;
    const voiceKey: string = typeof body?.voice === "string" ? body.voice : "";
    const voiceId = VOICES[voiceKey] || DEFAULT_VOICE;

    if (typeof text !== "string" || !text.trim() || text.length > 4000) {
      return new Response(JSON.stringify({ error: "invalid text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVEN) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY missing" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const spoken = theatricalize(text);

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spoken,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            // Lower stability → more dramatic prosody swings (perfect für Pathos)
            stability: 0.22,
            similarity_boost: 0.78,
            // High style → expressive, hektisch, moralisch aufgeladen
            style: 0.95,
            use_speaker_boost: true,
            // Slightly above neutral — atemlos, aber verständlich
            speed: 1.06,
          },
        }),
      }
    );
    if (!r.ok) {
      const t = await r.text();
      console.error("eleven error", r.status, t);
      return new Response(JSON.stringify({ fallback: true, reason: t.slice(0, 200) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = await r.arrayBuffer();
    return new Response(
      JSON.stringify({ audioContent: base64Encode(new Uint8Array(buf)), voice: voiceKey || "matilda" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("baerbock-tts", e);
    return new Response(JSON.stringify({ error: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
