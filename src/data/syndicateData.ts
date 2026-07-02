/* ------------------------------------------------------------------ */
/*  Syndicate — game data & rules (all fictional, board-game style).    */
/*  Purely a luck/strategy game. No real-world guidance of any kind.    */
/* ------------------------------------------------------------------ */

export type RiskLevel = "low" | "medium" | "high" | "veryhigh";

export interface Operation {
  id: string;
  name: string;
  description: string;
  cost: number;
  payout: number; // gross return on a "Success" outcome
  risk: RiskLevel;
}

// Base "Caught" slice fraction per risk level (modified by global events).
// Calibrated via a 5,000-game balancing simulation (see /tmp balancing report):
// high-risk detection was lowered so aggressive play stays viable, and every
// tier now earns a realistic share of wins.
export const RISK_CAUGHT: Record<RiskLevel, number> = {
  low: 0.06,
  medium: 0.18,
  high: 0.2,
  veryhigh: 0.3,
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  veryhigh: "Very High",
};

export const OPERATIONS: Operation[] = [
  {
    id: "phish",
    name: "Phantom Phish",
    description: "Cast a wide net of fake logins and skim careless clicks.",
    cost: 4000,
    payout: 7000,
    risk: "low",
  },
  {
    id: "identity",
    name: "Identity Fraud",
    description: "Stitch together stolen personas and cash out quietly.",
    cost: 8000,
    payout: 14000,
    risk: "low",
  },
  {
    id: "skimmer",
    name: "Ghost Skimmer",
    description: "Plant invisible taps on payment terminals across the city.",
    cost: 12000,
    payout: 20000,
    risk: "low",
  },
  {
    id: "romance",
    name: "Velvet Con",
    description: "A long game of charm, patience, and emptied wallets.",
    cost: 15000,
    payout: 41000,
    risk: "medium",
  },
  {
    id: "luxury",
    name: "Luxury Scam",
    description: "Sell counterfeit dreams to buyers who never ask twice.",
    cost: 25000,
    payout: 62000,
    risk: "medium",
  },
  {
    id: "ransom",
    name: "Locked Vault",
    description: "Freeze a corporation's files and name your price.",
    cost: 30000,
    payout: 81000,
    risk: "medium",
  },
  {
    id: "crypto",
    name: "Rug Pull Royale",
    description: "Launch a shiny token, hype it, then vanish overnight.",
    cost: 35000,
    payout: 138000,
    risk: "high",
  },
  {
    id: "market",
    name: "Dark Marketplace",
    description: "Run a hidden bazaar and pocket a cut of every trade.",
    cost: 40000,
    payout: 159000,
    risk: "high",
  },
  {
    id: "insider",
    name: "Inside Job",
    description: "Bribe a mole for secrets the whole market will pay for.",
    cost: 50000,
    payout: 196000,
    risk: "high",
  },
  {
    id: "heist",
    name: "Vault Heist",
    description: "One night, one big score, zero room for mistakes.",
    cost: 65000,
    payout: 286000,
    risk: "veryhigh",
  },
  {
    id: "laundry",
    name: "Casino Laundromat",
    description: "Wash a fortune through neon tables and shell companies.",
    cost: 80000,
    payout: 230000,
    risk: "veryhigh",
  },
  {
    id: "syndicate",
    name: "Syndicate Takeover",
    description: "Absorb a rival crew and seize their entire operation.",
    cost: 110000,
    payout: 398000,
    risk: "veryhigh",
  },
];

export type Personality =
  | "conservative"
  | "risktaker"
  | "greedy"
  | "adaptive"
  | "chaotic";

export interface AiProfile {
  id: string;
  name: string;
  personality: Personality;
  blurb: string;
  ability: string; // short, human-readable special ability
  color: string;
  avatar: string; // emoji-style glyph
}

export const AI_PROFILES: AiProfile[] = [
  {
    id: "ai-vex",
    name: "Vex",
    personality: "conservative",
    blurb: "Plays it safe. Small, steady scores.",
    ability: "Careful operator — detection risk reduced by 5%.",
    color: "#38bdf8",
    avatar: "🦊",
  },
  {
    id: "ai-nyx",
    name: "Nyx",
    personality: "risktaker",
    blurb: "Loves the edge. High risk, high reward.",
    ability: "Adrenaline junkie — +15% payout on high-risk wins.",
    color: "#f472b6",
    avatar: "🐍",
  },
  {
    id: "ai-mammon",
    name: "Mammon",
    personality: "greedy",
    blurb: "Greed is everything. Always chases the biggest payout.",
    ability: "Gains +10% bonus on high-risk payouts.",
    color: "#f5b800",
    avatar: "🐲",
  },
  {
    id: "ai-echo",
    name: "Echo",
    personality: "adaptive",
    blurb: "Always adapts. Reads the board to survive.",
    ability: "Chooses operations based on the current leaderboard.",
    color: "#a78bfa",
    avatar: "🦉",
  },
  {
    id: "ai-glitch",
    name: "Glitch",
    personality: "chaotic",
    blurb: "Utterly unpredictable. Anything goes.",
    ability: "Wild card — occasionally doubles a winning score.",
    color: "#34d399",
    avatar: "🃏",
  },
];

export interface GlobalEvent {
  id: string;
  name: string;
  description: string;
  // multiplier applied to every operation's caught fraction this round
  riskMult: number;
  // multiplier applied to winning payouts this round
  profitMult: number;
}

export const GLOBAL_EVENTS: GlobalEvent[] = [
  {
    id: "cooperation",
    name: "International Cooperation",
    description: "Task forces align across borders. Detection risk rises.",
    riskMult: 1.4,
    profitMult: 1,
  },
  {
    id: "budgetcuts",
    name: "Law Enforcement Budget Cuts",
    description: "Understaffed and overworked. Detection risk drops.",
    riskMult: 0.6,
    profitMult: 1,
  },
  {
    id: "boom",
    name: "Economic Boom",
    description: "Money flows freely. Every operation pays more.",
    riskMult: 1,
    profitMult: 1.35,
  },
  {
    id: "crash",
    name: "Crypto Crash",
    description: "Markets bleed out. Big operations pay far less.",
    riskMult: 1,
    profitMult: 0.7,
  },
  {
    id: "media",
    name: "Media Distraction",
    description: "The press chases a scandal elsewhere. Investigations ease.",
    riskMult: 0.75,
    profitMult: 1.1,
  },
  {
    id: "leak",
    name: "Anonymous Data Leak",
    description:
      "Anonymous leaks thousands of documents. Law enforcement is overwhelmed.",
    riskMult: 0.7,
    profitMult: 1,
  },
  {
    id: "summit",
    name: "Global Cyber Summit",
    description: "Nations unite against crime. International cooperation surges.",
    riskMult: 1.5,
    profitMult: 1,
  },
  {
    id: "goldrush",
    name: "Underground Gold Rush",
    description: "New black markets open. Every score pays a premium.",
    riskMult: 1.1,
    profitMult: 1.4,
  },
  {
    id: "informant",
    name: "Informant Network",
    description: "A snitch feeds the authorities. Everyone is being watched.",
    riskMult: 1.3,
    profitMult: 1,
  },
  {
    id: "blackout",
    name: "City-Wide Blackout",
    description: "The grid fails. Chaos hides your moves — for now.",
    riskMult: 0.65,
    profitMult: 1.15,
  },
];

export const START_CASH = 100000;
export const TOTAL_ROUNDS = 12;
export const START_TOKENS = 3;

// --- AI tuning (from 5,000-game balancing simulation) ---
// Special-ability modifiers applied during outcome resolution.
export const AI_ABILITY = {
  conservativeCaughtAdj: -0.01, // careful operator: slightly lower detection
  risktakerPayout: 1.2, // adrenaline junkie: bigger high-risk wins
  greedyPayout: 1.06, // greed bonus on high-risk payouts
  chaoticDoubleChance: 0.17, // wild card: chance to double a win
};

// Weighted decision model — spreads operation choice so no single op or
// strategy dominates while keeping each personality distinct.
export const AI_DECIDE = {
  consK: 1.16, // conservative: penalty per risk tier
  riskK: 1.08, // risktaker: penalty per step below very-high
  greedK: 1.48, // greedy: payout exponent
  adaptK: 1.51, // adaptive: pull toward target risk tier
  chaosPay: 0.18, // chaotic: mild payout bias
  payBias: 0.84, // within-set payout preference (all)
  temp: 1.55, // softmax temperature (higher = more variety)
};

export const RISK_INDEX: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  veryhigh: 3,
};

// Global "Heat" — a rising worldwide manhunt level. Added directly to every
// operation's caught fraction. Indexed by round (1-based). Climbs steeply in
// the endgame so late rounds are tense and safe-farming stops working.
export const HEAT_BY_ROUND = [
  0, 0, 0.008, 0.017, 0.025, 0.034, 0.045, 0.056, 0.07, 0.085, 0.096, 0.105,
  0.113,
];

export function heatForRound(round: number): number {
  const idx = Math.max(0, Math.min(HEAT_BY_ROUND.length - 1, round));
  return HEAT_BY_ROUND[idx];
}

export type Outcome =
  | "safe"
  | "success"
  | "bigSuccess"
  | "bonus"
  | "investigation"
  | "caught";

export interface WheelSegment {
  type: Outcome;
  weight: number;
  color: string;
  label: string;
}

export const OUTCOME_COLOR: Record<Outcome, string> = {
  safe: "#334155",
  success: "#22c55e",
  bigSuccess: "#f5b800",
  bonus: "#00bcd4",
  investigation: "#f97316",
  caught: "#ef4444",
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  safe: "Safe",
  success: "Success",
  bigSuccess: "Big Success",
  bonus: "Bonus",
  investigation: "Investigation",
  caught: "Caught",
};

// Build the ordered wheel for a given effective caught fraction.
export function buildWheel(caughtFrac: number): WheelSegment[] {
  const clamped = Math.min(0.7, Math.max(0.02, caughtFrac));
  // fixed template weights for the non-caught portion
  const base: { type: Outcome; w: number }[] = [
    { type: "safe", w: 1.33 },
    { type: "success", w: 3 },
    { type: "safe", w: 1.33 },
    { type: "bigSuccess", w: 1.4 },
    { type: "investigation", w: 1.6 },
    { type: "bonus", w: 1 },
    { type: "safe", w: 1.34 },
  ];
  const baseTotal = base.reduce((s, b) => s + b.w, 0); // 11
  const caughtWeight = (baseTotal * clamped) / (1 - clamped);
  const segs: WheelSegment[] = base.map((b) => ({
    type: b.type,
    weight: b.w,
    color: OUTCOME_COLOR[b.type],
    label: OUTCOME_LABEL[b.type],
  }));
  // insert caught slice roughly in the middle-right for visual balance
  segs.splice(4, 0, {
    type: "caught",
    weight: caughtWeight,
    color: OUTCOME_COLOR.caught,
    label: OUTCOME_LABEL.caught,
  });
  return segs;
}

// Net cash returned for an outcome, given the operation and profit multiplier.
export function outcomePayout(
  op: Operation,
  outcome: Outcome,
  profitMult: number
): number {
  const p = op.payout * profitMult;
  switch (outcome) {
    case "safe":
      return op.cost; // investment recovered, break even
    case "success":
      return Math.round(p);
    case "bigSuccess":
      return Math.round(p * 1.8);
    case "bonus":
      return Math.round(p * 1.3);
    case "investigation":
      return Math.round(op.cost * 0.5); // partial recovery, suspense
    case "caught":
      return 0;
  }
}
