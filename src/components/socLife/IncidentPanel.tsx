import { useEffect, useMemo, useState } from "react";
import { Incident, PlaybookStep, ROOMS, RoomId, Lang, IncidentTier } from "@/data/socLifeData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVariantT } from "./variantContext";

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
  const { t, language } = useVariantT();
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

  // Localized strings used by the typewriters below.
  const titleText  = incident.title[lang];
  const briefText  = incident.brief[lang];
  const promptText = step.prompt[lang];

  // === Sequenced reveal cascade ===
  // The klaxon sound has just played in SocLife when the incident spawns.
  // We give the user a beat to LOOK before any text starts typing, then
  // unlock each section one at a time with a pause between them so the eye
  // can track the order: alarm → title (blinking) → brief → meta → prompt
  // → actions.
  //
  // IMPORTANT: We key the cascade on `${incident.id}:${stepIndex}` only
  // (NOT on `step.id`) so React-fast-refresh, language toggles or other
  // re-renders that produce a fresh `step` reference don't accidentally
  // restart the cascade mid-way through.
  const stepKey = `${incident.id}:${stepIndex}`;
  // T+0     klaxon already firing, panel mounts
  // T+700   title starts typing (blinking)
  // After title typed + 1100ms pause → brief
  // After brief typed +  900ms pause → meta + prompt
  // After prompt typed + 500ms pause → actions
  const titleStarts = useDelayedFlag(700, [stepKey]);

  const typedTitle  = useTypewriter(titleText, 26, titleStarts);
  const titleDone   = titleStarts && typedTitle.length >= titleText.length;

  const briefStarts = useDelayedFlag(1100, [titleDone]) && titleDone;
  const typedBrief  = useTypewriter(briefText, 16, briefStarts);
  const briefDone   = briefStarts && typedBrief.length >= briefText.length;

  const metaStarts  = useDelayedFlag(900, [briefDone]) && briefDone;

  const promptStarts = metaStarts;
  const typedPrompt  = useTypewriter(promptText, 18, promptStarts);
  const promptDone   = promptStarts && typedPrompt.length >= promptText.length;

  const actionsReady = useDelayedFlag(500, [promptDone]) && promptDone;

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

  const showTitleRow = true;       // always visible (cursor blinks while waiting)
  const showBrief    = briefStarts;
  const showMeta     = metaStarts;
  const showPrompt   = promptStarts;
  const showActions  = actionsReady;

  // Difficulty-tier badge — quick visual cue of how hard the current incident
  // is supposed to be. Colour follows the existing semantic palette so it
  // reads at a glance: routine = cool/calm, major = hot.
  const tier: IncidentTier = incident.tier ?? "medium";
  const tierLabel: Record<IncidentTier, string> = {
    easy:   t("tierEasy"),
    medium: t("tierMedium"),
    hard:   t("tierHard"),
    comic:  t("tierComic"),
  };
  const tierClasses: Record<IncidentTier, string> = {
    easy:   "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    hard:   "border-rose-500/50 bg-rose-500/15 text-rose-200",
    comic:  "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  };

  return (
    <div className="rounded-lg border border-rose-500/40 bg-background/95 p-4 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)] max-w-full overflow-hidden">
      <div className="mb-3 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("text-rose-300 truncate", !titleDone && "animate-pulse")}>▲ {t("incomingIncident")}</span>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1.5 py-px text-[9px] font-bold tracking-[0.12em]",
              tierClasses[tier],
            )}
          >
            {tierLabel[tier]}
          </span>
        </div>
        <span className="text-muted-foreground shrink-0">{stepIndex + 1} / {totalSteps}</span>
      </div>

      {/* 1 — Title (blinks while waiting/typing for emphasis) */}
      <div className="mb-3 flex items-start gap-2">
        {stepNum(1, !titleDone, titleDone)}
        <h3
          className={cn(
            "font-mono text-base sm:text-lg break-words min-h-[1.5em] leading-snug flex-1",
            titleDone ? "text-foreground" : "text-rose-200",
            !titleDone && "animate-pulse",
          )}
        >
          {typedTitle || (titleStarts ? "" : "…")}
          {titleStarts && !titleDone && (
            <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-rose-300 animate-pulse" />
          )}
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
              {t("incidentRoomHint")}:{" "}
              <span className={cn("ml-1", inRightRoom ? "text-emerald-400" : "text-cyan-300")}>
                {requiredRoom ? t(`rooms.${requiredRoom.i18n}.name`) : "—"}
              </span>
            </span>
            <span className="text-muted-foreground">
              {t("timeLeft")}: <span className={cn("ml-1", sec <= 5 ? "text-rose-400 animate-pulse" : "text-foreground")}>{sec}s</span>
            </span>
          </div>
          {/* Timer bar — tick marks on a calm track, smoothly draining fill,
              colour shifts from cyan → amber → rose as time runs out. */}
          <div className="relative h-2 w-full overflow-hidden rounded-sm border border-border/50 bg-background/80">
            {/* Subtle tick marks every 10% for a "studio meter" feel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, transparent 0, transparent calc(10% - 1px), hsl(var(--border)) calc(10% - 1px), hsl(var(--border)) 10%)",
              }}
            />
            <div
              className={cn(
                "h-full transition-[width,background-color] duration-150 ease-linear",
                sec <= 5
                  ? "bg-rose-500 shadow-[0_0_6px_hsl(var(--destructive)/0.6)]"
                  : sec <= 10
                  ? "bg-amber-400"
                  : "bg-cyan-400",
              )}
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
                {t("feedback.chooseRoomFirst")}
              </div>
              {onGoToRoom && (
                <Button
                  variant="default"
                  className="w-full justify-center font-mono"
                  onClick={() => onGoToRoom(step.requiredRoom!)}
                >
                  → {t("feedback.goToRoomCta")}: {t(`rooms.${requiredRoom.i18n}.name`)}
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
