import { useLanguage } from "@/i18n/LanguageContext";
import { Incident, PlaybookStep, ROOMS, RoomId } from "@/data/socLifeData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IncidentPanelProps {
  incident: Incident;
  step: PlaybookStep;
  stepIndex: number;
  totalSteps: number;
  currentRoom: RoomId;
  timeLeftMs: number;
  onChoose: (optionId: string) => void;
}

export function IncidentPanel({
  incident, step, stepIndex, totalSteps, currentRoom, timeLeftMs, onChoose,
}: IncidentPanelProps) {
  const { t } = useLanguage();
  const inRightRoom = step.requiredRoom == null || step.requiredRoom === currentRoom;
  const requiredRoom = step.requiredRoom
    ? ROOMS.find((r) => r.id === step.requiredRoom)
    : null;
  const pct = Math.max(0, Math.min(100, (timeLeftMs / step.timeLimitMs) * 100));
  const sec = Math.max(0, Math.ceil(timeLeftMs / 1000));

  const stepBase = `socLife.incidents.${incident.i18nBase}.steps.${step.i18nBase}`;

  return (
    <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
        <span className="text-rose-300">▲ {t("socLife.incomingIncident")}</span>
        <span className="text-muted-foreground">{stepIndex + 1} / {totalSteps}</span>
      </div>

      <h3 className="font-mono text-lg text-foreground">
        {t(`socLife.incidents.${incident.i18nBase}.title`)}
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        {t(`socLife.incidents.${incident.i18nBase}.brief`)}
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-wider">
        <span className="text-muted-foreground">
          {t("socLife.incidentRoomHint")}:{" "}
          <span className={cn("ml-1", inRightRoom ? "text-emerald-400" : "text-cyan-300")}>
            {requiredRoom ? t(`socLife.rooms.${requiredRoom.i18n}.name`) : "—"}
          </span>
        </span>
        <span className="text-muted-foreground">
          {t("socLife.timeLeft")}: <span className={cn("ml-1", sec <= 5 ? "text-rose-400 animate-pulse" : "text-foreground")}>{sec}s</span>
        </span>
      </div>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className={cn("h-full transition-[width] duration-100", sec <= 5 ? "bg-rose-500" : "bg-cyan-400")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mb-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {t(`${stepBase}.title`)}
        </div>
        <div className="text-sm text-foreground">{t(`${stepBase}.prompt`)}</div>
      </div>

      {!inRightRoom && requiredRoom && (
        <div className="mb-3 rounded-md border border-cyan-400/40 bg-cyan-400/10 p-2 font-mono text-xs text-cyan-200">
          {t("socLife.feedback.wrongRoomMsg")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {step.options.map((opt) => (
          <Button
            key={opt.id}
            variant="outline"
            disabled={!inRightRoom}
            className="justify-start whitespace-normal text-left h-auto py-2 px-3 font-sans"
            onClick={() => onChoose(opt.id)}
          >
            {t(`${stepBase}.options.${opt.i18nKey}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
