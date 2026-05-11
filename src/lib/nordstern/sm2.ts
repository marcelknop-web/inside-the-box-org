// SM-2 lite Spaced Repetition – client-side, localStorage
// Pro Frage: { topic, sourceIndex, ef, interval (Tage), repetitions, dueAt }

export interface SrsCard {
  key: string; // `${topic}:${sourceIndex}`
  topic: string;
  sourceIndex: number;
  ef: number;
  interval: number;
  repetitions: number;
  dueAt: number; // epoch ms
  lastQuality: number;
}

const KEY = 'nordstern_srs_v1';

export function loadDeck(): Record<string, SrsCard> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
export function saveDeck(deck: Record<string, SrsCard>) {
  try { localStorage.setItem(KEY, JSON.stringify(deck)); } catch {}
}

// quality: 0 (falsch) | 3 (knapp) | 5 (perfekt)
export function review(card: SrsCard | null, topic: string, sourceIndex: number, quality: number): SrsCard {
  const now = Date.now();
  const base: SrsCard = card ?? {
    key: `${topic}:${sourceIndex}`, topic, sourceIndex,
    ef: 2.5, interval: 0, repetitions: 0, dueAt: now, lastQuality: 0,
  };
  let { ef, interval, repetitions } = base;
  if (quality < 3) {
    repetitions = 0;
    interval = 0; // sofort wieder fällig (in dieser Session)
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * ef);
    ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  const dueAt = quality < 3
    ? now + 60_000 // 1 min – Pauk-Wiederholung
    : now + interval * 86_400_000;
  return { ...base, ef, interval, repetitions, dueAt, lastQuality: quality };
}

export function dueCards(deck: Record<string, SrsCard>, now = Date.now()): SrsCard[] {
  return Object.values(deck).filter(c => c.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}

// --- Crew ---
export interface CrewMember {
  id: string; name: string; role: string; effect: string; emoji: string;
}
export const CREW_POOL: CrewMember[] = [
  { id: 'lotse',    name: 'Kostas',  role: 'Lotse',       effect: '+1 Joker pro Etappe',                emoji: '🧭' },
  { id: 'meteo',    name: 'Ariadne', role: 'Wetterfrau',  effect: 'Sturm-Vorwarnung',                   emoji: '🌤️' },
  { id: 'mechanic', name: 'Yannis',  role: 'Maschinist',  effect: 'Patzer-Versicherung 1× pro Reise',   emoji: '🔧' },
  { id: 'cook',     name: 'Sofia',   role: 'Smut',        effect: 'Moralbonus auf Streak',              emoji: '🍲' },
  { id: 'navigator',name: 'Dimitri', role: 'Navigator',   effect: 'Schwierigkeit −1 im Hafenmanöver',   emoji: '📐' },
];

export interface KnowledgeCard {
  topic: string; sourceIndex: number; q: string; a: string; addedAt: number;
}

// --- Spielstand ---
export interface NordsternState {
  boatName: string;
  currentStage: number;
  completedStages: string[];
  difficulty: number;
  correctStreak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  patches: string[];
  crew: string[];
  knowledgeCards: KnowledgeCard[];
  windSeed: number;
  insuranceUsed: boolean;
}

const STATE_KEY = 'nordstern_state_v1';
const DEFAULT_STATE: NordsternState = {
  boatName: 'Nordstern', currentStage: 0, completedStages: [],
  difficulty: 4, correctStreak: 0, bestStreak: 0,
  totalCorrect: 0, totalAnswered: 0, patches: [],
  crew: [], knowledgeCards: [], windSeed: Math.floor(Math.random() * 1000),
  insuranceUsed: false,
};

export function loadState(): NordsternState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATE };
}
export function saveState(s: NordsternState) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}
export function resetState() {
  try { localStorage.removeItem(STATE_KEY); localStorage.removeItem(KEY); } catch {}
}

export function pickNewCrew(owned: string[]): CrewMember | null {
  const remaining = CREW_POOL.filter(c => !owned.includes(c.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}
