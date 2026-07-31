import { countBySeverity, type Finding } from "@/utils/marsecQualityCheck";

interface Props {
  findings: Finding[];
  onRepair: () => void;
  repairing: boolean;
}

export default function QualityPanel({ findings, onRepair, repairing }: Props) {
  const { blockers, warnings } = countBySeverity(findings);
  const clean = findings.length === 0;

  return (
    <div className={`rounded-2xl border bg-white p-5 ${clean ? "border-emerald-300" : blockers ? "border-[#D6003C]/40" : "border-amber-300"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0B2239]/60">Quality check</h4>
          <p className={`mt-1 text-sm font-semibold ${clean ? "text-emerald-700" : blockers ? "text-[#D6003C]" : "text-amber-700"}`}>
            {clean
              ? "All checks passed — exercise is internally consistent."
              : `${blockers} blocker${blockers === 1 ? "" : "s"} · ${warnings} warning${warnings === 1 ? "" : "s"}`}
          </p>
        </div>
        {!clean && (
          <button
            onClick={onRepair}
            disabled={repairing}
            className="px-4 py-2 rounded-full bg-[#0B2239] text-white text-xs font-semibold hover:bg-[#0B2239]/85 disabled:opacity-40"
          >
            {repairing ? "Repairing …" : "Repair with AI"}
          </button>
        )}
      </div>

      {!clean && (
        <ul className="mt-4 space-y-2">
          {findings.map((f) => (
            <li key={f.id} className="rounded-xl border border-[#0B2239]/10 bg-[#F5F7FA] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full ${
                    f.severity === "blocker" ? "bg-[#D6003C] text-white" : "bg-amber-400 text-[#3a2a00]"
                  }`}
                >
                  {f.severity}
                </span>
                <span className="text-[13px] font-semibold">{f.rule}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-[#0B2239]/70">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
