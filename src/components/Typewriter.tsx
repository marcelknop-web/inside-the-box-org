import { useEffect, useState, useRef, useCallback, useMemo } from 'react';

export type RevealMode =
  | 'typewriter'   // classic left-to-right
  | 'decode'       // random chars resolve into real text
  | 'word'         // word by word
  | 'cascade'      // letters fade in with overlapping wave
  | 'scramble'     // whole text scrambles then settles left-to-right
  | 'slide'        // letters slide in from right one by one
  | 'fade'         // whole text fades in smoothly
  | 'reveal'       // curtain reveal left-to-right with underline
  | 'terminal'     // terminal-style with prompt prefix
  | 'expand'       // text expands from center outward
  | 'flicker'      // letters flicker briefly then stabilise
  | 'trace'        // underline cursor traces, text appears behind it
  | 'pulse'        // text appears with a subtle pulse per character
  | 'stamp'        // letters stamp in with slight scale bounce
  | 'swing'        // letters swing in from top
  | 'matrix'       // matrix rain resolves into text

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
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
const randChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
const randMatrix = () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

const Typewriter = ({ text, mode = 'typewriter', delay = 0, charDelay = 12, cursor = true, onDone }: TypewriterProps) => {
  const [started, setStarted] = useState(delay === 0);
  const [step, setStep] = useState(0);
  const doneRef = useRef(false);

  // Reset when text or mode changes
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
      case 'decode': return text.length + 6;
      case 'scramble': return text.length + 8;
      case 'matrix': return text.length + 10;
      case 'fade': return 1; // single step
      case 'flicker': return text.length + 4;
      default: return text.length;
    }
  }, [text, mode]);

  // Step timer
  useEffect(() => {
    if (!started || step >= totalSteps) {
      if (started && step >= totalSteps) stableOnDone();
      return;
    }
    let speed: number;
    switch (mode) {
      case 'word': speed = charDelay * 2.5; break;
      case 'decode':
      case 'scramble': speed = charDelay * 0.6; break;
      case 'matrix': speed = charDelay * 0.5; break;
      case 'fade': speed = 600; break;
      case 'flicker': speed = charDelay * 0.8; break;
      case 'stamp':
      case 'swing': speed = charDelay * 0.9; break;
      case 'pulse': speed = charDelay * 0.7; break;
      default: speed = charDelay;
    }
    const t = setTimeout(() => setStep(s => s + 1), speed);
    return () => clearTimeout(t);
  }, [started, step, totalSteps, charDelay, mode, stableOnDone]);

  if (!started) return cursor ? <span className="animate-pulse">_</span> : null;

  const done = step >= totalSteps;

  // ─── FADE: whole text fades in at once ─────────────────────────
  if (mode === 'fade') {
    return (
      <span
        style={{
          opacity: done ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        {text}
      </span>
    );
  }

  // ─── CASCADE: per-character opacity wave ───────────────────────
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

  // ─── SLIDE: letters slide in from right ────────────────────────
  if (mode === 'slide') {
    return (
      <span>
        {text.split('').map((ch, i) => {
          const visible = i < step;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(12px)',
                transition: 'opacity 180ms ease-out, transform 180ms ease-out',
                minWidth: ch === ' ' ? '0.25em' : undefined,
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

  // ─── REVEAL: curtain reveal with underline ─────────────────────
  if (mode === 'reveal') {
    const pct = Math.min(100, (step / text.length) * 100);
    return (
      <span style={{ position: 'relative', display: 'inline' }}>
        <span style={{
          display: 'inline',
          clipPath: `inset(0 ${100 - pct}% 0 0)`,
          transition: 'clip-path 60ms linear',
        }}>
          {text}
        </span>
        <span style={{
          position: 'absolute',
          bottom: -2,
          left: 0,
          width: `${pct}%`,
          height: '2px',
          background: 'hsl(var(--primary))',
          transition: 'width 60ms linear',
        }} />
        {cursor && !done && <span className="animate-pulse">_</span>}
      </span>
    );
  }

  // ─── TERMINAL: terminal prompt style ───────────────────────────
  if (mode === 'terminal') {
    return (
      <span>
        <span style={{ color: 'hsl(var(--primary))', opacity: 0.6 }}>{'> '}</span>
        {text.slice(0, step)}
        {cursor && !done && <span className="animate-pulse" style={{ color: 'hsl(var(--primary))' }}>█</span>}
      </span>
    );
  }

  // ─── EXPAND: text expands from center ──────────────────────────
  if (mode === 'expand') {
    const mid = Math.floor(text.length / 2);
    const radius = step;
    return (
      <span>
        {text.split('').map((ch, i) => {
          const dist = Math.abs(i - mid);
          const visible = dist <= radius;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? 'scaleY(1)' : 'scaleY(0)',
                transition: 'opacity 120ms ease-out, transform 120ms ease-out',
                minWidth: ch === ' ' ? '0.25em' : undefined,
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

  // ─── FLICKER: characters flicker then stabilize ────────────────
  if (mode === 'flicker') {
    const settled = Math.max(0, step - 3);
    return (
      <span>
        {text.split('').map((ch, i) => {
          const isSettled = i < settled;
          const isFlickering = !isSettled && i < step && ch !== ' ';
          return (
            <span
              key={i}
              style={{
                display: 'inline',
                opacity: i < step ? (isFlickering ? (Math.random() > 0.5 ? 1 : 0.3) : 1) : 0,
                transition: isSettled ? 'opacity 100ms' : 'none',
              }}
            >
              {i < step ? ch : ''}
            </span>
          );
        })}
        {cursor && !done && <span className="animate-pulse">_</span>}
      </span>
    );
  }

  // ─── TRACE: underline cursor traces, text appears behind ───────
  if (mode === 'trace') {
    return (
      <span style={{ position: 'relative', display: 'inline' }}>
        {text.split('').map((ch, i) => (
          <span
            key={i}
            style={{
              display: 'inline',
              opacity: i < step ? 1 : 0,
              transition: 'opacity 80ms ease-out',
            }}
          >
            {ch}
          </span>
        ))}
        {!done && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '2px',
            backgroundColor: 'hsl(var(--primary))',
            verticalAlign: 'baseline',
            marginLeft: '1px',
            animation: 'pulse 0.6s infinite',
          }} />
        )}
      </span>
    );
  }

  // ─── PULSE: characters appear with subtle scale pulse ──────────
  if (mode === 'pulse') {
    return (
      <span>
        {text.split('').map((ch, i) => {
          const visible = i < step;
          const justAppeared = i === step - 1;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? (justAppeared ? 'scale(1.15)' : 'scale(1)') : 'scale(0.8)',
                transition: 'opacity 100ms ease-out, transform 150ms ease-out',
                minWidth: ch === ' ' ? '0.25em' : undefined,
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

  // ─── STAMP: letters stamp in with scale bounce ─────────────────
  if (mode === 'stamp') {
    return (
      <span>
        {text.split('').map((ch, i) => {
          const visible = i < step;
          const justAppeared = i >= step - 2 && i < step;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? (justAppeared ? 'scale(1.3)' : 'scale(1)') : 'scale(1.8)',
                transition: 'opacity 80ms ease-out, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                minWidth: ch === ' ' ? '0.25em' : undefined,
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

  // ─── SWING: letters swing in from top ──────────────────────────
  if (mode === 'swing') {
    return (
      <span>
        {text.split('').map((ch, i) => {
          const visible = i < step;
          const justAppeared = i >= step - 2 && i < step;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? (justAppeared ? 'translateY(-2px)' : 'translateY(0)') : 'translateY(-10px)',
                transition: 'opacity 120ms ease-out, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                minWidth: ch === ' ' ? '0.25em' : undefined,
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

  // ─── MATRIX: matrix rain resolves into text ────────────────────
  if (mode === 'matrix') {
    const resolved = Math.max(0, step - 6);
    return (
      <span className="font-mono">
        {text.split('').map((ch, i) => {
          if (ch === ' ') return <span key={i}> </span>;
          const isResolved = i < resolved;
          const isRaining = !isResolved && i < resolved + 8 && step > 0;
          return (
            <span
              key={i}
              style={{
                opacity: (isResolved || isRaining) ? 1 : 0,
                color: isResolved ? undefined : 'hsl(var(--primary))',
                transition: 'color 200ms ease, opacity 100ms ease',
              }}
            >
              {isResolved ? ch : isRaining ? randMatrix() : '\u00A0'}
            </span>
          );
        })}
        {cursor && !done && <span className="animate-pulse">_</span>}
      </span>
    );
  }

  // ─── SCRAMBLE / DECODE: glitch characters ──────────────────────
  if (mode === 'scramble' || mode === 'decode') {
    const resolvedCount = Math.max(0, step - 4);
    const rendered = text.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (i < resolvedCount) return ch;
      if (mode === 'scramble') return step > 0 ? randChar() : '';
      // decode
      if (i < resolvedCount + 6 && step > 0) return randChar();
      return '';
    }).join('');

    return (
      <span className="font-mono">
        {rendered.split('').map((ch, i) => {
          const isResolved = i < resolvedCount;
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

  // ─── WORD: word by word ────────────────────────────────────────
  if (mode === 'word') {
    const words = text.split(/(\s+)/);
    const realWords = words.filter(w => w.trim());
    const showCount = Math.min(step, realWords.length);
    let count = 0;
    const rendered = words.map((w) => {
      if (!w.trim()) return w;
      count++;
      return count <= showCount ? w : '';
    }).join('');

    return (
      <>
        {rendered}
        {cursor && !done && <span className="animate-pulse">_</span>}
      </>
    );
  }

  // ─── TYPEWRITER (default) ──────────────────────────────────────
  return (
    <>
      {text.slice(0, step)}
      {cursor && !done && <span className="animate-pulse">_</span>}
    </>
  );
};

export default Typewriter;
