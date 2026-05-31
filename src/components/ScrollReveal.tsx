import { ReactNode, Children, useEffect, useRef, useState, CSSProperties } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Apple-style scroll-triggered reveal. Each direct child fades and slides
 * up into place the first time it enters the viewport. Uses
 * IntersectionObserver (viewport root) so it works regardless of which
 * element is the scroll container. Respects prefers-reduced-motion.
 */
export const ScrollReveal = ({ children, className = '' }: ScrollRevealProps) => {
  const items = Children.toArray(children);

  return (
    <div className={`space-y-5 md:space-y-3 ${className}`}>
      {items.map((child, i) => (
        <RevealItem key={i}>{child}</RevealItem>
      ))}
    </div>
  );
};

const RevealItem = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: 'opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)',
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
};
