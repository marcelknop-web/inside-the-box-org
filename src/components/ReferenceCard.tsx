import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HOME_TOPICS, type HomeLanguage } from '@/data/homeTopics';
import { REFERENCES_COPY, type ClientReference } from '@/data/references';

export function ReferenceCard({ item, lang, showTags = true }: { item: ClientReference; lang: HomeLanguage; showTags?: boolean }) {
  const copy = REFERENCES_COPY[lang];
  const topics = item.topics.map((id) => HOME_TOPICS.find((t) => t.id === id)).filter(Boolean);
  const Icon = topics[0]?.icon;
  return (
    <li className="flex min-w-0 gap-4 border border-border bg-card/90 p-5 shadow-card">
      {Icon && <Icon className="mt-1 h-5 w-5 flex-none text-primary" strokeWidth={1.6} aria-hidden="true" />}
      <div className="min-w-0">
        <h3 className="break-words text-lg font-semibold leading-snug text-foreground">{item.name}</h3>
        {(item.years || showTags) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-highlight">
            {item.years && <span>{item.years[lang]}</span>}
            {showTags && topics.map((t) => <span key={t!.id} className="text-foreground/55">#{t!.shortTitle[lang]}</span>)}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{item.text[lang]}</p>
        {item.seeAlso && (
          <Link to={item.seeAlso} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            {copy.seeAlso}<ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </li>
  );
}
