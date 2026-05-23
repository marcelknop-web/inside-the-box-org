/**
 * Live status of the production lines & critical systems.
 * Click a non-OK tile to inspect the underlying signals that drove that
 * status (sources + brief evidence). OK tiles are inert — game-style.
 */

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Status = "OK" | "WATCH" | "COMPROMISED" | "CRITICAL" | "DOWN";

interface SystemDef {
  key: string;
  label: string;
  zone: string;
}

const SYSTEMS: SystemDef[] = [
  { key: "vpn",       label: "Vendor VPN",       zone: "Remote" },
  { key: "jump",      label: "Jump Host",        zone: "IT/OT DMZ" },
  { key: "historian", label: "OT Historian",     zone: "OT Sim" },
  { key: "ews",       label: "Engineering WS",   zone: "OT Sim" },
  { key: "plc",       label: "PLC — Sim Line",   zone: "OT Sim" },
  { key: "sis",       label: "Safety PLC (SIS)", zone: "Air-gapped" },
];

const STATUS_BY_PHASE: Record<number, Record<string, Status>> = {
  1: { vpn: "WATCH",       jump: "WATCH",       historian: "OK",       ews: "OK",       plc: "OK",          sis: "OK" },
  2: { vpn: "COMPROMISED", jump: "COMPROMISED", historian: "DOWN",     ews: "CRITICAL", plc: "COMPROMISED", sis: "WATCH" },
  3: { vpn: "COMPROMISED", jump: "COMPROMISED", historian: "DOWN",     ews: "CRITICAL", plc: "DOWN",        sis: "CRITICAL" },
  4: { vpn: "DOWN",        jump: "DOWN",        historian: "WATCH",    ews: "DOWN",     plc: "WATCH",       sis: "OK" },
};

interface Signal {
  source: string;     // e.g. "Splunk SIEM", "Claroty xDome"
  time: string;       // scenario-relative timestamp
  note: string;       // one-line evidence
}

// Per-system, per-phase signals that drive the status.
const SIGNALS_BY_PHASE: Record<number, Record<string, Signal[]>> = {
  1: {
    vpn: [
      { source: "Splunk SIEM",  time: "T+00:04", note: "Vendor VPN session from new ASN (Romania) outside maintenance window." },
      { source: "Identity",      time: "T+00:06", note: "MFA push approved on first attempt — unusual for this account." },
    ],
    jump: [
      { source: "EDR",           time: "T+00:09", note: "Encoded PowerShell launched from jump host; parent = legitimate vendor process." },
    ],
    historian: [],
    ews: [],
    plc: [],
    sis: [],
  },
  2: {
    vpn: [
      { source: "Splunk SIEM",  time: "T+00:42", note: "Sustained C2 beaconing from VPN concentrator to TLS sinkhole-class domain." },
    ],
    jump: [
      { source: "EDR",           time: "T+00:48", note: "Credential dump tool (mimikatz-class) executed; SMB sweep into OT DMZ." },
    ],
    historian: [
      { source: "Claroty xDome", time: "T+00:51", note: "Historian dropped off poll cycle — agent service stopped, host unreachable." },
    ],
    ews: [
      { source: "Claroty xDome", time: "T+00:55", note: "Engineering WS pushing unsigned project file to S7-1500 — never seen before." },
      { source: "EDR",           time: "T+00:56", note: "EDR tamper alert on engineering WS." },
    ],
    plc: [
      { source: "Claroty xDome", time: "T+00:58", note: "Logic download to PLC outside change-window; integrity check failing." },
    ],
    sis: [
      { source: "OT Network TAP", time: "T+01:02", note: "Probe traffic to SIS subnet from engineering WS — no successful session yet." },
    ],
  },
  3: {
    vpn: [
      { source: "Splunk SIEM",  time: "T+01:35", note: "Attacker still holds VPN tunnel; second account in use." },
    ],
    jump: [
      { source: "EDR",           time: "T+01:38", note: "Jump host pivoting east-west; multiple OT-side SMB sessions open." },
    ],
    historian: [
      { source: "Claroty xDome", time: "T+01:40", note: "Historian offline; last 90 min of process data unrecoverable from primary." },
    ],
    ews: [
      { source: "Claroty xDome", time: "T+01:44", note: "Engineering WS issuing setpoint overrides on Sim Line." },
    ],
    plc: [
      { source: "Process I/O",   time: "T+01:46", note: "PLC unresponsive to HMI; last known state = unsafe setpoint." },
    ],
    sis: [
      { source: "SIS Diagnostics", time: "T+01:49", note: "SIS in safe-state trip — demand exceeded threshold (kinetic risk averted)." },
      { source: "Ransom Note",   time: "T+01:52", note: "Attacker note delivered via printer queue: payment demand + OT threats." },
    ],
  },
  4: {
    vpn: [
      { source: "IT-Ops",        time: "T+03:10", note: "VPN tunnel terminated; vendor access revoked, certificates rotated." },
    ],
    jump: [
      { source: "IT-Ops",        time: "T+03:12", note: "Jump host wiped; rebuild pending forensic image." },
    ],
    historian: [
      { source: "OT-Ops",        time: "T+03:20", note: "Historian restored from cold standby; integrity check in progress." },
    ],
    ews: [
      { source: "OT-Ops",        time: "T+03:18", note: "Engineering WS isolated and imaged — not returning to service this shift." },
    ],
    plc: [
      { source: "Process I/O",   time: "T+03:25", note: "PLC reloaded with last-known-good project; awaiting gated restart authorisation." },
    ],
    sis: [
      { source: "SIS Diagnostics", time: "T+03:28", note: "SIS reset confirmed by safety engineer; loops nominal." },
    ],
  },
};

const STYLE: Record<Status, { dot: string; text: string; border: string; bg: string }> = {
  OK:          { dot: "bg-[#34d399]",                                                          text: "text-[#34d399]",  border: "border-[#34d399]/30", bg: "bg-[#34d399]/5" },
  WATCH:       { dot: "bg-[#f5b800] shadow-[0_0_6px_rgba(245,184,0,0.7)]",                     text: "text-[#f5b800]",  border: "border-[#f5b800]/40", bg: "bg-[#f5b800]/5" },
  COMPROMISED: { dot: "bg-[#fb923c] shadow-[0_0_6px_rgba(251,146,60,0.7)]",                    text: "text-[#fb923c]",  border: "border-[#fb923c]/40", bg: "bg-[#fb923c]/5" },
  CRITICAL:    { dot: "bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse",       text: "text-[#f87171]",  border: "border-[#ef4444]/50", bg: "bg-[#ef4444]/5" },
  DOWN:        { dot: "bg-white/30",                                                           text: "text-white/45",   border: "border-white/10",     bg: "bg-black/30" },
};

interface Props {
  phaseIndex: number; // 1..4
}

export const SystemsStatusPanel = ({ phaseIndex }: Props) => {
  const map = STATUS_BY_PHASE[phaseIndex] ?? STATUS_BY_PHASE[1];
  const signalsMap = SIGNALS_BY_PHASE[phaseIndex] ?? SIGNALS_BY_PHASE[1];
  const [openKey, setOpenKey] = useState<string | null>(null);

  const counts = SYSTEMS.reduce(
    (acc, s) => {
      const st = map[s.key];
      if (st === "OK") acc.ok++;
      else if (st === "WATCH") acc.watch++;
      else if (st === "COMPROMISED" || st === "CRITICAL") acc.alarm++;
      else if (st === "DOWN") acc.down++;
      return acc;
    },
    { ok: 0, watch: 0, alarm: 0, down: 0 },
  );

  return (
    <div className="rounded-lg border border-white/10 bg-background/40 px-3 py-2 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
          Production · Systems <span className="text-white/30 normal-case">— click flagged tiles</span>
        </span>
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-white/55">
          <span title="Healthy"><span className="text-[#34d399]">●</span> {counts.ok}</span>
          <span title="Watch"><span className="text-[#f5b800]">●</span> {counts.watch}</span>
          <span title="Alarm"><span className="text-[#fb923c]">●</span> {counts.alarm}</span>
          <span title="Down"><span className="text-white/45">●</span> {counts.down}</span>
        </div>
      </div>

      <ol className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {SYSTEMS.map((s) => {
          const st = map[s.key];
          const style = STYLE[st];
          const showLabel = st !== "OK";
          const signals = signalsMap[s.key] ?? [];
          const interactive = st !== "OK" && signals.length > 0;

          const tile = (
            <div
              className={`rounded border ${style.border} ${style.bg} px-2 py-1 flex items-center gap-1.5 min-w-0 transition-all ${
                interactive
                  ? "cursor-pointer hover:bg-white/[0.04] hover:border-white/30 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "cursor-default"
              } ${openKey === s.key ? "ring-1 ring-[#f5b800]/60" : ""}`}
              title={interactive ? `${s.label} — click to inspect` : `${s.label} — ${s.zone}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden />
              <span className="font-mono text-[10px] text-white/85 truncate flex-1">{s.label}</span>
              {showLabel && (
                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
                  {st}
                </span>
              )}
              {interactive && (
                <span className="font-mono text-[9px] text-white/35 group-hover:text-white/60">›</span>
              )}
            </div>
          );

          if (!interactive) {
            return (
              <li key={s.key}>
                {tile}
              </li>
            );
          }

          return (
            <li key={s.key}>
              <Popover
                open={openKey === s.key}
                onOpenChange={(o) => setOpenKey(o ? s.key : null)}
              >
                <PopoverTrigger asChild>
                  <button type="button" className="w-full text-left">
                    {tile}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-[320px] p-0 bg-[#111111] border border-white/15 text-white shadow-2xl"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden />
                      <span className="font-mono text-[11px] uppercase tracking-wider text-white/85 truncate">
                        {s.label}
                      </span>
                    </div>
                    <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
                      {st}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                    <span>{s.zone}</span>
                    <span>{signals.length} signal{signals.length === 1 ? "" : "s"}</span>
                  </div>
                  <ul className="max-h-[280px] overflow-y-auto divide-y divide-white/5">
                    {signals.map((sig, i) => (
                      <li key={i} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-white/55">
                            {sig.source}
                          </span>
                          <span className="font-mono text-[9px] text-white/35">{sig.time}</span>
                        </div>
                        <p className="text-[12px] leading-snug text-white/85">{sig.note}</p>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
