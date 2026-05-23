import { useMemo, useRef, useState } from "react";
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
import { DecisionModal, DecisionChoice } from "@/components/blindSpot/DecisionModal";
import { GameOverOverlay } from "@/components/blindSpot/GameOverOverlay";
import {
  PhaseScoreBreakdown,
  scorePhase,
  totalScore,
} from "@/utils/blindSpotScoring";


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
  const [modalOpen, setModalOpen] = useState(false);
  const [phaseUserMsgCount, setPhaseUserMsgCount] = useState(0);
  const modalFiredRef = useRef<number | null>(null);

  // Evidence panel — system alerts mirrored from CommsFeed
  const [evidence, setEvidence] = useState<
    Array<{ card: AlertCard; time: string; source: string }>
  >([]);

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
  };

  const appendHistory = (aiRole: string, entries: Array<{ role: "user" | "assistant"; content: string }>) => {
    setHistory((h) => ({ ...h, [aiRole]: [...(h[aiRole] ?? []), ...entries] }));
  };

  /* ============= Flow handlers ============= */

  const startExercise = () => setScreen({ kind: "roleSelect" });
  const pickRole = (role: Role) => setScreen({ kind: "confirmRole", role });
  const confirmRole = (role: Role) => {
    setUserRole(role);
    setScreen({ kind: "briefing" });
  };

  const beginPhase = (phaseIdx: number) => {
    resetPhaseLocalState();
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
    setModalOpen(false);
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

  const triggerModalForPhase = (phaseIdx: number) => {
    if (modalFiredRef.current === phaseIdx) return;
    modalFiredRef.current = phaseIdx;
    setModalOpen(true);
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
          <div className="space-y-6">
            <header>
              <p className="font-mono text-xs text-[#f5b800] uppercase tracking-wider mb-2">
                Scenario briefing
              </p>
              <h2 className="font-mono text-2xl">NorPower — Oslo · ~200 staff</h2>
              <p className="text-white/70 text-sm mt-1">
                IT/OT security services provider with in-house SOC, OT-Ops and IR team.
              </p>
            </header>

            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <h3 className="font-mono text-sm uppercase tracking-wider text-[#f5b800] mb-3">
                Network zones
              </h3>
              <table className="w-full font-mono text-sm">
                <thead className="text-white/50 text-xs uppercase">
                  <tr>
                    <th className="text-left py-1 pr-4">Zone</th>
                    <th className="text-left py-1 pr-4">Name</th>
                    <th className="text-left py-1">CIDR</th>
                  </tr>
                </thead>
                <tbody>
                  {NETWORK_ZONES.map((z) => (
                    <tr key={z.cidr} className="border-t border-white/5">
                      <td className="py-1.5 pr-4 text-[#f5b800]">{z.zone}</td>
                      <td className="py-1.5 pr-4">{z.name}</td>
                      <td className="py-1.5">{z.cidr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-amber-400/40 bg-amber-400/5 p-5">
              <p className="font-mono text-xs text-amber-300 uppercase tracking-wider mb-2">
                Initial SIEM alert · {INITIAL_ALERT.source} · {INITIAL_ALERT.severity}
              </p>
              <p className="font-mono text-xs text-white/50 mb-2">{INITIAL_ALERT.timestamp}</p>
              <p className="text-white/85">{INITIAL_ALERT.detail}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-background/40 p-5">
              <p className="font-mono text-xs text-white/50 uppercase mb-2">Roles played by the AI</p>
              <p className="font-mono text-sm">
                {aiRoleNames.join(" · ")}
              </p>
              <p className="font-mono text-xs text-white/50 mt-3">You play</p>
              <p className="font-mono text-sm text-[#f5b800]">{userRole.name}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => beginPhase(0)} className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider">
                Phase 1 begins →
              </Button>
            </div>
          </div>
        )}

        {/* ===== Inject (Quad Split) ===== */}
        {screen.kind === "inject" && userRole && (() => {
          const phase = PHASES[screen.phaseIdx];
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`inline-flex font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded border ${phaseColor(phase.colorKey)}`}>
                  {phase.name} · {phase.timestamp}
                </div>
                <p className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
                  You play <span className="text-[#f5b800]">{userRole.name}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* TL — Evidence / Injects */}
                <EvidencePanel
                  phaseName={phase.name}
                  phaseTimestamp={phase.timestamp}
                  situation={phase.situation}
                  nis2Flag={phase.nis2Flag}
                  alerts={evidence}
                />

                {/* TR — Team Chat */}
                <CommsFeed
                  ref={feedRef}
                  phaseIndex={phase.index}
                  phaseName={phase.name}
                  phaseTimestamp={phase.timestamp}
                  situation={phase.situation}
                  userRoleName={userRole.name}
                  hideSystemMessages
                  onSystemAlert={(a) => setEvidence((prev) => [...prev, a])}
                  onLatestByRole={(latest) => setAiOutputs(latest)}
                  onLastUserMessage={(text) => {
                    if (text && !userAssessment) setUserAssessment(text);
                  }}
                  onUserMessageCount={(n) => setPhaseUserMsgCount(n)}
                  onSequenceComplete={() => triggerModalForPhase(screen.phaseIdx)}
                />

                {/* BL — Private notes */}
                <div
                  className="rounded-lg border h-[420px] flex flex-col overflow-hidden"
                  style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{ borderColor: "#2a2a2a" }}
                  >
                    <span className="font-mono text-[11px] text-[#f5b800] uppercase tracking-wider">
                      Your private notes · {userRole.name}
                    </span>
                  </div>
                  <div className="flex-1 p-3">
                    <Textarea
                      value={userAssessment}
                      onChange={(e) => setUserAssessment(e.target.value)}
                      placeholder="Optional — private notes that feed the IC decision context."
                      className="h-full bg-background/60 border-white/10 font-mono text-sm resize-none"
                    />
                  </div>
                </div>

                {/* BR — Decision brief */}
                <div
                  className="rounded-lg border h-[420px] flex flex-col overflow-hidden"
                  style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{ borderColor: "#2a2a2a" }}
                  >
                    <span className="font-mono text-[11px] text-[#f5b800] uppercase tracking-wider">
                      {isUserIC ? "Your decision call" : "Pending IC decision"}
                    </span>
                    <span className="font-mono text-[10px] text-white/40">
                      Msgs sent: {phaseUserMsgCount}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="rounded-md border-2 border-[#f5b800]/50 bg-[#f5b800]/5 p-3">
                      <p className="font-mono text-[10px] text-[#f5b800] uppercase tracking-wider mb-1.5">
                        Decision question
                      </p>
                      <p className="text-[13px] text-white/90 leading-relaxed">
                        {phase.decisionQuestion}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-background/40 p-3 font-mono text-[11px] text-white/60 space-y-1">
                      <div>
                        <span className="text-[#f5b800]">IEC 62443:</span> {phase.iec62443Ref}
                      </div>
                      {phase.nis2Flag && (
                        <div>
                          <span className="text-red-300">NIS-2:</span> {phase.nis2Flag}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t p-3 space-y-2" style={{ borderColor: "#2a2a2a" }}>
                    <Button
                      onClick={() => triggerModalForPhase(screen.phaseIdx)}
                      disabled={phaseUserMsgCount < 1}
                      className="w-full bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider text-xs disabled:opacity-40"
                    >
                      {isUserIC ? "Open IC decision →" : "Submit recommendation →"}
                    </Button>
                    {phaseUserMsgCount < 1 && (
                      <p className="font-mono text-[10px] text-white/50 text-center">
                        Send at least one message in the team chat to engage IC.
                      </p>
                    )}
                  </div>
                </div>
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


      {userRole && screen.kind === "inject" && (() => {
        const phase = PHASES[screen.phaseIdx];
        return (
          <DecisionModal
            open={modalOpen}
            isUserIC={isUserIC}
            question={phase.decisionQuestion}
            options={DECISION_OPTIONS[phase.index]}
            iec62443Ref={phase.iec62443Ref}
            nis2Flag={phase.nis2Flag}
            onCommitUser={handleUserCommit}
            onAiIcAuto={handleAiIcAuto}
          />
        );
      })()}
    </div>

  );
};

export default BlindSpotSimulator;
