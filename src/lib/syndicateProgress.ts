// Persistent player progression for Syndicate — stats, records & achievements.
// localStorage-only, scoped to this browser. No backend, no auth.

import { OPERATIONS } from "@/data/syndicateData";

const STATS_KEY = "syndicate.stats.v1";
const ACH_KEY = "syndicate.achievements.v1";

/* ------------------------------------------------------------------ */
/*  Persistent statistics & lifetime records                          */
/* ------------------------------------------------------------------ */

export interface SyndicateStats {
  gamesPlayed: number;
  gamesWon: number;
  highestFortune: number; // highest final cash ever
  largestPayout: number; // biggest single-spin net profit ever
  longestSurvival: number; // most rounds survived in one game
  closestEscape: number; // smallest survived margin (°) ever; lower = closer
  currentWinStreak: number;
  longestWinStreak: number;
  luckiestRun: number; // best good-outcome % in a single game
  fastestVictory: number; // fewest rounds to a win (0 = none yet)
  mostEliminationsSurvived: number; // rivals eliminated while you survived
  opCounts: Record<string, number>; // operations you have run, lifetime
}

const EMPTY_STATS: SyndicateStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  highestFortune: 0,
  largestPayout: 0,
  longestSurvival: 0,
  closestEscape: 360,
  currentWinStreak: 0,
  longestWinStreak: 0,
  luckiestRun: 0,
  fastestVictory: 0,
  mostEliminationsSurvived: 0,
  opCounts: {},
};

export function loadStats(): SyndicateStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...EMPTY_STATS };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATS, ...parsed, opCounts: parsed.opCounts ?? {} };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function saveStats(s: SyndicateStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

export function winRate(s: SyndicateStats): number {
  return s.gamesPlayed ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0;
}

export function mostUsedOp(s: SyndicateStats): { name: string; count: number } | null {
  const entries = Object.entries(s.opCounts);
  if (!entries.length) return null;
  const [id, count] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const op = OPERATIONS.find((o) => o.id === id);
  return { name: op?.name ?? id, count };
}

/* ------------------------------------------------------------------ */
/*  End-of-game summary                                               */
/* ------------------------------------------------------------------ */

export interface GameSummary {
  won: boolean;
  finalCash: number;
  roundsSurvived: number;
  closestCall: number; // smallest margin survived this game (°)
  opsCompleted: number;
  biggestWin: number; // biggest single net profit this game
  caughtHits: number;
  goodOutcomes: number;
  totalOutcomes: number;
  eliminationsSurvived: number; // rivals eliminated while you were alive
  neverCaught: boolean;
  roundsToWin: number | null; // rounds it took to win (null if lost)
  usedOps: Record<string, number>;
  seeded: boolean;
}

/** Merge a finished game into persistent stats and return the new stats. */
export function recordGame(g: GameSummary): SyndicateStats {
  const s = loadStats();
  s.gamesPlayed += 1;
  if (g.won) {
    s.gamesWon += 1;
    s.currentWinStreak += 1;
    s.longestWinStreak = Math.max(s.longestWinStreak, s.currentWinStreak);
    if (g.roundsToWin != null)
      s.fastestVictory =
        s.fastestVictory === 0
          ? g.roundsToWin
          : Math.min(s.fastestVictory, g.roundsToWin);
  } else {
    s.currentWinStreak = 0;
  }
  s.highestFortune = Math.max(s.highestFortune, g.finalCash);
  s.largestPayout = Math.max(s.largestPayout, g.biggestWin);
  s.longestSurvival = Math.max(s.longestSurvival, g.roundsSurvived);
  if (g.closestCall < s.closestEscape) s.closestEscape = g.closestCall;
  const luck = g.totalOutcomes
    ? Math.round((g.goodOutcomes / g.totalOutcomes) * 100)
    : 0;
  s.luckiestRun = Math.max(s.luckiestRun, luck);
  s.mostEliminationsSurvived = Math.max(
    s.mostEliminationsSurvived,
    g.eliminationsSurvived,
  );
  for (const [id, n] of Object.entries(g.usedOps))
    s.opCounts[id] = (s.opCounts[id] ?? 0) + n;
  saveStats(s);
  return s;
}

/* ------------------------------------------------------------------ */
/*  Achievements                                                      */
/* ------------------------------------------------------------------ */

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (g: GameSummary, s: SyndicateStats) => boolean;
}

// `s` here is the AFTER-recording stats snapshot, so lifetime checks work.
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_blood", name: "First Blood", desc: "Finish your first game.", icon: "🩸", check: (_g, s) => s.gamesPlayed >= 1 },
  { id: "first_win", name: "Made It", desc: "Win your first game.", icon: "🏆", check: (g) => g.won },
  { id: "high_roller", name: "High Roller", desc: "Run a very-high-risk operation.", icon: "🎲", check: (_g) => false },
  { id: "millionaire", name: "Millionaire", desc: "Finish with $1,000,000+.", icon: "💰", check: (g) => g.finalCash >= 1_000_000 },
  { id: "multimillionaire", name: "Multimillionaire", desc: "Finish with $3,000,000+.", icon: "💵", check: (g) => g.finalCash >= 3_000_000 },
  { id: "untouchable", name: "Untouchable", desc: "Win without ever getting caught.", icon: "🛡️", check: (g) => g.won && g.neverCaught },
  { id: "lucky_escape", name: "Lucky Escape", desc: "Survive a spin within 5° of Caught.", icon: "😅", check: (g) => g.closestCall <= 5 },
  { id: "razor_edge", name: "Razor's Edge", desc: "Survive a spin within 2° of Caught.", icon: "🪒", check: (g) => g.closestCall <= 2 },
  { id: "last_survivor", name: "Last Survivor", desc: "Win as the only one left standing.", icon: "🧍", check: (g) => g.won && g.eliminationsSurvived >= 5 },
  { id: "risk_addict", name: "Risk Addict", desc: "Run 8+ operations in a game.", icon: "🔥", check: (g) => g.opsCompleted >= 8 },
  { id: "kingpin", name: "Kingpin", desc: "Win 10 games total.", icon: "👑", check: (_g, s) => s.gamesWon >= 10 },
  { id: "syndicate_boss", name: "Syndicate Boss", desc: "Win 25 games total.", icon: "🎩", check: (_g, s) => s.gamesWon >= 25 },
  { id: "fortunes_bold", name: "Fortune Favors the Bold", desc: "Land a single profit of $200k+.", icon: "🚀", check: (g) => g.biggestWin >= 200_000 },
  { id: "jackpot", name: "Jackpot", desc: "Land a single profit of $400k+.", icon: "🎰", check: (g) => g.biggestWin >= 400_000 },
  { id: "survivor", name: "Survivor", desc: "Survive all 12 rounds.", icon: "⏳", check: (g) => g.roundsSurvived >= 12 },
  { id: "streak3", name: "On a Roll", desc: "Win 3 games in a row.", icon: "📈", check: (_g, s) => s.longestWinStreak >= 3 },
  { id: "streak5", name: "Unstoppable", desc: "Win 5 games in a row.", icon: "⚡", check: (_g, s) => s.longestWinStreak >= 5 },
  { id: "lucky_bastard", name: "Lucky Bastard", desc: "Finish a game with 80%+ good outcomes.", icon: "🍀", check: (g) => g.totalOutcomes >= 4 && g.goodOutcomes / g.totalOutcomes >= 0.8 },
  { id: "phoenix", name: "Phoenix", desc: "Win after losing a token.", icon: "🔥", check: (g) => g.won && g.caughtHits >= 1 },
  { id: "daredevil", name: "Daredevil", desc: "Win after losing 2 tokens.", icon: "💀", check: (g) => g.won && g.caughtHits >= 2 },
  { id: "veteran", name: "Veteran", desc: "Play 25 games.", icon: "🎖️", check: (_g, s) => s.gamesPlayed >= 25 },
  { id: "century", name: "Centurion", desc: "Play 100 games.", icon: "💯", check: (_g, s) => s.gamesPlayed >= 100 },
  { id: "swift", name: "Swift Justice", desc: "Win in 6 rounds or fewer.", icon: "🏃", check: (g) => g.won && g.roundsToWin != null && g.roundsToWin <= 6 },
  { id: "dynasty", name: "Dynasty", desc: "Reach a lifetime high of $2,000,000.", icon: "🏰", check: (_g, s) => s.highestFortune >= 2_000_000 },
  { id: "workaholic", name: "Workaholic", desc: "Run 100 operations lifetime.", icon: "🛠️", check: (_g, s) => Object.values(s.opCounts).reduce((a, b) => a + b, 0) >= 100 },
  { id: "generalist", name: "Generalist", desc: "Try every operation at least once.", icon: "🗂️", check: (_g, s) => OPERATIONS.every((o) => (s.opCounts[o.id] ?? 0) > 0) },
  { id: "comeback", name: "Comeback Kid", desc: "Win with 5 rivals eliminated.", icon: "🎯", check: (g) => g.won && g.eliminationsSurvived >= 4 },
  { id: "daily_player", name: "Creature of Habit", desc: "Finish a Daily / Seeded game.", icon: "📅", check: (g) => g.seeded },
  { id: "grinder", name: "Grinder", desc: "Win 50 games total.", icon: "⛏️", check: (_g, s) => s.gamesWon >= 50 },
  { id: "flawless", name: "Flawless Empire", desc: "Win untouched with all 12 rounds survived.", icon: "✨", check: (g) => g.won && g.neverCaught && g.roundsSurvived >= 12 },
];

export function loadUnlocked(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ACH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Evaluate achievements after a game; returns newly-unlocked ones. */
export function evaluateAchievements(
  g: GameSummary,
  statsAfter: SyndicateStats,
  extra: { ranHighRisk: boolean },
): Achievement[] {
  const unlocked = loadUnlocked();
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked[a.id]) continue;
    const ok = a.id === "high_roller" ? extra.ranHighRisk : a.check(g, statsAfter);
    if (ok) {
      unlocked[a.id] = Date.now();
      fresh.push(a);
    }
  }
  if (fresh.length) {
    try {
      localStorage.setItem(ACH_KEY, JSON.stringify(unlocked));
    } catch {
      /* ignore */
    }
  }
  return fresh;
}
