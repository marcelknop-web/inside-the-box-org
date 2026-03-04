import { useEffect, useState } from 'react';

/**
 * GlitchText – periodically applies a brief glitch flicker to its text.
 * The keyframe animation is defined once in index.css (glitch-flicker).
 */
const GlitchText = ({ children }: { children: string }) => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const pause = 2000 + Math.random() * 4000;
      timerId = setTimeout(() => {
        setGlitching(true);
        const duration = 100 + Math.random() * 300;
        timerId = setTimeout(() => {
          setGlitching(false);
          scheduleNext();
        }, duration);
      }, pause);
    };
    scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  return (
    <span
      className="inline relative"
      style={glitching ? {
        animation: 'glitch-flicker 80ms steps(2, end) infinite',
      } : undefined}
    >
      {children}
    </span>
  );
};

export default GlitchText;
