/* ------------------------------------------------------------------ */
/*  Syndicate — James-Bond-style spy/noir sound design (Web Audio).     */
/*  No assets, no network. Surf-guitar twang, brass stabs, walking      */
/*  jazz bass and the iconic minor-major "Bond chord".                  */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let seqTimer: ReturnType<typeof setInterval> | null = null;
let step = 0;
let enabled = true;

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
    master.gain.value = 0.5;
    // gentle master compression for a warm, "produced" feel
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 1);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

type Wave = OscillatorType;

interface ToneOpts {
  freq: number;
  dur: number;
  delay?: number;
  type?: Wave;
  gain?: number;
  glideTo?: number;
  attack?: number;
  vibrato?: number; // Hz depth for spy-guitar wobble
  dest?: AudioNode;
}

function tone(c: AudioContext, o: ToneOpts) {
  const dest = o.dest ?? master;
  if (!dest) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t0 + o.dur);
  // vibrato — the surf-guitar / spy wobble
  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = o.vibrato;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.dur + 0.05);
  }
  const peak = o.gain ?? 0.3;
  const atk = o.attack ?? 0.012;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

// Plucked "surf guitar" twang: detuned saw pair through a lowpass, with reverb tail.
function twang(c: AudioContext, freq: number, delay = 0, gain = 0.16, dest?: AudioNode) {
  const out = dest ?? master;
  if (!out) return;
  const t0 = c.currentTime + delay;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3200, t0);
  lp.frequency.exponentialRampToValueAtTime(700, t0 + 0.35);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  lp.connect(g).connect(out);
  [freq, freq * 1.003].forEach((f, i) => {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = f;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 5.5;
    lfoGain.gain.value = f * 0.006;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(lp);
    osc.start(t0 + i * 0.004);
    osc.stop(t0 + 0.5);
    lfo.start(t0);
    lfo.stop(t0 + 0.5);
  });
}

// Brass stab — the dramatic Bond horn hit.
function brass(c: AudioContext, freq: number, delay = 0, dur = 0.35, gain = 0.2, dest?: AudioNode) {
  const out = dest ?? master;
  if (!out) return;
  const t0 = c.currentTime + delay;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
  g.gain.setValueAtTime(gain, t0 + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1400, t0);
  lp.frequency.exponentialRampToValueAtTime(3200, t0 + 0.05);
  lp.frequency.exponentialRampToValueAtTime(1600, t0 + dur);
  lp.connect(g).connect(out);
  [freq * 0.5, freq, freq * 1.005].forEach((f) => {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f * 0.98, t0);
    osc.frequency.exponentialRampToValueAtTime(f, t0 + 0.05);
    osc.connect(lp);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  });
}

// Jazz percussion: brushed hi-hat / rim tick from filtered noise.
function hat(c: AudioContext, delay = 0, gain = 0.05, dur = 0.05, dest?: AudioNode) {
  const out = dest ?? master;
  if (!out) return;
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(hp).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const syndicateSounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (musicGain && ctx) {
      musicGain.gain.setTargetAtTime(v ? 0.09 : 0.0001, ctx.currentTime, 0.2);
    }
  },
  isEnabled() {
    return enabled;
  },
  unlock() {
    ac();
  },
  // Muted jazz rim-tick as the wheel passes a segment.
  tick() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    hat(c, 0, 0.06, 0.04);
    tone(c, { freq: 240, dur: 0.03, type: "triangle", gain: 0.05 });
  },
  // Small win — a two-note brass answer.
  win() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    brass(c, 392, 0, 0.22, 0.16); // G
    brass(c, 587, 0.11, 0.3, 0.16); // D
  },
  // Big win — the triumphant Bond-chord brass flourish (Em maj9-ish).
  bigWin() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    // rising run then the sustained "Bond chord": E G B D# F#
    [330, 392, 494].forEach((f, i) => brass(c, f, i * 0.09, 0.2, 0.14));
    [164.8, 196, 246.9, 311.1, 370].forEach((f) =>
      brass(c, f, 0.3, 0.7, 0.11)
    );
    hat(c, 0.3, 0.08, 0.4);
  },
  // Miss / low — noir descending brass sigh.
  lose() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    brass(c, 233, 0, 0.5, 0.18);
    tone(c, { freq: 233, glideTo: 110, dur: 0.55, type: "sawtooth", gain: 0.12 });
  },
  // Caught — dramatic minor "danger" sting.
  caught() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    brass(c, 220, 0, 0.6, 0.2);
    brass(c, 233, 0.05, 0.6, 0.16); // dissonant minor 2nd
    tone(c, { freq: 110, glideTo: 41, dur: 0.7, type: "sawtooth", gain: 0.16 });
  },
  // Scene change — cinematic cymbal swell + guitar twang.
  transition() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    hat(c, 0, 0.05, 0.5);
    twang(c, 246.9, 0.02, 0.13);
  },
  // UI select — a short muted guitar pluck.
  select() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    twang(c, 329.6, 0, 0.1);
  },
  // Cool noir spy bed: walking jazz bass, brushed hats + occasional guitar.
  startMusic() {
    const c = ac();
    if (!c || !master || seqTimer) return;
    musicGain = c.createGain();
    musicGain.gain.value = enabled ? 0.09 : 0.0001;
    musicGain.connect(master);

    // E minor walking bass line (spy-jazz), one note per step.
    const bass = [82.41, 98.0, 110.0, 123.47, 110.0, 98.0, 87.31, 73.42];
    const tempoMs = 340; // ~ moody mid-tempo
    step = 0;

    const playStep = () => {
      if (!c || !musicGain) return;
      const s = step % 8;
      // upright-ish bass pluck
      const bf = bass[s];
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      osc.type = "triangle";
      osc.frequency.value = bf;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc.connect(lp).connect(g).connect(musicGain);
      osc.start(t0);
      osc.stop(t0 + 0.35);

      // brushed hat on off-beats
      hat(c, 0.0, 0.03, 0.05, musicGain);
      if (s % 2 === 1) hat(c, tempoMs / 2000, 0.02, 0.04, musicGain);

      // occasional guitar twang / brass color every 2 bars
      if (s === 0 && step % 16 === 0) twang(c, 246.9, 0.1, 0.05, musicGain);
      if (s === 4 && step % 16 === 4) brass(c, 196, 0.05, 0.4, 0.05, musicGain);

      step++;
    };

    playStep();
    seqTimer = setInterval(playStep, tempoMs);
  },
  stopMusic() {
    if (seqTimer) {
      clearInterval(seqTimer);
      seqTimer = null;
    }
    if (musicGain) {
      try {
        musicGain.disconnect();
      } catch {
        /* noop */
      }
      musicGain = null;
    }
  },
};
