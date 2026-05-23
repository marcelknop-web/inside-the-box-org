// Blind Spot — Top-10 leaderboard per role, localStorage-only.

const STORAGE_PREFIX = "blindSpot.highscores.v1";
const MAX_ENTRIES = 10;
const NAME_MAX = 16;

export interface BSHighscoreEntry {
  name: string;
  score: number;
  role: string;
  ts: number;
}

const keyFor = (role: string) =>
  `${STORAGE_PREFIX}.${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export function loadBSHighscores(role: string): BSHighscoreEntry[] {
  try {
    const raw = localStorage.getItem(keyFor(role));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is BSHighscoreEntry =>
          e &&
          typeof e.name === "string" &&
          typeof e.score === "number" &&
          typeof e.role === "string" &&
          typeof e.ts === "number",
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function qualifiesBS(score: number, role: string): boolean {
  if (score <= 0) return false;
  const list = loadBSHighscores(role);
  if (list.length < MAX_ENTRIES) return true;
  return score > list[list.length - 1].score;
}

export function saveBSHighscore(
  entry: Omit<BSHighscoreEntry, "ts">,
): BSHighscoreEntry[] {
  const cleanName = (entry.name || "").trim().slice(0, NAME_MAX) || "ANON";
  const next: BSHighscoreEntry = {
    name: cleanName,
    score: Math.max(0, Math.floor(entry.score)),
    role: entry.role,
    ts: Date.now(),
  };
  const list = [...loadBSHighscores(entry.role), next]
    .sort((a, b) => b.score - a.score || a.ts - b.ts)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(keyFor(entry.role), JSON.stringify(list));
  } catch {
    /* ignore quota */
  }
  return list;
}

export const BS_HIGHSCORE_NAME_MAX = NAME_MAX;
