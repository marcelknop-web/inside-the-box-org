import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { SiteChrome } from '@/components/SiteChrome';
import { TopicCube } from '@/components/overview/TopicCube';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HOME_KNOWLEDGE, HOME_TOPICS, type HomeLanguage, type HomeTopic } from '@/data/homeTopics';
import { useLanguage } from '@/i18n/LanguageContext';
import { ReferenceCard } from '@/components/ReferenceCard';
import { ALL_REFERENCES, HOME_REFERENCE_IDS, REFERENCES_COPY } from '@/data/references';

const COPY = {
  de: {
    overline: 'Cyber-Resilienz-Beratung',
    headline: 'Wenn es ernst wird, muss es funktionieren.',
    lead: 'Cybersecurity, Compliance und Krisenmanagement für Ihr Unternehmen.',
    cta: 'Erstgespräch vereinbaren',
    services: 'Themen',
    more: 'Mehr anzeigen',
    knowledge: 'Wissen & Tools',
    knowledgeLead: 'Fachwissen und ausgewählte Werkzeuge für konkrete Aufgaben.',
    team: 'Marcel Knop & Andreas Funder',
    teamLead: 'Senior-Beratung mit Erfahrung bei KPMG, Accenture, EY und PwC.',
    teamAction: 'Team ansehen',
    contact: 'Was steht bei Ihnen an?',
    contactLead: 'Klären wir gemeinsam, welcher Einstieg zu Ihrer Situation passt.',
    title: 'Cybersecurity, Compliance & Krisenmanagement',
    description: 'Senior-Beratung für Cybersecurity, Compliance, Krisenmanagement, Assessments und realistische Übungen.',
  },
  en: {
    overline: 'Cyber resilience consulting',
    headline: 'When it matters, it has to work.',
    lead: 'Cybersecurity, compliance and crisis management for your organisation.',
    cta: 'Schedule an introductory call',
    services: 'Topics',
    more: 'Show more',
    knowledge: 'Knowledge & tools',
    knowledgeLead: 'Expert insight and selected tools for concrete tasks.',
    team: 'Marcel Knop & Andreas Funder',
    teamLead: 'Senior advisory experience from KPMG, Accenture, EY and PwC.',
    teamAction: 'Meet the team',
    contact: 'What are you working on?',
    contactLead: 'Let us identify the right starting point for your situation.',
    title: 'Cybersecurity, compliance & crisis management',
    description: 'Senior advisory for cybersecurity, compliance, crisis management, assessments and realistic exercises.',
  },
  fr: {
    overline: 'Conseil en cyber-résilience',
    headline: 'Quand ça compte, ça doit fonctionner.',
    lead: 'Cybersécurité, conformité et gestion de crise pour votre entreprise.',
    cta: 'Planifier un premier échange',
    services: 'Thèmes',
    more: 'Voir plus',
    knowledge: 'Expertise & outils',
    knowledgeLead: 'Expertise et outils sélectionnés pour des tâches concrètes.',
    team: 'Marcel Knop & Andreas Funder',
    teamLead: 'Une expérience de conseil senior acquise chez KPMG, Accenture, EY et PwC.',
    teamAction: 'Découvrir l’équipe',
    contact: 'Quel est votre enjeu ?',
    contactLead: 'Identifions ensemble le point de départ adapté à votre situation.',
    title: 'Cybersécurité, conformité & gestion de crise',
    description: 'Conseil senior en cybersécurité, conformité, gestion de crise, évaluations et exercices réalistes.',
  },
};

const SESSION_KEY = 'overview:topic';

export default function Overview() {
  const location = useLocation();
  const { language } = useLanguage();
  const lang = language as HomeLanguage;
  const copy = COPY[lang];
  const [activeId, setActiveId] = useState<HomeTopic['id']>(() => {
    const saved = typeof window === 'undefined' ? null : sessionStorage.getItem(SESSION_KEY);
    return HOME_TOPICS.some((topic) => topic.id === saved) ? saved as HomeTopic['id'] : 'security';
  });
  const servicesRef = useRef<HTMLElement>(null);

  useEffect(() => sessionStorage.setItem(SESSION_KEY, activeId), [activeId]);

  useEffect(() => {
    if (location.hash || sessionStorage.getItem('overview:returnPending') !== '1') return;
    const scrollY = Number(sessionStorage.getItem('overview:scrollY'));
    sessionStorage.removeItem('overview:returnPending');
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: Number.isFinite(scrollY) ? scrollY : servicesRef.current?.offsetTop ?? 0, behavior: 'auto' });
      const sourceId = sessionStorage.getItem('overview:focus');
      const source = sourceId ? document.getElementById(sourceId) : null;
      source?.focus({ preventScroll: true });
    });
  }, [location.hash]);

  useEffect(() => {
    if (location.hash !== '#services' && location.hash !== '#knowledge') return;
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    window.requestAnimationFrame(() => {
      const restoring = id === 'services' && sessionStorage.getItem('overview:returnPending') === '1';
      const savedY = Number(sessionStorage.getItem('overview:scrollY'));
      if (restoring && Number.isFinite(savedY)) window.scrollTo({ top: savedY, behavior: 'auto' });
      else target.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (id === 'services') {
        sessionStorage.removeItem('overview:returnPending');
        const sourceId = sessionStorage.getItem('overview:focus');
        const source = sourceId ? document.getElementById(sourceId) : null;
        source?.focus({ preventScroll: true });
      }
    });
  }, [location.key, location.hash]);

  const selectTopic = useCallback((id: HomeTopic['id'], reveal = false) => {
    setActiveId(id);
    if (reveal) window.requestAnimationFrame(() => servicesRef.current?.scrollIntoView({ block: 'start' }));
  }, []);

  const rememberOffer = (id: string) => {
    sessionStorage.setItem('overview:focus', id);
    sessionStorage.setItem('overview:scrollY', String(window.scrollY));
    sessionStorage.setItem('overview:returnPending', '1');
  };

  const active = HOME_TOPICS.find((topic) => topic.id === activeId) ?? HOME_TOPICS[0];

  const renderTabs = (reveal: boolean) => (
    <div className="grid grid-cols-3" role="tablist" aria-label={copy.services}>
      {HOME_TOPICS.map((topic) => {
        const selected = topic.id === activeId;
        return (
          <button
            key={topic.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="topic-offers"
            onClick={() => selectTopic(topic.id, reveal)}
            className={`min-h-[60px] border-b px-1.5 py-2 text-center transition-colors md:min-h-[92px] md:border-b-0 md:border-r md:px-4 md:py-4 md:text-left md:last:border-r-0 ${selected ? 'border-t-2 border-t-primary bg-card text-foreground' : 'border-border text-foreground/65 hover:bg-card/60 hover:text-foreground'}`}
          >
            <span className="flex flex-col items-center justify-center gap-1.5 md:flex-row md:items-start md:justify-start md:gap-4">
              <topic.icon className="h-4 w-4 flex-none text-primary md:hidden" aria-hidden="true" />
              <span className="hidden font-mono text-[11px] text-primary md:inline">{topic.number}</span>
              <span>
                <strong className="block text-sm font-semibold md:hidden">{topic.shortTitle[lang]}</strong>
                <strong className="hidden text-sm font-semibold md:block">{topic.title[lang]}</strong>
                <small className="mt-1 hidden text-xs leading-relaxed text-muted-foreground md:block">{topic.choiceSubtitle[lang]}</small>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <SiteChrome activeSection={location.hash === '#knowledge' ? 'knowledge' : location.hash === '#services' ? 'services' : undefined}>
      <PageMeta title={copy.title} description={copy.description} canonicalPath="/" />

      <main className="overflow-x-hidden">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <p className="hidden font-mono text-[11px] uppercase text-primary tracking-[0.22em] md:block">{copy.overline}</p>
            <h1 id="home-title" className="home-title font-sans font-semibold">
              {copy.headline.split(' ').map((word, index, words) => (
                <span key={`${word}-${index}`} className={index === words.length - 1 ? 'text-primary' : undefined}>{word}{index < words.length - 1 ? ' ' : ''}</span>
              ))}
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-foreground/70 sm:mt-6">{copy.lead}</p>
            <Button asChild className="mt-7 hidden min-h-12 rounded-none px-5 font-semibold md:inline-flex"><Link to="/contact">{copy.cta}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="home-selector">
            <TopicCube topics={HOME_TOPICS} activeId={activeId} language={lang} onSelect={selectTopic} />
            <div className="md:hidden">{renderTabs(false)}</div>
          </div>
          <Button asChild className="min-h-12 w-full rounded-none px-5 font-semibold md:hidden"><Link to="/contact">{copy.cta}<ArrowRight aria-hidden="true" /></Link></Button>
        </section>

        <section id="services" ref={servicesRef} className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="sr-only">{copy.services}</h2>
            <div className="hidden md:block">{renderTabs(true)}</div>

            <div className="border-b border-t border-border py-4">
              <p className="max-w-2xl text-base text-foreground/75" aria-live="polite">{active.outcome[lang]}</p>
            </div>

            <div id="topic-offers" role="tabpanel" key={`${active.id}-${lang}`} className="grid gap-px bg-border py-px md:grid-cols-3">
              {active.offers.map((offer) => {
                const Icon = offer.icon;
                return (
                  <article key={offer.title.en} className="min-w-0 bg-card p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 flex-none text-primary" strokeWidth={1.6} aria-hidden="true" />
                      <h3 className="text-lg font-semibold leading-snug">{offer.title[lang]}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/65">{offer.description[lang]}</p>
                    <Link id={`offer-${offer.links[0].href.slice(1)}`} to={offer.links[0].href} onClick={() => rememberOffer(`offer-${offer.links[0].href.slice(1)}`)} className="group mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3 text-sm font-medium text-foreground/85 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span>{offer.links[0].label[lang]}</span><ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                    {offer.links.length > 1 && <Collapsible>
                      <CollapsibleTrigger className="group flex min-h-11 w-full items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {copy.more}<ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </CollapsibleTrigger>
                      <CollapsibleContent><ul className="space-y-1 border-t border-border pt-1">
                      {offer.links.slice(1).map((item) => (
                        <li key={item.href}>
                          <Link to={item.href} onClick={() => rememberOffer(`offer-${offer.links[0].href.slice(1)}`)} className="group flex min-h-11 items-center justify-between gap-3 py-2 text-sm text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span>{item.label[lang]}</span><ArrowRight className="h-4 w-4 flex-none transition-transform group-hover:translate-x-1" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul></CollapsibleContent></Collapsible>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="references" aria-labelledby="home-references" className="scroll-mt-20 border-t border-border py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="home-references" className="text-2xl font-semibold sm:text-3xl">{REFERENCES_COPY[lang].home}</h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {HOME_TOPICS.map((topic) => {
                const item = ALL_REFERENCES.find((r) => r.id === HOME_REFERENCE_IDS[topic.id]);
                return item ? <ReferenceCard key={item.id} item={{ ...item, topics: [topic.id], seeAlso: undefined }} lang={lang} /> : null;
              })}
            </ul>
            <Link to="/references" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">{REFERENCES_COPY[lang].all}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <section id="knowledge" className="scroll-mt-20 border-t border-border py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-7 max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">/ {copy.knowledge}</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{copy.knowledge}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">{copy.knowledgeLead}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {HOME_KNOWLEDGE.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={item.href} className="group min-w-0 border border-border bg-card p-5 transition-colors hover:border-primary/50">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.6} aria-hidden="true" />
                    <h3 className="mt-4 text-lg font-semibold group-hover:text-primary">{item.title[lang]}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.description[lang]}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-2xl items-start gap-4">
              <BadgeCheck className="mt-1 h-5 w-5 flex-none text-primary" aria-hidden="true" />
              <div><h2 className="text-lg font-semibold">{copy.team}</h2><p className="mt-1 text-sm text-foreground/60">{copy.teamLead}</p></div>
            </div>
            <Button asChild variant="outline" className="rounded-none"><Link to="/team">{copy.teamAction}</Link></Button>
          </div>
        </section>

        <section className="border-t border-border bg-card py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-2xl font-semibold">{copy.contact}</h2><p className="mt-2 max-w-xl text-sm text-foreground/65">{copy.contactLead}</p></div>
            <Button asChild className="min-h-12 rounded-none"><Link to="/contact">{copy.cta}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}