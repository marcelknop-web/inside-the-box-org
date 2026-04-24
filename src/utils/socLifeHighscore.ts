// Local highscore for SOC Life — Top 10 per browser, persisted in localStorage.
// No backend, no auth. Survives reloads but is scoped to this browser profile.
//
// The variant-aware SOC Life shell (IT and OT) calls these helpers with an
// explicit `storageKey` so highscores from the IT and OT shifts stay in
// separate buckets. The default key keeps backwards compatibility with
// existing IT-only persisted entries.

const DEFAULT_STORAGE_KEY = "socLife.highscores.v1";
const MAX_ENTRIES = 10;
const NAME_MAX = 16;

export interface HighscoreEntry {
  name: string;
  score: number;
  incidents: number;
  shiftSec: number;
  ts: number; // epoch ms
}

export function loadHighscores(storageKey: string = DEFAULT_STORAGE_KEY): HighscoreEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is HighscoreEntry =>
          e &&
          typeof e.name === "string" &&
          typeof e.score === "number" &&
          typeof e.incidents === "number" &&
          typeof e.shiftSec === "number" &&
          typeof e.ts === "number"
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Returns true if this score would land in the Top 10. */
export function qualifiesForHighscore(
  score: number,
  storageKey: string = DEFAULT_STORAGE_KEY,
): boolean {
  if (score <= 0) return false;
  const list = loadHighscores(storageKey);
  if (list.length < MAX_ENTRIES) return true;
  return score > list[list.length - 1].score;
}

/** Inserts a new entry, sorts desc by score, trims to Top 10. Returns updated list. */
export function saveHighscore(
  entry: Omit<HighscoreEntry, "ts">,
  storageKey: string = DEFAULT_STORAGE_KEY,
): HighscoreEntry[] {
  const cleanName =
    (entry.name || "").trim().slice(0, NAME_MAX) || "ANON";
  const next: HighscoreEntry = {
    name: cleanName,
    score: Math.max(0, Math.floor(entry.score)),
    incidents: Math.max(0, Math.floor(entry.incidents)),
    shiftSec: Math.max(0, Math.floor(entry.shiftSec)),
    ts: Date.now(),
  };
  const list = [...loadHighscores(storageKey), next]
    .sort((a, b) => b.score - a.score || a.ts - b.ts)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch {
    // ignore quota / privacy-mode errors
  }
  return list;
}

export const HIGHSCORE_NAME_MAX = NAME_MAX;
