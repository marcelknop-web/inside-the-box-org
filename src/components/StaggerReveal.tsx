import { ReactNode, Children, useEffect, useState } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
  /** Wait this long before revealing the first child */
  startDelay?: number;
  /** Reset animation sequence when this value changes */
  resetKey?: string | number;
}

export const StaggerReveal = ({ children, className = '', stagger = 180, startDelay = 0, resetKey }: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(startDelay <= 0);

  // Reset item reveal count when section changes
  useEffect(() => {
    setVisibleCount(0);
  }, [resetKey]);

  // Start gate is fully controlled by startDelay and section identity
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

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((child, i) => (
        <div
          key={i}
          className="transition-all duration-500 ease-out"
          style={{
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateY(0)' : 'translateY(14px)',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
