import { useEffect, useRef, useState } from 'react';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { useMatrixRain } from '@/hooks/useMatrixRain';
import { useMatrixAudio } from '@/hooks/useMatrixAudio';

const MatrixStart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContent, setShowContent] = useState(false);
  const [clientIp, setClientIp] = useState('...');
  const { soundOn, startSound, stopSound, triggerRainDrop } = useMatrixAudio();

  useMatrixRain(canvasRef, triggerRainDrop);

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.ipify.org?format=json', { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (!controller.signal.aborted) setClientIp(d.ip); })
      .catch(() => { if (!controller.signal.aborted) setClientIp('unknown'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
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
          <div className="relative matrix-glow-pulse">
            <GeometricSymbol size="lg" className="matrix-symbol" />
          </div>
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
          className={`matrix-start-btn mt-10 font-mono text-sm md:text-base tracking-widest uppercase px-8 py-3 border-2 rounded transition-all duration-500 ${soundOn ? 'matrix-btn-active' : 'matrix-btn-idle'}`}
        >
          {soundOn ? '■ Stop' : '▶ Start'}
        </button>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 font-mono text-xs z-20" style={{ color: '#ff1a1a', textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        CLIENT://{clientIp}
      </div>
      <div className="absolute top-4 right-4 font-mono text-xs z-20" style={{ color: '#ff1a1a', textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        {new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')}
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-xs z-20" style={{ textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        <a href="mailto:marcel@inside-the-box.org" className="text-[#ff1a1a] hover:text-[#f5c542] transition-colors duration-300">marcel@inside-the-box.org</a>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-xs z-20" style={{ textShadow: '0 0 8px rgba(255,26,26,0.6)' }}>
        <a href="/" className="text-[#ff1a1a] hover:text-[#f5c542] transition-colors duration-300">inside-the-box.org</a>
      </div>

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
        .matrix-start-btn {
          color: #ff1a1a;
          text-shadow: 0 0 10px rgba(255,26,26,0.6), 0 0 30px rgba(255,26,26,0.3);
          background: rgba(255,26,26,0.03);
          box-shadow: 0 0 15px rgba(255,26,26,0.2), inset 0 0 10px rgba(255,26,26,0.05);
        }
        .matrix-btn-idle {
          border-color: rgba(255,26,26,0.5);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .matrix-btn-active {
          border-color: rgba(255,26,26,0.7);
          background: rgba(255,26,26,0.1);
          box-shadow: 0 0 20px rgba(255,26,26,0.4), inset 0 0 20px rgba(255,26,26,0.1);
        }
        .matrix-start-btn:hover {
          animation: none;
          color: #00e5ff;
          border-color: #00e5ff;
          box-shadow: 0 0 20px rgba(0,229,255,0.3), inset 0 0 15px rgba(0,229,255,0.08);
          text-shadow: 0 0 10px rgba(0,229,255,0.6), 0 0 30px rgba(0,229,255,0.3);
          background: rgba(0,229,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default MatrixStart;
