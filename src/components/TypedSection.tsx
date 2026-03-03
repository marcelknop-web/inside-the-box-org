import { ReactNode, useState, useEffect, useRef } from 'react';
import Typewriter, { type RevealMode } from './Typewriter';
import { useIsMobile } from '@/hooks/use-mobile';
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
 * Sequences: title types in → 500ms pause → intro types in → 500ms pause → boxes stagger in.
 */
const TypedSection = ({
  title,
  mode = 'typewriter',
  charDelay = 8,
  intro,
  children,
  stagger = 350,
}: TypedSectionProps) => {
  const isMobile = useIsMobile();
  const effectiveStagger = isMobile ? Math.max(stagger, 600) : stagger;
  const [introVisible, setIntroVisible] = useState(false);
  const [titleDone, setTitleDone] = useState(false);
  const [introDone, setIntroDone] = useState(!intro); // if no intro, skip
  const [suppressIntro, setSuppressIntro] = useState(false);
  const sectionKey = `${title}-${mode}-${charDelay}`;
  const prevKeyRef = useRef(sectionKey);

  // Reset when section identity changes
  useEffect(() => {
    if (prevKeyRef.current !== sectionKey) {
      prevKeyRef.current = sectionKey;
      setSuppressIntro(true);
      setTitleDone(false);
      setIntroVisible(false);
      setIntroDone(!intro);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSuppressIntro(false);
        });
      });
    }
  }, [sectionKey, intro]);

  // 500ms pause after title before showing intro
  useEffect(() => {
    if (!titleDone || !intro) return;
    const t = setTimeout(() => setIntroVisible(true), 500);
    return () => clearTimeout(t);
  }, [titleDone, intro]);

  // Determine when content blocks can start (after intro done + 500ms)
  const blocksReady = intro ? introDone : titleDone;

  const introRef = useRef<HTMLDivElement>(null);


  return (
    <div className="space-y-5 md:space-y-3">
      <div className="rounded-2xl px-5 py-4 text-base font-sans leading-relaxed tracking-wide text-foreground">
        <h2 className="text-primary text-xl font-bold font-mono mb-3">
          <Typewriter key={sectionKey} text={title} mode={mode} charDelay={charDelay} onDone={() => setTitleDone(true)} />
        </h2>
        {intro && introVisible && (
          <div
            ref={introRef}
            style={{
              opacity: 1,
              transition: suppressIntro ? 'none' : 'opacity 200ms ease-out',
            }}
          >
            <IntroTypewriter intro={intro} mode={mode} charDelay={charDelay} sectionKey={sectionKey} onDone={() => setIntroDone(true)} />
          </div>
        )}
      </div>
      <StaggerReveal resetKey={sectionKey} stagger={effectiveStagger} startDelay={blocksReady ? 500 : 999999}>
        {children}
      </StaggerReveal>
    </div>
  );
};

/** Extracts text from a ReactNode intro (typically <p>text</p>) and types it */
const IntroTypewriter = ({ intro, mode, charDelay, sectionKey, onDone }: { intro: ReactNode; mode: RevealMode; charDelay: number; sectionKey: string; onDone: () => void }) => {
  // Extract text content from the ReactNode
  const extractText = (node: ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && 'props' in node) {
      return extractText((node as any).props.children);
    }
    return '';
  };

  const text = extractText(intro);

  return (
    <p className="text-primary">
      <Typewriter key={`${sectionKey}-intro`} text={text} mode={mode} charDelay={charDelay} onDone={onDone} />
    </p>
  );
};

export default TypedSection;
