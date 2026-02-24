import { ReactNode, useState, useEffect, useRef } from 'react';
import Typewriter, { type RevealMode } from './Typewriter';
import { StaggerReveal } from './StaggerReveal';

interface TypedSectionProps {
  title: string;
  mode?: RevealMode;
  charDelay?: number;
  /** Content rendered immediately below the title (e.g. subtitle paragraph) */
  intro?: ReactNode;
  /** Staggered content boxes */
  children: ReactNode;
  /** ms between each box appearing */
  stagger?: number;
}

/**
 * Sequences: title types in → intro fades → boxes stagger in.
 */
const TypedSection = ({
  title,
  mode = 'typewriter',
  charDelay = 80,
  intro,
  children,
  stagger = 400,
}: TypedSectionProps) => {
  const [titleDone, setTitleDone] = useState(false);
  const [suppressIntro, setSuppressIntro] = useState(false);
  const sectionKey = `${title}-${mode}-${charDelay}`;
  const prevKeyRef = useRef(sectionKey);

  // Reset when section identity changes — suppress intro transition to avoid flash
  useEffect(() => {
    if (prevKeyRef.current !== sectionKey) {
      prevKeyRef.current = sectionKey;
      setSuppressIntro(true);
      setTitleDone(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSuppressIntro(false);
        });
      });
    }
  }, [sectionKey]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl px-5 py-4 text-sm md:text-base font-sans leading-relaxed tracking-wide text-foreground">
        <h2 className="text-primary text-lg font-bold font-mono mb-3">
          <Typewriter key={sectionKey} text={title} mode={mode} charDelay={charDelay} onDone={() => setTitleDone(true)} />
        </h2>
        {intro && (
          <div
            style={{
              opacity: titleDone ? 1 : 0,
              transform: titleDone ? 'translateY(0)' : 'translateY(8px)',
              transition: suppressIntro ? 'none' : 'opacity 500ms ease-out, transform 500ms ease-out',
            }}
          >
            {intro}
          </div>
        )}
      </div>
      <StaggerReveal resetKey={sectionKey} stagger={stagger} startDelay={titleDone ? 500 : 999999}>
        {children}
      </StaggerReveal>
    </div>
  );
};

export default TypedSection;
