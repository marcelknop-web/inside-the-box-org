import { ReactNode, Children, useEffect, useState, useRef } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Minimum pause between children (ms). Actual pause = max(stagger, read-time of just-revealed block). */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Extra wait (ms) added before revealing the FINAL child (on top of read-time). */
  lastChildExtraDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
}

/** Reading-speed model. ~230 wpm ≈ 4 chars / 100ms, plus a small base for visual settle. */
const MS_PER_CHAR = 32;
const BASE_MS = 650;
const MAX_PAUSE_MS = 11000;

const estimateReadMs = (text: string) => {
  const chars = text.trim().replace(/\s+/g, ' ').length;
  if (chars === 0) return 0;
  return Math.min(MAX_PAUSE_MS, chars * MS_PER_CHAR + BASE_MS);
};

export const StaggerReveal = ({
  children,
  className = '',
  stagger = 350,
  startDelay = 0,
  lastChildExtraDelay = 0,
  resetKey,
}: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(startDelay <= 0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevKeyRef = useRef(resetKey);

  // Reset when section changes
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

  // Start gate
  useEffect(() => {
    if (startDelay <= 0) {
      setStarted(true);
      return;
    }
    setStarted(false);
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay, resetKey]);

  // Schedule next reveal — pause length is derived from the *just-revealed* block's text.
  useEffect(() => {
    if (!started || visibleCount >= items.length) return;

    let delay: number;
    if (visibleCount === 0) {
      // first child: small initial settle
      delay = 200;
    } else {
      const justRevealed = itemRefs.current[visibleCount - 1];
      const text = justRevealed?.innerText ?? '';
      const readMs = estimateReadMs(text);
      delay = Math.max(stagger, readMs);
      if (visibleCount === items.length - 1) delay += lastChildExtraDelay;
    }

    const t = setTimeout(() => setVisibleCount(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [started, visibleCount, items.length, stagger, lastChildExtraDelay]);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => {
        const visible = i < visibleCount;
        return (
          <div
            key={i}
            ref={el => (itemRefs.current[i] = el)}
            className={visible && !suppressTransition ? 'animate-instrument-on' : ''}
            style={{
              opacity: visible ? 1 : 0,
              // Items stay mounted (hidden) so we can measure their text length up-front.
              pointerEvents: visible ? undefined : 'none',
              transition: suppressTransition ? 'none' : undefined,
            }}
            aria-hidden={!visible}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
