/* ------------------------------------------------------------------ */
/*  WCST profile & archetype derivation — deterministic.               */
/*  Every output maps to a measured session value. No invented data.   */
/*  This is a self-reflection layer, not a clinical/medical diagnosis.  */
/* ------------------------------------------------------------------ */

export type Lang = 'de' | 'en' | 'fr';

export interface ProfileMetrics {
  categoriesDone: number;
  maxCategories: number;
  trials: number;
  correctCount: number;
  errors: number;
  persevErrors: number;
  accuracy: number;
  allDone: boolean;
}

// Fixed community reference profile (orientation values, not clinical norms).
export const REFERENCE = {
  categoriesCompleted: 5,
  perseverativeErrors: 8,
  nonPerseverativeErrors: 5,
  totalErrors: 13,
};

type ProfileKey =
  | 'navigator'
  | 'innovator'
  | 'explorer'
  | 'strategist'
  | 'analyst'
  | 'architect'
  | 'tactician'
  | 'pragmatist';

interface ProfileText {
  profile: string;
  archetype: string;
  blurb: string;
  strengths: string[];
  development: string[];
}

const CONTENT: Record<Lang, Record<ProfileKey, ProfileText>> = {
  de: {
    navigator: {
      profile: 'Flexibler Problemlöser',
      archetype: 'Der Navigator',
      blurb: 'Sie erkennen neue Muster schnell und passen Ihre Strategie flexibel an. Veränderungen werden eher als Chance denn als Hindernis wahrgenommen.',
      strengths: ['Hohe Anpassungsfähigkeit', 'Schnelles Lernen aus Feedback', 'Strategische Flexibilität'],
      development: ['Geduld bei Routineaufgaben', 'Unnötige Strategiewechsel vermeiden', 'Konsequente Umsetzung langfristiger Pläne'],
    },
    innovator: {
      profile: 'Adaptiver Innovator',
      archetype: 'Der Innovator',
      blurb: 'Sie reagieren beweglich auf Regelwechsel und probieren bereitwillig neue Ansätze aus, ohne lange an Überholtem festzuhalten.',
      strengths: ['Offenheit für neue Lösungswege', 'Rasches Umsteuern bei Veränderung', 'Kreative Hypothesenbildung'],
      development: ['Bewährte Strategien länger nutzen', 'Stabilität vor zu frühem Wechsel', 'Fokus auf Konsistenz'],
    },
    explorer: {
      profile: 'Schneller Experimentierer',
      archetype: 'Der Entdecker',
      blurb: 'Sie testen viele Möglichkeiten aktiv aus. Lösungen entstehen durch Ausprobieren, eine stabile Strategie bildet sich erst nach und nach.',
      strengths: ['Hohe Versuchsbereitschaft', 'Keine Angst vor Fehlern', 'Schnelles Sammeln von Informationen'],
      development: ['Aus Feedback gezielter ableiten', 'Strategie früher festigen', 'Tempo mit Genauigkeit verbinden'],
    },
    strategist: {
      profile: 'Strategischer Denker',
      archetype: 'Der Stratege',
      blurb: 'Sie arbeiten zielgerichtet und treffsicher. Regeln werden erkannt und konsequent angewendet, mit überlegtem Vorgehen.',
      strengths: ['Hohe Treffsicherheit', 'Strukturiertes Vorgehen', 'Verlässliche Regelanwendung'],
      development: ['Bei Regelwechseln schneller umstellen', 'Mehr Spielraum für alternative Ansätze', 'Flexibilität unter Zeitdruck'],
    },
    analyst: {
      profile: 'Analytischer Optimierer',
      archetype: 'Der Analytiker',
      blurb: 'Sie nähern sich Lösungen systematisch und verbessern Ihr Vorgehen Schritt für Schritt auf Basis der Rückmeldungen.',
      strengths: ['Systematische Herangehensweise', 'Stetige Verbesserung', 'Gute Fehlerauswertung'],
      development: ['Schnellere Entscheidungen', 'Weniger Wiederholungsschleifen', 'Mut zu zügigen Wechseln'],
    },
    architect: {
      profile: 'Strukturierter Entscheider',
      archetype: 'Der Architekt',
      blurb: 'Sie setzen einmal erkannte Regeln sehr genau um. Ihre Stärke liegt in Präzision und Stabilität bei klaren Vorgaben.',
      strengths: ['Hohe Präzision', 'Stabile Umsetzung', 'Zuverlässigkeit bei klaren Regeln'],
      development: ['Festhalten an alten Regeln lösen', 'Veränderung früher akzeptieren', 'Flexibler auf neue Muster reagieren'],
    },
    tactician: {
      profile: 'Vorsichtiger Planer',
      archetype: 'Der Taktiker',
      blurb: 'Sie gehen bedacht vor und sichern Ihre Schritte ab. Regelwechsel erfordern bei Ihnen etwas mehr Zeit zur Neuorientierung.',
      strengths: ['Überlegtes Vorgehen', 'Risikobewusstsein', 'Gründlichkeit'],
      development: ['Schnellere Anpassung an Neues', 'Weniger Festhalten an Bewährtem', 'Feedback rascher umsetzen'],
    },
    pragmatist: {
      profile: 'Beharrlicher Spezialist',
      archetype: 'Der Pragmatiker',
      blurb: 'Sie verfolgen einen einmal gewählten Weg konsequent. Das Umstellen auf neue Regeln fiel in dieser Sitzung schwerer.',
      strengths: ['Hohe Beharrlichkeit', 'Konsequenz', 'Fokus auf einen klaren Weg'],
      development: ['Signale für Regelwechsel früher erkennen', 'Flexibilität bewusst trainieren', 'Alternativen aktiver prüfen'],
    },
  },
  en: {
    navigator: {
      profile: 'Flexible Problem-Solver',
      archetype: 'The Navigator',
      blurb: 'You spot new patterns quickly and adjust your strategy flexibly. Change is seen as an opportunity rather than an obstacle.',
      strengths: ['High adaptability', 'Fast learning from feedback', 'Strategic flexibility'],
      development: ['Patience with routine tasks', 'Avoiding needless strategy switches', 'Consistent follow-through on long-term plans'],
    },
    innovator: {
      profile: 'Adaptive Innovator',
      archetype: 'The Innovator',
      blurb: 'You respond nimbly to rule changes and readily try new approaches without clinging to what no longer works.',
      strengths: ['Openness to new solutions', 'Quick re-steering under change', 'Creative hypothesis forming'],
      development: ['Sticking with proven strategies longer', 'Stability before early switching', 'Focus on consistency'],
    },
    explorer: {
      profile: 'Fast Experimenter',
      archetype: 'The Explorer',
      blurb: 'You actively test many options. Solutions emerge through trial, and a stable strategy forms only gradually.',
      strengths: ['Strong willingness to try', 'No fear of mistakes', 'Fast information gathering'],
      development: ['Drawing more from feedback', 'Consolidating strategy earlier', 'Pairing speed with accuracy'],
    },
    strategist: {
      profile: 'Strategic Thinker',
      archetype: 'The Strategist',
      blurb: 'You work in a goal-directed, accurate way. Rules are identified and applied consistently with deliberate execution.',
      strengths: ['High accuracy', 'Structured approach', 'Reliable rule application'],
      development: ['Switching faster on rule changes', 'More room for alternatives', 'Flexibility under time pressure'],
    },
    analyst: {
      profile: 'Analytical Optimiser',
      archetype: 'The Analyst',
      blurb: 'You approach solutions systematically and refine your method step by step based on the feedback.',
      strengths: ['Systematic approach', 'Continuous improvement', 'Good error analysis'],
      development: ['Faster decisions', 'Fewer repetition loops', 'Courage for prompt switches'],
    },
    architect: {
      profile: 'Structured Decider',
      archetype: 'The Architect',
      blurb: 'You apply a recognised rule very precisely. Your strength is precision and stability when the brief is clear.',
      strengths: ['High precision', 'Stable execution', 'Reliability with clear rules'],
      development: ['Letting go of old rules', 'Accepting change earlier', 'Reacting more flexibly to new patterns'],
    },
    tactician: {
      profile: 'Careful Planner',
      archetype: 'The Tactician',
      blurb: 'You proceed thoughtfully and secure each step. Rule changes take you a little more time to reorient.',
      strengths: ['Deliberate approach', 'Risk awareness', 'Thoroughness'],
      development: ['Faster adaptation to the new', 'Less holding on to the familiar', 'Acting on feedback sooner'],
    },
    pragmatist: {
      profile: 'Persistent Specialist',
      archetype: 'The Pragmatist',
      blurb: 'You pursue a chosen path consistently. Switching to new rules was harder in this session.',
      strengths: ['High persistence', 'Consistency', 'Focus on one clear path'],
      development: ['Spotting rule-change signals earlier', 'Deliberately training flexibility', 'Checking alternatives more actively'],
    },
  },
  fr: {
    navigator: {
      profile: 'Résolveur flexible',
      archetype: 'Le Navigateur',
      blurb: 'Vous repérez vite de nouveaux schémas et adaptez votre stratégie avec souplesse. Le changement est perçu comme une chance plutôt qu\'un obstacle.',
      strengths: ['Grande capacité d\'adaptation', 'Apprentissage rapide par le retour', 'Flexibilité stratégique'],
      development: ['Patience dans les tâches routinières', 'Éviter les changements de stratégie inutiles', 'Suivi constant des plans à long terme'],
    },
    innovator: {
      profile: 'Innovateur adaptatif',
      archetype: 'L\'Innovateur',
      blurb: 'Vous réagissez avec agilité aux changements de règle et essayez volontiers de nouvelles approches sans vous accrocher au dépassé.',
      strengths: ['Ouverture aux nouvelles solutions', 'Réorientation rapide', 'Formulation créative d\'hypothèses'],
      development: ['Conserver plus longtemps les stratégies éprouvées', 'Stabilité avant un changement précoce', 'Accent sur la cohérence'],
    },
    explorer: {
      profile: 'Expérimentateur rapide',
      archetype: 'L\'Explorateur',
      blurb: 'Vous testez activement de nombreuses options. Les solutions émergent par essais ; une stratégie stable ne se forme que progressivement.',
      strengths: ['Grande volonté d\'essayer', 'Aucune peur de l\'erreur', 'Collecte rapide d\'informations'],
      development: ['Mieux exploiter le retour', 'Consolider la stratégie plus tôt', 'Allier vitesse et précision'],
    },
    strategist: {
      profile: 'Penseur stratégique',
      archetype: 'Le Stratège',
      blurb: 'Vous travaillez de façon ciblée et précise. Les règles sont reconnues et appliquées avec constance et réflexion.',
      strengths: ['Grande précision', 'Démarche structurée', 'Application fiable des règles'],
      development: ['Changer plus vite lors des changements de règle', 'Plus de place aux alternatives', 'Flexibilité sous pression'],
    },
    analyst: {
      profile: 'Optimiseur analytique',
      archetype: 'L\'Analyste',
      blurb: 'Vous abordez les solutions de manière systématique et affinez votre méthode pas à pas selon les retours.',
      strengths: ['Approche systématique', 'Amélioration continue', 'Bonne analyse des erreurs'],
      development: ['Décisions plus rapides', 'Moins de boucles de répétition', 'Oser des changements rapides'],
    },
    architect: {
      profile: 'Décideur structuré',
      archetype: 'L\'Architecte',
      blurb: 'Vous appliquez très précisément une règle reconnue. Votre force est la précision et la stabilité quand le cadre est clair.',
      strengths: ['Grande précision', 'Exécution stable', 'Fiabilité avec des règles claires'],
      development: ['Se détacher des anciennes règles', 'Accepter le changement plus tôt', 'Réagir avec plus de souplesse'],
    },
    tactician: {
      profile: 'Planificateur prudent',
      archetype: 'Le Tacticien',
      blurb: 'Vous avancez avec prudence et sécurisez chaque étape. Les changements de règle demandent un peu plus de temps de réorientation.',
      strengths: ['Démarche réfléchie', 'Conscience du risque', 'Rigueur'],
      development: ['Adaptation plus rapide au nouveau', 'Moins s\'accrocher au familier', 'Agir plus vite sur le retour'],
    },
    pragmatist: {
      profile: 'Spécialiste persévérant',
      archetype: 'Le Pragmatique',
      blurb: 'Vous suivez une voie choisie avec constance. Passer à de nouvelles règles a été plus difficile dans cette session.',
      strengths: ['Grande persévérance', 'Constance', 'Concentration sur une voie claire'],
      development: ['Repérer plus tôt les signaux de changement', 'Entraîner la flexibilité', 'Vérifier plus activement les alternatives'],
    },
  },
};

function deriveKey(m: ProfileMetrics): ProfileKey {
  const flexibility: 'strong' | 'moderate' | 'reduced' =
    m.persevErrors <= 2 ? 'strong' : m.persevErrors <= 5 ? 'moderate' : 'reduced';
  const efficiency: 'high' | 'mid' | 'low' =
    m.accuracy >= 75 ? 'high' : m.accuracy >= 55 ? 'mid' : 'low';

  const map: Record<string, ProfileKey> = {
    'strong|high': 'navigator',
    'strong|mid': 'innovator',
    'strong|low': 'explorer',
    'moderate|high': 'strategist',
    'moderate|mid': 'analyst',
    'moderate|low': 'explorer',
    'reduced|high': 'architect',
    'reduced|mid': 'tactician',
    'reduced|low': 'pragmatist',
  };
  return map[`${flexibility}|${efficiency}`];
}

export interface ProfileResult extends ProfileText {
  key: ProfileKey;
}

export function buildProfile(lang: Lang, m: ProfileMetrics): ProfileResult {
  const key = deriveKey(m);
  return { key, ...CONTENT[lang][key] };
}

export interface BenchmarkRow {
  label: string;
  you: number;
  reference: number;
  // 'better' = user value is more favourable than the reference, 'similar', 'below'
  direction: 'better' | 'similar' | 'below';
}

const BENCH_LABELS: Record<Lang, { categories: string; total: string; persev: string; nonpersev: string; you: string; reference: string; title: string; note: string }> = {
  de: {
    categories: 'Abgeschlossene Kategorien',
    total: 'Fehler gesamt',
    persev: 'Perseverative Fehler',
    nonpersev: 'Nicht-perseverative Fehler',
    you: 'Sie',
    reference: 'Referenz',
    title: 'Vergleich mit Referenzprofil',
    note: 'Orientierungswerte aus einem Referenzprofil — keine klinische Normierung.',
  },
  en: {
    categories: 'Categories completed',
    total: 'Total errors',
    persev: 'Perseverative errors',
    nonpersev: 'Non-perseverative errors',
    you: 'You',
    reference: 'Reference',
    title: 'Comparison with reference profile',
    note: 'Orientation values from a reference profile — not a clinical norm.',
  },
  fr: {
    categories: 'Catégories complétées',
    total: 'Erreurs au total',
    persev: 'Erreurs persévératives',
    nonpersev: 'Erreurs non persévératives',
    you: 'Vous',
    reference: 'Référence',
    title: 'Comparaison avec un profil de référence',
    note: 'Valeurs d\'orientation issues d\'un profil de référence — pas une norme clinique.',
  },
};

export function benchLabels(lang: Lang) {
  return BENCH_LABELS[lang];
}

export function buildBenchmark(lang: Lang, m: ProfileMetrics): BenchmarkRow[] {
  const lbl = BENCH_LABELS[lang];
  const nonPersev = Math.max(0, m.errors - m.persevErrors);

  // For categories: more is better. For errors: fewer is better.
  const cmp = (you: number, ref: number, lowerIsBetter: boolean): BenchmarkRow['direction'] => {
    const delta = you - ref;
    const tol = Math.max(1, Math.round(ref * 0.15));
    if (Math.abs(delta) <= tol) return 'similar';
    if (lowerIsBetter) return delta < 0 ? 'better' : 'below';
    return delta > 0 ? 'better' : 'below';
  };

  return [
    { label: lbl.categories, you: m.categoriesDone, reference: REFERENCE.categoriesCompleted, direction: cmp(m.categoriesDone, REFERENCE.categoriesCompleted, false) },
    { label: lbl.total, you: m.errors, reference: REFERENCE.totalErrors, direction: cmp(m.errors, REFERENCE.totalErrors, true) },
    { label: lbl.persev, you: m.persevErrors, reference: REFERENCE.perseverativeErrors, direction: cmp(m.persevErrors, REFERENCE.perseverativeErrors, true) },
    { label: lbl.nonpersev, you: nonPersev, reference: REFERENCE.nonPerseverativeErrors, direction: cmp(nonPersev, REFERENCE.nonPerseverativeErrors, true) },
  ];
}
