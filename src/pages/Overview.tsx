import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages, ArrowRight, Linkedin, Mail, Phone } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GeometricSymbol } from '@/components/GeometricSymbol';
import { consultantProfiles } from '@/data/consultantProfiles';

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
      en: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — strategic guidance and structured programmes that get you audit-ready.',
      de: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — strategische Begleitung und strukturierte Programme bis zur Audit-Reife.',
      fr: 'NIS-2, DORA, CRA, TISAX, PCI-DSS — accompagnement stratégique et programmes structurés jusqu\'à la maturité d\'audit.',
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
      en: 'Fractional CISO leadership and pragmatic operating models for lean security teams.',
      de: 'CISO-Leadership auf Zeit und pragmatische Betriebsmodelle für schlanke Security-Teams.',
      fr: 'Leadership RSSI à temps partiel et modèles opérationnels pragmatiques pour des équipes lean.',
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
      en: 'Tabletop exercises and hands-on training built for real-world pressure.',
      de: 'Tabletop-Übungen und praxisnahe Trainings für echten Ernstfall-Druck.',
      fr: 'Exercices tabletop et formations pratiques pour la pression réelle.',
    },
    services: [
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining' },
      { id: 'arena-training', titleKey: 'consulting.arenaTitle' },
      { id: 'red-team', titleKey: 'nav.redTeam' },
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
      en: 'Crisis management and incident response under real adversarial pressure.',
      de: 'Krisenmanagement und Incident Response unter echtem Angriffsdruck.',
      fr: 'Gestion de crise et réponse à incident sous pression adverse.',
    },
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle' },
      { id: 'incident-management', titleKey: 'consulting.incidentTitle' },
    ],
  },
];

/**
 * Compact non-interactive preview of all phases.
 * Used in the hero to hint at the structure waiting behind the CTA.
 * Shows diamonds 01–05 connected by a thin line.
 */
const PhasesPreview = ({
  phases,
  lang,
}: {
  phases: Phase[];
  lang: 'en' | 'de' | 'fr';
}) => (
  <div className="relative w-full max-w-2xl mx-auto pt-2 pb-4">
    {/* Horizontal connector */}
    <div
      className="absolute top-[14px] sm:top-[16px] h-px bg-primary/25 pointer-events-none"
      style={{ left: 'calc(100% / 10)', right: 'calc(100% / 10)' }}
      aria-hidden
    />
    <ol className="grid grid-cols-5 relative gap-1">
      {phases.map((phase) => (
        <li key={phase.id} className="flex flex-col items-center text-center px-0.5">
          {/* Diamond node */}
          <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 z-10 mb-2">
            <span
              className="absolute inset-0 m-auto w-6 h-6 sm:w-7 sm:h-7 rotate-45 bg-background"
              aria-hidden
            />
            <span
              className="absolute inset-0 m-auto w-6 h-6 sm:w-7 sm:h-7 rotate-45 border border-primary/40"
              aria-hidden
            />
            <span className="relative font-mono text-[9px] sm:text-[10px] tracking-[0.1em] text-muted-foreground">
              {phase.number}
            </span>
          </span>
          {/* Label — all uniformly dimmed */}
          <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.2em] text-muted-foreground/70 leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
            {phase.title[lang]}
          </span>
        </li>
      ))}
    </ol>
  </div>
);

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(PHASES[0].id);
  const [entered, setEntered] = useState<boolean>(false);
  const [drawer, setDrawer] = useState<'team' | 'contact' | null>(null);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const lang = language as 'en' | 'de' | 'fr';
  const active = PHASES.find((p) => p.id === activeId) ?? PHASES[0];

  const enterCta = t('welcome.heroCta');

  const headline =
    lang === 'de'
      ? 'Cyber-Resilienz in sechs Schritten.'
      : lang === 'fr'
      ? 'La cyber-résilience en six étapes.'
      : 'Cyber-resilience in six steps.';
  const subline =
    lang === 'de'
      ? 'Wählen Sie den Schritt, der gerade ansteht.'
      : lang === 'fr'
      ? 'Choisissez l\'étape qui vous concerne.'
      : 'Pick the step that matters right now.';
  const sectionLabel =
    lang === 'de' ? '/ ÜBERSICHT' : lang === 'fr' ? '/ APERÇU' : '/ OVERVIEW';
  const servicesLabel =
    lang === 'de' ? 'Leistungen in dieser Phase' : lang === 'fr' ? 'Services dans cette phase' : 'Services in this phase';
  const footerImprintLabel =
    lang === 'de' ? 'Impressum' : lang === 'fr' ? 'Mentions légales' : 'Imprint';
  const footerContactLabel =
    lang === 'de' ? 'Kontakt' : lang === 'fr' ? 'Contact' : 'Contact';

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
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-primary/10 gap-3">
        <button
          onClick={() => { setEntered(false); window.scrollTo({ top: 0 }); }}
          className="flex-shrink-0 transition-opacity hover:opacity-80"
          aria-label="inside-the-box"
          style={{ transform: 'scale(1.6)', transformOrigin: 'left center' }}
        >
          <GeometricSymbol size="xs" />
        </button>
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            onClick={() => setDrawer('team')}
            className="font-mono text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
          >
            {lang === 'de' ? 'TEAM' : lang === 'fr' ? 'ÉQUIPE' : 'TEAM'}
          </button>
          <button
            onClick={() => setLanguage(nextLanguage(language))}
            className="font-mono text-[10px] tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
            aria-label="Language"
          >
            <Languages className="w-3 h-3" />
            {language.toUpperCase()}
          </button>
        </div>
      </header>

      {!entered ? (
        /* Opener Hero — claim-dominant hierarchy */
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto w-full">
          <div className="w-full max-w-3xl text-center">
            {/* Category label */}
            <div
              className="font-mono text-[11px] sm:text-[13px] md:text-[14px] tracking-[0.4em] text-primary mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              / {t('welcome.heroConsulting').toUpperCase()}
            </div>

            {/* Wordmark — reduced ~35% (was text-7xl, now text-4xl→text-5xl max) */}
            <h1
              className="font-mono font-semibold text-2xl sm:text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-foreground/90 mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.title')}
            </h1>

            {/* Claim — now dominant */}
            <p
              className="font-sans font-light text-2xl sm:text-3xl md:text-5xl text-foreground leading-[1.15] tracking-[-0.01em] mb-5 opacity-0 animate-fade-in max-w-3xl mx-auto"
              style={{ animationDelay: '420ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.heroSubtitle')}
            </p>

            {/* Qualifier */}
            <p
              className="font-sans text-sm sm:text-base text-muted-foreground leading-snug mb-3 opacity-0 animate-fade-in max-w-xl mx-auto"
              style={{ animationDelay: '620ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.heroQualifier')}
            </p>

            {/* Byline */}
            <p
              className="font-mono text-[11px] sm:text-[12px] tracking-[0.18em] text-muted-foreground/70 mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: '780ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.heroByline')}
            </p>

            {/* Phases preview — non-interactive hint */}
            <div
              className="mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: '950ms', animationFillMode: 'forwards' }}
              aria-hidden
            >
              <PhasesPreview phases={PHASES} lang={lang} />
            </div>

            {/* CTA — questioning */}
            <button
              onClick={() => setEntered(true)}
              className="group inline-flex items-center gap-3 px-7 sm:px-8 py-4 border border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-mono text-[12px] sm:text-[14px] tracking-[0.25em] transition-all duration-300 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.6)] opacity-0 animate-fade-in"
              style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}
              aria-label={enterCta}
            >
              <span>{enterCta.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4 -translate-x-1 group-hover:translate-x-0 transition-transform" />
            </button>
          </div>
        </section>
      ) : (
        <>
      {/* Headline */}
      <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 max-w-6xl mx-auto w-full animate-fade-in">
        <div className="font-mono text-[10px] tracking-[0.3em] sm:tracking-[0.35em] text-primary mb-3 sm:mb-4">{sectionLabel}</div>
        <h1 className="font-mono font-semibold text-[26px] leading-[1.1] sm:text-3xl md:text-5xl sm:leading-[1.05] tracking-[-0.01em] text-foreground mb-3 sm:mb-4">
          {headline}
        </h1>
        <p className="font-sans text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl leading-snug">
          {subline}
        </p>
      </section>

      {/* Timeline (desktop) */}
      <section className="hidden md:block px-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="relative pt-2">
          <ol className="grid grid-cols-5 relative">
            {/* Connector line — spans only between first and last node centers */}
            <div
              className="absolute top-[26px] h-px bg-primary/25 pointer-events-none"
              style={{ left: 'calc(100% / 10)', right: 'calc(100% / 10)' }}
              aria-hidden
            />
            {PHASES.map((phase) => {
              const isActive = phase.id === activeId;
              return (
                <li key={phase.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveId(phase.id)}
                    className="group flex flex-col items-center gap-4 text-center w-full px-2"
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {/* Node */}
                    <span className="relative flex items-center justify-center w-[52px] h-[52px] z-10">
                      {/* Mask layer — solid bg blocks the connector line under the diamond */}
                      <span
                        className="absolute inset-0 m-auto w-[44px] h-[44px] rotate-45 bg-background"
                        aria-hidden
                      />
                      <span
                        className={`absolute inset-0 m-auto w-[44px] h-[44px] rotate-45 border transition-all duration-300 ease-out ${
                          isActive
                            ? 'border-primary bg-primary/10 phase-node-active'
                            : 'border-primary/50 group-hover:border-primary group-hover:scale-110 group-hover:bg-primary/5 group-hover:shadow-[0_0_18px_-6px_hsl(var(--primary)/0.55)]'
                        }`}
                        aria-hidden
                      />
                      <span
                        key={isActive ? `n-${phase.id}-active` : `n-${phase.id}`}
                        className={`relative font-mono text-[11px] tracking-[0.15em] transition-colors duration-300 ${
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        }`}
                      >
                        {phase.number}
                      </span>
                    </span>
                    {/* Label */}
                    <span
                      key={isActive ? `l-${phase.id}-active` : `l-${phase.id}`}
                      className={`font-mono text-[11px] tracking-[0.3em] transition-colors duration-300 whitespace-nowrap ${
                        isActive
                          ? 'text-primary phase-label-emphasis'
                          : 'text-muted-foreground group-hover:text-primary/90'
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
        <div
          key={active.id}
          className="grid grid-cols-12 gap-8 bg-background/60 backdrop-blur-[2px] border border-primary/15 p-8 animate-fade-in"
        >
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
                    className="w-full text-left flex items-center justify-between gap-3 font-mono text-sm tracking-[0.02em] text-foreground/90 hover:text-primary hover:translate-x-1 transition-all duration-200 py-2.5 border-b border-primary/10 group/svc"
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
      <section className="md:hidden flex-1 px-4 pb-10 max-w-6xl mx-auto w-full">
        <ol className="relative">
          {/* Vertical connector */}
          <div className="absolute left-4 top-3 bottom-3 w-px bg-primary/20" aria-hidden />
          {PHASES.map((phase) => {
            const isActive = phase.id === activeId;
            return (
              <li key={phase.id} className="relative pl-11 pb-4 last:pb-0">
                <button
                  onClick={() => setActiveId(isActive ? '' : phase.id)}
                  className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 group/node"
                  aria-expanded={isActive}
                >
                  {/* Mask layer — solid bg blocks the vertical connector line under the diamond */}
                  <span
                    className="absolute inset-0 m-auto w-8 h-8 rotate-45 bg-background"
                    aria-hidden
                  />
                  <span
                    className={`absolute inset-0 m-auto w-8 h-8 rotate-45 border transition-all duration-300 ${
                      isActive
                        ? 'border-primary bg-primary/10 phase-node-active'
                        : 'border-primary/40 group-hover/node:border-primary group-hover/node:bg-primary/5'
                    }`}
                    aria-hidden
                  />
                  <span
                    className={`relative font-mono text-[10px] tracking-[0.15em] transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover/node:text-primary'
                    }`}
                  >
                    {phase.number}
                  </span>
                </button>

                <button
                  onClick={() => setActiveId(isActive ? '' : phase.id)}
                  className="w-full text-left pt-0.5"
                  aria-expanded={isActive}
                >
                  {/* Yellow phase title — always bright */}
                  <div
                    key={isActive ? `m-${phase.id}-active` : `m-${phase.id}`}
                    className={`font-mono text-[10px] tracking-[0.28em] mb-1 transition-colors ${
                      isActive ? 'text-primary phase-label-emphasis' : 'text-primary/80'
                    }`}
                  >
                    {phase.title[lang]}
                  </div>
                  {/* Verb — dimmed when another phase is active */}
                  <div
                    className={`font-mono text-[15px] font-medium leading-snug transition-opacity duration-300 ${
                      !activeId || isActive ? 'text-foreground opacity-100' : 'text-foreground opacity-30'
                    }`}
                  >
                    {phase.verb[lang]}
                  </div>
                </button>

                {isActive && (
                  <div className="mt-3 animate-fade-in">
                    <p className="font-sans text-[13px] text-muted-foreground leading-snug mb-3">
                      {phase.description[lang]}
                    </p>
                    <ul className="space-y-0">
                      {phase.services.map((svc) => (
                        <li key={svc.id}>
                          <button
                            onClick={() => handleClick(svc.id)}
                            className="w-full text-left flex items-center justify-between gap-3 font-mono text-[13px] text-foreground/90 hover:text-primary transition-colors py-2 border-b border-primary/10"
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
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[9px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.22em] text-muted-foreground">
          <span className="whitespace-nowrap">
            © {new Date().getFullYear()} INSIDE-THE-BOX.ORG
          </span>
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              onClick={() => setDrawer('contact')}
              className="hover:text-primary transition-colors uppercase whitespace-nowrap"
            >
              {footerContactLabel}
            </button>
            <a
              href="https://www.linkedin.com/in/inside-the-box"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors inline-flex items-center gap-1.5 uppercase whitespace-nowrap"
            >
              <Linkedin className="w-3 h-3" /> LinkedIn
            </a>
            <a
              href="/impressum"
              className="hover:text-primary transition-colors uppercase whitespace-nowrap"
            >
              {footerImprintLabel}
            </a>
          </div>
        </div>
      </footer>

      {/* Team Drawer */}
      <Sheet open={drawer === 'team'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl bg-background/85 backdrop-blur-md border-l border-primary/20 overflow-y-auto"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[11px] tracking-[0.35em] text-primary mb-3">/ TEAM</div>
            <SheetTitle className="font-mono font-semibold text-2xl sm:text-3xl text-foreground">
              {lang === 'de'
                ? 'Wer hinter inside-the-box steht'
                : lang === 'fr'
                ? 'Qui se cache derrière inside-the-box'
                : 'The people behind inside-the-box'}
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-muted-foreground leading-relaxed">
              {lang === 'de'
                ? 'Zwei Senior-Berater, gemeinsam über 25 Jahre Erfahrung in Cybersecurity, Compliance und Krisenmanagement.'
                : lang === 'fr'
                ? 'Deux consultants seniors, plus de 25 ans d\'expérience combinée en cybersécurité, conformité et gestion de crise.'
                : 'Two senior consultants, 25+ combined years in cybersecurity, compliance and crisis management.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {consultantProfiles.map((p) => (
              <article key={p.name} className="bg-background/40 border border-primary/15 p-5">
                <header className="flex items-start gap-4 mb-4">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-16 h-16 rounded-full object-cover border border-primary/30"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-semibold text-base text-foreground">{p.name}</h3>
                    <p className="font-mono text-[11px] tracking-[0.15em] text-primary/80 uppercase mt-1">{p.role}</p>
                    {p.linkedinUrl && (
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors mt-2"
                      >
                        <Linkedin className="w-3 h-3" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </header>

                {p.bio && (
                  <p className="font-sans text-sm text-foreground/80 leading-relaxed mb-4">{p.bio}</p>
                )}

                <dl className="grid grid-cols-1 gap-3">
                  {p.sections.map((s) => (
                    <div key={s.title} className="border-t border-primary/10 pt-3">
                      <dt className="font-mono text-[10px] tracking-[0.25em] text-primary/70 uppercase mb-1.5">
                        {s.title}
                      </dt>
                      <dd className="font-sans text-[13px] text-foreground/85 leading-snug space-y-0.5">
                        {s.items.map((item, i) => (
                          <div key={i}>{item}</div>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Contact Drawer */}
      <Sheet open={drawer === 'contact'} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-background/85 backdrop-blur-md border-l border-primary/20"
        >
          <SheetHeader className="text-left mb-8">
            <div className="font-mono text-[11px] tracking-[0.35em] text-primary mb-3">/ CONTACT</div>
            <SheetTitle className="font-mono font-semibold text-2xl sm:text-3xl text-foreground">
              {lang === 'de' ? 'Sprechen wir.' : lang === 'fr' ? 'Parlons-en.' : 'Let\'s talk.'}
            </SheetTitle>
            <SheetDescription className="font-sans text-sm text-muted-foreground leading-relaxed">
              {lang === 'de'
                ? '30 Minuten, kein Pitch — eine erste Klärung, wo Sie stehen und was als Nächstes ansteht.'
                : lang === 'fr'
                ? '30 minutes, pas de pitch — une première clarification de votre situation et des prochaines étapes.'
                : '30 minutes, no pitch — a first clarification of where you stand and what comes next.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
            <a
              href="mailto:marcel@inside-the-box.org"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">{lang === 'fr' ? 'E-mail · Marcel Knop' : 'E-Mail · Marcel Knop'}</div>
                  <div className="font-mono text-sm text-foreground truncate">marcel@inside-the-box.org</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            <a
              href="tel:+4915205691648"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">{lang === 'de' ? 'Mobil · Marcel Knop' : lang === 'fr' ? 'Mobile · Marcel Knop' : 'Mobile · Marcel Knop'}</div>
                  <div className="font-mono text-sm text-foreground">+49 1520 569 1648</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>

            <a
              href="https://www.linkedin.com/in/inside-the-box"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 p-4 border border-primary/20 hover:border-primary bg-background/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Linkedin className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-0.5">LinkedIn</div>
                  <div className="font-mono text-sm text-foreground">inside-the-box</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Overview;
