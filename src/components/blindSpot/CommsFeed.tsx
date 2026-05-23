import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CommsFeedHandle {
  appendAssistant: (role: Exclude<CommsRole, "YOU">, body: string) => void;
}


/* ===================== Types ===================== */

export type CommsRole =
  | "IT-Ops"
  | "OT-Ops"
  | "Incident Commander"
  | "Management & Comms"
  | "YOU";

export type SystemKind = "splunk" | "claroty" | "ransom";

export interface AlertCard {
  kind: SystemKind;
  title: string;
  rows: Array<[string, string]>;
  body?: string;
  /** Optional original log line(s) — shown verbatim below the parsed card. */
  rawLog?: string;
}

interface FeedMessage {
  id: string;
  kind: "chat" | "system";
  role: CommsRole | "SPLUNK SIEM" | "CLAROTY OT MONITOR" | "INCOMING MESSAGE";
  time: string; // HH:MM:SS
  body?: string;
  card?: AlertCard;
}

interface Props {
  phaseIndex: 1 | 2 | 3 | 4;
  phaseName: string;
  phaseTimestamp: string;
  situation: string;
  userRoleName: string; // e.g. "IT-Ops"
  onLatestByRole: (latest: Record<string, string>) => void;
  onLastUserMessage: (text: string) => void;
  onSequenceComplete?: () => void;
  onScriptedDone?: () => void;
  onUserMessageCount?: (count: number) => void;
  onSystemAlert?: (alert: { card: AlertCard; time: string; source: string }) => void;
  hideSystemMessages?: boolean;
}


/* ===================== Constants ===================== */

const ROLE_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  "IT-Ops": { bg: "bg-[#3b82f6]", ring: "ring-[#3b82f6]", text: "text-[#60a5fa]" },
  "OT-Ops": { bg: "bg-[#f59e0b]", ring: "ring-[#f59e0b]", text: "text-[#fbbf24]" },
  "Incident Commander": { bg: "bg-[#ef4444]", ring: "ring-[#ef4444]", text: "text-[#f87171]" },
  "Management & Comms": { bg: "bg-[#a855f7]", ring: "ring-[#a855f7]", text: "text-[#c084fc]" },
  YOU: { bg: "bg-[#10b981]", ring: "ring-[#10b981]", text: "text-[#34d399]" },
};

const ROLE_INITIAL: Record<string, string> = {
  "IT-Ops": "IT",
  "OT-Ops": "OT",
  "Incident Commander": "IC",
  "Management & Comms": "MC",
  YOU: "YOU",
};

const PHASE_BASE_TIME: Record<number, [number, number, number]> = {
  1: [22, 47, 31],
  2: [23, 32, 10],
  3: [0, 17, 4],
  4: [2, 47, 22],
};

const fmtTime = ([h, m, s]: [number, number, number]) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

const stepTime = (
  base: [number, number, number],
  offsetSec: number,
): string => {
  const total = base[0] * 3600 + base[1] * 60 + base[2] + offsetSec;
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return fmtTime([h, m, s]);
};

/* ===================== Alert cards per phase ===================== */

const SPLUNK_CARD: AlertCard = {
  kind: "splunk",
  title: "SPLUNK ALERT",
  rows: [
    ["Severity", "HIGH"],
    ["Rule", "Lateral movement"],
    ["Source", "10.10.20.50"],
    ["Dest", "10.10.20.30"],
    ["Time", "22:47:31"],
  ],
  rawLog:
    `2026-05-23T22:47:31.482Z host=splunk-idx01 source="WinEventLog:Security" sourcetype=XmlWinEventLog
EventCode=4624  LogonType=3  TargetUserName="svc_backup"  TargetDomainName="NORPOWER"
IpAddress=10.10.20.50  IpPort=49872  WorkstationName="JUMP-DMZ-01"
ProcessName="C:\\\\Windows\\\\System32\\\\lsass.exe"  AuthenticationPackageName=NTLM
[correlation_rule="lateral_movement_v3"  risk_score=78  notable=true]
-> 10.10.20.30  (SRV-FILE01)  share=ADMIN$  status=0x0`,
};

const CLAROTY_CARD: AlertCard = {
  kind: "claroty",
  title: "CLAROTY OT MONITOR",
  rows: [
    ["Asset", "PLC-01 · 10.10.30.11"],
    ["Event", "Unauthorised config write"],
    ["Protocol", "S7comm"],
    ["Severity", "CRITICAL"],
  ],
  rawLog:
    `2026-05-23T23:32:10.117Z claroty-ctd  alert_id=CTD-44192  severity=CRITICAL
asset="PLC-01"  ip=10.10.30.11  vendor=Siemens  model=S7-1500  zone=OT-SIM
event="Unauthorised config write"  protocol=S7comm  function=PLC_WRITE(0x05)
src=10.10.20.50  src_zone=DMZ  dst=10.10.30.11  bytes=438
baseline_violation=true  policy="OT_WRITE_DENY"  ack=false`,
};

const SIS_CARD: AlertCard = {
  kind: "claroty",
  title: "CLAROTY OT MONITOR",
  rows: [
    ["Asset", "SIS · 10.10.30.99"],
    ["Event", "SIS pre-alarm — emergency shutdown"],
    ["Protocol", "Safety bus"],
    ["Severity", "CRITICAL"],
  ],
  rawLog:
    `2026-05-24T00:17:04.903Z claroty-ctd  alert_id=CTD-44260  severity=CRITICAL
asset="SIS-01"  ip=10.10.30.99  vendor=HIMA  model=HIMax  zone=SIS (air-gapped)
event="SIS pre-alarm — emergency shutdown initiated"  protocol="Safety bus (proprietary)"
trigger="process_temp>limit"  setpoint=88C  measured=94.2C  duration=12s
action=ESD_STAGE_1  operator_ack=pending`,
};

const RANSOM_CARD: AlertCard = {
  kind: "ransom",
  title: "INCOMING MESSAGE",
  rows: [],
  body:
    "YOUR NETWORK HAS BEEN COMPROMISED.\nClient data is in our possession.\nContact us within 12 hours.\n[ENCRYPTED CHANNEL — LINK REDACTED]",
};

/* ===================== Scripted sequences ===================== */

type SequenceItem =
  | { kind: "system"; source: FeedMessage["role"]; card: AlertCard; offset: number }
  | { kind: "ai"; role: CommsRole; prompt: string; offset: number };

const SEQUENCES: Record<number, SequenceItem[]> = {
  1: [
    { kind: "system", source: "SPLUNK SIEM", card: SPLUNK_CARD, offset: 0 },
    {
      kind: "ai",
      role: "IT-Ops",
      offset: 4,
      prompt:
        "React to the new Splunk lateral-movement alert. Flag the Jump Host vendor VPN session and ask the Incident Commander for guidance on terminating it.",
    },
    {
      kind: "ai",
      role: "OT-Ops",
      offset: 11,
      prompt:
        "Confirm OT Sim Network is nominal at this moment. Ask whether OT Historian traffic is affected.",
    },
    {
      kind: "ai",
      role: "Incident Commander",
      offset: 19,
      prompt:
        "Acknowledge the alert. Tell IT-Ops to investigate the Jump Host session and OT-Ops to stand by for isolation.",
    },
  ],
  2: [
    { kind: "system", source: "CLAROTY OT MONITOR", card: CLAROTY_CARD, offset: 0 },
    {
      kind: "ai",
      role: "OT-Ops",
      offset: 5,
      prompt:
        "Critical: confirm an unauthorised S7comm write to PLC-01. Flag the state change and request the IC's decision on isolating the OT Sim Network.",
    },
    {
      kind: "ai",
      role: "IT-Ops",
      offset: 12,
      prompt:
        "Confirm ransomware on ENG-WS-01 and that the OT Historian is unreachable. Recommend EDR containment.",
    },
    {
      kind: "ai",
      role: "Incident Commander",
      offset: 20,
      prompt:
        "Escalate to critical. State that the NIS-2 24h early-warning clock has started now.",
    },
    {
      kind: "ai",
      role: "Management & Comms",
      offset: 28,
      prompt:
        "Say a client notification draft is being prepared. Ask the IC for the go-ahead before sending.",
    },
  ],
  3: [
    { kind: "system", source: "CLAROTY OT MONITOR", card: SIS_CARD, offset: 0 },
    {
      kind: "ai",
      role: "OT-Ops",
      offset: 5,
      prompt:
        "SIS triggered and emergency shutdown executed on the affected line. Request a clear IC decision on next steps.",
    },
    { kind: "system", source: "INCOMING MESSAGE", card: RANSOM_CARD, offset: 13 },
    {
      kind: "ai",
      role: "Management & Comms",
      offset: 18,
      prompt:
        "Media inquiry received. A holding statement is needed urgently. Ask the IC whether to formally reject attacker contact.",
    },
    {
      kind: "ai",
      role: "Incident Commander",
      offset: 26,
      prompt:
        "Confirm the shutdown stays. Initiate NSM contact and reject attacker channel.",
    },
  ],
  4: [
    {
      kind: "ai",
      role: "IT-Ops",
      offset: 0,
      prompt:
        "Forensics is engaged. PLC-02 and the SIS are clean. A partial restart is technically feasible from validated backups.",
    },
    {
      kind: "ai",
      role: "OT-Ops",
      offset: 8,
      prompt:
        "Recommend a conditional restart under continuous monitoring. Outline the safety risk if assumptions are wrong.",
    },
    {
      kind: "ai",
      role: "Management & Comms",
      offset: 16,
      prompt:
        "Board update due end of day. The NIS-2 formal 72h notification draft is ready and needs IC sign-off.",
    },
    {
      kind: "ai",
      role: "Incident Commander",
      offset: 24,
      prompt:
        "Call the decision: restart yes/no, notification text status, and the board message direction.",
    },
  ],
};

/* ===================== Component ===================== */

const COMMS_SYSTEM_PROMPT = (role: string, phaseName: string, ts: string) =>
  `You are ${role} in a live OT cyber crisis exercise.
Company: NorPower, Oslo. Scenario: Blind Spot.
Current phase: ${phaseName}. Timestamp: ${ts}.
Write exactly one Microsoft Teams chat message — 2 to 3 sentences, natural tone, no bullet points, no headers, no role label, no timestamp. React to the latest event and to what the user just said if anything. Ask one sharp operational question. Recommend one concrete action. Stay in character. Never explain the exercise format.`;

export const CommsFeed = forwardRef<CommsFeedHandle, Props>(function CommsFeed(
  {
    phaseIndex,
    phaseName,
    phaseTimestamp,
    situation,
    userRoleName,
    onLatestByRole,
    onLastUserMessage,
    onSequenceComplete,
    onScriptedDone,
    onUserMessageCount,
    onSystemAlert,
    hideSystemMessages,
  },
  ref,
) {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [typingRole, setTypingRole] = useState<CommsRole | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [scriptedDone, setScriptedDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seqStartedRef = useRef<number | null>(null);
  const completeFiredRef = useRef<number | null>(null);

  const base = PHASE_BASE_TIME[phaseIndex];

  useImperativeHandle(ref, () => ({
    appendAssistant: (role, body) => {
      setMessages((m) => [
        ...m,
        {
          id: `${phaseIndex}-injected-${role}-${Date.now()}`,
          kind: "chat",
          role,
          time: stepTime(base, m.length * 2 + 5),
          body,
        },
      ]);
    },
  }));

  /* ---- Reset + run scripted sequence per phase ---- */
  useEffect(() => {
    if (seqStartedRef.current === phaseIndex) return;
    seqStartedRef.current = phaseIndex;
    setMessages([]);
    setTypingRole(null);
    setUserMsgCount(0);
    setScriptedDone(false);
    completeFiredRef.current = null;
    onUserMessageCount?.(0);

    // Filter out scripted AI messages for the role the user is playing —
    // the user fulfils that role themselves.
    const seq = (SEQUENCES[phaseIndex] ?? []).filter(
      (item) => item.kind !== "ai" || item.role !== userRoleName,
    );
    const timers: number[] = [];
    let lastMessageAt = 0;

    seq.forEach((item) => {
      const fireDelay = (item.offset + 1) * 800;

      if (item.kind === "system") {
        timers.push(
          window.setTimeout(() => {
            const time = stepTime(base, item.offset);
            onSystemAlert?.({ card: item.card, time, source: String(item.source) });
            if (!hideSystemMessages) {
              setMessages((m) => [
                ...m,
                {
                  id: `${phaseIndex}-sys-${item.offset}`,
                  kind: "system",
                  role: item.source,
                  time,
                  card: item.card,
                },
              ]);
            }
          }, fireDelay),
        );
        lastMessageAt = Math.max(lastMessageAt, fireDelay);
      } else {
        const typingAt = fireDelay;
        const messageAt = fireDelay + 1800;
        timers.push(window.setTimeout(() => setTypingRole(item.role), typingAt));
        timers.push(
          window.setTimeout(async () => {
            const text = await fetchAiMessage(item.role, item.prompt, []);
            setTypingRole(null);
            setMessages((m) => [
              ...m,
              {
                id: `${phaseIndex}-ai-${item.role}-${item.offset}`,
                kind: "chat",
                role: item.role,
                time: stepTime(base, item.offset + 2),
                body: text,
              },
            ]);
          }, messageAt),
        );
        lastMessageAt = Math.max(lastMessageAt, messageAt);
      }
    });

    if (seq.length > 0) {
      timers.push(window.setTimeout(() => setScriptedDone(true), lastMessageAt + 8000));
    } else {
      setScriptedDone(true);
    }

    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex]);

  /* ---- Fire onScriptedDone as soon as scripted sequence finishes ---- */
  useEffect(() => {
    if (scriptedDone) onScriptedDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptedDone, phaseIndex]);

  /* ---- Gate: fire onSequenceComplete only when scripted done AND user sent ≥1 msg ---- */
  useEffect(() => {
    if (!onSequenceComplete) return;
    if (completeFiredRef.current === phaseIndex) return;
    if (scriptedDone && userMsgCount >= 1) {
      completeFiredRef.current = phaseIndex;
      onSequenceComplete();
    }
  }, [scriptedDone, userMsgCount, phaseIndex, onSequenceComplete]);




  /* ---- Sync derived state up ---- */
  useEffect(() => {
    const latest: Record<string, string> = {};
    for (const m of messages) {
      if (m.kind === "chat" && m.role !== "YOU" && m.body) {
        latest[m.role as string] = m.body;
      }
    }
    onLatestByRole(latest);

    const lastUser = [...messages].reverse().find((m) => m.role === "YOU");
    if (lastUser?.body) onLastUserMessage(lastUser.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  /* ---- Autoscroll ---- */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typingRole]);

  /* ---- AI call ---- */
  const fetchAiMessage = async (
    aiRole: CommsRole,
    explicitInstruction: string,
    extraHistory: Array<{ role: "user" | "assistant"; content: string }>,
  ): Promise<string> => {
    try {
      // Build a short history snapshot (last 6 chat messages)
      const recent = messages
        .filter((m) => m.kind === "chat" && m.body)
        .slice(-6)
        .map<{ role: "user" | "assistant"; content: string }>((m) => ({
          role: m.role === "YOU" ? "user" : "assistant",
          content: `${m.role === "YOU" ? userRoleName : m.role}: ${m.body}`,
        }));

      const { data, error } = await supabase.functions.invoke("blind-spot-chat", {
        body: {
          mode: "comms",
          aiRole,
          userRole: userRoleName,
          phaseName,
          phaseTimestamp,
          situation,
          userInput: explicitInstruction,
          history: [...recent, ...extraHistory],
          systemPromptOverride: COMMS_SYSTEM_PROMPT(aiRole, phaseName, phaseTimestamp),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.text as string) ?? "";
    } catch {
      return `(${aiRole} is offline — comms link degraded.)`;
    }
  };

  /* ---- Relevance routing for user message ---- */
  const pickResponder = (text: string): CommsRole => {
    const all: CommsRole[] = (
      ["IT-Ops", "OT-Ops", "Incident Commander", "Management & Comms"] as CommsRole[]
    ).filter((r) => r !== (userRoleName as CommsRole));
    const t = text.toLowerCase();
    const score: Record<string, number> = {};
    for (const r of all) score[r] = 0;
    const bumps: Array<[CommsRole, RegExp, number]> = [
      ["IT-Ops", /\b(edr|siem|jump host|vpn|workstation|eng-ws|identity|account|firewall|patch)\b/, 3],
      ["OT-Ops", /\b(plc|sis|s7|historian|scada|safety|shutdown|process|control|claroty)\b/, 3],
      ["Incident Commander", /\b(decision|decide|escalate|nis-?2|notify|authoris|authorize|priorit|coordinate)\b/, 3],
      ["Management & Comms", /\b(client|customer|board|media|statement|press|nsm|regulator|legal|reputation)\b/, 3],
    ];
    for (const [r, rx, w] of bumps) if (r !== userRoleName && rx.test(t)) score[r] += w;
    // default to IC for anything question-shaped
    if (/\?/.test(text)) score["Incident Commander" as keyof typeof score] = (score["Incident Commander"] ?? 0) + 1;
    let best = all[0];
    let bestScore = -1;
    for (const r of all) {
      if ((score[r] ?? 0) > bestScore) {
        bestScore = score[r] ?? 0;
        best = r;
      }
    }
    return best;
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    const offset = Math.max(1, messages.length * 2);
    setMessages((m) => [
      ...m,
      {
        id: `${phaseIndex}-you-${Date.now()}`,
        kind: "chat",
        role: "YOU",
        time: stepTime(base, offset),
        body: text,
      },
    ]);
    setUserMsgCount((n) => {
      const next = n + 1;
      onUserMessageCount?.(next);
      return next;
    });

    const responder = pickResponder(text);
    setTimeout(() => setTypingRole(responder), 400);

    const reply = await fetchAiMessage(
      responder,
      `${userRoleName} just said: "${text}". Respond now in character.`,
      [],
    );
    setTimeout(() => {
      setTypingRole(null);
      setMessages((m) => [
        ...m,
        {
          id: `${phaseIndex}-ai-${responder}-reply-${Date.now()}`,
          kind: "chat",
          role: responder,
          time: stepTime(base, offset + 3),
          body: reply,
        },
      ]);
      setSending(false);
    }, 1600);
  };

  const participants = useMemo(
    () => ["IT-Ops", "OT-Ops", "Incident Commander", "Management & Comms"] as CommsRole[],
    [],
  );

  return (
    <div
      className="flex flex-col rounded-lg border h-full min-h-0 overflow-hidden"
      style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "#2a2a2a" }}
      >
        <span className="font-mono text-[11px] text-white/50">
          #blind-spot-incident-response
        </span>
        <div className="flex items-center gap-2">
          {participants.map((r) => {
            const isYou = r === (userRoleName as CommsRole);
            const c = ROLE_COLORS[r];
            return (
              <div key={r} className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full ${c.bg} text-[9px] font-mono font-bold flex items-center justify-center text-black`}
                  title={r}
                >
                  {ROLE_INITIAL[r]}
                </div>
                {isYou && (
                  <span className="font-mono text-[8px] text-white/60 mt-0.5">YOU</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
          <FeedRow key={m.id} m={m} />
        ))}
        {typingRole && <TypingIndicator role={typingRole} />}
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2" style={{ borderColor: "#2a2a2a" }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message #blind-spot-incident-response"
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white text-sm font-mono placeholder:text-white/30"
          disabled={sending}
        />
        <Button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider text-xs"
        >
          Send
        </Button>
      </div>
    </div>
  );
});


/* ===================== Sub-components ===================== */

const FeedRow = ({ m }: { m: FeedMessage }) => {
  if (m.kind === "system") {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
            {m.role}
          </span>
          <span className="font-mono text-[10px] text-white/30">{m.time}</span>
        </div>
        {m.card && <AlertCardView card={m.card} />}
      </div>
    );
  }

  const c = ROLE_COLORS[m.role as string] ?? ROLE_COLORS["YOU"];
  return (
    <div className="flex gap-3 animate-fade-in">
      <div
        className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-black text-[10px] font-mono font-bold shrink-0`}
      >
        {ROLE_INITIAL[m.role as string] ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-[13px] font-semibold ${c.text}`}>{m.role}</span>
          <span className="font-mono text-[10px] text-white/40">{m.time}</span>
        </div>
        <p className="text-[13px] text-white/90 leading-[1.6] whitespace-pre-wrap break-words">
          {m.body}
        </p>
      </div>
    </div>
  );
};

const TypingIndicator = ({ role }: { role: CommsRole }) => {
  const c = ROLE_COLORS[role];
  return (
    <div className="flex gap-3 items-center pl-11">
      <span className={`text-[11px] italic ${c.text}`}>{role} is typing</span>
      <span className="flex gap-1">
        <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "200ms" }} />
        <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: "400ms" }} />
      </span>
    </div>
  );
};

const AlertCardView = ({ card }: { card: AlertCard }) => {
  const accent =
    card.kind === "splunk" ? "#f59e0b" : card.kind === "claroty" ? "#fb923c" : "#ef4444";
  const bg =
    card.kind === "ransom" ? "#1a0000" : card.kind === "splunk" ? "#1a1408" : "#1a1208";
  const titleColor =
    card.kind === "splunk" ? "#fbbf24" : card.kind === "claroty" ? "#fdba74" : "#fca5a5";

  return (
    <div
      className="rounded-md p-3 mt-1 animate-fade-in border"
      style={{
        backgroundColor: bg,
        borderColor: "#2a2a2a",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-wider mb-2"
        style={{ color: titleColor }}
      >
        {card.title}
      </div>

      {card.body ? (
        <p className="font-mono text-[12px] text-white/90 whitespace-pre-wrap leading-relaxed">
          {card.body}
        </p>
      ) : (
        <div className="font-mono text-[12px] text-white/90 space-y-0.5">
          {card.rows.map(([k, v]) => (
            <div key={k} className="flex">
              <span className="w-20 text-white/50">{k}:</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}

      {card.rawLog && <RawLogBlock log={card.rawLog} />}
    </div>
  );
};

const RawLogBlock = ({ log }: { log: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[10px] uppercase tracking-wider text-white/45 hover:text-[#f5b800] transition-colors flex items-center gap-1.5"
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>Raw log</span>
      </button>
      {open && (
        <pre className="mt-2 rounded-sm border border-white/10 bg-black/60 p-2 font-mono text-[10.5px] leading-relaxed text-emerald-200/85 whitespace-pre-wrap break-all overflow-x-auto">
          {log}
        </pre>
      )}
    </div>
  );
};
