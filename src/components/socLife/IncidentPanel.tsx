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
  // Defensive guarantee: if a scenario somehow ships without an explicit
  // `correct: true` flag, mark the highest-delta option as the textbook
  // answer so players always have a "right" textbook choice on offer.
  const safeOptions = useMemo(() => {
    if (step.options.length === 0) return step.options;
    if (step.options.some((o) => o.correct)) return step.options;
    const best = step.options.reduce(
      (acc, opt) => (opt.delta > acc.delta ? opt : acc),
      step.options[0],
    );
    return step.options.map((o) => (o === best ? { ...o, correct: true } : o));
  }, [step.options]);
  const shuffledOptions = useMemo(
    () => shuffleOptions(safeOptions, `${sessionSeed}:${incident.id}:${step.id}`),
    [safeOptions, incident.id, step.id, sessionSeed],
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
  // unlock each section one at a time with a pause between them.
  //
  // SCOPE OF THE ANIMATION:
  //   • Title (1) and Brief (2) belong to the *incident* — they only
  //     animate ONCE when a new incident arrives. On subsequent step
  //     transitions inside the same incident they stay fully visible
  //     so the user isn't forced to re-read what they already know.
  //   • Meta (3) updates instantly (room hint + timer change per step).
  //   • Prompt (4) is the only block that re-animates on every step,
  //     because it's genuinely new copy each time.
  //
  // Keying:
  //   – incidentKey changes only when the incident itself changes, so the
  //     title/brief cascade does not restart mid-incident.
  //   – stepKey changes per step, driving the prompt re-type.
  const incidentKey = incident.id;
  const stepKey = `${incident.id}:${stepIndex}`;
  const isFirstStep = stepIndex === 0;

  // T+0     klaxon already firing, panel mounts
  // T+700   title starts typing (blinking)         — only on incident arrival
  // After title typed + 1100ms pause → brief        — only on incident arrival
  // Step transitions: title/brief stay; prompt re-types after a short beat.
  const titleStarts = useDelayedFlag(700, [incidentKey]);

  const typedTitle  = useTypewriter(titleText, 26, titleStarts);
  const titleDone   = titleStarts && typedTitle.length >= titleText.length;

  const briefStarts = useDelayedFlag(1100, [titleDone]) && titleDone;
  const typedBrief  = useTypewriter(briefText, 16, briefStarts);
  const briefDone   = briefStarts && typedBrief.length >= briefText.length;

  // For step ≥ 2 the title/brief are already fully shown — gate the rest
  // on stepKey directly so meta + prompt revive immediately for the new step
  // without waiting on a (no-op) title cascade.
  // We must always call both hooks (Rules of Hooks) and pick at render time.
  const metaAfterBrief = useDelayedFlag(900, [briefDone]) && briefDone;
  const metaAfterStep  = useDelayedFlag(150, [stepKey]);
  const metaStarts     = isFirstStep ? metaAfterBrief : metaAfterStep;

  const promptStarts = metaStarts;
  const typedPrompt  = useTypewriter(promptText, 18, promptStarts);
  const promptDone   = promptStarts && typedPrompt.length >= promptText.length;

  const actionsReady = useDelayedFlag(500, [promptDone]) && promptDone;

  // Section label — small uppercase tag that prefixes each major block of
  // the briefing ticket. Active sections (still typing) glow rose, completed
  // ones turn emerald, untouched ones stay muted. Replaces the old numeric
  // pills for a more "ops console" feel.
  const sectionLabel = (label: string, active: boolean, done: boolean) => (
    <div
      className={cn(
        "mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]",
        done && "text-emerald-300/90",
        active && !done && "text-rose-200 animate-pulse",
        !active && !done && "text-muted-foreground/60",
      )}
    >
      <span
        className={cn(
          "h-px flex-1 max-w-[14px]",
          done && "bg-emerald-400/50",
          active && !done && "bg-rose-400/60",
          !active && !done && "bg-muted-foreground/30",
        )}
      />
      <span>{label}</span>
      <span
        className={cn(
          "h-px flex-1",
          done && "bg-emerald-400/30",
          active && !done && "bg-rose-400/40",
          !active && !done && "bg-muted-foreground/20",
        )}
      />
    </div>
  );

  // Short, stable ticket id — gives each inject a SOC-ticket feel.
  const ticketId = useMemo(() => {
    const base = `${incident.id}`.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "INJECT";
    return `INC-${base}-${String(stepIndex + 1).padStart(2, "0")}`;
  }, [incident.id, stepIndex]);

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
    <div className="rounded-lg border border-rose-500/40 bg-background/95 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2),0_10px_40px_-10px_hsl(var(--destructive)/0.35)] max-w-full overflow-hidden">
      {/* === TICKET HEADER BANNER ===
          A solid bar that reads instantly as "incoming SOC ticket":
          severity tag · ticket id · step counter. Distinct background so
          the eye registers it as the metadata strip, separate from body. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em]">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className={cn("text-rose-300 shrink-0", !titleDone && "animate-pulse")}>
            ▲ {t("incomingIncident")}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-sm border px-1.5 py-px text-[9px] font-bold tracking-[0.1em]",
              tierClasses[tier],
            )}
          >
            {tierLabel[tier]}
          </span>
          <span className="hidden md:inline text-muted-foreground/70 truncate">· {ticketId}</span>
        </div>
        <span className="text-muted-foreground shrink-0 tabular-nums ml-auto">
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>

      <div className="p-4 space-y-4">

        {/* ============== SECTION 1 — BRIEFING ==============
            Headline + plain-language summary. Highest visual weight: this
            is the "what just happened" block the analyst must read first. */}
        <section>
          {sectionLabel(t("briefingLabel") ?? "Briefing", !titleDone || (showBrief && !briefDone), briefDone)}
          <h3
            className={cn(
              "font-mono text-base sm:text-lg break-words min-h-[1.5em] leading-snug",
              titleDone ? "text-foreground" : "text-rose-200",
              !titleDone && "animate-pulse",
            )}
          >
            {typedTitle || (titleStarts ? "" : "…")}
            {titleStarts && !titleDone && (
              <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-rose-300 animate-pulse" />
            )}
          </h3>
          {showBrief && (
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground break-words min-h-[2.4em] leading-relaxed animate-fade-in">
              {typedBrief}
              {!briefDone && <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-muted-foreground animate-pulse" />}
            </p>
          )}
        </section>

        {/* ============== SECTION 2 — SITUATION ==============
            Operational metadata as a compact key/value strip + timer bar.
            Designed to be glanceable: where do I need to be, how long do I
            have. Sits in a subdued container so it doesn't fight the body. */}
        {showMeta && (
          <section className="animate-fade-in">
            {sectionLabel(t("situationLabel") ?? "Situation", false, true)}
            <div className="rounded-md border border-border/50 bg-background/60 px-3 py-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
                <div className="flex flex-col min-w-0">
                  <span className="text-muted-foreground/70 uppercase tracking-wider text-[9px]">
                    {t("incidentRoomHint")}
                  </span>
                  <span className={cn("font-semibold break-words leading-tight", inRightRoom ? "text-emerald-400" : "text-cyan-300")}>
                    {requiredRoom ? t(`rooms.${requiredRoom.i18n}.name`) : "—"}
                  </span>
                </div>
                <div className="flex flex-col min-w-0 text-right">
                  <span className="text-muted-foreground/70 uppercase tracking-wider text-[9px]">
                    {t("timeLeft")}
                  </span>
                  <span className={cn("font-semibold tabular-nums", sec <= 5 ? "text-rose-400 animate-pulse" : "text-foreground")}>
                    {sec}s
                  </span>
                </div>
              </div>
              {/* Timer bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-sm border border-border/50 bg-background/80">
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
          </section>
        )}

        {/* ============== SECTION 3 — DECISION ==============
            The actual ask: prompt copy + answer options (or "go to room"
            redirect). Boxed so the actionable area is unambiguous. */}
        {showPrompt && (
          <section className="animate-fade-in">
            {sectionLabel(t("decisionLabel") ?? "Decision", !promptDone, promptDone)}
            <div className="rounded-md border border-border/60 bg-card/40 p-3 space-y-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 break-words mb-1">
                  {step.title[lang]}
                </div>
                <div className="text-sm text-foreground break-words min-h-[1.4em] leading-relaxed">
                  {typedPrompt}
                  {!promptDone && <span className="ml-0.5 inline-block w-1.5 h-3 align-middle bg-foreground/60 animate-pulse" />}
                </div>
              </div>

              {showActions && (
                <div className="animate-fade-in">
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
                          className="justify-start whitespace-normal text-left h-auto py-2 px-3 font-sans gap-2 hover:border-primary/60 hover:bg-primary/5"
                          onClick={() => onChoose(opt.id)}
                        >
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border bg-background/60 font-mono text-[10px] font-bold text-muted-foreground">
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
          </section>
        )}
      </div>
    </div>
  );
}
