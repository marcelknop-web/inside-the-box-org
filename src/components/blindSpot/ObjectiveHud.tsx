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

const STEPS: Array<{ key: ObjectiveStep; label: string; hint: string }> = [
  { key: "watch", label: "Watch incoming alerts", hint: "Read the SIEM / OT alerts as they land on the left panel." },
  { key: "engage", label: "Engage in team chat", hint: "Post your read of the situation in the team chat on the right." },
  { key: "decide", label: "Commit your call", hint: "Post your decision in the chat — it gets recorded as your call." },
];

export const ObjectiveHud = ({ phase, totalPhases, userRoleName, step, alertsCount, userMsgCount }: Props) => {
  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const current = STEPS[stepIdx];

  return (
    <div className="rounded-lg border border-[#f5b800]/40 bg-gradient-to-r from-[#f5b800]/10 via-background/60 to-background/40 px-3 py-2 shrink-0">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Phase pill */}
        <div className={`inline-flex font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 rounded border ${phaseColor(phase.colorKey)}`}>
          Phase {phase.index}/{totalPhases} · {phase.timestamp}
        </div>

        {/* Step tracker */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          {STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded border transition-colors ${
                    active
                      ? "border-[#f5b800] text-[#f5b800] bg-[#f5b800]/10"
                      : done
                      ? "border-emerald-400/40 text-emerald-300/80 bg-emerald-400/5"
                      : "border-white/10 text-white/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#f5b800] animate-pulse" : done ? "bg-emerald-400" : "bg-white/20"}`} />
                  {done ? "✓ " : ""}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <span className="text-white/15 font-mono">→</span>}
              </div>
            );
          })}
        </div>

        {/* You play */}
        <p className="font-mono text-[10px] text-white/50 uppercase tracking-wider">
          You: <span className="text-[#f5b800]">{userRoleName}</span>
        </p>
      </div>

      {/* Next-action hint */}
      <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-white/65">
        <span className="text-[#f5b800] animate-pulse">▶</span>
        <span className="text-white/80">Next:</span>
        <span>{current?.hint}</span>
        <span className="ml-auto text-white/40">
          alerts {alertsCount} · your msgs {userMsgCount}
        </span>
      </div>
    </div>
  );
};
