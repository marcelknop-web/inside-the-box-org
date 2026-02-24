import { useEffect, useRef, useState, useCallback } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';

// Alarm red color: #ff1a1a / rgb(255,26,26)
const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [clientIp, setClientIp] = useState('...');

  // Fetch client IP on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.ipify.org?format=json', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (!controller.signal.aborted) setClientIp(d.ip); })
      .catch(() => { if (!controller.signal.aborted) setClientIp('unknown'); });
    return () => controller.abort();
  }, []);

  const triggerRainDrop = useCallback((columnRatio: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    if (Math.random() > 0.2) return;

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
    g.connect(pan);
    pan.connect(master);
    osc.start(t);
    osc.stop(t + 0.15);
  }, []);

  // Matrix rain
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let columns: number[] = [];
    let offsets: number[] = [];       // horizontal sway offset per column
    let swayPhase: number[] = [];     // sine phase per column
    let swaySpeed: number[] = [];     // how fast each column sways
    let swayAmplitude: number[] = []; // how far each column sways
    const fontSize = 14;

    const initSway = (count: number) => {
      offsets = Array.from({ length: count }, () => 0);
      swayPhase = Array.from({ length: count }, () => Math.random() * Math.PI * 2);
      swaySpeed = Array.from({ length: count }, () => 0.02 + Math.random() * 0.04);
      swayAmplitude = Array.from({ length: count }, () => 1.5 + Math.random() * 2.5);
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const colCount = Math.floor(w / fontSize);
      if (columns.length !== colCount) {
        columns = Array.from({ length: colCount }, () => Math.random() * h / fontSize);
        initSway(colCount);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const frameSkip = isMobile ? 3 : 2;

    const draw = () => {
      frameCount++;
      const shouldUpdate = frameCount % frameSkip === 0;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (shouldUpdate) {
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < columns.length; i++) {
          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

          // Update sway
          swayPhase[i] += swaySpeed[i];
          offsets[i] = Math.sin(swayPhase[i]) * swayAmplitude[i] * fontSize * 0.3;

          const x = i * fontSize + offsets[i];
          const y = columns[i] * fontSize;

          const brightness = Math.random();
          if (!isMobile && brightness > 0.95) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ff1a1a';
            ctx.shadowBlur = 15;
          } else if (!isMobile && brightness > 0.7) {
            ctx.fillStyle = '#ff1a1a';
            ctx.shadowColor = '#ff1a1a';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = `rgba(255, 26, 26, ${0.3 + brightness * 0.5})`;
          }

          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;

          if (y > canvas.height && Math.random() > 0.975) {
            columns[i] = 0;
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

  const startSound = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    masterRef.current = master;
    master.connect(ctx.destination);

    const theremin = ctx.createOscillator();
    const thereminGain = ctx.createGain();
    const thereminVibrato = ctx.createOscillator();
    const thereminVibratoGain = ctx.createGain();
    theremin.type = 'sine';
    theremin.frequency.setValueAtTime(400, ctx.currentTime);
    theremin.frequency.linearRampToValueAtTime(800, ctx.currentTime + 12);
    theremin.frequency.linearRampToValueAtTime(350, ctx.currentTime + 24);
    theremin.frequency.linearRampToValueAtTime(900, ctx.currentTime + 36);
    theremin.frequency.linearRampToValueAtTime(400, ctx.currentTime + 48);
    thereminVibrato.type = 'sine';
    thereminVibrato.frequency.setValueAtTime(5.5, ctx.currentTime);
    thereminVibratoGain.gain.setValueAtTime(12, ctx.currentTime);
    thereminVibrato.connect(thereminVibratoGain);
    thereminVibratoGain.connect(theremin.frequency);
    thereminGain.gain.setValueAtTime(0, ctx.currentTime);
    thereminGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);
    theremin.connect(thereminGain);
    thereminGain.connect(master);
    theremin.start();
    thereminVibrato.start();

    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    const whistleLfo = ctx.createOscillator();
    const whistleLfoGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1200, ctx.currentTime);
    whistle.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 8);
    whistle.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 20);
    whistle.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 32);
    whistleLfo.type = 'sine';
    whistleLfo.frequency.setValueAtTime(0.3, ctx.currentTime);
    whistleLfoGain.gain.setValueAtTime(0.025, ctx.currentTime);
    whistleLfo.connect(whistleLfoGain);
    whistleLfoGain.connect(whistleGain.gain);
    whistleGain.gain.setValueAtTime(0, ctx.currentTime);
    whistleGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 6);
    whistle.connect(whistleGain);
    whistleGain.connect(master);
    whistle.start();
    whistleLfo.start();

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subLfo = ctx.createOscillator();
    const subLfoGain = ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(55, ctx.currentTime);
    subLfo.type = 'sine';
    subLfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    subLfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
    subLfo.connect(subLfoGain);
    subLfoGain.connect(subGain.gain);
    subGain.gain.setValueAtTime(0, ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 5);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start();
    subLfo.start();

    [2.3, 3.7, 5.1].forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55 * ratio, ctx.currentTime);
      const lfo2 = ctx.createOscillator();
      const lfo2G = ctx.createGain();
      lfo2.type = 'sine';
      lfo2.frequency.setValueAtTime(0.1 + idx * 0.07, ctx.currentTime);
      lfo2G.gain.setValueAtTime(0.008, ctx.currentTime);
      lfo2.connect(lfo2G);
      lfo2G.connect(g.gain);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 6 + idx * 2);
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
              background: 'radial-gradient(circle, rgba(255,26,26,0.3) 0%, transparent 70%)',
              transform: 'scale(2.5)',
            }}
          />
        <a href="/" className="relative matrix-glow-pulse matrix-logo-link block">
            <GeometricSymbol size="lg" className="matrix-symbol" />
          </a>
        </div>

        {/* Title */}
        <h1
          className="font-mono text-2xl md:text-4xl lg:text-5xl font-bold tracking-[0.3em] uppercase mb-4"
          style={{
            textShadow: '0 0 10px rgba(255,26,26,0.7), 0 0 40px rgba(255,26,26,0.3), 0 0 80px rgba(255,26,26,0.1)',
          }}
        >
          <a href="/" className="text-[#ff1a1a] hover:text-[#f5c542] transition-colors duration-300">inside-the-box</a>
        </h1>

        {/* Subtitle */}
        <p
          className="font-mono text-sm md:text-base tracking-[0.5em] uppercase text-center"
          style={{
            color: 'rgba(255,26,26,0.6)',
            textShadow: '0 0 10px rgba(255,26,26,0.3)',
          }}
        >
          Artificial Stress Simulator v1
        </p>

        {/* Decorative line */}
        <div
          className="mt-8 h-px w-48 md:w-64"
          style={{
            background: 'linear-gradient(90deg, transparent, #ff1a1a, transparent)',
            boxShadow: '0 0 10px rgba(255,26,26,0.5)',
          }}
        />

        {/* Sound toggle */}
        <button
          onClick={soundOn ? stopSound : startSound}
          className={`matrix-start-btn mt-10 font-mono text-sm md:text-base tracking-widest uppercase px-8 py-3 border-2 rounded transition-all duration-500 text-[#ff1a1a] hover:text-[#00e5ff] hover:border-[#00e5ff] ${soundOn ? 'matrix-btn-active' : 'matrix-btn-idle'}`}
          style={{
            textShadow: '0 0 10px rgba(255,26,26,0.6), 0 0 30px rgba(255,26,26,0.3)',
            background: soundOn ? 'rgba(255,26,26,0.1)' : 'rgba(255,26,26,0.03)',
            boxShadow: soundOn
              ? '0 0 20px rgba(255,26,26,0.4), inset 0 0 20px rgba(255,26,26,0.1)'
              : '0 0 15px rgba(255,26,26,0.2), inset 0 0 10px rgba(255,26,26,0.05)',
            animation: soundOn ? 'none' : 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          {soundOn ? '■ Stop' : '▶ Start'}
        </button>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 font-mono text-xs z-20" style={{ color: '#ff1a1a', textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        CLIENT://{clientIp}
      </div>
      <div className="absolute top-4 right-4 font-mono text-xs z-20" style={{ color: '#ff1a1a', textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        {new Date().toISOString().replace('T', ' ').slice(0, 19)}
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-xs z-20" style={{ textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        <a href="mailto:marcel@inside-the-box.org" className="text-[#ff1a1a] hover:text-[#f5c542] transition-colors duration-300">marcel@inside-the-box.org</a>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-xs z-20" style={{ textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        <a href="/" className="text-[#ff1a1a] hover:text-[#f5c542] transition-colors duration-300">inside-the-box.org</a>
      </div>

      {/* Custom styles for matrix symbol override */}
      <style>{`
        .matrix-symbol div {
          border-color: #ff1a1a !important;
          transition: border-color 0.3s ease;
        }
        .matrix-symbol .bg-primary\\/10 {
          background-color: rgba(255, 26, 26, 0.1) !important;
          transition: background-color 0.3s ease;
        }
        .matrix-logo-link:hover .matrix-symbol div {
          border-color: #f5c542 !important;
        }
        .matrix-logo-link:hover .matrix-symbol .bg-primary\/10 {
          background-color: rgba(245, 197, 66, 0.15) !important;
        }
        @keyframes hypnotic-glow {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(255,26,26,0.5)) drop-shadow(0 0 80px rgba(255,26,26,0.2));
            opacity: 0.8;
          }
          50% {
            filter: drop-shadow(0 0 60px rgba(255,26,26,0.8)) drop-shadow(0 0 120px rgba(255,26,26,0.3));
            opacity: 1;
          }
        }
        .matrix-glow-pulse {
          animation: hypnotic-glow 4s ease-in-out infinite;
          will-change: filter, opacity;
        }
        .matrix-logo-link:hover {
          animation: none;
          filter: drop-shadow(0 0 40px rgba(245,197,66,0.6)) drop-shadow(0 0 100px rgba(245,197,66,0.25));
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(255,26,26,0.2), inset 0 0 10px rgba(255,26,26,0.05);
            border-color: rgba(255,26,26,0.5);
          }
          50% {
            box-shadow: 0 0 25px rgba(255,26,26,0.5), inset 0 0 15px rgba(255,26,26,0.1);
            border-color: rgba(255,26,26,0.8);
          }
        }
        .matrix-btn-idle {
          border-color: rgba(255,26,26,0.5);
        }
        .matrix-btn-active {
          border-color: rgba(255,26,26,0.7);
        }
        .matrix-start-btn:hover {
          animation: none !important;
          border-color: #00e5ff !important;
          box-shadow: 0 0 20px rgba(0,229,255,0.3), inset 0 0 15px rgba(0,229,255,0.08) !important;
          text-shadow: 0 0 10px rgba(0,229,255,0.6), 0 0 30px rgba(0,229,255,0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default MatrixStart;
