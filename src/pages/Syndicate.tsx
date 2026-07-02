import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, Skull, Shield, Crown, TrendingUp, Flame, Trophy, BarChart3, Calendar, Hash, Award, Copy, Check, X, Fish, VenetianMask, CreditCard, Wine, Gem, Lock, Rocket, ShoppingCart, Building2, Landmark, Dice5, Eye, Coins, Maximize2, Minimize2, HelpCircle } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import {
  OPERATIONS,
  AI_PROFILES,
  GLOBAL_EVENTS,
  RISK_CAUGHT,
  RISK_LABEL,
  AI_ABILITY,
  AI_DECIDE,
  RISK_INDEX,
  START_CASH,
  TOTAL_ROUNDS,
  START_TOKENS,
  buildWheel,
  outcomePayout,
  heatForRound,
  OUTCOME_LABEL,
  type Operation,
  type RiskLevel,
  type Outcome,
  type GlobalEvent,
  type AiProfile,
  type WheelSegment,
  quipFor,
} from "@/data/syndicateData";
import { syndicateSounds as snd } from "@/lib/syndicateSounds";
import {
  rand,
  setSeed,
  clearSeed,
  isSeeded,
  hashSeed,
  dailySeedString,
  makeSeedCode,
  normalizeSeedCode,
} from "@/lib/syndicateRng";
import {
  loadStats,
  recordGame,
  mostUsedOp,
  evaluateAchievements,
  loadUnlocked,
  ACHIEVEMENTS,
  type SyndicateStats,
  type GameSummary,
  type Achievement,
} from "@/lib/syndicateProgress";

/* ------------------------------------------------------------------ */
/*  Operation visual language — icon + accent per operation.          */
/*  Cards are read at a glance: icon, risk color, numbers. No prose.  */
/* ------------------------------------------------------------------ */

const OP_ICON: Record<string, typeof Fish> = {
  phish: Fish,
  identity: VenetianMask,
  skimmer: CreditCard,
  romance: Wine,
  luxury: Gem,
  ransom: Lock,
  crypto: Rocket,
  market: ShoppingCart,
  insider: Building2,
  heist: Landmark,
  laundry: Dice5,
  syndicate: Crown,
};

// Neon accents by risk tier (green→yellow→red→purple), matching the game's HUD.
const RISK_THEME: Record<RiskLevel, { glow: string; text: string; grad: string }> = {
  low: { glow: "#22c55e", text: "#5eead4", grad: "from-emerald-500/20 via-cyan-500/5 to-transparent" },
  medium: { glow: "#f5b800", text: "#fbbf24", grad: "from-amber-500/20 via-orange-500/5 to-transparent" },
  high: { glow: "#f97316", text: "#fb7185", grad: "from-red-500/20 via-rose-500/5 to-transparent" },
  veryhigh: { glow: "#a855f7", text: "#e879f9", grad: "from-fuchsia-500/25 via-purple-500/5 to-transparent" },
};

/* ------------------------------------------------------------------ */
/*  Guided tutorial — pop-up coach marks shown on a player's first run */
/* ------------------------------------------------------------------ */

const TUTORIAL_KEY = "syndicate_tutorial_done_v1";

interface Tip {
  key: string;
  icon: typeof Skull;
  title: string;
  body: string;
}

const TIPS: Record<string, Tip> = {
  intro: {
    key: "intro",
    icon: Crown,
    title: "Welcome, boss",
    body: "Outlast 5 rival crews across up to 12 rounds. Each round you run one operation for cash — the richest crew still standing at the end wins. I'll walk you through the first moves.",
  },
  choose: {
    key: "choose",
    icon: Coins,
    title: "Pick an operation",
    body: "Every card shows its COST (what you pay), PAYOUT (what you can earn) and CAUGHT % (odds of getting busted). The colored badge is the risk tier — green is safe, purple is a gamble. Tap a card to select it.",
  },
  wheel: {
    key: "wheel",
    icon: Dice5,
    title: "Spin the wheel",
    body: "The wheel decides your fate. Most slices pay out — but land on a Caught slice and you burn a token. Lose all your tokens and you're eliminated. Hit SPIN when you're ready.",
  },
  outcome: {
    key: "outcome",
    icon: TrendingUp,
    title: "Your result",
    body: "This is how the operation played out and how your fortune changed. High-risk jobs swing hard both ways — manage your tokens and don't overreach.",
  },
  scoreboard: {
    key: "scoreboard",
    icon: BarChart3,
    title: "The standings",
    body: "See where you rank against the rival crews after each round. Stay alive and keep your fortune on top. That's the whole game — good luck, boss.",
  },
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  color: string;
  profile?: AiProfile;
  cash: number;
  tokens: number;
  alive: boolean;
  roundsSurvived: number;
  opsCompleted: number;
  biggestWin: number; // highest single net profit
  biggestGamble: number; // highest single investment
  caughtHits: number; // tokens burned
  goodOutcomes: number;
  totalOutcomes: number;
  closestCall: number; // smallest degrees to a Caught slice while surviving
  cashAtElimination: number | null;
  usedOps: Record<string, number>;
  ranHighRisk: boolean;
  lastLabel?: string;
  lastDelta?: number;
  quip?: string;
}

type Phase =
  | "welcome"
  | "round-intro"
  | "choose"
  | "spinning"
  | "outcome"
  | "ai"
  | "scoreboard"
  | "winner";

interface SpinResult {
  outcome: Outcome;
  landing: number; // final angle at pointer (0..360)
  margin: number; // degrees to nearest Caught edge (0 if caught)
  delta: number; // net cash change
  eliminated: boolean;
  tokenLost: boolean;
}

const CX = 160;
const CY = 160;
const R = 150;

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

interface AngledSegment extends WheelSegment {
  start: number; // deg from top, clockwise
  end: number;
  mid: number;
}

function angleSegments(segs: WheelSegment[]): AngledSegment[] {
  const total = segs.reduce((s, x) => s + x.weight, 0);
  let acc = 0;
  return segs.map((s) => {
    const start = (acc / total) * 360;
    acc += s.weight;
    const end = (acc / total) * 360;
    return { ...s, start, end, mid: (start + end) / 2 };
  });
}

function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function arcPath(start: number, end: number): string {
  const a = polar(start, R);
  const b = polar(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function outcomeAtAngle(segs: AngledSegment[], angle: number): AngledSegment {
  const a = ((angle % 360) + 360) % 360;
  return segs.find((s) => a >= s.start && a < s.end) ?? segs[segs.length - 1];
}

function marginToCaught(segs: AngledSegment[], angle: number): number {
  const a = ((angle % 360) + 360) % 360;
  let best = 360;
  for (const s of segs) {
    if (s.type !== "caught") continue;
    if (a >= s.start && a < s.end) return 0;
    const d1 = Math.min(Math.abs(a - s.start), 360 - Math.abs(a - s.start));
    const d2 = Math.min(Math.abs(a - s.end), 360 - Math.abs(a - s.end));
    best = Math.min(best, d1, d2);
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Risk math                                                          */
/* ------------------------------------------------------------------ */

function effectiveCaught(
  op: Operation,
  round: number,
  event: GlobalEvent | null,
  abilityAdj: number
): number {
  const riskMult = event ? event.riskMult : 1;
  const frac =
    RISK_CAUGHT[op.risk] * riskMult + heatForRound(round) + abilityAdj;
  return Math.min(0.72, Math.max(0.02, frac));
}

function fmt(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
}

// Compact money for tight card stat rows: $4k, $138k, $1.2M.
function fmtShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return "$" + (n / 1_000_000).toFixed(a % 1_000_000 === 0 ? 0 : 1) + "M";
  if (a >= 1_000) return "$" + Math.round(n / 1000) + "k";
  return "$" + Math.round(n);
}


/* ------------------------------------------------------------------ */
/*  Count-up money display                                             */
/* ------------------------------------------------------------------ */

function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>();
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);
  return display;
}

function MoneyCounter({ value }: { value: number }) {
  const d = useCountUp(value);
  return <span className="tabular-nums">{fmt(d)}</span>;
}

/* ------------------------------------------------------------------ */
/*  AI decision + resolution                                           */
/* ------------------------------------------------------------------ */

function affordableOps(cash: number): Operation[] {
  return OPERATIONS.filter((o) => o.cost <= cash);
}

function chooseAiOp(p: Player, leaderboardRankFrac: number): Operation | null {
  const opts = affordableOps(p.cash);
  if (!opts.length) return null;
  const pers = p.profile?.personality;
  const D = AI_DECIDE;
  const maxPay = Math.max(...opts.map((o) => o.payout));
  const weights = opts.map((o) => {
    const ri = RISK_INDEX[o.risk];
    const payN = o.payout / maxPay;
    let w: number;
    switch (pers) {
      case "conservative":
        w = Math.exp(-ri * D.consK);
        break;
      case "risktaker":
        w = Math.exp(-(3 - ri) * D.riskK);
        break;
      case "greedy":
        w = Math.pow(payN + 0.05, 3 * D.greedK);
        break;
      case "adaptive": {
        const target = leaderboardRankFrac > 0.5 ? 3 : 0;
        w = Math.exp(-Math.abs(ri - target) * D.adaptK);
        break;
      }
      case "chaotic":
      default:
        w = Math.pow(payN + 0.2, D.chaosPay);
        break;
    }
    w *= Math.pow(payN + 0.1, D.payBias);
    return Math.pow(w, 1 / D.temp);
  });
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rand() * total;
  for (let i = 0; i < opts.length; i++) {
    if (r < weights[i]) return opts[i];
    r -= weights[i];
  }
  return opts[opts.length - 1];
}

function resolveSpin(
  op: Operation,
  round: number,
  event: GlobalEvent | null,
  player: Player,
  fixedLanding?: number
): SpinResult {
  const abilityAdj =
    player.profile?.personality === "conservative"
      ? AI_ABILITY.conservativeCaughtAdj
      : 0;
  const caught = effectiveCaught(op, round, event, abilityAdj);
  const segs = angleSegments(buildWheel(caught));
  const landing =
    fixedLanding !== undefined ? fixedLanding : rand() * 360;
  const seg = outcomeAtAngle(segs, landing);
  const outcome = seg.type;
  const margin = marginToCaught(segs, landing);
  const profitMult = event ? event.profitMult : 1;
  let payout = outcomePayout(op, outcome, profitMult);

  // AI special abilities (statistical flavor)
  if (payout > op.cost) {
    const isHighRisk = op.risk === "high" || op.risk === "veryhigh";
    if (player.profile?.personality === "risktaker" && isHighRisk)
      payout = Math.round(payout * AI_ABILITY.risktakerPayout);
    if (player.profile?.personality === "greedy" && isHighRisk)
      payout = Math.round(payout * AI_ABILITY.greedyPayout);
    if (
      player.profile?.personality === "chaotic" &&
      rand() < AI_ABILITY.chaoticDoubleChance
    )
      payout = Math.round(payout * 2);
  }

  const tokenLost = outcome === "caught";
  const eliminated = tokenLost && player.tokens - 1 <= 0;
  return { outcome, landing, margin, delta: payout, eliminated, tokenLost };
}

/* ------------------------------------------------------------------ */
/*  Wheel component                                                    */
/* ------------------------------------------------------------------ */

function Wheel({
  segments,
  rotation,
  spinning,
}: {
  segments: AngledSegment[];
  rotation: number;
  spinning: boolean;
}) {
  return (
    <div className="relative mx-auto" style={{ width: 320, height: 340 }}>
      {/* pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20"
        style={{ top: -2 }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "14px solid transparent",
            borderRight: "14px solid transparent",
            borderTop: "26px solid #f5b800",
            filter: "drop-shadow(0 0 6px rgba(245,184,0,0.8))",
          }}
        />
      </div>
      <svg
        width={320}
        height={320}
        viewBox="0 0 320 320"
        style={{ marginTop: 18 }}
      >
        <circle
          cx={CX}
          cy={CY}
          r={R + 6}
          fill="none"
          stroke="rgba(0,188,212,0.35)"
          strokeWidth={4}
        />
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: spinning
              ? "transform 4.2s cubic-bezier(0.15,0.9,0.2,1)"
              : "none",
          }}
        >
          {segments.map((s, i) => (
            <g key={i}>
              <path
                d={arcPath(s.start, s.end)}
                fill={s.color}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={1.5}
                opacity={s.type === "safe" ? 0.85 : 1}
              />
              {s.end - s.start > 12 && (
                <text
                  x={polar(s.mid, R * 0.68).x}
                  y={polar(s.mid, R * 0.68).y}
                  fill="#fff"
                  fontSize={s.end - s.start > 26 ? 11 : 8}
                  fontWeight={700}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${s.mid}, ${polar(s.mid, R * 0.68).x}, ${
                    polar(s.mid, R * 0.68).y
                  })`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
                >
                  {s.label}
                </text>
              )}
            </g>
          ))}
        </g>
        <circle cx={CX} cy={CY} r={26} fill="#0b1220" stroke="#f5b800" strokeWidth={2} />
        <text
          x={CX}
          y={CY}
          fill="#f5b800"
          fontSize={20}
          fontWeight={800}
          textAnchor="middle"
          dominantBaseline="central"
        >
          $
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main game                                                          */
/* ------------------------------------------------------------------ */

interface SyndicateProps {
  embedded?: boolean;
}

export default function Syndicate({ embedded = false }: SyndicateProps) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [name, setName] = useState("");
  const [muted, setMuted] = useState(false);
  const [round, setRound] = useState(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [event, setEvent] = useState<GlobalEvent | null>(null);
  const [selectedOp, setSelectedOp] = useState<Operation | null>(null);
  const [segments, setSegments] = useState<AngledSegment[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [closeCall, setCloseCall] = useState<string | null>(null);
  const [aiLog, setAiLog] = useState<Player[]>([]);
  const rotationRef = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen support (works on desktop + Android; iOS Safari falls back to CSS full-viewport).
  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    const doc = document as Document & { webkitFullscreenElement?: Element };
    const anyEl = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      (anyEl.requestFullscreen?.() ?? anyEl.webkitRequestFullscreen?.())?.catch(() => setIsFullscreen(true));
    } else {
      const anyDoc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
      anyDoc.exitFullscreen?.() ?? anyDoc.webkitExitFullscreen?.();
    }
    // Optimistic toggle for browsers without the Fullscreen API (e.g. iOS Safari).
    if (typeof anyEl.requestFullscreen !== "function" && typeof anyEl.webkitRequestFullscreen !== "function") {
      setIsFullscreen((v) => !v);
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Progression + game modes
  const [gameMode, setGameMode] = useState<"normal" | "daily" | "seeded">("normal");
  const [seedInput, setSeedInput] = useState("");
  const [activeSeed, setActiveSeed] = useState<string | null>(null);
  const [stats, setStats] = useState<SyndicateStats>(() => loadStats());
  const [unlockedIds, setUnlockedIds] = useState<Record<string, number>>(() => loadUnlocked());
  const [freshAch, setFreshAch] = useState<Achievement[]>([]);
  const [overlay, setOverlay] = useState<null | "stats" | "achievements">(null);
  const [copied, setCopied] = useState(false);
  const recordedRef = useRef(false);

  /* ---- Guided tutorial (pop-up coach marks, first run only) ---- */
  const [tutorialDone, setTutorialDone] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(TUTORIAL_KEY) === "1",
  );
  const [activeTip, setActiveTip] = useState<Tip | null>(null);
  const shownTipsRef = useRef<Set<string>>(new Set());

  const showTip = useCallback(
    (key: string) => {
      if (tutorialDone || shownTipsRef.current.has(key)) return;
      const tip = TIPS[key];
      if (!tip) return;
      shownTipsRef.current.add(key);
      setActiveTip(tip);
    },
    [tutorialDone],
  );

  const dismissTip = useCallback(() => setActiveTip(null), []);
  const skipTutorial = useCallback(() => {
    setTutorialDone(true);
    if (typeof window !== "undefined") localStorage.setItem(TUTORIAL_KEY, "1");
    setActiveTip(null);
  }, []);

  /* ---- Persistent beginner coach (always-on guidance bar) ---- */
  const [coachOn, setCoachOn] = useState(
    () => typeof window === "undefined" || localStorage.getItem("syndicate_coach_v1") !== "0",
  );
  const toggleCoach = useCallback(() => {
    setCoachOn((v) => {
      const next = !v;
      if (typeof window !== "undefined") localStorage.setItem("syndicate_coach_v1", next ? "1" : "0");
      return next;
    });
  }, []);


  useEffect(() => {
    snd.setEnabled(!muted);
  }, [muted]);

  useEffect(() => {
    return () => snd.stopMusic();
  }, []);

  const human = players.find((p) => p.isHuman) ?? null;

  // First-run welcome pop-up only; step-by-step in-game guidance is handled by
  // the always-on coach bar so beginners are guided through every decision.
  useEffect(() => {
    if (tutorialDone) return;
    if (phase === "welcome") showTip("intro");
  }, [phase, tutorialDone, showTip]);



  /* ---- start game ---- */
  const startGame = useCallback(() => {
    snd.unlock();
    snd.startMusic();
    // Configure RNG per game mode.
    let seedLabel: string | null = null;
    if (gameMode === "daily") {
      seedLabel = dailySeedString();
      setSeed(hashSeed(seedLabel));
    } else if (gameMode === "seeded") {
      const code = normalizeSeedCode(seedInput) || makeSeedCode();
      seedLabel = code;
      setSeed(hashSeed(code));
    } else {
      clearSeed();
    }
    setActiveSeed(seedLabel);
    recordedRef.current = false;
    setFreshAch([]);
    const nm = name.trim() || "You";
    const you: Player = {
      id: "human",
      name: nm,
      isHuman: true,
      avatar: "🎭",
      color: "#f5b800",
      cash: START_CASH,
      tokens: START_TOKENS,
      alive: true,
      roundsSurvived: 0,
      opsCompleted: 0,
      biggestWin: 0,
      biggestGamble: 0,
      caughtHits: 0,
      goodOutcomes: 0,
      totalOutcomes: 0,
      closestCall: 360,
      cashAtElimination: null,
      usedOps: {},
      ranHighRisk: false,
    };
    const ais: Player[] = AI_PROFILES.map((pr) => ({
      id: pr.id,
      name: pr.name,
      isHuman: false,
      avatar: pr.avatar,
      color: pr.color,
      profile: pr,
      cash: START_CASH,
      tokens: START_TOKENS,
      alive: true,
      roundsSurvived: 0,
      opsCompleted: 0,
      biggestWin: 0,
      biggestGamble: 0,
      caughtHits: 0,
      goodOutcomes: 0,
      totalOutcomes: 0,
      closestCall: 360,
      cashAtElimination: null,
      usedOps: {},
      ranHighRisk: false,
    }));
    setPlayers([you, ...ais]);
    setRound(1);
    beginRound(1);
  }, [name, gameMode, seedInput]);

  /* ---- begin a round: maybe roll an event ---- */
  const beginRound = useCallback((r: number) => {
    snd.transition();
    // event every 2-3 rounds
    const hasEvent = r === 1 ? false : (r % 2 === 0 || rand() < 0.4);
    setEvent(
      hasEvent
        ? GLOBAL_EVENTS[Math.floor(rand() * GLOBAL_EVENTS.length)]
        : null
    );
    setSelectedOp(null);
    setResult(null);
    setCloseCall(null);
    setAiLog([]);
    setPhase("round-intro");
  }, []);

  /* ---- choose op + spin ---- */
  const pickOp = useCallback(
    (op: Operation) => {
      if (!human) return;
      snd.select();
      setSelectedOp(op);
      const caught = effectiveCaught(op, round, event, 0);
      const segs = angleSegments(buildWheel(caught));
      setSegments(segs);
      setRotation(0);
      rotationRef.current = 0;
      setPhase("choose");
    },
    [human, round, event]
  );

  const spin = useCallback(() => {
    if (!human || !selectedOp) return;
    setPhase("spinning");
    setSpinning(true);
    // predetermine landing
    const landing = rand() * 360;
    const res = resolveSpin(selectedOp, round, event, human, landing);
    setResult(res);
    // rotate so that `landing` sits under the top pointer
    const base = rotationRef.current;
    const currentMod = ((base % 360) + 360) % 360;
    const target = base + (360 - currentMod) + (360 * 5) + (360 - landing);
    rotationRef.current = target;
    setRotation(target);

    // ticking sound during spin
    let ticks = 0;
    const tickInt = setInterval(() => {
      snd.tick();
      ticks++;
      if (ticks > 26) clearInterval(tickInt);
    }, 130);

    window.setTimeout(() => {
      clearInterval(tickInt);
      setSpinning(false);
      finishHumanSpin(selectedOp, res);
    }, 4300);
  }, [human, selectedOp, round, event]);

  const finishHumanSpin = useCallback(
    (op: Operation, res: SpinResult) => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (!p.isHuman) return p;
          return applyResult(p, op, res);
        })
      );
      // close-call flavor
      if (res.outcome !== "caught" && res.margin < 14) {
        setCloseCall(
          res.margin < 7 ? "That was close…" : "Lucky escape!"
        );
      }
      if (res.outcome === "caught") {
        res.eliminated ? snd.caught() : snd.lose();
      } else if (res.outcome === "bigSuccess") {
        snd.bigWin();
      } else if (res.delta > op.cost) {
        snd.win();
      }
      setPhase("outcome");
    },
    []
  );

  /* ---- AI turns ---- */
  const runAiTurns = useCallback(() => {
    setPhase("ai");
    setPlayers((prev) => {
      const alive = prev.filter((p) => p.alive);
      const sorted = [...alive].sort((a, b) => b.cash - a.cash);
      const rankFrac = (p: Player) => {
        const idx = sorted.findIndex((x) => x.id === p.id);
        return sorted.length > 1 ? idx / (sorted.length - 1) : 0;
      };
      const log: Player[] = [];
      const next = prev.map((p) => {
        if (p.isHuman || !p.alive) return p;
        const op = chooseAiOp(p, rankFrac(p));
        if (!op) {
          return p;
        }
        const res = resolveSpin(op, round, event, p);
        const updated = applyResult(p, op, res);
        if (p.profile) updated.quip = quipFor(p.profile.personality, rand);
        log.push(updated);
        return updated;
      });
      setAiLog(log);
      return next;
    });
    window.setTimeout(() => finishRound(), 2200);
  }, [round, event]);

  /* ---- end of round bookkeeping ---- */
  const finishRound = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => (p.alive ? { ...p, roundsSurvived: round } : p))
    );
    setPhase("scoreboard");
  }, [round]);

  const nextRound = useCallback(() => {
    const aliveCount = players.filter((p) => p.alive).length;
    if (aliveCount <= 1 || round >= TOTAL_ROUNDS) {
      snd.stopMusic();
      setPhase("winner");
      return;
    }
    const r = round + 1;
    setRound(r);
    beginRound(r);
  }, [players, round, beginRound]);

  /* ---- helpers ---- */
  function applyResult(p: Player, op: Operation, res: SpinResult): Player {
    const good = res.outcome === "success" || res.outcome === "bigSuccess" || res.outcome === "bonus";
    const netProfit = res.delta - op.cost;
    let tokens = p.tokens;
    let alive = p.alive;
    let cashAtElimination = p.cashAtElimination;
    let cash = p.cash - op.cost + res.delta;
    if (res.tokenLost) {
      tokens = Math.max(0, p.tokens - 1);
      if (tokens <= 0) {
        alive = false;
        cashAtElimination = cash;
      }
    }
    return {
      ...p,
      cash,
      tokens,
      alive,
      cashAtElimination,
      opsCompleted: p.opsCompleted + 1,
      usedOps: { ...p.usedOps, [op.id]: (p.usedOps[op.id] ?? 0) + 1 },
      ranHighRisk: p.ranHighRisk || op.risk === "high" || op.risk === "veryhigh",
      biggestWin: Math.max(p.biggestWin, netProfit),
      biggestGamble: Math.max(p.biggestGamble, op.cost),
      caughtHits: p.caughtHits + (res.tokenLost ? 1 : 0),
      goodOutcomes: p.goodOutcomes + (good ? 1 : 0),
      totalOutcomes: p.totalOutcomes + 1,
      closestCall: res.outcome === "caught" ? p.closestCall : Math.min(p.closestCall, res.margin),
      lastLabel: OUTCOME_LABEL[res.outcome],
      lastDelta: netProfit,
    };
  }

  /* ---- derived ---- */
  const ranked = useMemo(
    () =>
      [...players].sort((a, b) => {
        if (a.alive !== b.alive) return a.alive ? -1 : 1;
        return b.cash - a.cash;
      }),
    [players]
  );

  const heatPct = Math.round(heatForRound(round) * 100);

  /* ---- record stats + achievements once, when the game ends ---- */
  useEffect(() => {
    if (phase !== "winner" || recordedRef.current) return;
    const me = players.find((p) => p.isHuman);
    if (!me) return;
    recordedRef.current = true;
    const alive = players.filter((p) => p.alive);
    const champion = (alive.length ? alive : players).sort((a, b) => b.cash - a.cash)[0];
    const won = champion?.isHuman ?? false;
    const rivalsDown = players.filter((p) => !p.isHuman && !p.alive).length;
    const summary: GameSummary = {
      won,
      finalCash: me.cash,
      roundsSurvived: me.roundsSurvived,
      closestCall: me.closestCall,
      opsCompleted: me.opsCompleted,
      biggestWin: me.biggestWin,
      caughtHits: me.caughtHits,
      goodOutcomes: me.goodOutcomes,
      totalOutcomes: me.totalOutcomes,
      eliminationsSurvived: me.alive ? rivalsDown : 0,
      neverCaught: me.caughtHits === 0,
      roundsToWin: won ? me.roundsSurvived : null,
      usedOps: me.usedOps,
      seeded: isSeeded(),
    };
    const after = recordGame(summary);
    setStats(after);
    const fresh = evaluateAchievements(summary, after, { ranHighRisk: me.ranHighRisk });
    setFreshAch(fresh);
    setUnlockedIds(loadUnlocked());
  }, [phase, players]);

  /* ---- overlays: statistics / achievements ---- */
  const winRate = stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const unlockedCount = Object.keys(unlockedIds).length;
  const statRows: [string, string][] = [
    ["Games played", String(stats.gamesPlayed)],
    ["Games won", String(stats.gamesWon)],
    ["Win rate", `${winRate}%`],
    ["Highest fortune", fmt(stats.highestFortune)],
    ["Largest single payout", fmt(stats.largestPayout)],
    ["Longest survival", `${stats.longestSurvival} rounds`],
    ["Closest escape", stats.closestEscape < 360 ? `${stats.closestEscape.toFixed(1)}°` : "—"],
    ["Most-used operation", mostUsedOp(stats)?.name ?? "—"],
  ];
  const recordRows: [string, string][] = [
    ["Highest Fortune Ever", fmt(stats.highestFortune)],
    ["Longest Win Streak", String(stats.longestWinStreak)],
    ["Luckiest Run", stats.closestEscape < 360 ? `${stats.closestEscape.toFixed(1)}° escape` : "—"],
    ["Biggest Single Win", fmt(stats.largestPayout)],
    ["Fastest Victory", stats.fastestVictory ? `${stats.fastestVictory} rounds` : "—"],
    ["Most Eliminations Survived", String(stats.mostEliminationsSurvived)],
  ];
  const tipNode = activeTip && (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-cyan-400/40 bg-[#0a0e14] p-5 text-left animate-scale-in"
        style={{ boxShadow: "0 0 40px -8px rgba(0,188,212,0.5)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(0,188,212,0.3), transparent 70%)" }}
          >
            <activeTip.icon size={22} style={{ color: "#00bcd4" }} />
          </span>
          <h3 className="font-mono font-black tracking-wide text-white text-base">{activeTip.title}</h3>
        </div>
        <p className="text-white/70 text-sm leading-relaxed mb-5">{activeTip.body}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={dismissTip}
            className="flex-1 rounded-lg py-2.5 font-mono font-bold text-sm text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)" }}
          >
            Got it
          </button>
          <button
            onClick={skipTutorial}
            className="rounded-lg px-3 py-2.5 text-xs font-mono text-white/50 hover:text-white/80 transition"
          >
            Skip guide
          </button>
        </div>
      </div>
    </div>
  );

  const overlayNode = overlay && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => setOverlay(null)}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-cyan-400/30 bg-[#0a0e14] p-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono font-bold text-lg text-cyan-300">
            {overlay === "stats" ? "STATISTICS" : `ACHIEVEMENTS · ${unlockedCount}/${ACHIEVEMENTS.length}`}
          </h3>
          <button onClick={() => setOverlay(null)} className="text-white/50 hover:text-white text-xl leading-none">×</button>
        </div>

        {overlay === "stats" ? (
          <div className="space-y-1.5">
            {statRows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/5 py-1.5">
                <span className="text-white/55">{k}</span>
                <span className="font-mono text-white">{v}</span>
              </div>
            ))}
            <p className="pt-4 pb-1 text-xs font-mono uppercase tracking-widest text-amber-300/80">Hall of Fame</p>
            {recordRows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/5 py-1.5">
                <span className="text-white/55">{k}</span>
                <span className="font-mono text-amber-200">{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = !!unlockedIds[a.id];
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: got ? "rgba(94,234,212,0.35)" : "rgba(255,255,255,0.08)",
                    background: got ? "rgba(0,188,212,0.08)" : "rgba(255,255,255,0.02)",
                    opacity: got ? 1 : 0.5,
                  }}
                >
                  <span className="text-2xl">{got ? a.icon : "🔒"}</span>
                  <div>
                    <p className={`text-sm font-bold ${got ? "text-white" : "text-white/60"}`}>{a.name}</p>
                    <p className="text-xs text-white/45">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );




  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  const shell = (children: React.ReactNode) => (
    <div
      ref={shellRef}
      className={`relative w-full overflow-y-auto overflow-x-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl"}`}
      style={{
        minHeight: isFullscreen ? "100vh" : embedded ? 640 : "100vh",
        height: isFullscreen ? "100vh" : undefined,
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(0,188,212,0.12), transparent), radial-gradient(900px 500px at 90% 110%, rgba(245,184,0,0.1), transparent), #05070d",
        color: "#e5e7eb",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,188,212,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,188,212,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="rounded-full p-2 border border-cyan-400/30 bg-black/40 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="rounded-full p-2 border border-cyan-400/30 bg-black/40 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={() => {
            const key = phase === "welcome" ? "intro" : phase === "outcome" ? "outcome" : phase === "scoreboard" ? "scoreboard" : selectedOp ? "wheel" : "choose";
            setActiveTip(TIPS[key] ?? TIPS.intro);
          }}
          aria-label="How to play"
          className="rounded-full p-2 border border-cyan-400/30 bg-black/40 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          <HelpCircle size={18} />
        </button>
      </div>
      <div className="relative z-10 px-3 py-6 sm:px-4 sm:py-8 md:px-8">{children}</div>
      {tipNode}
    </div>
  );


  /* ---- WELCOME ---- */
  if (phase === "welcome") {
    return shell(
      <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10">
        <Skull size={56} style={{ color: "#f5b800" }} className="mb-4 drop-shadow-[0_0_18px_rgba(245,184,0,0.5)]" />
        <h1
          className="text-6xl md:text-7xl font-black tracking-[0.15em] mb-3"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: "#fff",
            textShadow: "0 0 24px rgba(0,188,212,0.6)",
          }}
        >
          SYNDICATE
        </h1>
        <p className="text-cyan-300 font-mono text-sm md:text-base mb-1">Build your empire.</p>
        <p className="text-cyan-300 font-mono text-sm md:text-base mb-1">Trust nobody.</p>
        <p className="text-red-400 font-mono text-sm md:text-base mb-8">Don't get caught.</p>

        <div className="w-full max-w-xs">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startGame()}
            placeholder="Enter your alias"
            maxLength={18}
            className="w-full rounded-lg bg-black/50 border border-cyan-400/30 px-4 py-3 text-center text-white outline-none focus:border-cyan-400 mb-4"
          />

          {/* mode selector */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([
              { id: "normal", label: "Normal", icon: <Skull size={14} /> },
              { id: "daily", label: "Daily", icon: <Calendar size={14} /> },
              { id: "seeded", label: "Seeded", icon: <Hash size={14} /> },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setGameMode(m.id)}
                className="rounded-lg py-2 text-xs font-mono flex flex-col items-center gap-1 border transition"
                style={{
                  borderColor: gameMode === m.id ? "#00bcd4" : "rgba(255,255,255,0.12)",
                  background: gameMode === m.id ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.02)",
                  color: gameMode === m.id ? "#5eead4" : "rgba(255,255,255,0.6)",
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {gameMode === "daily" && (
            <p className="text-[11px] text-cyan-300/80 font-mono mb-3">
              Everyone plays the same board today · {dailySeedString().replace("DAILY-", "")}
            </p>
          )}
          {gameMode === "seeded" && (
            <input
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Enter seed code (blank = random)"
              maxLength={12}
              className="w-full rounded-lg bg-black/50 border border-cyan-400/30 px-4 py-2.5 text-center text-white text-sm font-mono outline-none focus:border-cyan-400 mb-3 uppercase"
            />
          )}

          <button
            onClick={startGame}
            className="w-full rounded-lg py-3 font-mono font-bold tracking-widest text-black transition hover:brightness-110"
            style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)", boxShadow: "0 0 24px rgba(245,184,0,0.4)" }}
          >
            START
          </button>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => { setStats(loadStats()); setOverlay("stats"); }}
              className="rounded-lg py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 border border-white/12 bg-white/[0.02] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
            >
              <BarChart3 size={14} /> Statistics
            </button>
            <button
              onClick={() => { setUnlockedIds(loadUnlocked()); setOverlay("achievements"); }}
              className="rounded-lg py-2.5 text-xs font-mono flex items-center justify-center gap-1.5 border border-white/12 bg-white/[0.02] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
            >
              <Award size={14} /> Achievements
            </button>
          </div>
        </div>
        <p className="text-white/40 text-xs mt-8 max-w-sm">
          A fictional strategy game of luck and nerve. Outlast 5 AI rivals across up to {TOTAL_ROUNDS} rounds. Richest survivor wins.
        </p>
        {overlayNode}
      </div>
    );
  }


  /* ---- HUD (shared top bar for in-game phases) ---- */
  const hud = human && (
    <div className="max-w-3xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-2 text-xs font-mono">
        <span className="text-cyan-300">ROUND {round}/{TOTAL_ROUNDS}</span>
        <span className="flex items-center gap-1 text-orange-400">
          <Flame size={13} /> HEAT +{heatPct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(round / TOTAL_ROUNDS) * 100}%`, background: "linear-gradient(90deg,#00bcd4,#f5b800)" }}
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div>
          <div className="text-2xl font-black text-white font-mono">
            <MoneyCounter value={human.cash} />
          </div>
          <div className="text-xs text-white/50">{human.name}</div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: START_TOKENS }).map((_, i) => (
            <Shield
              key={i}
              size={20}
              style={{ color: i < human.tokens ? "#00bcd4" : "rgba(255,255,255,0.15)" }}
              fill={i < human.tokens ? "#00bcd4" : "transparent"}
            />
          ))}
        </div>
      </div>
    </div>
  );

  /* ---- Beginner coach bar (persistent, step-by-step guidance) ---- */
  const COACH_TONE: Record<string, { color: string; bg: string }> = {
    info: { color: "#5eead4", bg: "rgba(0,188,212,0.10)" },
    action: { color: "#ffd34d", bg: "rgba(245,184,0,0.12)" },
    good: { color: "#86efac", bg: "rgba(34,197,94,0.12)" },
    danger: { color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  };
  const coachBar = (opts: {
    icon: typeof Skull;
    step?: string;
    text: string;
    tone?: keyof typeof COACH_TONE;
  }) => {
    if (!coachOn) return null;
    const Icon = opts.icon;
    const t = COACH_TONE[opts.tone ?? "info"];
    return (
      <div className="max-w-3xl mx-auto mb-5 animate-fade-in">
        <div
          className="relative flex items-start gap-3 rounded-2xl border px-4 py-3"
          style={{ borderColor: `${t.color}55`, background: t.bg, boxShadow: `0 0 30px -12px ${t.color}88` }}
        >
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl animate-pulse"
            style={{ background: `${t.color}22`, border: `1px solid ${t.color}66` }}
          >
            <Icon size={18} style={{ color: t.color }} />
          </span>
          <div className="min-w-0 flex-1">
            {opts.step && (
              <p className="font-mono text-[10px] tracking-[0.2em] mb-0.5" style={{ color: t.color }}>
                {opts.step} · YOUR COACH
              </p>
            )}
            <p className="text-white/85 text-sm leading-snug">{opts.text}</p>
          </div>
          <button
            onClick={toggleCoach}
            aria-label="Hide guide"
            className="shrink-0 text-white/30 hover:text-white/70 transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  };


  if (phase === "round-intro") {
    return shell(
      <div className="max-w-3xl mx-auto">
        {hud}
        <div className="text-center py-6">
          {event ? (
            <div className="rounded-xl border border-orange-400/40 bg-orange-500/10 p-6 mb-6 animate-scale-in">
              <p className="text-orange-300 font-mono text-xs mb-1">GLOBAL EVENT</p>
              <h3 className="text-2xl font-bold text-white mb-2">{event.name}</h3>
              <p className="text-white/70 text-sm">{event.description}</p>
              <div className="flex justify-center gap-4 mt-3 text-xs font-mono">
                {event.riskMult !== 1 && (
                  <span className={event.riskMult > 1 ? "text-red-400" : "text-green-400"}>
                    Detection {event.riskMult > 1 ? "▲" : "▼"} {Math.round(Math.abs(event.riskMult - 1) * 100)}%
                  </span>
                )}
                {event.profitMult !== 1 && (
                  <span className={event.profitMult > 1 ? "text-green-400" : "text-red-400"}>
                    Profit {event.profitMult > 1 ? "▲" : "▼"} {Math.round(Math.abs(event.profitMult - 1) * 100)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-white/50 mb-6">The streets are quiet… for now.</p>
          )}
          <button
            onClick={() => setPhase("choose")}
            className="rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
            style={{ background: "linear-gradient(90deg,#00bcd4,#5eead4)" }}
          >
            CHOOSE OPERATION
          </button>
        </div>
      </div>
    );
  }

  /* ---- CHOOSE ---- */
  if (phase === "choose") {
    return shell(
      <div className={selectedOp ? "max-w-3xl mx-auto" : "max-w-5xl mx-auto"}>
        {hud}
        {!selectedOp ? (
          <>
            <div className="text-center mb-4">
              <h2 className="font-mono font-black tracking-[0.2em] text-white text-lg md:text-xl">SELECT YOUR OPERATION</h2>
            </div>

            {/* Ultra-compact visual key: icon + one word, no sentences */}
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/5 px-2.5 py-1 text-amber-300">
                <Coins size={13} /> COST
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1 text-emerald-300">
                <TrendingUp size={13} /> PAYOUT
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/60">
                <Eye size={13} /> CAUGHT %
              </span>
              <span className="mx-1 h-4 w-px bg-white/10" />
              {(["low", "medium", "high", "veryhigh"] as RiskLevel[]).map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ color: RISK_THEME[r].glow, background: `${RISK_THEME[r].glow}12`, border: `1px solid ${RISK_THEME[r].glow}40` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: RISK_THEME[r].glow }} />
                  {RISK_LABEL[r]}
                </span>
              ))}
            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {OPERATIONS.map((op) => {
                const afford = human!.cash >= op.cost;
                const eff = Math.round(effectiveCaught(op, round, event, 0) * 100);
                const theme = RISK_THEME[op.risk];
                const Icon = OP_ICON[op.id] ?? Skull;
                return (
                  <button
                    key={op.id}
                    disabled={!afford}
                    onClick={() => pickOp(op)}
                    className="group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:-translate-y-1"
                    style={{
                      borderColor: `${theme.glow}55`,
                      background: "rgba(255,255,255,0.02)",
                      boxShadow: afford ? `0 0 0 1px ${theme.glow}22, 0 8px 24px -12px ${theme.glow}66` : undefined,
                    }}
                  >
                    {/* risk-tinted glow field */}
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${theme.grad} opacity-70 group-hover:opacity-100 transition`} />

                    {/* risk badge */}
                    <span
                      className="absolute top-2 right-2 z-10 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ color: theme.glow, background: `${theme.glow}22`, border: `1px solid ${theme.glow}66` }}
                    >
                      {RISK_LABEL[op.risk]}
                    </span>

                    {/* icon tile */}
                    <div className="relative z-10 flex items-center justify-center h-20 mb-2">
                      <span
                        className="flex h-16 w-16 items-center justify-center rounded-2xl border transition group-hover:scale-110"
                        style={{
                          borderColor: `${theme.glow}55`,
                          background: `radial-gradient(circle at 50% 40%, ${theme.glow}33, transparent 70%)`,
                          boxShadow: `inset 0 0 20px ${theme.glow}22`,
                        }}
                      >
                        <Icon size={30} style={{ color: theme.glow, filter: `drop-shadow(0 0 6px ${theme.glow}aa)` }} />
                      </span>
                    </div>

                    {/* title */}
                    <p className="relative z-10 font-black uppercase tracking-wide text-white text-sm leading-tight mb-2 min-h-[2.4em]">
                      {op.name}
                    </p>

                    {/* stat row */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono border-t border-white/10 pt-2">
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Coins size={11} />{fmtShort(op.cost)}
                      </span>
                      <span className="flex items-center gap-0.5" style={{ color: theme.text }}>
                        <TrendingUp size={11} />{fmtShort(op.payout)}
                      </span>
                      <span className="flex items-center gap-0.5 text-white/50">
                        <Eye size={11} />{eff}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="font-bold text-2xl text-white mb-1">{selectedOp.name}</h2>
            <p className="text-white/50 text-sm mb-4">
              Invested {fmt(selectedOp.cost)} · Caught {Math.round(effectiveCaught(selectedOp, round, event, 0) * 100)}%
            </p>
            <Wheel segments={segments} rotation={rotation} spinning={spinning} />
            <button
              onClick={spin}
              className="mt-4 rounded-lg px-10 py-3 font-mono font-bold text-black hover:brightness-110 transition"
              style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)", boxShadow: "0 0 24px rgba(245,184,0,0.4)" }}
            >
              SPIN THE WHEEL
            </button>
            <div className="mt-3">
              <button onClick={() => setSelectedOp(null)} className="text-white/40 text-xs hover:text-white/70">
                ← pick a different operation
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---- SPINNING ---- */
  if (phase === "spinning") {
    return shell(
      <div className="max-w-3xl mx-auto text-center">
        {hud}
        <h2 className="font-bold text-xl text-white mb-4">{selectedOp?.name}</h2>
        <Wheel segments={segments} rotation={rotation} spinning={spinning} />
        <p className="text-cyan-300 font-mono mt-4 animate-pulse">Spinning…</p>
      </div>
    );
  }

  /* ---- OUTCOME ---- */
  if (phase === "outcome" && result) {
    const caughtEl = result.outcome === "caught";
    const good = result.delta > (selectedOp?.cost ?? 0);
    const net = result.delta - (selectedOp?.cost ?? 0);
    return shell(
      <div className="max-w-3xl mx-auto text-center">
        {hud}
        <Wheel segments={segments} rotation={rotation} spinning={false} />
        <div className="mt-5 animate-scale-in">
          <div
            className="inline-block rounded-xl px-8 py-4 font-black text-2xl"
            style={{
              background: caughtEl ? "rgba(239,68,68,0.15)" : good ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
              border: `1px solid ${caughtEl ? "#ef4444" : good ? "#22c55e" : "#94a3b8"}`,
              color: caughtEl ? "#fca5a5" : good ? "#86efac" : "#cbd5e1",
            }}
          >
            {OUTCOME_LABEL[result.outcome]}
            {caughtEl && (result.eliminated ? " — ELIMINATED" : " — token lost!")}
          </div>
          {!caughtEl && (
            <p className={`mt-3 text-xl font-mono font-bold ${net >= 0 ? "text-green-400" : "text-red-400"}`}>
              {net >= 0 ? "+" : ""}{fmt(net)}
            </p>
          )}
          {closeCall && !caughtEl && (
            <p className="mt-2 text-orange-300 font-mono text-sm animate-pulse">⚡ {closeCall}</p>
          )}
        </div>
        <button
          onClick={runAiTurns}
          className="mt-6 rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
          style={{ background: "linear-gradient(90deg,#00bcd4,#5eead4)" }}
        >
          {human?.alive ? "RIVALS' TURN →" : "SEE THE FALLOUT →"}
        </button>
      </div>
    );
  }

  /* ---- AI TURNS ---- */
  if (phase === "ai") {
    return shell(
      <div className="max-w-3xl mx-auto">
        {hud}
        <h2 className="text-center font-mono text-cyan-300 mb-4 text-sm">RIVALS MAKE THEIR MOVES</h2>
        <div className="space-y-2">
          {aiLog.map((p, i) => (
            <div
              key={p.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 animate-fade-in"
              style={{ animationDelay: `${i * 220}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-xl">{p.avatar}</span>
                  <span className="font-bold" style={{ color: p.color }}>{p.name}</span>
                  <span className="text-white/40 text-xs">{p.lastLabel}</span>
                </span>
                <span className={`font-mono text-sm ${(p.lastDelta ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {!p.alive ? <span className="text-red-500 font-bold">CAUGHT</span> : `${(p.lastDelta ?? 0) >= 0 ? "+" : ""}${fmt(p.lastDelta ?? 0)}`}
                </span>
              </div>
              {p.quip && (
                <p className="mt-1 text-xs italic text-white/45" style={{ paddingLeft: 32 }}>
                  "{p.quip}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- SCOREBOARD ---- */
  if (phase === "scoreboard") {
    return shell(
      <div className="max-w-3xl mx-auto">
        {hud}
        <h2 className="text-center font-mono text-cyan-300 mb-4 text-sm">LEADERBOARD</h2>
        <div className="space-y-2">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{
                borderColor: p.isHuman ? "rgba(245,184,0,0.5)" : "rgba(255,255,255,0.1)",
                background: p.alive ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.08)",
                opacity: p.alive ? 1 : 0.7,
              }}
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-white/40 w-5 text-sm">{i + 1}</span>
                <span className="text-xl">{p.avatar}</span>
                <span className="font-bold" style={{ color: p.isHuman ? "#f5b800" : p.color }}>
                  {p.name}{p.isHuman && " (you)"}
                </span>
                {!p.alive && <span className="text-red-500 font-bold text-xs font-mono px-2 py-0.5 rounded bg-red-500/15">CAUGHT</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="flex gap-0.5">
                  {Array.from({ length: p.tokens }).map((_, k) => (
                    <Shield key={k} size={13} style={{ color: "#00bcd4" }} fill="#00bcd4" />
                  ))}
                </span>
                <span className="font-mono font-bold text-white">{fmt(p.cash)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={nextRound}
            className="rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
            style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)" }}
          >
            {players.filter((p) => p.alive).length <= 1 || round >= TOTAL_ROUNDS ? "SEE RESULTS →" : "NEXT ROUND →"}
          </button>
        </div>
      </div>
    );
  }

  /* ---- WINNER + FINAL STATS ---- */
  if (phase === "winner") {
    const alive = players.filter((p) => p.alive);
    const champion = (alive.length ? alive : players).sort((a, b) => b.cash - a.cash)[0];
    const superlative = (
      label: string,
      pick: (arr: Player[]) => Player | undefined,
      fmtVal: (p: Player) => string,
      pool: Player[] = players
    ) => {
      const p = pick(pool);
      if (!p) return null;
      return { label, name: p.name, avatar: p.avatar, color: p.color, val: fmtVal(p) };
    };
    const maxBy = (arr: Player[], f: (p: Player) => number) =>
      arr.length ? arr.reduce((a, b) => (f(b) > f(a) ? b : a)) : undefined;
    const minBy = (arr: Player[], f: (p: Player) => number) =>
      arr.length ? arr.reduce((a, b) => (f(b) < f(a) ? b : a)) : undefined;
    const eliminated = players.filter((p) => !p.alive);

    const stats = [
      superlative("Biggest Winner", (a) => maxBy(a, (p) => p.cash), (p) => fmt(p.cash)),
      superlative("Highest Single Profit", (a) => maxBy(a, (p) => p.biggestWin), (p) => fmt(p.biggestWin)),
      superlative("Biggest Gamble", (a) => maxBy(a, (p) => p.biggestGamble), (p) => fmt(p.biggestGamble)),
      superlative(
        "Luckiest Player",
        (a) => maxBy(a.filter((p) => p.totalOutcomes > 0), (p) => p.goodOutcomes / p.totalOutcomes),
        (p) => `${Math.round((p.goodOutcomes / Math.max(1, p.totalOutcomes)) * 100)}% wins`
      ),
      superlative("Most Wanted", (a) => maxBy(a, (p) => p.caughtHits), (p) => `${p.caughtHits} raids`),
      superlative(
        "Closest Escape",
        (a) => minBy(a.filter((p) => p.closestCall < 360), (p) => p.closestCall),
        (p) => `${Math.round(p.closestCall)}° margin`
      ),
      eliminated.length
        ? superlative(
            "Richest Eliminated",
            (a) => maxBy(a, (p) => p.cashAtElimination ?? -1),
            (p) => fmt(p.cashAtElimination ?? 0),
            eliminated
          )
        : null,
    ].filter(Boolean) as { label: string; name: string; avatar: string; color: string; val: string }[];

    return shell(
      <div className="max-w-2xl mx-auto text-center">
        <Crown size={52} style={{ color: "#f5b800" }} className="mx-auto mb-3 drop-shadow-[0_0_18px_rgba(245,184,0,0.6)]" />
        <p className="font-mono text-cyan-300 text-sm">CHAMPION</p>
        <h1 className="text-5xl font-black text-white mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <span className="mr-2">{champion.avatar}</span>{champion.name}
        </h1>
        <p className="text-3xl font-mono font-bold" style={{ color: "#f5b800" }}>{fmt(champion.cash)}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-xs">
          <StatChip label="Final Fortune" value={fmt(champion.cash)} />
          <StatChip label="Rounds Survived" value={String(champion.roundsSurvived)} />
          <StatChip label="Biggest Win" value={fmt(champion.biggestWin)} />
          <StatChip label="Operations" value={String(champion.opsCompleted)} />
        </div>

        <h3 className="font-mono text-cyan-300 text-sm mb-3 flex items-center justify-center gap-2">
          <TrendingUp size={15} /> HALL OF FAME
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/40 font-mono uppercase tracking-wide">{s.label}</div>
                <div className="font-bold" style={{ color: s.color }}>
                  <span className="mr-1">{s.avatar}</span>{s.name}
                </div>
              </div>
              <div className="font-mono text-sm text-white">{s.val}</div>
            </div>
          ))}
        </div>

        {activeSeed && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-cyan-300/80">
            <Hash size={13} /> {activeSeed}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(activeSeed).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 border border-white/12 hover:border-cyan-400/50 text-white/70"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Share seed"}
            </button>
          </div>
        )}

        {freshAch.length > 0 && (
          <div className="mt-6 w-full max-w-md">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-300 mb-2 flex items-center justify-center gap-1.5">
              <Award size={14} /> {freshAch.length} New Achievement{freshAch.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {freshAch.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 animate-fade-in">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                    <p className="text-xs text-white/55">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => { setStats(loadStats()); setOverlay("stats"); }}
            className="rounded-lg px-4 py-2 text-xs font-mono flex items-center gap-1.5 border border-white/12 bg-white/[0.02] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
          >
            <BarChart3 size={14} /> Statistics
          </button>
          <button
            onClick={() => { setUnlockedIds(loadUnlocked()); setOverlay("achievements"); }}
            className="rounded-lg px-4 py-2 text-xs font-mono flex items-center gap-1.5 border border-white/12 bg-white/[0.02] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
          >
            <Award size={14} /> Achievements
          </button>
        </div>


        <button
          onClick={() => {
            snd.startMusic();
            setPhase("welcome");
          }}
          className="mt-8 rounded-lg px-10 py-3 font-mono font-bold text-black hover:brightness-110 transition"
          style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)", boxShadow: "0 0 24px rgba(245,184,0,0.4)" }}
        >
          PLAY AGAIN
        </button>
        {overlayNode}
      </div>
    );
  }

  return shell(<div />);
}

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */

function RiskBadge({ risk }: { risk: Operation["risk"] }) {
  const color =
    risk === "low" ? "#22c55e" : risk === "medium" ? "#f5b800" : risk === "high" ? "#f97316" : "#ef4444";
  return (
    <span
      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
      style={{ color, background: `${color}22`, border: `1px solid ${color}55` }}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] text-white/40 font-mono uppercase tracking-wide">{label}</div>
      <div className="font-mono font-bold text-white text-sm">{value}</div>
    </div>
  );
}
