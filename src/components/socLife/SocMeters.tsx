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

function bar(value: number, color: string) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/60">
      <div className={cn("h-full transition-all", color)} style={{ width: `${v}%` }} />
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
    <div className="rounded-lg border border-border/40 bg-background/40 p-3 font-mono text-xs">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-wider text-muted-foreground">
            {t("socLife.shift")} {mins}:{secs}
          </span>
          <span className="uppercase tracking-wider text-muted-foreground">
            {isNight ? t("socLife.night") : t("socLife.day")}
          </span>
        </div>
        <span className={cn("uppercase tracking-wider", statusColor)}>● {statusLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <div className="mb-1 flex justify-between"><span>{t("socLife.meterReputation")}</span><span>{Math.round(reputation)}</span></div>
          {bar(reputation, "bg-primary")}
        </div>
        <div>
          <div className="mb-1 flex justify-between"><span>{t("socLife.meterStress")}</span><span>{Math.round(stress)}</span></div>
          {bar(stress, stress > 70 ? "bg-rose-500" : "bg-amber-400")}
        </div>
        <div>
          <div className="mb-1 flex justify-between"><span>{t("socLife.meterCoffee")}</span><span>{Math.round(coffee)}</span></div>
          {bar(coffee, "bg-cyan-400")}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2">
        <span className="uppercase tracking-wider text-muted-foreground">{t("socLife.score")}</span>
        <span className="text-base text-primary">{score}</span>
      </div>
    </div>
  );
}
