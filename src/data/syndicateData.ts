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
export const RISK_CAUGHT: Record<RiskLevel, number> = {
  low: 0.05,
  medium: 0.15,
  high: 0.3,
  veryhigh: 0.45,
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
    payout: 9000,
    risk: "low",
  },
  {
    id: "identity",
    name: "Identity Fraud",
    description: "Stitch together stolen personas and cash out quietly.",
    cost: 8000,
    payout: 18000,
    risk: "low",
  },
  {
    id: "skimmer",
    name: "Ghost Skimmer",
    description: "Plant invisible taps on payment terminals across the city.",
    cost: 12000,
    payout: 26000,
    risk: "low",
  },
  {
    id: "romance",
    name: "Velvet Con",
    description: "A long game of charm, patience, and emptied wallets.",
    cost: 15000,
    payout: 40000,
    risk: "medium",
  },
  {
    id: "luxury",
    name: "Luxury Scam",
    description: "Sell counterfeit dreams to buyers who never ask twice.",
    cost: 25000,
    payout: 60000,
    risk: "medium",
  },
  {
    id: "ransom",
    name: "Locked Vault",
    description: "Freeze a corporation's files and name your price.",
    cost: 30000,
    payout: 78000,
    risk: "medium",
  },
  {
    id: "crypto",
    name: "Rug Pull Royale",
    description: "Launch a shiny token, hype it, then vanish overnight.",
    cost: 35000,
    payout: 95000,
    risk: "high",
  },
  {
    id: "market",
    name: "Dark Marketplace",
    description: "Run a hidden bazaar and pocket a cut of every trade.",
    cost: 40000,
    payout: 110000,
    risk: "high",
  },
  {
    id: "insider",
    name: "Inside Job",
    description: "Bribe a mole for secrets the whole market will pay for.",
    cost: 50000,
    payout: 135000,
    risk: "high",
  },
  {
    id: "heist",
    name: "Vault Heist",
    description: "One night, one big score, zero room for mistakes.",
    cost: 65000,
    payout: 185000,
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
    payout: 320000,
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
  color: string;
  avatar: string; // emoji-style glyph
}

export const AI_PROFILES: AiProfile[] = [
  {
    id: "ai-vex",
    name: "Vex",
    personality: "conservative",
    blurb: "Plays it safe. Small, steady scores.",
    color: "#38bdf8",
    avatar: "🦊",
  },
  {
    id: "ai-nyx",
    name: "Nyx",
    personality: "risktaker",
    blurb: "Loves the edge. High risk, high reward.",
    color: "#f472b6",
    avatar: "🐍",
  },
  {
    id: "ai-mammon",
    name: "Mammon",
    personality: "greedy",
    blurb: "Always chases the biggest payout.",
    color: "#f5b800",
    avatar: "🐲",
  },
  {
    id: "ai-echo",
    name: "Echo",
    personality: "adaptive",
    blurb: "Reads the board and adjusts to survive.",
    color: "#a78bfa",
    avatar: "🦉",
  },
  {
    id: "ai-glitch",
    name: "Glitch",
    personality: "chaotic",
    blurb: "Utterly unpredictable. Anything goes.",
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
];

export const START_CASH = 100000;
export const TOTAL_ROUNDS = 10;
export const START_TOKENS = 3;

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
