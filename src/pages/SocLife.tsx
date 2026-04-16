import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocLifeAudio } from "@/hooks/useSocLifeAudio";
import {
  Incident, INCIDENTS, PlaybookStep,
  ROOMS, RoomId, COMIC_INCIDENT_IDS,
} from "@/data/socLifeData";
import { DollHouse } from "@/components/socLife/DollHouse";
import { SocMeters } from "@/components/socLife/SocMeters";
import { IncidentPanel } from "@/components/socLife/IncidentPanel";
import { RoomActions, IdleAction } from "@/components/socLife/RoomActions";
import { ConsequenceOverlay, ConsequenceData } from "@/components/socLife/ConsequenceOverlay";
import { Onboarding } from "@/components/socLife/Onboarding";
import { reasonFor } from "@/data/socLifeReasons";

const TICK_MS = 250;
const MIN_INCIDENT_GAP_MS = 18_000;
const MAX_INCIDENT_GAP_MS = 38_000;

// Progressive time pressure: the first few incidents give the player generous
// thinking time, then each subsequent incident shortens the per-step deadline
// until we hit a hard floor. This way newcomers aren't punished for reading,
// but veterans still feel the heat as their shift wears on.
//   incident #1 → 1.60×   (ample time to read brief, choose room, decide)
//   incident #2 → 1.45×
//   incident #3 → 1.30×
//   incident #4 → 1.15×
//   incident #5 → 1.00×   (designer-authored baseline)
//   incident #6 → 0.90×
//   incident #7 → 0.80×
//   incident #8+ → 0.70×  (floor)
// Absolute minimum per step: 8 seconds — never less, no matter the multiplier.
const TIME_PRESSURE_CURVE = [1.6, 1.45, 1.3, 1.15, 1.0, 0.9, 0.8, 0.7];
const MIN_STEP_TIME_MS = 8_000;
function stepTimeFor(baseMs: number, incidentsCompleted: number): number {
  const idx = Math.min(incidentsCompleted, TIME_PRESSURE_CURVE.length - 1);
  const mult = TIME_PRESSURE_CURVE[idx];
  return Math.max(MIN_STEP_TIME_MS, Math.round(baseMs * mult));
}

export default function SocLife() {
  const { t, language } = useLanguage();
  const audio = useSocLifeAudio();

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  // Slight delay before showing the "Restart" CTA on game over so the user
  // can read what happened first instead of being rushed into another run.
  const [gameOverActionsReady, setGameOverActionsReady] = useState(false);

  const [currentRoom, setCurrentRoom] = useState<RoomId>("soc_floor");
  const [reputation, setReputation] = useState(70);
  const [stress, setStress] = useState(20);
  const [coffee, setCoffee] = useState(60);
  const [score, setScore] = useState(0);
  const [shiftSec, setShiftSec] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Onboarding: shown after "Start shift" on first ever visit, otherwise on demand
  // via the "?" button on the welcome screen. Never shown before the user opts in.
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const closeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try { window.localStorage.setItem("socLife.onboarded", "1"); } catch { /* ignore */ }
  }, []);

  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  // When set, a prominent consequence overlay is shown and the step timer pauses
  // until the user clicks "Continue". This forces the player to actually read
  // the outcome before the next step kicks in.
  const [consequence, setConsequence] = useState<ConsequenceData | null>(null);
  // Delay the visual room-highlight on the floor plan until after the player
  // has had time to read the incident title + brief in the side panel.
  // Without this, the cyan pulse "spoils" where to go before a human could
  // possibly have read the story — felt robotic.
  const [revealRequiredRoom, setRevealRequiredRoom] = useState(false);
  const nextIncidentAtRef = useRef<number>(0);
  // Shuffle-bag: each of the 10 scenarios appears once per cycle, then reshuffles.
  const incidentBagRef = useRef<Incident[]>([]);

  const refillBag = useCallback(() => {
    const arr = [...INCIDENTS];
    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    incidentBagRef.current = arr;
  }, []);

  const isNight = useMemo(() => {
    // 6 minutes day / 4 minutes night cycle for variety
    const cycle = shiftSec % 600;
    return cycle >= 360;
  }, [shiftSec]);

  const status: "calm" | "oncall" | "incident" =
    activeIncident ? "incident" : (isNight ? "oncall" : "calm");

  // Reset + delay the floor-plan room-highlight whenever a new incident or
  // step starts. ~3.2 s lines up with the panel's title-then-brief reveal,
  // so a human reads the story first and then sees where to go.
  useEffect(() => {
    if (!activeIncident) { setRevealRequiredRoom(false); return; }
    setRevealRequiredRoom(false);
    const id = window.setTimeout(() => setRevealRequiredRoom(true), 3200);
    return () => window.clearTimeout(id);
  }, [activeIncident, stepIdx]);

  // ----- Sound: switch loops based on status (incl. comic-relief "audit" mode) -----
  useEffect(() => {
    if (!started || !audio.enabled) return;
    if (activeIncident) {
      audio.setMusicMode(COMIC_INCIDENT_IDS.has(activeIncident.id) ? "audit" : "alert");
    } else {
      audio.setMusicMode("calm");
    }
  }, [activeIncident, started, audio]);

  // ----- Main game tick -----
  useEffect(() => {
    if (!started || paused || gameOver) return;
    const id = window.setInterval(() => {
      setShiftSec((s) => s + TICK_MS / 1000);

      // Idle drains
      setCoffee((c) => Math.max(0, c - 0.06));
      setStress((s) => {
        let next = s + 0.08;
        if (coffee < 20) next += 0.05;
        if (activeIncident) next += 0.25;
        return Math.min(100, Math.max(0, next));
      });

      // Reputation slowly recovers if no incident & stress low
      if (!activeIncident) {
        setReputation((r) => (stress < 50 ? Math.min(100, r + 0.02) : r));
      }

      // Step timer countdown — paused while a consequence overlay is shown
      if (activeIncident && !consequence) {
        setStepTimeLeft((t2) => {
          const next = t2 - TICK_MS;
          if (next <= 0) {
            // timeout -> escalate
            handleTimeout();
            return 0;
          }
          return next;
        });
      } else if (!activeIncident) {
        // Schedule next incident
        const now = Date.now();
        if (nextIncidentAtRef.current === 0) {
          nextIncidentAtRef.current = now + randIncidentDelay();
        } else if (now >= nextIncidentAtRef.current) {
          spawnIncident();
        }
      }

      // Game over conditions
      if (reputation <= 0) {
        setGameOver(true);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, paused, gameOver, activeIncident, reputation, stress, coffee, consequence]);

  function randIncidentDelay() {
    return MIN_INCIDENT_GAP_MS + Math.random() * (MAX_INCIDENT_GAP_MS - MIN_INCIDENT_GAP_MS);
  }

  const spawnIncident = useCallback(() => {
    if (incidentBagRef.current.length === 0) refillBag();
    const inc = incidentBagRef.current.shift()!;
    setActiveIncident(inc);
    setStepIdx(0);
    setStepTimeLeft(inc.steps[0].timeLimitMs);
    setConsequence(null);
    nextIncidentAtRef.current = 0;
    audio.playSfx("incident_klaxon", 0.6);
    toast(t("socLife.incomingIncident"), {
      description: inc.title[language as "de" | "en" | "fr"],
      duration: 2200,
    });
  }, [audio, t, refillBag, language]);

  const finishIncident = useCallback((escalated: boolean) => {
    setActiveIncident(null);
    setStepIdx(0);
    setStepTimeLeft(0);
    setConsequence(null);
    nextIncidentAtRef.current = Date.now() + randIncidentDelay();
    if (escalated) {
      audio.playSfx("escalation", 0.5);
      toast.error(t("socLife.incidentEscalated"), { duration: 1800 });
      setReputation((r) => Math.max(0, r - 10));
    } else {
      audio.playSfx("success_chime", 0.55);
      toast.success(t("socLife.incidentResolved"), { duration: 1800 });
      setScore((s) => s + 50);
    }
  }, [audio, t]);

  function handleTimeout() {
    audio.playSfx("fail_buzz", 0.5);
    toast.error(t("socLife.feedback.timeout"), { duration: 1600 });
    setReputation((r) => Math.max(0, r - 8));
    finishIncident(true);
  }

  const handleChoose = useCallback((optionId: string) => {
    if (!activeIncident || consequence || paused) return; // ignore clicks while overlay is up or paused
    const step = activeIncident.steps[stepIdx];
    const opt = step.options.find((o) => o.id === optionId);
    if (!opt) return;
    if (step.requiredRoom && step.requiredRoom !== currentRoom) return;

    // Apply effects immediately so meters react in real time, but DON'T advance
    // the step yet — we want the player to read the consequence first.
    const stressDelta = opt.correct ? -2 : +6;
    setReputation((r) => Math.max(0, Math.min(100, r + opt.delta)));
    setStress((s) => Math.min(100, Math.max(0, s + stressDelta)));
    if (opt.correct) setScore((s) => s + 10);

    audio.playSfx(opt.correct ? "success_chime" : "fail_buzz", 0.45);

    const bestAnswer = step.options.find((o) => o.correct);
    setConsequence({
      optionLabel: opt.label[language as "de" | "en" | "fr"],
      correct: opt.correct,
      repDelta: opt.delta,
      stressDelta,
      reason: reasonFor(step, opt, language as "de" | "en" | "fr"),
      bestAnswerLabel: !opt.correct && bestAnswer
        ? bestAnswer.label[language as "de" | "en" | "fr"]
        : undefined,
    });
  }, [activeIncident, stepIdx, currentRoom, audio, language, consequence, paused]);

  // Called when the player dismisses the consequence overlay — only now do we
  // advance to the next step (or finish the incident).
  const continueAfterConsequence = useCallback(() => {
    if (!activeIncident) { setConsequence(null); return; }
    const nextIdx = stepIdx + 1;
    setConsequence(null);
    if (nextIdx >= activeIncident.steps.length) {
      finishIncident(false);
    } else {
      setStepIdx(nextIdx);
      const next: PlaybookStep = activeIncident.steps[nextIdx];
      setStepTimeLeft(next.timeLimitMs);
    }
  }, [activeIncident, stepIdx, finishIncident]);

  const handleMove = useCallback((room: RoomId) => {
    setCurrentRoom(room);
    audio.playSfx("footstep", 0.4);
  }, [audio]);

  const handleIdle = useCallback((action: IdleAction) => {
    audio.playSfx("click_ui", 0.3);
    switch (action) {
      case "coffee":
        setCoffee((c) => Math.min(100, c + 20));
        setStress((s) => Math.max(0, s - 10));
        break;
      case "threat_intel":
        setReputation((r) => Math.min(100, r + 2));
        break;
      case "playbook":
        setReputation((r) => Math.min(100, r + 3));
        setStress((s) => Math.min(100, s + 5));
        break;
      case "smalltalk":
        setStress((s) => Math.max(0, s - 8));
        break;
      case "stretch":
        setStress((s) => Math.max(0, s - 5));
        break;
    }
    toast(t(`socLife.idle.${action}.name`), {
      description: t(`socLife.idle.${action}.result`),
      duration: 1400,
    });
  }, [audio, t]);

  const startShift = async () => {
    audio.setEnabled(true);
    setStarted(true);
    setPaused(false);
    setGameOver(false);
    setGameOverActionsReady(false);
    setReputation(70);
    setStress(20);
    setCoffee(60);
    setScore(0);
    setShiftSec(0);
    setActiveIncident(null);
    setStepIdx(0);
    setConsequence(null);
    setCurrentRoom("soc_floor");
    refillBag();
    nextIncidentAtRef.current = Date.now() + 6_000;
    audio.setMusicMode("calm");
    // First-time visitors see the intro right after starting their shift,
    // so they actually know what they're about to do.
    try {
      if (!window.localStorage.getItem("socLife.onboarded")) {
        setShowOnboarding(true);
      }
    } catch { /* ignore */ }
  };

  const restart = () => startShift();

  // Header restart with confirmation, so an accidental click while
  // mid-incident doesn't wipe progress.
  const confirmRestart = () => {
    if (gameOver) {
      restart();
      return;
    }
    if (window.confirm(t("socLife.confirmRestart"))) restart();
  };

  // Track native fullscreen state (e.g. user pressing ESC) so the icon stays in sync.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await rootRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      toast.error(t("socLife.fullscreenUnavailable") || "Fullscreen unavailable");
    }
  }, [t]);

  // Game-over: pause music, give the user a beat to read the result before
  // surfacing the "Restart" CTA. No toast spam, no rushing.
  useEffect(() => {
    if (!gameOver) return;
    audio.setMusicMode("calm");
    const id = window.setTimeout(() => setGameOverActionsReady(true), 2200);
    return () => window.clearTimeout(id);
  }, [gameOver, audio]);

  return (
    <div ref={rootRef} className="h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col">
      <Helmet>
        <title>{t("socLife.metaTitle")}</title>
        <meta name="description" content={t("socLife.metaDesc")} />
      </Helmet>

      <div className="mx-auto w-full max-w-6xl px-2 sm:px-4 py-1.5 sm:py-3 flex-1 flex flex-col min-h-0">
        {/* Compact header — even tighter on mobile so the floor plan gets the space */}
        <header className="mb-1.5 sm:mb-2 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="hidden sm:block font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-cyan-300 truncate">
              inside-the-box · sim
            </div>
            <h1 className="font-mono text-sm sm:text-xl md:text-2xl text-primary leading-tight truncate">
              {t("socLife.title")}
            </h1>
          </div>
          {started && (
            <div className="flex gap-1 sm:gap-1.5 shrink-0">
              <Button
                size="sm" variant="outline" className="font-mono h-7 sm:h-8 px-2 text-xs"
                onClick={() => setPaused((p) => !p)}
                disabled={gameOver}
                aria-label={paused ? t("socLife.resume") : t("socLife.pause")}
                title={paused ? t("socLife.resume") : t("socLife.pause")}
              >
                {paused ? "▶" : "❚❚"}
              </Button>
              <Button
                size="sm" variant="outline" className="font-mono h-7 sm:h-8 px-2 text-xs"
                onClick={() => audio.setEnabled(!audio.enabled)}
                aria-label={audio.enabled ? t("socLife.soundOff") : t("socLife.soundOn")}
                title={audio.enabled ? t("socLife.soundOff") : t("socLife.soundOn")}
              >
                {audio.enabled ? `🔊` : `🔇`}
              </Button>
              <Button
                size="sm" variant="outline" className="font-mono h-7 sm:h-8 px-2 text-xs"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? (t("socLife.fullscreenExit") || "Exit fullscreen") : (t("socLife.fullscreenEnter") || "Fullscreen")}
                title={isFullscreen ? (t("socLife.fullscreenExit") || "Exit fullscreen") : (t("socLife.fullscreenEnter") || "Fullscreen")}
              >
                {isFullscreen ? "⤡" : "⛶"}
              </Button>
              <Button
                size="sm" variant="outline" className="font-mono h-7 sm:h-8 px-2 text-xs"
                onClick={confirmRestart}
                aria-label={t("socLife.restartShift")}
                title={t("socLife.restartShift")}
              >
                ↻
              </Button>
            </div>
          )}
        </header>

        {!started && (
          <section className="rounded-lg border border-border/40 bg-background/40 p-4 sm:p-6 max-w-2xl overflow-y-auto">
            <p className="mb-3 text-sm text-muted-foreground sm:text-base">
              {t("socLife.subtitle")}
            </p>
            <p className="mb-4 text-sm text-muted-foreground sm:text-base">
              {t("socLife.intro")}
            </p>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("socLife.audioHint")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg" onClick={startShift} className="font-mono">
                ▶ {t("socLife.start")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowOnboarding(true)}
                className="font-mono"
              >
                ? {t("socLife.onboarding.showAgain")}
              </Button>
            </div>
          </section>
        )}

        {started && (
          <div className="flex-1 grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[1fr_320px] min-h-0 overflow-hidden relative">
            {/* Left: meters + house. */}
            <div className="flex flex-col gap-2 sm:gap-3 min-h-0">
              <SocMeters
                reputation={reputation} stress={stress} coffee={coffee}
                score={score} shift={Math.floor(shiftSec)} isNight={isNight}
                status={status}
              />
              <div className="min-h-0 lg:flex-1">
                <DollHouse
                  current={currentRoom}
                  highlight={revealRequiredRoom ? (activeIncident?.steps[stepIdx]?.requiredRoom ?? null) : null}
                  alertRoom={revealRequiredRoom ? (activeIncident?.steps[stepIdx]?.requiredRoom ?? null) : null}
                  onMove={handleMove}
                  isNight={isNight}
                  maxHeight={
                    typeof window !== "undefined"
                      ? window.innerWidth < 1024
                        // Mobile/tablet: give the floor plan ~55% of viewport so it's actually visible.
                        ? Math.max(240, Math.min(window.innerHeight * 0.55, window.innerHeight - 260))
                        : window.innerHeight - 260
                      : 320
                  }
                />
              </div>
            </div>

            {/* Right sidebar: Incident takes priority over idle actions. */}
            <aside className="min-h-0 flex-1 overflow-y-auto">
              {activeIncident ? (
                <IncidentPanel
                  incident={activeIncident}
                  step={activeIncident.steps[stepIdx]}
                  stepIndex={stepIdx}
                  totalSteps={activeIncident.steps.length}
                  currentRoom={currentRoom}
                  timeLeftMs={stepTimeLeft}
                  onChoose={handleChoose}
                  onGoToRoom={handleMove}
                />
              ) : (
                <RoomActions currentRoom={currentRoom} onIdleAction={handleIdle} />
              )}
            </aside>

            {/* Consequence overlay: blocks input, surfaces the outcome of the
                last choice in differentiated language. User must dismiss to
                continue — replaces the previous toast-spam. */}
            {consequence && !gameOver && (
              <ConsequenceOverlay
                data={consequence}
                onContinue={continueAfterConsequence}
              />
            )}

            {/* Pause overlay: clear visual confirmation that the game is frozen.
                Click anywhere or press Resume to continue. */}
            {paused && !gameOver && (
              <div
                className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in cursor-pointer"
                onClick={() => setPaused(false)}
                role="button"
                aria-label={t("socLife.resume")}
              >
                <div className="mx-3 max-w-sm w-full rounded-lg border border-primary/40 bg-background/95 p-6 sm:p-8 text-center shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_20px_60px_-10px_hsl(var(--primary)/0.3)]">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
                    ❚❚ {t("socLife.pause")}
                  </div>
                  <h2 className="mb-3 font-mono text-2xl sm:text-3xl text-foreground leading-tight">
                    {t("socLife.pausedHeadline") || "Schicht angehalten"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("socLife.pausedHint") || "Klicken oder ▶ drücken, um fortzufahren."}
                  </p>
                </div>
              </div>
            )}

            {/* Game-over: full-area calm overlay, NOT a toast spam.
                Gives the user time to read what happened before any CTA appears. */}
            {gameOver && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-fade-in">
                <div className="mx-3 max-w-md w-full rounded-lg border border-rose-500/50 bg-background/95 p-6 sm:p-8 shadow-[0_0_0_1px_hsl(var(--destructive)/0.25),0_20px_60px_-10px_hsl(var(--destructive)/0.4)]">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-rose-400">
                    ▲ {t("socLife.gameOverTitle")}
                  </div>
                  <h2 className="mb-3 font-mono text-xl sm:text-2xl text-foreground leading-tight">
                    {t("socLife.gameOverHeadline")}
                  </h2>
                  <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                    {t("socLife.gameOverFlavor")}
                  </p>
                  <div className="mb-6 grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="rounded-md border border-border/40 bg-background/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("socLife.gameOverFinalScore")}
                      </div>
                      <div className="mt-1 text-lg text-primary">{score}</div>
                    </div>
                    <div className="rounded-md border border-border/40 bg-background/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("socLife.gameOverShift")}
                      </div>
                      <div className="mt-1 text-lg text-foreground">
                        {Math.floor(shiftSec / 60).toString().padStart(2, "0")}:
                        {Math.floor(shiftSec % 60).toString().padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                  {/* Restart CTA fades in only after a short reading pause */}
                  <div className="min-h-[44px]">
                    {gameOverActionsReady ? (
                      <Button
                        size="lg"
                        onClick={restart}
                        className="w-full font-mono animate-fade-in"
                      >
                        ↻ {t("socLife.restart")}
                      </Button>
                    ) : (
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 text-center">
                        …
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skippable intro carousel — shown automatically on first visit, and on
          demand via the "?" button on the welcome screen. */}
      {showOnboarding && <Onboarding onClose={closeOnboarding} />}
    </div>
  );
}
