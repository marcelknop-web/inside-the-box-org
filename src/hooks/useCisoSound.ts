import { useCallback, useRef } from 'react';
import { createReverb } from './createReverb';

/**
 * Cybersecurity-themed sound design for CISO Budget Simulator.
 * Tense, industrial, digital aesthetic using Web Audio API.
 */
export function useCisoSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // Slider tick – short digital blip
  const playSliderTick = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }, []);

  // Budget confirm – digital lock sound with bass
  const playConfirm = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.25, now);
      master.connect(ctx.destination);

      // Two ascending digital tones
      [{ f: 440, t: 0 }, { f: 660, t: 0.1 }, { f: 880, t: 0.2 }].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + t);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now + t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.08, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.15);
        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start(now + t);
        osc.stop(now + t + 0.2);
      });

      // Sub bass thump
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, now);
      const subG = ctx.createGain();
      subG.gain.setValueAtTime(0.12, now);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      sub.connect(subG);
      subG.connect(master);
      sub.start(now);
      sub.stop(now + 0.35);
    } catch {}
  }, []);

  // Attack incoming – alarm siren + static burst
  const playAttackAlert = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.2, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 1.5, 2);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.2, now);
      reverb.connect(revG);
      revG.connect(master);

      // Alarm sweep
      const alarm = ctx.createOscillator();
      alarm.type = 'sawtooth';
      alarm.frequency.setValueAtTime(400, now);
      alarm.frequency.linearRampToValueAtTime(900, now + 0.3);
      alarm.frequency.linearRampToValueAtTime(400, now + 0.6);
      alarm.frequency.linearRampToValueAtTime(900, now + 0.9);
      const alarmFilter = ctx.createBiquadFilter();
      alarmFilter.type = 'lowpass';
      alarmFilter.frequency.setValueAtTime(1500, now);
      const alarmG = ctx.createGain();
      alarmG.gain.setValueAtTime(0, now);
      alarmG.gain.linearRampToValueAtTime(0.07, now + 0.05);
      alarmG.gain.setValueAtTime(0.07, now + 0.8);
      alarmG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      alarm.connect(alarmFilter);
      alarmFilter.connect(alarmG);
      alarmG.connect(master);
      alarmG.connect(reverb);
      alarm.start(now);
      alarm.stop(now + 1.3);

      // Digital static burst
      const bufSize = ctx.sampleRate;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) noiseData[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3000, now);
      noiseFilter.Q.setValueAtTime(2, now);
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0, now);
      noiseG.gain.linearRampToValueAtTime(0.04, now + 0.1);
      noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseG);
      noiseG.connect(master);
      noise.start(now);
      noise.stop(now + 0.9);

      // Low impact
      const impact = ctx.createOscillator();
      impact.type = 'sine';
      impact.frequency.setValueAtTime(55, now + 0.1);
      const impactG = ctx.createGain();
      impactG.gain.setValueAtTime(0.15, now + 0.1);
      impactG.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      impact.connect(impactG);
      impactG.connect(master);
      impact.start(now + 0.1);
      impact.stop(now + 0.7);
    } catch {}
  }, []);

  // Attack detected – tense but resolving
  const playDetected = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.2, now);
      master.connect(ctx.destination);

      // Warning tone → resolve
      [{ f: 330, t: 0 }, { f: 392, t: 0.15 }, { f: 523, t: 0.3 }].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.1, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.25);
        osc.connect(g);
        g.connect(master);
        osc.start(now + t);
        osc.stop(now + t + 0.3);
      });

      // Gentle ping (resolved)
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1047, now + 0.5);
      const pingG = ctx.createGain();
      pingG.gain.setValueAtTime(0.08, now + 0.5);
      pingG.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      ping.connect(pingG);
      pingG.connect(master);
      ping.start(now + 0.5);
      ping.stop(now + 1.0);
    } catch {}
  }, []);

  // Attack undetected – ominous impact
  const playUndetected = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.25, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 2, 1.5);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.3, now);
      reverb.connect(revG);
      revG.connect(master);

      // Dark descending drone
      const drone = ctx.createOscillator();
      drone.type = 'sawtooth';
      drone.frequency.setValueAtTime(200, now);
      drone.frequency.exponentialRampToValueAtTime(60, now + 1.0);
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(600, now);
      droneFilter.frequency.exponentialRampToValueAtTime(100, now + 1.0);
      const droneG = ctx.createGain();
      droneG.gain.setValueAtTime(0, now);
      droneG.gain.linearRampToValueAtTime(0.1, now + 0.05);
      droneG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      drone.connect(droneFilter);
      droneFilter.connect(droneG);
      droneG.connect(master);
      droneG.connect(reverb);
      drone.start(now);
      drone.stop(now + 1.3);

      // Impact hit
      const hit = ctx.createOscillator();
      hit.type = 'sine';
      hit.frequency.setValueAtTime(45, now);
      const hitG = ctx.createGain();
      hitG.gain.setValueAtTime(0.2, now);
      hitG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      hit.connect(hitG);
      hitG.connect(master);
      hit.start(now);
      hit.stop(now + 0.6);

      // Dissonant stab
      [155.6, 164.8].forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + 0.05);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now + 0.05);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + 0.05);
        g.gain.linearRampToValueAtTime(0.06, now + 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        g.connect(reverb);
        osc.start(now + 0.05);
        osc.stop(now + 0.9);
      });
    } catch {}
  }, []);

  // Game over – industrial crash
  const playGameOver = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.3, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 3, 1.5);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.35, now);
      reverb.connect(revG);
      revG.connect(master);

      // Massive low crash
      const crash = ctx.createOscillator();
      crash.type = 'sawtooth';
      crash.frequency.setValueAtTime(120, now);
      crash.frequency.exponentialRampToValueAtTime(30, now + 2.0);
      const crashFilter = ctx.createBiquadFilter();
      crashFilter.type = 'lowpass';
      crashFilter.frequency.setValueAtTime(800, now);
      crashFilter.frequency.exponentialRampToValueAtTime(60, now + 2.0);
      const crashG = ctx.createGain();
      crashG.gain.setValueAtTime(0.15, now);
      crashG.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      crash.connect(crashFilter);
      crashFilter.connect(crashG);
      crashG.connect(master);
      crashG.connect(reverb);
      crash.start(now);
      crash.stop(now + 2.6);

      // Noise burst (system failure)
      const bufSize = ctx.sampleRate * 2;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) noiseData[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = 'lowpass';
      nFilter.frequency.setValueAtTime(4000, now);
      nFilter.frequency.exponentialRampToValueAtTime(200, now + 1.5);
      const nG = ctx.createGain();
      nG.gain.setValueAtTime(0.08, now);
      nG.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      noise.connect(nFilter);
      nFilter.connect(nG);
      nG.connect(master);
      noise.start(now);
      noise.stop(now + 1.6);

      // Descending tritone
      [{ f: 185, t: 0.2 }, { f: 130.8, t: 0.5 }].forEach(({ f, t }) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + t);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now + t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.08, now + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.8);
        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        g.connect(reverb);
        osc.start(now + t);
        osc.stop(now + t + 0.9);
      });

      master.gain.setValueAtTime(0.3, now + 2.0);
      master.gain.linearRampToValueAtTime(0, now + 3.0);
    } catch {}
  }, []);

  // Victory – triumphant digital fanfare
  const playVictory = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.25, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 2, 1.8);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.3, now);
      reverb.connect(revG);
      revG.connect(master);

      // Ascending major arpeggio with digital timbre
      const notes = [
        { f: 262, t: 0, d: 0.2 },    // C4
        { f: 330, t: 0.12, d: 0.2 },  // E4
        { f: 392, t: 0.24, d: 0.2 },  // G4
        { f: 523, t: 0.36, d: 0.3 },  // C5
        { f: 659, t: 0.48, d: 0.3 },  // E5
        { f: 784, t: 0.6, d: 0.5 },   // G5
        { f: 1047, t: 0.75, d: 0.8 }, // C6
      ];

      notes.forEach(({ f, t, d }) => {
        for (const type of ['triangle', 'sine'] as OscillatorType[]) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(f, now + t);
          const g = ctx.createGain();
          const vol = type === 'triangle' ? 0.07 : 0.05;
          g.gain.setValueAtTime(0, now + t);
          g.gain.linearRampToValueAtTime(vol, now + t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(g);
          g.connect(master);
          g.connect(reverb);
          osc.start(now + t);
          osc.stop(now + t + d + 0.1);
        }
      });

      // Shimmer tail
      [1047, 1319, 1568, 2093].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + 0.8 + i * 0.06);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.04, now + 0.8 + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.3 + i * 0.06);
        osc.connect(g);
        g.connect(master);
        g.connect(reverb);
        osc.start(now + 0.8 + i * 0.06);
        osc.stop(now + 1.4 + i * 0.06);
      });

      master.gain.setValueAtTime(0.25, now + 1.5);
      master.gain.linearRampToValueAtTime(0, now + 2.2);
    } catch {}
  }, []);

  // Regulatory penalty – warning klaxon
  const playRegPenalty = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.15, now);
      master.connect(ctx.destination);

      // Two-tone klaxon
      for (let i = 0; i < 3; i++) {
        const t = i * 0.2;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 500 : 400, now + t);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now + t);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(0.08, now + t + 0.01);
        g.gain.linearRampToValueAtTime(0.08, now + t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.18);
        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start(now + t);
        osc.stop(now + t + 0.2);
      }
    } catch {}
  }, []);

  // Round start – digital boot-up sequence
  const playRoundStart = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.15, now);
      master.connect(ctx.destination);

      // Boot sequence beeps
      [600, 800, 1000, 1200].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.1, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.06);
        osc.connect(g);
        g.connect(master);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.08);
      });
    } catch {}
  }, []);

  return {
    playSliderTick,
    playConfirm,
    playAttackAlert,
    playDetected,
    playUndetected,
    playGameOver,
    playVictory,
    playRegPenalty,
    playRoundStart,
  };
}
