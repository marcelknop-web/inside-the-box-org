import { useEffect, useRef, useState, useCallback } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';

const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

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

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns.length; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        // Random brightness for depth
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
        }
        columns[i]++;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    // Show content after delay
    const timer = setTimeout(() => setShowContent(true), 1500);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
    };
  }, []);

  // Ambient Matrix sound using Web Audio API
  const startSound = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Deep ambient drone
    const createDrone = (freq: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 3);
      osc.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      osc.start();
      return { osc, gain: g };
    };

    // Random digital blips
    const createBlips = () => {
      const scheduleBlip = () => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 4000, ctx.currentTime);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.04, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 + Math.random() * 0.15);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(scheduleBlip, 50 + Math.random() * 300);
      };
      scheduleBlip();
    };

    createDrone(55, 0.06);
    createDrone(82.5, 0.04);
    createDrone(110, 0.025);
    createBlips();

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
        NODE://SECURE
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
