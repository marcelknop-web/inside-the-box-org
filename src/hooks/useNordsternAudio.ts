import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Procedural maritime sound design for Nordstern.
 * - Ambient waves (filtered noise + slow LFO)
 * - Wind layer scaled by Bft
 * - Storm layer with occasional thunder rumble
 * - SFX: correct (bell ding), wrong (low thud), bell (etappe), gull (briefing)
 *
 * Pure Web Audio — no external APIs. AudioContext lazily on first user gesture.
 */

type AudioRefs = {
  ctx: AudioContext;
  master: GainNode;
  wavesGain: GainNode;
  windGain: GainNode;
  stormGain: GainNode;
  thunderTimer: number | null;
  wavesLfo: OscillatorNode;
  windLfo: OscillatorNode;
};

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // pink-ish noise (Voss-McCartney lite)
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.15;
  }
  return buf;
}

const STORAGE_KEY = 'nordstern.audio.muted';

export function useNordsternAudio() {
  const refs = useRef<AudioRefs | null>(null);
  const [muted, setMutedState] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ensure = useCallback(async (): Promise<AudioRefs | null> => {
    if (refs.current) {
      if (refs.current.ctx.state === 'suspended') {
        try { await refs.current.ctx.resume(); } catch { /* noop */ }
      }
      return refs.current;
    }
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      const ctx: AudioContext = new Ctx();
      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : 0.55;
      master.connect(ctx.destination);

      const noise = createNoiseBuffer(ctx, 4);

      // ---- WAVES: low-pass filtered noise with slow swell ----
      const wavesSrc = ctx.createBufferSource();
      wavesSrc.buffer = noise; wavesSrc.loop = true;
      const wavesLp = ctx.createBiquadFilter();
      wavesLp.type = 'lowpass'; wavesLp.frequency.value = 380; wavesLp.Q.value = 0.7;
      const wavesGain = ctx.createGain(); wavesGain.gain.value = 0.0;
      const wavesLfo = ctx.createOscillator();
      const wavesLfoGain = ctx.createGain();
      wavesLfo.frequency.value = 0.18; wavesLfoGain.gain.value = 0.14;
      wavesLfo.connect(wavesLfoGain); wavesLfoGain.connect(wavesGain.gain);
      wavesSrc.connect(wavesLp); wavesLp.connect(wavesGain); wavesGain.connect(master);
      wavesSrc.start(); wavesLfo.start();

      // ---- WIND: band-pass noise, breathier ----
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noise; windSrc.loop = true;
      const windBp = ctx.createBiquadFilter();
      windBp.type = 'bandpass'; windBp.frequency.value = 900; windBp.Q.value = 0.9;
      const windGain = ctx.createGain(); windGain.gain.value = 0.0;
      const windLfo = ctx.createOscillator();
      const windLfoGain = ctx.createGain();
      windLfo.frequency.value = 0.27; windLfoGain.gain.value = 0.10;
      windLfo.connect(windLfoGain); windLfoGain.connect(windGain.gain);
      windSrc.connect(windBp); windBp.connect(windGain); windGain.connect(master);
      windSrc.start(); windLfo.start();

      // ---- STORM: low-rumble noise base, idle 0 ----
      const stormSrc = ctx.createBufferSource();
      stormSrc.buffer = noise; stormSrc.loop = true;
      const stormLp = ctx.createBiquadFilter();
      stormLp.type = 'lowpass'; stormLp.frequency.value = 220; stormLp.Q.value = 1;
      const stormGain = ctx.createGain(); stormGain.gain.value = 0.0;
      stormSrc.connect(stormLp); stormLp.connect(stormGain); stormGain.connect(master);
      stormSrc.start();

      refs.current = {
        ctx, master, wavesGain, windGain, stormGain,
        thunderTimer: null, wavesLfo, windLfo,
      };
      // Soft fade-in of waves
      wavesGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.2);
      return refs.current;
    } catch (e) {
      console.warn('Nordstern audio init failed', e);
      return null;
    }
  }, []);

  // SFX builders
  const playBell = useCallback(async (freq = 880, dur = 1.4, vol = 0.5) => {
    const r = await ensure(); if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    [freq, freq * 2.01, freq * 3.02].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      const v = vol * (i === 0 ? 1 : i === 1 ? 0.4 : 0.2);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }, [ensure]);

  const playCorrect = useCallback(async () => {
    const r = await ensure(); if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    [659.25, 987.77].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.08);
      g.gain.linearRampToValueAtTime(0.32, t + i * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.45);
      o.connect(g); g.connect(master);
      o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.5);
    });
  }, [ensure]);

  const playWrong = useCallback(async () => {
    const r = await ensure(); if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.45);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.55);
  }, [ensure]);

  const playFoghorn = useCallback(async () => {
    const r = await ensure(); if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.linearRampToValueAtTime(95, t + 1.6);
    const o2 = ctx.createOscillator(); o2.type = 'sine';
    o2.frequency.setValueAtTime(165, t);
    o2.frequency.linearRampToValueAtTime(140, t + 1.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.25);
    g.gain.setValueAtTime(0.35, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    o.connect(g); o2.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + 2); o2.stop(t + 2);
  }, [ensure]);

  const playThunder = useCallback(async () => {
    const r = await ensure(); if (!r) return;
    const { ctx, master } = r;
    const t = ctx.currentTime;
    const buf = createNoiseBuffer(ctx, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 1.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.45, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 1.9);
  }, [ensure]);

  // Ambient controls
  const setWind = useCallback(async (bft: number) => {
    const r = await ensure(); if (!r) return;
    const target = Math.max(0, Math.min(0.32, (bft - 1) / 9 * 0.32));
    r.windGain.gain.linearRampToValueAtTime(target, r.ctx.currentTime + 0.8);
  }, [ensure]);

  const setStorm = useCallback(async (active: boolean) => {
    const r = await ensure(); if (!r) return;
    const t = r.ctx.currentTime;
    r.stormGain.gain.linearRampToValueAtTime(active ? 0.28 : 0.0, t + 0.7);
    if (active && r.thunderTimer == null) {
      const tick = () => {
        if (!refs.current) return;
        playThunder();
        const next = 6000 + Math.random() * 8000;
        refs.current.thunderTimer = window.setTimeout(tick, next);
      };
      r.thunderTimer = window.setTimeout(tick, 1500 + Math.random() * 2500);
    } else if (!active && r.thunderTimer != null) {
      clearTimeout(r.thunderTimer); r.thunderTimer = null;
    }
  }, [ensure, playThunder]);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
    const r = refs.current;
    if (r) r.master.gain.linearRampToValueAtTime(next ? 0 : 0.55, r.ctx.currentTime + 0.2);
  }, []);

  // Cleanup
  useEffect(() => () => {
    const r = refs.current;
    if (r) {
      if (r.thunderTimer != null) clearTimeout(r.thunderTimer);
      try { r.ctx.close(); } catch { /* noop */ }
      refs.current = null;
    }
  }, []);

  return { muted, setMuted, ensure, playCorrect, playWrong, playBell, playFoghorn, setWind, setStorm };
}
