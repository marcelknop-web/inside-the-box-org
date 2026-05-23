import { Phase } from "@/data/blindSpotScenario";
import { Radar, ShieldAlert, ShieldCheck, RotateCcw, BookOpen, Flame } from "lucide-react";

type VerdictTier = "sharp" | "solid" | "mixed" | "drift";

interface Props {
  currentPhase: 1 | 2 | 3 | 4 | "debrief";
  phases: Phase[];
  /** Consecutive phases scored ≥ 70. ≥2 reveals a subtle momentum chip. */
  streak?: number;
  /** Brief post-commit verdict pulse. Auto-cleared by parent. */
  verdict?: { tier: VerdictTier; label: string; score: number } | null;
}


/**
 * IEC 62443 Incident Response Lifecycle visualisation.
 * Maps the 4 scenario phases + debrief to the canonical IR stages
 * referenced by IEC 62443-2-1 (Detect → Contain → Respond → Recover → Learn).
 * Designed as a high-impact top-of-screen progress rail to train players
 * in situating themselves within the standard's lifecycle.
 */

type StageKey = 1 | 2 | 3 | 4 | "debrief";

interface Stage {
  key: StageKey;
  short: string;          // top label (IEC stage)
  code: string;           // IEC clause reference
  sub: string;            // scenario phase label
  Icon: typeof Radar;
}

const STAGES: Stage[] = [
  { key: 1,         short: "Detect",   code: "62443-3-3 · SR 6.x", sub: "Initial Anomaly",      Icon: Radar },
  { key: 2,         short: "Contain",  code: "62443-3-3 · SR 5.2", sub: "Confirmed Compromise", Icon: ShieldAlert },
  { key: 3,         short: "Respond",  code: "62443-2-1 · IR",     sub: "Safety Threshold",     Icon: ShieldCheck },
  { key: 4,         short: "Recover",  code: "62443-2-1 · Recov.", sub: "Recovery Decision",    Icon: RotateCcw },
  { key: "debrief", short: "Learn",    code: "62443-2-1 · LL",     sub: "Debrief",              Icon: BookOpen },
];

const stateOf = (stage: StageKey, current: StageKey): "past" | "current" | "future" => {
  if (stage === current) return "current";
  if (current === "debrief") return "past";
  if (stage === "debrief") return "future";
  return (stage as number) < (current as number) ? "past" : "future";
};

export const PhaseProgress = ({ currentPhase, streak = 0, verdict = null }: Props) => {
  const total = STAGES.length;
  const currentIdx = STAGES.findIndex((s) => s.key === currentPhase);
  const progressPct = currentIdx <= 0 ? 0 : (currentIdx / (total - 1)) * 100;

  const verdictColor =
    verdict?.tier === "sharp" ? "text-[#f5b800] border-[#f5b800]/60 bg-[#f5b800]/10"
    : verdict?.tier === "solid" ? "text-[#a0e85b] border-[#a0e85b]/50 bg-[#a0e85b]/10"
    : verdict?.tier === "mixed" ? "text-amber-300 border-amber-300/50 bg-amber-300/10"
    : "text-rose-300 border-rose-300/50 bg-rose-300/10";

  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-black/60 to-transparent">
      <div className="max-w-[1600px] mx-auto px-4 pt-4 pb-3">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-3 font-mono text-[10px] uppercase tracking-[0.22em]">
          <div className="flex items-center gap-2 text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800] animate-pulse" />
            <span>IEC 62443 · Incident Response Lifecycle</span>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <span
                key={streak}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#f5b800]/50 bg-[#f5b800]/10 text-[#f5b800] animate-[fade-in_240ms_ease-out]"
                title="Consecutive solid calls"
              >
                <Flame className="w-3 h-3" strokeWidth={2.5} />
                <span>Momentum ×{streak}</span>
              </span>
            )}
            <div className="text-white/40 hidden sm:block">
              Stage <span className="text-[#f5b800]">{Math.max(currentIdx + 1, 1)}</span>
              <span className="text-white/30"> / {total}</span>
            </div>
          </div>
        </div>


        {/* Rail */}
        <div className="relative">
          {/* Base track */}
          <div className="absolute left-0 right-0 top-[18px] h-px bg-white/10" />
          {/* Filled track */}
          <div
            className="absolute left-0 top-[18px] h-px bg-gradient-to-r from-[#f5b800] via-[#f5b800] to-[#00bcd4] transition-all duration-700 ease-out shadow-[0_0_8px_rgba(245,184,0,0.6)]"
            style={{ width: `${progressPct}%` }}
          />

          {/* Nodes */}
          <ol className="relative grid grid-cols-5 gap-2">
            {STAGES.map((s) => {
              const state = stateOf(s.key, currentPhase);
              const Icon = s.Icon;

              const ring =
                state === "current"
                  ? "border-[#f5b800] bg-[#f5b800]/15 text-[#f5b800] shadow-[0_0_0_4px_rgba(245,184,0,0.12),0_0_18px_rgba(245,184,0,0.45)]"
                  : state === "past"
                  ? "border-[#f5b800]/60 bg-[#f5b800]/10 text-[#f5b800]/80"
                  : "border-white/15 bg-black/60 text-white/30";

              const labelColor =
                state === "current"
                  ? "text-[#f5b800]"
                  : state === "past"
                  ? "text-white/70"
                  : "text-white/35";

              return (
                <li key={String(s.key)} className="flex flex-col items-center text-center min-w-0">
                  <div
                    className={`relative z-10 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${ring}`}
                  >
                    {state === "current" && (
                      <span className="absolute inset-0 rounded-full border border-[#f5b800]/40 animate-ping" />
                    )}
                    <Icon className="w-4 h-4" strokeWidth={2.25} />
                  </div>

                  <div className={`mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${labelColor}`}>
                    {s.short}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30 mt-0.5 truncate max-w-full">
                    {s.code}
                  </div>
                  <div
                    className={`hidden md:block text-[10px] mt-1 truncate max-w-full ${
                      state === "current" ? "text-white/70" : "text-white/30"
                    }`}
                  >
                    {s.sub}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
};
