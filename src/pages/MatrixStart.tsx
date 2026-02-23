import { useEffect, useRef, useState, useCallback } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';

const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Pentatonic scale frequencies for rain drops (dark minor feel)
  const rainNotes = useRef([
    130.81, 155.56, 174.61, 196.0, 233.08,  // C3 Eb3 F3 G3 Bb3
    261.63, 311.13, 349.23, 392.0, 466.16,  // C4 Eb4 F4 G4 Bb4
    523.25, 622.25, 698.46, 783.99,          // C5 Eb5 F5 G5
  ]);

  // Trigger a rain-synced tone
  const triggerRainDrop = useCallback((columnRatio: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    const notes = rainNotes.current;
    // Map column position (0-1) to note index for spatial sound
    const noteIdx = Math.floor(columnRatio * notes.length);
    const freq = notes[Math.min(noteIdx, notes.length - 1)];

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();

    osc.type = Math.random() > 0.7 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Stereo position based on column
    pan.pan.setValueAtTime((columnRatio * 2 - 1) * 0.8, t);

    // Soft attack, slow decay — like a raindrop resonance
    const vol = 0.015 + Math.random() * 0.02;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 + Math.random() * 1.2);

    osc.connect(g);
    g.connect(pan);
    pan.connect(master);
    osc.start(t);
    osc.stop(t + 2.5);
  }, []);

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let columns: number[] = [];
    const fontSize = 14;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colCount = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: colCount }, () => Math.random() * canvas.height / fontSize);
    };

    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const draw = () => {
      frameCount++;
      // Slow down: only update every 2nd frame for ~30fps rain
      const shouldUpdate = frameCount % 2 === 0;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (shouldUpdate) {
        for (let i = 0; i < columns.length; i++) {
          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = i * fontSize;
          const y = columns[i] * fontSize;

          const brightness = Math.random();
          if (brightness > 0.95) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 15;
          } else if (brightness > 0.7) {
            ctx.fillStyle = '#00ff41';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = `rgba(0, 255, 65, ${0.3 + brightness * 0.5})`;
            ctx.shadowBlur = 0;
          }

          ctx.font = `${fontSize}px monospace`;
          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;

          if (y > canvas.height && Math.random() > 0.975) {
            columns[i] = 0;
            // Trigger sound synced to this column reset
            triggerRainDrop(i / columns.length);
          }
          columns[i]++;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    const timer = setTimeout(() => setShowContent(true), 1500);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
    };
  }, [triggerRainDrop]);

  // Ambient background sound
  const startSound = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master gain with slow fade-in
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 5);
    masterRef.current = master;

    // Large reverb for cathedral-like space
    const reverb = ctx.createConvolver();
    const sr = ctx.sampleRate;
    const len = sr * 5;
    const impulse = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.0);
      }
    }
    reverb.buffer = impulse;
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.5, ctx.currentTime);

    // Dry + wet routing
    master.connect(ctx.destination);
    master.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    // Deep sub-bass drone — low filtered noise
    const noiseLen = sr * 2;
    const noiseBuf = ctx.createBuffer(1, noiseLen, sr);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(60, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(8, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    // Slow breathing pad – Cm chord, very quiet
    const createPad = (freq: number, vol: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.04 + Math.random() * 0.03, ctx.currentTime);
      lfoG.gain.setValueAtTime(vol * 0.4, ctx.currentTime);
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 8);
      osc.connect(g);
      g.connect(master);
      osc.start();
      lfo.start();
    };

    createPad(65.41, 0.03);   // C2
    createPad(130.81, 0.02);  // C3
    createPad(155.56, 0.018); // Eb3
    createPad(196.0, 0.015);  // G3

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
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-default select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Center content */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center z-10 transition-all duration-[2000ms] ${
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Glowing symbol */}
        <div className="relative mb-8">
          <div
            className="absolute inset-0 blur-xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,255,65,0.3) 0%, transparent 70%)',
              transform: 'scale(2.5)',
            }}
          />
          <div className="relative" style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,65,0.6))' }}>
            <GeometricSymbol size="lg" className="matrix-symbol" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-mono text-2xl md:text-4xl lg:text-5xl font-bold tracking-[0.3em] uppercase mb-4"
          style={{
            color: '#00ff41',
            textShadow: '0 0 10px rgba(0,255,65,0.7), 0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.1)',
          }}
        >
          inside-the-box
        </h1>

        {/* Subtitle with typing effect */}
        <p
          className="font-mono text-sm md:text-base tracking-[0.5em] uppercase"
          style={{
            color: 'rgba(0,255,65,0.6)',
            textShadow: '0 0 10px rgba(0,255,65,0.3)',
          }}
        >
          Cybersecurity Training &amp; Consulting
        </p>

        {/* Decorative line */}
        <div
          className="mt-8 h-px w-48 md:w-64"
          style={{
            background: 'linear-gradient(90deg, transparent, #00ff41, transparent)',
            boxShadow: '0 0 10px rgba(0,255,65,0.5)',
          }}
        />

        {/* Sound toggle */}
        <button
          onClick={soundOn ? stopSound : startSound}
          className="mt-10 font-mono text-xs tracking-widest uppercase px-6 py-2 border transition-all duration-300"
          style={{
            color: soundOn ? '#00ff41' : 'rgba(0,255,65,0.4)',
            borderColor: soundOn ? 'rgba(0,255,65,0.5)' : 'rgba(0,255,65,0.2)',
            textShadow: soundOn ? '0 0 8px rgba(0,255,65,0.5)' : 'none',
            background: soundOn ? 'rgba(0,255,65,0.05)' : 'transparent',
          }}
        >
          {soundOn ? '♫ Sound On' : '♪ Enable Sound'}
        </button>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 font-mono text-xs z-20" style={{ color: 'rgba(0,255,65,0.3)' }}>
        SYS://MATRIX_v2.1
      </div>
      <div className="absolute top-4 right-4 font-mono text-xs z-20" style={{ color: 'rgba(0,255,65,0.3)' }}>
        {new Date().toISOString().replace('T', ' ').slice(0, 19)}
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-xs z-20" style={{ color: 'rgba(0,255,65,0.3)' }}>
        marcel@inside-the-box.org
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-xs z-20" style={{ color: 'rgba(0,255,65,0.3)' }}>
        inside-the-box.org
      </div>

      {/* Custom styles for matrix symbol override */}
      <style>{`
        .matrix-symbol div {
          border-color: #00ff41 !important;
        }
        .matrix-symbol .bg-primary\\/10 {
          background-color: rgba(0, 255, 65, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default MatrixStart;
