import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocLifeAudio } from "@/hooks/useSocLifeAudio";
import {
  Incident, INCIDENTS, PlaybookStep,
  ROOMS, RoomId, COMIC_INCIDENT_IDS,
  IncidentTier, IncidentCategory,
} from "@/data/socLifeData";
import { DollHouse } from "@/components/socLife/DollHouse";
import { SocMeters } from "@/components/socLife/SocMeters";
import { IncidentPanel } from "@/components/socLife/IncidentPanel";
import { RoomActions, IdleAction } from "@/components/socLife/RoomActions";
import { ConsequenceOverlay, ConsequenceData } from "@/components/socLife/ConsequenceOverlay";
import { Onboarding } from "@/components/socLife/Onboarding";
import { reasonFor } from "@/data/socLifeReasons";
import {
  loadHighscores, saveHighscore, qualifiesForHighscore,
  HIGHSCORE_NAME_MAX, HighscoreEntry,
} from "@/utils/socLifeHighscore";
import { resolveIsNight } from "@/utils/socLifeDayNight";

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

// === Difficulty curve ============================================
// Each "slot" of the shift has a weighted distribution over the four
// incident tiers. Early slots favour easy material; the boss-tier load
// rises steadily; comic-relief breathers are sprinkled in at a low,
// steady rate so the shift never feels samey for long.
//
// Index = number of incidents already completed.
// After the curve runs out we stay on the last (hardest) profile.
type TierWeights = Record<IncidentTier, number>;
const DIFFICULTY_CURVE: TierWeights[] = [
  { easy: 70, medium: 25, hard:  0, comic:  5 }, // #1 — gentle warm-up
  { easy: 55, medium: 35, hard:  5, comic:  5 }, // #2
  { easy: 35, medium: 45, hard: 15, comic:  5 }, // #3
  { easy: 20, medium: 50, hard: 25, comic:  5 }, // #4
  { easy: 10, medium: 45, hard: 35, comic: 10 }, // #5 — comic breather more likely
  { easy:  5, medium: 35, hard: 50, comic: 10 }, // #6
  { easy:  0, medium: 25, hard: 65, comic: 10 }, // #7
  { easy:  0, medium: 15, hard: 75, comic: 10 }, // #8+
];

function pickTier(weights: TierWeights, exclude?: IncidentTier): IncidentTier {
  const entries = (Object.entries(weights) as [IncidentTier, number][])
    .filter(([t, w]) => w > 0 && t !== exclude);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return "medium";
  let r = Math.random() * total;
  for (const [tier, w] of entries) {
    r -= w;
    if (r <= 0) return tier;
  }
  return entries[entries.length - 1][0];
}

/** Pick the next incident:
 *   1. Choose a tier from the difficulty curve.
 *   2. Filter INCIDENTS to that tier, exclude the most recent N to avoid
 *      repetition, and exclude the previous category to keep variety.
 *   3. If filtering empties the pool, progressively relax the constraints. */
function pickNextIncident(
  completed: number,
  recentIds: string[],
  lastCategory: IncidentCategory | null,
): Incident {
  const profile = DIFFICULTY_CURVE[Math.min(completed, DIFFICULTY_CURVE.length - 1)];
  const tier = pickTier(profile);
  const sameTier = INCIDENTS.filter((i) => (i.tier ?? "medium") === tier);

  // Strict: not recently shown AND different category from previous.
  const strict = sameTier.filter(
    (i) => !recentIds.includes(i.id) && (i.category ?? null) !== lastCategory,
  );
  if (strict.length) return strict[Math.floor(Math.random() * strict.length)];

  // Relax category constraint.
  const noRecent = sameTier.filter((i) => !recentIds.includes(i.id));
  if (noRecent.length) return noRecent[Math.floor(Math.random() * noRecent.length)];

  // Relax everything within tier.
  if (sameTier.length) return sameTier[Math.floor(Math.random() * sameTier.length)];

  // Last resort: any incident not just shown.
  const anyOk = INCIDENTS.filter((i) => !recentIds.includes(i.id));
  const pool = anyOk.length ? anyOk : INCIDENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface SocLifeProps {
  /** When embedded inside ChatView the page chrome (full-viewport wrapper,
   *  Helmet meta) is suppressed and the simulator fills its parent container. */
  embedded?: boolean;
}

export default function SocLife({ embedded = false }: SocLifeProps = {}) {
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
  // Number of incidents fully resolved (or escalated) so far this shift.
  // Drives the progressive time-pressure curve above.
  const [incidentsCompleted, setIncidentsCompleted] = useState(0);

  // Local highscore state. `highscores` is loaded fresh whenever a shift ends
  // so multiple browser tabs stay roughly in sync. `playerName` persists across
  // shifts so returning players don't have to re-type it.
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>(() => {
    try { return localStorage.getItem("socLife.playerName") || ""; } catch { return ""; }
  });
  const [highscoreSubmitted, setHighscoreSubmitted] = useState(false);
  const qualifies = gameOver && !highscoreSubmitted && qualifiesForHighscore(score);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Track viewport so the DollHouse maxHeight recomputes on resize / fullscreen
  // toggle / orientation change. Without this the floor plan stays small after
  // entering fullscreen on desktop because maxHeight was captured once at mount.
  //
  // In embedded mode (inside ChatView) we cannot use window.innerHeight as the
  // available height, because the parent reserves space for the chat header,
  // sidebar trigger, padding, etc. Instead we measure the rootRef element's
  // own bounding box. ResizeObserver picks up parent layout changes too.
  const [viewport, setViewport] = useState(() =>
    typeof window !== "undefined"
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1280, h: 720 },
  );
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const fs = !!document.fullscreenElement;
      const rect = rootRef.current?.getBoundingClientRect();
      // When embedded and not in native fullscreen, use the container's own
      // height — that's the real space we can paint into. Otherwise use the
      // window so the maxHeight scales with true viewport (and fullscreen).
      const h =
        embedded && !fs && rect && rect.height > 0
          ? rect.height
          : window.innerHeight;
      setViewport({ w, h });
    };
    measure();
    window.addEventListener("resize", measure);
    document.addEventListener("fullscreenchange", measure);
    let ro: ResizeObserver | null = null;
    if (embedded && rootRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => measure());
      ro.observe(rootRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("fullscreenchange", measure);
      ro?.disconnect();
    };
  }, [embedded]);

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
  // Inline floating pop-up for idle actions (coffee, smalltalk, etc.).
  // The Sonner toast at the bottom of the screen is easy to miss on mobile
  // because the chat input bar (in ChatView) and the absolute consequence
  // overlay can sit on top of it. This in-component pill is portaled into
  // the SocLife root so the user always sees the immediate feedback right
  // next to the action they just clicked. Auto-dismisses after ~1.4s.
  const [idlePop, setIdlePop] = useState<{
    id: number;
    icon: string;
    label: string;
    deltas: { stress?: number; coffee?: number; reputation?: number };
  } | null>(null);
  const idlePopTimerRef = useRef<number | null>(null);
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
  // History (most recent first) used by the picker to avoid repeats.
  // Window size = floor(N/2) keeps variety while still allowing rotation.
  const recentIncidentIdsRef = useRef<string[]>([]);
  const lastCategoryRef = useRef<IncidentCategory | null>(null);

  // Day/night is automatic and bound to the player's local clock:
  // night runs 20:00–06:00 local time. Re-evaluated on every tick via shiftSec.
  const isNight = useMemo(
    () => resolveIsNight(shiftSec),
    [shiftSec],
  );
  // Mirror isNight in a ref so the (non-React) randIncidentDelay() helper
  // and other event handlers can read the current value without going stale.
  const isNightRef = useRef(isNight);
  isNightRef.current = isNight;

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

  // Night shifts feel meaningfully busier: the gap between incidents is
  // compressed by ~30 %, so spawns come noticeably faster than during the day.
  // Day window: 18–38 s · Night window: ~12.6–26.6 s.
  const NIGHT_GAP_FACTOR = 0.7;
  function randIncidentDelay() {
    const factor = isNightRef.current ? NIGHT_GAP_FACTOR : 1;
    const min = MIN_INCIDENT_GAP_MS * factor;
    const max = MAX_INCIDENT_GAP_MS * factor;
    return min + Math.random() * (max - min);
  }

  const spawnIncident = useCallback(() => {
    const inc = pickNextIncident(
      incidentsCompleted,
      recentIncidentIdsRef.current,
      lastCategoryRef.current,
    );
    // Update history: keep window of ~half the catalogue so we don't recycle
    // the same scenario back-to-back, but still cycle through everything.
    const windowSize = Math.max(3, Math.floor(INCIDENTS.length / 2));
    recentIncidentIdsRef.current = [inc.id, ...recentIncidentIdsRef.current].slice(0, windowSize);
    lastCategoryRef.current = inc.category ?? null;

    setActiveIncident(inc);
    setStepIdx(0);
    setStepTimeLeft(stepTimeFor(inc.steps[0].timeLimitMs, incidentsCompleted));
    setConsequence(null);
    nextIncidentAtRef.current = 0;
    audio.playSfx("incident_klaxon", 0.6);
    toast(t("socLife.incomingIncident"), {
      description: inc.title[language as "de" | "en" | "fr"],
      duration: 2200,
    });
  }, [audio, t, language, incidentsCompleted]);

  const finishIncident = useCallback((escalated: boolean) => {
    setActiveIncident(null);
    setStepIdx(0);
    setStepTimeLeft(0);
    setConsequence(null);
    nextIncidentAtRef.current = Date.now() + randIncidentDelay();
    // Bump the completed-counter so the *next* incident uses a tighter deadline.
    setIncidentsCompleted((n) => n + 1);
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
      reason: reasonFor(activeIncident, step, opt, language as "de" | "en" | "fr"),
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
      setStepTimeLeft(stepTimeFor(next.timeLimitMs, incidentsCompleted));
    }
  }, [activeIncident, stepIdx, finishIncident, incidentsCompleted]);

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
    setIncidentsCompleted(0);
    setActiveIncident(null);
    setStepIdx(0);
    setConsequence(null);
    setCurrentRoom("soc_floor");
    recentIncidentIdsRef.current = [];
    lastCategoryRef.current = null;
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
    setHighscores(loadHighscores());
    setHighscoreSubmitted(false);
    const id = window.setTimeout(() => setGameOverActionsReady(true), 2200);
    return () => window.clearTimeout(id);
  }, [gameOver, audio]);

  const submitHighscore = () => {
    const name = playerName.trim().slice(0, HIGHSCORE_NAME_MAX) || "ANON";
    try { localStorage.setItem("socLife.playerName", name); } catch { /* ignore */ }
    const updated = saveHighscore({
      name, score, incidents: incidentsCompleted, shiftSec: Math.floor(shiftSec),
    });
    setHighscores(updated);
    setHighscoreSubmitted(true);
  };

  return (
    <div
      ref={rootRef}
      className={
        embedded
          // Embedded inside ChatView: fill the parent column without forcing
          // page-level scroll. min-h ensures the simulator is always usable
          // even when the chat layout collapses to a small region. h-[80vh]
          // caps the height on tall desktop monitors so the chat sidebar
          // (left) and chat input (bottom) stay reachable without scroll.
          ? "h-[80vh] min-h-[560px] max-h-[900px] overflow-hidden bg-background text-foreground flex flex-col rounded-lg border border-border/40"
          : "h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col"
      }
    >
      {!embedded && (
        <Helmet>
          <title>{t("socLife.metaTitle")}</title>
          <meta name="description" content={t("socLife.metaDesc")} />
        </Helmet>
      )}

      <div className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] px-2 sm:px-4 py-1.5 sm:py-3 flex-1 flex flex-col min-h-0">
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
          <div className="flex-1 grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] 2xl:grid-cols-[1fr_400px] min-h-0 overflow-hidden relative">
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
                    viewport.w < 1024
                      // Mobile/tablet: when an incident is active the IncidentPanel
                      // below needs the lion's share of the viewport for the prompt
                      // + answer buttons (otherwise the user has to scroll to even
                      // see the choices on small phones like iPhone SE 375×667).
                      // Shrink the floor plan to ~32% so the panel sits above the fold.
                      // When idle, keep the original generous ~55% so the house is
                      // visually present.
                      ? activeIncident
                        ? Math.max(180, Math.min(viewport.h * 0.32, 260))
                        : Math.max(240, Math.min(viewport.h * 0.55, viewport.h - 260))
                      // Desktop: subtract header + meters + padding. Bigger viewport → bigger house.
                      : Math.max(360, viewport.h - 200)
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
                <div className="mx-3 max-w-md w-full max-h-[92vh] overflow-y-auto rounded-lg border border-rose-500/50 bg-background/95 p-5 sm:p-6 shadow-[0_0_0_1px_hsl(var(--destructive)/0.25),0_20px_60px_-10px_hsl(var(--destructive)/0.4)]">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-rose-400">
                    ▲ {t("socLife.gameOverTitle")}
                  </div>
                  <h2 className="mb-2 font-mono text-xl sm:text-2xl text-foreground leading-tight">
                    {t("socLife.gameOverHeadline")}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                    {t("socLife.gameOverFlavor")}
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 font-mono text-xs">
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

                  {/* Highscore name entry — only when this score qualifies for the Top 10
                      and the player hasn't yet submitted (or skipped) it. */}
                  {qualifies && (
                    <div className="mb-4 rounded-md border border-primary/40 bg-primary/5 p-3">
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-primary">
                        ★ {t("socLife.highscoreNew")}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value.slice(0, HIGHSCORE_NAME_MAX))}
                          placeholder={t("socLife.highscoreNamePlaceholder")}
                          maxLength={HIGHSCORE_NAME_MAX}
                          autoFocus
                          className="flex-1 rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                          onKeyDown={(e) => { if (e.key === "Enter") submitHighscore(); }}
                        />
                        <Button
                          size="sm"
                          onClick={submitHighscore}
                          className="font-mono shrink-0"
                        >
                          {t("socLife.highscoreSave")}
                        </Button>
                      </div>
                      <button
                        onClick={() => setHighscoreSubmitted(true)}
                        className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t("socLife.highscoreSkip")}
                      </button>
                    </div>
                  )}

                  {/* Top-10 leaderboard. Always shown so the player sees what they're chasing. */}
                  <div className="mb-4 rounded-md border border-border/40 bg-background/60 p-3">
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        ☷ {t("socLife.highscoreTitle")}
                      </div>
                    </div>
                    {highscores.length === 0 ? (
                      <div className="font-mono text-[11px] text-muted-foreground/70 italic py-2">
                        {t("socLife.highscoreEmpty")}
                      </div>
                    ) : (
                      <ol className="space-y-0.5 font-mono text-[11px]">
                        {highscores.map((entry, i) => {
                          // Mark the freshly-saved row so the player can spot themselves.
                          const isMine = highscoreSubmitted && entry.score === score && entry.name === (playerName.trim().slice(0, HIGHSCORE_NAME_MAX) || "ANON");
                          return (
                            <li
                              key={`${entry.ts}-${i}`}
                              className={isMine
                                ? "flex items-baseline gap-2 rounded px-1.5 py-0.5 bg-primary/15 text-primary"
                                : "flex items-baseline gap-2 px-1.5 py-0.5 text-foreground/85"}
                            >
                              <span className="w-5 text-right text-muted-foreground tabular-nums">{i + 1}.</span>
                              <span className="flex-1 truncate">{entry.name}{isMine && <span className="ml-1 text-[9px] uppercase tracking-wider text-primary/70">· {t("socLife.highscoreYou")}</span>}</span>
                              <span className="tabular-nums text-muted-foreground/80">{entry.incidents}</span>
                              <span className="w-12 text-right tabular-nums">{entry.score}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
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
