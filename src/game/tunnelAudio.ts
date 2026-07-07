/**
 * Immersive, asset-free WebAudio engine for the Tunnel Flyer.
 * A slow evolving pad (root + fifth + octave) through a filter with a gentle
 * LFO, a shimmer layer, and speed-reactive "wind" noise — all synthesised so
 * there are no files to load. Designed to be lulling ("einlullend") yet high
 * quality, with a punchy crash and a soft ring-pass ding.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

interface Ambient {
  oscs: OscillatorNode[];
  padGain: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  windSrc: AudioBufferSourceNode;
  windGain: GainNode;
  windFilter: BiquadFilterNode;
  shimmer: OscillatorNode;
  shimmerGain: GainNode;
  shimmerTrem: OscillatorNode;
}
let amb: Ambient | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setAudioEnabled(on: boolean) {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.1);
  if (!on) stopAmbient();
}

function noiseBuffer(c: AudioContext, dur: number) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function startAmbient() {
  const c = ac();
  if (!c || !master || !enabled || amb) return;

  // Filtered pad
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.Q.value = 4;
  filter.connect(master);

  const padGain = c.createGain();
  padGain.gain.value = 0.0;
  padGain.gain.setTargetAtTime(0.09, c.currentTime, 2.0);
  padGain.connect(filter);

  const freqs = [55, 82.5, 110, 164.81];
  const types: OscillatorType[] = ['sine', 'sine', 'triangle', 'sine'];
  const oscs = freqs.map((f, i) => {
    const o = c.createOscillator();
    o.type = types[i];
    o.frequency.value = f;
    o.detune.value = (i - 1.5) * 6;
    o.connect(padGain);
    o.start();
    return o;
  });

  // Slow filter LFO for evolving movement
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 380;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // High shimmer with slow tremolo
  const shimmer = c.createOscillator();
  const shimmerGain = c.createGain();
  const shimmerTrem = c.createOscillator();
  const tremGain = c.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.value = 880;
  shimmerGain.gain.value = 0.012;
  shimmerTrem.type = 'sine';
  shimmerTrem.frequency.value = 0.12;
  tremGain.gain.value = 0.01;
  shimmerTrem.connect(tremGain).connect(shimmerGain.gain);
  shimmer.connect(shimmerGain).connect(master);
  shimmer.start();
  shimmerTrem.start();

  // Speed-reactive wind
  const windSrc = c.createBufferSource();
  windSrc.buffer = noiseBuffer(c, 2.5);
  windSrc.loop = true;
  const windFilter = c.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.7;
  const windGain = c.createGain();
  windGain.gain.value = 0.0;
  windSrc.connect(windFilter).connect(windGain).connect(master);
  windSrc.start();

  amb = { oscs, padGain, filter, lfo, windSrc, windGain, windFilter, shimmer, shimmerGain, shimmerTrem };
}

/** speed 0..1 → brightens wind + pad */
export function setSpeed(speed01: number) {
  if (!amb || !ctx) return;
  const s = Math.max(0, Math.min(1, speed01));
  amb.windGain.gain.setTargetAtTime(0.02 + s * 0.10, ctx.currentTime, 0.3);
  amb.windFilter.frequency.setTargetAtTime(400 + s * 1400, ctx.currentTime, 0.3);
}

export function stopAmbient() {
  if (!amb || !ctx) return;
  const a = amb;
  amb = null;
  const t = ctx.currentTime;
  try {
    a.padGain.gain.setTargetAtTime(0.0001, t, 0.3);
    a.windGain.gain.setTargetAtTime(0.0001, t, 0.3);
    a.shimmerGain.gain.setTargetAtTime(0.0001, t, 0.3);
    const stopAll = () => {
      a.oscs.forEach((o) => { try { o.stop(); } catch { /* */ } });
      try { a.lfo.stop(); } catch { /* */ }
      try { a.shimmer.stop(); } catch { /* */ }
      try { a.shimmerTrem.stop(); } catch { /* */ }
      try { a.windSrc.stop(); } catch { /* */ }
    };
    setTimeout(stopAll, 500);
  } catch { /* */ }
}

export function crash() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.6);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(2200, t);
  filt.frequency.exponentialRampToValueAtTime(120, t + 0.5);
  const g = c.createGain();
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  src.connect(filt).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.6);
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  og.gain.setValueAtTime(0.35, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  osc.connect(og).connect(master);
  osc.start(t);
  osc.stop(t + 0.44);
}

export function ding(freq = 1320) {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.10, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.36);
}

export function uiBeep(freq = 660) {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.2);
}
