import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Female, expressive German-friendly voice (Lily)
const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { text } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > 3000) {
      return new Response(JSON.stringify({ error: "invalid text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVEN) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY missing" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Strip [[ ]] markers before TTS
    const clean = text.replace(/\[\[(.*?)\]\]/g, "$1");

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clean,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.28, similarity_boost: 0.7, style: 0.85, use_speaker_boost: true, speed: 1.08 },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("eleven error", r.status, t);
      // Return 200 with fallback flag so client can use browser TTS instead of crashing
      return new Response(JSON.stringify({ fallback: true, reason: t.slice(0, 200) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = await r.arrayBuffer();
    return new Response(JSON.stringify({ audioContent: base64Encode(new Uint8Array(buf)) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("baerbock-tts", e);
    return new Response(JSON.stringify({ error: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
