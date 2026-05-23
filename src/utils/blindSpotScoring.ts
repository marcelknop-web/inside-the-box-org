// Blind Spot — per-phase scoring. Pure functions, no React.

export type Stance = "YES" | "NO" | "CONDITIONAL";

export interface PhaseScoreInput {
  phaseIndex: 1 | 2 | 3 | 4;
  isUserIC: boolean;
  /** IC's final committed stance for this phase. */
  finalStance: Stance;
  /** User's stance: their own decision if IC, or their recommendation if non-IC. */
  userStance: Stance | null;
  /** User's reasoning text (IC) or recommendation rationale (non-IC). */
  userReasoning: string;
  /** Seconds remaining on the 180s countdown when the player committed. */
  remainingSecs: number;
  /** Total countdown length. */
  totalSecs: number;
  /** Number of user chat messages sent during this phase. */
  chatMessages: number;
  /** Whether the phase carried a NIS-2 flag. */
  hasNis2Flag: boolean;
  /** Whether the user used the pushback action against the AI IC. */
  pushbackUsed: boolean;
}

export interface PhaseScoreBreakdown {
  phaseIndex: 1 | 2 | 3 | 4;
  decisionPts: number;
  speedPts: number;
  reasoningPts: number;
  chatPts: number;
  compliancePts: number;
  pushbackPts: number;
  total: number;
  optimal: Stance;
  hit: "perfect" | "partial" | "miss";
}

/** Textbook optimal stance per phase. */
export const OPTIMAL_STANCE: Record<1 | 2 | 3 | 4, Stance> = {
  1: "YES",          // Terminate vendor VPN session
  2: "YES",          // Isolate OT Sim Network
  3: "YES",          // Notify NSM, reject attacker
  4: "CONDITIONAL",  // Restart only validated zones, gated
};

const MAX_SPEED = 50;
const PERFECT = 100;
const PARTIAL = 60;
const MISS = 20;

export function scorePhase(input: PhaseScoreInput): PhaseScoreBreakdown {
  const optimal = OPTIMAL_STANCE[input.phaseIndex];
  const stance = input.userStance;

  // Decision points: perfect match → 100, "CONDITIONAL" is always at least partial.
  let decisionPts = MISS;
  let hit: "perfect" | "partial" | "miss" = "miss";
  if (stance === optimal) {
    decisionPts = PERFECT;
    hit = "perfect";
  } else if (stance === "CONDITIONAL") {
    decisionPts = PARTIAL;
    hit = "partial";
  } else if (optimal === "CONDITIONAL" && (stance === "YES" || stance === "NO")) {
    decisionPts = PARTIAL;
    hit = "partial";
  }

  // Speed bonus (only meaningful when user committed within timer).
  const ratio = Math.max(0, Math.min(1, input.remainingSecs / input.totalSecs));
  const speedPts = Math.round(ratio * MAX_SPEED);

  // Reasoning quality (length-based proxy).
  const len = (input.userReasoning || "").trim().length;
  const reasoningPts = len >= 80 ? 20 : len >= 20 ? 10 : 0;

  // Chat engagement.
  const chatPts = input.chatMessages >= 2 ? 15 : input.chatMessages >= 1 ? 5 : 0;

  // NIS-2 compliance: only credit when the user did NOT block notification/isolation.
  const compliancePts =
    input.hasNis2Flag && input.finalStance !== "NO" ? 25 : 0;

  // Pushback: rewarded for engagement (non-IC only).
  const pushbackPts = !input.isUserIC && input.pushbackUsed ? 15 : 0;

  const total =
    decisionPts + speedPts + reasoningPts + chatPts + compliancePts + pushbackPts;

  return {
    phaseIndex: input.phaseIndex,
    decisionPts,
    speedPts,
    reasoningPts,
    chatPts,
    compliancePts,
    pushbackPts,
    total,
    optimal,
    hit,
  };
}

export function totalScore(breakdowns: PhaseScoreBreakdown[]): number {
  return breakdowns.reduce((s, b) => s + b.total, 0);
}

export function rating(score: number): { label: string; color: string } {
  if (score >= 540) return { label: "EXEMPLARY", color: "#22c55e" };
  if (score >= 420) return { label: "STRONG", color: "#84cc16" };
  if (score >= 300) return { label: "ADEQUATE", color: "#f5b800" };
  if (score >= 180) return { label: "MARGINAL", color: "#F5A623" };
  return { label: "BELOW STANDARD", color: "#ef4444" };
}
