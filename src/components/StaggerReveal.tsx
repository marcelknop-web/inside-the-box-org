import { ReactNode, Children, useEffect, useState, useRef, CSSProperties } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Pause (ms) between blocks. */
  stagger?: number;
  /** Wait this long before revealing the first child. */
  startDelay?: number;
  /** Extra wait (ms) added before revealing the FINAL child. */
  lastChildExtraDelay?: number;
  /** Reset animation sequence when this value changes. */
  resetKey?: string | number;
}

/**
 * Reveals children one block at a time with a soft fade-in.
 * Per-character typewriter was removed because direct DOM mutation
 * occasionally collided with React re-renders and left individual
 * characters stuck at opacity 0.
 */
export const StaggerReveal = ({
  children,
  className = '',
  stagger = 350,
  startDelay = 0,
  lastChildExtraDelay = 0,
  resetKey,
}: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(startDelay <= 0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevKeyRef = useRef(resetKey);

  // Reset when section changes.
  useEffect(() => {
    if (prevKeyRef.current !== resetKey) {
      prevKeyRef.current = resetKey;
      setSuppressTransition(true);
      setVisibleCount(0);
      setStarted(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSuppressTransition(false));
      });
    }
  }, [resetKey]);

  // Start gate.
  useEffect(() => {
    if (startDelay <= 0) {
      setStarted(true);
      return;
    }
    setStarted(false);
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay, resetKey]);

  // Schedule next reveal.
  useEffect(() => {
    if (!started || visibleCount >= items.length) return;
    const isFirst = visibleCount === 0;
    const isLast = visibleCount === items.length - 1;
    const delay =
      (isFirst ? 80 : stagger) +
      (isLast ? Math.round(lastChildExtraDelay * 0.5) : 0);
    const t = setTimeout(() => setVisibleCount(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [started, visibleCount, items.length, stagger, lastChildExtraDelay]);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => {
        const visible = i < visibleCount;
        const style: CSSProperties = {
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: suppressTransition
            ? 'none'
            : 'opacity 420ms ease-out, transform 420ms ease-out',
          pointerEvents: visible ? undefined : 'none',
        };
        return (
          <div key={i} style={style} aria-hidden={!visible}>
            {child}
          </div>
        );
      })}
    </div>
  );
};
