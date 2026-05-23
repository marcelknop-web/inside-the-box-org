import { ReactNode, Children, useEffect, useState, useRef, CSSProperties } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Soft floor (ms) for the pause between blocks; capped internally. */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Extra wait (ms) added before revealing the FINAL child. */
  lastChildExtraDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
}

/** Typewriter cadence — every character of every block "prints in". */
const MS_PER_CHAR = 14;        // type speed per visual character
const MIN_TYPE_MS = 360;       // shortest block sweep
const MAX_TYPE_MS = 2600;      // longest block sweep — keep momentum
const GAP_AFTER_TYPE_MS = 180; // small breath after the caret lands
const MAX_PAUSE_MS = 3200;     // hard cap on any single pause

const estimateTypeMs = (text: string) => {
  const chars = text.trim().replace(/\s+/g, ' ').length;
  if (chars === 0) return MIN_TYPE_MS;
  return Math.min(MAX_TYPE_MS, Math.max(MIN_TYPE_MS, chars * MS_PER_CHAR));
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
  const [typeDurations, setTypeDurations] = useState<number[]>([]);
  const [started, setStarted] = useState(startDelay <= 0);
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevKeyRef = useRef(resetKey);

  // Reset when section changes
  useEffect(() => {
    if (prevKeyRef.current !== resetKey) {
      prevKeyRef.current = resetKey;
      setSuppressTransition(true);
      setVisibleCount(0);
      setTypeDurations([]);
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

  // Schedule next reveal. We measure the block ABOUT to be revealed so its
  // CSS sweep duration is set before it mounts visibly, and we use the
  // PREVIOUSLY-revealed block's text to size the pause that precedes it.
  useEffect(() => {
    if (!started || visibleCount >= items.length) return;

    // 1. Measure the next block's text and stash its type duration BEFORE reveal.
    const nextEl = itemRefs.current[visibleCount];
    const nextText = nextEl?.innerText ?? '';
    const nextTypeMs = estimateTypeMs(nextText);
    setTypeDurations(prev => {
      if (prev[visibleCount] === nextTypeMs) return prev;
      const next = prev.slice();
      next[visibleCount] = nextTypeMs;
      return next;
    });

    // 2. Compute pause length.
    let delay: number;
    if (visibleCount === 0) {
      delay = 80;
    } else {
      const prevEl = itemRefs.current[visibleCount - 1];
      const prevText = prevEl?.innerText ?? '';
      const prevTypeMs = estimateTypeMs(prevText);
      const softFloor = Math.min(stagger, MAX_PAUSE_MS);
      delay = Math.min(MAX_PAUSE_MS, Math.max(softFloor, prevTypeMs + GAP_AFTER_TYPE_MS));
      if (visibleCount === items.length - 1) delay += Math.round(lastChildExtraDelay * 0.5);
    }

    const t = setTimeout(() => setVisibleCount(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [started, visibleCount, items.length, stagger, lastChildExtraDelay]);


  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => {
        const visible = i < visibleCount;
        const duration = typeDurations[i];
        const style: CSSProperties = {
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? undefined : 'none',
          transition: suppressTransition ? 'none' : undefined,
        };
        if (duration) {
          (style as Record<string, string>)['--type-duration'] = `${duration}ms`;
        }
        return (
          <div
            key={i}
            ref={el => (itemRefs.current[i] = el)}
            className={visible && !suppressTransition ? 'animate-type-sweep' : ''}
            style={style}
            aria-hidden={!visible}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
