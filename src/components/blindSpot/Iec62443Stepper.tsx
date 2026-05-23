interface Step {
  key: string;
  label: string;
  /** Which scenario phase indexes (1..4) map to this IR step. */
  phases: number[];
}

/** IEC 62443-2-1 / IEC 62443-3-2 incident response lifecycle, mapped to the
 *  4 scenario phases. Shown as a thin orientation strip above the HUD so the
 *  player always knows where they are in the standard. */
const STEPS: Step[] = [
  { key: "detect",     label: "Detection",   phases: [1] },
  { key: "triage",     label: "Triage",      phases: [1] },
  { key: "contain",    label: "Containment", phases: [2] },
  { key: "eradicate",  label: "Eradication", phases: [3] },
  { key: "recover",    label: "Recovery",    phases: [4] },
  { key: "lessons",    label: "Lessons Learned", phases: [] },
];

interface Props {
  phaseIndex: number; // 1..4
}

export const Iec62443Stepper = ({ phaseIndex }: Props) => {
  // Index of the first step that owns this phase
  const activeIdx = STEPS.findIndex((s) => s.phases.includes(phaseIndex));

  return (
    <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
          IEC 62443 · Incident response lifecycle
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-white/35 hidden sm:inline">
          Orientation
        </span>
      </div>

      <ol className="flex items-center gap-1 w-full overflow-x-auto">
        {STEPS.map((s, i) => {
          const isActive = i === activeIdx;
          const isDone = activeIdx >= 0 && i < activeIdx;
          const dot =
            isActive
              ? "bg-[#f5b800] border-[#f5b800] shadow-[0_0_10px_rgba(245,184,0,0.6)]"
              : isDone
              ? "bg-[#f5b800]/70 border-[#f5b800]/70"
              : "bg-transparent border-white/25";
          const text =
            isActive
              ? "text-[#f5b800]"
              : isDone
              ? "text-white/65"
              : "text-white/40";
          const connector = isDone || isActive ? "bg-[#f5b800]/50" : "bg-white/10";
          return (
            <li key={s.key} className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full border ${dot} transition-all`}
                  aria-hidden
                />
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider whitespace-nowrap ${text}`}
                >
                  {isActive ? "▸ " : ""}{s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`hidden md:inline-block w-6 h-px ${connector}`} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
