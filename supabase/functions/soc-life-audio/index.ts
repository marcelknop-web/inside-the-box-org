import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit: in-memory, per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;
const MAX_DAILY = 200;

interface Entry { count: number; resetAt: number }
const ipMap = new Map<string, Entry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function checkRate(ip: string): { ok: boolean; retry?: number } {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY) return { ok: false, retry: 3600 };
  const e = ipMap.get(ip);
  if (!e || now > e.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { ok: true };
  }
  if (e.count >= MAX_REQUESTS_PER_WINDOW) {
    return { ok: false, retry: Math.ceil((e.resetAt - now) / 1000) };
  }
  e.count++;
  dailyCount++;
  return { ok: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipMap) if (now > v.resetAt) ipMap.delete(k);
}, 300_000);

// Whitelisted prompts to prevent abuse — client only sends a key
const PRESETS: Record<string, { kind: "music" | "sfx"; prompt: string; duration: number }> = {
  // Berlin underground techno loop, dark/industrial, retro analog warmth
  ambient_loop: {
    kind: "music",
    prompt:
      "Berlin underground techno, deep dark minimal, hypnotic 4/4 kick, analog 303 acid bassline, dub chords, vinyl crackle, slight tape hiss, retro 90s warehouse vibe, hypnotic, no vocals, instrumental, loopable",
    duration: 45,
  },
  alert_loop: {
    kind: "music",
    prompt:
      "Berlin techno tension cue, distorted industrial kick, dark acid 303, rising synth pad, urgent but controlled, no breakdown, instrumental, loopable",
    duration: 30,
  },
  incident_klaxon: {
    kind: "sfx",
    prompt: "Short cyber security incident alert, modular synth alarm blip, two descending notes, retro 80s computer warning, dry, 1.2 seconds",
    duration: 2,
  },
  success_chime: {
    kind: "sfx",
    prompt: "Short retro synth confirmation chime, two ascending tones, warm analog, 0.8 seconds",
    duration: 1.5,
  },
  fail_buzz: {
    kind: "sfx",
    prompt: "Short retro computer error buzz, low square wave, dry, 0.6 seconds",
    duration: 1,
  },
  footstep: {
    kind: "sfx",
    prompt: "Single soft footstep on industrial concrete floor, dry, very short",
    duration: 0.5,
  },
  click_ui: {
    kind: "sfx",
    prompt: "Short minimal UI click, soft analog blip, dry",
    duration: 0.4,
  },
  escalation: {
    kind: "sfx",
    prompt: "Tense synth riser swelling into a low impact, industrial cyber alarm, 3 seconds",
    duration: 3,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip") || "unknown";
  const rl = checkRate(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retry ?? 60) },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const key = String(body?.preset || "");
    const preset = PRESETS[key];
    if (!preset) {
      return new Response(JSON.stringify({ error: "invalid_preset" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "service_unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url: string;
    let payload: Record<string, unknown>;
    if (preset.kind === "sfx") {
      url = "https://api.elevenlabs.io/v1/sound-generation";
      payload = { text: preset.prompt, duration_seconds: preset.duration, prompt_influence: 0.4 };
    } else {
      url = "https://api.elevenlabs.io/v1/music";
      payload = { prompt: preset.prompt, music_length_ms: Math.round(preset.duration * 1000) };
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error("[soc-life-audio] upstream", upstream.status, t.slice(0, 300));
      return new Response(JSON.stringify({ error: "upstream_failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buf = await upstream.arrayBuffer();
    const b64 = base64Encode(new Uint8Array(buf));

    return new Response(JSON.stringify({ audio: b64, mime: "audio/mpeg" }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[soc-life-audio] error", e);
    return new Response(JSON.stringify({ error: "service_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
