import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * /overview — Journey Map
 *
 * Fünf Phasen der Cyber-Reife eines Unternehmens, als geführter Pfad.
 * Desktop: horizontale Timeline mit verbundenen Stationen.
 * Mobile: vertikaler Stepper.
 */

type Service = { id: string; titleKey: string };

type Phase = {
  id: string;
  number: string;
  title: { en: string; de: string; fr: string };
  verb: { en: string; de: string; fr: string };
  description: { en: string; de: string; fr: string };
  services: Service[];
};

const PHASES: Phase[] = [
  {
    id: 'understand',
    number: '01',
    title: { en: 'UNDERSTAND', de: 'VERSTEHEN', fr: 'COMPRENDRE' },
    verb: { en: 'Where do we stand?', de: 'Wo stehen wir?', fr: 'Où en sommes-nous ?' },
    description: {
      en: 'Position, situation, gap — before anything else gets planned.',
      de: 'Standortbestimmung, Lagebild, Gap-Analyse — bevor irgendetwas geplant wird.',
      fr: 'État des lieux, situation, analyse d\'écart — avant toute planification.',
    },
    services: [
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle' },
      { id: 'publications', titleKey: 'consulting.pubTitle' },
    ],
  },
  {
    id: 'comply',
    number: '02',
    title: { en: 'COMPLY', de: 'KONFORM WERDEN', fr: 'SE CONFORMER' },
    verb: {
      en: 'Meet the regulations.',
      de: 'Den Regulierungen gerecht werden.',
      fr: 'Répondre aux régulations.',
    },
    description: {
      en: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — audit-grade tools and structured programmes.',
      de: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — audit-taugliche Tools und strukturierte Programme.',
      fr: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — outils niveau audit et programmes structurés.',
    },
    services: [
      { id: 'nis2-dora', titleKey: 'consulting.nis2Title' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle' },
      { id: 'isms', titleKey: 'consulting.ismsTitle' },
    ],
  },
  {
    id: 'lead',
    number: '03',
    title: { en: 'LEAD', de: 'FÜHREN', fr: 'DIRIGER' },
    verb: {
      en: 'Run security like a function.',
      de: 'Security als Funktion führen.',
      fr: 'Piloter la sécurité comme une fonction.',
    },
    description: {
      en: 'Fractional CISO leadership and AI-augmented workflows for lean security teams.',
      de: 'CISO-Leadership auf Zeit und KI-gestützte Workflows für schlanke Security-Teams.',
      fr: 'Leadership RSSI à temps partiel et workflows augmentés par l\'IA.',
    },
    services: [
      { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle' },
      { id: 'ai-workflows', titleKey: 'consulting.aiWorkflowsTitle' },
    ],
  },
  {
    id: 'train',
    number: '04',
    title: { en: 'TRAIN', de: 'TRAINIEREN', fr: 'ENTRAÎNER' },
    verb: {
      en: 'Practice before it counts.',
      de: 'Üben, bevor es zählt.',
      fr: 'S\'entraîner avant que ça compte.',
    },
    description: {
      en: 'Tabletop exercises, arena drills and simulators built for real-world pressure.',
      de: 'Tabletop-Übungen, Arena-Drills und Simulatoren für echten Ernstfall-Druck.',
      fr: 'Exercices tabletop, drills arena et simulateurs pour la pression réelle.',
    },
    services: [
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining' },
      { id: 'arena-training', titleKey: 'consulting.arenaTitle' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle' },
    ],
  },
  {
    id: 'respond',
    number: '05',
    title: { en: 'RESPOND', de: 'REAGIEREN', fr: 'RÉAGIR' },
    verb: {
      en: 'When the worst happens.',
      de: 'Wenn der Ernstfall eintritt.',
      fr: 'Quand le pire arrive.',
    },
    description: {
      en: 'Crisis management, incident response and red-teaming under real adversarial pressure.',
      de: 'Krisenmanagement, Incident Response und Red-Teaming unter echtem Angriffsdruck.',
      fr: 'Gestion de crise, réponse à incident et red-teaming sous pression adverse.',
    },
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle' },
      { id: 'incident-management', titleKey: 'consulting.incidentTitle' },
      { id: 'red-team', titleKey: 'nav.redTeam' },
    ],
  },
];

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(PHASES[0].id);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const lang = language as 'en' | 'de' | 'fr';
  const active = PHASES.find((p) => p.id === activeId) ?? PHASES[0];

  const headline =
    lang === 'de'
      ? 'Die Reise zu echter Cyber-Resilienz.'
      : lang === 'fr'
      ? 'Le chemin vers une vraie cyber-résilience.'
      : 'The journey to real cyber-resilience.';
  const subline =
    lang === 'de'
      ? 'Fünf Phasen. Wählen Sie die, in der Sie gerade stehen.'
      : lang === 'fr'
      ? 'Cinq phases. Choisissez celle où vous en êtes.'
      : 'Five phases. Pick the one you\'re in right now.';
  const sectionLabel =
    lang === 'de' ? '/ DIE REISE' : lang === 'fr' ? '/ LE PARCOURS' : '/ THE JOURNEY';
  const servicesLabel =
    lang === 'de' ? 'Leistungen in dieser Phase' : lang === 'fr' ? 'Services dans cette phase' : 'Services in this phase';

  return (
    <div className="min-h-screen w-full text-foreground flex flex-col">
      <PageMeta
        title="Journey"
        description="The five phases of cyber-resilience — from understanding your gap to responding under pressure."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-primary/10">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← INSIDE-THE-BOX
        </button>
        <button
          onClick={() => setLanguage(nextLanguage(language))}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Language"
        >
          <Languages className="w-3 h-3" />
          {language.toUpperCase()}
        </button>
      </header>

      {/* Headline */}
      <section className="px-6 pt-12 pb-8 max-w-6xl mx-auto w-full">
        <div className="font-mono text-[10px] tracking-[0.35em] text-primary mb-4">{sectionLabel}</div>
        <h1 className="font-mono font-semibold text-3xl md:text-5xl leading-[1.05] tracking-[-0.01em] text-foreground mb-4">
          {headline}
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground max-w-2xl leading-snug">
          {subline}
        </p>
      </section>

      {/* Timeline (desktop) */}
      <section className="hidden md:block px-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-[18px] h-px bg-primary/20" aria-hidden />
          <ol className="grid grid-cols-5 gap-2 relative">
            {PHASES.map((phase) => {
              const isActive = phase.id === activeId;
              return (
                <li key={phase.id} className="flex flex-col items-start">
                  <button
                    onClick={() => setActiveId(phase.id)}
                    className="group flex flex-col items-start gap-3 text-left w-full"
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {/* Node */}
                    <span className="relative flex items-center justify-center w-9 h-9">
                      <span
                        className={`absolute inset-0 m-auto w-9 h-9 rotate-45 border transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10'
                            : 'border-primary/40 bg-background group-hover:border-primary/70'
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`relative font-mono text-[10px] tracking-[0.15em] transition-colors ${
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {phase.number}
                      </span>
                    </span>
                    {/* Label */}
                    <span
                      className={`font-mono text-[11px] tracking-[0.3em] transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {phase.title[lang]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Active phase detail (desktop) */}
      <section className="hidden md:block flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-12 gap-8 bg-background/60 backdrop-blur-[2px] border border-primary/15 p-8">
          {/* Left — phase intro */}
          <div className="col-span-7">
            <div className="font-mono text-[10px] tracking-[0.35em] text-primary/70 mb-3">
              PHASE {active.number} / {String(PHASES.length).padStart(2, '0')}
            </div>
            <h2 className="font-mono font-semibold text-3xl lg:text-4xl leading-[1.1] tracking-[-0.005em] text-foreground mb-4">
              {active.verb[lang]}
            </h2>
            <p className="font-sans text-base text-muted-foreground leading-relaxed max-w-xl">
              {active.description[lang]}
            </p>
          </div>
          {/* Right — services */}
          <div className="col-span-5 border-l border-primary/15 pl-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-primary/70 mb-4">
              {servicesLabel.toUpperCase()}
            </div>
            <ul className="space-y-1">
              {active.services.map((svc) => (
                <li key={svc.id}>
                  <button
                    onClick={() => handleClick(svc.id)}
                    className="w-full text-left flex items-center justify-between gap-3 font-mono text-sm tracking-[0.02em] text-foreground/90 hover:text-primary transition-colors py-2.5 border-b border-primary/10 group/svc"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-block w-1.5 h-1.5 rotate-45 border border-primary/60 group-hover/svc:bg-primary group-hover/svc:border-primary transition-colors flex-shrink-0"
                        aria-hidden
                      />
                      <span className="truncate">{t(svc.titleKey)}</span>
                    </span>
                    <ArrowRight
                      className="w-3.5 h-3.5 text-primary/0 group-hover/svc:text-primary -translate-x-1 group-hover/svc:translate-x-0 transition-all flex-shrink-0"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Mobile vertical stepper */}
      <section className="md:hidden flex-1 px-6 pb-12 max-w-6xl mx-auto w-full">
        <ol className="relative">
          {/* Vertical connector */}
          <div className="absolute left-[18px] top-3 bottom-3 w-px bg-primary/20" aria-hidden />
          {PHASES.map((phase) => {
            const isActive = phase.id === activeId;
            return (
              <li key={phase.id} className="relative pl-12 pb-6 last:pb-0">
                <button
                  onClick={() => setActiveId(isActive ? '' : phase.id)}
                  className="absolute left-0 top-0 flex items-center justify-center w-9 h-9"
                  aria-expanded={isActive}
                >
                  <span
                    className={`absolute inset-0 m-auto w-9 h-9 rotate-45 border transition-all ${
                      isActive ? 'border-primary bg-primary/10' : 'border-primary/40 bg-background'
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`relative font-mono text-[10px] tracking-[0.15em] ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {phase.number}
                  </span>
                </button>

                <button
                  onClick={() => setActiveId(isActive ? '' : phase.id)}
                  className="w-full text-left"
                  aria-expanded={isActive}
                >
                  <div
                    className={`font-mono text-[11px] tracking-[0.3em] mb-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {phase.title[lang]}
                  </div>
                  <div className="font-mono text-base font-medium text-foreground leading-snug">
                    {phase.verb[lang]}
                  </div>
                </button>

                {isActive && (
                  <div className="mt-3 animate-fade-in">
                    <p className="font-sans text-sm text-muted-foreground leading-snug mb-4">
                      {phase.description[lang]}
                    </p>
                    <ul className="space-y-0">
                      {phase.services.map((svc) => (
                        <li key={svc.id}>
                          <button
                            onClick={() => handleClick(svc.id)}
                            className="w-full text-left flex items-center justify-between gap-3 font-mono text-sm text-foreground/90 hover:text-primary transition-colors py-2.5 border-b border-primary/10"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="inline-block w-1.5 h-1.5 rotate-45 border border-primary/60 flex-shrink-0"
                                aria-hidden
                              />
                              <span className="truncate">{t(svc.titleKey)}</span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 font-mono text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.25em] text-muted-foreground whitespace-nowrap">
          <span>© {new Date().getFullYear()} INSIDE-THE-BOX</span>
        </div>
      </footer>
    </div>
  );
};

export default Overview;
