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

// --- Spielstand ---
export interface NordsternState {
  boatName: string;
  currentStage: number; // 0..6
  completedStages: string[];
  difficulty: number; // 3..8
  correctStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  patches: string[]; // gesammelte Hafen-Patches
  windSeed: number; // für Wetter-Variation
}

const STATE_KEY = 'nordstern_state_v1';

export function loadState(): NordsternState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    boatName: 'Nordstern',
    currentStage: 0,
    completedStages: [],
    difficulty: 4,
    correctStreak: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    patches: [],
    windSeed: Math.floor(Math.random() * 1000),
  };
}
export function saveState(s: NordsternState) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}
export function resetState() {
  try { localStorage.removeItem(STATE_KEY); localStorage.removeItem(KEY); } catch {}
}
