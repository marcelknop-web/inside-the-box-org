import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { ReferenceCard } from '@/components/ReferenceCard';
import { SiteChrome } from '@/components/SiteChrome';
import { Button } from '@/components/ui/button';
import { HOME_TOPICS, type HomeLanguage } from '@/data/homeTopics';
import { CORE_REFERENCES, EARLIER_REFERENCES, FURTHER_CLIENTS, REFERENCES_COPY } from '@/data/references';
import { useLanguage } from '@/i18n/LanguageContext';

export function ReferencesPage() {
  const { language } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = REFERENCES_COPY[lang];
  // Group by primary topic (first tag); further topics stay visible as tags.
  const groups = HOME_TOPICS.map((topic) => ({ topic, items: CORE_REFERENCES.filter((r) => r.topics[0] === topic.id) })).filter((g) => g.items.length);

  return (
    <SiteChrome>
      <PageMeta title={copy.h1} description={copy.metaDesc} canonicalPath="/references" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6 lg:px-0">
        <header className="max-w-3xl border-b border-primary/20 pb-8">
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">{copy.h1}</h1>
          <p className="mt-5 text-base leading-relaxed text-foreground/75 sm:text-lg">{copy.intro}</p>
        </header>

        {groups.map(({ topic, items }) => (
          <section key={topic.id} aria-labelledby={`ref-${topic.id}`} className="pt-9">
            <h2 id={`ref-${topic.id}`} className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              <topic.icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />{topic.shortTitle[lang]}
            </h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => <ReferenceCard key={item.id} item={item} lang={lang} />)}
            </ul>
          </section>
        ))}

        <section aria-labelledby="ref-earlier" className="pt-10">
          <h2 id="ref-earlier" className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{copy.earlier}</h2>
          <p className="mt-2 text-sm text-foreground/60">{copy.earlierNote}</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EARLIER_REFERENCES.map((item) => <ReferenceCard key={item.id} item={item} lang={lang} />)}
          </ul>
        </section>

        <section aria-labelledby="ref-further" className="pt-10">
          <h2 id="ref-further" className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{copy.further}</h2>
          <p className="mt-2 text-sm text-foreground/60">{copy.earlierNote}</p>
          <dl className="mt-4 grid gap-px border border-border bg-border md:grid-cols-2">
            {FURTHER_CLIENTS.map((group) => (
              <div key={group.label.en} className="bg-card/90 p-5">
                <dt className="text-sm font-semibold text-foreground">{group.label[lang]}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-foreground/70">{group.clients.join(' · ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12 border-t border-primary/25 pt-8">
          <Button asChild className="min-h-12 w-fit rounded-none px-5 font-sans font-semibold"><Link to="/contact">{copy.cta}<ArrowRight aria-hidden="true" /></Link></Button>
        </div>
      </main>
    </SiteChrome>
  );
}
