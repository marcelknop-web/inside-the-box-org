import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSocLifeAudio } from "@/hooks/useSocLifeAudio";
import {
  Incident, INCIDENTS, INCIDENT_TYPES, IncidentType, PlaybookStep,
  ROOMS, RoomId,
} from "@/data/socLifeData";
import { DollHouse } from "@/components/socLife/DollHouse";
import { SocMeters } from "@/components/socLife/SocMeters";
import { IncidentPanel } from "@/components/socLife/IncidentPanel";
import { RoomActions, IdleAction } from "@/components/socLife/RoomActions";

const TICK_MS = 250;
const MIN_INCIDENT_GAP_MS = 18_000;
const MAX_INCIDENT_GAP_MS = 38_000;

export default function SocLife() {
  const { t } = useLanguage();
  const audio = useSocLifeAudio();

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [currentRoom, setCurrentRoom] = useState<RoomId>("soc_floor");
  const [reputation, setReputation] = useState(70);
  const [stress, setStress] = useState(20);
  const [coffee, setCoffee] = useState(60);
  const [score, setScore] = useState(0);
  const [shiftSec, setShiftSec] = useState(0);

  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  const nextIncidentAtRef = useRef<number>(0);

  const isNight = useMemo(() => {
    // 6 minutes day / 4 minutes night cycle for variety
    const cycle = shiftSec % 600;
    return cycle >= 360;
  }, [shiftSec]);

  const status: "calm" | "oncall" | "incident" =
    activeIncident ? "incident" : (isNight ? "oncall" : "calm");

  // ----- Sound: switch loops based on status -----
  useEffect(() => {
    if (!started || !audio.enabled) return;
    if (activeIncident) audio.switchMusic("alert_loop");
    else audio.switchMusic("ambient_loop");
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

      // Step timer countdown
      if (activeIncident) {
        setStepTimeLeft((t2) => {
          const next = t2 - TICK_MS;
          if (next <= 0) {
            // timeout -> escalate
            handleTimeout();
            return 0;
          }
          return next;
        });
      } else {
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
  }, [started, paused, gameOver, activeIncident, reputation, stress, coffee]);

  function randIncidentDelay() {
    return MIN_INCIDENT_GAP_MS + Math.random() * (MAX_INCIDENT_GAP_MS - MIN_INCIDENT_GAP_MS);
  }

  const spawnIncident = useCallback(() => {
    const type: IncidentType = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)];
    const inc = INCIDENTS[type];
    setActiveIncident(inc);
    setStepIdx(0);
    setStepTimeLeft(inc.steps[0].timeLimitMs);
    nextIncidentAtRef.current = 0;
    audio.playSfx("incident_klaxon", 0.6);
    toast(t("socLife.incomingIncident"), {
      description: t(`socLife.incidents.${inc.i18nBase}.title`),
    });
  }, [audio, t]);

  const finishIncident = useCallback((escalated: boolean) => {
    setActiveIncident(null);
    setStepIdx(0);
    setStepTimeLeft(0);
    nextIncidentAtRef.current = Date.now() + randIncidentDelay();
    if (escalated) {
      audio.playSfx("escalation", 0.5);
      toast.error(t("socLife.incidentEscalated"));
      setReputation((r) => Math.max(0, r - 10));
    } else {
      audio.playSfx("success_chime", 0.55);
      toast.success(t("socLife.incidentResolved"));
      setScore((s) => s + 50);
    }
  }, [audio, t]);

  function handleTimeout() {
    audio.playSfx("fail_buzz", 0.5);
    toast.error(t("socLife.feedback.timeout"));
    setReputation((r) => Math.max(0, r - 8));
    finishIncident(true);
  }

  const handleChoose = useCallback((optionId: string) => {
    if (!activeIncident) return;
    const step = activeIncident.steps[stepIdx];
    const opt = step.options.find((o) => o.id === optionId);
    if (!opt) return;
    if (step.requiredRoom && step.requiredRoom !== currentRoom) return;

    setReputation((r) => Math.max(0, Math.min(100, r + opt.delta)));
    setStress((s) => Math.min(100, s + (opt.correct ? -2 : +6)));

    if (opt.correct) {
      setScore((s) => s + 10);
      audio.playSfx("success_chime", 0.45);
      toast.success(t("socLife.feedback.correct"));
    } else {
      audio.playSfx("fail_buzz", 0.45);
      toast.error(t("socLife.feedback.wrong"));
    }

    const nextIdx = stepIdx + 1;
    if (nextIdx >= activeIncident.steps.length) {
      finishIncident(false);
    } else {
      setStepIdx(nextIdx);
      const next: PlaybookStep = activeIncident.steps[nextIdx];
      setStepTimeLeft(next.timeLimitMs);
    }
  }, [activeIncident, stepIdx, currentRoom, audio, t, finishIncident]);

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
    });
  }, [audio, t]);

  const startShift = async () => {
    audio.setEnabled(true);
    setStarted(true);
    setPaused(false);
    setGameOver(false);
    setReputation(70);
    setStress(20);
    setCoffee(60);
    setScore(0);
    setShiftSec(0);
    setActiveIncident(null);
    setStepIdx(0);
    nextIncidentAtRef.current = Date.now() + 6_000;
    // Kick off audio in background (lazy fetch)
    audio.ensureMusic("ambient_loop");
    audio.prewarm();
  };

  const restart = () => startShift();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{t("socLife.metaTitle")}</title>
        <meta name="description" content={t("socLife.metaDesc")} />
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">
            inside-the-box · sim
          </div>
          <h1 className="mt-1 font-mono text-3xl text-primary sm:text-4xl">
            {t("socLife.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("socLife.subtitle")}
          </p>
        </header>

        {!started && (
          <section className="rounded-lg border border-border/40 bg-background/40 p-6">
            <p className="mb-4 text-sm text-muted-foreground sm:text-base">
              {t("socLife.intro")}
            </p>
            <p className="mb-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("socLife.audioHint")}
            </p>
            <Button size="lg" onClick={startShift} className="font-mono">
              ▶ {t("socLife.start")}
            </Button>
          </section>
        )}

        {started && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline" className="font-mono"
                  onClick={() => setPaused((p) => !p)}
                  disabled={gameOver}
                >
                  {paused ? `▶ ${t("socLife.resume")}` : `❚❚ ${t("socLife.pause")}`}
                </Button>
                <Button
                  size="sm" variant="outline" className="font-mono"
                  onClick={() => audio.setEnabled(!audio.enabled)}
                >
                  {audio.enabled ? `🔊 ${t("socLife.soundOn")}` : `🔇 ${t("socLife.soundOff")}`}
                </Button>
              </div>
              {gameOver && (
                <Button size="sm" onClick={restart} className="font-mono">
                  ↻ {t("socLife.restart")}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <SocMeters
                  reputation={reputation} stress={stress} coffee={coffee}
                  score={score} shift={Math.floor(shiftSec)} isNight={isNight}
                  status={status}
                />
                <DollHouse
                  current={currentRoom}
                  highlight={activeIncident?.steps[stepIdx]?.requiredRoom ?? null}
                  onMove={handleMove}
                />
                {activeIncident && (
                  <IncidentPanel
                    incident={activeIncident}
                    step={activeIncident.steps[stepIdx]}
                    stepIndex={stepIdx}
                    totalSteps={activeIncident.steps.length}
                    currentRoom={currentRoom}
                    timeLeftMs={stepTimeLeft}
                    onChoose={handleChoose}
                  />
                )}
                {gameOver && (
                  <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4">
                    <div className="font-mono text-sm text-rose-300">{t("socLife.gameOver")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t("socLife.score")}: <span className="text-primary">{score}</span>
                    </div>
                  </div>
                )}
              </div>

              <aside>
                <RoomActions currentRoom={currentRoom} onIdleAction={handleIdle} />
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
