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

// ─── DIAMOND LOGO (uses design tokens) ──────────────────────────
const DiamondLogo = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,2 38,20 20,38 2,20" stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
    <polygon points="20,7 33,20 20,33 7,20" stroke="hsl(var(--primary))" strokeWidth="1" fill="none" />
    <polygon points="20,12 28,20 20,28 12,20" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" />
    <polygon points="20,16 24,20 20,24 16,20" stroke="hsl(var(--primary))" strokeWidth="0.6" fill="none" />
  </svg>
);

// ─── TYPING INDICATOR ────────────────────────────────────────────
const TypingIndicator = ({ label }: { label: string }) => (
  <div className="flex gap-1.5 items-center py-3">
    <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-widest mr-2">{label}</span>
    {[0, 1, 2].map(i => (
      <svg key={i} width="8" height="8" viewBox="0 0 10 10" style={{ animation: `crisisDiamondPulse 1.2s ${i * 0.2}s infinite ease-in-out` }}>
        <polygon points="5,0 10,5 5,10 0,5" fill="hsl(var(--primary))" />
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
        <table key={`t-${elements.length}`} className="w-full border-collapse my-2 font-mono text-xs">
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-2 py-1 ${ri === 0 ? "text-primary" : "text-muted-foreground"}`}>{cell.trim()}</td>
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
      elements.push(<div key={i} className="text-primary uppercase tracking-widest font-bold text-sm mt-4 mb-1.5 pb-1 border-b border-border/50 font-mono">{line.slice(3)}</div>);
    } else if (line.startsWith("### ")) {
      elements.push(<div key={i} className="text-highlight font-semibold text-[13px] mt-3 mb-1 font-mono">{line.slice(4)}</div>);
    } else if (line === "---") {
      elements.push(<hr key={i} className="border-t border-border/50 my-2" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      elements.push(
        <div key={i} className="leading-relaxed text-[13px]">
          {parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <span key={pi} className="text-primary font-semibold">{part.slice(2, -2)}</span>;
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

  const timerColor = secondsLeft <= 0 ? "text-muted-foreground" : secondsLeft < 60 ? "text-destructive" : secondsLeft < 120 ? "text-primary" : "text-primary";
  const timerClass = secondsLeft <= 0 ? "" : secondsLeft < 60 ? "crisis-timer-critical" : secondsLeft < 120 ? "crisis-timer-warning" : "";

  const getRoleStyle = (msg: Message): { label: string; colorClass: string; borderClass?: string } => {
    if (msg.type === "user") return { label: t('crisisSim.roleCrisisLead'), colorClass: "text-highlight" };
    if (msg.type === "inject") return { label: t('crisisSim.roleInject'), colorClass: "text-primary", borderClass: "border-l-2 border-primary/40 pl-3" };
    if (msg.type === "eval") return { label: t('crisisSim.roleEval'), colorClass: "text-green-400" };
    if (msg.type === "sys") return { label: t('crisisSim.roleSystem'), colorClass: "text-destructive" };
    return { label: t('crisisSim.roleSitRoom'), colorClass: "text-muted-foreground" };
  };

  // ─── SIDEBAR PANEL ────────────────────────────────────────────
  const SidebarPanel = () => (
    <div className={`flex-shrink-0 ${embedded ? "w-full flex flex-row flex-wrap gap-4 p-3 border-b border-border/50" : "w-[210px] flex flex-col gap-5 p-4 border-r border-border/50"} bg-card/40 backdrop-blur-sm overflow-y-auto text-[11px]`}>
      {/* PHASES */}
      <div className={embedded ? "min-w-[140px]" : ""}>
        <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em] mb-2">{t('crisisSim.exercisePhases')}</div>
        {phases.map(p => {
          const isActive = p.id === activePhase;
          const isDone = completedPhases.includes(p.id);
          return (
            <div key={p.id} className={`py-1 px-2 mb-0.5 flex items-center gap-2 ${isActive ? "border-l-2 border-primary bg-primary/5" : "border-l-2 border-transparent"}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDone ? "bg-green-400" : isActive ? "bg-primary" : "bg-muted-foreground/50"}`} />
              <span className={`text-[11px] ${isDone ? "text-green-400" : isActive ? "text-primary" : "text-muted-foreground"}`}>{isDone ? "✓ " : ""}{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* INJECT STATUS */}
      <div className={embedded ? "min-w-[160px]" : ""}>
        <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em] mb-2">{t('crisisSim.injectStatus')}</div>
        {[
          { label: t('crisisSim.inject1Label'), active: injects.i1 },
          { label: t('crisisSim.inject2Label'), active: injects.i2 },
        ].map((inj, i) => (
          <div key={i} className="py-1 flex justify-between items-center border-b border-border/30 gap-2">
            <span className="text-[10px] text-muted-foreground">{inj.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 border uppercase tracking-wider ${inj.active ? "border-destructive text-destructive" : "border-border text-muted-foreground"}`}>
              {inj.active ? t('crisisSim.injectActive') : t('crisisSim.injectReady')}
            </span>
          </div>
        ))}
      </div>

      {/* SCENARIO */}
      <div className={embedded ? "min-w-[140px]" : ""}>
        <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em] mb-2">{t('crisisSim.scenario')}</div>
        {scenarioItems.map((s, i) => (
          <div key={i} className="text-muted-foreground text-[10px] py-0.5">{s}</div>
        ))}
      </div>

      {/* LEGAL */}
      <div className={embedded ? "min-w-[140px]" : ""}>
        <div className="text-primary font-bold text-[10px] uppercase tracking-[0.15em] mb-2">{t('crisisSim.legalBasis')}</div>
        {legalItems.map((s, i) => (
          <div key={i} className="text-muted-foreground text-[10px] py-0.5">{s}</div>
        ))}
      </div>
    </div>
  );

  // ─── PHASE BAR ─────────────────────────────────────────────────
  const PhaseBar = () => (
    <div className="flex border-b border-border/50 flex-shrink-0">
      {phases.map(p => {
        const isActive = p.id === activePhase;
        const isDone = completedPhases.includes(p.id);
        return (
          <div key={p.id} className={`flex-1 py-2 px-3 text-[10px] uppercase tracking-wider text-center ${isDone ? "text-green-400 border-b-2 border-green-400" : isActive ? "text-primary border-b-2 border-primary" : "text-muted-foreground border-b-2 border-transparent"}`}>
            Phase {p.id}: {p.label}
          </div>
        );
      })}
    </div>
  );

  // ─── START SCREEN ──────────────────────────────────────────────
  const StartScreen = () => (
    <div className={`flex-1 flex items-center justify-center ${embedded ? "py-5" : ""} overflow-y-auto`}>
      <div className="text-center max-w-[520px] px-4">
        <DiamondLogo size={embedded ? 40 : 58} />
        <div className="text-muted-foreground text-[9px] uppercase tracking-[0.2em] mt-4 mb-1.5">
          {t('crisisSim.ttxLabel')}
        </div>
        <div className={`text-foreground ${embedded ? "text-lg" : "text-xl"} font-semibold tracking-wide mb-4`}>
          {t('crisisSim.title')}<br />
          <span className="text-primary text-sm">{t('crisisSim.roleSubtitle')}</span>
        </div>
        <div
          className={`border border-border/50 ${embedded ? "p-3 mb-4 text-[11px]" : "p-5 mb-8 text-xs"} text-left leading-relaxed text-foreground/80`}
          dangerouslySetInnerHTML={{ __html: t('crisisSim.startDesc') }}
        />
        <button className="crisis-start-btn" onClick={handleStart} disabled={loading} style={embedded ? { padding: "10px 24px", fontSize: 13 } : undefined}>
          <span>{loading ? t('crisisSim.connecting') : t('crisisSim.startButton')}</span>
        </button>
      </div>
    </div>
  );

  // ─── CHAT AREA ─────────────────────────────────────────────────
  const ChatArea = () => (
    <div className={`crisis-chat-scroll flex-1 overflow-y-auto ${embedded ? "px-3 py-2" : "px-5 py-4"}`}>
      {messages.filter(m => m.content !== "START_SIMULATION" && m.type !== "sys").map((msg, i) => {
        const style = getRoleStyle(msg);
        return (
          <div key={i} className={`${embedded ? "py-2" : "py-3"} border-b border-border/30 ${style.borderClass || ""} ${msg.type === "inject" ? "bg-primary/5" : ""}`}>
            <div className={`text-[10px] uppercase tracking-widest font-semibold mb-1 ${style.colorClass}`}>
              {style.label}
            </div>
            <div className={`${msg.type === "user" ? "text-foreground" : "text-foreground/85"} ${embedded ? "text-xs" : "text-[13px]"} leading-relaxed`}>
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
  const [qaOpen, setQaOpen] = useState(false);

  const InputArea = () => (
    <div className={`border-t border-border/50 bg-card/40 backdrop-blur-sm ${embedded ? "p-2" : "p-3"} flex-shrink-0`}>
      <div className="flex items-center border border-border/50 mb-1.5">
        <div className="px-2 py-1.5 border-r border-border/50 text-primary text-[11px] font-semibold tracking-wider flex-shrink-0 font-mono">{t('crisisSim.inputPrefix')}</div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          rows={1}
          className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-[13px] px-2 py-1.5 resize-none placeholder:text-muted-foreground"
          placeholder={t('crisisSim.inputPlaceholder')}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={`px-3 py-1.5 bg-transparent border-none border-l border-border/50 font-mono text-[11px] uppercase tracking-wider font-semibold ${!input.trim() || loading ? "text-muted-foreground cursor-default" : "text-primary cursor-pointer hover:text-accent"}`}
          style={{ borderLeft: "1px solid hsl(var(--border) / 0.5)" }}
        >
          {t('crisisSim.sendButton')}
        </button>
      </div>
      {/* Quick Actions: collapsible on embedded/mobile */}
      {embedded ? (
        <>
          <button
            onClick={() => setQaOpen(!qaOpen)}
            className={`w-full bg-transparent border text-[9px] font-mono uppercase tracking-wider cursor-pointer py-1 px-2.5 ${qaOpen ? "border-primary text-primary mb-1.5" : "border-border text-muted-foreground"}`}
          >
            {qaOpen ? "▾ " : "▸ "}{t('crisisSim.quickActions')}
          </button>
          {qaOpen && (
            <div className="flex flex-col gap-1">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  className={`crisis-qbtn ${"isEval" in qa && qa.isEval ? "crisis-qbtn-eval" : ""}`}
                  onClick={() => { handleQuickAction(qa.text); setQaOpen(false); }}
                  disabled={loading}
                  style={{ width: "100%", textAlign: "left", padding: "6px 10px" }}
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-1.5">
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
      )}
    </div>
  );

  // ─── SHARED STYLES ─────────────────────────────────────────────
  const sharedStyles = `
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
    .crisis-chat-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); }
    .crisis-qbtn { 
      background: transparent; border: 1px solid hsl(var(--border)); color: hsl(var(--primary)); 
      padding: 5px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s;
    }
    .crisis-qbtn:hover { background: hsl(var(--primary) / 0.1); border-color: hsl(var(--primary)); }
    .crisis-qbtn-eval { border-color: hsl(var(--destructive)); color: hsl(var(--destructive)); }
    .crisis-qbtn-eval:hover { background: hsl(var(--destructive) / 0.1); }
    .crisis-start-btn {
      background: transparent; border: 1px solid hsl(var(--primary)); color: hsl(var(--primary));
      padding: 12px 32px; font-family: 'JetBrains Mono', monospace; font-size: 14px;
      text-transform: uppercase; letter-spacing: 0.15em; cursor: pointer; transition: all 0.3s;
      position: relative; overflow: hidden;
    }
    .crisis-start-btn::before {
      content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: hsl(var(--primary)); transition: left 0.3s; z-index: 0;
    }
    .crisis-start-btn:hover::before { left: 0; }
    .crisis-start-btn:hover { color: hsl(var(--primary-foreground)); }
    .crisis-start-btn span { position: relative; z-index: 1; }
  `;

  // ─── COMPACT STATUS BAR (embedded mobile) ───────────────────────
  const CompactStatusBar = () => (
    <div className="flex items-center justify-between px-3 py-1.5 bg-card/40 backdrop-blur-sm border-b border-border/50 flex-shrink-0 gap-2">
      {/* Phase dots */}
      <div className="flex items-center gap-1.5">
        {phases.map(p => {
          const isActive = p.id === activePhase;
          const isDone = completedPhases.includes(p.id);
          return (
            <div key={p.id} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? "bg-green-400" : isActive ? "bg-primary border border-primary" : "bg-muted-foreground/40"}`} />
              {isActive && <span className="text-[9px] text-primary uppercase tracking-wider">{p.label}</span>}
            </div>
          );
        })}
      </div>

      {/* Inject badges */}
      <div className="flex gap-1">
        {injects.i1 && <span className="text-[8px] px-1 py-0.5 border border-destructive text-destructive uppercase">INJ1</span>}
        {injects.i2 && <span className="text-[8px] px-1 py-0.5 border border-destructive text-destructive uppercase">INJ2</span>}
      </div>

      {/* Timer */}
      <div className={`font-bold text-base tracking-wider tabular-nums flex-shrink-0 font-mono ${timerColor} ${timerClass}`}>
        {formatTime(secondsLeft)}
      </div>

      {/* Info toggle */}
      <button
        onClick={() => setInfoPanelOpen(!infoPanelOpen)}
        className={`bg-transparent border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider cursor-pointer flex-shrink-0 ${infoPanelOpen ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
      >
        INFO
      </button>
    </div>
  );

  // ─── EMBEDDED RENDER (inside ChatView) ─────────────────────────
  if (embedded) {
    return (
      <div className="text-foreground border border-border/50 flex flex-col min-h-[400px]" style={{ height: "calc(100vh - 120px)" }}>
        <style>{sharedStyles}</style>

        {!started ? (
          <StartScreen />
        ) : (
          <>
            <CompactStatusBar />

            {/* Collapsible info panel */}
            {infoPanelOpen && (
              <div className="bg-card/40 border-b border-border/50 p-2.5 flex flex-wrap gap-3 text-[10px] max-h-[180px] overflow-y-auto">
                <div className="min-w-[120px]">
                  <div className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1">{t('crisisSim.scenario')}</div>
                  {scenarioItems.map((s, i) => (
                    <div key={i} className="text-muted-foreground text-[9px] py-px">{s}</div>
                  ))}
                </div>
                <div className="min-w-[120px]">
                  <div className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1">{t('crisisSim.legalBasis')}</div>
                  {legalItems.map((s, i) => (
                    <div key={i} className="text-muted-foreground text-[9px] py-px">{s}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat + Input */}
            <div className="flex-1 flex flex-col overflow-hidden">
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
      <style>{sharedStyles}</style>

      {/* APP SHELL – transparent, inherits site bg */}
      <div className="fixed inset-0 z-10 flex flex-col text-foreground">

        {/* TOPBAR */}
        <div className="h-[52px] flex items-center justify-between px-4 bg-card/60 backdrop-blur-sm border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <DiamondLogo size={22} />
            <span className="text-primary font-semibold text-[13px] tracking-wider">inside-the-box</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-muted-foreground text-[11px] tracking-wider">{t('crisisSim.topbarScenario')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-border px-2 py-0.5 text-[11px] text-primary tracking-wider font-mono">{language.toUpperCase()}</span>
            {started && (
              <div className={`font-bold text-base tracking-wider tabular-nums font-mono ${timerColor} ${timerClass}`}>
                {formatTime(secondsLeft)}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR (vertical) */}
          <SidebarPanel />

          {/* MAIN */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
