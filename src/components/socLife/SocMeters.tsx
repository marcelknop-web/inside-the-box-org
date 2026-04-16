import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface MetersProps {
  reputation: number; // 0-100
  stress: number; // 0-100
  coffee: number; // 0-100
  score: number;
  shift: number; // seconds elapsed
  isNight: boolean;
  status: "calm" | "oncall" | "incident";
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  // Mobile: compact 3-letter label, no numeric readout (saves vertical+horizontal space).
  const short = label.slice(0, 3);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-8 sm:w-14">
        <span className="sm:hidden">{short}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/60 min-w-[30px]">
        <div className={cn("h-full transition-all", color)} style={{ width: `${v}%` }} />
      </div>
      <span className="hidden sm:inline font-mono text-[10px] tabular-nums text-foreground/70 w-7 text-right">
        {Math.round(v)}
      </span>
    </div>
  );
}

export function SocMeters({ reputation, stress, coffee, score, shift, isNight, status }: MetersProps) {
  const { t } = useLanguage();
  const mins = Math.floor(shift / 60).toString().padStart(2, "0");
  const secs = (shift % 60).toString().padStart(2, "0");
  const statusLabel =
    status === "calm" ? t("socLife.statusCalm") :
    status === "oncall" ? t("socLife.statusOnCall") :
    t("socLife.statusIncident");
  const statusColor =
    status === "calm" ? "text-emerald-400" :
    status === "oncall" ? "text-amber-300" :
    "text-rose-400 animate-pulse";

  return (
    <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5 sm:px-3 sm:py-2">
      {/* Mobile: single row — status + 3 mini meters + score. No wrap. */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className={cn("font-mono text-[10px] uppercase tracking-wider shrink-0", statusColor)}>
          ●
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground shrink-0">
          {mins}:{secs}
        </span>
        <div className="flex-1 grid grid-cols-3 gap-1.5 min-w-0">
          <Meter label={t("socLife.meterReputation")} value={reputation} color="bg-primary" />
          <Meter label={t("socLife.meterStress")} value={stress} color={stress > 70 ? "bg-rose-500" : "bg-amber-400"} />
          <Meter label={t("socLife.meterCoffee")} value={coffee} color="bg-cyan-400" />
        </div>
        <span className="font-mono text-sm tabular-nums text-primary shrink-0">{score}</span>
      </div>

      {/* Desktop / tablet: original layout with full labels and numbers. */}
      <div className="hidden sm:flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("font-mono text-[11px] uppercase tracking-wider", statusColor)}>
            ● {statusLabel}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {mins}:{secs} · {isNight ? t("socLife.night") : t("socLife.day")}
          </span>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-3 min-w-[220px]">
          <Meter label={t("socLife.meterReputation")} value={reputation} color="bg-primary" />
          <Meter label={t("socLife.meterStress")} value={stress} color={stress > 70 ? "bg-rose-500" : "bg-amber-400"} />
          <Meter label={t("socLife.meterCoffee")} value={coffee} color="bg-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("socLife.score")}
          </span>
          <span className="font-mono text-base tabular-nums text-primary">{score}</span>
        </div>
      </div>
    </div>
  );
}
