import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { HomeLanguage, HomeTopic } from '@/data/homeTopics';
import { cn } from '@/lib/utils';

const INITIAL_TURNS: Record<HomeTopic['id'], number> = {
  security: 0,
  crisis: 1,
  exercise: -1,
};

type Props = {
  topics: HomeTopic[];
  activeId: HomeTopic['id'];
  language: HomeLanguage;
  onSelect: (id: HomeTopic['id']) => void;
};

export function TopicCube({ topics, activeId, language, onSelect }: Props) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const activeIndex = topics.findIndex((topic) => topic.id === activeId);
  const previousIndex = useRef(activeIndex);
  const [turns, setTurns] = useState(() => INITIAL_TURNS[activeId]);

  useEffect(() => {
    const previous = previousIndex.current;
    if (activeIndex < 0 || previous < 0 || activeIndex === previous) return;
    const forward = (activeIndex - previous + topics.length) % topics.length;
    const shortestStep = forward === 2 ? -1 : forward;
    setTurns((current) => current + shortestStep);
    previousIndex.current = activeIndex;
  }, [activeIndex, topics.length]);

  const step = (delta: number) => {
    const index = (activeIndex + delta + topics.length) % topics.length;
    onSelect(topics[index].id);
  };

  return (
    <div
      className="topic-cube-stage"
      role="group"
      aria-label={language === 'de' ? 'Drehbare Themenbox' : language === 'fr' ? 'Boîte thématique rotative' : 'Rotating topic box'}
      tabIndex={0}
      onKeyDown={(event) => {
        const isFaceButton = event.target instanceof HTMLButtonElement;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          step(event.key === 'ArrowRight' ? 1 : -1);
        }
        if (event.key === 'Home') onSelect(topics[0].id);
        if (event.key === 'End') onSelect(topics[topics.length - 1].id);
        if (!isFaceButton && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          step(1);
        }
      }}
      onPointerDown={(event) => {
        if (event.button === 0) {
          pointerStart.current = { x: event.clientX, y: event.clientY };
          swiped.current = false;
        }
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          swiped.current = true;
          step(dx < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
    >
      <div className="topic-cube-floor" aria-hidden="true" />
      <div className="topic-cube-shadow" aria-hidden="true" />
      <div
        className="topic-cube"
        data-active={activeId}
        style={{ '--topic-turn': `${turns * 120}deg` } as CSSProperties}
      >
        {topics.map((topic) => {
          const Icon = topic.icon;
          const faceClass = topic.id === 'security' ? 'topic-cube-front' : topic.id === 'crisis' ? 'topic-cube-right' : 'topic-cube-top';
          const selected = topic.id === activeId;
          return (
            <button
              type="button"
              key={topic.id}
              className={cn('topic-cube-face', faceClass, selected && 'is-active')}
              onClick={() => {
                if (swiped.current) { swiped.current = false; return; }
                if (selected) step(1); else onSelect(topic.id);
              }}
              aria-pressed={selected}
              tabIndex={selected ? 0 : -1}
            >
              <span className="topic-cube-content">
                <span className="topic-cube-index" aria-hidden="true">{topic.number}</span>
                <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
                <span className="topic-cube-label">{topic.faceTitle[language]}</span>
              </span>
            </button>
          );
        })}
        <div className="topic-cube-face topic-cube-left" aria-hidden="true" />
        <div className="topic-cube-face topic-cube-back" aria-hidden="true" />
        <div className="topic-cube-face topic-cube-bottom" aria-hidden="true" />
      </div>
      <p className="topic-cube-hint">
        {language === 'de' ? 'Fläche wählen · aktive Fläche schaltet weiter · wischen oder Pfeiltasten' : language === 'fr' ? 'Choisir une face · la face active avance · balayage ou flèches' : 'Choose a face · active face advances · swipe or arrow keys'}
      </p>
    </div>
  );
}