import { useCallback, useRef } from 'react';

/**
 * Dramatic orchestral "Who Wants to Be a Millionaire" style stinger
 * using layered Web Audio API synthesis.
 */
export function useMillionaireSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // Create convolver reverb for orchestral depth
  const createReverb = (ctx: AudioContext, duration = 2, decay = 2) => {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  };

  const playQuestionReveal = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Master bus
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, now);
      master.connect(ctx.destination);

      // Reverb send for orchestral depth
      const reverb = createReverb(ctx, 2.5, 1.8);
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.3, now);
      reverb.connect(reverbGain);
      reverbGain.connect(master);

      // Dry bus
      const dryBus = ctx.createGain();
      dryBus.gain.setValueAtTime(0.7, now);
      dryBus.connect(master);

      // ═══ LAYER 1: Timpani roll (low dramatic rumble) ═══
      const timpaniDur = 2.5;
      for (let i = 0; i < 12; i++) {
        const t = i * 0.04;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55 + Math.random() * 5, now + t);

        const noise = ctx.createOscillator();
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(82 + Math.random() * 3, now + t);

        const g = ctx.createGain();
        const vol = 0.08 + (i / 12) * 0.12;
        g.gain.setValueAtTime(0, now + t);
        g.gain.linearRampToValueAtTime(vol, now + t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);

        osc.connect(g);
        noise.connect(g);
        g.connect(dryBus);
        g.connect(reverb);
        osc.start(now + t);
        osc.stop(now + t + 0.25);
        noise.start(now + t);
        noise.stop(now + t + 0.25);
      }

      // Sustained timpani pedal
      const pedal = ctx.createOscillator();
      pedal.type = 'sine';
      pedal.frequency.setValueAtTime(55, now);
      const pedalG = ctx.createGain();
      pedalG.gain.setValueAtTime(0, now);
      pedalG.gain.linearRampToValueAtTime(0.12, now + 0.5);
      pedalG.gain.setValueAtTime(0.12, now + 1.5);
      pedalG.gain.exponentialRampToValueAtTime(0.001, now + timpaniDur);
      pedal.connect(pedalG);
      pedalG.connect(dryBus);
      pedalG.connect(reverb);
      pedal.start(now);
      pedal.stop(now + timpaniDur + 0.1);

      // ═══ LAYER 2: Brass stabs (dramatic ascending fanfare) ═══
      const brassNotes = [
        // D minor chord arpeggiated → rising to climax
        { freq: 146.8, start: 0.5, dur: 0.25 },   // D3
        { freq: 174.6, start: 0.65, dur: 0.25 },   // F3
        { freq: 220,   start: 0.8, dur: 0.25 },     // A3
        { freq: 293.7, start: 0.95, dur: 0.5 },     // D4
        { freq: 349.2, start: 1.15, dur: 0.5 },     // F4
        { freq: 440,   start: 1.35, dur: 0.8 },     // A4 (climax)
        { freq: 587.3, start: 1.55, dur: 1.0 },     // D5 (peak, held)
      ];

      brassNotes.forEach(({ freq, start, dur }) => {
        // Brass = layered sawtooth + square, filtered
        for (const type of ['sawtooth', 'square'] as OscillatorType[]) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);
          // Slight vibrato for realism
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(5.5, now + start);
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(2, now + start);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now + start);
          lfo.stop(now + start + dur + 0.1);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now + start);
          filter.frequency.linearRampToValueAtTime(2000, now + start + 0.05);
          filter.frequency.exponentialRampToValueAtTime(600, now + start + dur);
          filter.Q.setValueAtTime(1.5, now + start);

          const g = ctx.createGain();
          const vol = type === 'sawtooth' ? 0.07 : 0.03;
          g.gain.setValueAtTime(0, now + start);
          g.gain.linearRampToValueAtTime(vol, now + start + 0.03);
          g.gain.setValueAtTime(vol * 0.9, now + start + dur * 0.6);
          g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(filter);
          filter.connect(g);
          g.connect(dryBus);
          g.connect(reverb);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.15);
        }
      });

      // ═══ LAYER 3: String tremolo (tension builder) ═══
      const stringFreqs = [220, 277.2, 329.6]; // A3, C#4, E4 → A minor feel
      stringFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(0.5, now);

        // Tremolo via LFO on gain
        const tremLfo = ctx.createOscillator();
        tremLfo.frequency.setValueAtTime(8, now);
        tremLfo.frequency.linearRampToValueAtTime(12, now + 1.5);
        const tremGain = ctx.createGain();
        tremGain.gain.setValueAtTime(0.015, now);
        tremLfo.connect(tremGain);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.04, now + 0.3);
        g.gain.setValueAtTime(0.04, now + 1.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        tremGain.connect(g.gain);

        osc.connect(filter);
        filter.connect(g);
        g.connect(dryBus);
        g.connect(reverb);
        osc.start(now);
        osc.stop(now + 2.3);
        tremLfo.start(now);
        tremLfo.stop(now + 2.3);
      });

      // ═══ LAYER 4: Cymbal swell ═══
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const cymbalFilter = ctx.createBiquadFilter();
      cymbalFilter.type = 'highpass';
      cymbalFilter.frequency.setValueAtTime(6000, now);

      const cymbalG = ctx.createGain();
      cymbalG.gain.setValueAtTime(0, now);
      cymbalG.gain.linearRampToValueAtTime(0.06, now + 1.0);
      cymbalG.gain.setValueAtTime(0.06, now + 1.5);
      cymbalG.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      noise.connect(cymbalFilter);
      cymbalFilter.connect(cymbalG);
      cymbalG.connect(dryBus);
      cymbalG.connect(reverb);
      noise.start(now);
      noise.stop(now + 2.6);

      // ═══ LAYER 5: Final impact chord (tutti) ═══
      const impactTime = 1.55;
      const impactFreqs = [146.8, 220, 293.7, 440, 587.3]; // D power chord
      impactFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + impactTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now + impactTime);
        filter.frequency.exponentialRampToValueAtTime(400, now + impactTime + 1.0);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + impactTime);
        g.gain.linearRampToValueAtTime(0.06, now + impactTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + impactTime + 1.2);

        osc.connect(filter);
        filter.connect(g);
        g.connect(dryBus);
        g.connect(reverb);
        osc.start(now + impactTime);
        osc.stop(now + impactTime + 1.3);
      });

      // Master fade out
      master.gain.setValueAtTime(0.35, now + 2.0);
      master.gain.linearRampToValueAtTime(0, now + 2.8);
    } catch {
      // Silently fail
    }
  }, []);

  const playCorrect = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.25, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 1.5, 2);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.25, now);
      reverb.connect(revG);
      revG.connect(master);

      // Triumphant brass fanfare: ascending major triad
      const notes = [
        { freq: 293.7, start: 0, dur: 0.2 },    // D4
        { freq: 370,   start: 0.12, dur: 0.2 },  // F#4
        { freq: 440,   start: 0.24, dur: 0.2 },  // A4
        { freq: 587.3, start: 0.36, dur: 0.6 },  // D5 (held)
      ];

      notes.forEach(({ freq, start, dur }) => {
        for (const type of ['sawtooth', 'triangle'] as OscillatorType[]) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2500, now + start);

          const g = ctx.createGain();
          const vol = type === 'sawtooth' ? 0.08 : 0.05;
          g.gain.setValueAtTime(0, now + start);
          g.gain.linearRampToValueAtTime(vol, now + start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

          osc.connect(filter);
          filter.connect(g);
          g.connect(master);
          g.connect(reverb);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.1);
        }
      });

      // Harp glissando shimmer
      [587.3, 659.3, 740, 880, 987.8, 1174.7].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.3 + i * 0.05);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + 0.3 + i * 0.05);
        g.gain.linearRampToValueAtTime(0.06, now + 0.32 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.05);
        osc.connect(g);
        g.connect(master);
        g.connect(reverb);
        osc.start(now + 0.3 + i * 0.05);
        osc.stop(now + 0.7 + i * 0.05);
      });

      master.gain.setValueAtTime(0.25, now + 0.8);
      master.gain.linearRampToValueAtTime(0, now + 1.2);
    } catch {}
  }, []);

  const playWrong = useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.2, now);
      master.connect(ctx.destination);

      const reverb = createReverb(ctx, 2, 1.5);
      const revG = ctx.createGain();
      revG.gain.setValueAtTime(0.3, now);
      reverb.connect(revG);
      revG.connect(master);

      // Dark descending brass with dissonance
      const notes = [
        { freq: 233, start: 0, dur: 0.4 },     // Bb3
        { freq: 207.7, start: 0.15, dur: 0.5 }, // Ab3
        { freq: 185, start: 0.3, dur: 0.6 },    // F#3
        { freq: 146.8, start: 0.5, dur: 0.8 },  // D3 (bottom)
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + start);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now + start);
        filter.frequency.exponentialRampToValueAtTime(200, now + start + dur);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(0.08, now + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        g.connect(reverb);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.1);
      });

      // Low rumble
      const sub = ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, now + 0.3);
      const subG = ctx.createGain();
      subG.gain.setValueAtTime(0, now + 0.3);
      subG.gain.linearRampToValueAtTime(0.15, now + 0.5);
      subG.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      sub.connect(subG);
      subG.connect(master);
      sub.start(now + 0.3);
      sub.stop(now + 1.6);

      master.gain.setValueAtTime(0.2, now + 1.2);
      master.gain.linearRampToValueAtTime(0, now + 1.8);
    } catch {}
  }, []);

  return { playQuestionReveal, playCorrect, playWrong };
}
