import { ReactNode, useState } from 'react';
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

  return (
    <div className="space-y-3">
      <div className="rounded-2xl px-5 py-4 text-sm md:text-base font-sans leading-relaxed tracking-wide text-foreground">
        <h2 className="text-primary text-lg font-bold font-mono mb-3">
          <Typewriter text={title} mode={mode} charDelay={charDelay} onDone={() => setTitleDone(true)} />
        </h2>
        {intro && (
          <div
            className="transition-all duration-500 ease-out"
            style={{
              opacity: titleDone ? 1 : 0,
              transform: titleDone ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            {intro}
          </div>
        )}
      </div>
      <StaggerReveal stagger={stagger} startDelay={titleDone ? 0 : 999999}>
        {children}
      </StaggerReveal>
    </div>
  );
};

export default TypedSection;
