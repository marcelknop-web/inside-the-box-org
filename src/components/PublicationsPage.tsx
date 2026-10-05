import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PUBLICATION_GROUPS } from '@/data/publications';
import type { HomeLanguage } from '@/data/homeTopics';
import { useLanguage } from '@/i18n/LanguageContext';

const COPY = {
  de: { h1: 'Artikel, Vorträge & Trainings', intro: 'Veröffentlichungen und Trainings von Marcel Knop zu Cybersecurity und Krisenbewältigung.', cta: 'Training oder Vortrag anfragen', newTab: '(öffnet in neuem Tab)' },
  en: { h1: 'Articles, talks & trainings', intro: 'Publications and trainings by Marcel Knop on cybersecurity and crisis management.', cta: 'Request a training or talk', newTab: '(opens in new tab)' },
  fr: { h1: 'Articles, conférences & formations', intro: 'Publications et formations de Marcel Knop en cybersécurité et gestion de crise.', cta: 'Demander une formation ou une conférence', newTab: '(s’ouvre dans un nouvel onglet)' },
};

export function PublicationsPage() {
  const { language } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = COPY[lang];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6 lg:px-0">
      <header className="max-w-3xl border-b border-primary/20 pb-8">
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">{copy.h1}</h1>
        <p className="mt-5 text-base leading-relaxed text-foreground/75 sm:text-lg">{copy.intro}</p>
      </header>

      {PUBLICATION_GROUPS.map(({ id, icon: Icon, title, entries }) => (
        <section key={id} aria-labelledby={`pub-${id}`} className="pt-9">
          <h2 id={`pub-${id}`} className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />{title[lang]}
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {entries.map((entry) => (
              <li key={entry.title} className="flex min-w-0 gap-4 border border-border bg-card/90 p-5 shadow-card">
                <Icon className="mt-1 h-5 w-5 flex-none text-primary" strokeWidth={1.6} aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold leading-snug text-foreground">{entry.title}</h3>
                  <p className="mt-1 font-mono text-xs text-highlight">{entry.source[lang]}{entry.year && !entry.source[lang].includes(entry.year) ? ` · ${entry.year}` : ''}</p>
                  <p className="mt-1 text-sm text-foreground/80">{entry.role[lang]}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/65">{entry.text[lang]}</p>
                  {entry.link && (
                    <a href={entry.link.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
                      {entry.link.label[lang]}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">{copy.newTab}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-12 border-t border-primary/25 pt-8">
        <Button asChild className="min-h-12 w-fit rounded-none px-5 font-sans font-semibold"><Link to="/contact">{copy.cta}<ArrowRight aria-hidden="true" /></Link></Button>
      </div>
    </article>
  );
}
