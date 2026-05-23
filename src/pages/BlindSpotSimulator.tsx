import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  INITIAL_ALERT,
  PHASES,
  ROLES,
  Role,
  RoleId,
} from "@/data/blindSpotScenario";
import { PhaseProgress } from "@/components/blindSpot/PhaseProgress";
import { CommsFeed, CommsFeedHandle, AlertCard } from "@/components/blindSpot/CommsFeed";
import { EvidencePanel } from "@/components/blindSpot/EvidencePanel";
import { ImplicationsPanel } from "@/components/blindSpot/ImplicationsPanel";
import { SystemsStatusPanel } from "@/components/blindSpot/SystemsStatusPanel";
import { BriefingDeck } from "@/components/blindSpot/BriefingDeck";

type DecisionChoice = "YES" | "NO" | "CONDITIONAL";
import { GameOverOverlay } from "@/components/blindSpot/GameOverOverlay";
import {
  PhaseScoreBreakdown,
  scorePhase,
} from "@/utils/blindSpotScoring";
import { StaggerReveal } from "@/components/StaggerReveal";
import { ObjectiveHud, ObjectiveStep } from "@/components/blindSpot/ObjectiveHud";
import { PhaseTransition } from "@/components/blindSpot/PhaseTransition";
import { sfx } from "@/utils/blindSpotSfx";


type Screen =
  | { kind: "welcome" }
  | { kind: "roleSelect" }
  | { kind: "confirmRole"; role: Role }
  | { kind: "briefing" }
  | { kind: "inject"; phaseIdx: number }
  | { kind: "debrief" };

interface DecisionRecord {
  phase: string;
  timestamp: string;
  question: string;
  choice: "YES" | "NO" | "CONDITIONAL";
  reasoning: string;
  icBy: "user" | "ai";
  iec62443Ref: string;
  nis2Flag?: string;
}

import { DebriefScreen, DebriefAnalysis } from "@/components/blindSpot/DebriefScreen";

type DebriefData = DebriefAnalysis;

const ROLE_DISPLAY_NAME: Record<RoleId, string> = {
  "it-ops": "IT-Ops",
  "ot-ops": "OT-Ops",
  ic: "Incident Commander",
  mgmt: "Management & Comms",
};

const BlindSpotSimulator = () => {
  const [screen, setScreen] = useState<Screen>({ kind: "welcome" });
  const [userRole, setUserRole] = useState<Role | null>(null);



  // Per-phase user assessment text (latest user chat message of the phase)
  const [userAssessment, setUserAssessment] = useState("");
  // Per-phase AI role outputs (keyed by aiRole) -> latest text
  const [aiOutputs, setAiOutputs] = useState<Record<string, string>>({});
  // Conversation history per AI role across phases
  const [history, setHistory] = useState<Record<string, Array<{ role: "user" | "assistant"; content: string }>>>({});

  const [committing, setCommitting] = useState(false);

  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);

  // Gamification
  const [phaseScores, setPhaseScores] = useState<PhaseScoreBreakdown[]>([]);
  const [showGameOver, setShowGameOver] = useState(false);
  // Momentum: consecutive phases scored ≥ 70. Drops to 0 on a drift.
  const [streak, setStreak] = useState(0);
  // Verdict pulse: brief mono badge after each commit, auto-clears.
  const [lastVerdict, setLastVerdict] = useState<{
    tier: "sharp" | "solid" | "mixed" | "drift";
    label: string;
    score: number;
  } | null>(null);
  useEffect(() => {
    if (!lastVerdict) return;
    const t = window.setTimeout(() => setLastVerdict(null), 3400);
    return () => window.clearTimeout(t);
  }, [lastVerdict]);


  // Decision modal state
  const feedRef = useRef<CommsFeedHandle>(null);
  // Modal removed — decisions are committed directly from chat. Phase-fired guard only.
  const [phaseUserMsgCount, setPhaseUserMsgCount] = useState(0);
  const modalFiredRef = useRef<number | null>(null);

  // Evidence panel — system alerts mirrored from CommsFeed
  const [evidence, setEvidence] = useState<
    Array<{ card: AlertCard; time: string; source: string }>
  >([]);

  // Decision panel is revealed only once the scripted chat sequence is done
  // (i.e. when IC actually needs input from the role)
  const [decisionReady, setDecisionReady] = useState(false);

  // Phase transition splash (Sims-style)
  const [transitionPhaseIdx, setTransitionPhaseIdx] = useState<number | null>(null);
  const [transitionVisible, setTransitionVisible] = useState(false);

  const DECISION_OPTIONS: Record<number, { yes: string; no: string; conditional: string }> = {
    1: {
      yes: "Terminate session and revoke vendor access",
      no: "Keep session live, monitor only",
      conditional: "Throttle session, alert vendor, ready a kill switch",
    },
    2: {
      yes: "Isolate OT Sim Network and notify clients",
      no: "Continue monitoring, hold isolation",
      conditional: "Partial isolation + forensic monitoring",
    },
    3: {
      yes: "Notify NSM, issue holding statement, reject attacker",
      no: "Delay notification, no public statement",
      conditional: "Notify NSM only, hold public comms",
    },
    4: {
      yes: "Authorise conditional restart under forensic monitoring",
      no: "Hold restart until full forensic clearance",
      conditional: "Restart only validated zones in gated phases",
    },
  };


  const aiRoleNames = useMemo(() => {
    if (!userRole) return [] as string[];
    return ROLES.filter((r) => r.id !== userRole.id).map((r) => ROLE_DISPLAY_NAME[r.id]);
  }, [userRole]);

  /* ============= Helpers ============= */

  const resetPhaseLocalState = () => {
    setUserAssessment("");
    setAiOutputs({});
    
    setCommitting(false);
    setPhaseUserMsgCount(0);
    setEvidence([]);
    setDecisionReady(false);
  };


  const appendHistory = (aiRole: string, entries: Array<{ role: "user" | "assistant"; content: string }>) => {
    setHistory((h) => ({ ...h, [aiRole]: [...(h[aiRole] ?? []), ...entries] }));
  };

  /* ============= Flow handlers ============= */

  const startExercise = () => {
    sfx.resume();
    setScreen({ kind: "roleSelect" });
  };
  const pickRole = (role: Role) => setScreen({ kind: "confirmRole", role });
  const confirmRole = (role: Role) => {
    setUserRole(role);
    setBriefingStep("intro");
    setScreen({ kind: "briefing" });
  };

  const beginPhase = (phaseIdx: number) => {
    resetPhaseLocalState();
    setTransitionPhaseIdx(phaseIdx);
    setTransitionVisible(true);
    sfx.resume();
    sfx.ambientStart();
    const lvl = (phaseIdx + 1) as 1 | 2 | 3 | 4;
    sfx.industrialStart(lvl);
    sfx.industrialSetLevel(lvl);
    sfx.phaseChange();
    setScreen({ kind: "inject", phaseIdx });
  };


  const isUserIC = userRole?.id === "ic";

  const parseAiChoice = (txt: string): "YES" | "NO" | "CONDITIONAL" => {
    const m = txt.match(/DECISION:\s*(YES|NO|CONDITIONAL)/i);
    return (m?.[1]?.toUpperCase() as "YES" | "NO" | "CONDITIONAL") ?? "CONDITIONAL";
  };

  /* ---- Modal-driven commit ---- */

  const advanceAfterCommit = (
    phaseIdx: number,
    record: DecisionRecord,
    scoreInputs: {
      isUserIC: boolean;
      userStance: DecisionChoice | null;
      userReasoning: string;
      remainingSecs: number;
      pushbackUsed: boolean;
    },
  ) => {
    const updated = [...decisions, record];
    setDecisions(updated);
    const phase = PHASES[phaseIdx];
    const breakdown = scorePhase({
      phaseIndex: phase.index,
      isUserIC: scoreInputs.isUserIC,
      finalStance: record.choice,
      userStance: scoreInputs.userStance,
      userReasoning: scoreInputs.userReasoning,
      remainingSecs: scoreInputs.remainingSecs,
      totalSecs: 180,
      chatMessages: phaseUserMsgCount,
      hasNis2Flag: !!phase.nis2Flag,
      pushbackUsed: scoreInputs.pushbackUsed,
    });
    const nextScores = [...phaseScores, breakdown];
    setPhaseScores(nextScores);

    // ── Momentum / verdict pulse — restrained dopamine loop ──
    const s = breakdown.total;
    const tier: "sharp" | "solid" | "mixed" | "drift" =
      s >= 85 ? "sharp" : s >= 70 ? "solid" : s >= 50 ? "mixed" : "drift";
    const label =
      tier === "sharp" ? "SHARP CALL"
      : tier === "solid" ? "SOLID CALL"
      : tier === "mixed" ? "MIXED CALL"
      : "DRIFT";
    setLastVerdict({ tier, label, score: s });
    setStreak((prev) => (s >= 70 ? prev + 1 : 0));


    const next = phaseIdx + 1;
    // (no modal to close)
    window.setTimeout(() => {
      if (next >= PHASES.length) {
        runDebrief(updated);
        setShowGameOver(true);
      } else {
        modalFiredRef.current = null;
        beginPhase(next);
      }
    }, 3000);
  };

  const postCommitFeedMessages = async (
    phaseIdx: number,
    choice: DecisionChoice,
    optionLabel: string,
    icBy: "user" | "ai",
    reasoningSnippet?: string,
  ) => {
    const phase = PHASES[phaseIdx];
    const summary =
      icBy === "user"
        ? `Decision committed: ${choice} — ${optionLabel}. Execute now.`
        : `Decision committed: ${choice} — ${optionLabel}.`;
    feedRef.current?.appendAssistant("Incident Commander", summary);

    // Pick one other role to acknowledge
    const others = (["IT-Ops", "OT-Ops", "Management & Comms"] as const).filter(
      (r) => r !== (userRole?.name as string),
    );
    const ack = others[Math.floor(Math.random() * others.length)];
    try {
      const { data } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "comms",
          aiRole: ack,
          userRole: userRole?.name,
          phaseName: phase.name,
          phaseTimestamp: phase.timestamp,
          situation: phase.situation,
          userInput: `IC just committed: ${choice} — ${optionLabel}. ${reasoningSnippet ?? ""} Acknowledge in one short sentence and state your immediate next action.`,
          history: [],
        },
      });
      const text = (data?.text as string) ?? `Acknowledged. Executing.`;
      window.setTimeout(() => feedRef.current?.appendAssistant(ack, text), 1200);
    } catch {
      /* ignore */
    }
  };

  const handleUserCommit = (
    choice: DecisionChoice,
    reasoning: string,
    remainingSecs: number,
  ) => {
    if (!("phaseIdx" in screen)) return;
    const phaseIdx = screen.phaseIdx;
    const phase = PHASES[phaseIdx];
    const opts = DECISION_OPTIONS[phase.index];
    const optionLabel =
      choice === "YES" ? opts.yes : choice === "NO" ? opts.no : opts.conditional;
    const record: DecisionRecord = {
      phase: phase.name,
      timestamp: phase.timestamp,
      question: phase.decisionQuestion,
      choice,
      reasoning,
      icBy: "user",
      iec62443Ref: phase.iec62443Ref,
      nis2Flag: phase.nis2Flag,
    };
    postCommitFeedMessages(phaseIdx, choice, optionLabel, "user", reasoning);
    advanceAfterCommit(phaseIdx, record, {
      isUserIC: true,
      userStance: choice,
      userReasoning: reasoning,
      remainingSecs,
      pushbackUsed: false,
    });
  };

  const handleAiIcAuto = async (
    recommendation?: { stance: "YES" | "NO" | "CONDITIONAL"; reasoning: string; remainingSecs: number },
  ) => {
    if (!("phaseIdx" in screen) || !userRole) return;
    const phaseIdx = screen.phaseIdx;
    const phase = PHASES[phaseIdx];
    const recBlock = recommendation
      ? `\n\nDirect recommendation from ${userRole.name}: RECOMMEND ${recommendation.stance} — "${recommendation.reasoning}". Weigh this seriously; you may follow or override, but must address it in your reasoning.`
      : "";
    try {
      const { data, error } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "ic-decision",
          aiRole: "Incident Commander",
          userRole: userRole.name,
          phaseName: phase.name,
          phaseTimestamp: phase.timestamp,
          situation: phase.situation,
          userInput: `${phase.decisionQuestion}\n\nTeam input so far: ${userRole.name} said: "${userAssessment || "(no comment)"}". Other team panels: ${Object.entries(
            aiOutputs,
          )
            .map(([r, t]) => `${r}: ${t}`)
            .join(" | ")}${recBlock}`,
          history: history["Incident Commander"] ?? [],
        },
      });
      if (error) throw error;
      const text = (data?.text as string) ?? "";
      const choice = parseAiChoice(text);
      const opts = DECISION_OPTIONS[phase.index];
      const optionLabel =
        choice === "YES" ? opts.yes : choice === "NO" ? opts.no : opts.conditional;
      const recPrefix = recommendation
        ? `[${userRole.name} recommended ${recommendation.stance}: "${recommendation.reasoning}"]\n\n`
        : "";
      const record: DecisionRecord = {
        phase: phase.name,
        timestamp: phase.timestamp,
        question: phase.decisionQuestion,
        choice,
        reasoning: recPrefix + text,
        icBy: "ai",
        iec62443Ref: phase.iec62443Ref,
        nis2Flag: phase.nis2Flag,
      };
      postCommitFeedMessages(phaseIdx, choice, optionLabel, "ai");
      advanceAfterCommit(phaseIdx, record, {
        isUserIC: false,
        userStance: recommendation?.stance ?? null,
        userReasoning: recommendation?.reasoning ?? "",
        remainingSecs: recommendation?.remainingSecs ?? 0,
        pushbackUsed: false,
      });
    } catch (e) {
      // Recover so the user can retry
      modalFiredRef.current = null;
      setCommitting(false);
      toast({
        title: "AI IC unavailable",
        description: (e instanceof Error ? e.message : "Unknown") + " — try Commit again.",
        variant: "destructive",
      });
    }
  };

  // The user's chat input (latest message of the phase) becomes the decision
  // (if user is IC) or the recommendation to the AI IC. We never regex-match
  // the user's words into YES/NO/CONDITIONAL — an LLM classifies the implied
  // stance from the verbatim text.
  const commitFromChat = async (phaseIdx: number) => {
    if (modalFiredRef.current === phaseIdx || committing) return;
    const text = (userAssessment || "").trim();
    if (!text) {
      toast({
        title: "Say something first",
        description: "Post your read in the team chat before committing.",
        variant: "destructive",
      });
      return;
    }
    modalFiredRef.current = phaseIdx;
    setCommitting(true);
    const phase = PHASES[phaseIdx];

    let choice: DecisionChoice = "CONDITIONAL";
    try {
      const { data } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "classify-stance",
          decisionQuestion: phase.decisionQuestion,
          userInput: text,
        },
      });
      const token = String((data?.text as string) ?? "")
        .trim()
        .toUpperCase()
        .match(/\b(YES|NO|CONDITIONAL|UNCLEAR)\b/)?.[1];
      if (token === "YES" || token === "NO" || token === "CONDITIONAL") {
        choice = token;
      }
    } catch {
      // Fall through with CONDITIONAL — non-fatal
    }

    if (isUserIC) {
      handleUserCommit(choice, text, 0);
    } else {
      await handleAiIcAuto({
        stance: choice,
        reasoning: text,
        remainingSecs: 0,
      });
    }
  };






  const runDebrief = async (finalDecisions: DecisionRecord[]) => {
    setDebriefLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "debrief",
          userRole: userRole?.name,
          decisions: finalDecisions.map((d) => ({
            phase: d.phase,
            question: d.question,
            choice: d.choice,
            reasoning: d.reasoning,
            icBy: d.icBy,
          })),
        },
      });
      if (error) throw error;
      const raw = (data?.text as string) ?? "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (parsed) setDebrief(parsed);
    } catch (e) {
      toast({ title: "Debrief generation failed", description: e instanceof Error ? e.message : "Unknown", variant: "destructive" });
    } finally {
      setDebriefLoading(false);
    }
  };

  const restart = () => {
    setUserRole(null);
    setDecisions([]);
    setDebrief(null);
    setHistory({});
    setPhaseScores([]);
    setShowGameOver(false);
    resetPhaseLocalState();
    setScreen({ kind: "roleSelect" });
  };

  // Stop ambient bed when leaving the live exercise (debrief or unmount).
  useEffect(() => {
    if (screen.kind === "debrief") {
      sfx.ambientStop();
      sfx.industrialStop();
    }
  }, [screen.kind]);
  useEffect(() => () => { sfx.ambientStop(); sfx.industrialStop(); }, []);

  /* ============= Renderers ============= */

  const phaseIdx = "phaseIdx" in screen ? screen.phaseIdx : 0;
  const currentPhaseForProgress: 1 | 2 | 3 | 4 | "debrief" =
    screen.kind === "debrief"
      ? "debrief"
      : screen.kind === "inject"
      ? ((phaseIdx + 1) as 1 | 2 | 3 | 4)
      : 1;

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white">
      <Helmet>
        <title>Blind Spot — OT Cyber Crisis Simulation</title>
        <meta
          name="description"
          content="Single-player OT cyber crisis tabletop exercise. Play one role, AI plays the rest. Scenario: APT via compromised vendor VPN at NorPower."
        />
      </Helmet>

      {(screen.kind === "inject" ||
        screen.kind === "debrief") && (
        <PhaseProgress
          currentPhase={currentPhaseForProgress}
          phases={PHASES}
          streak={streak}
          verdict={lastVerdict}
        />

      )}

      <main className={screen.kind === "debrief" ? "w-full" : screen.kind === "inject" ? "max-w-[1600px] mx-auto px-3 py-2 h-[calc(100vh-64px)] flex flex-col" : "max-w-5xl mx-auto px-4 py-8"}>
        {/* ===== Welcome ===== */}
        {screen.kind === "welcome" && (
          <div className="min-h-[70vh] flex flex-col justify-center items-center text-center">
            <StaggerReveal stagger={1800} startDelay={500} lastChildExtraDelay={4500} className="w-full flex flex-col items-center">
              <p className="font-mono text-[#f5b800] tracking-[0.3em] text-sm mb-6">
                NORPOWER
              </p>
              <h1 className="font-mono text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                BLIND SPOT
              </h1>
              <p className="font-mono text-sm text-white/60 mb-10">
                OT CYBER CRISIS · TABLETOP SIMULATION
              </p>
              <div className="max-w-2xl text-white/80 leading-relaxed mb-6">
                <p>
                  A single-player tabletop exercise. You pick one of four crisis-team roles.
                  An AI plays the other three in real time. You face four phases of an APT
                  intrusion via a compromised vendor VPN at NorPower in Oslo.
                </p>
              </div>
              <p className="text-white/60 text-sm mb-10 max-w-2xl">
                Estimated time: ~45 minutes. No login. Ephemeral session.
              </p>
              <Button
                size="lg"
                className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider"
                onClick={startExercise}
              >
                Start Exercise →
              </Button>
            </StaggerReveal>
          </div>
        )}


        {/* ===== Role Select ===== */}
        {screen.kind === "roleSelect" && (
          <div>
            <h2 className="font-mono text-2xl uppercase tracking-wider text-[#f5b800] mb-2">
              Select your role
            </h2>
            <p className="text-white/60 mb-8 text-sm">
              The AI will play the other three roles for the entire exercise.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-white/10 bg-background/40 p-6 hover:border-[#f5b800]/60 transition-colors"
                >
                  <h3 className="font-mono text-[#f5b800] text-lg mb-2">{r.name}</h3>
                  <p className="text-sm text-white/75 mb-4 leading-relaxed">{r.description}</p>
                  <Button
                    variant="outline"
                    onClick={() => pickRole(r)}
                    className="font-mono text-xs uppercase tracking-wider"
                  >
                    Play this role
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Confirm Role ===== */}
        {screen.kind === "confirmRole" && (
          <div className="max-w-xl mx-auto rounded-lg border border-[#f5b800]/50 bg-background/40 p-8">
            <p className="font-mono text-xs text-white/50 uppercase tracking-wider mb-2">Confirm role</p>
            <h2 className="font-mono text-2xl text-[#f5b800] mb-3">{screen.role.name}</h2>
            <p className="text-white/80 mb-6 leading-relaxed">{screen.role.description}</p>
            <div className="flex gap-3">
              <Button onClick={() => confirmRole(screen.role)} className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider">
                Confirm &amp; Begin
              </Button>
              <Button variant="outline" onClick={() => setScreen({ kind: "roleSelect" })} className="font-mono uppercase tracking-wider">
                Back
              </Button>
            </div>
          </div>
        )}

        {/* ===== Briefing (slide deck) ===== */}
        {screen.kind === "briefing" && userRole && (
          <BriefingDeck userRole={userRole} onStart={() => beginPhase(0)} />
        )}


        {/* ===== Inject (Quad Split) ===== */}
        {screen.kind === "inject" && userRole && (() => {
          const phase = PHASES[screen.phaseIdx];
          const step: ObjectiveStep = decisionReady
            ? "decide"
            : evidence.length > 0 || phase.index === 4
            ? "engage"
            : "watch";
          return (
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <SystemsStatusPanel phaseIndex={phase.index} />
              <ObjectiveHud
                phase={phase}
                totalPhases={PHASES.length}
                userRoleName={userRole.name}
                step={step}
                alertsCount={evidence.length}
                userMsgCount={phaseUserMsgCount}
              />

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 flex-1 min-h-0">


                {/* LEFT COLUMN — Evidence (top) + Implications / "Your call" (bottom) */}
                <div className="grid grid-rows-2 gap-3 min-h-0">

                  <EvidencePanel
                    phaseName={phase.name}
                    phaseTimestamp={phase.timestamp}
                    situation={phase.situation}
                    nis2Flag={phase.nis2Flag}
                    alerts={evidence}
                  />

                  {/* Bottom-left quadrant:
                      - default: live implications panel reading the bridge chatter
                      - when IC needs the player's call: yellow "Your call" briefing */}
                  {decisionReady ? (
                    <div
                      className="rounded-xl border-2 border-black/20 h-full min-h-0 flex flex-col overflow-hidden animate-fade-in shadow-[0_12px_40px_rgba(0,0,0,1)] relative"
                      style={{ backgroundColor: "#f5b800" }}
                    >
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-[#f5b800] rotate-45 border-t-2 border-l-2 border-black/10" />
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/15">
                        <span className="font-mono text-[11px] text-black/70 uppercase tracking-wider">
                          Your call
                        </span>
                        <span className="font-mono text-[10px] text-black/50 animate-pulse">● live</span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center gap-3 min-h-1/4">
                        <p className="text-[15px] text-black/90 leading-snug font-semibold">
                          {phase.decisionQuestion}
                        </p>
                        <p className="font-mono text-[11px] text-black/60">
                          {isUserIC
                            ? "Post your YES / NO / CONDITIONAL read in chat, then commit."
                            : "Post your recommendation in chat, then commit."}
                        </p>
                        {phaseUserMsgCount > 0 && (
                          <p className="font-mono text-[10px] text-black/50">
                            Your latest message will be used as rationale.
                          </p>
                        )}
                      </div>

                      <div className="px-4 py-3 border-t border-black/15 bg-black/5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-black/55 uppercase tracking-wider">
                          {phaseUserMsgCount === 0
                            ? "Awaiting your input"
                            : `${phaseUserMsgCount} msg${phaseUserMsgCount > 1 ? "s" : ""} sent`}
                        </span>
                        <Button
                          size="sm"
                          disabled={committing || phaseUserMsgCount === 0 || !userAssessment.trim()}
                          onClick={() => commitFromChat(screen.phaseIdx)}
                          className="bg-black text-[#f5b800] hover:bg-black/85 font-mono uppercase tracking-wider text-[11px] h-8 px-3 disabled:opacity-40"
                        >
                          {committing ? "Committing…" : "Commit decision →"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ImplicationsPanel
                      aiOutputs={aiOutputs}
                      phaseIndex={phase.index}
                    />
                  )}

                </div>






                {/* RIGHT COLUMN — Team Chat (full height to right edge) */}
                <CommsFeed
                  ref={feedRef}
                  phaseIndex={phase.index}
                  phaseName={phase.name}
                  phaseTimestamp={phase.timestamp}
                  situation={phase.situation}
                  userRoleName={userRole.name}
                  hideSystemMessages
                  onSystemAlert={(a) => {
                    setEvidence((prev) => [...prev, a]);
                    sfx.alert();
                  }}
                  onLatestByRole={(latest) => setAiOutputs(latest)}
                  onLastUserMessage={(text) => {
                    if (text) setUserAssessment(text);
                  }}
                  onUserMessageCount={(n) => setPhaseUserMsgCount(n)}
                  onScriptedDone={() => {
                    setDecisionReady(true);
                    sfx.inputRequired();
                  }}
                />
              </div>

            </div>
          );
        })()}




        {/* ===== Debrief ===== */}
        {screen.kind === "debrief" && userRole && (
          <DebriefScreen
            userRoleName={userRole.name}
            decisions={decisions.map((d) => ({
              phase: d.phase,
              timestamp: d.timestamp,
              question: d.question,
              choice: d.choice,
              reasoning: d.reasoning,
              iec62443Ref: d.iec62443Ref,
              nis2Flag: d.nis2Flag,
            }))}
            analysis={debrief}
            loading={debriefLoading}
            onRestart={restart}
          />
        )}
      </main>

      <PhaseTransition
        phase={transitionPhaseIdx !== null ? PHASES[transitionPhaseIdx] : null}
        show={transitionVisible}
        onDone={() => setTransitionVisible(false)}
      />


      {userRole && showGameOver && (
        <GameOverOverlay
          open={showGameOver}
          roleName={userRole.name}
          breakdowns={phaseScores}
          onContinue={() => {
            setShowGameOver(false);
            setScreen({ kind: "debrief" });
          }}
        />
      )}
    </div>


  );
};

export default BlindSpotSimulator;
