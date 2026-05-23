/**
 * Live status of the production lines & critical systems.
 * One row, six tiles. The colour and label are driven by the current
 * scenario phase so the player always sees, at a glance, what's healthy,
 * what's compromised, and what's down.
 *
 * Status semantics (kept simple on purpose):
 *   OK         — green   — system nominal
 *   WATCH      — amber   — suspicious activity, no impact yet
 *   COMPROMISED— orange  — confirmed attacker presence / control
 *   CRITICAL   — red     — safety or integrity threshold hit
 *   DOWN       — slate   — offline (isolated, wiped, ESD, etc.)
 */

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

  // Quick aggregate read for the header
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
          Production · Systems
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
          return (
            <li
              key={s.key}
              className={`rounded border ${style.border} ${style.bg} px-2 py-1 flex items-center gap-1.5 min-w-0 transition-colors`}
              title={`${s.label} — ${s.zone} — ${st}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden />
              <span className="font-mono text-[10px] text-white/85 truncate flex-1">{s.label}</span>
              {showLabel && (
                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
                  {st}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
