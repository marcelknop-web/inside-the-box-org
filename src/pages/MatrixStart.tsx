import { useEffect, useRef, useState, useCallback } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFINSIDETHEBOX';

const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Trigger a raindrop "plip" sound when a column resets
  const triggerRainDrop = useCallback((columnRatio: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    // Only trigger some — not every reset needs a drop
    if (Math.random() > 0.3) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const filter = ctx.createBiquadFilter();

    // Short filtered click/plip — like a raindrop hitting glass
    osc.type = 'sine';
    const freq = 2000 + Math.random() * 4000;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 0.8, t);
    filter.Q.setValueAtTime(3, t);

    pan.pan.setValueAtTime((columnRatio * 2 - 1) * 0.7, t);

    const vol = 0.02 + Math.random() * 0.03;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.06);

    osc.connect(filter);
    filter.connect(g);
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

    // === RAIN SOUND ===
    // Layered filtered noise to simulate realistic rain

    const sr = ctx.sampleRate;
    const bufLen = sr * 2;
    const noiseBuf = ctx.createBuffer(2, bufLen, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = noiseBuf.getChannelData(ch);
      for (let i = 0; i < bufLen; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    // Main rain — bandpass filtered white noise (steady rain)
    const rain1 = ctx.createBufferSource();
    rain1.buffer = noiseBuf;
    rain1.loop = true;
    const rainFilter1 = ctx.createBiquadFilter();
    rainFilter1.type = 'bandpass';
    rainFilter1.frequency.setValueAtTime(3000, ctx.currentTime);
    rainFilter1.Q.setValueAtTime(0.5, ctx.currentTime);
    const rainGain1 = ctx.createGain();
    rainGain1.gain.setValueAtTime(0.12, ctx.currentTime);
    rain1.connect(rainFilter1);
    rainFilter1.connect(rainGain1);
    rainGain1.connect(master);
    rain1.start();

    // High shimmer — light rain patter on surfaces
    const rain2 = ctx.createBufferSource();
    rain2.buffer = noiseBuf;
    rain2.loop = true;
    const rainFilter2 = ctx.createBiquadFilter();
    rainFilter2.type = 'highpass';
    rainFilter2.frequency.setValueAtTime(6000, ctx.currentTime);
    const rainGain2 = ctx.createGain();
    rainGain2.gain.setValueAtTime(0.04, ctx.currentTime);
    rain2.connect(rainFilter2);
    rainFilter2.connect(rainGain2);
    rainGain2.connect(master);
    rain2.start();

    // Low rumble — distant heavy rain / thunder ambience
    const rain3 = ctx.createBufferSource();
    rain3.buffer = noiseBuf;
    rain3.loop = true;
    const rainFilter3 = ctx.createBiquadFilter();
    rainFilter3.type = 'lowpass';
    rainFilter3.frequency.setValueAtTime(200, ctx.currentTime);
    rainFilter3.Q.setValueAtTime(2, ctx.currentTime);
    const rainGain3 = ctx.createGain();
    rainGain3.gain.setValueAtTime(0.06, ctx.currentTime);
    rain3.connect(rainFilter3);
    rainFilter3.connect(rainGain3);
    rainGain3.connect(master);
    rain3.start();

    // Slow LFO on main rain intensity — gusts of rain
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(rainGain1.gain);
    lfo.start();

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
