import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, Skull, Shield, Crown, TrendingUp, Flame, Trophy, BarChart3, Calendar, Hash, Award, Copy, Check, X, Fish, VenetianMask, CreditCard, Wine, Gem, Lock, Rocket, ShoppingCart, Building2, Landmark, Dice5, Eye, Coins, Maximize2, Minimize2, HelpCircle } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import Globe, { type GlobePlayer, type GlobeAttack } from "@/components/syndicate/Globe";
import { MapPin, Zap, Newspaper, Database, Users, TrendingDown, ShieldAlert, Bitcoin, Radio, ChevronDown } from "lucide-react";
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
  OUTCOME_COLOR,
  type Operation,
  type RiskLevel,
  type Outcome,
  type GlobalEvent,
  type AiProfile,
  type WheelSegment,
  quipFor,
  HUMAN_AVATAR_IMG,
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
import { planAiTurns, commitAiTurn } from "@/lib/syndicateAiTurns";
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
import { useSynLang, tr } from "@/data/syndicateI18n";



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

// Max values across all operations — used to normalise the in-card data bars.
const MAX_COST = Math.max(...OPERATIONS.map((o) => o.cost));
const MAX_PAYOUT = Math.max(...OPERATIONS.map((o) => o.payout));


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
    body: "Outlast 2 rival crews across up to 12 rounds. Each round you run one operation for cash — the richest crew still standing at the end wins. I'll walk you through the first moves.",
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
  img?: string;
  color: string;
  profile?: AiProfile;
  location?: { city: string; lat: number; lon: number };
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
  cashHistory: number[]; // wealth after each completed operation (starts with START_CASH)
  usedOps: Record<string, number>;
  ranHighRisk: boolean;
  lastLabel?: string;
  lastDelta?: number;
  quip?: string;
}

type Phase =
  | "welcome"
  | "intro"
  | "round-intro"
  | "choose"
  | "strike"
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

interface AiTurn {
  player: Player; // snapshot after the turn
  op: Operation;
  res: SpinResult;
  caughtPct: number;
  segs: AngledSegment[]; // wheel for this rival's spin
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

function Avatar({
  img,
  fallback,
  color,
  size = 32,
}: {
  img?: string;
  fallback: string;
  color: string;
  size?: number;
}) {
  if (img) {
    return (
      <img
        src={img}
        alt={fallback}
        loading="lazy"
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{
          width: size,
          height: size,
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.62 }}>{fallback}</span>;
}



function Wheel({
  segments,
  rotation,
  spinning,
}: {
  segments: AngledSegment[];
  rotation: number;
  spinning: boolean;
}) {
  // Respect the OS "reduce motion" setting — snap the disc to its final angle
  // instead of running the long spin transition for users who opt out.
  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div
      className="relative mx-auto select-none max-w-full origin-top scale-[0.82] sm:scale-100"
      style={{ width: 320, height: 356, perspective: 1100 }}
    >
      {/* pointer */}
      <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ top: 2 }}>
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "15px solid transparent",
            borderRight: "15px solid transparent",
            borderTop: "30px solid #f5b800",
            filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.6)) drop-shadow(0 0 8px rgba(245,184,0,0.9))",
          }}
        />
      </div>

      {/* 3D tilted stage */}
      <div
        className="absolute inset-x-0"
        style={{
          top: 22,
          transformStyle: "preserve-3d",
          transform: "rotateX(26deg)",
        }}
      >
        {/* cast shadow / base plate for depth */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -14,
            width: 288,
            height: 60,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6), transparent 72%)",
            filter: "blur(6px)",
          }}
        />

        <svg width={320} height={320} viewBox="0 0 320 320">
          <defs>
            {/* metallic outer rim */}
            <linearGradient id="wheelRim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8d878" />
              <stop offset="50%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#5c430a" />
            </linearGradient>
            {/* glossy top-light highlight */}
            <radialGradient id="wheelGloss" cx="50%" cy="30%" r="75%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
            </radialGradient>
            <radialGradient id="hubGrad" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#1b2740" />
              <stop offset="100%" stopColor="#050912" />
            </radialGradient>
          </defs>

          {/* outer 3D rim */}
          <circle cx={CX} cy={CY} r={R + 8} fill="url(#wheelRim)" />
          <circle cx={CX} cy={CY} r={R + 2} fill="#0b1220" />

          {/* spinning disc */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: spinning && !reduceMotion
                ? "transform 4.2s cubic-bezier(0.15,0.9,0.2,1)"
                : "none",
            }}
          >
            {segments.map((s, i) => {
              // Professional prize-wheel labels: each sits along its slice's
              // radius and always reads left-to-right (flipped upright on the
              // left half so no label is ever mirrored or upside down).
              const labelR = R * 0.6;
              const p = polar(s.mid, labelR);
              // Align the text with the radial direction, then keep it upright.
              let rot = s.mid - 90;
              const upsideDown = ((rot % 360) + 360) % 360 > 90 && ((rot % 360) + 360) % 360 < 270;
              if (upsideDown) rot += 180;
              const wide = s.end - s.start;
              return (
                <g key={i}>
                  <path
                    d={arcPath(s.start, s.end)}
                    fill={s.color}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1.5}
                    opacity={s.type === "safe" ? 0.9 : 1}
                  />
                  {wide > 12 && (
                    <text
                      x={p.x}
                      y={p.y}
                      fill="#fff"
                      fontSize={wide > 26 ? 11 : 8.5}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${rot}, ${p.x}, ${p.y})`}
                      style={{
                        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.label}
                    </text>
                  )}
                </g>
              );

            })}

          </g>

          {/* glossy overlay (does not spin) */}
          <circle cx={CX} cy={CY} r={R} fill="url(#wheelGloss)" pointerEvents="none" />

          {/* hub */}
          <circle cx={CX} cy={CY} r={30} fill="url(#hubGrad)" stroke="#f5b800" strokeWidth={2.5} />
          <text
            x={CX}
            y={CY}
            fill="#f5b800"
            fontSize={24}
            fontWeight={900}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ textShadow: "0 0 8px rgba(245,184,0,0.7)" }}
          >
            $
          </text>
        </svg>
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Wheel popup — premium modal that frames the spin sequence           */
/* ------------------------------------------------------------------ */

function WheelPopup({
  children,
  accent = "#f5b800",
  wide = false,
}: {
  children: React.ReactNode;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <div className="flex w-full flex-1 flex-col items-center">
      <div
        className={`relative w-full ${wide ? "max-w-lg" : "max-w-md"} flex flex-col overflow-x-hidden rounded-3xl border p-5 sm:p-7 animate-scale-in`}
        style={{
          borderColor: `${accent}55`,
          background: "linear-gradient(180deg, rgba(24,32,48,0.97), rgba(14,20,32,0.99))",
          boxShadow: `0 0 0 1px ${accent}22, 0 24px 70px -30px ${accent}66, 0 0 140px -70px ${accent}`,
        }}
      >
        {/* subtle top sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl"
          style={{ background: `radial-gradient(120% 80% at 50% 0%, ${accent}18, transparent 70%)` }}
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/* A stage that frames the wheel with an animated glow ring while spinning. */
function WheelStage({
  children,
  accent = "#f5b800",
  active = false,
}: {
  children: React.ReactNode;
  accent?: string;
  active?: boolean;
}) {
  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: 320, maxWidth: "100%" }}>
      {/* rotating conic halo behind the wheel */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${active ? "animate-spin" : ""}`}
        style={{
          width: 360,
          height: 360,
          opacity: active ? 0.6 : 0.32,
          background: `conic-gradient(from 0deg, transparent 0%, ${accent} 25%, transparent 55%, ${accent}88 80%, transparent 100%)`,
          animationDuration: "3.2s",
        }}
      />
      {/* soft steady bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: 260, height: 260, opacity: 0.25, background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* Uniform popup header — fixed-height eyebrow + title used by every wheel popup
   so the header/body hierarchy stays identical across phases. */
function WheelHeader({ eyebrow, title }: { eyebrow: string; title?: string }) {
  return (
    <div className="h-16 flex flex-col justify-center border-b border-white/20 pb-3 mb-4">
      <p className="text-center text-[10px] font-mono tracking-[0.3em] text-white/65 mb-1">
        {eyebrow}
      </p>
      <h2 className="font-bold text-xl text-white text-center leading-tight">{title}</h2>
    </div>
  );
}

/* Legend explaining what each wheel slice means. */
const WHEEL_LEGEND: { type: Outcome; blurb: string }[] = [
  { type: "success", blurb: "Job pays off — solid profit on your stake." },
  { type: "bigSuccess", blurb: "Jackpot — the biggest payout on the wheel." },
  { type: "bonus", blurb: "Windfall — extra cash on top of the job." },
  { type: "safe", blurb: "No harm done — you break even, keep your stake." },
  { type: "investigation", blurb: "Heat rises — a small loss, but no token burned." },
  { type: "caught", blurb: "Busted — you burn a shield token. Out at zero." },
];

function WheelLegend() {
  return (
    <div className="mt-4 text-left rounded-xl border border-white/20 bg-white/[0.06] p-3 sm:p-4">
      <p className="text-[10px] font-mono tracking-[0.25em] text-white/65 mb-2.5 text-center">
        WHAT THE SLICES MEAN
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {WHEEL_LEGEND.map(({ type, blurb }) => (
          <li key={type} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-[3px] h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: OUTCOME_COLOR[type], boxShadow: `0 0 6px ${OUTCOME_COLOR[type]}88` }}
            />
            <span className="text-[11px] sm:text-xs leading-snug text-white/70">
              <span className="font-semibold text-white/90">{OUTCOME_LABEL[type]}</span>
              {" — "}
              {blurb}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}


/* Wealth-progression line chart — replaces the flat cash bars.
   Plots each crew's fortune after every completed operation. A crew's line
   ends the moment it goes broke ($0) or is eliminated. */
function WealthChart({ players }: { players: Player[] }) {
  const W = 100;
  const H = 46;
  const maxLen = Math.max(2, ...players.map((p) => p.cashHistory.length));
  const maxVal = Math.max(
    1,
    ...players.flatMap((p) => p.cashHistory.map((v) => Math.max(0, v)))
  );
  const xAt = (i: number) => (maxLen <= 1 ? 0 : (i / (maxLen - 1)) * W);
  const yAt = (v: number) => H - (Math.max(0, v) / maxVal) * (H - 4) - 2;

  // Smooth each series with a light Catmull-Rom → cubic bezier so lines read
  // as a polished financial curve rather than jagged segments.
  const smoothPath = (hist: number[]) => {
    const pts = hist.map((v, i) => [xAt(i), yAt(v)] as const);
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  return (
    <div>
      <div className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(0,188,212,0.06),transparent_60%)] px-1.5 pt-1.5">
        {/* y-axis scale caps */}
        <div className="pointer-events-none absolute right-2 top-1 z-10 font-mono text-[9px] tabular-nums text-white/40">
          {fmtShort(maxVal)}
        </div>
        <div className="pointer-events-none absolute right-2 bottom-6 z-10 font-mono text-[9px] tabular-nums text-white/30">
          $0
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-24 w-full overflow-visible"
          aria-label="Wealth progression chart"
        >
          <defs>
            {players.map((p) => (
              <linearGradient key={p.id} id={`wc-fill-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {/* horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={0}
              x2={W}
              y1={2 + (H - 4) * f}
              y2={2 + (H - 4) * f}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={0.35}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {players.map((p) => {
            const hist = p.cashHistory;
            if (hist.length === 0) return null;
            const line = smoothPath(hist);
            const last = hist[hist.length - 1];
            const broke = !p.alive;
            const area = `${line} L ${xAt(hist.length - 1)},${H} L 0,${H} Z`;
            return (
              <g key={p.id} opacity={broke ? 0.5 : 1}>
                {!broke && hist.length > 1 && (
                  <path d={area} fill={`url(#wc-fill-${p.id})`} stroke="none" />
                )}
                <path
                  d={line}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={broke ? 1 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={broke ? "2 1.5" : undefined}
                  vectorEffect="non-scaling-stroke"
                  style={broke ? undefined : { filter: `drop-shadow(0 0 2px ${p.color}88)` }}
                />
                <circle
                  cx={xAt(hist.length - 1)}
                  cy={yAt(last)}
                  r={broke ? 1.2 : 1.7}
                  fill={broke ? "#94a3b8" : p.color}
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>
      </div>
      {/* legend + current cash */}
      <div className="mt-2 space-y-1">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-[9px] font-mono">
            <span
              className="h-1.5 w-3 shrink-0 rounded-full"
              style={{ background: p.alive ? p.color : "#64748b" }}
            />
            <span
              className="font-semibold tracking-wide truncate"
              style={{ color: p.alive ? p.color : "#64748b" }}
            >
              {p.isHuman ? "YOU" : p.name}
            </span>
            {!p.alive && <span className="text-red-400/80 tracking-widest">OUT</span>}
            <span
              className="ml-auto tabular-nums font-bold"
              style={{ color: p.alive ? "#fff" : "#94a3b8" }}
            >
              {fmt(Math.max(0, p.cash))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}







/* ------------------------------------------------------------------ */
/*  Global-event cinematic — a themed hero shown between rounds.        */
/* ------------------------------------------------------------------ */

type EventVisual = { icon: typeof Skull; accent: string; motif: "surveillance" | "market-up" | "market-down" | "news" | "data" | "power" | "watch" };

const EVENT_VISUALS: Record<string, EventVisual> = {
  cooperation: { icon: ShieldAlert, accent: "#ef4444", motif: "surveillance" },
  budgetcuts: { icon: Users, accent: "#22c55e", motif: "watch" },
  boom: { icon: Bitcoin, accent: "#22c55e", motif: "market-up" },
  crash: { icon: TrendingDown, accent: "#ef4444", motif: "market-down" },
  media: { icon: Newspaper, accent: "#38bdf8", motif: "news" },
  leak: { icon: Database, accent: "#a855f7", motif: "data" },
  summit: { icon: Landmark, accent: "#ef4444", motif: "surveillance" },
  goldrush: { icon: Rocket, accent: "#f5b800", motif: "market-up" },
  informant: { icon: Eye, accent: "#f97316", motif: "watch" },
  blackout: { icon: Zap, accent: "#06b6d4", motif: "power" },
};

const DEFAULT_EVENT_VISUAL: EventVisual = { icon: Radio, accent: "#f5b800", motif: "news" };

// Extended "why is this happening" briefing shown inside the event details drawer.
const EVENT_REASONS: Record<string, string> = {
  cooperation: "Interpol has spun up a cross-border task force. Shared intel and synchronized raids mean any operation is far likelier to be traced.",
  budgetcuts: "Blue teams are gutted by layoffs and burnout. Alerts pile up unread, so intrusions slip past overwhelmed defenders.",
  boom: "A crypto bull run is inflating token prices. Every laundered cash-out converts to more real value while the market runs hot.",
  crash: "Markets are in freefall. Liquidations and frozen exchanges mean large scores fetch a fraction of their usual value.",
  media: "A rival scandal is dominating the news cycle. Investigators are pulled onto the story, easing pressure and lifting payouts slightly.",
  leak: "A mega breach dumped billions of records overnight. Analysts are drowning in noise, so your moves hide in the flood.",
  summit: "A global cybersecurity summit has nations sharing live threat intel. Coordination is at an all-time high and detection spikes.",
  goldrush: "Demand for zero-days is surging on exploit markets. Buyers are paying a premium, so every successful score pays extra.",
  informant: "An insider is feeding the authorities. Everyone is under surveillance and detection risk climbs across the board.",
  blackout: "A critical infrastructure outage has plunged systems into chaos. Monitoring is down, masking your moves — while paying a little more.",
};



function EventScene({ event, victim }: { event: GlobalEvent; victim?: TargetCity | null }) {
  const v = EVENT_VISUALS[event.id] ?? DEFAULT_EVENT_VISUAL;
  const Icon = v.icon;
  const riskUp = event.riskMult > 1;
  const profitUp = event.profitMult > 1;
  const riskPct = Math.round(Math.abs(event.riskMult - 1) * 100);
  const profitPct = Math.round(Math.abs(event.profitMult - 1) * 100);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const reason = EVENT_REASONS[event.id] ?? event.description;

  return (
    <div
      className="relative w-full max-w-xl overflow-hidden rounded-2xl border animate-scale-in"
      style={{
        borderColor: `${v.accent}55`,
        background: `radial-gradient(120% 120% at 50% 0%, ${v.accent}22, rgba(0,0,0,0.5) 60%)`,
        boxShadow: `0 24px 70px -24px ${v.accent}99, inset 0 0 60px -30px ${v.accent}`,
      }}
    >
      {/* animated motif layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `linear-gradient(${v.accent}44 1px, transparent 1px), linear-gradient(90deg, ${v.accent}44 1px, transparent 1px)`,
            backgroundSize: "26px 26px",
          }}
        />
        {/* sweeping scanline for surveillance / watch */}
        {(v.motif === "surveillance" || v.motif === "watch") && (
          <div
            className="absolute inset-y-0 -left-1/3 w-1/3 animate-[slide-in-right_2.6s_linear_infinite]"
            style={{ background: `linear-gradient(90deg, transparent, ${v.accent}33, transparent)` }}
          />
        )}
        {/* pulsing power flicker */}
        {v.motif === "power" && (
          <div className="absolute inset-0 animate-pulse" style={{ background: `radial-gradient(60% 50% at 50% 40%, ${v.accent}22, transparent)` }} />
        )}
        {/* drifting data streams */}
        {v.motif === "data" && (
          <div
            className="absolute inset-0 opacity-30 animate-[slide-in-right_5s_linear_infinite]"
            style={{ backgroundImage: `repeating-linear-gradient(90deg, ${v.accent}33 0 2px, transparent 2px 16px)` }}
          />
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-7 text-center">
        {/* icon medallion */}
        <span
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${v.accent}77`,
            background: `radial-gradient(circle at 50% 35%, ${v.accent}44, transparent 70%)`,
            boxShadow: `0 0 30px -6px ${v.accent}, inset 0 0 24px -8px ${v.accent}`,
          }}
        >
          <Icon size={30} style={{ color: v.accent, filter: `drop-shadow(0 0 8px ${v.accent})` }} />
        </span>

        <p className="font-mono text-[10px] uppercase tracking-[0.35em]" style={{ color: v.accent }}>
          Global Event
        </p>
        <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">{event.name}</h3>
        <p className="mt-2 max-w-md text-sm leading-snug text-white/70">{event.description}</p>

        {/* impact meters */}
        <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
          <EventMeter
            label="Detection"
            active={event.riskMult !== 1}
            up={riskUp}
            pct={riskPct}
            goodWhenDown
          />
          <EventMeter
            label="Profit"
            active={event.profitMult !== 1}
            up={profitUp}
            pct={profitPct}
            goodWhenDown={false}
          />
        </div>

        {/* details drawer trigger */}
        <button
          onClick={() => setDetailsOpen((o) => !o)}
          aria-expanded={detailsOpen}
          className="mt-4 flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition hover:brightness-125"
          style={{ borderColor: `${v.accent}66`, color: v.accent, background: `${v.accent}12` }}
        >
          <Eye size={13} /> {detailsOpen ? "Hide briefing" : "Event details"}
          <ChevronDown size={14} className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button>

        {/* inline details drawer — expands in place so the financial chart on the
            left rail is never covered. */}
        {detailsOpen && (
          <div className="mt-3 w-full max-w-md animate-fade-in overflow-hidden rounded-xl border border-white/12 bg-black/50 text-left backdrop-blur-sm">
            {/* event reason */}
            <div className="border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Why it's happening</p>
              <p className="mt-1.5 text-[13px] leading-snug text-white/80">{reason}</p>
            </div>

            {/* exact impact numbers */}
            <div className="border-b border-white/10 px-4 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Exact impact this round</p>
              <div className="mt-2 space-y-2">
                <ImpactRow
                  label="Detection risk"
                  mult={event.riskMult}
                  goodWhenDown
                  note="Applied to every operation's caught chance."
                />
                <ImpactRow
                  label="Payout"
                  mult={event.profitMult}
                  goodWhenDown={false}
                  note="Applied to winning payouts."
                />
              </div>
            </div>

            {/* victim company — only when available */}
            {victim && (
              <div className="px-4 py-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">Victim company</p>
                <p className="mt-1.5 text-sm font-bold text-white">{victim.company}</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-cyan-300">
                  <MapPin size={11} /> {victim.city}
                  <span className="text-white/30">·</span>
                  <span className="text-white/60">{victim.sector}</span>
                </p>
                <p className="mt-1 text-[12px] leading-snug text-white/65">{victim.desc}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// One precise before/after impact line inside the event drawer.
function ImpactRow({
  label,
  mult,
  goodWhenDown,
  note,
}: {
  label: string;
  mult: number;
  goodWhenDown: boolean;
  note: string;
}) {
  const active = mult !== 1;
  const up = mult > 1;
  const pct = Math.round(Math.abs(mult - 1) * 100);
  const good = active ? (goodWhenDown ? !up : up) : true;
  const col = !active ? "#94a3b8" : good ? "#22c55e" : "#ef4444";
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-white/85">{label}</p>
        <p className="text-[10px] leading-snug text-white/45">{note}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: col }}>
          {active ? `${up ? "+" : "−"}${pct}%` : "No change"}
        </p>
        <p className="font-mono text-[10px] text-white/40 tabular-nums">×{mult.toFixed(2)}</p>
      </div>
    </div>
  );
}


function EventMeter({
  label,
  active,
  up,
  pct,
  goodWhenDown,
}: {
  label: string;
  active: boolean;
  up: boolean;
  pct: number;
  goodWhenDown: boolean;
}) {
  // "good" (green) when the swing helps the player.
  const good = active ? (goodWhenDown ? !up : up) : true;
  const col = !active ? "#64748b" : good ? "#22c55e" : "#ef4444";
  return (
    <div className="rounded-xl border border-white/12 bg-black/30 px-3 py-2.5 text-left">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {active ? (
          up ? <TrendingUp size={16} style={{ color: col }} /> : <TrendingDown size={16} style={{ color: col }} />
        ) : (
          <span className="h-0.5 w-4 rounded-full bg-white/30" />
        )}
        <span className="font-mono text-lg font-bold tabular-nums" style={{ color: col }}>
          {active ? `${up ? "+" : "−"}${pct}%` : "—"}
        </span>
      </div>
      {/* bar */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: active ? `${Math.min(100, pct)}%` : "0%", background: col }}
        />
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Player home bases — international centres of power                  */
/* ------------------------------------------------------------------ */

const HUMAN_LOCATION = { city: "New York", lat: 40.71, lon: -74.0 };

// Keyed by AI profile id. Each rival resides in a global power hub.
const AI_LOCATIONS: Record<string, { city: string; lat: number; lon: number }> = {
  "ai-vex": { city: "Zurich", lat: 47.37, lon: 8.54 },
  "ai-nyx": { city: "Moscow", lat: 55.75, lon: 37.62 },
};

// Fallback pool for any additional rivals.
const FALLBACK_LOCATIONS = [
  { city: "London", lat: 51.51, lon: -0.13 },
  { city: "Singapore", lat: 1.35, lon: 103.82 },
  { city: "Dubai", lat: 25.2, lon: 55.27 },
  { city: "Hong Kong", lat: 22.32, lon: 114.17 },
];

// Fictional target hubs a cyber operation "strikes" on the globe, each with a
// fictional victim company + one-line sector profile for flavour.
type TargetCity = { lat: number; lon: number; city: string; company: string; sector: string; desc: string };
const TARGET_CITIES: TargetCity[] = [
  { lat: 35.68, lon: 139.69, city: "Tokyo", company: "Katsu Robotics KK", sector: "Industrial robotics", desc: "Factory automation giant with fragile OT networks." },
  { lat: 1.35, lon: 103.82, city: "Singapore", company: "Meridian Trust Bank", sector: "Private banking", desc: "Offshore wealth vault holding elite client funds." },
  { lat: -33.87, lon: 151.21, city: "Sydney", company: "Southern Cross Mining", sector: "Resources", desc: "Ore conglomerate running legacy control systems." },
  { lat: 37.77, lon: -122.42, city: "San Francisco", company: "Helix Cloud Systems", sector: "Cloud infrastructure", desc: "Hyperscaler hosting half the startup economy." },
  { lat: 52.52, lon: 13.4, city: "Berlin", company: "Adler Energie AG", sector: "Energy grid", desc: "Utility operator wired into the national grid." },
  { lat: 25.2, lon: 55.27, city: "Dubai", company: "Zenith Capital Group", sector: "Sovereign fund", desc: "Petro-cash sovereign fund with thin security." },
  { lat: -23.55, lon: -46.63, city: "São Paulo", company: "Verde AgroCorp", sector: "Agritech", desc: "Continental food supplier with exposed logistics." },
  { lat: 19.08, lon: 72.88, city: "Mumbai", company: "Sona Pharma Ltd", sector: "Pharmaceuticals", desc: "Drug maker guarding priceless research IP." },
  { lat: 40.71, lon: -74.01, city: "New York", company: "Empire Payments Inc", sector: "Payment rails", desc: "Card processor clearing millions of transactions an hour." },
  { lat: 51.51, lon: -0.13, city: "London", company: "Thames Ledger PLC", sector: "Fintech", desc: "Neobank with a sprawling, under-patched API surface." },
  { lat: 48.86, lon: 2.35, city: "Paris", company: "Lumière Télécom", sector: "Telecom", desc: "Carrier routing traffic for half the continent." },
  { lat: 55.76, lon: 37.62, city: "Moscow", company: "Volkov Logistics", sector: "Freight", desc: "Rail and port operator on brittle SCADA gear." },
  { lat: 39.9, lon: 116.4, city: "Beijing", company: "Jade Semiconductor", sector: "Chip fab", desc: "Foundry hoarding bleeding-edge lithography secrets." },
  { lat: 37.57, lon: 126.98, city: "Seoul", company: "Hanbit Motors", sector: "Automotive", desc: "EV maker with connected cars phoning home." },
  { lat: 22.32, lon: 114.17, city: "Hong Kong", company: "Peak Holdings", sector: "Trading house", desc: "Commodities broker moving billions in the dark." },
  { lat: 43.65, lon: -79.38, city: "Toronto", company: "Maple Health Network", sector: "Healthcare", desc: "Hospital chain guarding millions of patient records." },
  { lat: -34.6, lon: -58.38, city: "Buenos Aires", company: "Pampas Grain Co", sector: "Commodities", desc: "Grain exporter with wide-open supplier portals." },
  { lat: 30.04, lon: 31.24, city: "Cairo", company: "Nile Water Authority", sector: "Water utility", desc: "Public utility running decades-old control systems." },
  { lat: -26.2, lon: 28.05, city: "Johannesburg", company: "Aurum Reserve", sector: "Bullion vault", desc: "Gold depository with paper-thin access controls." },
  { lat: 59.33, lon: 18.07, city: "Stockholm", company: "Nordkraft Grid", sector: "Renewables", desc: "Wind operator remotely managing hundreds of turbines." },
  { lat: 41.9, lon: 12.5, city: "Rome", company: "Aquila Insurance", sector: "Insurance", desc: "Insurer sitting on a lake of unencrypted claims data." },
  { lat: 52.37, lon: 4.9, city: "Amsterdam", company: "Delta Port Systems", sector: "Maritime", desc: "Smart-port operator steering automated container cranes." },
  { lat: 31.23, lon: 121.47, city: "Shanghai", company: "Orient Retail Group", sector: "E-commerce", desc: "Retail titan with a leaky loyalty database." },
  { lat: -37.81, lon: 144.96, city: "Melbourne", company: "Coral Bay Casino", sector: "Gaming", desc: "Casino resort laundering cash through weak systems." },
  { lat: 6.52, lon: 3.38, city: "Lagos", company: "Sahara Mobile", sector: "Mobile money", desc: "Wallet provider banking tens of millions of users." },
  { lat: 50.11, lon: 8.68, city: "Frankfurt", company: "Rhein Clearing AG", sector: "Securities", desc: "Central clearinghouse for European stock trades." },
  { lat: 32.09, lon: 34.78, city: "Tel Aviv", company: "Iron Dome Analytics", sector: "Defence tech", desc: "Contractor holding classified sensor blueprints." },
  { lat: 45.42, lon: -75.7, city: "Ottawa", company: "Northern Grid Ops", sector: "Power grid", desc: "Grid operator balancing load across three provinces." },
  { lat: 13.76, lon: 100.5, city: "Bangkok", company: "Siam Pay Wallet", sector: "Payments", desc: "Super-app wallet with reused admin credentials." },
  { lat: 60.17, lon: 24.94, city: "Helsinki", company: "Boreal Datacenters", sector: "Colocation", desc: "Arctic data halls hosting sensitive government tenants." },
];

function targetForOp(opId: string, salt = 0): TargetCity {
  let h = salt >>> 0;
  for (let i = 0; i < opId.length; i++) h = (h * 31 + opId.charCodeAt(i)) >>> 0;
  return TARGET_CITIES[h % TARGET_CITIES.length];
}

// Map a net profit to a 0..1 "how big is this win" value so the win stinger can
// ring higher/louder the more money the wheel paid out. Scaled against the
// operation's own gross payout so a huge op and a small op both feel calibrated.
function winIntensity(profit: number, op: Operation): number {
  if (profit <= 0) return 0;
  const ref = Math.max(1, op.payout || op.cost * 4);
  return Math.max(0, Math.min(1, profit / ref));
}



// Decorative markers shown on the welcome-screen globe (before players exist).
const WELCOME_GLOBE_PLAYERS: GlobePlayer[] = [
  { id: "w-you", color: "#f5b800", lat: HUMAN_LOCATION.lat, lon: HUMAN_LOCATION.lon, active: true },
  { id: "w-vex", color: "#22d3ee", lat: AI_LOCATIONS["ai-vex"].lat, lon: AI_LOCATIONS["ai-vex"].lon },
  { id: "w-nyx", color: "#f472b6", lat: AI_LOCATIONS["ai-nyx"].lat, lon: AI_LOCATIONS["ai-nyx"].lon },
];

/* ------------------------------------------------------------------ */
/*  Main game                                                          */
/* ------------------------------------------------------------------ */


interface SyndicateProps {
  embedded?: boolean;
}

export default function Syndicate({ embedded = false }: SyndicateProps) {
  const { lang, setLang } = useSynLang();
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
  const [aiLog, setAiLog] = useState<AiTurn[]>([]);
  const [aiStep, setAiStep] = useState(0);
  const [aiSub, setAiSub] = useState<"choice" | "spinning" | "result">("choice");
  const [aiRotation, setAiRotation] = useState(0);
  const aiRotationRef = useRef(0);
  const rotationRef = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  // Pending strike→spin timer, kept so the player can skip the cinematic.
  const strikeTimeoutRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Honour the OS "reduce motion" preference — used to skip long animation
  // delays (e.g. the fly-over readout) for accessibility.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);



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

  // Close the stats/achievements overlay with the Escape key.
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlay(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);
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
      img: HUMAN_AVATAR_IMG,
      color: "#f5b800",
      location: HUMAN_LOCATION,
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
      cashHistory: [START_CASH],
      usedOps: {},
      ranHighRisk: false,
    };
    const ais: Player[] = AI_PROFILES.map((pr, i) => ({
      id: pr.id,
      name: pr.name,
      isHuman: false,
      avatar: pr.avatar,
      img: pr.img,
      color: pr.color,
      profile: pr,
      location: AI_LOCATIONS[pr.id] ?? FALLBACK_LOCATIONS[i % FALLBACK_LOCATIONS.length],
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
      cashHistory: [START_CASH],
      usedOps: {},
      ranHighRisk: false,
    }));
    setPlayers([you, ...ais]);
    setRound(1);
    snd.transition();
    setPhase("intro");
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

  // Launch: play the strike on the globe first (showing the victim company),
  // then reveal the wheel and run the actual spin.
  const spin = useCallback(() => {
    if (!human || !selectedOp) return;
    snd.reveal();
    setPhase("strike");
    if (strikeTimeoutRef.current) window.clearTimeout(strikeTimeoutRef.current);
    strikeTimeoutRef.current = window.setTimeout(() => {
      strikeTimeoutRef.current = null;
      runSpin();
    }, reduceMotion ? 400 : 5200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [human, selectedOp, reduceMotion]);

  // Skip the strike cinematic and go straight to the wheel.
  const skipStrike = useCallback(() => {
    if (strikeTimeoutRef.current) {
      window.clearTimeout(strikeTimeoutRef.current);
      strikeTimeoutRef.current = null;
    }
    runSpin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [human, selectedOp, round, event, reduceMotion]);

  const runSpin = useCallback(() => {
    if (!human || !selectedOp) return;
    snd.spinStart();
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
    // Defer the rotation update so the newly-mounted spinning Wheel starts at
    // its current angle and then animates to the target (transition triggers).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRotation(target));
    });

    // ticking sound during spin (skipped when motion is reduced)
    let ticks = 0;
    const tickInt = reduceMotion
      ? null
      : setInterval(() => {
          snd.tick();
          ticks++;
          if (ticks > 26) clearInterval(tickInt as ReturnType<typeof setInterval>);
        }, 130);

    window.setTimeout(() => {
      if (tickInt) clearInterval(tickInt);
      setSpinning(false);
      snd.land();
      finishHumanSpin(selectedOp, res);
    }, reduceMotion ? 500 : 4300);
  }, [human, selectedOp, round, event, reduceMotion]);

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
        snd.bigWin(winIntensity(res.delta - op.cost, op));
      } else if (res.delta > op.cost) {
        snd.win(winIntensity(res.delta - op.cost, op));
      } else {
        snd.reveal();
      }
      setPhase("outcome");
    },
    []
  );

  /* ---- AI turns ---- */
  const runAiTurns = useCallback(() => {
    setPhase("ai");
    setAiStep(0);
    setAiSub("choice");
    setAiRotation(0);
    aiRotationRef.current = 0;
    // Plan every rival's operation up front (so choices are based on the same
    // pre-round standings) but DO NOT apply the cash results yet — each rival's
    // money only lands on the financial chart once their wheel is revealed in
    // advanceAi. This keeps results from showing before the attack plays.
    setPlayers((prev) => {
      const { turns } = planAiTurns<Player, AiTurn>(prev, (p, rankFrac) => {
        const op = chooseAiOp(p, rankFrac);
        if (!op) return null;
        const res = resolveSpin(op, round, event, p);
        const updated = applyResult(p, op, res);
        if (p.profile) updated.quip = quipFor(p.profile.personality, rand);
        const abilityAdj =
          p.profile?.personality === "conservative"
            ? AI_ABILITY.conservativeCaughtAdj
            : 0;
        const caughtAdj = effectiveCaught(op, round, event, abilityAdj);
        return {
          player: updated,
          op,
          res,
          caughtPct: Math.round(effectiveCaught(op, round, event, 0) * 100),
          segs: angleSegments(buildWheel(caughtAdj)),
        };
      });
      setAiLog(turns);
      return prev; // standings unchanged until each rival's spin resolves
    });

  }, [round, event]);

  /* ---- end of round bookkeeping ---- */
  const finishRound = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => (p.alive ? { ...p, roundsSurvived: round } : p))
    );
    setPhase("scoreboard");
  }, [round]);

  /* ---- manual, user-paced walk-through of each rival ---- */
  const advanceAi = useCallback(() => {
    if (aiSub === "choice") {
      // spin the wheel for this rival, animating to its predetermined landing
      const turn = aiLog[aiStep];
      if (!turn) return;
      setAiSub("spinning");
      snd.spinStart();
      const base = aiRotationRef.current;
      const currentMod = ((base % 360) + 360) % 360;
      const target = base + (360 - currentMod) + 360 * 5 + (360 - turn.res.landing);
      aiRotationRef.current = target;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAiRotation(target));
      });
      let ticks = 0;
      const tickInt = setInterval(() => {
        snd.tick();
        ticks++;
        if (ticks > 20) clearInterval(tickInt);
      }, 150);
      window.setTimeout(() => {
        clearInterval(tickInt);
        snd.land();
        const o = turn.res.outcome;
        if (o === "caught") {
          turn.res.eliminated ? snd.caught() : snd.lose();
        } else if (o === "bigSuccess") {
          snd.bigWin(winIntensity(turn.res.delta - turn.op.cost, turn.op));
        } else if (turn.res.delta > turn.op.cost) {
          snd.win(winIntensity(turn.res.delta - turn.op.cost, turn.op));
        } else {
          snd.reveal();
        }
        // Now that this rival's wheel has landed, commit their result to the
        // standings so the financial chart updates in sync with the reveal.
        setPlayers((prev) => commitAiTurn(prev, turn));
        setAiSub("result");
      }, 3600);
      return;
    }
    if (aiSub === "result") {
      if (aiStep >= aiLog.length - 1) {
        finishRound();
        return;
      }
      setAiStep((s) => s + 1);
      setAiSub("choice");
      setAiRotation(0);
      aiRotationRef.current = 0;
    }
  }, [aiSub, aiStep, aiLog, finishRound]);

  /* Auto-start each rival's spin after a short 1s beat */
  useEffect(() => {
    if (phase !== "ai" || aiSub !== "choice") return;
    if (!aiLog[aiStep]) return;
    const t = window.setTimeout(() => advanceAi(), 1000);
    return () => window.clearTimeout(t);
  }, [phase, aiSub, aiStep, aiLog, advanceAi]);



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
    // Broke — hitting $0 or below ends the run for this player.
    if (alive && cash <= 0) {
      cash = 0;
      alive = false;
      cashAtElimination = 0;
    }
    return {
      ...p,
      cash,
      tokens,
      alive,
      cashAtElimination,
      cashHistory: [...p.cashHistory, cash],
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
        role="dialog"
        aria-modal="true"
        aria-label={activeTip.title}
        className="w-full max-w-sm rounded-2xl border border-cyan-400/40 bg-[#141d2e] p-5 text-left animate-scale-in"
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
            className="rounded-lg px-3 py-2.5 text-xs font-mono text-white/75 hover:text-white/80 transition"
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
        role="dialog"
        aria-modal="true"
        aria-label={overlay === "stats" ? "Statistics" : "Achievements"}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-cyan-400/30 bg-[#141d2e] p-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono font-bold text-lg text-cyan-300">
            {overlay === "stats" ? "STATISTICS" : `ACHIEVEMENTS · ${unlockedCount}/${ACHIEVEMENTS.length}`}
          </h3>
          <button onClick={() => setOverlay(null)} aria-label="Close" className="text-white/75 hover:text-white text-xl leading-none">×</button>
        </div>

        {overlay === "stats" ? (
          <div className="space-y-1.5">
            {statRows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/15 py-1.5">
                <span className="text-white/55">{k}</span>
                <span className="font-mono text-white">{v}</span>
              </div>
            ))}
            <p className="pt-4 pb-1 text-xs font-mono uppercase tracking-widest text-amber-300/80">Hall of Fame</p>
            {recordRows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm border-b border-white/15 py-1.5">
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
                    <p className="text-xs text-white/70">{a.desc}</p>
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

  /* ---- Globe (3D world board): players on international power hubs ---- */
  const activeId =
    phase === "ai" && aiLog.length
      ? aiLog[Math.min(aiStep, aiLog.length - 1)]?.player.id
      : human?.id;
  const globePlayers: GlobePlayer[] = players
    .filter((p) => p.location)
    .map((p) => ({
      id: p.id,
      color: p.color,
      lat: p.location!.lat,
      lon: p.location!.lon,
      alive: p.alive,
      active: p.id === activeId,
    }));
  const focusPlayer = players.find((p) => p.id === activeId && p.location);

  // Attack animation: while a wheel is spinning, strike a target city from the
  // acting player's location.
  const attackingOp: Operation | null =
    phase === "strike" || phase === "spinning"
      ? selectedOp
      : phase === "ai" && aiSub === "spinning" && aiLog.length
        ? aiLog[Math.min(aiStep, aiLog.length - 1)]?.op ?? null
        : null;
  const globeAttack: GlobeAttack | null =
    attackingOp && focusPlayer?.location
      ? (() => {
          const salt = focusPlayer?.isHuman
            ? round * 31 + (focusPlayer.opsCompleted ?? 0)
            : round * 31 + aiStep * 7;
          const tgt = targetForOp(attackingOp.id, salt);
          return {
            id: `${focusPlayer.id}-${attackingOp.id}-${round}-${aiStep}`,
            color: focusPlayer.color,
            fromLat: focusPlayer.location!.lat,
            fromLon: focusPlayer.location!.lon,
            toLat: tgt.lat,
            toLon: tgt.lon,
          };
        })()
      : null;

  

  const shell = (children: React.ReactNode) => (
    <div
      ref={shellRef}
      className={`relative w-full overflow-y-auto overflow-x-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl"}`}
      style={{
        minHeight: isFullscreen ? "100dvh" : embedded ? 520 : "100dvh",
        height: isFullscreen ? "100dvh" : embedded ? "calc(100dvh - 272px)" : "100dvh",

        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(0,188,212,0.16), transparent), radial-gradient(900px 500px at 90% 110%, rgba(245,184,0,0.14), transparent), #101725",
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
      {/* CRT scanlines + screen flicker */}
      <div className="syn-scanlines pointer-events-none absolute inset-0 z-20" />
      {/* soft screen vignette */}
      <div className="syn-vignette pointer-events-none absolute inset-0 z-20" />
      {/* arcade HUD corner brackets */}
      <div className="syn-corner z-20" style={{ top: 10, left: 10, borderRight: "none", borderBottom: "none" }} />
      <div className="syn-corner z-20" style={{ top: 10, right: 10, borderLeft: "none", borderBottom: "none" }} />
      <div className="syn-corner z-20" style={{ bottom: 10, left: 10, borderRight: "none", borderTop: "none" }} />
      <div className="syn-corner z-20" style={{ bottom: 10, right: 10, borderLeft: "none", borderTop: "none" }} />
      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setLang(lang === "en" ? "de" : "en")}
          aria-label={lang === "en" ? "Auf Deutsch umstellen" : "Switch to English"}
          className="rounded-full px-3 py-2 border border-cyan-400/30 bg-black/25 hover:bg-black/60 transition font-mono text-[11px] font-bold tracking-widest"
          style={{ color: "#00bcd4" }}
        >
          {lang === "en" ? "DE" : "EN"}
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="rounded-full p-2 border border-cyan-400/30 bg-black/25 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="rounded-full p-2 border border-cyan-400/30 bg-black/25 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={() => {
            // Re-enable the always-on coach bar and show the contextual pop-up.
            if (!coachOn) toggleCoach();
            if (typeof window !== "undefined") localStorage.setItem("syndicate_coach_v1", "1");
            const key = phase === "welcome" ? "intro" : phase === "outcome" ? "outcome" : phase === "scoreboard" ? "scoreboard" : selectedOp ? "wheel" : "choose";
            setActiveTip(TIPS[key] ?? TIPS.intro);
          }}

          aria-label="How to play"
          className="rounded-full p-2 border border-cyan-400/30 bg-black/25 hover:bg-black/60 transition"
          style={{ color: "#00bcd4" }}
        >
          <HelpCircle size={18} />
        </button>
      </div>
      <div className="relative z-10 flex min-h-full flex-col px-3 py-4 sm:px-4 sm:py-5 md:h-full md:px-8">{children}</div>
      {tipNode}
    </div>
  );


  /* ---- WELCOME — cinematic cyber-tactical entry screen ---- */
  if (phase === "welcome") {
    return shell(
      <div className="relative flex flex-1 flex-col items-center justify-center text-center overflow-hidden">
        {/* ambient globe + aurora backdrop */}
        <Globe
          players={WELCOME_GLOBE_PLAYERS}
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[130%] h-[40vh] opacity-25"
        />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-aurora-violet/15 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-aurora-green/15 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--syndicate-start-panel)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--syndicate-start-panel)) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle, transparent 0%, hsl(var(--syndicate-start-bg) / 0.5) 50%, hsl(var(--syndicate-start-bg)) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(65% 45% at 50% 28%, transparent, hsl(var(--background)) 80%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
          {/* decorative frame corners */}
          <div className="absolute -top-10 sm:-top-12 left-2 sm:-left-4 w-10 sm:w-12 h-10 sm:h-12 border-t-2 border-l-2 border-highlight/30" />
          <div className="absolute -top-10 sm:-top-12 right-2 sm:-right-4 w-10 sm:w-12 h-10 sm:h-12 border-t-2 border-r-2 border-highlight/30" />
          <div className="absolute -bottom-10 sm:-bottom-12 left-2 sm:-left-4 w-10 sm:w-12 h-10 sm:h-12 border-b-2 border-l-2 border-highlight/30" />
          <div className="absolute -bottom-10 sm:-bottom-12 right-2 sm:-right-4 w-10 sm:w-12 h-10 sm:h-12 border-b-2 border-r-2 border-highlight/30" />

          {/* branding */}
          <div className="text-center mb-6 sm:mb-10">
            <span className="block text-highlight text-[10px] tracking-[0.5em] uppercase font-bold mb-3 opacity-80">
              System Initialization Sequence
            </span>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-foreground drop-shadow-[0_0_25px_hsl(var(--highlight)/0.3)]">
              SYNDICATE<span className="text-primary">.</span>
            </h1>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-highlight to-transparent mx-auto my-5" />
            <p className="text-muted-foreground text-xs sm:text-sm tracking-[0.2em] uppercase font-light">
              Strategic Command & Corporate Dominance
            </p>
          </div>

          {/* action card */}
          <div className="w-full max-w-md bg-card/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-border shadow-2xl">
            <div className="space-y-5">
              <div className="relative group">
                <label className="absolute -top-3 left-4 bg-background px-2 text-[10px] text-highlight uppercase tracking-widest font-bold">
                  Operator Alias
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startGame()}
                  maxLength={18}
                  placeholder="ENTER IDENTIFIER..."
                  className="w-full rounded-lg bg-background/60 border border-border px-5 py-4 text-foreground placeholder:text-foreground/20 text-center outline-none transition focus:border-aurora-green focus:ring-1 focus:ring-aurora-green/50 font-mono tracking-widest"
                />
              </div>

              <button
                onClick={startGame}
                className="relative w-full group overflow-hidden bg-primary py-5 rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <div className="relative flex items-center justify-center gap-3">
                  <span className="font-display font-black text-primary-foreground text-sm sm:text-base tracking-[0.2em] uppercase">
                    Establish Connection
                  </span>
                  <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* technical metadata */}
          <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-aurora-green animate-pulse" />
              <span>Server: Node_01_Online</span>
            </div>
            <div className="hidden sm:block">Lat: 34.0522 • Long: -118.2437</div>
            <div>Ver 2.0.44-Stable</div>
          </div>
        </div>

        {overlayNode}
      </div>
    );
  }


  /* ---- INTRO — cinematic roster reveal of the players ---- */
  if (phase === "intro") {
    const roster = players;
    return shell(
      <div className="relative flex flex-1 flex-col items-center justify-center py-4 mx-auto w-full max-w-3xl">
        {/* ambient globe backdrop */}
        <Globe
          players={WELCOME_GLOBE_PLAYERS}
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[130%] h-[36vh] opacity-20"
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 50% at 50% 30%, transparent, #101725 82%)" }} />

        <div className="relative w-full text-center">
          <p
            className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-cyan-300/80 mb-1"
            style={{ animation: reduceMotion ? undefined : "fade-in 0.5s ease-out both" }}
          >
            Meet the Syndicate
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-[0.14em] text-white mb-1"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              textShadow: "0 0 18px rgba(0,188,212,0.35)",
              animation: reduceMotion ? undefined : "fade-in 0.6s ease-out both",
            }}
          >
            THE PLAYERS
          </h2>
          <p
            className="text-white/60 text-[11px] sm:text-xs mb-5"
            style={{ animation: reduceMotion ? undefined : "fade-in 0.7s ease-out both" }}
          >
            Three operators enter. One empire remains.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {roster.map((p, i) => {
              const role = p.isHuman
                ? "You — the newcomer"
                : (p.profile?.personality ?? "").replace(/^\w/, (c) => c.toUpperCase());
              const blurb = p.isHuman
                ? "An ambitious upstart with everything to prove. Your move first."
                : p.profile?.blurb ?? "";
              const ability = p.isHuman ? null : p.profile?.ability ?? null;
              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col items-center rounded-2xl border bg-gradient-to-b from-white/[0.07] to-black/40 backdrop-blur-md p-4 text-center overflow-hidden"
                  style={{
                    borderColor: `${p.color}55`,
                    boxShadow: `0 10px 40px -18px ${p.color}, inset 0 0 0 1px rgba(255,255,255,0.04)`,
                    animation: reduceMotion
                      ? undefined
                      : `fade-in 0.6s ease-out both`,
                    animationDelay: reduceMotion ? undefined : `${0.35 + i * 0.28}s`,
                  }}
                >
                  {/* accent hairline */}
                  <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }}
                  />
                  {/* halo behind avatar */}
                  <div className="relative mb-3">
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-full blur-xl"
                      style={{ background: `${p.color}44` }}
                    />
                    <img
                      src={p.img}
                      alt={p.name}
                      width={96}
                      height={96}
                      className="relative rounded-full object-cover"
                      style={{
                        width: 96,
                        height: 96,
                        border: `2px solid ${p.color}`,
                        boxShadow: `0 0 18px ${p.color}66`,
                      }}
                    />
                    {p.isHuman && (
                      <span
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-mono font-bold tracking-widest text-black"
                        style={{ background: p.color }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-white leading-none mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {p.name}
                  </div>
                  <div
                    className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2"
                    style={{ color: p.color }}
                  >
                    {role}
                  </div>
                  {p.location?.city && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-white/60 mb-2">
                      <MapPin size={10} style={{ color: p.color }} />
                      <span className="truncate">{p.location.city}</span>
                    </div>
                  )}
                  <p className="text-[11px] leading-relaxed text-white/75">{blurb}</p>
                  {ability && (
                    <div
                      className="mt-3 w-full rounded-lg border px-2 py-1.5 text-[10px] font-mono leading-snug text-white/80"
                      style={{ borderColor: `${p.color}40`, background: `${p.color}12` }}
                    >
                      <span style={{ color: p.color }}>◆ </span>{ability}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => beginRound(1)}
            className="mt-6 w-full max-w-xs mx-auto rounded-lg py-3 font-mono font-bold tracking-[0.2em] text-black transition hover:brightness-110"
            style={{
              background: "linear-gradient(90deg,#f5b800,#ffd34d)",
              boxShadow: "0 0 20px rgba(245,184,0,0.3)",
              animation: reduceMotion ? undefined : "fade-in 0.6s ease-out both",
              animationDelay: reduceMotion ? undefined : "1.1s",
            }}
          >
            ENTER THE GAME
          </button>
        </div>
        {overlayNode}
      </div>
    );
  }


  /* ---- HUD (shared top bar for in-game phases) — orbital tactical layout ---- */
  const hud = human && (
    <div className="w-full space-y-4">
      {/* Rail header */}
      <h3 className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/65">Active Crews</h3>
      {/* ROW 1 — orbital player status cards */}
      <div className="grid grid-cols-3 gap-2.5">

        {players.map((p) => {
          const isActive = p.id === activeId;
          return (
            <div
              key={p.id}
              className="flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 min-w-0 overflow-hidden text-center transition"
              style={{
                borderColor: isActive ? `${p.color}` : "rgba(255,255,255,0.10)",
                background: isActive ? `${p.color}18` : "rgba(255,255,255,0.03)",
                boxShadow: isActive ? `0 0 18px -6px ${p.color}` : "none",
                opacity: p.alive ? 1 : 0.4,
              }}
            >
              <div className="relative shrink-0">
                <Avatar img={p.img} fallback={p.avatar} color={p.color} size={36} />
                {!p.alive && (
                  <Skull size={12} className="absolute -bottom-1 -right-1 text-red-400" />
                )}
              </div>
              <div className="min-w-0 w-full">
                {isActive ? (
                  <div
                    className="flex items-center justify-center gap-1 text-[9px] font-mono tracking-[0.15em] uppercase leading-none mb-0.5"
                    style={{ color: p.color }}
                  >
                    <span
                      className="inline-block w-1 h-1 rounded-full animate-pulse shrink-0"
                      style={{ background: p.color }}
                    />
                    ACTIVE
                  </div>
                ) : (
                  <div className="h-[9px] mb-0.5" aria-hidden />
                )}
                <div className="text-[11px] font-bold text-white leading-tight truncate">
                  {p.name}
                </div>
                <div className="flex items-center justify-center gap-0.5 text-[9px] text-white/70 leading-none mt-0.5">
                  <MapPin size={8} style={{ color: p.color }} className="shrink-0" />
                  <span className="truncate">{p.location?.city ?? "—"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GLOBE — prominent orbital world board */}
      {globePlayers.length > 0 && (
        <div className="relative h-[150px] lg:h-[180px] min-h-[150px] max-h-[180px] rounded-2xl overflow-hidden border border-white/20 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(0,188,212,0.10),transparent)]">
          {/* ambient orbital rings */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10 animate-[spin_40s_linear_infinite]"
            style={{ width: 260, height: 260 }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
            style={{ width: 220, height: 220 }}
          />
          {/* soft glow behind globe */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl"
            style={{ width: 180, height: 180 }}
          />
          <Globe
            players={globePlayers}
            attack={globeAttack}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {/* Combined status panel: cash + shields + heat + round */}
      <div className="rounded-2xl border border-white/20 bg-black/25 backdrop-blur-sm px-4 py-3.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]">
        {/* panel header */}
        <div className="mb-3">
          <p className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/65">Financial Assets</p>
        </div>


        {/* wealth progression chart — hidden on scoreboard (leaderboard already ranks cash) */}
        {phase !== "scoreboard" && <WealthChart players={players} />}

        {/* Shields + Heat — bordered console boxes */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
            <div className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/65">Shields</div>
            <div className="flex items-center gap-1">
              {Array.from({ length: START_TOKENS }).map((_, i) => (
                <Shield
                  key={i}
                  size={13}
                  style={{ color: i < human.tokens ? "#00bcd4" : "rgba(255,255,255,0.15)" }}
                  fill={i < human.tokens ? "#00bcd4" : "transparent"}
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
            <div className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/65">Heat %</div>
            <div className="flex items-center gap-1 text-orange-400 text-base font-mono font-bold leading-none">
              <Flame size={13} /> +{heatPct}%
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(round / TOTAL_ROUNDS) * 100}%`, background: "linear-gradient(90deg,#00bcd4,#f5b800)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );


  /* ---- Framed tactical command console: ticker header + HUD rail + gameplay + gold footer ---- */
  const gameLayout = (main: React.ReactNode) => (
    <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-black/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.9)] md:min-h-0 md:flex-1">
      {/* Top status ticker */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-white/20 bg-black/25 px-3 backdrop-blur-sm sm:px-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f5b800] motion-safe:animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#f5b800]">Uplink Stable</span>
        </div>
        <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
            {event ? `Global event · ${event.name}` : "Intercepting rival comms · tactical analysis pending"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 font-mono pr-24 sm:pr-28">
          <span className="text-[10px] uppercase tracking-widest text-white/55">Round</span>
          <span className="text-sm leading-none text-[#f5b800] tabular-nums">{round}/{TOTAL_ROUNDS}</span>
        </div>

      </div>

      {/* Body: HUD rail + gameplay pane */}
      <div className="flex flex-col gap-5 p-4 md:min-h-0 md:flex-1 md:grid md:grid-cols-[340px_minmax(0,1fr)] md:items-stretch md:gap-6 md:p-5">
        <aside className="min-w-0 md:min-h-0 md:overflow-y-auto md:pr-1.5">{hud}</aside>
        <main className="flex min-w-0 flex-col md:min-h-0 md:flex-1 md:overflow-y-auto">{main}</main>
      </div>

      {/* Gold footer accent */}
      <div className="h-0.5 shrink-0 bg-gradient-to-r from-transparent via-[#f5b800]/50 to-transparent" />
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
      <div className="w-full mb-2 animate-fade-in">
        <div
          className="relative flex items-start gap-3 rounded-2xl border px-3 py-1.5"

          style={{ borderColor: `${t.color}55`, background: t.bg, boxShadow: `0 0 30px -12px ${t.color}88` }}
        >
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl animate-pulse"
            style={{ background: `${t.color}22`, border: `1px solid ${t.color}66` }}
          >
            <Icon size={16} style={{ color: t.color }} />
          </span>

          <div className="min-w-0 flex-1">
            {opts.step && (
              <p className="font-mono text-[10px] tracking-[0.2em] mb-0.5" style={{ color: t.color }}>
                {opts.step} · YOUR COACH
              </p>
            )}
            <p className="text-white/85 text-[13px] leading-snug">{opts.text}</p>
          </div>
          <button
            onClick={toggleCoach}
            aria-label="Hide guide"
            className="shrink-0 text-white/55 hover:text-white/70 transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  };


  if (phase === "round-intro") {
    return shell(gameLayout(
      <>
        {coachBar({
          icon: event ? Flame : Crown,
          step: `ROUND ${round} · STEP 1`,
          tone: event ? "danger" : "info",
          text: event
            ? `A global event just hit: "${event.name}". It changes the odds this round — read the orange card, then tap CHOOSE OPERATION.`
            : "Every round starts here. The streets are calm right now. Tap CHOOSE OPERATION to see the jobs you can run.",
        })}
        <div className="text-center flex-1 flex flex-col items-center justify-center py-4">


          {event ? (
            <div className="mb-6 w-full flex justify-center">
              <EventScene event={event} />
            </div>
          ) : (
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(0,188,212,0.12),rgba(0,0,0,0.45)_60%)] px-6 py-8 text-center animate-scale-in">
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_30px_-8px_#22d3ee]">
                  <Shield size={30} className="text-cyan-300" />
                </span>
                <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-300">No Global Event</p>
                <h3 className="mt-1.5 text-2xl font-black tracking-tight text-white">All Quiet</h3>
                <p className="mt-2 text-sm text-white/70">The streets are calm. Standard odds apply this round.</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setPhase("choose")}
            className="rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
            style={{ background: "linear-gradient(90deg,#00bcd4,#5eead4)" }}
          >
            CHOOSE OPERATION
          </button>
        </div>
      </>
    ));
  }


  /* ---- CHOOSE ---- */
  if (phase === "choose") {
    return shell(gameLayout(
      <>
        {coachBar(

          selectedOp
            ? {
                icon: Dice5,
                step: "STEP 3",
                tone: "action",
                text: `You picked "${selectedOp.name}". Now tap SPIN THE WHEEL — most slices pay you, but a red slice means you're caught and lose a shield. Not sure? Tap "pick a different operation".`,
              }
            : {
                icon: Coins,
                step: "STEP 2",
                tone: "info",
                text: "Tap a card to run a job. Gold = cost, green = payout, eye = caught chance. Green cards are safe, purple are high-risk.",
              },

        )}
        {!selectedOp ? (
          <>
            {/* Ultra-compact visual key: icon + one word, no sentences */}
            <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono">
              <span className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/5 px-2 py-0.5 text-amber-300">
                <Coins size={12} /> COST
              </span>
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 text-emerald-300">
                <TrendingUp size={12} /> PAYOUT
              </span>
              <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-white/60">
                <Eye size={12} /> CAUGHT %
              </span>
              <span className="mx-1 h-4 w-px bg-white/10" />
              {(["low", "medium", "high", "veryhigh"] as RiskLevel[]).map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ color: RISK_THEME[r].glow, background: `${RISK_THEME[r].glow}12`, border: `1px solid ${RISK_THEME[r].glow}40` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: RISK_THEME[r].glow }} />
                  {RISK_LABEL[r]}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

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
                    className="group relative overflow-hidden rounded-2xl border p-1 text-left transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:-translate-y-1"
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
                      className="absolute top-1 right-1 z-10 text-[9px] font-mono font-bold px-1 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ color: theme.glow, background: `${theme.glow}22`, border: `1px solid ${theme.glow}66` }}
                    >
                      {RISK_LABEL[op.risk]}
                    </span>

                    {/* icon tile */}
                    <div className="relative z-10 flex items-center justify-center h-7 mb-0.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg border transition group-hover:scale-110"
                        style={{
                          borderColor: `${theme.glow}55`,
                          background: `radial-gradient(circle at 50% 40%, ${theme.glow}33, transparent 70%)`,
                          boxShadow: `inset 0 0 20px ${theme.glow}22`,
                        }}
                      >
                        <Icon size={14} style={{ color: theme.glow, filter: `drop-shadow(0 0 6px ${theme.glow}aa)` }} />
                      </span>
                    </div>


                    {/* title */}
                    <p className="relative z-10 font-black uppercase tracking-wide text-white text-[10px] leading-tight mb-0.5 min-h-[1.25em] line-clamp-1">
                      {op.name}
                    </p>
                    <p className="relative z-10 text-[9px] leading-tight text-white/75 mb-0.5 line-clamp-1">
                      {op.description}
                    </p>



                    {/* stat row + data bars (numbers preserved, visualised) */}
                    <div className="relative z-10 border-t border-white/20 pt-0.5 space-y-0">


                      {/* PAYOUT */}
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={10} style={{ color: theme.text }} className="shrink-0" />
                        <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(op.payout / MAX_PAYOUT) * 100}%`, background: theme.text }} />
                        </div>
                        <span className="w-9 text-right text-[10px] font-mono font-bold" style={{ color: theme.text }}>{fmtShort(op.payout)}</span>
                      </div>
                      {/* COST */}
                      <div className="flex items-center gap-1.5">
                        <Coins size={10} className="shrink-0 text-amber-300" />
                        <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-amber-300/80" style={{ width: `${(op.cost / MAX_COST) * 100}%` }} />
                        </div>
                        <span className="w-9 text-right text-[10px] font-mono text-amber-300">{fmtShort(op.cost)}</span>
                      </div>
                      {/* CAUGHT % */}
                      <div className="flex items-center gap-1.5">
                        <Eye size={10} className="shrink-0 text-rose-400" />
                        <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-rose-400/80" style={{ width: `${Math.min(100, eff)}%` }} />
                        </div>
                        <span className="w-9 text-right text-[10px] font-mono text-rose-300">{eff}%</span>
                      </div>
                    </div>


                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <WheelPopup accent="#f5b800">
            <WheelHeader eyebrow="RUNNING OPERATION" title={selectedOp.name} />
            <WheelStage accent="#f5b800">
              <Wheel segments={segments} rotation={rotation} spinning={spinning} />
            </WheelStage>
            <p className="mx-auto max-w-md text-center text-white/70 text-sm mt-3 leading-snug">
              {selectedOp.description}
            </p>
            <p className="text-center text-white/70 text-xs font-mono mt-2">
              Invested {fmt(selectedOp.cost)} · Caught {Math.round(effectiveCaught(selectedOp, round, event, 0) * 100)}%
            </p>
            <button
              onClick={spin}
              className="mx-auto mt-4 block rounded-lg px-10 py-3 font-mono font-bold text-black hover:brightness-110 transition"
              style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)", boxShadow: "0 0 24px rgba(245,184,0,0.4)" }}
            >
              SPIN THE WHEEL
            </button>
            <div className="mx-auto max-w-md">
              <WheelLegend />
            </div>
            <div className="mt-3 text-center">
              <button onClick={() => setSelectedOp(null)} className="text-white/65 text-xs hover:text-white/70">
                ← pick a different operation
              </button>
            </div>
          </WheelPopup>
        )}
      </>
    ));
  }


  /* ---- STRIKE (attack plays on the globe before the wheel appears) ---- */
  if (phase === "strike" && selectedOp) {
    const tgt = targetForOp(selectedOp.id, round * 31 + (human?.opsCompleted ?? 0));
    return shell(gameLayout(
      <>
        {coachBar({
          icon: Flame,
          step: "STEP 4",
          tone: "action",
          text: `Launching "${selectedOp.name}" against ${tgt.company} in ${tgt.city}. Watch the strike hit — the wheel is next.`,
        })}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="relative min-h-[420px] w-full flex-1 overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(0,188,212,0.12),transparent)]">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl"
              style={{ width: "92%", height: "92%" }}
            />
            <Globe
              players={globePlayers}
              attack={globeAttack}
              attackFocus
              flyover
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {/* target lock-on badge */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2 animate-fade-in">
              <span className="whitespace-nowrap rounded-full border border-red-500/50 bg-black/60 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-red-300 backdrop-blur-sm">
                ● Target acquired
              </span>
            </div>
          </div>
          {/* victim company readout — revealed as the fly-over lands on the target */}
          <div
            className="pointer-events-none absolute bottom-3 left-1/2 w-[min(94%,480px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-black/80 to-black/65 px-4 py-3 text-center shadow-[0_8px_40px_-8px_rgba(0,188,212,0.45)] ring-1 ring-white/5 backdrop-blur-md animate-scale-in motion-reduce:animate-fade-in sm:bottom-4 sm:px-5 sm:py-4"
            style={{ animationDelay: reduceMotion ? "0.1s" : "4.0s", animationFillMode: "backwards" }}
          >
            {/* accent hairline */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            />
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-cyan-300/70">Target location</p>
            <p className="mt-1 text-base font-black leading-tight tracking-wide text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.9)] sm:text-lg">
              {tgt.company}
            </p>
            <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-cyan-300">
              <span className="flex items-center gap-1"><MapPin size={11} /> {tgt.city}</span>
              <span className="text-white/25">·</span>
              <span className="text-white/70">{tgt.sector}</span>
            </p>
            <p className="mx-auto mt-1.5 max-w-[42ch] text-[11px] leading-snug text-white/70">{tgt.desc}</p>
            <p className="mt-2 font-mono text-[11px] text-[#f5b800] animate-pulse motion-reduce:animate-none">Deploying payload…</p>
          </div>
          {/* Let players who don't want the cinematic jump straight to the wheel. */}
          <button
            onClick={skipStrike}
            className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-sm transition hover:border-white/40 hover:text-white"
          >
            Skip →
          </button>
        </div>
      </>
    ));
  }

  /* ---- SPINNING ---- */
  if (phase === "spinning") {
    return shell(gameLayout(
      <>

        <WheelPopup accent="#f5b800">
          <WheelHeader eyebrow="RUNNING OPERATION" title={selectedOp?.name} />
          <WheelStage accent="#f5b800" active>
            <Wheel segments={segments} rotation={rotation} spinning={spinning} />
          </WheelStage>
          <p className="text-cyan-300 font-mono mt-5 animate-pulse text-center">Spinning…</p>
        </WheelPopup>
      </>
    ));
  }


  /* ---- OUTCOME ---- */
  if (phase === "outcome" && result) {
    const caughtEl = result.outcome === "caught";
    // Broke: not caught, but the operation drained the crew to $0 → eliminated.
    const brokeEl = !caughtEl && !!human && !human.alive;
    const good = result.delta > (selectedOp?.cost ?? 0);
    const net = result.delta - (selectedOp?.cost ?? 0);
    const accent = caughtEl || brokeEl ? "#ef4444" : good ? "#22c55e" : "#94a3b8";
    return shell(gameLayout(
      <>

        <WheelPopup accent={accent}>
          <WheelHeader eyebrow="OPERATION RESULT" title={selectedOp?.name} />
          <WheelStage accent={accent}>
            <Wheel segments={segments} rotation={rotation} spinning={false} />
          </WheelStage>

          <div className="mt-5 text-center animate-scale-in" role="status" aria-live="polite" aria-atomic="true">
            <div
              className="inline-block rounded-xl px-8 py-4 font-black text-2xl"
              style={{
                background: caughtEl || brokeEl ? "rgba(239,68,68,0.15)" : good ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.15)",
                border: `1px solid ${accent}`,
                color: caughtEl || brokeEl ? "#fca5a5" : good ? "#86efac" : "#cbd5e1",
              }}
            >
              {OUTCOME_LABEL[result.outcome]}
              {caughtEl && (result.eliminated ? " — Eliminated" : " — Shield Lost")}
              {brokeEl && " — Bankrupt"}
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
          {coachBar(
            caughtEl
              ? {
                  icon: Skull,
                  tone: "danger",
                  text: result.eliminated
                    ? "You've been caught with no shields left — your crew is out of the game. Watch how the rest plays out below."
                    : "Caught! You lost one shield token. When all shields are gone, you're eliminated — so weigh the risk next time.",
                }
              : brokeEl
                ? {
                    icon: Skull,
                    tone: "danger",
                    text: "You're broke — your fortune hit $0 and your crew is out of the game. Watch how the rest plays out below.",
                  }
                : {
                    icon: net >= 0 ? TrendingUp : Coins,
                    tone: net >= 0 ? "good" : "danger",
                    text:
                      net >= 0
                        ? "The job paid off — this is your net profit after costs. Tap the button below to watch your rivals move."
                        : "The job cost more than it earned this time. That happens — tap below to continue to your rivals' turn.",
                  },
          )}
          <button
            onClick={runAiTurns}
            className="mt-6 w-full rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
            style={{ background: "linear-gradient(90deg,#00bcd4,#5eead4)" }}
          >
            {human?.alive ? "RIVALS' TURN →" : "SEE THE FALLOUT →"}
          </button>
        </WheelPopup>
      </>
    ));

  }


  /* ---- AI TURNS (user-paced, step-by-step walk-through) ---- */
  if (phase === "ai") {
    const idx = Math.min(aiStep, Math.max(0, aiLog.length - 1));
    const turn = aiLog[idx];
    const skipAll = () => finishRound();

    const TurnIcon = turn ? OP_ICON[turn.op.id] ?? Skull : Skull;
    const theme = turn ? RISK_THEME[turn.op.risk] : RISK_THEME.low;
    const caught = turn ? !turn.player.alive : false;
    const delta = turn?.player.lastDelta ?? 0;
    const showResult = aiSub === "result";
    const isLast = aiStep >= aiLog.length - 1;

    return shell(gameLayout(
      <>
        {coachBar({

          icon: Eye,
          tone: "info",
          text:
            aiSub === "choice"
              ? "This rival has locked in their operation. Read it, then spin their wheel to see how it plays out."
              : aiSub === "spinning"
              ? "The wheel is deciding this rival's fate…"
              : "Here's their result. Tap continue to move on to the next rival.",
        })}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-cyan-300 text-sm">
            RIVAL {idx + 1} / {aiLog.length}
          </h2>
          <button onClick={skipAll} className="text-white/65 text-xs hover:text-white/70 font-mono">
            skip all →
          </button>
        </div>

        {/* progress dots */}
        <div className="flex gap-1.5 mb-5">
          {aiLog.map((_, k) => (
            <span
              key={k}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{ background: k < idx || (k === idx && showResult) ? "#00bcd4" : k === idx ? "#f5b800" : "rgba(255,255,255,0.12)" }}
            />
          ))}
        </div>

        {turn && aiSub === "choice" && (
          <div
            key={turn.player.id + aiStep}
            className="rounded-2xl border p-5 animate-fade-in"
            style={{
              borderColor: showResult && caught ? "rgba(239,68,68,0.5)" : `${theme.glow}55`,
              background: showResult && caught ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
              boxShadow: `0 8px 30px -14px ${showResult && caught ? "#ef4444" : theme.glow}88`,
            }}
          >
            {/* rival identity */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar img={turn.player.img} fallback={turn.player.avatar} color={turn.player.color} size={44} />
              <div>
                <p className="font-bold text-lg leading-tight" style={{ color: turn.player.color }}>
                  {turn.player.name}
                </p>
                <p className="text-white/70 text-xs font-mono">
                  {aiSub === "choice" ? "chose an operation" : aiSub === "spinning" ? "spinning the wheel…" : "result is in"}
                </p>
              </div>
            </div>

            {/* the chosen operation — highlighted */}
            <div
              className="flex items-center gap-3 rounded-xl border p-3 mb-4 transition-all"
              style={{
                borderColor: `${theme.glow}66`,
                background: `${theme.glow}10`,
                boxShadow: aiSub === "choice" ? `0 0 0 1px ${theme.glow}55, 0 0 22px -6px ${theme.glow}88` : undefined,
              }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  borderColor: `${theme.glow}55`,
                  background: `radial-gradient(circle at 50% 40%, ${theme.glow}33, transparent 70%)`,
                }}
              >
                <TurnIcon size={22} style={{ color: theme.glow, filter: `drop-shadow(0 0 6px ${theme.glow}aa)` }} />
              </span>
              <div className="min-w-0">
                <p className="font-black uppercase tracking-wide text-white text-sm leading-tight truncate">
                  {turn.op.name}
                </p>
                <div className="flex items-center gap-3 text-[10px] font-mono mt-1">
                  <span className="flex items-center gap-0.5 text-amber-300"><Coins size={11} />{fmtShort(turn.op.cost)}</span>
                  <span className="flex items-center gap-0.5" style={{ color: theme.text }}><TrendingUp size={11} />{fmtShort(turn.op.payout)}</span>
                  <span className="flex items-center gap-0.5 text-white/75"><Eye size={11} />{turn.caughtPct}%</span>
                </div>
              </div>
            </div>

            {/* victim target readout — shown for every rival attack */}
            {(() => {
              const tgt = targetForOp(turn.op.id, round * 31 + aiStep * 7);
              return (
                <div className="flex items-start gap-2.5 rounded-xl border border-white/12 bg-black/30 p-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10">
                    <MapPin size={15} className="text-red-300" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                      Target · {tgt.city}
                    </p>
                    <p className="text-sm font-bold text-white leading-tight truncate">{tgt.company}</p>
                    <p className="text-[11px] leading-snug text-white/60">{tgt.desc}</p>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* pacing control — rivals spin automatically; result advances from the popup */}
        {aiSub === "choice" && (
          <div className="text-center mt-6">
            <span className="inline-block rounded-lg px-8 py-3 font-mono font-bold text-black/80 animate-pulse"
              style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)" }}
            >
              SPINNING UP…
            </span>
          </div>
        )}

        {/* wheel sequence popup — same premium treatment as the player's own spins */}
        {turn && (aiSub === "spinning" || aiSub === "result") && (
          <WheelPopup accent={showResult && caught ? "#ef4444" : theme.glow}>
            <WheelHeader
              eyebrow={`${turn.player.name.toUpperCase()} · RUNNING OPERATION`}
              title={turn.op.name}
            />
            <WheelStage accent={showResult && caught ? "#ef4444" : theme.glow} active={aiSub === "spinning"}>
              <Wheel segments={turn.segs} rotation={aiRotation} spinning={aiSub === "spinning"} />
            </WheelStage>
            {aiSub === "spinning" && (
              <p className="text-cyan-300 font-mono mt-5 animate-pulse text-center">Spinning…</p>
            )}
            {showResult && (
              <div className="mt-5 text-center animate-scale-in">
                <div
                  className="inline-block rounded-xl px-8 py-4 font-black text-2xl"
                  style={{
                    background: `${caught ? "#ef4444" : theme.glow}18`,
                    border: `1px solid ${caught ? "#ef4444" : theme.glow}`,
                    color: caught ? "#fca5a5" : theme.glow,
                  }}
                >
                  {caught ? "Caught — Shield Lost" : turn.player.lastLabel}
                </div>
                <p className={`mt-3 text-xl font-mono font-bold ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {delta >= 0 ? "+" : ""}{fmt(delta)}
                </p>
                {turn.player.quip && (
                  <p className="mt-3 text-sm italic text-white/55">"{turn.player.quip}"</p>
                )}
                <button
                  onClick={advanceAi}
                  className="mt-6 w-full rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
                  style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)" }}
                >
                  {isLast ? "SEE LEADERBOARD →" : "NEXT RIVAL →"}
                </button>
              </div>
            )}
          </WheelPopup>
        )}


        {/* recap of rivals already resolved */}
        {idx > 0 && aiSub === "choice" && (
          <div className="mt-6 space-y-1.5">
            {aiLog.slice(0, idx).map((t) => {
              const c = !t.player.alive;
              const d = t.player.lastDelta ?? 0;
              return (
                <div key={t.player.id} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/[0.05] px-3 py-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <Avatar img={t.player.img} fallback={t.player.avatar} color={t.player.color} size={22} />
                    <span className="font-bold text-sm truncate" style={{ color: t.player.color }}>{t.player.name}</span>
                    <span className="text-white/60 text-xs truncate">{t.op.name}</span>
                  </span>
                  <span className={`font-mono text-sm shrink-0 ${d >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {c ? <span className="text-red-500 font-bold">Caught</span> : `${d >= 0 ? "+" : ""}${fmt(d)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </>
    ));

  }



  /* ---- SCOREBOARD ---- */
  if (phase === "scoreboard") {
    return shell(gameLayout(
      <>
        {coachBar({

          icon: BarChart3,
          step: "STEP 4",
          tone: "action",
          text: "The round is over. You're ranked by cash — gold row is you, shields show lives left. Goal: be the richest crew still standing. Tap NEXT ROUND to keep going.",
        })}
        <h2 className="text-center font-mono text-cyan-300 mb-4 text-sm">LEADERBOARD</h2>

        {(() => {
          const maxCash = Math.max(1, ...ranked.map((p) => Math.max(0, p.cash)));
          return (
        <div className="space-y-2">
          {ranked.map((p, i) => {
            const barColor = p.isHuman ? "#f5b800" : p.color;
            const barW = (Math.max(0, p.cash) / maxCash) * 100;
            return (
            <div
              key={p.id}
              className="rounded-lg border px-4 py-3"
              style={{
                borderColor: p.isHuman ? "rgba(245,184,0,0.5)" : "rgba(255,255,255,0.1)",
                background: p.alive ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.08)",
                opacity: p.alive ? 1 : 0.7,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="font-mono text-white/65 w-5 text-sm">{i + 1}</span>
                  <Avatar img={p.img} fallback={p.avatar} color={p.isHuman ? "#f5b800" : p.color} size={32} />
                  <span className="font-bold" style={{ color: p.isHuman ? "#f5b800" : p.color }}>
                    {p.name}{p.isHuman && " (you)"}
                  </span>
                  {!p.alive && <span className="text-red-500 font-bold text-xs font-mono px-2 py-0.5 rounded bg-red-500/15">Out</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="flex gap-0.5">
                    {Array.from({ length: p.tokens }).map((_, k) => (
                      <Shield key={k} size={13} style={{ color: "#00bcd4" }} fill="#00bcd4" />
                    ))}
                  </span>
                  <span className="font-mono font-bold text-white tabular-nums">{fmt(p.cash)}</span>
                </span>
              </div>
              {/* cash comparison bar (number preserved above) */}
              <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barW}%`, background: barColor, boxShadow: `0 0 8px ${barColor}88` }}
                />
              </div>
            </div>
            );
          })}
        </div>
          );
        })()}

        <div className="text-center mt-6">
          <button
            onClick={nextRound}
            className="rounded-lg px-8 py-3 font-mono font-bold text-black hover:brightness-110 transition"
            style={{ background: "linear-gradient(90deg,#f5b800,#ffd34d)" }}
          >
            {players.filter((p) => p.alive).length <= 1 || round >= TOTAL_ROUNDS ? "SEE RESULTS →" : "NEXT ROUND →"}
          </button>
        </div>
      </>
    ));

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
      return { label, name: p.name, avatar: p.avatar, img: p.img, color: p.color, val: fmtVal(p) };
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
    ].filter(Boolean) as { label: string; name: string; avatar: string; img?: string; color: string; val: string }[];

    return shell(
      <div className="max-w-2xl mx-auto text-center">
        <Crown size={52} style={{ color: "#f5b800" }} className="mx-auto mb-3 drop-shadow-[0_0_18px_rgba(245,184,0,0.6)]" />
        <p className="font-mono text-cyan-300 text-sm">CHAMPION</p>
        <div className="flex items-center justify-center gap-3 mb-1">
          <Avatar img={champion.img} fallback={champion.avatar} color="#f5b800" size={56} />
          <h1 className="text-5xl font-black text-white" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {champion.name}
          </h1>
        </div>
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
            <div key={s.label} className="rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-white/65 font-mono uppercase tracking-wide">{s.label}</div>
                <div className="font-bold flex items-center gap-1.5" style={{ color: s.color }}>
                  <Avatar img={s.img} fallback={s.avatar} color={s.color} size={22} />{s.name}
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
              className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 border border-white/25 hover:border-cyan-400/50 text-white/70"
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
            className="rounded-lg px-4 py-2 text-xs font-mono flex items-center gap-1.5 border border-white/25 bg-white/[0.05] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
          >
            <BarChart3 size={14} /> Statistics
          </button>
          <button
            onClick={() => { setUnlockedIds(loadUnlocked()); setOverlay("achievements"); }}
            className="rounded-lg px-4 py-2 text-xs font-mono flex items-center gap-1.5 border border-white/25 bg-white/[0.05] text-white/70 hover:text-white hover:border-cyan-400/50 transition"
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


function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/[0.06] px-3 py-2">
      <div className="text-[10px] text-white/65 font-mono uppercase tracking-wide">{label}</div>
      <div className="font-mono font-bold text-white text-sm">{value}</div>
    </div>
  );
}
