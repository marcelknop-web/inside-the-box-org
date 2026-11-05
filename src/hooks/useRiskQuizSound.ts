import { useCallback, useEffect, useRef, useState } from 'react';
import { createReverb } from './createReverb';

type Studio = { ctx: AudioContext; output: GainNode; dry: GainNode; reverb: ConvolverNode };
type Note = { frequency: number; at: number; duration: number; gain?: number; type?: OscillatorType; cutoff?: number; endFrequency?: number };

/** Original cinematic quiz-show score; no broadcast recordings or theme melody. */
export function useRiskQuizSound() {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('risk_quiz_muted') === 'true'; } catch { return false; }
  });
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('risk_quiz_volume');
      const value = stored === null ? 45 : Number(stored);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 45;
    } catch { return 45; }
  });
  const studio = useRef<Studio | null>(null);
  const sources = useRef(new Set<OscillatorNode>());
  const bed = useRef<GainNode | null>(null);
  const bedSources = useRef<OscillatorNode[]>([]);
  const settings = useRef({ muted, volume });
  settings.current = { muted, volume };

  const getStudio = useCallback(() => {
    if (studio.current) return studio.current;
    const ctx = new AudioContext();
    const output = ctx.createGain();
    output.gain.value = settings.current.muted ? 0 : settings.current.volume / 100;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -18;
    limiter.knee.value = 12;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.18;
    output.connect(limiter);
    limiter.connect(ctx.destination);
    const dry = ctx.createGain();
    dry.gain.value = 0.65;
    dry.connect(output);
    const reverb = createReverb(ctx, 2.2, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    reverb.connect(wet);
    wet.connect(output);
    studio.current = { ctx, output, dry, reverb };
    return studio.current;
  }, []);

  const unlock = useCallback(() => {
    try {
      const { ctx } = getStudio();
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    } catch { /* Audio is optional on unsupported devices. */ }
  }, [getStudio]);

  const play = useCallback((notes: Note[]) => {
    if (settings.current.muted || document.hidden) return;
    try {
      const { ctx, dry, reverb } = getStudio();
      const now = ctx.currentTime;
      notes.forEach(({ frequency, at, duration, gain = 0.12, type = 'triangle', cutoff = 1800, endFrequency }) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        if (endFrequency !== undefined) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + at + duration);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff * 0.45, now + at);
        filter.frequency.linearRampToValueAtTime(cutoff, now + at + 0.025);
        filter.frequency.exponentialRampToValueAtTime(Math.max(180, cutoff * 0.3), now + at + duration);
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, now + at);
        envelope.gain.linearRampToValueAtTime(gain, now + at + 0.015);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + at + duration);
        oscillator.connect(filter);
        filter.connect(envelope);
        envelope.connect(dry);
        envelope.connect(reverb);
        sources.current.add(oscillator);
        oscillator.onended = () => {
          sources.current.delete(oscillator);
          oscillator.disconnect(); filter.disconnect(); envelope.disconnect();
        };
        oscillator.start(now + at);
        oscillator.stop(now + at + duration + 0.02);
      });
    } catch { /* Preserve gameplay when audio is unavailable. */ }
  }, [getStudio]);

  const stopThinking = useCallback(() => {
    const current = bed.current;
    const ctx = studio.current?.ctx;
    if (!current || !ctx) return;
    current.gain.cancelScheduledValues(ctx.currentTime);
    current.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    for (const source of bedSources.current) {
      try { source.stop(ctx.currentTime + 0.3); } catch { /* Already stopped. */ }
    }
    bed.current = null;
    bedSources.current = [];
  }, []);

  const startThinking = useCallback(() => {
    stopThinking();
    if (settings.current.muted || document.hidden) return;
    try {
      const { ctx, dry, reverb } = getStudio();
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(0.034, ctx.currentTime + 1.5);
      bus.connect(dry);
      bus.connect(reverb);
      bed.current = bus;
      const nodes: AudioNode[] = [bus];
      // D pedal, fifth and suspended minor-second colour: slow beating, not a melody.
      const voices = [73.416, 146.832, 220.0, 311.127, 440.6].map((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = index < 2 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        const voiceGain = ctx.createGain();
        voiceGain.gain.value = index < 2 ? 0.65 : 0.22;
        oscillator.connect(filter); filter.connect(voiceGain); voiceGain.connect(bus);
        nodes.push(filter, voiceGain);
        oscillator.start();
        return oscillator;
      });
      const pulse = ctx.createOscillator();
      const depth = ctx.createGain();
      pulse.frequency.value = 1.1;
      depth.gain.value = 0.024;
      pulse.connect(depth); depth.connect(bus.gain); pulse.start();
      nodes.push(depth);
      bedSources.current = [...voices, pulse];
      let remaining = bedSources.current.length;
      for (const oscillator of bedSources.current) oscillator.onended = () => {
        oscillator.disconnect();
        remaining -= 1;
        if (remaining === 0) nodes.forEach(node => node.disconnect());
      };
    } catch { /* Silent fallback. */ }
  }, [getStudio, stopThinking]);

  const stopAll = useCallback(() => {
    stopThinking();
    for (const source of sources.current) {
      try { source.stop(); } catch { /* Already stopped. */ }
    }
    sources.current.clear();
  }, [stopThinking]);

  useEffect(() => {
    try {
      localStorage.setItem('risk_quiz_muted', String(muted));
      localStorage.setItem('risk_quiz_volume', String(volume));
    } catch { /* Private browsing. */ }
    const current = studio.current;
    if (current) current.output.gain.setTargetAtTime(muted ? 0 : volume / 100, current.ctx.currentTime, 0.025);
  }, [muted, volume]);

  useEffect(() => {
    const onVisibility = () => {
      const ctx = studio.current?.ctx;
      if (!ctx) return;
      if (document.hidden) void ctx.suspend().catch(() => {});
      else void ctx.resume().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopAll();
      const ctx = studio.current?.ctx;
      studio.current = null;
      if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    };
  }, [stopAll]);

  const melody = useCallback((frequencies: number[], spacing: number, duration: number, gain = 0.12) =>
    play(frequencies.map((frequency, i) => ({ frequency, at: i * spacing, duration, gain }))), [play]);
  const orchestra = useCallback((frequencies: number[], spacing: number, duration: number, gain = 0.07) => {
    play(frequencies.flatMap((frequency, i) => [
      { frequency, at: i * spacing, duration, gain, type: 'sawtooth' as OscillatorType, cutoff: 1600 },
      { frequency: frequency * 1.002, at: i * spacing, duration, gain: gain * 0.4, type: 'triangle' as OscillatorType, cutoff: 1000 },
      { frequency: frequency / 2, at: i * spacing, duration: duration * 0.85, gain: gain * 0.65, type: 'sine' as OscillatorType },
    ]));
  }, [play]);
  const playQuestionReveal = useCallback(() => {
    play([{ frequency: 100, endFrequency: 46, at: 0, duration: 0.45, gain: 0.22, type: 'sine' }]);
    orchestra([146.83, 220, 311.13, 440], 0.15, 0.85, 0.055);
  }, [play, orchestra]);
  const playSelect = useCallback(() => play([{ frequency: 660, at: 0, duration: 0.12, gain: 0.09, type: 'sine' }]), [play]);
  const playConfirm = useCallback(() => {
    play([
      { frequency: 82, endFrequency: 41, at: 0, duration: 0.35, gain: 0.22, type: 'sine' },
      { frequency: 293.66, at: 0, duration: 0.28, gain: 0.09 },
      { frequency: 311.13, at: 0.12, duration: 0.23, gain: 0.07 },
    ]);
  }, [play]);
  const playCorrect = useCallback(() => orchestra([146.83, 220, 293.66, 369.99, 440], 0.085, 0.85), [orchestra]);
  const playWrong = useCallback(() => {
    orchestra([155.56, 146.83, 110, 73.42], 0.12, 1.1, 0.06);
    play([{ frequency: 65, endFrequency: 35, at: 0.1, duration: 0.8, gain: 0.18, type: 'sine' }]);
  }, [orchestra, play]);
  const playVictory = useCallback(() => orchestra([146.83, 220, 293.66, 369.99, 440, 587.33], 0.18, 1.6, 0.065), [orchestra]);
  const playMilestone = useCallback(() => orchestra([293.66, 369.99, 440, 587.33], 0.11, 0.75, 0.045), [orchestra]);
  const playJoker = useCallback(() => melody([440, 659.25, 880], 0.055, 0.25, 0.08), [melody]);
  const playTick = useCallback(() => play([{ frequency: 880, at: 0, duration: 0.05, gain: 0.035, type: 'sine' }]), [play]);
  const playTickUrgent = useCallback(() => play([
    { frequency: 660, at: 0, duration: 0.07, gain: 0.05, type: 'sine' },
    { frequency: 880, at: 0.12, duration: 0.07, gain: 0.05, type: 'sine' },
  ]), [play]);

  return { muted, setMuted, volume, setVolume, unlock, startThinking, stopThinking, stopAll,
    playQuestionReveal, playSelect, playConfirm, playCorrect, playWrong, playDefeat: playWrong,
    playVictory, playMilestone, playJoker, playTick, playTickUrgent };
}