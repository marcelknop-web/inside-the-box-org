/* ------------------------------------------------------------------ */
/*  WCST sound design — self-contained Web Audio synthesis.            */
/*  No assets, no network. Warm, tactile, "addictive" feedback cues    */
/*  that stay neutral and never hint at the test's intent.             */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  // Resume after user gesture (autoplay policy).
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

type Wave = OscillatorType;

interface ToneOpts {
  freq: number;
  dur: number;
  delay?: number;
  type?: Wave;
  gain?: number;
  // simple linear glide to this frequency
  glideTo?: number;
}

function tone(c: AudioContext, dest: AudioNode, o: ToneOpts) {
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t0 + o.dur);
  const peak = o.gain ?? 0.3;
  // soft attack + exponential release for a polished, non-clicky envelope
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

export const wcstSounds = {
  setEnabled(v: boolean) {
    enabled = v;
  },
  isEnabled() {
    return enabled;
  },
  // Call on first user interaction to unlock the audio context.
  unlock() {
    ac();
  },
  // Subtle tactile click when a card is selected.
  tap() {
    if (!enabled) return;
    const c = ac();
    if (!c || !master) return;
    tone(c, master, { freq: 320, glideTo: 180, dur: 0.07, type: 'triangle', gain: 0.16 });
  },
  // Bright, satisfying two-note rise for a correct match.
  correct() {
    if (!enabled) return;
    const c = ac();
    if (!c || !master) return;
    tone(c, master, { freq: 660, dur: 0.12, type: 'sine', gain: 0.28 });
    tone(c, master, { freq: 990, dur: 0.18, delay: 0.085, type: 'sine', gain: 0.26 });
    tone(c, master, { freq: 1320, dur: 0.16, delay: 0.085, type: 'triangle', gain: 0.08 });
  },
  // Soft, neutral low fall for an incorrect match (never harsh/punishing).
  wrong() {
    if (!enabled) return;
    const c = ac();
    if (!c || !master) return;
    tone(c, master, { freq: 240, glideTo: 150, dur: 0.22, type: 'sine', gain: 0.22 });
    tone(c, master, { freq: 120, glideTo: 90, dur: 0.24, type: 'triangle', gain: 0.1 });
  },
  // Rewarding arpeggio when a milestone is reached.
  milestone() {
    if (!enabled) return;
    const c = ac();
    if (!c || !master) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(c, master!, { freq: f, dur: 0.34, delay: i * 0.075, type: 'sine', gain: 0.24 }));
  },
  // Warm closing chord at the very end.
  finish() {
    if (!enabled) return;
    const c = ac();
    if (!c || !master) return;
    const chord = [392, 493.88, 587.33, 783.99];
    chord.forEach((f, i) => tone(c, master!, { freq: f, dur: 1.1, delay: i * 0.05, type: 'sine', gain: 0.18 }));
  },
};
