import { useCallback, useRef } from 'react';

/**
 * Synthesizes a dramatic "Who Wants to Be a Millionaire" style
 * question-reveal stinger using the Web Audio API.
 */
export function useMillionaireSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playQuestionReveal = useCallback(() => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Master gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.25, now);
      master.connect(ctx.destination);

      // --- Rising dramatic tone (signature WWM "ding-ding-ding-DING") ---
      const notes = [
        { freq: 440, start: 0, dur: 0.15 },    // A4
        { freq: 554, start: 0.18, dur: 0.15 },  // C#5
        { freq: 659, start: 0.36, dur: 0.15 },  // E5
        { freq: 880, start: 0.54, dur: 0.4 },   // A5 (held longer)
      ];

      notes.forEach(({ freq, start, dur }) => {
        // Main tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.3, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);

        // Harmonic overtone for shimmer
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now + start);

        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now + start);
        gain2.gain.linearRampToValueAtTime(0.08, now + start + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + start + dur * 0.8);

        osc2.connect(gain2);
        gain2.connect(master);
        osc2.start(now + start);
        osc2.stop(now + start + dur + 0.05);
      });

      // --- Low dramatic pad underneath ---
      const pad = ctx.createOscillator();
      pad.type = 'sawtooth';
      pad.frequency.setValueAtTime(110, now);

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(300, now);

      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, now);
      padGain.gain.linearRampToValueAtTime(0.06, now + 0.2);
      padGain.gain.setValueAtTime(0.06, now + 0.7);
      padGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      pad.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(master);
      pad.start(now);
      pad.stop(now + 1.3);

      // Fade out master
      master.gain.setValueAtTime(0.25, now + 0.9);
      master.gain.linearRampToValueAtTime(0, now + 1.3);
    } catch {
      // Silently fail if Web Audio not available
    }
  }, []);

  const playCorrect = useCallback(() => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.2, now);
      master.connect(ctx.destination);

      // Bright ascending chime
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(g);
        g.connect(master);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } catch {}
  }, []);

  const playWrong = useCallback(() => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.15, now);
      master.connect(ctx.destination);

      // Low descending buzz
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.6);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {}
  }, []);

  return { playQuestionReveal, playCorrect, playWrong };
}
