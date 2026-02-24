import { ReactNode, Children, useEffect, useState } from 'react';

interface StaggerRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in ms */
  stagger?: number;
}

export const StaggerReveal = ({ children, className = '', stagger = 180 }: StaggerRevealProps) => {
  const items = Children.toArray(children);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= items.length) return;
    const timer = setTimeout(() => {
      setVisibleCount(prev => prev + 1);
    }, visibleCount === 0 ? 80 : stagger);
    return () => clearTimeout(timer);
  }, [visibleCount, items.length, stagger]);

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
