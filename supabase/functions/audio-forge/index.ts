import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Preset =
  | { kind: "sfx"; prompt: string; duration: number }
  | { kind: "music"; prompt: string; duration: number }
  | { kind: "tts"; text: string };

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George – ruhig, professionell

const PRESETS: Record<string, Preset> = {
  // Abschluss-/Fertig-Signal
  complete: {
    kind: "sfx",
    prompt: "Premium software completion cue, two soft ascending bell tones with subtle warm pad tail, clean studio quality, no reverb tail longer than one second",
    duration: 2,
  },
  // Ambiences
  amb_ops: {
    kind: "music",
    prompt: "Calm professional operations centre ambience, deep low drone, subtle server room air, soft slow synth pad, no drums, no melody, neutral corporate, loopable, instrumental",
    duration: 40,
  },
  amb_maritime: {
    kind: "music",
    prompt: "Calm maritime bridge ambience, deep ship engine hum, distant sea swell, low sub drone, sparse sonar-like pings, no drums, no melody, cinematic and restrained, loopable, instrumental",
    duration: 40,
  },
  amb_bank: {
    kind: "music",
    prompt: "Understated institutional ambience, warm low pad, quiet room tone, very sparse piano-like single notes, restrained and trustworthy, no drums, loopable, instrumental",
    duration: 40,
  },
  // Sprach-Ansagen (DE, sachlich)
  v_start: { kind: "tts", text: "Erfassung gestartet. Bitte den Schritten der Reihe nach folgen." },
  v_step: { kind: "tts", text: "Schritt abgeschlossen." },
  v_blocker: { kind: "tts", text: "Blocker gefunden. Bitte vor dem Export beheben." },
  v_ready: { kind: "tts", text: "Dokumente sind erstellt und stehen zum Download bereit." },
  v_exercise: { kind: "tts", text: "Übung generiert. Qualitätsprüfung abgeschlossen." },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const preset = PRESETS[String(body?.preset || "")];
    if (!preset) {
      return new Response(JSON.stringify({ error: "invalid_preset" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("ELEVENLABS_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url: string;
    let payload: Record<string, unknown>;
    if (preset.kind === "sfx") {
      url = "https://api.elevenlabs.io/v1/sound-generation";
      payload = { text: preset.prompt, duration_seconds: preset.duration, prompt_influence: 0.4 };
    } else if (preset.kind === "music") {
      url = "https://api.elevenlabs.io/v1/music";
      payload = { prompt: preset.prompt, music_length_ms: Math.round(preset.duration * 1000) };
    } else {
      url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;
      payload = {
        text: preset.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.6, similarity_boost: 0.75, use_speaker_boost: true, speed: 1.0 },
      };
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify(payload),
    });
    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("[audio-forge] upstream", upstream.status, t.slice(0, 300));
      return new Response(JSON.stringify({ error: "upstream_failed", status: upstream.status, details: t.slice(0, 500) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buf = await upstream.arrayBuffer();
    return new Response(JSON.stringify({ audio: base64Encode(new Uint8Array(buf)), mime: "audio/mpeg" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[audio-forge] error", e);
    return new Response(JSON.stringify({ error: "service_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
