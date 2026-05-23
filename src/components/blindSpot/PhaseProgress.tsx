import { Phase } from "@/data/blindSpotScenario";

interface Props {
  currentPhase: 1 | 2 | 3 | 4 | "debrief";
  phases: Phase[];
}

export const PhaseProgress = ({ currentPhase, phases }: Props) => {
  const steps = [
    ...phases.map((p) => ({ label: `P${p.index}`, key: p.index as number | "debrief" })),
    { label: "Debrief", key: "debrief" as const },
  ];

  return (
    <div className="flex items-center gap-2 justify-center py-4 font-mono text-xs">
      {steps.map((s, i) => {
        const isCurrent = s.key === currentPhase;
        const isPast =
          (typeof currentPhase === "number" && typeof s.key === "number" && s.key < currentPhase) ||
          (currentPhase === "debrief" && s.key !== "debrief");
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                isCurrent
                  ? "border-[#f5b800] text-[#f5b800] bg-[#f5b800]/10"
                  : isPast
                  ? "border-white/30 text-white/60"
                  : "border-white/10 text-white/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrent
                    ? "bg-[#f5b800] animate-pulse"
                    : isPast
                    ? "bg-white/40"
                    : "bg-white/10"
                }`}
              />
              {s.label}
            </div>
            {i < steps.length - 1 && <span className="text-white/20">·</span>}
          </div>
        );
      })}
    </div>
  );
};
