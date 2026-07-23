/* ------------------------------------------------------------------ */
/*  Syndicate — sample-based spy/noir sound design.                     */
/*  Studio-quality SFX + music loop generated with ElevenLabs, served   */
/*  from the Lovable CDN. Uses the Web Audio API for low-latency,        */
/*  overlap-friendly, gain-controlled playback with sidechain-style      */
/*  music ducking, stereo widening and mastered mobile-speaker voicing.  */
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
import ambientAsset from "@/assets/syndicate/ambient.mp3.asset.json";
import heartbeatAsset from "@/assets/syndicate/heartbeat.mp3.asset.json";
import roundstartAsset from "@/assets/syndicate/roundstart.mp3.asset.json";

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
  | "transition"
  | "heartbeat"
  | "roundstart";

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
  heartbeat: heartbeatAsset.url,
  roundstart: roundstartAsset.url,
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
  heartbeat: 0.5,
  roundstart: 0.62,
};

// How aggressively each SFX ducks the music/ambient bed underneath it.
// 0 = no duck, 1 = full duck. Stingers duck hard so they read cinematic;
// ticks stay 1:1 with the bed so the roulette hum keeps its energy.
const SFX_DUCK: Record<SfxKey, number> = {
  tick: 0,
  land: 0.35,
  select: 0.15,
  spin: 0.25,
  win: 0.55,
  bigwin: 0.78,
  lose: 0.7,
  caught: 0.82,
  reveal: 0.4,
  transition: 0.55,
  heartbeat: 0.2,
  roundstart: 0.85,
};

/* ------------------------------------------------------------------ */
/*  Variation — keeps repeated cues from sounding mechanical.          */
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
  heartbeat: { pitch: 0.2, gain: 0.04 },
  roundstart: { pitch: 0.1, gain: 0.03 },
};

const TICK_STEPS = [0, 0.5, -0.4, 0.9, -0.2, 0.3];
let tickStep = 0;

const semitoneToRate = (semi: number) => Math.pow(2, semi / 12);
const jitter = (amt: number) => (Math.random() * 2 - 1) * amt;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bedBus: GainNode | null = null;   // music + ambient sit here (duckable)
let sfxBus: GainNode | null = null;   // one-shots sit here (dry)
let enabled = true;

const buffers = new Map<SfxKey, AudioBuffer>();
const loading = new Map<SfxKey, Promise<AudioBuffer | null>>();

// Background music + ambient bed (HTMLAudio — simplest reliable looping).
let musicEl: HTMLAudioElement | null = null;
let musicSrcNode: MediaElementAudioSourceNode | null = null;
let ambientEl: HTMLAudioElement | null = null;
let ambientSrcNode: MediaElementAudioSourceNode | null = null;

const MUSIC_TARGET = 0.62;
const AMBIENT_TARGET = 0.38;

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

    // Bed / SFX busses so we can duck the bed independently of stingers.
    bedBus = ctx.createGain();
    bedBus.gain.value = 1;
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 1;

    // Subtle stereo widening on the bed for a bigger cinematic room.
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const leftDelay = ctx.createDelay();
    leftDelay.delayTime.value = 0.012;
    bedBus.connect(splitter);
    splitter.connect(leftDelay, 0);
    leftDelay.connect(merger, 0, 0);
    splitter.connect(merger, 1, 1);
    merger.connect(master);
    sfxBus.connect(master);

    // --- Mobile-speaker voicing / mastering chain --------------------
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 190;
    highpass.Q.value = 0.7;

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.value = 260;
    lowShelf.gain.value = 1.5; // add a touch of warmth back

    const presence = ctx.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2600;
    presence.Q.value = 0.9;
    presence.gain.value = 4.5;

    const air = ctx.createBiquadFilter();
    air.type = "highshelf";
    air.frequency.value = 7000;
    air.gain.value = 2.8;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    comp.attack.value = 0.008;
    comp.release.value = 0.18;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.1;

    master
      .connect(highpass)
      .connect(lowShelf)
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

// Sidechain-style ducking on the bed bus — attack fast, recover slow so the
// music breathes back in after each stinger.
function duckBed(amount: number, holdMs: number) {
  if (!ctx || !bedBus) return;
  const now = ctx.currentTime;
  const g = bedBus.gain;
  const target = Math.max(0.08, 1 - amount);
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(target, now + 0.045);
  g.setValueAtTime(target, now + holdMs / 1000);
  g.linearRampToValueAtTime(1, now + holdMs / 1000 + 0.7);
}

function play(key: SfxKey, opts?: { pitchAdd?: number; gainMul?: number }) {
  if (!enabled) return;
  const c = ac();
  if (!c || !sfxBus) return;
  const start = (buf: AudioBuffer) => {
    if (!c || !sfxBus) return;
    const vary = SFX_VARY[key];

    let semi: number;
    if (key === "tick") {
      semi = TICK_STEPS[tickStep % TICK_STEPS.length] + jitter(0.25);
      tickStep++;
    } else {
      semi = jitter(vary.pitch);
    }
    semi += opts?.pitchAdd ?? 0;

    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = semitoneToRate(semi);
    if (src.detune) src.detune.value = jitter(6);

    const g = c.createGain();
    g.gain.value = Math.max(0.05, (SFX_GAIN[key] + jitter(vary.gain)) * (opts?.gainMul ?? 1));
    src.connect(g).connect(sfxBus);
    src.start();

    // Duck the bed for the length of the sample (max ~1.2s hold).
    const duck = SFX_DUCK[key];
    if (duck > 0) {
      const holdMs = Math.min(1200, buf.duration * 1000 * 0.55);
      duckBed(duck * (opts?.gainMul ?? 1), holdMs);
    }
  };
  const cached = buffers.get(key);
  if (cached) start(cached);
  else void load(key).then((buf) => buf && start(buf));
}

// Route an HTMLAudioElement into the bed bus (once), returning the source node.
function routeBed(el: HTMLAudioElement): MediaElementAudioSourceNode | null {
  const c = ac();
  if (!c || !bedBus) return null;
  try {
    const node = c.createMediaElementSource(el);
    node.connect(bedBus);
    return node;
  } catch {
    // Some browsers throw if the element is already connected — fall back to
    // element volume so at least the bed still plays.
    return null;
  }
}

function fadeElement(el: HTMLAudioElement, to: number, ms: number) {
  const start = el.volume;
  const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    el.volume = start + (to - start) * k;
    if (k < 1) requestAnimationFrame(step);
    else if (to === 0) el.pause();
  };
  requestAnimationFrame(step);
}

export const syndicateSounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (musicEl) musicEl.muted = !v;
    if (ambientEl) ambientEl.muted = !v;
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
  win(intensity = 0) {
    const i = Math.max(0, Math.min(1, intensity));
    play("win", { pitchAdd: i * 4, gainMul: 1 + i * 0.35 });
  },
  bigWin(intensity = 0) {
    const i = Math.max(0, Math.min(1, intensity));
    play("bigwin", { pitchAdd: i * 3, gainMul: 1 + i * 0.3 });
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
  heartbeat() {
    play("heartbeat");
  },
  roundStart() {
    play("roundstart");
  },
  startMusic() {
    if (typeof window === "undefined") return;
    if (!musicEl) {
      musicEl = new Audio(musicAsset.url);
      musicEl.loop = true;
      musicEl.preload = "auto";
      musicEl.crossOrigin = "anonymous";
      musicEl.volume = 0;
      musicSrcNode = routeBed(musicEl);
    }
    musicEl.muted = !enabled;
    void musicEl.play().then(() => fadeElement(musicEl!, MUSIC_TARGET, 1400)).catch(() => {});
    // Silence a "unused var" warning without changing runtime behavior.
    void musicSrcNode; void ambientSrcNode; void ambientAsset; void ambientEl;

  },
  stopMusic() {
    if (musicEl) fadeElement(musicEl, 0, 700);
    if (ambientEl) fadeElement(ambientEl, 0, 900);
  },
};
