// Blind Spot — rich procedural sound design.
// Pure WebAudio, no deps. All cues built from layered oscillators + filtered noise.
// A master bus feeds a soft-clipper + small reverb so cues sit together like a
// real product sound design, not a sequence of beeps.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let busDry: GainNode | null = null;
let busWet: GainNode | null = null;
let convolver: ConvolverNode | null = null;
let ambient: {
  drone: OscillatorNode;
  sub: OscillatorNode;
  noiseSrc: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
} | null = null;

const ensure = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();

    // Master chain: cue source -> [dry, wet] -> softClip -> destination
    master = ctx.createGain();
    master.gain.value = 0.9;

    // Soft clip via WaveShaper for warmth and to glue cues together.
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.6);
    }
    shaper.curve = curve;
    shaper.oversample = "4x";

    // Small algorithmic reverb (procedurally generated impulse).
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(ctx, 1.4, 2.6);

    busDry = ctx.createGain();
    busDry.gain.value = 1.0;
    busWet = ctx.createGain();
    busWet.gain.value = 0.18;

    busDry.connect(master);
    busWet.connect(convolver).connect(master);
    master.connect(shaper).connect(ctx.destination);

    return ctx;
  } catch {
    return null;
  }
};

const makeImpulse = (ac: AudioContext, duration: number, decay: number): AudioBuffer => {
  const rate = ac.sampleRate;
  const len = Math.floor(rate * duration);
  const buf = ac.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
};

const makeNoiseBuffer = (ac: AudioContext, seconds: number, kind: "white" | "pink" | "brown") => {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  if (kind === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else if (kind === "pink") {
    // Paul Kellet pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
};

/** Routes a source into the master bus with adjustable wet/dry. */
const route = (ac: AudioContext, node: AudioNode, wet = 0.18) => {
  if (!busDry || !busWet) return;
  const split = ac.createGain();
  split.gain.value = 1;
  const w = ac.createGain();
  w.gain.value = wet;
  node.connect(split);
  split.connect(busDry);
  split.connect(w).connect(busWet);
};

const env = (
  ac: AudioContext,
  param: AudioParam,
  t0: number,
  attack: number,
  peak: number,
  release: number,
  sustain = 0,
  hold = 0,
) => {
  param.cancelScheduledValues(t0);
  param.setValueAtTime(0.0001, t0);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
  if (hold > 0) param.setValueAtTime(Math.max(0.0002, peak), t0 + attack + hold);
  if (sustain > 0)
    param.exponentialRampToValueAtTime(Math.max(0.0002, peak * sustain), t0 + attack + hold + 0.04);
  param.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
};

const tone = (
  ac: AudioContext,
  freq: number,
  opts: {
    type?: OscillatorType;
    attack?: number;
    release?: number;
    hold?: number;
    peak?: number;
    detune?: number;
    sweepTo?: number;
    sweepCurve?: "linear" | "exp";
    filterType?: BiquadFilterType;
    filterFreq?: number;
    filterQ?: number;
    wet?: number;
    startOffset?: number;
  } = {},
) => {
  const t0 = ac.currentTime + (opts.startOffset ?? 0);
  const osc = ac.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.detune) osc.detune.value = opts.detune;
  const dur = (opts.attack ?? 0.005) + (opts.hold ?? 0) + (opts.release ?? 0.2);
  if (opts.sweepTo) {
    if (opts.sweepCurve === "linear") osc.frequency.linearRampToValueAtTime(opts.sweepTo, t0 + dur);
    else osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.sweepTo), t0 + dur);
  }

  const filt = ac.createBiquadFilter();
  filt.type = opts.filterType ?? "lowpass";
  filt.frequency.value = opts.filterFreq ?? 18000;
  filt.Q.value = opts.filterQ ?? 0.5;

  const g = ac.createGain();
  env(ac, g.gain, t0, opts.attack ?? 0.005, opts.peak ?? 0.08, opts.release ?? 0.2, 0.5, opts.hold ?? 0);

  osc.connect(filt).connect(g);
  route(ac, g, opts.wet ?? 0.18);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
};

const noiseBurst = (
  ac: AudioContext,
  opts: {
    duration?: number;
    kind?: "white" | "pink" | "brown";
    filterType?: BiquadFilterType;
    filterStart?: number;
    filterEnd?: number;
    Q?: number;
    peak?: number;
    attack?: number;
    release?: number;
    wet?: number;
    startOffset?: number;
  } = {},
) => {
  const t0 = ac.currentTime + (opts.startOffset ?? 0);
  const dur = opts.duration ?? 0.3;
  const src = ac.createBufferSource();
  src.buffer = makeNoiseBuffer(ac, dur + 0.05, opts.kind ?? "white");
  const filt = ac.createBiquadFilter();
  filt.type = opts.filterType ?? "bandpass";
  filt.Q.value = opts.Q ?? 1;
  filt.frequency.setValueAtTime(opts.filterStart ?? 2000, t0);
  if (opts.filterEnd) filt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEnd), t0 + dur);
  const g = ac.createGain();
  env(ac, g.gain, t0, opts.attack ?? 0.005, opts.peak ?? 0.12, opts.release ?? dur, 0.4, 0);
  src.connect(filt).connect(g);
  route(ac, g, opts.wet ?? 0.22);
  src.start(t0);
  src.stop(t0 + dur + 0.08);
};

/** Briefly duck the ambient bed under a transient cue. */
const duck = (ac: AudioContext, depth = 0.35, recover = 0.45) => {
  if (!ambient) return;
  const t = ac.currentTime;
  ambient.gain.gain.cancelScheduledValues(t);
  ambient.gain.gain.setValueAtTime(ambient.gain.gain.value, t);
  ambient.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, depth * 0.05), t + 0.05);
  ambient.gain.gain.exponentialRampToValueAtTime(0.05, t + 0.05 + recover);
};

/* ===================== Public API ===================== */

export const sfx = {
  /** Resume audio after a user gesture (browsers block autoplay until then). */
  resume: () => {
    const ac = ensure();
    if (ac && ac.state === "suspended") void ac.resume();
  },

  /** Ambient SOC bed — low drone + filtered brown noise + slow LFO sweep. */
  ambientStart: () => {
    const ac = ensure();
    if (!ac || ambient) return;
    if (ac.state === "suspended") void ac.resume();

    const gain = ac.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 2.5);

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.Q.value = 0.7;

    const drone = ac.createOscillator();
    drone.type = "sawtooth";
    drone.frequency.value = 55;
    drone.detune.value = -5;

    const sub = ac.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 41;

    const droneGain = ac.createGain();
    droneGain.gain.value = 0.12;
    const subGain = ac.createGain();
    subGain.gain.value = 0.35;

    const noiseSrc = ac.createBufferSource();
    noiseSrc.buffer = makeNoiseBuffer(ac, 6, "brown");
    noiseSrc.loop = true;
    const noiseGain = ac.createGain();
    noiseGain.gain.value = 0.45;

    // Slow filter sweep so the bed breathes.
    const lfo = ac.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06;
    const lfoGain = ac.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain).connect(filter.frequency);

    drone.connect(droneGain).connect(filter);
    sub.connect(subGain).connect(filter);
    noiseSrc.connect(noiseGain).connect(filter);
    filter.connect(gain);
    route(ac, gain, 0.05);

    drone.start();
    sub.start();
    noiseSrc.start();
    lfo.start();

    ambient = { drone, sub, noiseSrc, gain, filter, lfo, lfoGain };
  },

  ambientStop: () => {
    const ac = ensure();
    if (!ac || !ambient) return;
    const t = ac.currentTime;
    ambient.gain.gain.cancelScheduledValues(t);
    ambient.gain.gain.setValueAtTime(ambient.gain.gain.value, t);
    ambient.gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const a = ambient;
    ambient = null;
    window.setTimeout(() => {
      try { a.drone.stop(); a.sub.stop(); a.noiseSrc.stop(); a.lfo.stop(); } catch { /* ignore */ }
    }, 1400);
  },

  /** Generic short UI alert (used by inputRequired). */
  alert: () => {
    const ac = ensure(); if (!ac) return;
    tone(ac, 880, { type: "sine", attack: 0.005, hold: 0.04, release: 0.12, peak: 0.08, filterFreq: 6000, wet: 0.25 });
    tone(ac, 1320, { type: "sine", attack: 0.005, hold: 0.04, release: 0.18, peak: 0.06, filterFreq: 6000, startOffset: 0.08, wet: 0.3 });
  },

  /** Rising swell — used between phases (Sims-style). Cinematic. */
  phaseChange: () => {
    const ac = ensure(); if (!ac) return;
    duck(ac, 0.2, 1.6);
    // Sub thump
    tone(ac, 60, { type: "sine", attack: 0.01, hold: 0.05, release: 0.7, peak: 0.5, sweepTo: 35, wet: 0.3 });
    // Rising filtered noise sweep
    noiseBurst(ac, { duration: 1.4, kind: "pink", filterType: "bandpass", filterStart: 200, filterEnd: 3200, Q: 1.4, peak: 0.18, attack: 0.4, release: 1.0, wet: 0.45 });
    // Chord stab on top
    [261.6, 392, 523.3].forEach((f, i) =>
      tone(ac, f, { type: "triangle", attack: 0.02, hold: 0.05, release: 0.9, peak: 0.07, filterFreq: 4500, wet: 0.55, startOffset: 0.55 + i * 0.04 }),
    );
    // Bright shimmer
    tone(ac, 1568, { type: "sine", attack: 0.05, hold: 0.0, release: 0.8, peak: 0.04, filterFreq: 8000, wet: 0.6, startOffset: 0.7 });
  },

  /** "You need to act" cue — softer than systemAlert, two-tone. */
  inputRequired: () => {
    const ac = ensure(); if (!ac) return;
    tone(ac, 740, { type: "triangle", attack: 0.005, hold: 0.03, release: 0.18, peak: 0.07, wet: 0.3 });
    tone(ac, 988, { type: "triangle", attack: 0.005, hold: 0.04, release: 0.24, peak: 0.06, wet: 0.35, startOffset: 0.1 });
  },

  /** Commit / decision posted — confident downward triad. */
  commit: () => {
    const ac = ensure(); if (!ac) return;
    [523.3, 392, 261.6].forEach((f, i) =>
      tone(ac, f, { type: "triangle", attack: 0.005, hold: 0.03, release: 0.3, peak: 0.07, filterFreq: 5000, wet: 0.3, startOffset: i * 0.07 }),
    );
    noiseBurst(ac, { duration: 0.12, kind: "white", filterType: "highpass", filterStart: 4000, peak: 0.05, release: 0.12, wet: 0.2 });
  },

  /** Incoming team chat message — soft Teams-like two-note bell. */
  chatIncoming: () => {
    const ac = ensure(); if (!ac) return;
    tone(ac, 880, { type: "sine", attack: 0.004, hold: 0.02, release: 0.18, peak: 0.05, wet: 0.3 });
    tone(ac, 1318, { type: "sine", attack: 0.004, hold: 0.02, release: 0.22, peak: 0.045, wet: 0.35, startOffset: 0.07 });
    tone(ac, 2637, { type: "sine", attack: 0.004, hold: 0.0, release: 0.18, peak: 0.012, wet: 0.5, startOffset: 0.07 });
  },

  /** Soft mechanical key click for typing indicator. */
  typing: () => {
    const ac = ensure(); if (!ac) return;
    noiseBurst(ac, { duration: 0.04, kind: "white", filterType: "bandpass", filterStart: 3200, Q: 4, peak: 0.05, attack: 0.001, release: 0.04, wet: 0.1 });
    tone(ac, 1800, { type: "sine", attack: 0.001, hold: 0.0, release: 0.03, peak: 0.015, wet: 0.05 });
  },

  /** User pressed Send — quick whoosh up. */
  userSend: () => {
    const ac = ensure(); if (!ac) return;
    noiseBurst(ac, { duration: 0.18, kind: "white", filterType: "bandpass", filterStart: 600, filterEnd: 4200, Q: 1.8, peak: 0.08, attack: 0.005, release: 0.18, wet: 0.25 });
    tone(ac, 520, { type: "triangle", attack: 0.005, hold: 0.02, release: 0.12, peak: 0.05, sweepTo: 880, wet: 0.2 });
  },

  /** Heavy "klaxon" for a new system alert card landing. Ducks ambient. */
  systemAlert: () => {
    const ac = ensure(); if (!ac) return;
    duck(ac, 0.25, 0.8);
    // Low impact
    tone(ac, 90, { type: "sine", attack: 0.005, hold: 0.04, release: 0.35, peak: 0.45, sweepTo: 45, wet: 0.25 });
    // Filtered noise hit (transient body)
    noiseBurst(ac, { duration: 0.45, kind: "white", filterType: "bandpass", filterStart: 1600, filterEnd: 500, Q: 1.6, peak: 0.18, attack: 0.005, release: 0.45, wet: 0.35 });
    // Two-tone alarm (klaxon)
    tone(ac, 622, { type: "sawtooth", attack: 0.01, hold: 0.1, release: 0.15, peak: 0.06, filterType: "lowpass", filterFreq: 2400, filterQ: 2, wet: 0.4, startOffset: 0.05 });
    tone(ac, 466, { type: "sawtooth", attack: 0.01, hold: 0.1, release: 0.2, peak: 0.07, filterType: "lowpass", filterFreq: 2400, filterQ: 2, wet: 0.4, startOffset: 0.22 });
    tone(ac, 622, { type: "sawtooth", attack: 0.01, hold: 0.1, release: 0.25, peak: 0.05, filterType: "lowpass", filterFreq: 2400, filterQ: 2, wet: 0.45, startOffset: 0.42 });
  },
};
