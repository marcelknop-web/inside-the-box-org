import { ReactNode, Children, useEffect, useState, useRef, createRef } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
  /** Disable auto-scroll into view (default: enabled) */
  noAutoScroll?: boolean;
}

export const StaggerReveal = ({ children, className = '', stagger = 350, startDelay = 0, resetKey, noAutoScroll = false }: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(startDelay <= 0);
  // Suppress transition during resets to avoid flash
  const [suppressTransition, setSuppressTransition] = useState(false);
  const prevKeyRef = useRef(resetKey);
  const itemRefs = useRef<Array<React.RefObject<HTMLDivElement>>>([]);

  // Keep refs array in sync with items count
  if (itemRefs.current.length !== items.length) {
    itemRefs.current = items.map((_, i) => itemRefs.current[i] || createRef<HTMLDivElement>());
  }

  // Reset when section changes — suppress transition to avoid flash
  useEffect(() => {
    if (prevKeyRef.current !== resetKey) {
      prevKeyRef.current = resetKey;
      setSuppressTransition(true);
      setVisibleCount(0);
      setStarted(false);
      // Re-enable transitions after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSuppressTransition(false);
        });
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
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, visibleCount === 0 ? 80 : stagger);
    return () => clearTimeout(timer);
  }, [started, visibleCount, items.length, stagger]);

  // Auto-scroll the latest revealed item into view
  useEffect(() => {
    if (noAutoScroll || visibleCount === 0 || suppressTransition) return;
    const lastIdx = visibleCount - 1;
    const el = itemRefs.current[lastIdx]?.current;
    if (!el) return;
    // Small delay so the transition has started and element has dimensions
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
    return () => clearTimeout(t);
  }, [visibleCount, noAutoScroll, suppressTransition]);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => (
        <div
          key={i}
          ref={itemRefs.current[i]}
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateY(0)' : 'translateY(14px)',
            transition: suppressTransition ? 'none' : 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
