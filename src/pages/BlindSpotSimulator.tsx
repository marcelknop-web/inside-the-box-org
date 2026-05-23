import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  INITIAL_ALERT,
  NETWORK_ZONES,
  PHASES,
  ROLES,
  Role,
  RoleId,
  phaseColor,
} from "@/data/blindSpotScenario";
import { PhaseProgress } from "@/components/blindSpot/PhaseProgress";
import { CommsFeed, CommsFeedHandle, AlertCard } from "@/components/blindSpot/CommsFeed";
import { EvidencePanel } from "@/components/blindSpot/EvidencePanel";
import { DecisionChoice } from "@/components/blindSpot/DecisionModal";
import { GameOverOverlay } from "@/components/blindSpot/GameOverOverlay";
import {
  PhaseScoreBreakdown,
  scorePhase,
  totalScore,
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
  | { kind: "decision"; phaseIdx: number }
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
  // Briefing has two pages: 'intro' (company/systems/network) → 'mission' (alert/phases/roles)
  const [briefingStep, setBriefingStep] = useState<"intro" | "mission">("intro");

  // Per-phase user assessment text
  const [userAssessment, setUserAssessment] = useState("");
  // Per-phase AI role outputs (keyed by aiRole) -> latest text
  const [aiOutputs, setAiOutputs] = useState<Record<string, string>>({});
  // Conversation history per AI role across phases
  const [history, setHistory] = useState<Record<string, Array<{ role: "user" | "assistant"; content: string }>>>({});

  // Decision state
  const [decisionChoice, setDecisionChoice] = useState<"YES" | "NO" | "CONDITIONAL" | null>(null);
  const [decisionReasoning, setDecisionReasoning] = useState("");
  const [aiIcDecision, setAiIcDecision] = useState<string>("");
  const [aiIcLoading, setAiIcLoading] = useState(false);
  const [pushbackUsed, setPushbackUsed] = useState(false);

  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);

  // Gamification
  const [phaseScores, setPhaseScores] = useState<PhaseScoreBreakdown[]>([]);
  const [showGameOver, setShowGameOver] = useState(false);

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
    setDecisionChoice(null);
    setDecisionReasoning("");
    setAiIcDecision("");
    setPushbackUsed(false);
    setPhaseUserMsgCount(0);
    setEvidence([]);
    setDecisionReady(false);
  };


  const appendHistory = (aiRole: string, entries: Array<{ role: "user" | "assistant"; content: string }>) => {
    setHistory((h) => ({ ...h, [aiRole]: [...(h[aiRole] ?? []), ...entries] }));
  };

  /* ============= Flow handlers ============= */

  const startExercise = () => setScreen({ kind: "roleSelect" });
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
    sfx.phaseChange();
    setScreen({ kind: "inject", phaseIdx });
  };

  const submitAssessment = () => {
    if (!userRole) return;
    const phase = PHASES[(screen as { phaseIdx: number }).phaseIdx];
    // Persist user input + each AI output into history for that role
    Object.entries(aiOutputs).forEach(([aiRole, text]) => {
      appendHistory(aiRole, [
        {
          role: "user",
          content: `[${phase.name}] Situation: ${phase.situation}\n${userRole.name} said: "${userAssessment || "(no comment)"}"`,
        },
        { role: "assistant", content: text },
      ]);
    });
    setScreen({ kind: "decision", phaseIdx: (screen as { phaseIdx: number }).phaseIdx });
  };

  const isUserIC = userRole?.id === "ic";

  const requestAiIcDecision = async (phaseIdx: number) => {
    if (!userRole) return;
    setAiIcLoading(true);
    setAiIcDecision("");
    try {
      const phase = PHASES[phaseIdx];
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
            .join(" | ")}`,
          history: history["Incident Commander"] ?? [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiIcDecision(data.text as string);
    } catch (e) {
      toast({ title: "AI IC unavailable", description: e instanceof Error ? e.message : "Unknown", variant: "destructive" });
    } finally {
      setAiIcLoading(false);
    }
  };

  // Auto-fetch AI IC decision when user enters decision screen as non-IC
  const ensureAiIcLoaded = (phaseIdx: number) => {
    if (!isUserIC && !aiIcDecision && !aiIcLoading) {
      requestAiIcDecision(phaseIdx);
    }
  };

  const parseAiChoice = (txt: string): "YES" | "NO" | "CONDITIONAL" => {
    const m = txt.match(/DECISION:\s*(YES|NO|CONDITIONAL)/i);
    return (m?.[1]?.toUpperCase() as "YES" | "NO" | "CONDITIONAL") ?? "CONDITIONAL";
  };

  const commitDecision = (phaseIdx: number, opts: { pushback?: boolean }) => {
    const phase = PHASES[phaseIdx];
    let newRecord: DecisionRecord;
    if (isUserIC) {
      if (!decisionChoice || !decisionReasoning.trim()) {
        toast({ title: "Decision incomplete", description: "Pick Yes / No / Conditional and provide reasoning.", variant: "destructive" });
        return;
      }
      newRecord = {
        phase: phase.name,
        timestamp: phase.timestamp,
        question: phase.decisionQuestion,
        choice: decisionChoice,
        reasoning: decisionReasoning,
        icBy: "user",
        iec62443Ref: phase.iec62443Ref,
        nis2Flag: phase.nis2Flag,
      };
    } else {
      newRecord = {
        phase: phase.name,
        timestamp: phase.timestamp,
        question: phase.decisionQuestion,
        choice: parseAiChoice(aiIcDecision),
        reasoning:
          aiIcDecision +
          (opts.pushback ? `\n\n[${userRole?.name} pushed back; IC reaffirmed]` : ""),
        icBy: "ai",
        iec62443Ref: phase.iec62443Ref,
        nis2Flag: phase.nis2Flag,
      };
    }

    const updated = [...decisions, newRecord];
    setDecisions(updated);

    const next = phaseIdx + 1;
    if (next >= PHASES.length) {
      runDebrief(updated);
      setScreen({ kind: "debrief" });
    } else {
      beginPhase(next);
    }
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
        pushbackUsed,
      });
    } catch (e) {
      toast({
        title: "AI IC unavailable",
        description: e instanceof Error ? e.message : "Unknown",
        variant: "destructive",
      });
    }
  };

  // The user's last chat message after the scripted sequence ends becomes
  // the decision (IC) or the recommendation to the AI IC.
  const commitFromChat = (phaseIdx: number) => {
    if (modalFiredRef.current === phaseIdx) return;
    modalFiredRef.current = phaseIdx;
    const text = (userAssessment || "").trim();
    const choice: DecisionChoice = /\bconditional\b/i.test(text)
      ? "CONDITIONAL"
      : /\b(no|do not|don't|hold|wait)\b/i.test(text)
      ? "NO"
      : /\b(yes|go|isolate|terminate|notify|authoris|authorize|restart|kill)\b/i.test(text)
      ? "YES"
      : "CONDITIONAL";
    if (isUserIC) {
      handleUserCommit(choice, text || "(no rationale provided in chat)", 0);
    } else {
      handleAiIcAuto({
        stance: choice,
        reasoning: text || "(no rationale provided in chat)",
        remainingSecs: 0,
      });
    }
  };



  const pushBackOnIC = async (phaseIdx: number) => {
    if (pushbackUsed || !userRole) return;
    setPushbackUsed(true);
    setAiIcLoading(true);
    try {
      const phase = PHASES[phaseIdx];
      const { data, error } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "ic-decision",
          aiRole: "Incident Commander",
          userRole: userRole.name,
          phaseName: phase.name,
          phaseTimestamp: phase.timestamp,
          situation: phase.situation,
          userInput: `${userRole.name} pushed back on your previous decision. Reconsider in 3-5 sentences. You may reaffirm or adjust. Start again with "DECISION: YES/NO/CONDITIONAL".\n\nYour previous decision: ${aiIcDecision}\n\nPushback context: ${userRole.name} disagrees and wants you to revisit.`,
          history: history["Incident Commander"] ?? [],
        },
      });
      if (error) throw error;
      setAiIcDecision(data.text as string);
    } catch (e) {
      toast({ title: "Pushback failed", description: e instanceof Error ? e.message : "Unknown", variant: "destructive" });
    } finally {
      setAiIcLoading(false);
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

  /* ============= Renderers ============= */

  const phaseIdx = "phaseIdx" in screen ? screen.phaseIdx : 0;
  const currentPhaseForProgress: 1 | 2 | 3 | 4 | "debrief" =
    screen.kind === "debrief"
      ? "debrief"
      : screen.kind === "inject" || screen.kind === "decision"
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
        screen.kind === "decision" ||
        screen.kind === "debrief") && (
        <PhaseProgress currentPhase={currentPhaseForProgress} phases={PHASES} />
      )}

      <main className={screen.kind === "debrief" ? "w-full" : screen.kind === "inject" ? "max-w-[1600px] mx-auto px-3 py-2 h-[calc(100vh-64px)] flex flex-col" : "max-w-5xl mx-auto px-4 py-8"}>
        {/* ===== Welcome ===== */}
        {screen.kind === "welcome" && (
          <div className="min-h-[70vh] flex flex-col justify-center items-center text-center">
            <p className="font-mono text-[#f5b800] tracking-[0.3em] text-sm mb-6">
              NORPOWER
            </p>
            <h1 className="font-mono text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              BLIND SPOT
            </h1>
            <p className="font-mono text-sm text-white/60 mb-10">
              OT CYBER CRISIS · TABLETOP SIMULATION
            </p>
            <div className="max-w-2xl text-white/80 leading-relaxed mb-10 space-y-4">
              <p>
                A single-player tabletop exercise. You pick one of four crisis-team roles.
                An AI plays the other three in real time. You face four phases of an APT
                intrusion via a compromised vendor VPN at NorPower in Oslo.
              </p>
              <p className="text-white/60 text-sm">
                Estimated time: ~45 minutes. No login. Ephemeral session.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider"
              onClick={startExercise}
            >
              Start Exercise →
            </Button>
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

        {/* ===== Briefing ===== */}
        {screen.kind === "briefing" && userRole && (
          <StaggerReveal stagger={700} startDelay={200} resetKey={briefingStep}>
            {/* HERO */}
            <div className="relative overflow-hidden rounded-xl border border-[#f5b800]/40 bg-gradient-to-br from-[#f5b800]/10 via-background/60 to-background/40 p-6">
              <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(245,184,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,184,0,0.4) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative flex items-start gap-5 flex-wrap">
                <div className="shrink-0 w-16 h-16 rounded-lg border-2 border-[#f5b800] bg-[#f5b800]/20 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f5b800" strokeWidth="1.5">
                    <path d="M12 2 L3 6 v6 c0 5 4 9 9 10 5 -1 9 -5 9 -10 V6 z" />
                    <path d="M9 12 l2 2 l4 -4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-[260px]">
                  <p className="font-mono text-[10px] text-[#f5b800] uppercase tracking-[0.3em] mb-1">
                    ▲ {briefingStep === "intro" ? "Part 1 · Introduction" : "Part 2 · Mission briefing"}
                  </p>
                  <h2 className="font-mono text-2xl leading-tight">
                    {briefingStep === "intro" ? `Welcome aboard, ${userRole.name}.` : "Mission briefing — stand by."}
                  </h2>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed max-w-2xl">
                    {briefingStep === "intro"
                      ? "Get to know NorPower, its systems and its network. This is the context you would already have on day one."
                      : "Here is the live alert that pulled you onto the bridge, the phases ahead, and the team you'll work with."}
                  </p>
                </div>
                <div className="shrink-0 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider">
                  <div className="border border-white/15 rounded px-2 py-1">
                    <div className="text-white/40">Location</div>
                    <div className="text-white/90">Oslo · NO</div>
                  </div>
                  <div className="border border-white/15 rounded px-2 py-1">
                    <div className="text-white/40">Local time</div>
                    <div className="text-[#f5b800]">23:47</div>
                  </div>
                  {briefingStep === "mission" && (
                    <>
                      <div className="border border-white/15 rounded px-2 py-1">
                        <div className="text-white/40">Phases</div>
                        <div className="text-white/90">4 + debrief</div>
                      </div>
                      <div className="border border-white/15 rounded px-2 py-1">
                        <div className="text-white/40">Duration</div>
                        <div className="text-white/90">~20 min</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {briefingStep === "intro" && (
            <>
            {/* COMPANY CARD */}
            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] text-[#f5b800] bg-[#f5b800]/10 border border-[#f5b800]/30 rounded px-2 py-0.5 uppercase tracking-wider">01</span>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white/90">The company — NorPower AS</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  ["Sector", "Energy utility"],
                  ["HQ", "Oslo, Norway"],
                  ["Staff", "~200 · 40 in OT"],
                  ["Regulation", "NIS-2 essential · NSM"],
                  ["Clients", "Municipal + industrial"],
                  ["Posture", "ISO 27001 · IEC 62443"],
                ].map(([k, v]) => (
                  <div key={k} className="border border-white/10 rounded p-3 bg-background/30">
                    <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{k}</div>
                    <div className="font-mono text-sm text-white/90 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-white/65 text-sm mt-4 leading-relaxed border-l-2 border-[#f5b800]/40 pl-3">
                NorPower runs its own SOC (3 analysts, 24/7 on-call), an OT-Ops team that owns the
                plant floor, and a small IR cell. A third-party PLC integrator has remote VPN access
                for vendor maintenance — a known but tolerated risk.
              </p>
            </div>

            {/* KEY SYSTEMS GRID */}
            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] text-[#f5b800] bg-[#f5b800]/10 border border-[#f5b800]/30 rounded px-2 py-0.5 uppercase tracking-wider">02</span>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white/90">Key systems</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { i: "◆", k: "SIEM", v: "Splunk Enterprise", d: "EDR, FW, AD, VPN, historian" },
                  { i: "◉", k: "OT monitoring", v: "Claroty CTD", d: "passive OT + SIS" },
                  { i: "▣", k: "PLCs", v: "Siemens S7-1500", d: "client sim line" },
                  { i: "⬢", k: "SIS", v: "Air-gapped PLC", d: "10.10.30.99 — last line" },
                  { i: "▤", k: "Historian", v: "OSIsoft PI", d: "OT zone" },
                  { i: "⇄", k: "Remote access", v: "Vendor VPN", d: "Jump Host 10.10.20.50" },
                  { i: "◳", k: "Backups", v: "Immutable / offline", d: "last validated 6d ago" },
                  { i: "✦", k: "Identity", v: "Active Directory", d: "MFA on admin only" },
                  { i: "✉", k: "Comms", v: "MS Teams bridge", d: "24/7 on-call rota" },
                ].map(({ i, k, v, d }) => (
                  <div key={k} className="flex gap-3 border border-white/10 rounded p-2.5 bg-background/30 hover:border-[#f5b800]/40 transition-colors">
                    <div className="shrink-0 w-8 h-8 rounded border border-[#f5b800]/40 bg-[#f5b800]/10 flex items-center justify-center text-[#f5b800] text-lg">{i}</div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{k}</div>
                      <div className="font-mono text-sm text-white/90 truncate">{v}</div>
                      <div className="font-mono text-[10px] text-white/50 truncate">{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NETWORK DIAGRAM */}
            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] text-[#f5b800] bg-[#f5b800]/10 border border-[#f5b800]/30 rounded px-2 py-0.5 uppercase tracking-wider">03</span>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white/90">Network — Purdue model</h3>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox="0 0 720 280" className="w-full min-w-[640px] h-auto font-mono">
                  <defs>
                    <marker id="bsArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M0,0 L10,5 L0,10 z" fill="#f5b80088" />
                    </marker>
                  </defs>

                  {/* Zone bands */}
                  {[
                    { y: 10, label: "ZONE 1 · CORPORATE IT", cidr: "10.10.10.0/24", color: "#00bcd4" },
                    { y: 80, label: "ZONE 2 · IT/OT DMZ", cidr: "10.10.20.0/24", color: "#f5b800" },
                    { y: 150, label: "ZONE 3 · OT SIM NETWORK", cidr: "10.10.30.0/24", color: "#ef6c5a" },
                    { y: 220, label: "SIS · AIR-GAPPED SAFETY PLC", cidr: "10.10.30.99", color: "#a0e85b" },
                  ].map((z) => (
                    <g key={z.label}>
                      <rect x="10" y={z.y} width="700" height="55" rx="6"
                        fill={z.color} fillOpacity="0.06" stroke={z.color} strokeOpacity="0.35" />
                      <text x="22" y={z.y + 18} fill={z.color} fillOpacity="0.9" fontSize="10" letterSpacing="2">{z.label}</text>
                      <text x="22" y={z.y + 34} fill="#ffffff" fillOpacity="0.5" fontSize="9">{z.cidr}</text>
                    </g>
                  ))}

                  {/* Nodes */}
                  {[
                    { x: 230, y: 24, w: 90, label: "Workstations", zone: 0 },
                    { x: 340, y: 24, w: 90, label: "AD / Splunk", zone: 0 },
                    { x: 450, y: 24, w: 90, label: "Mail / Web", zone: 0 },
                    { x: 230, y: 94, w: 100, label: "Jump Host", note: "10.10.20.50", zone: 1, hot: true },
                    { x: 350, y: 94, w: 100, label: "Vendor VPN", zone: 1 },
                    { x: 470, y: 94, w: 100, label: "Historian Sync", zone: 1 },
                    { x: 230, y: 164, w: 100, label: "Eng Workstation", zone: 2 },
                    { x: 350, y: 164, w: 100, label: "PI Historian", zone: 2 },
                    { x: 470, y: 164, w: 100, label: "Siemens S7 PLC", zone: 2 },
                    { x: 350, y: 234, w: 140, label: "Safety PLC (SIS)", zone: 3 },
                  ].map((n, i) => (
                    <g key={i}>
                      <rect x={n.x} y={n.y} width={n.w} height="30" rx="4"
                        fill={n.hot ? "#f5b80022" : "#ffffff08"}
                        stroke={n.hot ? "#f5b800" : "#ffffff55"}
                        strokeWidth={n.hot ? "1.5" : "1"} />
                      <text x={n.x + n.w / 2} y={n.y + 14} textAnchor="middle" fill="#fff" fillOpacity="0.9" fontSize="10">{n.label}</text>
                      {n.note && <text x={n.x + n.w / 2} y={n.y + 25} textAnchor="middle" fill="#f5b800" fontSize="8">{n.note}</text>}
                    </g>
                  ))}

                  {/* Conduits */}
                  <line x1="385" y1="55" x2="385" y2="92" stroke="#f5b80088" strokeWidth="1" markerEnd="url(#bsArrow)" />
                  <line x1="385" y1="125" x2="385" y2="162" stroke="#f5b80088" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#bsArrow)" />
                  <line x1="420" y1="195" x2="420" y2="232" stroke="#a0e85b55" strokeWidth="1" strokeDasharray="2 4" />
                  <text x="395" y="148" fill="#f5b80099" fontSize="8">OPC UA · whitelisted</text>
                  <text x="425" y="218" fill="#a0e85b99" fontSize="8">air-gap (no IP path)</text>
                </svg>
              </div>
              <p className="text-white/55 text-[11px] mt-3 leading-relaxed font-mono">
                Conduits firewalled. IT ↔ DMZ fully inspected. DMZ ↔ OT restricted to OPC UA and historian sync. SIS isolated.
              </p>
            </div>

            {/* INTRO → MISSION CTA */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setBriefingStep("mission")}
                className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider shadow-[0_0_30px_rgba(245,184,0,0.4)]"
              >
                Continue →
              </Button>
            </div>
            </>
            )}

            {briefingStep === "mission" && (
            <>
            {/* BACK LINK */}
            <div className="flex justify-start">
              <button
                onClick={() => setBriefingStep("intro")}
                className="font-mono text-[11px] text-white/50 hover:text-[#f5b800] uppercase tracking-wider transition-colors"
              >
                ← Back to introduction
              </button>
            </div>

            {/* SITUATION — ALERT */}
            <div className="rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-400/15 to-amber-400/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-3 relative">
                <span className="font-mono text-[10px] text-amber-300 bg-amber-400/20 border border-amber-300/40 rounded px-2 py-0.5 uppercase tracking-wider">04</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                <h3 className="font-mono text-sm uppercase tracking-wider text-amber-200">The situation — Live SIEM alert</h3>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 mb-3 font-mono text-[11px]">
                <div><div className="text-white/40 uppercase">Source</div><div className="text-white/90">{INITIAL_ALERT.source}</div></div>
                <div><div className="text-white/40 uppercase">Severity</div><div className="text-amber-300">{INITIAL_ALERT.severity}</div></div>
                <div><div className="text-white/40 uppercase">Timestamp</div><div className="text-white/90">{INITIAL_ALERT.timestamp}</div></div>
                <div><div className="text-white/40 uppercase">Status</div><div className="text-white/90">Bridge convened</div></div>
              </div>
              <p className="text-white/85 leading-relaxed">{INITIAL_ALERT.detail}</p>
              <p className="text-white/65 text-sm mt-3 leading-relaxed italic">
                It's 23:47. Most of the office is dark. SOC escalated to the on-call bridge. You just joined the call.
              </p>
            </div>


            {/* ROLES */}
            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-[10px] text-[#f5b800] bg-[#f5b800]/10 border border-[#f5b800]/30 rounded px-2 py-0.5 uppercase tracking-wider">06</span>
                <h3 className="font-mono text-sm uppercase tracking-wider text-white/90">Who's on the bridge</h3>
              </div>
              <div className="grid sm:grid-cols-4 gap-2">
                {ROLES.map((r) => {
                  const isYou = r.id === userRole.id;
                  return (
                    <div key={r.id} className={`rounded border p-3 ${isYou ? "border-[#f5b800] bg-[#f5b800]/10" : "border-white/10 bg-background/30"}`}>
                      <div className={`font-mono text-[10px] uppercase tracking-wider ${isYou ? "text-[#f5b800]" : "text-white/40"}`}>
                        {isYou ? "▶ You" : "AI"}
                      </div>
                      <div className={`font-mono text-sm mt-1 ${isYou ? "text-[#f5b800]" : "text-white/85"}`}>{r.name}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/60 text-xs mt-4 leading-relaxed font-mono">
                All communication happens in the team chat. IC drives decisions. NIS-2 clock starts at Phase 2.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => beginPhase(0)} className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider shadow-[0_0_30px_rgba(245,184,0,0.4)]">
                I'm ready — Phase 1 begins →
              </Button>
            </div>
            </>
            )}
          </StaggerReveal>
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
              <ObjectiveHud
                phase={phase}
                totalPhases={PHASES.length}
                userRoleName={userRole.name}
                step={step}
                alertsCount={evidence.length}
                userMsgCount={phaseUserMsgCount}
              />

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3 flex-1 min-h-0">


                {/* LEFT COLUMN — Evidence (full height until decision needed, then top half) */}
                <div className={decisionReady ? "grid grid-rows-2 gap-3 min-h-0" : "min-h-0"}>

                  <EvidencePanel
                    phaseName={phase.name}
                    phaseTimestamp={phase.timestamp}
                    situation={phase.situation}
                    nis2Flag={phase.nis2Flag}
                    alerts={evidence}
                  />

                  {/* Brief panel — appears only when IC needs input from this role.
                      All communication happens in the team chat. This box only
                      informs the player what is expected of them in the chat. */}
                  {decisionReady && (
                    <div
                      className="rounded-xl border-2 border-black/20 h-full min-h-0 flex flex-col overflow-hidden animate-fade-in shadow-[0_12px_40px_rgba(0,0,0,1)] relative"
                      style={{ backgroundColor: "#f5b800" }}
                    >
                      {/* Pop-up notch */}
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-[#f5b800] rotate-45 border-t-2 border-l-2 border-black/10" />
                      <div
                        className="flex items-center justify-between px-4 py-2.5 border-b border-black/15"
                      >
                        <span className="font-mono text-[11px] text-black/70 uppercase tracking-wider">
                          Your input required
                        </span>
                        <span className="font-mono text-[10px] text-black/50 animate-pulse">
                          ● live
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-1/4">
                        <p className="font-mono text-[10px] text-black/60 uppercase tracking-wider">
                          {isUserIC
                            ? "The team is waiting for your call. Post it in the team chat →"
                            : `IC is waiting for ${userRole.name}'s recommendation. Reply in the team chat →`}
                        </p>
                        <div className="rounded-md border-2 border-black/20 bg-black/10 p-3">
                          <p className="font-mono text-[10px] text-black/70 uppercase tracking-wider mb-1.5">
                            {isUserIC ? "Decision to call" : "Question on the table"}
                          </p>
                          <p className="text-[13px] text-black/90 leading-relaxed font-medium">
                            {phase.decisionQuestion}
                          </p>
                        </div>
                        <div className="rounded-md border border-black/15 bg-black/5 p-2.5 font-mono text-[11px] text-black/70 space-y-1">
                          <div>
                            <span className="text-black/90 font-semibold">IEC 62443:</span> {phase.iec62443Ref}
                          </div>
                          {phase.nis2Flag && (
                            <div>
                              <span className="text-red-700 font-semibold">NIS-2:</span> {phase.nis2Flag}
                            </div>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-black/50 italic">
                          Post your decision in the team chat — it will be recorded as your call.
                        </p>

                      </div>
                    </div>
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
                    if (text && !userAssessment) setUserAssessment(text);
                  }}
                  onUserMessageCount={(n) => setPhaseUserMsgCount(n)}
                  onScriptedDone={() => {
                    setDecisionReady(true);
                    sfx.inputRequired();
                  }}
                  onSequenceComplete={() => commitFromChat(screen.phaseIdx)}
                />
              </div>

            </div>
          );
        })()}


        {/* ===== Decision ===== */}
        {screen.kind === "decision" && userRole && (() => {
          const phase = PHASES[screen.phaseIdx];
          ensureAiIcLoaded(screen.phaseIdx);
          return (
            <div className="space-y-6">
              <div className={`inline-flex font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded border ${phaseColor(phase.colorKey)}`}>
                Decision point · {phase.timestamp}
              </div>

              <div className="rounded-lg border-2 border-[#f5b800]/60 bg-[#f5b800]/5 p-6 text-center">
                <p className="font-mono text-xs text-[#f5b800] uppercase tracking-wider mb-3">
                  Incident Commander decision
                </p>
                <p className="text-lg text-white leading-relaxed">{phase.decisionQuestion}</p>
              </div>

              {isUserIC ? (
                <div className="rounded-lg border border-white/10 bg-background/40 p-5 space-y-4">
                  <div className="flex gap-3">
                    {(["YES", "NO", "CONDITIONAL"] as const).map((c) => (
                      <Button
                        key={c}
                        variant={decisionChoice === c ? "default" : "outline"}
                        onClick={() => setDecisionChoice(c)}
                        className={`font-mono uppercase tracking-wider flex-1 ${
                          decisionChoice === c ? "bg-[#f5b800] text-black hover:bg-[#f5b800]/90" : ""
                        }`}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    value={decisionReasoning}
                    onChange={(e) => setDecisionReasoning(e.target.value)}
                    placeholder="Reasoning (required) — what informs this call?"
                    className="min-h-[120px] bg-background/60 border-white/10 font-mono text-sm"
                  />
                  <Button
                    onClick={() => commitDecision(screen.phaseIdx, {})}
                    className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider w-full"
                  >
                    Commit decision →
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-background/40 p-5 space-y-4">
                  <p className="font-mono text-xs text-[#f5b800] uppercase tracking-wider">
                    AI Incident Commander
                  </p>
                  {aiIcLoading ? (
                    <p className="text-white/60 text-sm animate-pulse">IC is deciding…</p>
                  ) : (
                    <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{aiIcDecision || "—"}</p>
                  )}
                  {!aiIcLoading && aiIcDecision && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => commitDecision(screen.phaseIdx, { pushback: pushbackUsed })}
                        className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pushbackUsed}
                        onClick={() => pushBackOnIC(screen.phaseIdx)}
                        className="font-mono uppercase tracking-wider flex-1"
                      >
                        {pushbackUsed ? "Pushback used" : "Push back"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-white/10 bg-background/40 p-4 text-xs font-mono text-white/60">
                <span className="text-[#f5b800]">IEC 62443 ref:</span> {phase.iec62443Ref}
                {phase.nis2Flag && (
                  <>
                    <br />
                    <span className="text-red-300">NIS-2:</span> {phase.nis2Flag}
                  </>
                )}
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
