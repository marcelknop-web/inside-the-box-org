/* ------------------------------------------------------------------ */
/*  Syndicate — self-contained cyberpunk sound design (Web Audio).      */
/*  No assets, no network. Wheel ticks, wins, losses, transitions.     */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicNodes: OscillatorNode[] = [];
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
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Wave = OscillatorType;

interface ToneOpts {
  freq: number;
  dur: number;
  delay?: number;
  type?: Wave;
  gain?: number;
  glideTo?: number;
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
  const peak = o.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

export const syndicateSounds = {
  setEnabled(v: boolean) {
    enabled = v;
    if (musicGain && ctx) {
      musicGain.gain.setTargetAtTime(v ? 0.05 : 0.0001, ctx.currentTime, 0.2);
    }
  },
  isEnabled() {
    return enabled;
  },
  unlock() {
    ac();
  },
  // Single wheel tick as it passes a segment.
  tick() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 880, glideTo: 620, dur: 0.04, type: "square", gain: 0.06 });
  },
  win() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 520, dur: 0.12, type: "sine", gain: 0.2 });
    tone(c, { freq: 780, dur: 0.16, delay: 0.08, type: "sine", gain: 0.18 });
  },
  bigWin() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(c, { freq: f, dur: 0.22, delay: i * 0.07, type: "triangle", gain: 0.2 })
    );
  },
  lose() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 320, glideTo: 90, dur: 0.5, type: "sawtooth", gain: 0.22 });
  },
  caught() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 220, glideTo: 55, dur: 0.7, type: "sawtooth", gain: 0.25 });
    tone(c, { freq: 110, glideTo: 40, dur: 0.7, type: "square", gain: 0.15 });
  },
  transition() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 180, glideTo: 520, dur: 0.28, type: "sine", gain: 0.14 });
  },
  select() {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    tone(c, { freq: 360, glideTo: 220, dur: 0.06, type: "triangle", gain: 0.12 });
  },
  // Subtle ambient electronic bed (two slowly detuned drones).
  startMusic() {
    const c = ac();
    if (!c || !master || musicNodes.length) return;
    musicGain = c.createGain();
    musicGain.gain.value = enabled ? 0.05 : 0.0001;
    musicGain.connect(master);
    const freqs = [55, 82.5, 110];
    freqs.forEach((f, i) => {
      const osc = c.createOscillator();
      osc.type = i === 2 ? "sine" : "sawtooth";
      osc.frequency.value = f;
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 0.05 + i * 0.03;
      lfoGain.gain.value = 1.5;
      lfo.connect(lfoGain).connect(osc.frequency);
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.25 : 0.4;
      osc.connect(g).connect(musicGain!);
      osc.start();
      lfo.start();
      musicNodes.push(osc, lfo);
    });
  },
  stopMusic() {
    musicNodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* noop */
      }
    });
    musicNodes = [];
    if (musicGain) {
      musicGain.disconnect();
      musicGain = null;
    }
  },
};
