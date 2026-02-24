import { useEffect, useState } from 'react';

const GlitchText = ({ children }: { children: string }) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const scheduleNext = () => {
      // Random pause between 2–6 seconds
      const pause = 2000 + Math.random() * 4000;
      return setTimeout(() => {
        setGlitching(true);
        // Glitch lasts 100–400ms
        const duration = 100 + Math.random() * 300;
        setTimeout(() => {
          setGlitching(false);
          timerId = scheduleNext();
        }, duration);
      }, pause);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <span
      className="inline-block relative"
      style={glitching ? {
        animation: 'glitch-flicker 80ms steps(2, end) infinite',
      } : undefined}
    >
      {children}
      <style>{`
        @keyframes glitch-flicker {
          0% { opacity: 1; transform: translate(0); }
          20% { opacity: 0.4; transform: translate(-2px, 1px) skewX(-5deg); }
          40% { opacity: 0.9; transform: translate(1px, -1px) skewX(3deg); }
          60% { opacity: 0.2; transform: translate(2px, 0) skewX(-2deg); }
          80% { opacity: 0.8; transform: translate(-1px, 1px) skewX(4deg); }
          100% { opacity: 1; transform: translate(0); }
        }
      `}</style>
    </span>
  );
};

export default GlitchText;
