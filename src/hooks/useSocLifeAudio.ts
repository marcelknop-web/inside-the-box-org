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

  // Cheesy bell/arpeggio note (for "auditor" elevator-music vibe)
  function bell(ctx: AudioContext, dest: AudioNode, freq: number) {
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = freq * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    const g2 = ctx.createGain(); g2.gain.value = 0.05;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o.start(now); o.stop(now + 0.5);
    o2.start(now); o2.stop(now + 0.5);
  }

  // Dub stab — single short chord
  function stab(ctx: AudioContext, dest: AudioNode, freq: number, alert = false) {
    const now = ctx.currentTime;
    const intervals = alert ? [1, 1.18, 1.5] : [1, 1.25, 1.5]; // dissonant when alert
    intervals.forEach((mul, i) => {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = freq * mul;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = alert ? 2200 : 1600; filt.Q.value = 4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.05, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o.connect(filt); filt.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.22);
      void i;
    });
  }

  // ---------- Sequencer ----------
  // Per-mode tempo so each mood has its own rhythmic pull.
  // calm  = 108 BPM (hypnotic, slow)
  // alert = 138 BPM (driving, urgent)
  // audit = 100 BPM (cheesy elevator-muzak)
  const STEP_MS_BY_MODE: Record<MusicMode, number> = {
    calm:  (60_000 / 108) / 4,
    alert: (60_000 / 138) / 4,
    audit: (60_000 / 100) / 4,
  };

  // 32-step patterns for more variation / hypnotic depth.
  // Hypnotic calm: rolling 16ths in A minor pentatonic, soft kick on 1 & 9,
  // sustained pad on bar starts, ghost stab on 23.
  const CALM_BASS = [
    110, 0, 110, 0,  82, 0, 110, 0,   98, 0, 110, 0,  82, 0, 65, 0,
    110, 0, 130, 0,  82, 0, 110, 0,  146, 0, 110, 0,  82, 0, 65, 0,
  ];
  // Driving alert: relentless 8ths, accented & dissonant
  const ALERT_BASS = [
    110, 0, 110, 110,  65, 0, 110, 0,  130, 0, 110, 110,  65, 0, 73, 0,
    110, 110, 65, 0,  110, 130, 65, 0,  110, 110, 73, 0,  110, 130, 65, 65,
  ];
  // Cheesy auditor elevator: major arp C-E-G-B in a slow 16th roll
  const AUDIT_ARP = [
    523, 0, 659, 0,  784, 0, 988, 0,  784, 0, 659, 0,  523, 0, 0, 0,
    523, 0, 659, 0,  784, 0, 1175,0,  988, 0, 784, 0,  659, 0, 0, 0,
  ];

  function tickStep(ctx: AudioContext, music: GainNode) {
    const i = stepIndexRef.current % 32;
    const mode = modeRef.current;

    if (mode === "audit") {
      // Soft swing: kick on 1 & 17 only, gentle rim on 9/25, bell arp constant.
      if (i === 0 || i === 16) kick(ctx, music, false);
      if (i === 8 || i === 24) hat(ctx, music, true);
      const f = AUDIT_ARP[i];
      if (f) bell(ctx, music, f);
      // Soft pad on bar starts
      if (i === 0) pad(ctx, music, 261.63, 1.5, 0.05);
      return;
    }

    const alert = mode === "alert";

    // Kick: calm = halftime (1 & 9 & 17 & 25), alert = 4-on-the-floor on every 4th.
    if (alert) {
      if (i % 4 === 0) kick(ctx, music, true);
    } else {
      if (i === 0 || i === 8 || i === 16 || i === 24) kick(ctx, music, false);
    }

    // Hats — calm: shuffled offbeats, alert: relentless 8ths
    if (alert) {
      if (i % 2 === 1) hat(ctx, music, false);
      if (i === 7 || i === 23) hat(ctx, music, true);
    } else {
      if (i === 3 || i === 11 || i === 19 || i === 27) hat(ctx, music, false);
      if (i === 15) hat(ctx, music, true);
    }

    // Bass / acid line
    const pat = alert ? ALERT_BASS : CALM_BASS;
    const f = pat[i];
    if (f) {
      const accent = alert ? (i % 8 === 0) : (i === 11 || i === 27);
      acidNote(ctx, music, f, alert ? 0.16 : 0.26, accent);
    }

    // Sustained pad — only in calm mode, on bar starts, very soft (hypnosis glue)
    if (!alert && (i === 0 || i === 16)) {
      pad(ctx, music, 110, 3.0, 0.05); // A2 root drone
      pad(ctx, music, 164.81, 3.0, 0.035); // E3 fifth drone
    }

    // Stabs
    if (!alert && i === 22) stab(ctx, music, 220);
    if (alert && (i === 4 || i === 20 || i === 28)) stab(ctx, music, 196, true);
  }

  const startSequencer = useCallback(() => {
    const ctx = ensureCtx();
    const music = musicGainRef.current!;
    if (stepHandleRef.current != null) return;
    stepIndexRef.current = 0;
    const step = () => {
      if (!enabledRef.current) return;
      try { tickStep(ctx, music); } catch { /* noop */ }
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
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 1.2);
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
    const target = mode === "alert" ? 0.55 : 0.45;
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
