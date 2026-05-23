import { Phase, phaseColor } from "@/data/blindSpotScenario";

export type ObjectiveStep = "watch" | "engage" | "decide";

interface Props {
  phase: Phase;
  totalPhases: number;
  userRoleName: string;
  step: ObjectiveStep;
  alertsCount: number;
  userMsgCount: number;
}

const HINTS: Record<ObjectiveStep, string> = {
  watch: "Read the incoming alerts on the left.",
  engage: "Talk it through with the team in chat.",
  decide: "Post your call in chat — it's recorded as your decision.",
};

export const ObjectiveHud = ({ phase, totalPhases, userRoleName, step }: Props) => {
  return (
    <div className="rounded-lg border border-[#f5b800]/30 bg-background/40 px-3 py-2 shrink-0 flex items-center gap-3 flex-wrap">
      <div className={`inline-flex font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border ${phaseColor(phase.colorKey)}`}>
        Phase {phase.index}/{totalPhases}
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[240px] text-[12px] font-mono">
        <span className="text-[#f5b800] animate-pulse">▶</span>
        <span className="text-white/85">{HINTS[step]}</span>
      </div>

      <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
        You · <span className="text-[#f5b800]">{userRoleName}</span>
      </p>
    </div>
  );
};
