import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  delay?: number;
  charDelay?: number;
  cursor?: boolean;
  onDone?: () => void;
}

const Typewriter = ({ text, delay = 0, charDelay = 70, cursor = true, onDone }: TypewriterProps) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);

  useEffect(() => {
    if (!started || count >= text.length) {
      if (started && count >= text.length) onDone?.();
      return;
    }
    const t = setTimeout(() => setCount(c => c + 1), charDelay);
    return () => clearTimeout(t);
  }, [started, count, text.length, charDelay, onDone]);

  if (!started) return cursor ? <span className="animate-pulse">_</span> : null;

  return (
    <>
      {text.slice(0, count)}
      {cursor && count < text.length && <span className="animate-pulse">_</span>}
    </>
  );
};

export default Typewriter;
