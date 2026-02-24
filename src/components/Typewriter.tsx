import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

export type RevealMode =
  | 'typewriter'   // classic left-to-right
  | 'decode'       // random chars resolve into real text
  | 'word'         // word by word
  | 'cascade'      // letters fade in with overlapping wave
  | 'scramble'     // whole text scrambles then settles left-to-right

interface TypewriterProps {
  text: string;
  mode?: RevealMode;
  delay?: number;
  /** ms per step (letter or word depending on mode) */
  charDelay?: number;
  cursor?: boolean;
  onDone?: () => void;
}

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:<>?/~█▓▒░';
const randChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];

const Typewriter = ({ text, mode = 'typewriter', delay = 0, charDelay = 70, cursor = true, onDone }: TypewriterProps) => {
  const [started, setStarted] = useState(delay === 0);
  const [step, setStep] = useState(0);
  const doneRef = useRef(false);

  // Reset when text or mode changes (e.g. navigating between pages)
  useEffect(() => {
    setStep(0);
    setStarted(delay === 0);
    doneRef.current = false;
  }, [text, mode, delay]);

  const stableOnDone = useCallback(() => {
    if (!doneRef.current) { doneRef.current = true; onDone?.(); }
  }, [onDone]);

  // Start delay
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);

  // Total steps depend on mode
  const totalSteps = useMemo(() => {
    switch (mode) {
      case 'word': return text.split(/(\s+)/).filter(w => w.trim()).length;
      case 'decode': return text.length + 6; // extra passes for scramble settling
      case 'scramble': return text.length + 8;
      case 'cascade': return text.length;
      default: return text.length; // typewriter
    }
  }, [text, mode]);

  // Step timer
  useEffect(() => {
    if (!started || step >= totalSteps) {
      if (started && step >= totalSteps) stableOnDone();
      return;
    }
    const speed = mode === 'word' ? charDelay * 2.5 : mode === 'decode' || mode === 'scramble' ? charDelay * 0.6 : charDelay;
    const t = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(t);
  }, [started, step, totalSteps, charDelay, mode, stableOnDone]);

  if (!started) return cursor ? <span className="animate-pulse">_</span> : null;

  const done = step >= totalSteps;

  // Render based on mode
  const rendered = (() => {
    switch (mode) {
      case 'typewriter':
        return text.slice(0, step);

      case 'word': {
        const words = text.split(/(\s+)/);
        const realWords = words.filter(w => w.trim());
        const showCount = Math.min(step, realWords.length);
        let count = 0;
        return words.map((w, i) => {
          if (!w.trim()) return w;
          count++;
          return count <= showCount ? w : '';
        }).join('');
      }

      case 'decode': {
        // Characters resolve from left to right; unresolved ones are random
        const resolved = Math.max(0, step - 4); // first few steps are pure scramble
        return text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < resolved) return ch;
          if (i < resolved + 6 && step > 0) return randChar();
          return '';
        }).join('');
      }

      case 'scramble': {
        // All chars visible from start but scrambled; they settle left-to-right
        const settled = Math.max(0, step - 4);
        return text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < settled) return ch;
          return step > 0 ? randChar() : '';
        }).join('');
      }

      case 'cascade':
        return text.slice(0, step);

      default:
        return text.slice(0, step);
    }
  })();

  // Cascade mode uses per-character opacity for a wave effect
  if (mode === 'cascade') {
    return (
      <span>
        {text.split('').map((ch, i) => {
          const visible = i < step;
          const justAppeared = i >= step - 3 && i < step;
          return (
            <span
              key={i}
              style={{
                opacity: visible ? (justAppeared ? 0.6 : 1) : 0,
                transition: 'opacity 200ms ease-out',
                display: 'inline',
              }}
            >
              {ch}
            </span>
          );
        })}
        {cursor && !done && <span className="animate-pulse">_</span>}
      </span>
    );
  }

  // Scramble/decode show the full-width text with glitch chars
  if (mode === 'scramble' || mode === 'decode') {
    return (
      <span className="font-mono">
        {rendered.split('').map((ch, i) => {
          const isResolved = i < (mode === 'scramble' ? Math.max(0, step - 4) : Math.max(0, step - 4));
          return (
            <span
              key={i}
              style={{
                opacity: ch ? 1 : 0,
                color: !isResolved && ch !== ' ' ? 'hsl(var(--muted-foreground))' : undefined,
                transition: 'color 150ms ease',
              }}
            >
              {ch || '\u00A0'}
            </span>
          );
        })}
        {cursor && !done && <span className="animate-pulse">_</span>}
      </span>
    );
  }

  return (
    <>
      {rendered}
      {cursor && !done && <span className="animate-pulse">_</span>}
    </>
  );
};

export default Typewriter;
