/* ------------------------------------------------------------------ */
/*  Syndicate — sample-based spy/noir sound design.                     */
/*  Studio-quality SFX + music loop generated with ElevenLabs, served   */
/*  from the Lovable CDN. Uses the Web Audio API for low-latency,        */
/*  overlap-friendly, gain-controlled playback.                         */
/* ------------------------------------------------------------------ */

import tickAsset from "@/assets/syndicate/tick.mp3.asset.json";
import landAsset from "@/assets/syndicate/land.mp3.asset.json";
import selectAsset from "@/assets/syndicate/select.mp3.asset.json";
import spinAsset from "@/assets/syndicate/spin.mp3.asset.json";
import winAsset from "@/assets/syndicate/win.mp3.asset.json";
import bigwinAsset from "@/assets/syndicate/bigwin.mp3.asset.json";
import loseAsset from "@/assets/syndicate/lose.mp3.asset.json";
import caughtAsset from "@/assets/syndicate/caught.mp3.asset.json";
import revealAsset from "@/assets/syndicate/reveal.mp3.asset.json";
import transitionAsset from "@/assets/syndicate/transition.mp3.asset.json";
import musicAsset from "@/assets/syndicate/music.mp3.asset.json";

type SfxKey =
  | "tick"
  | "land"
  | "select"
  | "spin"
  | "win"
  | "bigwin"
  | "lose"
  | "caught"
  | "reveal"
  | "transition";

const SFX_URL: Record<SfxKey, string> = {
  tick: tickAsset.url,
  land: landAsset.url,
  select: selectAsset.url,
  spin: spinAsset.url,
  win: winAsset.url,
  bigwin: bigwinAsset.url,
  lose: loseAsset.url,
  caught: caughtAsset.url,
  reveal: revealAsset.url,
  transition: transitionAsset.url,
};

// Per-effect playback gain so nothing clips and stingers sit above ticks.
const SFX_GAIN: Record<SfxKey, number> = {
  tick: 0.22,
  land: 0.42,
  select: 0.32,
  spin: 0.4,
  win: 0.5,
  bigwin: 0.56,
  lose: 0.48,
  caught: 0.52,
  reveal: 0.42,
  transition: 0.38,
};

/* ------------------------------------------------------------------ */
/*  Variation — keeps repeated cues from sounding mechanical.          */
/*  `pitch` = max ± semitone spread, `gain` = max ± linear jitter.     */
/*  Stingers (win/bigwin/lose/caught) stay tight so they read as       */
/*  deliberate; frequent, incidental cues get more life.               */
/* ------------------------------------------------------------------ */
const SFX_VARY: Record<SfxKey, { pitch: number; gain: number }> = {
  tick: { pitch: 1.4, gain: 0.12 },
  land: { pitch: 0.9, gain: 0.08 },
  select: { pitch: 1.2, gain: 0.1 },
  spin: { pitch: 0.6, gain: 0.06 },
  win: { pitch: 0.3, gain: 0.05 },
  bigwin: { pitch: 0.15, gain: 0.04 },
  lose: { pitch: 0.4, gain: 0.05 },
  caught: { pitch: 0.3, gain: 0.05 },
  reveal: { pitch: 0.7, gain: 0.06 },
  transition: { pitch: 0.5, gain: 0.05 },
};

// Rotating pitch offsets (in semitones) so consecutive ticks alternate
// instead of hammering the exact same tone — classic "roulette" feel.
const TICK_STEPS = [0, 0.5, -0.4, 0.9, -0.2, 0.3];
let tickStep = 0;

const semitoneToRate = (semi: number) => Math.pow(2, semi / 12);
const jitter = (amt: number) => (Math.random() * 2 - 1) * amt;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

const buffers = new Map<SfxKey, AudioBuffer>();
const loading = new Map<SfxKey, Promise<AudioBuffer | null>>();

// Background music (HTMLAudio — simplest reliable looping across browsers).
let musicEl: HTMLAudioElement | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.42;


    // --- Mobile-speaker voicing chain ---------------------------------
    // Tiny phone speakers can't reproduce sub-bass and turn it into mud
    // or wasted headroom. Roll off lows, lift presence/"air" so cues cut
    // through, then compress + soft-limit for consistent perceived level.
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 190; // drop energy the speaker can't play
    highpass.Q.value = 0.7;

    const presence = ctx.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2600; // where small speakers project best
    presence.Q.value = 0.9;
    presence.gain.value = 4.5;

    const air = ctx.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 7000;
    air.gain.value = 2.5;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.1;

    master
      .connect(highpass)
      .connect(presence)
      .connect(air)
      .connect(comp)
      .connect(limiter)
      .connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

async function load(key: SfxKey): Promise<AudioBuffer | null> {
  const c = ac();
  if (!c) return null;
  if (buffers.has(key)) return buffers.get(key)!;
  if (loading.has(key)) return loading.get(key)!;
  const p = fetch(SFX_URL[key])
    .then((r) => r.arrayBuffer())
    .then((ab) => c.decodeAudioData(ab))
    .then((buf) => {
      buffers.set(key, buf);
      return buf;
    })
    .catch(() => null);
  loading.set(key, p);
  return p;
}

function play(key: SfxKey, opts?: { pitchAdd?: number; gainMul?: number }) {
  if (!enabled) return;
  const c = ac();
  if (!c || !master) return;
  const start = (buf: AudioBuffer) => {
    if (!c || !master) return;
    const vary = SFX_VARY[key];

    // Pitch: rotate ticks through a fixed cadence, jitter everything else.
    let semi: number;
    if (key === "tick") {
      semi = TICK_STEPS[tickStep % TICK_STEPS.length] + jitter(0.25);
      tickStep++;
    } else {
      semi = jitter(vary.pitch);
    }

    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = semitoneToRate(semi);
    if (src.detune) src.detune.value = jitter(6); // subtle extra shimmer

    const g = c.createGain();
    g.gain.value = Math.max(0.05, SFX_GAIN[key] + jitter(vary.gain));
    src.connect(g).connect(master);
    src.start();
  };
  const cached = buffers.get(key);
  if (cached) start(cached);
  else void load(key).then((buf) => buf && start(buf));
}

export const syndicateSounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (musicEl) musicEl.muted = !v;
  },
  isEnabled() {
    return enabled;
  },
  // Called on first user gesture — unlock audio + warm the SFX cache.
  unlock() {
    ac();
    (Object.keys(SFX_URL) as SfxKey[]).forEach((k) => void load(k));
  },
  tick() {
    play("tick");
  },
  win() {
    play("win");
  },
  bigWin() {
    play("bigwin");
  },
  lose() {
    play("lose");
  },
  caught() {
    play("caught");
  },
  spinStart() {
    play("spin");
  },
  land() {
    play("land");
  },
  reveal() {
    play("reveal");
  },
  transition() {
    play("transition");
  },
  select() {
    play("select");
  },
  startMusic() {
    if (typeof window === "undefined") return;
    if (!musicEl) {
      musicEl = new Audio(musicAsset.url);
      musicEl.loop = true;
      musicEl.volume = 0.62;
      musicEl.preload = "auto";

    }
    musicEl.muted = !enabled;
    void musicEl.play().catch(() => {
      /* autoplay may be blocked until a gesture; retried on next call */
    });
  },
  stopMusic() {
    if (musicEl) {
      musicEl.pause();
      musicEl.currentTime = 0;
    }
  },
};
