import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Incident, PlaybookStep, ROOMS, RoomId, Lang } from "@/data/socLifeData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Letter-by-letter reveal — guides the user's eye to incoming briefing text.
 *  When `start` is false the typewriter sits at empty so we can sequence
 *  reveals with explicit pauses between sections. */
function useTypewriter(text: string, msPerChar = 18, start = true) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text || !start) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar, start]);
  return shown;
}

/** Fires `true` after `delayMs`, resets on dependency change. */
function useDelayedFlag(delayMs: number, deps: unknown[] = []): boolean {
  const [ready, setReady] = useState(delayMs <= 0);
  useEffect(() => {
    setReady(delayMs <= 0);
    if (delayMs <= 0) return;
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ready;
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

  // Numbered, sequential reveal — each block "unlocks" only when the previous
  // typewriter has finished, so the eye knows exactly where to look next.
  const stepNum = (n: number, active: boolean, done: boolean) => (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold",
        done && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
        active && !done && "bg-rose-500/30 text-rose-200 border border-rose-400/60 animate-pulse",
        !active && !done && "bg-muted/30 text-muted-foreground/50 border border-muted/30",
      )}
    >
      {n}
    </span>
  );

  const showBrief = titleDone;
  const showMeta = briefDone;
  const showPrompt = briefDone;
  const promptDone = typedPrompt.length >= promptText.length;
  const showActions = promptDone;

  return (
    <div className="rounded-lg border border-rose-500/40 bg-background/95 p-4 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)] max-w-full overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
        <span className="text-rose-300 truncate">▲ {t("socLife.incomingIncident")}</span>
        <span className="text-muted-foreground shrink-0">{stepIndex + 1} / {totalSteps}</span>
      </div>

      {/* 1 — Title */}
      <div className="mb-3 flex items-start gap-2">
        {stepNum(1, !titleDone, titleDone)}
        <h3 className="font-mono text-base sm:text-lg text-foreground break-words min-h-[1.5em] leading-snug flex-1">
          {typedTitle}
          {!titleDone && <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-rose-300 animate-pulse" />}
        </h3>
      </div>

      {/* 2 — Brief */}
      {showBrief && (
        <div className="mb-3 flex items-start gap-2 animate-fade-in">
          {stepNum(2, !briefDone, briefDone)}
          <p className="text-xs sm:text-sm text-muted-foreground break-words min-h-[2.4em] leading-relaxed flex-1">
            {typedBrief}
            {!briefDone && <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-muted-foreground animate-pulse" />}
          </p>
        </div>
      )}

      {/* 3 — Meta (room + timer) */}
      {showMeta && (
        <div className="mb-3 ml-7 animate-fade-in">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono uppercase tracking-wider mb-2">
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
          <div className="h-1 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className={cn("h-full transition-[width] duration-100", sec <= 5 ? "bg-rose-500" : "bg-cyan-400")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* 4 — Prompt */}
      {showPrompt && (
        <div className="mb-3 flex items-start gap-2 animate-fade-in">
          {stepNum(4, !promptDone, promptDone)}
          <div className="flex-1">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground break-words mb-1">
              {step.title[lang]}
            </div>
            <div className="text-sm text-foreground break-words min-h-[1.4em] leading-relaxed">
              {typedPrompt}
              {!promptDone && <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-foreground/60 animate-pulse" />}
            </div>
          </div>
        </div>
      )}

      {/* 5 — Action area: only after the prompt is fully revealed AND user is in the right room */}
      {showActions && (
        <div className="ml-7 animate-fade-in">
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
              {shuffledOptions.map((opt, i) => (
                <Button
                  key={opt.id}
                  variant="outline"
                  className="justify-start whitespace-normal text-left h-auto py-2 px-3 font-sans gap-2"
                  onClick={() => onChoose(opt.id)}
                >
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt.label[lang]}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
