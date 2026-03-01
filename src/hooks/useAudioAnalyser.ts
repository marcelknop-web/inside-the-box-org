import { useRef, useCallback, useState, useEffect } from 'react';

export interface AudioAnalysis {
  /** 0-1 overall amplitude */
  amplitude: number;
  /** 0-1 bass energy (low frequencies) */
  bass: number;
  /** 0-1 mid energy */
  mid: number;
  /** 0-1 high energy */
  high: number;
  /** true when a beat is detected */
  beat: boolean;
}

const EMPTY: AudioAnalysis = { amplitude: 0, bass: 0, mid: 0, high: 0, beat: false };

/**
 * Plays an audio file and exposes real-time frequency analysis.
 * Read `analysisRef.current` every frame for latest data.
 */
export function useAudioAnalyser() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const analysisRef = useRef<AudioAnalysis>({ ...EMPTY });
  const prevBassRef = useRef(0);
  const beatCooldown = useRef(0);
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) return;

    analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);
    const len = data.length;

    // Split into bass / mid / high bands
    const bassEnd = Math.floor(len * 0.08);   // ~0-350 Hz
    const midEnd = Math.floor(len * 0.35);    // ~350-1500 Hz

    let bassSum = 0, midSum = 0, highSum = 0, total = 0;
    for (let i = 0; i < len; i++) {
      const v = data[i] / 255;
      total += v;
      if (i < bassEnd) bassSum += v;
      else if (i < midEnd) midSum += v;
      else highSum += v;
    }

    const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
    const mid = (midEnd - bassEnd) > 0 ? midSum / (midEnd - bassEnd) : 0;
    const high = (len - midEnd) > 0 ? highSum / (len - midEnd) : 0;
    const amplitude = total / len;

    // Simple beat detection on bass
    beatCooldown.current = Math.max(0, beatCooldown.current - 1 / 60);
    const beat = bass - prevBassRef.current > 0.15 && beatCooldown.current <= 0;
    if (beat) beatCooldown.current = 0.2; // min 200ms between beats
    prevBassRef.current = bass * 0.7 + prevBassRef.current * 0.3; // smoothed

    analysisRef.current = { amplitude, bass, mid, high, beat };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (audioRef.current) return;

    const audio = new Audio('/audio/ambient-heartbeat.mp3');
    audio.loop = true;
    audio.volume = 0.7;
    audioRef.current = audio;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    audio.play().then(() => {
      setPlaying(true);
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {});
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    analyserRef.current = null;
    dataRef.current = null;
    analysisRef.current = { ...EMPTY };
    setPlaying(false);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (ctxRef.current) ctxRef.current.close();
  }, []);

  return { playing, start, stop, analysisRef };
}
