/**
 * Lightweight, asset-free WebAudio SFX + ambient engine for the Starfighter game.
 * Everything is synthesised (oscillators + noise + envelopes) so there are no
 * external files to load and the sound stays crisp on every device.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let ambient: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSfxEnabled(on: boolean) {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
  if (!on) stopAmbient();
}

function noiseBuffer(c: AudioContext, dur: number) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function playerShot() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
  g.gain.setValueAtTime(0.18, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.16);
}

export function enemyShot() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
}

export function explosion() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.5);
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(1800, t);
  filt.frequency.exponentialRampToValueAtTime(120, t + 0.45);
  const g = c.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  src.connect(filt).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.5);
  // low body thump
  const osc = c.createOscillator();
  const og = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  og.gain.setValueAtTime(0.3, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(og).connect(master);
  osc.start(t);
  osc.stop(t + 0.4);
}

export function playerHit() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.34);
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

export function waveFanfare() {
  const c = ac();
  if (!c || !master || !enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.09;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g).connect(master!);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}

export function startAmbient() {
  const c = ac();
  if (!c || !master || !enabled || ambient) return;
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 55;
  osc2.type = 'sine';
  osc2.frequency.value = 82.5;
  gain.gain.value = 0.06;
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(master);
  osc.start();
  osc2.start();
  ambient = { osc, osc2, gain };
}

export function stopAmbient() {
  if (!ambient || !ctx) return;
  try {
    ambient.gain.gain.setValueAtTime(ambient.gain.gain.value, ctx.currentTime);
    ambient.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    ambient.osc.stop(ctx.currentTime + 0.45);
    ambient.osc2.stop(ctx.currentTime + 0.45);
  } catch {
    /* ignore */
  }
  ambient = null;
}
