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

/** Reading-speed model — tuned to feel responsive, not sluggish. */
const MS_PER_CHAR = 17;      // ~350 wpm — confident skim pace
const BASE_MS = 220;          // visual settle after power-on flicker
const MIN_PAUSE_MS = 480;     // never feel like the app is stalled
const MAX_PAUSE_MS = 4200;    // cap longest dwell so momentum stays

const estimateReadMs = (text: string) => {
  const chars = text.trim().replace(/\s+/g, ' ').length;
  if (chars === 0) return MIN_PAUSE_MS;
  return Math.min(MAX_PAUSE_MS, Math.max(MIN_PAUSE_MS, chars * MS_PER_CHAR + BASE_MS));
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
      delay = 120; // first child: near-instant
    } else {
      const justRevealed = itemRefs.current[visibleCount - 1];
      const text = justRevealed?.innerText ?? '';
      const readMs = estimateReadMs(text);
      // `stagger` is only a SOFT floor and is itself capped at MAX_PAUSE_MS,
      // so a caller passing a generous value can't accidentally make the UI feel sluggish.
      const softFloor = Math.min(stagger, MAX_PAUSE_MS);
      delay = Math.max(softFloor, readMs);
      // Halve the extra hold so the CTA never feels like a stall.
      if (visibleCount === items.length - 1) delay += Math.round(lastChildExtraDelay * 0.5);
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
