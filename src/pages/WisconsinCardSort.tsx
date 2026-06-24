import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Brain, CheckCircle2, XCircle, RotateCcw, Play, Trophy, Info, Compass, Sparkles, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { StaggerReveal } from '@/components/StaggerReveal';
import { wcstSounds } from '@/lib/wcstSounds';
import { buildProfile, buildBenchmark, benchLabels } from '@/lib/wcstProfile';

/* ------------------------------------------------------------------ */
/*  Wisconsin Card Sorting Test (WCST) — faithful reimplementation     */
/*  Trilingual (DE / EN / FR). Self-contained, no backend.             */
/* ------------------------------------------------------------------ */

type Color = 'red' | 'green' | 'blue' | 'yellow';
type Shape = 'triangle' | 'star' | 'cross' | 'circle';
type Dimension = 'color' | 'shape' | 'number';

interface Card {
  color: Color;
  shape: Shape;
  number: 1 | 2 | 3 | 4;
}

// Fixed test stimulus colours — these are the actual WCST stimuli, not UI chrome.
const COLOR_HEX: Record<Color, string> = {
  red: '#e23b3b',
  green: '#2fa84f',
  blue: '#3b7de2',
  yellow: '#e2c23b',
};

const COLORS: Color[] = ['red', 'green', 'blue', 'yellow'];
const SHAPES: Shape[] = ['triangle', 'star', 'cross', 'circle'];
const NUMBERS: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

// The four classic stimulus cards.
const STIMULUS_CARDS: Card[] = [
  { color: 'red', shape: 'triangle', number: 1 },
  { color: 'green', shape: 'star', number: 2 },
  { color: 'yellow', shape: 'cross', number: 3 },
  { color: 'blue', shape: 'circle', number: 4 },
];

// Standard rule sequence: colour → shape → number, repeated.
const RULE_SEQUENCE: Dimension[] = ['color', 'shape', 'number', 'color', 'shape', 'number'];
// Short online form: 6 consecutive correct per category (vs. classic 10) keeps the
// session short (~5 min) while still requiring real concept formation per category.
const CRITERION = 6; // consecutive correct to complete a category
const MAX_CATEGORIES = 6;

function buildDeck(): Card[] {
  // Two full 64-card packs (4×4×4) shuffled — 128 response cards total.
  const deck: Card[] = [];
  for (let pack = 0; pack < 2; pack++) {
    for (const c of COLORS) for (const s of SHAPES) for (const n of NUMBERS) {
      deck.push({ color: c, shape: s, number: n });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function matchesDimension(a: Card, b: Card, dim: Dimension): boolean {
  if (dim === 'color') return a.color === b.color;
  if (dim === 'shape') return a.shape === b.shape;
  return a.number === b.number;
}

/* ----------------------------- i18n ------------------------------- */

type Lang = 'de' | 'en' | 'fr';

const STR: Record<Lang, Record<string, string>> = {
  de: {
    title: 'Wisconsin Card Sorting Test',
    subtitle: 'Kognitive Flexibilität · Exekutive Funktionen',
    introHeading: 'Worum geht es?',
    introBody:
      'Der Wisconsin Card Sorting Test ist ein kurzer Test. Ihre Aufgabe: Ordnen Sie die neue Karte jeweils einer der vier Referenzkarten zu.',
    howHeading: 'So funktioniert es',
    rule1: 'Oben sehen Sie vier Referenzkarten. Unten erscheint jeweils eine neue Karte.',
    rule2: 'Ordnen Sie die untere Karte einer Referenzkarte zu — per Klick.',
    rule3: 'Wie zugeordnet werden soll, wird Ihnen bewusst nicht gesagt. Sie finden es selbst heraus.',
    rule4: 'Nach jeder Zuordnung erhalten Sie nur die Rückmeldung „Richtig" oder „Falsch".',
    start: 'Test starten',
    matchPrompt: 'Welcher Referenzkarte ordnen Sie diese Karte zu?',
    correct: 'Richtig',
    wrong: 'Falsch',
    category: 'Kategorie',
    trial: 'Versuch',
    streak: 'Serie',
    errors: 'Fehler',
    of: 'von',
    resultsTitle: 'Ergebnis',
    resultsIntro: 'Ihre Auswertung dieser Sitzung:',
    mCategories: 'Abgeschlossene Kategorien',
    mTrials: 'Versuche gesamt',
    mCorrect: 'Korrekte Antworten',
    mErrors: 'Fehler gesamt',
    mPersev: 'Perseverative Fehler',
    mPersevHint: 'Fehler durch Festhalten an einer nicht mehr gültigen Regel — ein Indikator für eingeschränkte kognitive Flexibilität.',
    mAccuracy: 'Trefferquote',
    assessTitle: 'Experteneinschätzung',
    profileTitle: 'Ihr Profil',
    archetypeLabel: 'Archetyp',
    strengthsTitle: 'Stärken',
    developmentTitle: 'Entwicklungsfelder',
    restart: 'Neu starten',
    done: 'Geschafft! Alle Kategorien abgeschlossen.',
    deckDone: 'Der Kartenstapel ist aufgebraucht.',
    color: 'Farbe', shape: 'Form', number: 'Anzahl',
  },
  en: {
    title: 'Wisconsin Card Sorting Test',
    subtitle: 'Cognitive Flexibility · Executive Function',
    introHeading: 'What is this?',
    introBody:
      'The Wisconsin Card Sorting Test is a short test. Your task: match each new card to one of the four reference cards.',
    howHeading: 'How it works',
    rule1: 'Four reference cards are shown at the top. A new card appears below.',
    rule2: 'Match the lower card to one of the reference cards — by clicking.',
    rule3: 'How to match is deliberately not explained. You work it out yourself.',
    rule4: 'After each match you receive only the feedback “Correct" or “Wrong".',
    start: 'Start the test',
    matchPrompt: 'Which reference card does this card match?',
    correct: 'Correct',
    wrong: 'Wrong',
    category: 'Category',
    trial: 'Trial',
    streak: 'Streak',
    errors: 'Errors',
    of: 'of',
    resultsTitle: 'Results',
    resultsIntro: 'Your summary for this session:',
    mCategories: 'Categories completed',
    mTrials: 'Total trials',
    mCorrect: 'Correct responses',
    mErrors: 'Total errors',
    mPersev: 'Perseverative errors',
    mPersevHint: 'Errors caused by sticking to a rule that no longer applies — an indicator of reduced cognitive flexibility.',
    mAccuracy: 'Accuracy',
    assessTitle: 'Expert assessment',
    profileTitle: 'Your profile',
    archetypeLabel: 'Archetype',
    strengthsTitle: 'Strengths',
    developmentTitle: 'Development areas',
    restart: 'Restart',
    done: 'Well done! All categories completed.',
    deckDone: 'The card deck is exhausted.',
    color: 'Colour', shape: 'Shape', number: 'Number',
  },
  fr: {
    title: 'Test de classement de cartes du Wisconsin',
    subtitle: 'Flexibilité cognitive · Fonctions exécutives',
    introHeading: 'De quoi s\'agit-il ?',
    introBody:
      'Le Wisconsin Card Sorting Test est un test court. Votre tâche : associez chaque nouvelle carte à l\'une des quatre cartes de référence.',
    howHeading: 'Comment ça marche',
    rule1: 'Quatre cartes de référence apparaissent en haut. Une nouvelle carte s\'affiche en dessous.',
    rule2: 'Associez la carte du bas à l\'une des cartes de référence — en cliquant.',
    rule3: 'La façon d\'associer n\'est volontairement pas expliquée. Vous la découvrez par vous-même.',
    rule4: 'Après chaque association, vous ne recevez que le retour « Correct » ou « Faux ».',
    start: 'Démarrer le test',
    matchPrompt: 'À quelle carte de référence associez-vous cette carte ?',
    correct: 'Correct',
    wrong: 'Faux',
    category: 'Catégorie',
    trial: 'Essai',
    streak: 'Série',
    errors: 'Erreurs',
    of: 'sur',
    resultsTitle: 'Résultat',
    resultsIntro: 'Votre bilan pour cette session :',
    mCategories: 'Catégories complétées',
    mTrials: 'Essais au total',
    mCorrect: 'Réponses correctes',
    mErrors: 'Erreurs au total',
    mPersev: 'Erreurs persévératives',
    mPersevHint: 'Erreurs dues au maintien d\'une règle qui ne s\'applique plus — un indicateur de flexibilité cognitive réduite.',
    mAccuracy: 'Précision',
    assessTitle: 'Avis d\'expert',
    restart: 'Recommencer',
    done: 'Bravo ! Toutes les catégories sont complétées.',
    deckDone: 'La pile de cartes est épuisée.',
    color: 'Couleur', shape: 'Forme', number: 'Nombre',
  },
};

/* --------------------- expert interpretation ---------------------- */
/* Deterministic, derived strictly from the recorded session metrics. */
/* No values are invented — every statement maps to a measured number. */

interface SessionMetrics {
  categoriesDone: number;
  trials: number;
  correctCount: number;
  errors: number;
  persevErrors: number;
  accuracy: number;
  allDone: boolean;
}


function buildExpertSummary(lang: Lang, m: SessionMetrics): string[] {
  const persevShare = m.errors > 0 ? Math.round((m.persevErrors / m.errors) * 100) : 0;
  // tiers
  const completion: 'full' | 'partial' | 'limited' =
    m.allDone ? 'full' : m.categoriesDone >= Math.ceil(MAX_CATEGORIES / 2) ? 'partial' : 'limited';
  const flexibility: 'strong' | 'moderate' | 'reduced' =
    m.persevErrors <= 2 ? 'strong' : m.persevErrors <= 5 ? 'moderate' : 'reduced';
  const efficiency: 'high' | 'mid' | 'low' =
    m.accuracy >= 75 ? 'high' : m.accuracy >= 55 ? 'mid' : 'low';

  const T = {
    de: {
      completion: {
        full: `Es wurden alle ${MAX_CATEGORIES} Kategorien abgeschlossen — die Teilnehmerin bzw. der Teilnehmer hat jede geforderte Sortierregel zuverlässig entdeckt und angewendet.`,
        partial: `Es wurden ${m.categoriesDone} von ${MAX_CATEGORIES} Kategorien abgeschlossen. Regeln wurden grundsätzlich erkannt, jedoch nicht durchgängig stabil gehalten.`,
        limited: `Es wurden ${m.categoriesDone} von ${MAX_CATEGORIES} Kategorien abgeschlossen. Das Auffinden der gültigen Sortierregel gelang nur eingeschränkt.`,
      },
      flexibility: {
        strong: `Mit ${m.persevErrors} perseverativen Fehlern (${persevShare}% aller Fehler) zeigt sich eine ausgeprägte kognitive Flexibilität: Regelwechsel wurden rasch erkannt und das Verhalten zügig umgestellt.`,
        moderate: `Mit ${m.persevErrors} perseverativen Fehlern (${persevShare}% aller Fehler) deutet sich eine moderate kognitive Flexibilität an — Regelwechsel wurden erkannt, das Umlernen erforderte aber mehrere Versuche.`,
        reduced: `Mit ${m.persevErrors} perseverativen Fehlern (${persevShare}% aller Fehler) zeigt sich ein deutliches Festhalten an nicht mehr gültigen Regeln, was auf eine eingeschränkte kognitive Flexibilität hindeutet.`,
      },
      efficiency: {
        high: `Die Trefferquote von ${m.accuracy}% (${m.correctCount}/${m.trials}) spricht für eine effiziente Hypothesenbildung und konsistente Umsetzung.`,
        mid: `Die Trefferquote von ${m.accuracy}% (${m.correctCount}/${m.trials}) liegt im mittleren Bereich; die Lösungsstrategie war erkennbar, aber noch nicht durchgängig stabil.`,
        low: `Die Trefferquote von ${m.accuracy}% (${m.correctCount}/${m.trials}) weist auf einen überwiegend versuchenden Lösungsansatz hin; eine stabile Strategie bildete sich nur ansatzweise heraus.`,
      },
    },
    en: {
      completion: {
        full: `All ${MAX_CATEGORIES} categories were completed — the participant reliably discovered and applied every required sorting rule.`,
        partial: `${m.categoriesDone} of ${MAX_CATEGORIES} categories were completed. Rules were generally identified but not consistently maintained.`,
        limited: `${m.categoriesDone} of ${MAX_CATEGORIES} categories were completed. Identifying the valid sorting rule succeeded only to a limited degree.`,
      },
      flexibility: {
        strong: `With ${m.persevErrors} perseverative errors (${persevShare}% of all errors), cognitive flexibility is pronounced: rule shifts were recognised quickly and behaviour adjusted promptly.`,
        moderate: `With ${m.persevErrors} perseverative errors (${persevShare}% of all errors), cognitive flexibility appears moderate — shifts were recognised, but re-learning took several trials.`,
        reduced: `With ${m.persevErrors} perseverative errors (${persevShare}% of all errors), there is clear persistence with rules that no longer apply, suggesting reduced cognitive flexibility.`,
      },
      efficiency: {
        high: `The accuracy of ${m.accuracy}% (${m.correctCount}/${m.trials}) reflects efficient hypothesis formation and consistent execution.`,
        mid: `The accuracy of ${m.accuracy}% (${m.correctCount}/${m.trials}) is in the mid range; a solution strategy was visible but not yet fully stable.`,
        low: `The accuracy of ${m.accuracy}% (${m.correctCount}/${m.trials}) points to a largely trial-and-error approach; a stable strategy only began to emerge.`,
      },
    },
    fr: {
      completion: {
        full: `Les ${MAX_CATEGORIES} catégories ont été complétées — le participant a découvert et appliqué de manière fiable chaque règle de tri requise.`,
        partial: `${m.categoriesDone} catégories sur ${MAX_CATEGORIES} ont été complétées. Les règles ont été globalement identifiées, mais pas maintenues de façon constante.`,
        limited: `${m.categoriesDone} catégories sur ${MAX_CATEGORIES} ont été complétées. La découverte de la règle de tri valide n'a réussi que de façon limitée.`,
      },
      flexibility: {
        strong: `Avec ${m.persevErrors} erreurs persévératives (${persevShare}% de toutes les erreurs), la flexibilité cognitive est marquée : les changements de règle ont été reconnus rapidement et le comportement ajusté sans délai.`,
        moderate: `Avec ${m.persevErrors} erreurs persévératives (${persevShare}% de toutes les erreurs), la flexibilité cognitive paraît modérée — les changements ont été reconnus, mais le réapprentissage a nécessité plusieurs essais.`,
        reduced: `Avec ${m.persevErrors} erreurs persévératives (${persevShare}% de toutes les erreurs), on observe un maintien net de règles qui ne s'appliquent plus, ce qui suggère une flexibilité cognitive réduite.`,
      },
      efficiency: {
        high: `La précision de ${m.accuracy}% (${m.correctCount}/${m.trials}) traduit une formulation d'hypothèses efficace et une exécution cohérente.`,
        mid: `La précision de ${m.accuracy}% (${m.correctCount}/${m.trials}) se situe dans la moyenne ; une stratégie était visible mais pas encore pleinement stable.`,
        low: `La précision de ${m.accuracy}% (${m.correctCount}/${m.trials}) indique une approche essentiellement par essais-erreurs ; une stratégie stable n'a fait qu'émerger.`,
      },
    },
  } as const;

  const t = T[lang];
  return [t.completion[completion], t.flexibility[flexibility], t.efficiency[efficiency]];
}

/* --------------------------- card render -------------------------- */

function Glyph({ shape, color, size = 26 }: { shape: Shape; color: Color; size?: number }) {
  const fill = COLOR_HEX[color];
  const s = size;
  switch (shape) {
    case 'triangle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" fill={fill} /></svg>;
    case 'star':
      return <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9.3 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9.3 9,9" fill={fill} /></svg>;
    case 'cross':
      return <svg width={s} height={s} viewBox="0 0 24 24"><polygon points="9,2 15,2 15,9 22,9 22,15 15,15 15,22 9,22 9,15 2,15 2,9 9,9" fill={fill} /></svg>;
    case 'circle':
      return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill={fill} /></svg>;
  }
}

function CardFace({ card, size = 26 }: { card: Card; size?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 w-full h-full">
      {Array.from({ length: card.number }).map((_, i) => (
        <Glyph key={i} shape={card.shape} color={card.color} size={size} />
      ))}
    </div>
  );
}

/* ----------------------------- main ------------------------------- */

interface WcstProps { embedded?: boolean; }

type Phase = 'intro' | 'playing' | 'done';

interface Feedback { ok: boolean; chosen: number; } // chosen = stimulus index

export default function WisconsinCardSort({ embedded = false }: WcstProps) {
  const { language } = useLanguage();
  const L = (language as Lang) in STR ? (language as Lang) : 'en';
  const tr = STR[L];

  const [phase, setPhase] = useState<Phase>('intro');
  const [deck, setDeck] = useState<Card[]>([]);
  const [deckIdx, setDeckIdx] = useState(0);

  const [ruleIdx, setRuleIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [categoriesDone, setCategoriesDone] = useState(0);

  const [trials, setTrials] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [persevErrors, setPersevErrors] = useState(0);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [locked, setLocked] = useState(false);

  // Track the previously active rule so we can flag perseverative errors.
  const [prevRule, setPrevRule] = useState<Dimension | null>(null);

  const currentRule = RULE_SEQUENCE[Math.min(ruleIdx, RULE_SEQUENCE.length - 1)];
  const currentCard = deck[deckIdx];

  const begin = useCallback(() => {
    wcstSounds.unlock();
    setDeck(buildDeck());
    setDeckIdx(0);
    setRuleIdx(0);
    setStreak(0);
    setCategoriesDone(0);
    setTrials(0);
    setCorrectCount(0);
    setErrors(0);
    setPersevErrors(0);
    setFeedback(null);
    setLocked(false);
    setPrevRule(null);
    setPhase('playing');
  }, []);

  const handlePick = useCallback((stimIdx: number) => {
    if (locked || !currentCard) return;
    const stim = STIMULUS_CARDS[stimIdx];
    const ok = matchesDimension(currentCard, stim, currentRule);
    setLocked(true);
    setFeedback({ ok, chosen: stimIdx });
    setTrials((t) => t + 1);
    wcstSounds.tap();

    if (ok) {
      setCorrectCount((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      wcstSounds.correct();
      if (newStreak >= CRITERION) {
        // category complete → advance rule
        const newCats = categoriesDone + 1;
        setCategoriesDone(newCats);
        setPrevRule(currentRule);
        setStreak(0);
        setRuleIdx((r) => r + 1);
        if (newCats >= MAX_CATEGORIES) {
          window.setTimeout(() => { setPhase('done'); }, 850);
          return;
        }
      }
    } else {
      wcstSounds.wrong();
      setErrors((e) => e + 1);
      setStreak(0);
      // Perseverative: the chosen card matches the previous (now invalid) rule.
      if (prevRule && prevRule !== currentRule && matchesDimension(currentCard, stim, prevRule)) {
        setPersevErrors((p) => p + 1);
      }
    }

    window.setTimeout(() => {
      const nextIdx = deckIdx + 1;
      if (nextIdx >= deck.length) {
        setPhase('done');
        return;
      }
      setDeckIdx(nextIdx);
      setFeedback(null);
      setLocked(false);
    }, 850);
  }, [locked, currentCard, currentRule, streak, categoriesDone, prevRule, deckIdx, deck.length]);

  const accuracy = trials > 0 ? Math.round((correctCount / trials) * 100) : 0;

  /* --------------------------- INTRO --------------------------- */
  if (phase === 'intro') {
    return (
      <div className="w-full max-w-3xl mx-auto px-1">
        <StaggerReveal stagger={620} startDelay={200} className="!space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg bg-highlight/10 border border-highlight/30 flex items-center justify-center flex-shrink-0">
              <Brain className="text-highlight" size={22} />
            </div>
            <div>
              <h1 className="font-mono text-xl md:text-2xl font-bold text-foreground leading-tight">{tr.title}</h1>
              <p className="font-mono text-[11px] md:text-xs tracking-[0.2em] text-highlight uppercase mt-1">{tr.subtitle}</p>
            </div>
          </div>

          <div className="bg-card/40 border border-border/40 rounded-xl p-5 md:p-6">
            <h2 className="font-mono text-base font-bold text-primary mb-2.5">{tr.introHeading}</h2>
            <p className="text-base text-foreground/90 font-sans leading-relaxed">{tr.introBody}</p>
          </div>

          {/* Reference card preview */}
          <div className="grid grid-cols-4 gap-2.5 md:gap-3">
            {STIMULUS_CARDS.map((c, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-background border border-border/60 shadow-sm flex items-center justify-center">
                <CardFace card={c} size={22} />
              </div>
            ))}
          </div>

          <div className="bg-card/40 border border-border/40 rounded-xl p-5 md:p-6">
            <h2 className="font-mono text-base font-bold text-primary mb-4">{tr.howHeading}</h2>
            <StaggerReveal stagger={460} startDelay={2200} className="!space-y-3.5">
              {[tr.rule1, tr.rule2, tr.rule3, tr.rule4].map((r, i) => (
                <div key={i} className="flex gap-3 text-[15px] md:text-base text-foreground/90 font-sans leading-relaxed">
                  <span className="font-mono text-highlight font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </div>
              ))}
            </StaggerReveal>
          </div>

          <button
            onClick={begin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-highlight text-background font-mono font-bold text-sm md:text-base hover:bg-highlight/90 transition-electric"
          >
            <Play size={18} /> {tr.start}
          </button>
        </StaggerReveal>
      </div>
    );
  }


  /* --------------------------- DONE --------------------------- */
  if (phase === 'done') {
    const allDone = categoriesDone >= MAX_CATEGORIES;
    const expert = buildExpertSummary(L, { categoriesDone, trials, correctCount, errors, persevErrors, accuracy, allDone });
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="text-primary" size={22} />
          </div>
          <div>
            <h1 className="font-mono text-lg md:text-xl font-bold text-foreground leading-tight">{tr.resultsTitle}</h1>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">{allDone ? tr.done : tr.deckDone}</p>
          </div>
        </div>

        <p className="text-sm text-foreground/85 font-sans mb-4">{tr.resultsIntro}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Metric label={tr.mCategories} value={`${categoriesDone} / ${MAX_CATEGORIES}`} accent />
          <Metric label={tr.mAccuracy} value={`${accuracy}%`} accent />
          <Metric label={tr.mTrials} value={String(trials)} />
          <Metric label={tr.mCorrect} value={String(correctCount)} />
          <Metric label={tr.mErrors} value={String(errors)} />
          <Metric label={tr.mPersev} value={String(persevErrors)} />
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground font-sans mb-6 px-1">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <p>{tr.mPersevHint}</p>
        </div>

        {/* Expert assessment — derived strictly from the recorded metrics */}
        <div className="bg-card/40 border border-border/40 rounded-xl p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-highlight flex-shrink-0" size={18} />
            <h2 className="font-mono text-sm font-bold text-primary uppercase tracking-wider">{tr.assessTitle}</h2>
          </div>
          <div className="space-y-3">
            {expert.map((p, i) => (
              <p key={i} className="text-sm md:text-[15px] text-foreground/90 font-sans leading-relaxed">{p}</p>
            ))}
          </div>
        </div>

        <button
          onClick={begin}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-highlight text-background font-mono font-bold text-sm hover:bg-highlight/90 transition-electric"
        >
          <RotateCcw size={16} /> {tr.restart}
        </button>
      </div>
    );
  }

  /* --------------------------- PLAYING --------------------------- */
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Neutral, purely graphical progress — advances only by trials completed, never backward. */}
      <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden mb-8">
        <div
          className="h-full bg-highlight/80 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, (deck.length > 0 ? (trials / deck.length) : 0) * 100)}%` }}
        />
      </div>


      {/* Reference cards */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-8">
        {STIMULUS_CARDS.map((c, i) => {
          const isChosen = feedback?.chosen === i;
          const ring = isChosen
            ? feedback!.ok
              ? 'ring-2 ring-green-500 border-green-500'
              : 'ring-2 ring-destructive border-destructive'
            : 'border-border/60 hover:border-highlight/60';
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={locked}
              className={`aspect-[3/4] rounded-lg bg-background border shadow-sm flex items-center justify-center transition-all disabled:cursor-default ${ring} ${!locked ? 'hover:scale-[1.03] cursor-pointer' : ''}`}
            >
              <CardFace card={c} size={22} />
            </button>
          );
        })}
      </div>

      {/* Prompt + feedback — prominent so participants notice it */}
      <div className="text-center mb-6 min-h-[4.5rem] flex items-center justify-center">
        {feedback ? (
          <div
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-mono text-lg md:text-xl font-bold shadow-lg animate-in fade-in zoom-in duration-200 ${
              feedback.ok
                ? 'bg-green-500/10 border-green-500/40 text-green-500'
                : 'bg-destructive/10 border-destructive/40 text-destructive'
            }`}
          >
            {feedback.ok ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
            {feedback.ok ? tr.correct : tr.wrong}
          </div>
        ) : null}
      </div>

      {/* Current response card */}
      <div className="flex justify-center">
        {currentCard && (
          <div className="w-28 md:w-32 aspect-[3/4] rounded-lg bg-background border-2 border-highlight/50 shadow-[0_8px_30px_-8px_hsl(var(--highlight)/0.35)] flex items-center justify-center">
            <CardFace card={currentCard} size={26} />
          </div>
        )}
      </div>
    </div>
  );
}


function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${accent ? 'border-highlight/30 bg-highlight/5' : 'border-border/40 bg-card/40'}`}>
      <div className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground mb-1">{label}</div>
      <div className={`font-mono text-2xl font-bold ${accent ? 'text-highlight' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
