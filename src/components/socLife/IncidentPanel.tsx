import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Incident, PlaybookStep, ROOMS, RoomId, Lang } from "@/data/socLifeData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Letter-by-letter reveal — guides the user's eye to incoming briefing text. */
function useTypewriter(text: string, msPerChar = 18) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar]);
  return shown;
}

interface IncidentPanelProps {
  incident: Incident;
  step: PlaybookStep;
  stepIndex: number;
  totalSteps: number;
  currentRoom: RoomId;
  timeLeftMs: number;
  onChoose: (optionId: string) => void;
  onGoToRoom?: (room: RoomId) => void;
}

// Deterministic Fisher-Yates shuffle seeded by incident+step so the order
// stays stable while the same step is shown, but differs between steps and runs.
function shuffleOptions<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function IncidentPanel({
  incident, step, stepIndex, totalSteps, currentRoom, timeLeftMs, onChoose, onGoToRoom,
}: IncidentPanelProps) {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  // Reseed per page-load too, so refresh varies the order.
  const sessionSeed = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const shuffledOptions = useMemo(
    () => shuffleOptions(step.options, `${sessionSeed}:${incident.id}:${step.id}`),
    [step, incident.id, sessionSeed],
  );
  const inRightRoom = step.requiredRoom == null || step.requiredRoom === currentRoom;
  const requiredRoom = step.requiredRoom
    ? ROOMS.find((r) => r.id === step.requiredRoom)
    : null;
  const pct = Math.max(0, Math.min(100, (timeLeftMs / step.timeLimitMs) * 100));
  const sec = Math.max(0, Math.ceil(timeLeftMs / 1000));

  // Typewriter reveals: title first, then brief, then prompt.
  // Each text restarts whenever the underlying string changes (new step / incident).
  const titleText = incident.title[lang];
  const briefText = incident.brief[lang];
  const promptText = step.prompt[lang];
  const typedTitle = useTypewriter(titleText, 22);
  const typedBrief = useTypewriter(briefText, 16);
  const typedPrompt = useTypewriter(promptText, 18);
  const titleDone = typedTitle.length >= titleText.length;
  const briefDone = typedBrief.length >= briefText.length;

  return (
    <div className="rounded-lg border border-rose-500/40 bg-background/95 p-4 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)] max-w-full overflow-hidden">
      <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
        <span className="text-rose-300 truncate">▲ {t("socLife.incomingIncident")}</span>
        <span className="text-muted-foreground shrink-0">{stepIndex + 1} / {totalSteps}</span>
      </div>

      <h3 className="font-mono text-base sm:text-lg text-foreground break-words min-h-[1.5em]">
        {typedTitle}
        {!titleDone && <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-rose-300 animate-pulse" />}
      </h3>
      <p className="mb-3 text-xs sm:text-sm text-muted-foreground break-words min-h-[2.4em]">
        {typedBrief}
        {titleDone && !briefDone && <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-muted-foreground animate-pulse" />}
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-wider">
        <span className="text-muted-foreground break-words">
          {t("socLife.incidentRoomHint")}:{" "}
          <span className={cn("ml-1", inRightRoom ? "text-emerald-400" : "text-cyan-300")}>
            {requiredRoom ? t(`socLife.rooms.${requiredRoom.i18n}.name`) : "—"}
          </span>
        </span>
        <span className="text-muted-foreground">
          {t("socLife.timeLeft")}: <span className={cn("ml-1", sec <= 5 ? "text-rose-400 animate-pulse" : "text-foreground")}>{sec}s</span>
        </span>
      </div>

      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-background/60">
        <div
          className={cn("h-full transition-[width] duration-100", sec <= 5 ? "bg-rose-500" : "bg-cyan-400")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mb-2">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground break-words">
          {step.title[lang]}
        </div>
        <div className="text-sm text-foreground break-words min-h-[1.4em]">{typedPrompt}</div>
      </div>

      {!inRightRoom && requiredRoom ? (
        <div className="space-y-2">
          <div className="rounded-md border border-cyan-400/40 bg-cyan-400/10 p-3 font-mono text-xs text-cyan-200">
            {t("socLife.feedback.chooseRoomFirst")}
          </div>
          {onGoToRoom && (
            <Button
              variant="default"
              className="w-full justify-center font-mono"
              onClick={() => onGoToRoom(step.requiredRoom!)}
            >
              → {t("socLife.feedback.goToRoomCta")}: {t(`socLife.rooms.${requiredRoom.i18n}.name`)}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {shuffledOptions.map((opt) => (
            <Button
              key={opt.id}
              variant="outline"
              className="justify-start whitespace-normal text-left h-auto py-2 px-3 font-sans"
              onClick={() => onChoose(opt.id)}
            >
              {opt.label[lang]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
