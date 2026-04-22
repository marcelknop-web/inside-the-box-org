import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages, ArrowRight } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * /overview — Problem-First Grid
 *
 * 6 Kacheln, formuliert aus Kundenperspektive ("Wir müssen...").
 * Jede Kachel listet die zugehörigen Services. Klick → Service-Seite.
 */

type Service = {
  id: string;
  titleKey: string;
};

type Tile = {
  id: string;
  question: string;        // EN, kurz, in Kundensprache
  questionDe: string;
  questionFr: string;
  answer: string;          // EN
  answerDe: string;
  answerFr: string;
  services: Service[];
};

const TILES: Tile[] = [
  {
    id: 'compliance',
    question: 'We need to become NIS-2 / DORA / CRA compliant.',
    questionDe: 'Wir müssen NIS-2-, DORA- oder CRA-konform werden.',
    questionFr: 'Nous devons être conformes NIS-2, DORA ou CRA.',
    answer: 'Audit-grade tools and consulting for EU regulation.',
    answerDe: 'Audit-taugliche Tools und Beratung für EU-Regulierung.',
    answerFr: 'Outils et conseil de niveau audit pour la régulation UE.',
    services: [
      { id: 'nis2-dora', titleKey: 'consulting.nis2Title' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle' },
      { id: 'isms', titleKey: 'consulting.ismsTitle' },
    ],
  },
  {
    id: 'leadership',
    question: 'We lack a CISO or security leadership.',
    questionDe: 'Uns fehlt ein CISO oder Security-Leadership.',
    questionFr: 'Il nous manque un RSSI ou un leadership sécurité.',
    answer: 'Fractional security leadership and assessments.',
    answerDe: 'Security-Leadership auf Zeit und Standortbestimmung.',
    answerFr: 'Leadership sécurité à temps partiel et évaluations.',
    services: [
      { id: 'virtual-ciso', titleKey: 'consulting.vcisoTitle' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle' },
    ],
  },
  {
    id: 'incident',
    question: 'We just had — or fear — an incident.',
    questionDe: 'Wir hatten — oder fürchten — einen Vorfall.',
    questionFr: 'Nous avons eu — ou craignons — un incident.',
    answer: 'Crisis management, response, and red-teaming.',
    answerDe: 'Krisenmanagement, Response und Red-Teaming.',
    answerFr: 'Gestion de crise, réponse et red-teaming.',
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle' },
      { id: 'incident-management', titleKey: 'consulting.incidentTitle' },
      { id: 'red-team', titleKey: 'nav.redTeam' },
    ],
  },
  {
    id: 'training',
    question: 'Our team is not prepared for the worst.',
    questionDe: 'Unser Team ist nicht auf den Ernstfall vorbereitet.',
    questionFr: 'Notre équipe n\'est pas prête au pire.',
    answer: 'Tabletop exercises, simulators, and arena drills.',
    answerDe: 'Tabletop-Übungen, Simulatoren und Arena-Drills.',
    answerFr: 'Exercices tabletop, simulateurs et drills arena.',
    services: [
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining' },
      { id: 'arena-training', titleKey: 'consulting.arenaTitle' },
    ],
  },
  {
    id: 'inspiration',
    question: 'We want to learn what others are doing.',
    questionDe: 'Wir möchten lernen, was andere bereits tun.',
    questionFr: 'Nous voulons apprendre ce que font les autres.',
    answer: 'Publications, events, and workshops.',
    answerDe: 'Publikationen, Events und Workshops.',
    answerFr: 'Publications, événements et ateliers.',
    services: [
      { id: 'publications', titleKey: 'consulting.pubTitle' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle' },
    ],
  },
  {
    id: 'ai',
    question: 'We want AI in our security workflows.',
    questionDe: 'Wir wollen KI in unseren Security-Workflows einsetzen.',
    questionFr: 'Nous voulons de l\'IA dans nos workflows sécurité.',
    answer: 'Practical AI workflows for security teams.',
    answerDe: 'Praktische KI-Workflows für Security-Teams.',
    answerFr: 'Workflows IA pratiques pour les équipes sécurité.',
    services: [
      { id: 'ai-workflows', titleKey: 'consulting.aiWorkflowsTitle' },
    ],
  },
];

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const getQuestion = (tile: Tile) =>
    language === 'de' ? tile.questionDe : language === 'fr' ? tile.questionFr : tile.question;
  const getAnswer = (tile: Tile) =>
    language === 'de' ? tile.answerDe : language === 'fr' ? tile.answerFr : tile.answer;

  const headline =
    language === 'de'
      ? 'Wo stehen Sie gerade?'
      : language === 'fr'
      ? 'Où en êtes-vous ?'
      : 'Where are you right now?';
  const subline =
    language === 'de'
      ? 'Wählen Sie das Szenario, das am besten passt — wir zeigen die nächsten Schritte.'
      : language === 'fr'
      ? 'Choisissez le scénario qui correspond — nous montrons les prochaines étapes.'
      : 'Pick the scenario that fits best — we\'ll show the next steps.';

  return (
    <div className="min-h-screen w-full text-foreground flex flex-col bg-background">
      <PageMeta
        title="Overview"
        description="Find the right cybersecurity service for your situation — from compliance to crisis response."
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
        <div className="font-mono text-[10px] tracking-[0.35em] text-primary mb-4">
          {language === 'de' ? '/ ÜBERSICHT' : language === 'fr' ? '/ APERÇU' : '/ OVERVIEW'}
        </div>
        <h1 className="font-mono font-semibold text-3xl md:text-5xl leading-[1.05] tracking-[-0.01em] text-foreground mb-4">
          {headline}
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground max-w-2xl leading-snug">
          {subline}
        </p>
      </section>

      {/* Tile grid */}
      <main className="flex-1 px-6 pb-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/15 border border-primary/15">
          {TILES.map((tile) => {
            const isHovered = hoveredId === tile.id;
            return (
              <article
                key={tile.id}
                onMouseEnter={() => setHoveredId(tile.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-background p-6 md:p-7 flex flex-col group transition-colors hover:bg-primary/[0.04] min-h-[280px]"
              >
                {/* Tile label */}
                <div className="font-mono text-[9px] tracking-[0.35em] text-primary/70 mb-4">
                  {String(TILES.indexOf(tile) + 1).padStart(2, '0')} / {String(TILES.length).padStart(2, '0')}
                </div>

                {/* Question */}
                <h2 className="font-mono font-medium text-lg md:text-xl leading-[1.25] tracking-[-0.005em] text-foreground mb-3">
                  {getQuestion(tile)}
                </h2>

                {/* Answer / what we offer */}
                <p className="font-sans text-sm text-muted-foreground leading-snug mb-5">
                  {getAnswer(tile)}
                </p>

                {/* Services */}
                <ul className="mt-auto space-y-1.5 pt-4 border-t border-primary/10">
                  {tile.services.map((svc) => (
                    <li key={svc.id}>
                      <button
                        onClick={() => handleClick(svc.id)}
                        className="w-full text-left flex items-center justify-between gap-3 font-mono text-xs tracking-[0.05em] text-foreground/85 hover:text-primary transition-colors py-1.5 group/svc"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="inline-block w-1.5 h-1.5 rotate-45 border border-primary/60 group-hover/svc:bg-primary group-hover/svc:border-primary transition-colors flex-shrink-0"
                            aria-hidden
                          />
                          <span className="truncate">{t(svc.titleKey)}</span>
                        </span>
                        <ArrowRight
                          className="w-3 h-3 text-primary/0 group-hover/svc:text-primary -translate-x-1 group-hover/svc:translate-x-0 transition-all flex-shrink-0"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
          <span>© {new Date().getFullYear()} INSIDE-THE-BOX</span>
          <a
            href="mailto:marcel@inside-the-box.org"
            className="hover:text-primary transition-colors"
          >
            MARCEL@INSIDE-THE-BOX.ORG
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Overview;
