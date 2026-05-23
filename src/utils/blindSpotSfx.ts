// Tiny WebAudio cue helper for the Blind Spot simulator.
// Pure functions, no React, no deps. Silently no-ops if AudioContext unavailable.

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
};

const beep = (freq: number, dur = 0.12, type: OscillatorType = "sine", gain = 0.06, startOffset = 0) => {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

export const sfx = {
  alert: () => {
    beep(880, 0.08, "square", 0.04);
    beep(660, 0.12, "square", 0.04, 0.09);
  },
  phaseChange: () => {
    beep(523, 0.16, "triangle", 0.05);
    beep(659, 0.16, "triangle", 0.05, 0.1);
    beep(784, 0.22, "triangle", 0.06, 0.2);
  },
  inputRequired: () => {
    beep(700, 0.1, "sine", 0.05);
    beep(1000, 0.16, "sine", 0.05, 0.08);
  },
  commit: () => {
    beep(440, 0.1, "triangle", 0.05);
    beep(330, 0.18, "triangle", 0.05, 0.08);
  },
};
