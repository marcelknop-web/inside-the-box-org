import { useCallback, useEffect, useRef, useState } from 'react';

import correctAsset from '@/assets/nordstern/correct.mp3.asset.json';
import wrongAsset from '@/assets/nordstern/wrong.mp3.asset.json';
import bellAsset from '@/assets/nordstern/bell.mp3.asset.json';
import foghornAsset from '@/assets/nordstern/foghorn.mp3.asset.json';
import thunderAsset from '@/assets/nordstern/thunder.mp3.asset.json';
import wavesAsset from '@/assets/nordstern/waves.mp3.asset.json';
import windAsset from '@/assets/nordstern/wind.mp3.asset.json';
import stormAsset from '@/assets/nordstern/storm.mp3.asset.json';

/**
 * Sample-based maritime sound design for Nordstern — same engine architecture
 * as the Syndicate game: studio-quality MP3 samples served from the Lovable
 * CDN, played through the Web Audio API with a mobile-speaker mastering chain
 * (highpass / presence / air / compressor / limiter), pitch/gain variation on
 * one-shots, and gain-controlled, cross-fadeable looping ambient beds.
 *
 * Public API is unchanged (ensure / playCorrect / playWrong / playBell /
 * playFoghorn / setWind / setStorm / muted / setMuted) so the page needs no
 * edits.
 */

type SfxKey = 'correct' | 'wrong' | 'bell' | 'foghorn' | 'thunder';
type LoopKey = 'waves' | 'wind' | 'storm';

const SFX_URL: Record<SfxKey, string> = {
  correct: correctAsset.url,
  wrong: wrongAsset.url,
  bell: bellAsset.url,
  foghorn: foghornAsset.url,
  thunder: thunderAsset.url,
};

const LOOP_URL: Record<LoopKey, string> = {
  waves: wavesAsset.url,
  wind: windAsset.url,
  storm: stormAsset.url,
};

const SFX_GAIN: Record<SfxKey, number> = {
  correct: 0.5,
  wrong: 0.5,
  bell: 0.55,
  foghorn: 0.6,
  thunder: 0.55,
};

const SFX_VARY: Record<SfxKey, { pitch: number; gain: number }> = {
  correct: { pitch: 0.3, gain: 0.05 },
  wrong: { pitch: 0.4, gain: 0.05 },
  bell: { pitch: 0.2, gain: 0.04 },
  foghorn: { pitch: 0.15, gain: 0.04 },
  thunder: { pitch: 0.7, gain: 0.06 },
};

const semitoneToRate = (semi: number) => Math.pow(2, semi / 12);
const jitter = (amt: number) => (Math.random() * 2 - 1) * amt;

const STORAGE_KEY = 'nordstern.audio.muted';

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  loopGain: Record<LoopKey, GainNode>;
  loopSrc: Partial<Record<LoopKey, AudioBufferSourceNode>>;
  buffers: Map<string, AudioBuffer>;
  loading: Map<string, Promise<AudioBuffer | null>>;
  thunderTimer: number | null;
};

export function useNordsternAudio() {
  const engineRef = useRef<Engine | null>(null);
  const [muted, setMutedState] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ensure = useCallback(async (): Promise<Engine | null> => {
    if (engineRef.current) {
      if (engineRef.current.ctx.state === 'suspended') {
        try { await engineRef.current.ctx.resume(); } catch { /* noop */ }
      }
      return engineRef.current;
    }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : 0.55;

      // --- Mobile-speaker voicing chain (mirrors Syndicate) ---
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 120; // keep some sea rumble but drop unusable sub
      highpass.Q.value = 0.7;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 2400;
      presence.Q.value = 0.9;
      presence.gain.value = 3.5;

      const air = ctx.createBiquadFilter();
      air.type = 'highshelf';
      air.frequency.value = 7000;
      air.gain.value = 2;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -2;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.1;

      master.connect(highpass).connect(presence).connect(air).connect(comp).connect(limiter).connect(ctx.destination);

      const loopGain: Record<LoopKey, GainNode> = {
        waves: ctx.createGain(),
        wind: ctx.createGain(),
        storm: ctx.createGain(),
      };
      (Object.keys(loopGain) as LoopKey[]).forEach((k) => {
        loopGain[k].gain.value = 0;
        loopGain[k].connect(master);
      });

      const engine: Engine = {
        ctx, master, loopGain, loopSrc: {},
        buffers: new Map(), loading: new Map(), thunderTimer: null,
      };
      engineRef.current = engine;

      // Warm-load everything, then start ambient beds.
      const startLoop = async (key: LoopKey) => {
        const buf = await loadBuffer(engine, key, LOOP_URL[key]);
        if (!buf || !engineRef.current || engine.loopSrc[key]) return;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(loopGain[key]);
        src.start();
        engine.loopSrc[key] = src;
      };
      startLoop('waves').then(() => {
        loopGain.waves.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 1.4);
      });
      startLoop('wind');
      startLoop('storm');
      (Object.keys(SFX_URL) as SfxKey[]).forEach((k) => void loadBuffer(engine, k, SFX_URL[k]));

      return engine;
    } catch (e) {
      console.warn('Nordstern audio init failed', e);
      return null;
    }
  }, []);

  const playSfx = useCallback(async (key: SfxKey, opts?: { rateMul?: number; gainMul?: number }) => {
    const e = await ensure(); if (!e) return;
    const start = (buf: AudioBuffer) => {
      const { ctx, master } = e;
      const vary = SFX_VARY[key];
      const semi = jitter(vary.pitch);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = semitoneToRate(semi) * (opts?.rateMul ?? 1);
      const g = ctx.createGain();
      g.gain.value = Math.max(0.05, (SFX_GAIN[key] + jitter(vary.gain)) * (opts?.gainMul ?? 1));
      src.connect(g).connect(master);
      src.start();
    };
    const cached = e.buffers.get(key);
    if (cached) start(cached);
    else { const b = await loadBuffer(e, key, SFX_URL[key]); if (b) start(b); }
  }, [ensure]);

  const playCorrect = useCallback(() => playSfx('correct'), [playSfx]);
  const playWrong = useCallback(() => playSfx('wrong'), [playSfx]);
  const playThunder = useCallback(() => playSfx('thunder'), [playSfx]);
  const playFoghorn = useCallback(() => playSfx('foghorn'), [playSfx]);

  // Keep the legacy signature (freq, dur, vol): map freq to a pitch offset and
  // vol to a gain multiplier so existing call sites keep their intent.
  const playBell = useCallback((freq = 880, _dur = 1.4, vol = 0.5) => {
    const rateMul = Math.max(0.5, Math.min(2, freq / 880));
    const gainMul = Math.max(0.3, Math.min(1.6, vol / 0.5));
    return playSfx('bell', { rateMul, gainMul });
  }, [playSfx]);

  const setWind = useCallback(async (bft: number) => {
    const e = await ensure(); if (!e) return;
    const target = Math.max(0, Math.min(0.34, (bft - 1) / 9 * 0.34));
    e.loopGain.wind.gain.linearRampToValueAtTime(target, e.ctx.currentTime + 0.9);
  }, [ensure]);

  const setStorm = useCallback(async (active: boolean) => {
    const e = await ensure(); if (!e) return;
    const t = e.ctx.currentTime;
    e.loopGain.storm.gain.linearRampToValueAtTime(active ? 0.3 : 0, t + 0.8);
    if (active && e.thunderTimer == null) {
      const tick = () => {
        if (!engineRef.current) return;
        void playThunder();
        const next = 6000 + Math.random() * 8000;
        engineRef.current.thunderTimer = window.setTimeout(tick, next);
      };
      e.thunderTimer = window.setTimeout(tick, 1500 + Math.random() * 2500);
    } else if (!active && e.thunderTimer != null) {
      clearTimeout(e.thunderTimer); e.thunderTimer = null;
    }
  }, [ensure, playThunder]);

  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* noop */ }
    const e = engineRef.current;
    if (e) e.master.gain.linearRampToValueAtTime(next ? 0 : 0.55, e.ctx.currentTime + 0.2);
  }, []);

  useEffect(() => () => {
    const e = engineRef.current;
    if (e) {
      if (e.thunderTimer != null) clearTimeout(e.thunderTimer);
      try { e.ctx.close(); } catch { /* noop */ }
      engineRef.current = null;
    }
  }, []);

  return { muted, setMuted, ensure, playCorrect, playWrong, playBell, playFoghorn, setWind, setStorm };
}

async function loadBuffer(engine: Engine, key: string, url: string): Promise<AudioBuffer | null> {
  if (engine.buffers.has(key)) return engine.buffers.get(key)!;
  if (engine.loading.has(key)) return engine.loading.get(key)!;
  const p = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((ab) => engine.ctx.decodeAudioData(ab))
    .then((buf) => { engine.buffers.set(key, buf); return buf; })
    .catch(() => null);
  engine.loading.set(key, p);
  return p;
}
