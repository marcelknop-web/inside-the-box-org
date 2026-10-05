import { useRef } from 'react';
import type { HomeLanguage, HomeTopic } from '@/data/homeTopics';
import { cn } from '@/lib/utils';

const ROTATIONS: Record<HomeTopic['id'], string> = {
  security: 'rotateX(-15deg) rotateY(-18deg)',
  crisis: 'rotateX(-15deg) rotateY(-108deg)',
  exercise: 'rotateX(-105deg) rotateY(0deg)',
};

type Props = {
  topics: HomeTopic[];
  activeId: HomeTopic['id'];
  language: HomeLanguage;
  onSelect: (id: HomeTopic['id']) => void;
};

export function TopicCube({ topics, activeId, language, onSelect }: Props) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const activeIndex = topics.findIndex((topic) => topic.id === activeId);

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
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          step(event.key === 'ArrowRight' ? 1 : -1);
        }
        if (event.key === 'Home') onSelect(topics[0].id);
        if (event.key === 'End') onSelect(topics[topics.length - 1].id);
      }}
      onPointerDown={(event) => {
        if (event.button === 0) pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => { pointerStart.current = null; }}
    >
      <div className="topic-cube-floor" aria-hidden="true" />
      <div className="topic-cube-shadow" aria-hidden="true" />
      <div className="topic-cube" style={{ transform: ROTATIONS[activeId] }}>
        {topics.map((topic) => {
          const Icon = topic.icon;
          const faceClass = topic.id === 'security' ? 'topic-cube-front' : topic.id === 'crisis' ? 'topic-cube-right' : 'topic-cube-top';
          const selected = topic.id === activeId;
          return (
            <button
              type="button"
              key={topic.id}
              className={cn('topic-cube-face', faceClass, selected && 'is-active')}
              onClick={() => onSelect(topic.id)}
              aria-pressed={selected}
              tabIndex={selected ? 0 : -1}
            >
              <span className="topic-cube-index" aria-hidden="true">{topic.number}</span>
              <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden="true" />
              <span className="topic-cube-label">{topic.faceTitle[language]}</span>
              <small>{topic.faceSubtitle[language]}</small>
            </button>
          );
        })}
        <div className="topic-cube-face topic-cube-left" aria-hidden="true" />
        <div className="topic-cube-face topic-cube-back" aria-hidden="true" />
        <div className="topic-cube-face topic-cube-bottom" aria-hidden="true" />
      </div>
      <p className="topic-cube-hint">
        {language === 'de' ? 'Seite anklicken oder seitlich ziehen' : language === 'fr' ? 'Cliquez sur une face ou balayez horizontalement' : 'Click a face or swipe sideways'}
      </p>
    </div>
  );
}