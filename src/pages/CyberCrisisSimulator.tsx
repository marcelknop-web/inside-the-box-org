import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { SYSTEM_PROMPTS } from "./crisisSystemPrompts";

// ─── TYPES ───────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  type: "sim" | "user" | "inject" | "eval" | "sys";
}

interface InjectState {
  i1: boolean;
  i2: boolean;
}

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  bg: "#1c2130",
  surface: "rgba(20, 25, 38, 0.93)",
  gold: "#c9943a",
  goldLight: "#e8b84b",
  text: "#cfc8b4",
  textDim: "#6a6250",
  textLight: "#ede5cc",
  borderThin: "rgba(201,148,58,0.17)",
  borderVis: "rgba(201,148,58,0.33)",
  red: "#b83030",
  green: "#68a87c",
  blue: "#5b7fa6",
  inject: "#c98a3a",
  injectText: "#e8c87a",
};

// ─── DIAMOND LOGO ────────────────────────────────────────────────
const DiamondLogo = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,2 38,20 20,38 2,20" stroke={C.gold} strokeWidth="1.2" fill="none" />
    <polygon points="20,7 33,20 20,33 7,20" stroke={C.gold} strokeWidth="1" fill="none" />
    <polygon points="20,12 28,20 20,28 12,20" stroke={C.gold} strokeWidth="0.8" fill="none" />
    <polygon points="20,16 24,20 20,24 16,20" stroke={C.gold} strokeWidth="0.6" fill="none" />
  </svg>
);

// ─── TYPING INDICATOR ────────────────────────────────────────────
const TypingIndicator = ({ label }: { label: string }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "12px 0" }}>
    <span style={{ color: C.textDim, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 8 }}>{label}</span>
    {[0, 1, 2].map(i => (
      <svg key={i} width="8" height="8" viewBox="0 0 10 10" style={{ animation: `crisisDiamondPulse 1.2s ${i * 0.2}s infinite ease-in-out` }}>
        <polygon points="5,0 10,5 5,10 0,5" fill={C.gold} />
      </svg>
    ))}
  </div>
);

// ─── MARKDOWN RENDERER ──────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <table key={`t-${elements.length}`} style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0", fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: `1px solid ${C.borderThin}` }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "4px 8px", color: ri === 0 ? C.gold : C.textDim }}>{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("|")) {
      if (line.replace(/[|\-\s]/g, "").length === 0) continue;
      inTable = true;
      const cells = line.split("|").filter(c => c.trim() !== "");
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith("## ")) {
      elements.push(<div key={i} style={{ color: C.gold, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${C.borderThin}`, fontFamily: "IBM Plex Mono, monospace" }}>{line.slice(3)}</div>);
    } else if (line.startsWith("### ")) {
      elements.push(<div key={i} style={{ color: C.blue, fontWeight: 600, fontSize: 13, marginTop: 12, marginBottom: 4, fontFamily: "IBM Plex Mono, monospace" }}>{line.slice(4)}</div>);
    } else if (line === "---") {
      elements.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${C.borderThin}`, margin: "8px 0" }} />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={i} style={{ lineHeight: 1.6, fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}>
          {parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <span key={pi} style={{ color: C.goldLight, fontWeight: 600 }}>{part.slice(2, -2)}</span>;
            }
            return <span key={pi}>{part}</span>;
          })}
        </div>
      );
    }
  }
  flushTable();
  return elements;
}

// ─── PROPS ───────────────────────────────────────────────────────
interface CrisisSimulatorProps {
  embedded?: boolean;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
const CyberCrisisSimulator: React.FC<CrisisSimulatorProps> = ({ embedded = false }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [evalDone, setEvalDone] = useState(false);
  const [injects, setInjects] = useState<InjectState>({ i1: false, i2: false });
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerExpiredRef = useRef(false);

  // ─── I18N HELPERS ──────────────────────────────────────────────
  const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;
  const phases = [
    { id: 1, label: t('crisisSim.phase1') },
    { id: 2, label: t('crisisSim.phase2') },
    { id: 3, label: t('crisisSim.phase3') },
    { id: 4, label: t('crisisSim.phase4') },
  ];
  const quickActions = [
    { label: t('crisisSim.qaConveneTeam'), text: t('crisisSim.qaConveneTeamText') },
    { label: t('crisisSim.qaIsolateSystem'), text: t('crisisSim.qaIsolateSystemText') },
    { label: t('crisisSim.qaDpo72h'), text: t('crisisSim.qaDpo72hText') },
    { label: t('crisisSim.qaCustomerComm'), text: t('crisisSim.qaCustomerCommText') },
    { label: t('crisisSim.qaCriminalComplaint'), text: t('crisisSim.qaCriminalComplaintText') },
    { label: t('crisisSim.qaRequestEval'), text: t('crisisSim.qaRequestEvalText'), isEval: true },
  ];
  const scenarioItems = t('crisisSim.scenarioItems').split('|');
  const legalItems = t('crisisSim.legalItems').split('|');
  const evalKeywordsPattern = new RegExp(t('crisisSim.evalKeywords'), 'i');
  const timerExpiredToken = t('crisisSim.timerExpiredToken');
  const evalMarker = t('crisisSim.evalMarker');

  const userMsgCount = messages.filter(m => m.role === "user" && m.content !== "START_SIMULATION").length;
  const activePhase = evalDone ? 4 : userMsgCount >= 5 ? 3 : userMsgCount >= 2 ? 2 : 1;
  const completedPhases = Array.from({ length: activePhase - 1 }, (_, i) => i + 1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!timerActive || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, secondsLeft]);

  useEffect(() => {
    if (secondsLeft <= 0 && timerActive && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      setTimerActive(false);
      sendMessage(timerExpiredToken, true);
    }
  }, [secondsLeft, timerActive]);

  const sendToEdge = useCallback(async (msgs: { role: string; content: string }[]) => {
    const { data, error } = await supabase.functions.invoke("crisis-chat", {
      body: { messages: msgs, system: systemPrompt },
    });
    if (error) throw error;
    return data.content as string;
  }, [systemPrompt]);

  const sendMessage = useCallback(async (text: string, isSystem = false) => {
    const userMsg: Message = { role: "user", content: text, type: isSystem ? "sys" : "user" };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendToEdge(apiMsgs);

      let type: Message["type"] = "sim";
      if (reply.includes("INJECT")) {
        type = "inject";
        if (!injects.i1) setInjects(p => ({ ...p, i1: true }));
        else if (!injects.i2) setInjects(p => ({ ...p, i2: true }));
      }
      if (reply.includes(evalMarker)) {
        type = "eval";
        setEvalDone(true);
        setTimerActive(false);
      }

      const assistantMsg: Message = { role: "assistant", content: reply, type };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      const errMsg: Message = { role: "assistant", content: t('crisisSim.connectionError'), type: "sys" };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [messages, injects, sendToEdge, evalMarker, t]);

  const handleStart = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const reply = await sendToEdge([{ role: "user", content: "START_SIMULATION" }]);
      const msg: Message = { role: "assistant", content: reply, type: "sim" };
      setMessages([{ role: "user", content: "START_SIMULATION", type: "sys" }, msg]);
      setTimerActive(true);
    } catch {
      setMessages([{ role: "assistant", content: t('crisisSim.connectionFailed'), type: "sys" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading || evalDone) return;
    const text = input.trim();
    if (evalKeywordsPattern.test(text)) {
      setTimerActive(false);
    }
    sendMessage(text);
  };

  const handleQuickAction = (text: string) => {
    if (loading || evalDone) return;
    if (evalKeywordsPattern.test(text)) setTimerActive(false);
    sendMessage(text);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(Math.max(0, s) / 60);
    const sec = Math.max(0, s) % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const timerColor = secondsLeft <= 0 ? C.textDim : secondsLeft < 60 ? C.red : secondsLeft < 120 ? "#d4a030" : C.gold;
  const timerClass = secondsLeft <= 0 ? "" : secondsLeft < 60 ? "crisis-timer-critical" : secondsLeft < 120 ? "crisis-timer-warning" : "";

  const getRoleStyle = (msg: Message): { label: string; color: string; borderLeft?: string } => {
    if (msg.type === "user") return { label: t('crisisSim.roleCrisisLead'), color: C.blue };
    if (msg.type === "inject") return { label: t('crisisSim.roleInject'), color: C.inject, borderLeft: `3px solid ${C.inject}` };
    if (msg.type === "eval") return { label: t('crisisSim.roleEval'), color: C.green };
    if (msg.type === "sys") return { label: t('crisisSim.roleSystem'), color: C.red };
    return { label: t('crisisSim.roleSitRoom'), color: C.textDim };
  };

  // ─── SIDEBAR PANEL ────────────────────────────────────────────
  const SidebarPanel = () => (
    <div style={{ width: embedded ? "100%" : 210, flexShrink: 0, background: C.surface, backdropFilter: "blur(10px)", borderRight: embedded ? "none" : `1px solid ${C.borderThin}`, display: "flex", flexDirection: embedded ? "row" : "column", padding: embedded ? "12px" : "16px 12px", gap: embedded ? 16 : 20, overflowY: "auto", fontSize: 11, flexWrap: embedded ? "wrap" : "nowrap", borderBottom: embedded ? `1px solid ${C.borderThin}` : "none" }}>
      {/* PHASES */}
      <div style={{ minWidth: embedded ? 140 : "auto" }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>{t('crisisSim.exercisePhases')}</div>
        {phases.map(p => {
          const isActive = p.id === activePhase;
          const isDone = completedPhases.includes(p.id);
          return (
            <div key={p.id} style={{
              padding: "4px 8px", marginBottom: 2, display: "flex", alignItems: "center", gap: 8,
              borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
              background: isActive ? "rgba(201,148,58,0.08)" : "transparent",
              color: isDone ? C.green : isActive ? C.gold : C.textDim,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isDone ? C.green : isActive ? C.gold : C.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 11 }}>{isDone ? "✓ " : ""}{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* INJECT STATUS */}
      <div style={{ minWidth: embedded ? 160 : "auto" }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>{t('crisisSim.injectStatus')}</div>
        {[
          { label: t('crisisSim.inject1Label'), active: injects.i1 },
          { label: t('crisisSim.inject2Label'), active: injects.i2 },
        ].map((inj, i) => (
          <div key={i} style={{ padding: "4px 0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.borderThin}`, gap: 8 }}>
            <span style={{ fontSize: 10, color: C.textDim }}>{inj.label}</span>
            <span style={{ fontSize: 9, padding: "1px 6px", border: `1px solid ${inj.active ? C.red : C.borderVis}`, color: inj.active ? C.red : C.textDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {inj.active ? t('crisisSim.injectActive') : t('crisisSim.injectReady')}
            </span>
          </div>
        ))}
      </div>

      {/* SCENARIO */}
      <div style={{ minWidth: embedded ? 140 : "auto" }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>{t('crisisSim.scenario')}</div>
        {scenarioItems.map((s, i) => (
          <div key={i} style={{ color: C.textDim, fontSize: 10, padding: "2px 0" }}>{s}</div>
        ))}
      </div>

      {/* LEGAL */}
      <div style={{ minWidth: embedded ? 140 : "auto" }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>{t('crisisSim.legalBasis')}</div>
        {legalItems.map((s, i) => (
          <div key={i} style={{ color: C.textDim, fontSize: 10, padding: "2px 0" }}>{s}</div>
        ))}
      </div>
    </div>
  );

  // ─── PHASE BAR ─────────────────────────────────────────────────
  const PhaseBar = () => (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.borderThin}`, flexShrink: 0 }}>
      {phases.map(p => {
        const isActive = p.id === activePhase;
        const isDone = completedPhases.includes(p.id);
        return (
          <div key={p.id} style={{
            flex: 1, padding: "8px 12px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
            color: isDone ? C.green : isActive ? C.gold : C.textDim,
            borderBottom: isActive ? `2px solid ${C.gold}` : isDone ? `2px solid ${C.green}` : "2px solid transparent",
            textAlign: "center",
          }}>
            Phase {p.id}: {p.label}
          </div>
        );
      })}
    </div>
  );

  // ─── START SCREEN ──────────────────────────────────────────────
  const StartScreen = () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: embedded ? "40px 0" : 0 }}>
      <div style={{ textAlign: "center", maxWidth: 520, padding: "0 24px" }}>
        <DiamondLogo size={58} />
        <div style={{ color: C.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 24, marginBottom: 8 }}>
          {t('crisisSim.ttxLabel')}
        </div>
        <div style={{ color: C.textLight, fontSize: 20, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 24 }}>
          {t('crisisSim.title')}<br />
          <span style={{ color: C.gold, fontSize: 14 }}>{t('crisisSim.roleSubtitle')}</span>
        </div>
        <div
          style={{ border: `1px solid ${C.borderVis}`, padding: 20, marginBottom: 32, textAlign: "left", fontSize: 12, lineHeight: 1.7, color: C.text }}
          dangerouslySetInnerHTML={{ __html: t('crisisSim.startDesc') }}
        />
        <button className="crisis-start-btn" onClick={handleStart} disabled={loading}>
          <span>{loading ? t('crisisSim.connecting') : t('crisisSim.startButton')}</span>
        </button>
      </div>
    </div>
  );

  // ─── CHAT AREA ─────────────────────────────────────────────────
  const ChatArea = () => (
    <div className="crisis-chat-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      {messages.filter(m => m.content !== "START_SIMULATION" && m.type !== "sys").map((msg, i) => {
        const style = getRoleStyle(msg);
        return (
          <div key={i} style={{
            padding: "12px 0",
            borderBottom: `1px solid ${C.borderThin}`,
            borderLeft: style.borderLeft || "none",
            paddingLeft: style.borderLeft ? 12 : 0,
            background: msg.type === "inject" ? "rgba(201,138,58,0.06)" : "transparent",
          }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: style.color, fontWeight: 600, marginBottom: 6 }}>
              {style.label}
            </div>
            <div style={{ color: msg.type === "inject" ? C.injectText : msg.type === "user" ? C.textLight : C.text, fontSize: 13, lineHeight: 1.6 }}>
              {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        );
      })}
      {loading && <TypingIndicator label={t('crisisSim.roleSitRoom')} />}
      <div ref={chatEndRef} />
    </div>
  );

  // ─── INPUT AREA ────────────────────────────────────────────────
  const InputArea = () => (
    <div style={{ borderTop: `1px solid ${C.borderThin}`, background: C.surface, backdropFilter: "blur(10px)", padding: "12px 16px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.borderThin}`, marginBottom: 8 }}>
        <div style={{ padding: "8px 12px", borderRight: `1px solid ${C.borderThin}`, color: C.gold, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", flexShrink: 0 }}>{t('crisisSim.inputPrefix')}</div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={2}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.textLight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, padding: "8px 12px", resize: "none" }}
          placeholder={t('crisisSim.inputPlaceholder')}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: "8px 16px", background: "transparent", border: "none", borderLeft: `1px solid ${C.borderThin}`, color: !input.trim() || loading ? C.textDim : C.gold, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", cursor: !input.trim() || loading ? "default" : "pointer", fontWeight: 600 }}
        >
          {t('crisisSim.sendButton')}
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {quickActions.map((qa, i) => (
          <button
            key={i}
            className={`crisis-qbtn ${"isEval" in qa && qa.isEval ? "crisis-qbtn-eval" : ""}`}
            onClick={() => handleQuickAction(qa.text)}
            disabled={loading}
          >
            {qa.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── SHARED STYLES ─────────────────────────────────────────────
  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
    @keyframes crisisDiamondPulse {
      0%, 100% { opacity: 0.2; transform: scale(0.7); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    @keyframes crisisTimerFlicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .crisis-timer-warning { animation: crisisTimerFlicker 1.5s infinite; }
    .crisis-timer-critical { animation: crisisTimerFlicker 0.6s infinite; }
    .crisis-chat-scroll::-webkit-scrollbar { width: 4px; }
    .crisis-chat-scroll::-webkit-scrollbar-track { background: transparent; }
    .crisis-chat-scroll::-webkit-scrollbar-thumb { background: ${C.borderVis}; }
    .crisis-qbtn { 
      background: transparent; border: 1px solid ${C.borderVis}; color: ${C.gold}; 
      padding: 5px 10px; font-family: 'IBM Plex Mono', monospace; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s;
    }
    .crisis-qbtn:hover { background: rgba(201,148,58,0.12); border-color: ${C.gold}; }
    .crisis-qbtn-eval { border-color: ${C.red}; color: ${C.red}; }
    .crisis-qbtn-eval:hover { background: rgba(184,48,48,0.12); }
    .crisis-start-btn {
      background: transparent; border: 1px solid ${C.gold}; color: ${C.gold};
      padding: 12px 32px; font-family: 'IBM Plex Mono', monospace; font-size: 14px;
      text-transform: uppercase; letter-spacing: 0.15em; cursor: pointer; transition: all 0.3s;
      position: relative; overflow: hidden;
    }
    .crisis-start-btn::before {
      content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: ${C.gold}; transition: left 0.3s; z-index: 0;
    }
    .crisis-start-btn:hover::before { left: 0; }
    .crisis-start-btn:hover { color: ${C.bg}; }
    .crisis-start-btn span { position: relative; z-index: 1; }
  `;

  // ─── COMPACT STATUS BAR (embedded mobile) ───────────────────────
  const CompactStatusBar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: C.surface, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.borderThin}`, flexShrink: 0, gap: 8 }}>
      {/* Phase dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {phases.map(p => {
          const isActive = p.id === activePhase;
          const isDone = completedPhases.includes(p.id);
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isDone ? C.green : isActive ? C.gold : C.textDim, flexShrink: 0, border: isActive ? `1px solid ${C.gold}` : "none" }} />
              <span style={{ fontSize: 9, color: isDone ? C.green : isActive ? C.gold : C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", display: isActive ? "inline" : "none" }}>{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* Inject badges */}
      <div style={{ display: "flex", gap: 4 }}>
        {injects.i1 && <span style={{ fontSize: 8, padding: "1px 4px", border: `1px solid ${C.red}`, color: C.red, textTransform: "uppercase" }}>INJ1</span>}
        {injects.i2 && <span style={{ fontSize: 8, padding: "1px 4px", border: `1px solid ${C.red}`, color: C.red, textTransform: "uppercase" }}>INJ2</span>}
      </div>

      {/* Timer */}
      <div className={timerClass} style={{ fontWeight: 700, fontSize: 16, color: timerColor, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {formatTime(secondsLeft)}
      </div>

      {/* Info toggle */}
      <button
        onClick={() => setInfoPanelOpen(!infoPanelOpen)}
        style={{ background: "transparent", border: `1px solid ${infoPanelOpen ? C.gold : C.borderVis}`, color: infoPanelOpen ? C.gold : C.textDim, padding: "2px 6px", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", flexShrink: 0 }}
      >
        INFO
      </button>
    </div>
  );

  // ─── EMBEDDED RENDER (inside ChatView) ─────────────────────────
  if (embedded) {
    return (
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: C.text, background: C.bg, border: `1px solid ${C.borderThin}`, display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 400 }}>
        <style>{sharedStyles}</style>

        {!started ? (
          <StartScreen />
        ) : (
          <>
            <CompactStatusBar />

            {/* Collapsible info panel */}
            {infoPanelOpen && (
              <div style={{ background: C.surface, borderBottom: `1px solid ${C.borderThin}`, padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 12, fontSize: 10, maxHeight: 180, overflowY: "auto" }}>
                <div style={{ minWidth: 120 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{t('crisisSim.scenario')}</div>
                  {scenarioItems.map((s, i) => (
                    <div key={i} style={{ color: C.textDim, fontSize: 9, padding: "1px 0" }}>{s}</div>
                  ))}
                </div>
                <div style={{ minWidth: 120 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{t('crisisSim.legalBasis')}</div>
                  {legalItems.map((s, i) => (
                    <div key={i} style={{ color: C.textDim, fontSize: 9, padding: "1px 0" }}>{s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat + Input */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <ChatArea />
              {!evalDone && <InputArea />}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── STANDALONE RENDER (full page at /crisis) ──────────────────
  return (
    <>
      <style>{`
        ${sharedStyles}
        body { overflow: hidden; }
      `}</style>

      {/* MM GRID BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: C.bg }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke={C.gold} strokeWidth="0.28" opacity="0.22" />
            </pattern>
            <pattern id="largeGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="url(#smallGrid)" />
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke={C.gold} strokeWidth="0.65" opacity="0.32" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#largeGrid)" />
        </svg>
      </div>

      {/* APP SHELL */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono', monospace", color: C.text }}>

        {/* TOPBAR */}
        <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: C.surface, backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.borderThin}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DiamondLogo size={22} />
            <span style={{ color: C.gold, fontWeight: 600, fontSize: 13, letterSpacing: "0.08em" }}>inside-the-box</span>
            <span style={{ color: C.textDim, margin: "0 4px" }}>/</span>
            <span style={{ color: C.textDim, fontSize: 11, letterSpacing: "0.05em" }}>{t('crisisSim.topbarScenario')}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ border: `1px solid ${C.borderVis}`, padding: "2px 8px", fontSize: 11, color: C.gold, letterSpacing: "0.1em" }}>{language.toUpperCase()}</span>
            {started && (
              <div className={timerClass} style={{ fontWeight: 700, fontSize: 16, color: timerColor, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                {formatTime(secondsLeft)}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* SIDEBAR (vertical) */}
          <div style={{ width: 210, flexShrink: 0, background: C.surface, backdropFilter: "blur(10px)", borderRight: `1px solid ${C.borderThin}`, display: "flex", flexDirection: "column", padding: "16px 12px", gap: 20, overflowY: "auto", fontSize: 11 }}>
            <SidebarPanel />
          </div>

          {/* MAIN */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {started && <PhaseBar />}
            {!started ? <StartScreen /> : (
              <>
                <ChatArea />
                {!evalDone && <InputArea />}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CyberCrisisSimulator;
