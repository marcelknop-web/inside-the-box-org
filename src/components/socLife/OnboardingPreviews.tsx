/**
 * Compact animated SVG previews for the 4-slide onboarding carousel.
 * All animations use CSS keyframes inside <style> blocks scoped via unique
 * class prefixes so they don't leak. Pure SVG — no extra deps.
 *
 *  Slide 1 — FloorplanPreview: 4×2 grid; an analyst dot walks between rooms.
 *  Slide 2 — MetersPreview:    3 bars (rep/stress/coffee) animate up/down.
 *  Slide 3 — IncidentPreview:  klaxon pulses, room highlights, timer drains.
 *  Slide 4 — ConsequencePreview: verdict card slides in with delta numbers.
 */

import { cn } from "@/lib/utils";

interface PreviewProps { className?: string }

/* ============================================================
 * Slide 1 — Floor plan + walking analyst
 * ============================================================ */
export function FloorplanPreview({ className }: PreviewProps) {
  // 4 cols × 2 rows of rooms. Walk path traces a few rooms.
  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 320 130" className="w-full h-auto block" aria-hidden="true">
        <style>{`
          .fp-room { fill: hsl(var(--background)); stroke: hsl(var(--border)); stroke-width: 1; }
          .fp-room-active { animation: fpRoomGlow 4s ease-in-out infinite; }
          .fp-label { font-family: ui-monospace, monospace; font-size: 7px; fill: hsl(var(--muted-foreground)); }
          .fp-dot { fill: hsl(var(--primary)); animation: fpWalk 4s linear infinite; }
          .fp-trail { fill: none; stroke: hsl(var(--primary) / 0.25); stroke-width: 1; stroke-dasharray: 2 2; }
          @keyframes fpWalk {
            0%   { transform: translate(40px, 32px); }
            22%  { transform: translate(120px, 32px); }
            48%  { transform: translate(200px, 32px); }
            55%  { transform: translate(200px, 95px); }
            78%  { transform: translate(120px, 95px); }
            100% { transform: translate(40px, 32px); }
          }
          @keyframes fpRoomGlow {
            0%, 100% { fill: hsl(var(--background)); }
            48%, 58% { fill: hsl(var(--destructive) / 0.18); stroke: hsl(var(--destructive) / 0.6); }
          }
        `}</style>

        {/* Top row: SOC, SIEM, Forensics, NOC */}
        {[0,1,2,3].map((i) => (
          <rect key={`t${i}`} x={10 + i*78} y={10} width={68} height={48} rx={3}
            className={cn("fp-room", i === 2 && "fp-room-active")} />
        ))}
        {/* Bottom row: War, CISO, Server, Kitchen */}
        {[0,1,2,3].map((i) => (
          <rect key={`b${i}`} x={10 + i*78} y={72} width={68} height={48} rx={3} className="fp-room" />
        ))}

        {/* Tiny labels */}
        <text className="fp-label" x={18} y={22}>SOC</text>
        <text className="fp-label" x={96} y={22}>SIEM</text>
        <text className="fp-label" x={174} y={22}>FOR</text>
        <text className="fp-label" x={252} y={22}>NOC</text>
        <text className="fp-label" x={18} y={84}>WAR</text>
        <text className="fp-label" x={96} y={84}>CISO</text>
        <text className="fp-label" x={174} y={84}>SRV</text>
        <text className="fp-label" x={252} y={84}>KIT</text>

        {/* Walking analyst */}
        <g style={{ transformOrigin: "0 0" }}>
          <circle r={4} className="fp-dot" />
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
 * Slide 2 — Meters animating
 * ============================================================ */
export function MetersPreview({ className }: PreviewProps) {
  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 320 130" className="w-full h-auto block" aria-hidden="true">
        <style>{`
          .mt-track { fill: hsl(var(--background)); stroke: hsl(var(--border)); stroke-width: 1; }
          .mt-label { font-family: ui-monospace, monospace; font-size: 8px; fill: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.05em; }
          .mt-val   { font-family: ui-monospace, monospace; font-size: 8px; fill: hsl(var(--foreground)); }
          .mt-rep   { fill: hsl(var(--primary));        animation: mtRep 4s ease-in-out infinite; transform-origin: 80px 0; }
          .mt-str   { fill: hsl(40 90% 55%);            animation: mtStr 4s ease-in-out infinite; transform-origin: 80px 0; }
          .mt-cof   { fill: hsl(190 90% 50%);           animation: mtCof 4s ease-in-out infinite; transform-origin: 80px 0; }
          @keyframes mtRep {
            0%, 100% { transform: scaleX(0.70); }
            50%      { transform: scaleX(0.85); }
          }
          @keyframes mtStr {
            0%, 100% { transform: scaleX(0.30); }
            50%      { transform: scaleX(0.65); fill: hsl(0 80% 55%); }
          }
          @keyframes mtCof {
            0%, 100% { transform: scaleX(0.55); }
            50%      { transform: scaleX(0.20); }
          }
        `}</style>

        {[
          { y: 18, label: "REPUTATION", cls: "mt-rep" },
          { y: 56, label: "STRESS",     cls: "mt-str" },
          { y: 94, label: "COFFEE",     cls: "mt-cof" },
        ].map((m) => (
          <g key={m.label}>
            <text className="mt-label" x={10} y={m.y + 8}>{m.label}</text>
            <rect className="mt-track" x={80} y={m.y} width={210} height={12} rx={6} />
            <rect className={m.cls} x={80} y={m.y} width={210} height={12} rx={6} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ============================================================
 * Slide 3 — Incoming incident: klaxon + room flash + timer drain
 * ============================================================ */
export function IncidentPreview({ className }: PreviewProps) {
  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 320 130" className="w-full h-auto block" aria-hidden="true">
        <style>{`
          .ic-card    { fill: hsl(var(--background)); stroke: hsl(var(--destructive) / 0.5); stroke-width: 1; }
          .ic-tag     { font-family: ui-monospace, monospace; font-size: 7px; fill: hsl(0 80% 65%); text-transform: uppercase; letter-spacing: 0.2em; }
          .ic-title   { font-family: ui-monospace, monospace; font-size: 11px; fill: hsl(var(--foreground)); }
          .ic-room    { font-family: ui-monospace, monospace; font-size: 8px; fill: hsl(var(--muted-foreground)); }
          .ic-room-v  { font-family: ui-monospace, monospace; font-size: 8px; fill: hsl(190 90% 60%); }
          .ic-klaxon  { fill: hsl(var(--destructive)); animation: icPulse 1.1s ease-in-out infinite; transform-origin: center; }
          .ic-bartrk  { fill: hsl(var(--background)); stroke: hsl(var(--border)); stroke-width: 0.5; }
          .ic-bar     { fill: hsl(190 90% 50%); transform-origin: 0 0; animation: icDrain 4s linear infinite; }
          @keyframes icPulse {
            0%, 100% { transform: scale(1);   opacity: 1; }
            50%      { transform: scale(1.3); opacity: 0.6; }
          }
          @keyframes icDrain {
            0%   { transform: scaleX(1);    fill: hsl(190 90% 50%); }
            70%  { transform: scaleX(0.30); fill: hsl(190 90% 50%); }
            85%  { transform: scaleX(0.15); fill: hsl(0 80% 55%); }
            100% { transform: scaleX(1);    fill: hsl(190 90% 50%); }
          }
        `}</style>

        <rect className="ic-card" x={10} y={10} width={300} height={110} rx={5} />

        {/* Klaxon dot + tag */}
        <g transform="translate(22, 24)">
          <circle className="ic-klaxon" r={4} />
        </g>
        <text className="ic-tag" x={34} y={27}>▲ Eingehender Vorfall</text>

        {/* Title */}
        <text className="ic-title" x={22} y={52}>Ransomware-Verdacht</text>

        {/* Required room hint */}
        <text className="ic-room" x={22} y={72}>RAUM:</text>
        <text className="ic-room-v" x={56} y={72}>SIEM</text>

        {/* Timer label + draining bar */}
        <text className="ic-room" x={22} y={92}>ZEIT</text>
        <rect className="ic-bartrk" x={22} y={98} width={276} height={6} rx={3} />
        <rect className="ic-bar"    x={22} y={98} width={276} height={6} rx={3} />
      </svg>
    </div>
  );
}

/* ============================================================
 * Slide 4 — Consequence card: verdict + deltas
 * ============================================================ */
export function ConsequencePreview({ className }: PreviewProps) {
  return (
    <div className={cn("w-full", className)}>
      <svg viewBox="0 0 320 130" className="w-full h-auto block" aria-hidden="true">
        <style>{`
          .cq-card   { fill: hsl(var(--background)); stroke: hsl(142 70% 45% / 0.6); stroke-width: 1; animation: cqIn 4s ease-in-out infinite; transform-origin: center; }
          .cq-tag    { font-family: ui-monospace, monospace; font-size: 7px; fill: hsl(142 70% 60%); letter-spacing: 0.2em; }
          .cq-verd   { font-family: ui-monospace, monospace; font-size: 11px; fill: hsl(142 70% 60%); }
          .cq-quote  { font-family: ui-monospace, monospace; font-size: 7.5px; fill: hsl(var(--muted-foreground)); }
          .cq-chip   { fill: hsl(var(--background)); stroke: hsl(var(--border)); stroke-width: 0.5; }
          .cq-clab   { font-family: ui-monospace, monospace; font-size: 6.5px; fill: hsl(var(--muted-foreground)); letter-spacing: 0.05em; }
          .cq-pos    { font-family: ui-monospace, monospace; font-size: 11px; fill: hsl(142 70% 60%); animation: cqCount 4s ease-in-out infinite; }
          .cq-neg    { font-family: ui-monospace, monospace; font-size: 11px; fill: hsl(142 70% 60%); animation: cqCount 4s ease-in-out infinite; }
          @keyframes cqIn {
            0%       { opacity: 0;   transform: translateY(8px) scale(0.96); }
            12%, 92% { opacity: 1;   transform: translateY(0)    scale(1); }
            100%     { opacity: 0;   transform: translateY(-4px) scale(0.98); }
          }
          @keyframes cqCount {
            0%, 12% { opacity: 0; }
            25%     { opacity: 1; }
          }
        `}</style>

        <g>
          <rect className="cq-card" x={10} y={10} width={300} height={110} rx={5} />
          <text className="cq-tag"  x={22} y={28}>✓ BEWERTUNG</text>
          <text className="cq-verd" x={22} y={48}>Lehrbuchreife Reaktion.</text>
          <text className="cq-quote" x={22} y={66}>„IOCs erfassen, dann Sender blocken"</text>

          {/* Reputation delta */}
          <rect className="cq-chip" x={22}  y={78} width={130} height={32} rx={3} />
          <text className="cq-clab" x={30}  y={90}>REPUTATION</text>
          <text className="cq-pos"  x={30}  y={104}>+6</text>

          {/* Stress delta (negative = good, shown green) */}
          <rect className="cq-chip" x={168} y={78} width={130} height={32} rx={3} />
          <text className="cq-clab" x={176} y={90}>STRESS</text>
          <text className="cq-neg"  x={176} y={104}>−2</text>
        </g>
      </svg>
    </div>
  );
}
