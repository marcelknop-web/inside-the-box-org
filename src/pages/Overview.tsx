import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { SiteChrome } from '@/components/SiteChrome';
import { ServiceSymbol, type ServiceTheme } from '@/components/ServiceSymbol';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/** Mapping: Phase-ID → ServiceSymbol-Theme für die Diamant-Marker. */
const PHASE_SYMBOLS: Record<string, ServiceTheme> = {
  understand: 'phase-understand',
  comply: 'phase-comply',
  lead: 'phase-govern',
  train: 'phase-train',
  respond: 'phase-respond',
};

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

/**
 * Render a sentence and animate occurrences of given "stress words" with a
 * flickering effect — visualises the meaning of the word itself.
 * Case-insensitive match, preserves original casing in the output.
 */
const renderWithStressFlicker = (text: string, words: string[]): React.ReactNode => {
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? (
      <span key={i} className="text-stress-flicker font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
};

const PHASES: Phase[] = [
  {
    id: 'understand',
    number: '01',
    title: { en: 'UNDERSTAND', de: 'VERSTEHEN', fr: 'COMPRENDRE' },
    verb: {
      en: 'Robust situational picture and clear priorities as a basis for decisions',
      de: 'Belastbares Lagebild und klare Prioritäten als Entscheidungsgrundlage',
      fr: 'Vision claire de la situation et priorités pour décider en connaissance de cause',
    },
    description: {
      en: 'A solid baseline assessment as the foundation for every measure.',
      de: 'Fundierte Standortbestimmung als Grundlage aller Maßnahmen.',
      fr: 'Un état des lieux solide comme fondement de toute mesure.',
    },
    services: [
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle' },
      { id: 'publications', titleKey: 'consulting.pubTitle' },
      { id: 'ki-lab', titleKey: 'consulting.aiLabTitle' },
    ],
  },
  {
    id: 'comply',
    number: '02',
    title: { en: 'ALIGN', de: 'AUSRICHTEN', fr: 'ALIGNER' },
    verb: {
      en: 'Structured programmes and clear target pictures up to audit readiness',
      de: 'Strukturierte Programme und klare Zielbilder bis zur Audit-Reife',
      fr: 'Programmes structurés et cibles claires jusqu\'à la maturité d\'audit',
    },
    description: {
      en: 'Strategic guidance and structured programmes that get you audit-ready.',
      de: 'Strategische Begleitung und strukturierte Programme bis zur Audit-Reife.',
      fr: 'Accompagnement stratégique et programmes structurés jusqu\'à la maturité d\'audit.',
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
      en: 'Clear responsibilities and effective governance models',
      de: 'Klare Verantwortlichkeiten und wirksame Steuerungsmodelle',
      fr: 'Responsabilités claires et modèles de pilotage efficaces',
    },
    description: {
      en: 'Fractional CISO leadership and pragmatic operating models for lean security teams.',
      de: 'CISO-Leadership auf Zeit und pragmatische Betriebsmodelle für schlanke Security-Teams.',
      fr: 'Leadership RSSI à temps partiel et modèles opérationnels pragmatiques pour des équipes lean.',
    },
    services: [
      { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle' },
      { id: 'soc-operations', titleKey: 'consulting.socOpsTitle' },
      { id: 'ai-workflows', titleKey: 'consulting.aiWorkflowsTitle' },
    ],
  },
  {
    id: 'train',
    number: '04',
    title: { en: 'TRAIN', de: 'TRAINIEREN', fr: 'ENTRAÎNER' },
    verb: {
      en: 'Realistic exercises for resilient decisions under pressure',
      de: 'Realitätsnahe Übungen für belastbare Entscheidungen unter Druck',
      fr: 'Exercices réalistes pour des décisions solides sous pression',
    },
    description: {
      en: 'Tabletop exercises and hands-on training built for real-world pressure.',
      de: 'Tabletop-Übungen und praxisnahe Trainings für echten Ernstfall-Druck.',
      fr: 'Exercices tabletop et formations pratiques pour la pression réelle.',
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
      en: 'Structured incident, continuity and crisis management under real adversarial pressure',
      de: 'Strukturiertes Incident-, Notfall- und Krisenmanagement unter realem Angriffsdruck',
      fr: 'Gestion d\'incident, de continuité et de crise structurée sous pression adverse réelle',
    },
    description: {
      en: 'Crisis management, business continuity and incident response under real adversarial pressure.',
      de: 'Krisenmanagement, Notfallmanagement und Incident Response unter echtem Angriffsdruck.',
      fr: 'Gestion de crise, continuité d\'activité et réponse à incident sous pression adverse.',
    },
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle' },
      { id: 'bcm', titleKey: 'consulting.bcmTitle' },
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
    {/* Mobile: 3 columns (auto-wraps to 2 rows) — emphasises equal rank,
        gives each label real breathing room. Desktop keeps 5-in-a-row. */}
    <ul className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-4 sm:gap-x-5 sm:gap-y-3">
      {phases.map((phase, idx) => {
        // Don't draw a connector on the first item of any row.
        // Mobile = 3 cols → first of each row is idx 0 and 3.
        // Desktop (sm+) = 5 cols → only idx 0 is first.
        const isFirstMobileRow = idx % 3 === 0;
        const isFirstDesktopRow = idx === 0;
        return (
          <li key={phase.id} className="group/phase relative flex flex-col items-center text-center min-w-0 cursor-default">
            {/* Connector segment between diamonds (mobile breakpoint). */}
            {!isFirstMobileRow && (
              <span
                className="absolute h-px bg-primary/40 pointer-events-none top-[10px] sm:hidden"
                style={{ right: 'calc(50% + 9px)', left: 'calc(-50% + 9px)' }}
                aria-hidden
              />
            )}
            {/* Connector segment between diamonds (desktop breakpoint). */}
            {!isFirstDesktopRow && (
              <span
                className="absolute h-px bg-primary/40 pointer-events-none hidden sm:block top-[12px]"
                style={{ right: 'calc(50% + 11px)', left: 'calc(-50% + 11px)' }}
                aria-hidden
              />
            )}
            {/* Diamond marker — outlined gold (all phases equal-rank), with subtle glow shadow. */}
            <span className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 z-10 mb-1.5 sm:mb-2">
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rotate-45 border-[1.5px] border-primary bg-background transition-all duration-300 group-hover/phase:scale-125 group-hover/phase:bg-primary/20"
                style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.45), 0 1px 2px hsl(var(--primary) / 0.25)' }}
                aria-hidden
              />
            </span>
            {/* Label — equal-rank text under each diamond. */}
            <span className="font-mono text-[12px] sm:text-[13px] tracking-[0.14em] sm:tracking-[0.22em] text-foreground/85 leading-[1.2] w-full px-0 transition-colors duration-300 group-hover/phase:text-primary">
              {phase.title[lang]}
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);

const PHASE_STORAGE_KEY = 'overview:lastPhase';

const Overview = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  // Restore the last selected phase from sessionStorage so returning from a
  // sub-page lands on the same step the user originally jumped from.
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === 'undefined') return PHASES[0].id;
    const stored = window.sessionStorage.getItem(PHASE_STORAGE_KEY);
    if (stored && PHASES.some((p) => p.id === stored)) return stored;
    return PHASES[0].id;
  });
  // Brand link from sub-pages passes { state: { skipHero: true } } so we land
  // directly on the journey map instead of the opener hero.
  const [entered, setEntered] = useState<boolean>(
    Boolean((location.state as { skipHero?: boolean } | null)?.skipHero),
  );
  // References section uses the same expand/collapse logic as the phases.
  const [referencesOpen, setReferencesOpen] = useState(false);
  // React to brand-link navigations:
  //  • skipHero=true → land on the journey-map (entered=true)
  //  • no state      → replay the hero opener (entered=false)
  useEffect(() => {
    const skip = (location.state as { skipHero?: boolean } | null)?.skipHero;
    setEntered(Boolean(skip));
  }, [location.state, location.key]);

  // Persist phase selection so it survives navigation to a service sub-page.
  useEffect(() => {
    if (typeof window === 'undefined' || !activeId) return;
    window.sessionStorage.setItem(PHASE_STORAGE_KEY, activeId);
  }, [activeId]);

  const handleClick = useCallback(
    (id: string, phaseId: string) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PHASE_STORAGE_KEY, phaseId);
      }
      navigate(`/${id}`);
    },
    [navigate],
  );

  const lang = language as 'en' | 'de' | 'fr';
  const active = PHASES.find((p) => p.id === activeId) ?? PHASES[0];

  const enterCta = t('welcome.heroCta');

  const headline =
    lang === 'de'
      ? 'Cyber-Resilienz in fünf Schritten'
      : lang === 'fr'
      ? 'La cyber-résilience en cinq étapes'
      : 'Cyber-resilience in five steps';
  const subline =
    lang === 'de'
      ? 'Wo stehen Sie gerade?'
      : lang === 'fr'
      ? 'Où en êtes-vous ?'
      : 'Where do you stand?';
  const sectionLabel =
    lang === 'de' ? '/ ÜBERSICHT' : lang === 'fr' ? '/ APERÇU' : '/ OVERVIEW';
  const servicesLabel =
    lang === 'de' ? 'Unsere Leistungen' : lang === 'fr' ? 'Nos services' : 'Our services';

  // Kunden-Referenzen — kuratierte Liste aus dem CV (offiziell freigegeben)
  // gegliedert in Branchen-Cluster, plus ausgewählte Highlight-Mandate.
  const referenceSectionLabel =
    lang === 'de' ? '/ REFERENZEN' : lang === 'fr' ? '/ RÉFÉRENCES' : '/ REFERENCES';
  const referenceHeadline =
    lang === 'de'
      ? 'Vertrauen aus 35 Jahren gemeinsamer Erfahrung, 400+ Projekten.'
      : lang === 'fr'
      ? 'Confiance bâtie sur 35 ans d\'expérience commune et 400+ projets.'
      : 'Trust built on 35 years of shared experience and 400+ projects.';
  const referenceSubline =
    lang === 'de'
      ? 'Eine KI-Website bauen kann jeder. Belastbare Cybersecurity-Beratung über Jahrzehnte beweist sich an den Mandaten.'
      : lang === 'fr'
      ? 'N\'importe qui peut créer un site IA. Un conseil cybersécurité solide se prouve sur des décennies de mandats.'
      : 'Anyone can spin up an AI website. Robust cybersecurity advisory proves itself across decades of mandates.';

  const referenceClusters: { label: { de: string; en: string; fr: string }; clients: string[] }[] = [
    {
      label: {
        de: 'Finanzdienstleister & Aufsicht',
        en: 'Financial services & supervision',
        fr: 'Services financiers & supervision',
      },
      clients: [
        'BaFin', 'Deutsche Bank', 'Deutsche Bundesbank', 'ECB', 'Commerzbank',
        'DKB', 'Comdirect', 'Swiss Life', 'MunichRe', 'Swiss Re', 'Allianz', 'ERGO',
        'Hansainvest', 'Sal. Oppenheim', 'AirPlus', 'FI-TS', 'SAP Fioneer',
      ],
    },
    {
      label: {
        de: 'KRITIS, Energie & Public',
        en: 'KRITIS, energy & public sector',
        fr: 'OIV, énergie & secteur public',
      },
      clients: ['RWE', 'EnBW', 'Deutsche Bahn', 'Deutsche Post / DHL', 'BSI / UP KRITIS', 'ADAC', 'Bundeswehr'],
    },
    {
      label: {
        de: 'Industrie, Automotive & OT',
        en: 'Industry, automotive & OT',
        fr: 'Industrie, automobile & OT',
      },
      clients: [
        'Daimler', 'Mercedes-Benz Bank', 'Continental', 'BMW', 'General Motors',
        'Opel Bank', 'VW Financial Services', 'WABCO', 'Siemens', 'KION', 'MAN',
        'Bilfinger', 'SGL-Carbon', 'Arlanxeo', 'Merck', 'Pfizer', 'Alois Müller', 'Jägermeister',
      ],
    },
    {
      label: {
        de: 'Aviation & Maritime',
        en: 'Aviation & maritime',
        fr: 'Aéronautique & maritime',
      },
      clients: ['Deutsche Lufthansa', 'Lufthansa Technik', 'Airbus', 'Fraport', 'Deutsche Flugsicherung', 'Hapag-Lloyd'],
    },
    {
      label: {
        de: 'Software, Tech & Retail',
        en: 'Software, tech & retail',
        fr: 'Logiciel, tech & retail',
      },
      clients: [
        'SAP', 'Sage', 'arvato', 'Burda', 'CTS Eventim', 'Cyberport', 'Saturn',
        'Tchibo', 'Zalando', 'Otto', 'VALOVIS', 'Diethelm Keller (CH)',
      ],
    },
  ];

  const highlightMandates: { tag: string; text: { de: string; en: string; fr: string } }[] = [
    {
      tag: 'DORA',
      text: {
        de: 'SAP Fioneer — DORA-konforme Incident-Reporting-Pipeline.',
        en: 'SAP Fioneer — DORA-compliant incident-reporting pipeline.',
        fr: 'SAP Fioneer — chaîne de reporting d\'incidents conforme DORA.',
      },
    },
    {
      tag: 'SOC / SIEM',
      text: {
        de: 'Deutsche Lufthansa — SIEM/CDC-Prozesstransformation und SOC-Runbooks.',
        en: 'Deutsche Lufthansa — SIEM/CDC process transformation and SOC runbooks.',
        fr: 'Deutsche Lufthansa — transformation des processus SIEM/CDC et runbooks SOC.',
      },
    },
    {
      tag: 'PART-IS',
      text: {
        de: 'Lufthansa Airlines & Technik — Scoping der PART-IS-Implementierung.',
        en: 'Lufthansa Airlines & Technik — scoping of the PART-IS implementation.',
        fr: 'Lufthansa Airlines & Technik — cadrage de la mise en œuvre PART-IS.',
      },
    },
    {
      tag: 'OT / Maritime',
      text: {
        de: 'Hapag-Lloyd — maritimes Cybersecurity-Framework für Starlink-Flottenkonnektivität.',
        en: 'Hapag-Lloyd — maritime cybersecurity framework for Starlink fleet connectivity.',
        fr: 'Hapag-Lloyd — cadre cybersécurité maritime pour la connectivité Starlink de flotte.',
      },
    },
    {
      tag: 'ISMS',
      text: {
        de: 'Diethelm Keller (CH) — konzernweites ISMS über zehn europäische Töchter.',
        en: 'Diethelm Keller (CH) — group-wide ISMS across ten European subsidiaries.',
        fr: 'Diethelm Keller (CH) — SMSI groupe sur dix filiales européennes.',
      },
    },
    {
      tag: 'TIBER-DE',
      text: {
        de: 'FI-TS — Konzeption und C-Level-Präsentation des TIBER-DE-Übungsframeworks.',
        en: 'FI-TS — design and C-level presentation of the TIBER-DE exercise framework.',
        fr: 'FI-TS — conception et présentation C-level du cadre d\'exercice TIBER-DE.',
      },
    },
    {
      tag: 'ISO 27001 / TISAX',
      text: {
        de: 'DataGuard — TISAX-Assessments und ISO-27001-Audits für Automotive-Zulieferer.',
        en: 'DataGuard — TISAX assessments and ISO 27001 audits for automotive suppliers.',
        fr: 'DataGuard — évaluations TISAX et audits ISO 27001 pour fournisseurs automobiles.',
      },
    },
    {
      tag: 'PCI-DSS',
      text: {
        de: 'Cyberport, AirPlus, Lufthansa — PCI-DSS-Implementierung und Beratung.',
        en: 'Cyberport, AirPlus, Lufthansa — PCI-DSS implementation and advisory.',
        fr: 'Cyberport, AirPlus, Lufthansa — mise en œuvre et conseil PCI-DSS.',
      },
    },
  ];

  const referenceFootnote =
    lang === 'de'
      ? 'Auswahl. Vollständige Mandatshistorie auf Anfrage.'
      : lang === 'fr'
      ? 'Sélection. Historique complet des mandats sur demande.'
      : 'Selection. Full mandate history available on request.';

  return (
    <SiteChrome onBrandClick={() => { setEntered(false); window.scrollTo({ top: 0 }); }}>
      <PageMeta
        title="Cybersecurity Consulting & Crisis Training"
        description="The five phases of cyber-resilience — from understanding your gap to responding under pressure."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {!entered ? (
        /* Opener Hero — claim-dominant hierarchy */
        <section className="flex-1 flex items-center justify-center px-5 sm:px-6 py-8 sm:py-14 max-w-5xl mx-auto w-full">
          <div className="w-full max-w-3xl text-center">
            {/* Category label */}
            <div
              className="font-mono text-[10px] sm:text-[13px] md:text-[14px] tracking-[0.3em] sm:tracking-[0.4em] text-primary mb-5 sm:mb-6 opacity-0 animate-fade-in"
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              / {t('welcome.heroConsulting').toUpperCase()}
            </div>

            {/* Wordmark */}
            <h1
              className="font-mono font-semibold text-xl sm:text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-foreground/90 mb-6 sm:mb-8 opacity-0 animate-fade-in"
              style={{ animationDelay: '180ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.title')}
            </h1>

            {/* Claim — dominant, with the "stress" word flickering */}
            <p
              className="font-sans font-light text-[20px] sm:text-3xl md:text-5xl text-foreground leading-[1.2] tracking-[-0.01em] mb-5 opacity-0 animate-fade-in max-w-3xl mx-auto"
              style={{ animationDelay: '420ms', animationFillMode: 'forwards' }}
            >
              {renderWithStressFlicker(t('welcome.heroSubtitle'), ['Stress', 'stress', 'pression'])}
            </p>

            {/* Byline */}
            <p
              className="font-mono text-[13px] sm:text-[15px] tracking-[0.2em] sm:tracking-[0.24em] text-foreground/85 mb-10 sm:mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: '780ms', animationFillMode: 'forwards' }}
            >
              {t('welcome.heroByline')}
            </p>

            {/* Phases preview — non-interactive hint */}
            <div
              className="mb-10 sm:mb-12 opacity-0 animate-fade-in"
              style={{ animationDelay: '950ms', animationFillMode: 'forwards' }}
              aria-hidden
            >
              <PhasesPreview phases={PHASES} lang={lang} />
            </div>

            {/* CTA — questioning. Allows wrapping on very narrow screens to never clip the question. */}
            <button
              onClick={() => setEntered(true)}
              className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-4 sm:py-5 max-w-full border-2 border-primary/70 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary font-mono text-[12px] sm:text-[16px] font-medium tracking-[0.18em] sm:tracking-[0.28em] leading-tight transition-all duration-300 shadow-[0_0_18px_-10px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_40px_-6px_hsl(var(--primary)/0.75)] hover:-translate-y-0.5 opacity-0 animate-fade-in text-center"
              style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}
              aria-label={enterCta}
            >
              <span className="break-words">{enterCta.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 -translate-x-1 group-hover:translate-x-0 transition-transform" />
            </button>
          </div>
        </section>
      ) : (
        <>
      {/* Headline */}
      <section className="px-4 sm:px-6 pt-8 sm:pt-6 pb-6 sm:pb-4 max-w-6xl mx-auto w-full animate-fade-in">
        <div className="font-mono text-[10px] tracking-[0.3em] sm:tracking-[0.35em] text-primary mb-3 sm:mb-4">{sectionLabel}</div>
        <h1 className="font-mono font-semibold text-[26px] leading-[1.1] sm:text-3xl md:text-5xl sm:leading-[1.05] tracking-[-0.01em] text-foreground mb-3 sm:mb-4">
          {headline}
        </h1>
        <p className="font-sans text-base sm:text-lg md:text-xl text-foreground/80 max-w-2xl leading-snug">
          {subline}
        </p>
      </section>

      {/* Timeline (desktop) */}
      <section className="hidden md:block px-6 pb-4 max-w-6xl mx-auto w-full">
        <div className="relative pt-2">
          <ul className="grid grid-cols-5 relative gap-0">
            {PHASES.map((phase, idx) => {
              const isActive = phase.id === activeId;
              return (
                <li key={phase.id} className="relative flex flex-col items-center min-w-0">
                  {/* Connector segment between diamonds.
                      Container is 44px (md) / 52px (sm+ within md), diamond rotated 28/32px.
                      Center vertically: 22px / 26px. Gap from center: half-diagonal of rotated square = side/2. */}
                  {idx > 0 && (
                    <span
                      className="absolute h-px bg-primary/40 pointer-events-none top-[22px] sm:top-[26px] right-[calc(50%+18px)] left-[calc(-50%+18px)] sm:right-[calc(50%+20px)] sm:left-[calc(-50%+20px)]"
                      aria-hidden
                    />
                  )}
                  <button
                    onClick={() => setActiveId(phase.id)}
                    className="group flex flex-col items-center gap-2 sm:gap-4 text-center w-full px-0.5 sm:px-2"
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {/* Diamond marker — pure symbol, no number (all phases are equal-rank). */}
                    <span className="relative flex items-center justify-center w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] z-10">
                      <span
                        className={`absolute inset-0 m-auto w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rotate-45 border bg-background transition-all duration-300 ease-out ${
                          isActive
                            ? 'border-primary bg-primary/10 phase-node-active'
                            : 'border-primary/50 group-hover:border-primary group-hover:scale-110 group-hover:bg-primary/5 group-hover:shadow-[0_0_18px_-6px_hsl(var(--primary)/0.55)]'
                        }`}
                        aria-hidden
                      />
                      {/* Inner theme symbol — kept upright (parent diamond is rotated). */}
                      <ServiceSymbol
                        theme={PHASE_SYMBOLS[phase.id]}
                        size={18}
                        aria-hidden
                        className={`relative z-10 transition-colors duration-300 ${
                          isActive ? 'text-primary' : 'text-primary/60 group-hover:text-primary'
                        }`}
                      />
                    </span>
                    {/* Label — single line on mobile via tighter tracking & smaller size */}
                    <span
                      key={isActive ? `l-${phase.id}-active` : `l-${phase.id}`}
                      className={`font-mono text-[11px] sm:text-[14px] font-medium tracking-[0.08em] sm:tracking-[0.28em] leading-tight transition-colors duration-300 whitespace-nowrap ${
                        isActive
                          ? 'text-primary phase-label-emphasis'
                          : 'text-foreground/80 group-hover:text-primary'
                      }`}
                    >
                      {phase.title[lang]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>


      {/* Active phase detail (desktop) */}
      <section className="hidden md:block px-6 py-6 max-w-6xl mx-auto w-full">
        <div
          key={active.id}
          className="grid grid-cols-12 gap-8 bg-background/60 backdrop-blur-[2px] border border-primary/15 p-8 animate-fade-in"
        >
          {/* Left — phase intro */}
          <div className="col-span-7">
            <div className="font-mono text-[12px] tracking-[0.3em] text-primary mb-3">
              {active.title[lang].toUpperCase()}
            </div>
            <h2 className="font-mono font-semibold text-3xl lg:text-4xl leading-[1.1] tracking-[-0.005em] text-foreground mb-4">
              {active.verb[lang]}
            </h2>
            <p className="font-sans text-base sm:text-lg text-foreground/75 leading-relaxed max-w-xl">
              {active.description[lang]}
            </p>
          </div>
          {/* Right — services */}
          <div className="col-span-5 border-l border-primary/15 pl-8">
            <div className="font-mono text-[12px] tracking-[0.26em] text-primary mb-4">
              {servicesLabel.toUpperCase()}
            </div>
            <ul className="space-y-1">
              {active.services.map((svc) => (
                <li key={svc.id}>
                  <button
                    onClick={() => handleClick(svc.id, active.id)}
                    className="w-full text-left flex items-center justify-between gap-3 font-mono text-base tracking-[0.02em] text-foreground hover:text-primary hover:translate-x-1 transition-all duration-200 py-3 border-b border-primary/15 hover:border-primary/40 group/svc"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-block w-2 h-2 rotate-45 border border-primary/70 group-hover/svc:bg-primary group-hover/svc:border-primary transition-colors flex-shrink-0"
                        aria-hidden
                      />
                      <span className="truncate">{t(svc.titleKey)}</span>
                    </span>
                    <ArrowRight
                      className="w-4 h-4 text-primary/0 group-hover/svc:text-primary -translate-x-1 group-hover/svc:translate-x-0 transition-all flex-shrink-0"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Mobile vertical list — diamonds connected by a thin line */}
      <section className="md:hidden flex-1 px-4 pb-10 max-w-6xl mx-auto w-full">
        <ul className="relative">
          {/* Vertical connector behind the diamond column */}
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
                  {/* Mask — solid bg blocks the vertical connector under the diamond */}
                  <span
                    className="absolute inset-0 m-auto w-6 h-6 rotate-45 bg-background"
                    aria-hidden
                  />
                  {/* Diamond marker — pure symbol, no number */}
                  <span
                    className={`absolute inset-0 m-auto w-5 h-5 rotate-45 border transition-all duration-300 ${
                      isActive
                        ? 'border-primary bg-primary/10 phase-node-active'
                        : 'border-primary/40 group-hover/node:border-primary group-hover/node:bg-primary/5'
                    }`}
                    aria-hidden
                  />
                  {/* Inner theme symbol — kept upright over the rotated diamond */}
                  <ServiceSymbol
                    theme={PHASE_SYMBOLS[phase.id]}
                    size={12}
                    aria-hidden
                    className={`relative z-10 transition-colors duration-300 ${
                      isActive ? 'text-primary' : 'text-primary/70 group-hover/node:text-primary'
                    }`}
                  />
                </button>

                <button
                  onClick={() => setActiveId(isActive ? '' : phase.id)}
                  className="w-full text-left pt-0.5"
                  aria-expanded={isActive}
                >
                  {/* Yellow phase title — always bright */}
                  <div
                    key={isActive ? `m-${phase.id}-active` : `m-${phase.id}`}
                    className={`font-mono text-[12px] font-medium tracking-[0.24em] mb-1.5 transition-colors ${
                      isActive ? 'text-primary phase-label-emphasis' : 'text-primary/90'
                    }`}
                  >
                    {phase.title[lang]}
                  </div>
                  {/* Verb — dimmed when another phase is active */}
                  <div
                    className={`font-mono text-[16px] font-medium leading-snug transition-opacity duration-300 ${
                      !activeId || isActive ? 'text-foreground opacity-100' : 'text-foreground opacity-30'
                    }`}
                  >
                    {phase.verb[lang]}
                  </div>
                </button>

                {isActive && (
                  <div className="mt-3 animate-fade-in">
                    <p className="font-sans text-[15px] text-foreground/75 leading-snug mb-3">
                      {phase.description[lang]}
                    </p>
                    <ul className="space-y-0">
                      {phase.services.map((svc) => (
                        <li key={svc.id}>
                          <button
                            onClick={() => handleClick(svc.id, phase.id)}
                            className="w-full text-left flex items-center justify-between gap-3 font-mono text-[15px] text-foreground hover:text-primary transition-colors py-2.5 border-b border-primary/15"
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="inline-block w-2 h-2 rotate-45 border border-primary/70 flex-shrink-0"
                                aria-hidden
                              />
                              <span className="truncate">{t(svc.titleKey)}</span>
                            </span>
                            <ArrowRight className="w-4 h-4 text-primary/70 flex-shrink-0" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* References — own collapsible section under "Respond". Mirrors the phase
          interaction (diamond + verb + expandable detail). Extra top spacing
          (mt-12 sm:mt-20) sets it visually apart from the journey above. */}
      <section className="px-4 sm:px-6 pb-12 sm:pb-10 max-w-6xl mx-auto w-full mt-4 sm:mt-2 pt-2">
        {/* Header row — same diamond + label pattern as a phase node.
            On desktop, indent matches the inner padding of the phase detail card (p-8 = 2rem) so the diamond aligns with the "FÜHREN" label above. */}
        <button
          onClick={() => setReferencesOpen((v) => !v)}
          className="w-full text-left group/ref md:pl-8"
          aria-expanded={referencesOpen}
        >
          <div className="flex items-start gap-4">
            <span className="relative flex items-center justify-center w-8 h-8 mt-0.5 flex-shrink-0">
              <span
                className={`absolute inset-0 m-auto w-5 h-5 rotate-45 border bg-background transition-all duration-300 ${
                  referencesOpen
                    ? 'border-primary bg-primary/10 phase-node-active'
                    : 'border-primary/50 group-hover/ref:border-primary group-hover/ref:bg-primary/5'
                }`}
                aria-hidden
              />
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={`font-mono text-[10px] tracking-[0.28em] sm:tracking-[0.3em] mb-1 transition-colors ${
                  referencesOpen ? 'text-primary phase-label-emphasis' : 'text-primary/80 group-hover/ref:text-primary'
                }`}
              >
                {referenceSectionLabel.replace('/ ', '')}
              </div>
              <div className="font-sans text-sm sm:text-base font-normal leading-snug text-muted-foreground/80 group-hover/ref:text-muted-foreground transition-colors">
                {referenceHeadline}
              </div>
            </div>
            {/* Arrow affordance — same style as service rows above. Rotates 90° when open. */}
            <ArrowRight
              className={`w-4 h-4 mt-2 flex-shrink-0 text-primary/70 group-hover/ref:text-primary transition-all duration-300 ${
                referencesOpen ? 'rotate-90' : '-translate-x-1 group-hover/ref:translate-x-0'
              }`}
              aria-hidden
            />
          </div>
        </button>

      </section>

      {/* References — modaler Dialog mit echtem Close (X), wie auf den anderen Themenseiten.
          Der Trigger-Header darüber öffnet das Modal; geschlossen wird via X, Esc oder Overlay-Klick.
          Struktur: Layer 1 (Proof of Impact) → Layer 2 (Selected Mandates) → Layer 3 (Client list) → Conversion. */}
      <Dialog open={referencesOpen} onOpenChange={setReferencesOpen}>
        <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-md border border-primary/20 p-6 sm:p-10">
          {/* ─── LAYER 1 — PROOF OF IMPACT ─────────────────────────────── */}
          <DialogTitle
            className="font-mono text-[15px] sm:text-[17px] tracking-[0.3em] text-primary mb-4 opacity-0 animate-fade-in"
            style={{ animationDelay: '60ms', animationFillMode: 'forwards' }}
          >
            {referenceSectionLabel.replace('/ ', '')}
          </DialogTitle>
          <DialogDescription
            className="font-mono font-semibold text-2xl sm:text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] text-foreground mb-4 opacity-0 animate-fade-in"
            style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}
          >
            {lang === 'de'
              ? 'Erfahrung, die unter Druck funktioniert.'
              : lang === 'fr'
              ? 'Une expérience qui tient sous pression.'
              : 'Experience that holds under pressure.'}
          </DialogDescription>

          <p
            className="font-sans text-base sm:text-lg text-foreground/80 max-w-3xl leading-relaxed mb-8 sm:mb-10 opacity-0 animate-fade-in"
            style={{ animationDelay: '260ms', animationFillMode: 'forwards' }}
          >
            {lang === 'de'
              ? '35 Jahre gemeinsame Erfahrung. 400+ Projekte in regulierten und kritischen Umgebungen.'
              : lang === 'fr'
              ? '35 ans d\'expérience commune. 400+ projets dans des environnements régulés et critiques.'
              : '35 years of shared experience. 400+ projects across regulated and critical environments.'}
          </p>

          {/* Featured cases — visually dominant cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-12 sm:mb-14">
            {[
              {
                tag: 'DORA',
                client: 'SAP Fioneer',
                desc: {
                  de: 'Aufbau einer DORA-konformen Incident-Reporting-Pipeline.',
                  en: 'DORA-compliant incident-reporting pipeline.',
                  fr: 'Chaîne de reporting d\'incidents conforme DORA.',
                },
                outcome: {
                  de: 'Vom Whitepaper zur prüfbaren Meldekette in unter sechs Monaten.',
                  en: 'From whitepaper to auditable reporting chain in under six months.',
                  fr: 'Du livre blanc à une chaîne auditable en moins de six mois.',
                },
              },
              {
                tag: 'SOC / SIEM',
                client: 'Deutsche Lufthansa',
                desc: {
                  de: 'SIEM/CDC-Prozesstransformation und SOC-Runbooks.',
                  en: 'SIEM/CDC process transformation and SOC runbooks.',
                  fr: 'Transformation des processus SIEM/CDC et runbooks SOC.',
                },
                outcome: {
                  de: 'Skalierte Detection-Pipeline mit messbar kürzerer MTTD.',
                  en: 'Scaled detection pipeline with measurably shorter MTTD.',
                  fr: 'Pipeline de détection scalable avec MTTD mesurablement réduit.',
                },
              },
              {
                tag: 'TIBER-DE',
                client: 'FI-TS',
                desc: {
                  de: 'Konzeption und C-Level-Präsentation des TIBER-DE-Übungsframeworks.',
                  en: 'Design and C-level presentation of the TIBER-DE exercise framework.',
                  fr: 'Conception et présentation C-level du cadre d\'exercice TIBER-DE.',
                },
                outcome: {
                  de: 'Übungsdesign vom Vorstand getragen, von der Aufsicht akzeptiert.',
                  en: 'Exercise design endorsed by the board, accepted by the regulator.',
                  fr: 'Conception validée par le comité exécutif et acceptée par le régulateur.',
                },
              },
              {
                tag: 'OT / MARITIME',
                client: 'Hapag-Lloyd',
                desc: {
                  de: 'Maritimes Cybersecurity-Framework für Starlink-Flottenkonnektivität.',
                  en: 'Maritime cybersecurity framework for Starlink fleet connectivity.',
                  fr: 'Cadre cybersécurité maritime pour la connectivité Starlink de flotte.',
                },
                outcome: {
                  de: 'OT-Risiko an Bord erstmals systematisch greifbar.',
                  en: 'On-board OT risk made systematically tangible for the first time.',
                  fr: 'Risque OT à bord rendu systématiquement maîtrisable.',
                },
              },
            ].map((c, idx) => (
              <div
                key={c.client}
                className="group/case bg-background/40 border border-primary/20 hover:border-primary/50 hover:bg-background/60 transition-all duration-300 p-5 sm:p-6 opacity-0 animate-fade-in hover:shadow-[0_0_24px_-12px_hsl(var(--primary)/0.5)]"
                style={{ animationDelay: `${320 + idx * 90}ms`, animationFillMode: 'forwards' }}
              >
                <div className="font-mono text-[11px] tracking-[0.22em] text-primary mb-2">
                  {c.tag}
                </div>
                <div className="font-mono font-semibold text-lg sm:text-xl text-foreground mb-2 leading-tight">
                  {c.client}
                </div>
                <p className="font-sans text-base text-foreground/85 leading-snug mb-3">
                  {c.desc[lang]}
                </p>
                <p className="font-sans text-[14px] text-foreground/65 italic leading-snug border-t border-primary/15 pt-3">
                  {c.outcome[lang]}
                </p>
              </div>
            ))}
          </div>

          {/* ─── LAYER 2 — SELECTED MANDATES (structured cards) ────────── */}
          <div
            className="font-mono text-[15px] sm:text-[17px] tracking-[0.26em] text-primary mb-5 pb-3 border-b border-primary/25 opacity-0 animate-fade-in"
            style={{ animationDelay: '760ms', animationFillMode: 'forwards' }}
          >
            {lang === 'de'
              ? 'AUSGEWÄHLTE MANDATE'
              : lang === 'fr'
              ? 'MANDATS SÉLECTIONNÉS'
              : 'SELECTED MANDATES'}
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-12 sm:mb-14">
            {highlightMandates.map((mandate, idx) => {
              // Split "Client — description" so client gets its own line
              const txt = mandate.text[lang];
              const dashIdx = txt.indexOf('—');
              const client = dashIdx > 0 ? txt.slice(0, dashIdx).trim() : '';
              const desc = dashIdx > 0 ? txt.slice(dashIdx + 1).trim() : txt;
              return (
                <li
                  key={mandate.tag}
                  className="bg-background/30 border border-primary/15 hover:border-primary/35 transition-colors duration-300 p-4 sm:p-5 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${840 + idx * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="font-mono text-[10px] tracking-[0.22em] text-primary mb-2 uppercase">
                    {mandate.tag}
                  </div>
                  <p className="font-sans text-[15px] sm:text-base text-foreground leading-snug mb-1.5">
                    {desc}
                  </p>
                  {client && (
                    <p className="font-mono text-[12px] tracking-[0.04em] text-foreground/55">
                      {client}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {/* ─── LAYER 3 — CLIENT LIST (de-emphasized supporting proof) ── */}
          <div
            className="font-mono text-[11px] tracking-[0.24em] text-muted-foreground mb-4 pb-2 border-b border-primary/15 opacity-0 animate-fade-in"
            style={{ animationDelay: '1280ms', animationFillMode: 'forwards' }}
          >
            {lang === 'de'
              ? 'AUSZUG RELEVANTER MANDANTEN'
              : lang === 'fr'
              ? 'EXTRAIT DE MANDANTS PERTINENTS'
              : 'EXTRACT OF RELEVANT CLIENTS'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-10">
            {referenceClusters.map((cluster, idx) => (
              <div
                key={cluster.label.en}
                className="min-w-0 opacity-0 animate-fade-in"
                style={{ animationDelay: `${1340 + idx * 70}ms`, animationFillMode: 'forwards' }}
              >
                <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground/80 mb-2 pb-1 border-b border-primary/10">
                  {cluster.label[lang].toUpperCase()}
                </div>
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {cluster.clients.map((client) => (
                    <li
                      key={client}
                      className="font-mono text-[12px] tracking-[0.01em] text-foreground/65 leading-relaxed"
                    >
                      {client}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p
            className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground/70 italic opacity-0 animate-fade-in"
            style={{ animationDelay: '1700ms', animationFillMode: 'forwards' }}
          >
            {referenceFootnote}
          </p>
        </DialogContent>
      </Dialog>
        </>
      )}
    </SiteChrome>
  );
};

export default Overview;
