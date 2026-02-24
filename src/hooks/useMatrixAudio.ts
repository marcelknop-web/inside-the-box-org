import { useRef, useState, useCallback, useEffect } from 'react';

export function useMatrixAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const triggerRainDrop = useCallback((columnRatio: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master || Math.random() > 0.2) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = Math.random() > 0.5 ? 'sine' : 'square';
    const freq = 600 + columnRatio * 1200;
    osc.frequency.setValueAtTime(freq * 2, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.15);
    pan.pan.setValueAtTime((columnRatio * 2 - 1) * 0.7, t);

    const vol = 0.008 + Math.random() * 0.012;
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(vol * 0.8, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + Math.random() * 0.1);

    osc.connect(g);
    g.connect(pan);
    pan.connect(master);
    osc.start(t);
    osc.stop(t + 0.15);
  }, []);

  const startSound = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(1, t + 3);
    masterRef.current = master;
    master.connect(ctx.destination);

    // Theremin
    const theremin = ctx.createOscillator();
    const thereminGain = ctx.createGain();
    const thereminVibrato = ctx.createOscillator();
    const thereminVibratoGain = ctx.createGain();
    theremin.type = 'sine';
    theremin.frequency.setValueAtTime(400, t);
    theremin.frequency.linearRampToValueAtTime(800, t + 12);
    theremin.frequency.linearRampToValueAtTime(350, t + 24);
    theremin.frequency.linearRampToValueAtTime(900, t + 36);
    theremin.frequency.linearRampToValueAtTime(400, t + 48);
    thereminVibrato.type = 'sine';
    thereminVibrato.frequency.setValueAtTime(5.5, t);
    thereminVibratoGain.gain.setValueAtTime(12, t);
    thereminVibrato.connect(thereminVibratoGain);
    thereminVibratoGain.connect(theremin.frequency);
    thereminGain.gain.setValueAtTime(0, t);
    thereminGain.gain.linearRampToValueAtTime(0.06, t + 4);
    theremin.connect(thereminGain);
    thereminGain.connect(master);
    theremin.start();
    thereminVibrato.start();

    // Whistle
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    const whistleLfo = ctx.createOscillator();
    const whistleLfoGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1200, t);
    whistle.frequency.linearRampToValueAtTime(2000, t + 8);
    whistle.frequency.linearRampToValueAtTime(1000, t + 20);
    whistle.frequency.linearRampToValueAtTime(1800, t + 32);
    whistleLfo.type = 'sine';
    whistleLfo.frequency.setValueAtTime(0.3, t);
    whistleLfoGain.gain.setValueAtTime(0.025, t);
    whistleLfo.connect(whistleLfoGain);
    whistleLfoGain.connect(whistleGain.gain);
    whistleGain.gain.setValueAtTime(0, t);
    whistleGain.gain.linearRampToValueAtTime(0.02, t + 6);
    whistle.connect(whistleGain);
    whistleGain.connect(master);
    whistle.start();
    whistleLfo.start();

    // Sub bass
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subLfo = ctx.createOscillator();
    const subLfoGain = ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(55, t);
    subLfo.type = 'sine';
    subLfo.frequency.setValueAtTime(0.5, t);
    subLfoGain.gain.setValueAtTime(0.04, t);
    subLfo.connect(subLfoGain);
    subLfoGain.connect(subGain.gain);
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.08, t + 5);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start();
    subLfo.start();

    // Overtones
    [2.3, 3.7, 5.1].forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55 * ratio, t);
      const lfo2 = ctx.createOscillator();
      const lfo2G = ctx.createGain();
      lfo2.type = 'sine';
      lfo2.frequency.setValueAtTime(0.1 + idx * 0.07, t);
      lfo2G.gain.setValueAtTime(0.008, t);
      lfo2.connect(lfo2G);
      lfo2G.connect(g.gain);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.012, t + 6 + idx * 2);
      osc.connect(g);
      g.connect(master);
      osc.start();
      lfo2.start();
    });

    setSoundOn(true);
  }, []);

  const stopSound = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      setSoundOn(false);
    }
  }, []);

  useEffect(() => {
    return () => { audioCtxRef.current?.close(); };
  }, []);

  return { soundOn, startSound, stopSound, triggerRainDrop };
}
