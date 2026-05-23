import { ReactNode, Children, useEffect, useState, useRef } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Extra wait (ms) before revealing the FINAL child — use to give users
   *  time to read the body before a CTA button materialises. */
  lastChildExtraDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
}

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

  useEffect(() => {
    if (!started || visibleCount >= items.length) return;
    // First child: small initial hold. Last child: optional extra hold.
    const isFirst = visibleCount === 0;
    const isLast = visibleCount === items.length - 1;
    const delay = isFirst ? 200 : stagger + (isLast ? lastChildExtraDelay : 0);
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [started, visibleCount, items.length, stagger, lastChildExtraDelay]);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => {
        const visible = i < visibleCount;
        return (
          <div
            key={i}
            className={visible && !suppressTransition ? 'animate-instrument-on' : ''}
            style={{
              opacity: visible ? 1 : 0,
              // Fallback for reduced motion / suppressed transitions
              transition: suppressTransition ? 'none' : undefined,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
