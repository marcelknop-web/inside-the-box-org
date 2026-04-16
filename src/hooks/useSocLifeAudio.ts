import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 80s Berlin-underground chiptune engine, fully Web-Audio (no network).
 * - Calm loop: hypnotic 4/4 acid-bass + dub chord, soft kick, hat
 * - Alert loop: tighter, distorted kick, faster hat, dissonant stab
 * - SFX: incident klaxon, success chime, fail buzz, footstep, click, escalation
 *
 * Designed to feel like a Berlin warehouse C64-techno hybrid.
 */

export type SfxKey =
  | "incident_klaxon"
  | "success_chime"
  | "fail_buzz"
  | "footstep"
  | "click_ui"
  | "escalation";

export type MusicMode = "calm" | "alert" | "audit";

export function useSocLifeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const stepHandleRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const modeRef = useRef<MusicMode>("calm");
  const enabledRef = useRef(false);
  // Track the music bus' "non-pumped" base gain so the sidechain duck can recover to it.
  const musicBaseGainRef = useRef(0.45);
  const [enabled, setEnabledState] = useState(false);

  // ---------- Init ----------
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx: typeof AudioContext =
        (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      const master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      const music = ctx.createGain(); music.gain.value = 0.45; music.connect(master);
      const sfx = ctx.createGain(); sfx.gain.value = 0.7; sfx.connect(master);
      ctxRef.current = ctx;
      masterRef.current = master;
      musicGainRef.current = music;
      sfxGainRef.current = sfx;
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // ---------- Voice helpers ----------
  function pulseBuffer(ctx: AudioContext, freq: number, duty: number, length: number): AudioBuffer {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * length);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    const period = sr / freq;
    const high = period * duty;
    for (let i = 0; i < len; i++) {
      const phase = i % period;
      data[i] = phase < high ? 0.5 : -0.5;
    }
    return buf;
  }

  function noiseBurst(ctx: AudioContext, dur: number, dest: AudioNode, gain = 0.2, hp = 4000) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = "highpass"; filt.frequency.value = hp;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt); filt.connect(g); g.connect(dest);
    src.start(now); src.stop(now + dur);
  }

  // Acid-bass voice (sawtooth + LP filter with envelope) — the soul of Berlin techno
  function acidNote(ctx: AudioContext, dest: AudioNode, freq: number, dur: number, accent = false) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.Q.value = accent ? 18 : 12;
    const cutoffPeak = accent ? 2400 : 1400;
    const cutoffBase = 240;
    filt.frequency.setValueAtTime(cutoffPeak, now);
    filt.frequency.exponentialRampToValueAtTime(cutoffBase, now + dur);
    const g = ctx.createGain();
    const peak = accent ? 0.34 : 0.22;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filt); filt.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + dur + 0.05);
  }

  // Kick: sine pitch-drop + tiny click
  function kick(ctx: AudioContext, dest: AudioNode, hard = false) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(hard ? 150 : 110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(hard ? 0.95 : 0.7, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + 0.25);
    // click
    noiseBurst(ctx, 0.012, dest, hard ? 0.18 : 0.1, 2000);
  }

  // Hi-hat: short high-passed noise
  function hat(ctx: AudioContext, dest: AudioNode, open = false) {
    noiseBurst(ctx, open ? 0.12 : 0.04, dest, open ? 0.12 : 0.18, 7000);
  }

  // Soft sustained pad note (sine + slight detune) — gives the hypnotic glue
  function pad(ctx: AudioContext, dest: AudioNode, freq: number, dur: number, level = 0.06) {
    const now = ctx.currentTime;
    [1, 1.005, 0.5].forEach((mul, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * mul;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(level * (i === 2 ? 0.5 : 1), now + 0.4);
      g.gain.linearRampToValueAtTime(level * 0.7, now + dur - 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(filt); filt.connect(g); g.connect(dest);
      o.start(now); o.stop(now + dur + 0.05);
    });
  }

  // Soft kick — sine pitch-drop, very rounded (Blomqvist / Rampue feel: present but never harsh)
  function softKick(ctx: AudioContext, dest: AudioNode, level = 0.55) {
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(95, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    o.connect(g); g.connect(dest);
    o.start(now); o.stop(now + 0.34);
    // Tiny rounded click (lowpassed noise — not crispy)
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.008);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.08 * level, now); ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
    src.connect(lp); lp.connect(ng); ng.connect(dest);
    src.start(now); src.stop(now + 0.012);
  }

  // Sub bass — pure sine, long-ish, sits under the kick
  function subBass(ctx: AudioContext, dest: AudioNode, freq: number, dur: number, level = 0.18) {
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(level, now + 0.04);
    g.gain.linearRampToValueAtTime(level * 0.85, now + dur - 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(dest);
    o.start(now); o.stop(now + dur + 0.05);
  }

  // Soft closed hat — short filtered noise, much darker than 909-style
  function softHat(ctx: AudioContext, dest: AudioNode, level = 0.07) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.04);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5500;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(dest);
    src.start(now); src.stop(now + 0.05);
  }

  // Soft side-stick / rim — quick pluck for swing accents
  function rim(ctx: AudioContext, dest: AudioNode, level = 0.08) {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = 1700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    o.connect(g); g.connect(dest);
    o.start(now); o.stop(now + 0.05);
  }

  // Dreamy detuned pad — three sine voices with slight chorus, long attack/release.
  // Plays a CHORD (array of freqs) for melodic content. This is the soul of Rampue/Blomqvist.
  function dreamPad(ctx: AudioContext, dest: AudioNode, freqs: number[], dur: number, level = 0.05) {
    const now = ctx.currentTime;
    freqs.forEach((f, idx) => {
      [1, 1.0035, 0.9968].forEach((det, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f * det;
        // Slow LFO on detune for breathing motion
        const lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.18 + i * 0.07;
        const lfoGain = ctx.createGain(); lfoGain.gain.value = 1.2;
        lfo.connect(lfoGain); lfoGain.connect(o.detune);
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1100 + idx * 120;
        lp.Q.value = 0.6;
        const g = ctx.createGain();
        const lvl = level * (i === 0 ? 1 : 0.55) * (idx === 0 ? 1 : 0.7);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(lvl, now + 0.6);
        g.gain.linearRampToValueAtTime(lvl * 0.85, now + dur - 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        o.connect(lp); lp.connect(g); g.connect(dest);
        o.start(now); o.stop(now + dur + 0.1);
        lfo.start(now); lfo.stop(now + dur + 0.1);
      });
    });
  }

  // Plucky melodic note — triangle with short envelope, slight reverb-ish tail via filter
  // This carries the hypnotic, melancholic melody on top.
  function pluck(ctx: AudioContext, dest: AudioNode, freq: number, dur = 0.6, level = 0.09) {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = freq * 2;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, now);
    lp.frequency.exponentialRampToValueAtTime(900, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(level, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const g2 = ctx.createGain(); g2.gain.value = level * 0.25;
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(dest);
    o.start(now); o.stop(now + dur + 0.05);
    o2.start(now); o2.stop(now + dur + 0.05);
  }

  // Sidechain-style ducking node: a short volume dip on the music bus to imitate
  // pumping kick (key Berlin electro production trick — makes everything breathe).
  function pumpDuck(ctx: AudioContext, music: GainNode, baseGain: number, depth = 0.45) {
    const now = ctx.currentTime;
    music.gain.cancelScheduledValues(now);
    music.gain.setValueAtTime(baseGain * (1 - depth), now);
    music.gain.linearRampToValueAtTime(baseGain, now + 0.32);
  }

  // ---------- Sequencer ----------
  // Per-mode tempo. Slower tempos lean into the "einlullend" hypnosis.
  // calm  =  98 BPM (deep, dreamy, melodic — Rampue territory)
  // alert = 122 BPM (driving but not aggressive — still musical, still pretty)
  // audit = 110 BPM (witty, quirky melodic — NO elevator bells, just a different chord palette)
  const STEP_MS_BY_MODE: Record<MusicMode, number> = {
    calm:  (60_000 / 98)  / 4,
    alert: (60_000 / 122) / 4,
    audit: (60_000 / 110) / 4,
  };

  // ---- Musical content (32-step patterns, 8 bars of 4 sixteenths = 2 bars of 4/4) ----
  // CALM: Am - F - C - G progression (classic melancholic Berlin)
  //   Bar 1 (steps 0-15): Am  | F
  //   Bar 2 (steps 16-31): C   | G
  // We store one chord per 8 steps.
  const CALM_CHORDS: number[][] = [
    [220.00, 261.63, 329.63],   // Am  (A3 C4 E4)
    [174.61, 220.00, 261.63],   // F   (F3 A3 C4)
    [196.00, 246.94, 293.66],   // C   (G3 B3 D4) — voicing without root for color
    [196.00, 246.94, 293.66],   // G   (G3 B3 D4)
  ];
  const CALM_BASS_NOTES = [55.00, 43.65, 65.41, 49.00]; // A1, F1, C2, G1
  // Hypnotic descending pluck melody in A minor pentatonic (E5 D5 C5 A4 G4 E4 …)
  // 16 steps, repeated for both bars but transposed slightly bar 2.
  const CALM_MELODY_BAR1: (number | 0)[] = [
    659.25, 0, 0, 587.33,  0, 523.25, 0, 0,  440.00, 0, 0, 392.00,  0, 329.63, 0, 0,
  ];
  const CALM_MELODY_BAR2: (number | 0)[] = [
    523.25, 0, 0, 493.88,  0, 440.00, 0, 0,  392.00, 0, 0, 329.63,  0, 293.66, 0, 0,
  ];

  // ALERT: Em - C - G - D — same dreamy palette, just darker + faster, more momentum
  const ALERT_CHORDS: number[][] = [
    [164.81, 196.00, 246.94],  // Em
    [196.00, 246.94, 329.63],  // C
    [196.00, 246.94, 293.66],  // G
    [220.00, 277.18, 329.63],  // D
  ];
  const ALERT_BASS_NOTES = [41.20, 65.41, 49.00, 73.42]; // E1, C2, G1, D2
  const ALERT_MELODY_BAR1: (number | 0)[] = [
    659.25, 0, 587.33, 0,  493.88, 0, 587.33, 0,  659.25, 0, 783.99, 0,  587.33, 0, 493.88, 0,
  ];
  const ALERT_MELODY_BAR2: (number | 0)[] = [
    587.33, 0, 493.88, 0,  440.00, 0, 493.88, 0,  587.33, 0, 659.25, 0,  493.88, 0, 440.00, 0,
  ];

  // AUDIT (witty/quirky): suspended major-7 chords, slightly sneaky melody.
  // Still electronic — NO bells, NO elevator chimes.
  const AUDIT_CHORDS: number[][] = [
    [261.63, 329.63, 392.00],  // C
    [261.63, 311.13, 369.99],  // Cm-ish (cheeky)
    [261.63, 329.63, 392.00],  // C
    [233.08, 293.66, 369.99],  // Bb -ish twist
  ];
  const AUDIT_BASS_NOTES = [65.41, 65.41, 65.41, 58.27];
  const AUDIT_MELODY_BAR1: (number | 0)[] = [
    523.25, 0, 659.25, 0,  587.33, 0, 0, 523.25,  493.88, 0, 587.33, 0,  523.25, 0, 0, 0,
  ];
  const AUDIT_MELODY_BAR2: (number | 0)[] = [
    523.25, 0, 622.25, 0,  587.33, 0, 0, 523.25,  466.16, 0, 587.33, 0,  523.25, 0, 0, 0,
  ];

  function tickStep(ctx: AudioContext, music: GainNode, musicBaseGain: number) {
    const i = stepIndexRef.current % 32;
    const mode = modeRef.current;

    const chordsByMode = mode === "alert" ? ALERT_CHORDS : mode === "audit" ? AUDIT_CHORDS : CALM_CHORDS;
    const bassByMode   = mode === "alert" ? ALERT_BASS_NOTES : mode === "audit" ? AUDIT_BASS_NOTES : CALM_BASS_NOTES;
    const melBar1 = mode === "alert" ? ALERT_MELODY_BAR1 : mode === "audit" ? AUDIT_MELODY_BAR1 : CALM_MELODY_BAR1;
    const melBar2 = mode === "alert" ? ALERT_MELODY_BAR2 : mode === "audit" ? AUDIT_MELODY_BAR2 : CALM_MELODY_BAR2;

    // Which chord slot are we in (0..3, each 8 steps)
    const chordSlot = Math.floor(i / 8) as 0 | 1 | 2 | 3;
    const inBar2 = i >= 16;
    const stepInBar = i % 16;

    // ---- Drums ----
    // Soft kick on every beat (4-on-the-floor) — but quieter in calm, slightly louder in alert
    if (i % 4 === 0) {
      const kLevel = mode === "alert" ? 0.7 : mode === "audit" ? 0.5 : 0.55;
      softKick(ctx, music, kLevel);
      // Sidechain pump on the kick — gives that breathing Berlin feel
      pumpDuck(ctx, music, musicBaseGain, mode === "alert" ? 0.5 : 0.35);
    }
    // Closed hats on offbeat 8ths in calm/audit; on every 8th in alert
    if (mode === "alert") {
      if (i % 2 === 0) softHat(ctx, music, 0.06);
      if (i % 4 === 2) softHat(ctx, music, 0.09); // accent
    } else {
      if (i % 4 === 2) softHat(ctx, music, 0.07);
      if (i === 7 || i === 23) softHat(ctx, music, 0.05);
    }
    // Subtle rim accents on the "and" of beat 2 every other bar
    if ((i === 6 || i === 22) && mode !== "audit") rim(ctx, music, 0.06);

    // ---- Bass (sub) ----
    // Long sub note on chord change — provides foundation, never busy
    if (i % 8 === 0) {
      const bassFreq = bassByMode[chordSlot];
      const bassLen = (STEP_MS_BY_MODE[mode] * 8) / 1000 + 0.05;
      subBass(ctx, music, bassFreq, bassLen, mode === "alert" ? 0.2 : 0.16);
    }

    // ---- Pad chord ----
    // New pad on chord change. Long, dreamy, breathes through whole 8 steps.
    if (i % 8 === 0) {
      const padLen = (STEP_MS_BY_MODE[mode] * 8) / 1000 + 0.2;
      const padLvl = mode === "alert" ? 0.045 : mode === "audit" ? 0.04 : 0.06;
      dreamPad(ctx, music, chordsByMode[chordSlot], padLen, padLvl);
    }

    // ---- Melody pluck ----
    const mel = inBar2 ? melBar2 : melBar1;
    const f = mel[stepInBar];
    if (f) {
      const dur = mode === "alert" ? 0.45 : 0.7;
      const lvl = mode === "alert" ? 0.08 : 0.085;
      pluck(ctx, music, f, dur, lvl);
      // Gentle octave-up echo on calm — adds shimmer
      if (mode === "calm" && (stepInBar === 5 || stepInBar === 13)) {
        pluck(ctx, music, f * 2, 0.4, 0.04);
      }
    }
  }

  const startSequencer = useCallback(() => {
    const ctx = ensureCtx();
    const music = musicGainRef.current!;
    if (stepHandleRef.current != null) return;
    stepIndexRef.current = 0;
    const step = () => {
      if (!enabledRef.current) return;
      try { tickStep(ctx, music, musicBaseGainRef.current); } catch { /* noop */ }
      stepIndexRef.current = (stepIndexRef.current + 1) % 32;
      // Use the current mode's tempo so transitions feel natural.
      const ms = STEP_MS_BY_MODE[modeRef.current] ?? STEP_MS_BY_MODE.calm;
      stepHandleRef.current = window.setTimeout(step, ms);
    };
    step();
  }, [ensureCtx]);

  const stopSequencer = useCallback(() => {
    if (stepHandleRef.current != null) {
      clearTimeout(stepHandleRef.current);
      stepHandleRef.current = null;
    }
  }, []);

  // ---------- Public API ----------
  const setEnabled = useCallback((v: boolean) => {
    enabledRef.current = v;
    setEnabledState(v);
    if (v) {
      ensureCtx();
      // fade in music
      const g = musicGainRef.current!;
      const ctx = ctxRef.current!;
      const target = modeRef.current === "alert" ? 0.55 : modeRef.current === "audit" ? 0.4 : 0.45;
      musicBaseGainRef.current = target;
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 1.2);
      startSequencer();
    } else {
      const g = musicGainRef.current;
      const ctx = ctxRef.current;
      if (g && ctx) {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      }
      window.setTimeout(() => stopSequencer(), 500);
    }
  }, [ensureCtx, startSequencer, stopSequencer]);

  const setMusicMode = useCallback((mode: MusicMode) => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    // gentle volume duck on transition for impact
    const g = musicGainRef.current;
    const ctx = ctxRef.current;
    if (!g || !ctx || !enabledRef.current) return;
    const target = mode === "alert" ? 0.55 : mode === "audit" ? 0.4 : 0.45;
    const now = ctx.currentTime;
    // Clamp current value to a safe non-zero floor so exponential ramps work.
    const safeNow = Math.max(g.gain.value, 0.05);
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(safeNow, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.08);
    g.gain.linearRampToValueAtTime(target, now + 0.6);
  }, []);

  const playSfx = useCallback((key: SfxKey, volume = 0.7) => {
    if (!enabledRef.current) return;
    const ctx = ensureCtx();
    const dest = sfxGainRef.current!;
    const now = ctx.currentTime;
    const g = ctx.createGain(); g.gain.value = volume; g.connect(dest);

    switch (key) {
      case "incident_klaxon": {
        // Two descending square notes
        [880, 660].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f;
          const og = ctx.createGain();
          og.gain.setValueAtTime(0, now + i * 0.15);
          og.gain.linearRampToValueAtTime(0.4, now + i * 0.15 + 0.01);
          og.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);
          o.connect(og); og.connect(g);
          o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.3);
        });
        break;
      }
      case "success_chime": {
        // Two ascending square tones — C5, G5
        [523, 784].forEach((f, i) => {
          const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f;
          const og = ctx.createGain();
          og.gain.setValueAtTime(0, now + i * 0.1);
          og.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.01);
          og.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);
          o.connect(og); og.connect(g);
          o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.2);
        });
        break;
      }
      case "fail_buzz": {
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 110;
        const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 600;
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.4, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        o.connect(filt); filt.connect(og); og.connect(g);
        o.start(now); o.stop(now + 0.4);
        break;
      }
      case "footstep": {
        noiseBurst(ctx, 0.06, g, 0.18, 1500);
        break;
      }
      case "click_ui": {
        const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 1400;
        const og = ctx.createGain();
        og.gain.setValueAtTime(0.18, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        o.connect(og); og.connect(g);
        o.start(now); o.stop(now + 0.06);
        break;
      }
      case "escalation": {
        // Riser sweep + impact
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 200;
        o.frequency.exponentialRampToValueAtTime(1500, now + 1.5);
        const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 800;
        filt.frequency.exponentialRampToValueAtTime(3000, now + 1.5);
        const og = ctx.createGain();
        og.gain.setValueAtTime(0, now);
        og.gain.linearRampToValueAtTime(0.3, now + 1.4);
        og.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        o.connect(filt); filt.connect(og); og.connect(g);
        o.start(now); o.stop(now + 2.0);
        // impact at end
        const k = ctx.createOscillator(); k.type = "sine"; k.frequency.setValueAtTime(120, now + 1.45);
        k.frequency.exponentialRampToValueAtTime(35, now + 1.95);
        const kg = ctx.createGain();
        kg.gain.setValueAtTime(0.6, now + 1.45);
        kg.gain.exponentialRampToValueAtTime(0.001, now + 2.1);
        k.connect(kg); kg.connect(g);
        k.start(now + 1.45); k.stop(now + 2.15);
        break;
      }
    }
  }, [ensureCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopSequencer();
      const ctx = ctxRef.current;
      if (ctx) ctx.close().catch(() => {});
    };
  }, [stopSequencer]);

  // Stable API object — referentially identical across renders so consumers
  // can safely depend on it without retriggering effects (which previously
  // caused the music to keep "ducking" on every render and sound broken).
  const setEnabledRef = useRef(setEnabled);
  const setMusicModeRef = useRef(setMusicMode);
  const playSfxRef = useRef(playSfx);
  setEnabledRef.current = setEnabled;
  setMusicModeRef.current = setMusicMode;
  playSfxRef.current = playSfx;

  const apiRef = useRef<{
    enabled: boolean;
    setEnabled: (v: boolean) => void;
    setMusicMode: (m: MusicMode) => void;
    playSfx: (k: SfxKey, vol?: number) => void;
  } | null>(null);
  if (!apiRef.current) {
    apiRef.current = {
      enabled,
      setEnabled: (v) => setEnabledRef.current(v),
      setMusicMode: (m) => setMusicModeRef.current(m),
      playSfx: (k, v) => playSfxRef.current(k, v),
    };
  }
  apiRef.current.enabled = enabled;
  return apiRef.current;
}
