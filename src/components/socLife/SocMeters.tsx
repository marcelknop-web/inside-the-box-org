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
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/60 min-w-[40px]">
        <div className={cn("h-full transition-all", color)} style={{ width: `${v}%` }} />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-foreground/70 w-7 text-right">
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
    <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Status block */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("font-mono text-[11px] uppercase tracking-wider", statusColor)}>
            ● {statusLabel}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {mins}:{secs} · {isNight ? t("socLife.night") : t("socLife.day")}
          </span>
        </div>

        {/* Meters in one line */}
        <div className="flex-1 grid grid-cols-1 gap-1.5 min-w-[220px] sm:grid-cols-3 sm:gap-3">
          <Meter label={t("socLife.meterReputation")} value={reputation} color="bg-primary" />
          <Meter label={t("socLife.meterStress")} value={stress} color={stress > 70 ? "bg-rose-500" : "bg-amber-400"} />
          <Meter label={t("socLife.meterCoffee")} value={coffee} color="bg-cyan-400" />
        </div>

        {/* Score */}
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
