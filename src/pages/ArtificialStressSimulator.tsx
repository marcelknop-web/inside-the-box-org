import { useEffect, useRef, useState, useCallback } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';

const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [clientIp, setClientIp] = useState('...');

  // Fetch client IP safely
  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.ipify.org?format=json', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (!controller.signal.aborted) setClientIp(d.ip); })
      .catch(() => { if (!controller.signal.aborted) setClientIp('unknown'); });
    return () => controller.abort();
  }, []);

  // Trigger a raindrop "plip" sound when a column resets
  const triggerRainDrop = useCallback((columnRatio: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    // Sparse sci-fi blips synced to column resets
    if (Math.random() > 0.2) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();

    // Descending sci-fi chirp
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
    const fontSize = 14;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const colCount = Math.floor(w / fontSize);
      // Preserve existing columns if count hasn't changed (iOS address bar resize)
      if (columns.length !== colCount) {
        columns = Array.from({ length: colCount }, () => Math.random() * h / fontSize);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let frameCount = 0;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Throttle more aggressively on mobile to prevent GPU exhaustion
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
          const x = i * fontSize;
          const y = columns[i] * fontSize;

          const brightness = Math.random();
          if (!isMobile && brightness > 0.95) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 15;
          } else if (!isMobile && brightness > 0.7) {
            ctx.fillStyle = '#00ff41';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = `rgba(0, 255, 65, ${0.3 + brightness * 0.5})`;
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

  // Rain sound synced to matrix activity
  const startSound = useCallback(() => {
    if (audioCtxRef.current) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    masterRef.current = master;
    master.connect(ctx.destination);

    // === CLASSIC SCI-FI / UFO SOUND ===
    // Theremin-style wobble + eerie harmonics + sub pulse

    // Theremin lead — slow sweeping sine with vibrato
    const theremin = ctx.createOscillator();
    const thereminGain = ctx.createGain();
    const thereminVibrato = ctx.createOscillator();
    const thereminVibratoGain = ctx.createGain();
    theremin.type = 'sine';
    theremin.frequency.setValueAtTime(400, ctx.currentTime);
    // Slow sweep up and down
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

    // Eerie high-pitched whistle — classic UFO whine
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

    // Sub-bass pulsing hum — mothership engine
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

    // Metallic ring — detuned overtones
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
              background: 'radial-gradient(circle, rgba(0,255,65,0.3) 0%, transparent 70%)',
              transform: 'scale(2.5)',
            }}
          />
        <div className="relative matrix-glow-pulse">
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
          className="font-mono text-sm md:text-base tracking-[0.5em] uppercase text-center"
          style={{
            color: 'rgba(0,255,65,0.6)',
            textShadow: '0 0 10px rgba(0,255,65,0.3)',
          }}
        >
          Artificial Stress Simulator v1
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
        CLIENT://{clientIp}
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
        @keyframes hypnotic-glow {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(0,255,65,0.5)) drop-shadow(0 0 80px rgba(0,255,65,0.2));
            opacity: 0.8;
          }
          50% {
            filter: drop-shadow(0 0 60px rgba(0,255,65,0.8)) drop-shadow(0 0 120px rgba(0,255,65,0.3));
            opacity: 1;
          }
        }
        .matrix-glow-pulse {
          animation: hypnotic-glow 4s ease-in-out infinite;
          will-change: filter, opacity;
        }
      `}</style>
    </div>
  );
};

export default MatrixStart;
