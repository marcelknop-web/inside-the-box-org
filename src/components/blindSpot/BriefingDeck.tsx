import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { INITIAL_ALERT, PHASES, ROLES, Role } from "@/data/blindSpotScenario";
import { SystemsStatusPanel } from "./SystemsStatusPanel";
import { ObjectiveHud } from "./ObjectiveHud";
import { PhaseProgress } from "./PhaseProgress";

/**
 * Briefing as a guided slide deck. One topic per slide so the user
 * can absorb the context at their own pace instead of scrolling a wall.
 *
 *   0. Welcome aboard
 *   1. NorPower — the company
 *   2. Key systems
 *   3. Network — Purdue zones
 *   4. The live alert (situation)
 *   5. Who's on the bridge (roles)
 *   6. Cockpit tour — where everything is on screen
 *   7. Ready to start
 */

interface Props {
  userRole: Role;
  onStart: () => void;
}

interface Slide {
  id: string;
  /** Short label shown in the dot navigator. */
  label: string;
  /** Eyebrow line at top of the slide. */
  kicker: string;
  /** Slide headline. */
  title: string;
  /** One-line lede under the title. */
  lede?: string;
  body: ReactNode;
}

const PILL = "font-mono text-[10px] uppercase tracking-[0.2em]";

export const BriefingDeck = ({ userRole, onStart }: Props) => {
  const [idx, setIdx] = useState(0);

  const slides: Slide[] = [
    /* ---------------- 0 · Welcome ---------------- */
    {
      id: "welcome",
      label: "Welcome",
      kicker: "Part 1 · Orientation",
      title: `Welcome aboard, ${userRole.name}.`,
      lede: "Eight quick slides set the scene. Then the bridge opens.",
      body: (
        <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
          <Tile k="Location" v="Oslo · NO" />
          <Tile k="Local time" v="23:47" accent />
          <Tile k="Phases" v="4 + debrief" />
          <Tile k="Duration" v="≈ 20 min" />
          <div className="sm:col-span-2 mt-2 rounded border border-white/10 bg-background/40 p-4">
            <p className="text-white/70 text-sm leading-relaxed">
              You will play <span className="text-[#f5b800] font-mono">{userRole.name}</span>.
              The other three roles are run by AI teammates. Decisions are committed in the
              team chat — the system reads your last message as your rationale.
            </p>
          </div>
        </div>
      ),
    },

    /* ---------------- 1 · Company ---------------- */
    {
      id: "company",
      label: "Company",
      kicker: "Topic 01",
      title: "NorPower AS",
      lede: "Norwegian energy utility. Mid-size, regulated, OT-heavy.",
      body: (
        <>
          <div className="grid sm:grid-cols-3 gap-3 max-w-4xl">
            {[
              ["Sector", "Energy utility"],
              ["HQ", "Oslo, Norway"],
              ["Staff", "~200 · 40 in OT"],
              ["Regulation", "NIS-2 essential · NSM"],
              ["Clients", "Municipal + industrial"],
              ["Posture", "ISO 27001 · IEC 62443"],
            ].map(([k, v]) => (
              <Tile key={k} k={k} v={v} />
            ))}
          </div>
          <p className="text-white/65 text-sm mt-5 leading-relaxed border-l-2 border-[#f5b800]/40 pl-3 max-w-3xl">
            NorPower runs its own SOC (3 analysts, 24/7 on-call), an OT-Ops team that owns
            the plant floor, and a small IR cell. A third-party PLC integrator has remote
            VPN access for vendor maintenance — a known but tolerated risk.
          </p>
        </>
      ),
    },

    /* ---------------- 2 · Key systems ---------------- */
    {
      id: "systems",
      label: "Systems",
      kicker: "Topic 02",
      title: "Key systems",
      lede: "What you have on the floor and in the SOC.",
      body: (
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
            <div
              key={k}
              className="flex gap-3 border border-white/10 rounded p-2.5 bg-background/30 hover:border-[#f5b800]/40 transition-colors"
            >
              <div className="shrink-0 w-8 h-8 rounded border border-[#f5b800]/40 bg-[#f5b800]/10 flex items-center justify-center text-[#f5b800] text-lg">
                {i}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{k}</div>
                <div className="font-mono text-sm text-white/90 truncate">{v}</div>
                <div className="font-mono text-[10px] text-white/50 truncate">{d}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    /* ---------------- 3 · Network ---------------- */
    {
      id: "network",
      label: "Network",
      kicker: "Topic 03",
      title: "Network — Purdue zones",
      lede: "Four zones, conduits firewalled, SIS air-gapped.",
      body: (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-background/40 p-4">
            <svg viewBox="0 0 720 280" className="w-full min-w-[640px] h-auto font-mono">
              <defs>
                <marker
                  id="bsArrow2"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="#f5b80088" />
                </marker>
              </defs>
              {[
                { y: 10, label: "ZONE 1 · CORPORATE IT", cidr: "10.10.10.0/24", color: "#00bcd4" },
                { y: 80, label: "ZONE 2 · IT/OT DMZ", cidr: "10.10.20.0/24", color: "#f5b800" },
                { y: 150, label: "ZONE 3 · OT SIM NETWORK", cidr: "10.10.30.0/24", color: "#ef6c5a" },
                { y: 220, label: "SIS · AIR-GAPPED SAFETY PLC", cidr: "10.10.30.99", color: "#a0e85b" },
              ].map((z) => (
                <g key={z.label}>
                  <rect
                    x="10" y={z.y} width="700" height="55" rx="6"
                    fill={z.color} fillOpacity="0.06" stroke={z.color} strokeOpacity="0.35"
                  />
                  <text x="22" y={z.y + 18} fill={z.color} fillOpacity="0.9" fontSize="10" letterSpacing="2">
                    {z.label}
                  </text>
                  <text x="22" y={z.y + 34} fill="#ffffff" fillOpacity="0.5" fontSize="9">
                    {z.cidr}
                  </text>
                </g>
              ))}
              {[
                { x: 230, y: 24, w: 90, label: "Workstations" },
                { x: 340, y: 24, w: 90, label: "AD / Splunk" },
                { x: 450, y: 24, w: 90, label: "Mail / Web" },
                { x: 230, y: 94, w: 100, label: "Jump Host", note: "10.10.20.50", hot: true },
                { x: 350, y: 94, w: 100, label: "Vendor VPN" },
                { x: 470, y: 94, w: 100, label: "Historian Sync" },
                { x: 230, y: 164, w: 100, label: "Eng Workstation" },
                { x: 350, y: 164, w: 100, label: "PI Historian" },
                { x: 470, y: 164, w: 100, label: "Siemens S7 PLC" },
                { x: 350, y: 234, w: 140, label: "Safety PLC (SIS)" },
              ].map((n, i) => (
                <g key={i}>
                  <rect
                    x={n.x} y={n.y} width={n.w} height="30" rx="4"
                    fill={n.hot ? "#f5b80022" : "#ffffff08"}
                    stroke={n.hot ? "#f5b800" : "#ffffff55"}
                    strokeWidth={n.hot ? "1.5" : "1"}
                  />
                  <text x={n.x + n.w / 2} y={n.y + 14} textAnchor="middle" fill="#fff" fillOpacity="0.9" fontSize="10">
                    {n.label}
                  </text>
                  {n.note && (
                    <text x={n.x + n.w / 2} y={n.y + 25} textAnchor="middle" fill="#f5b800" fontSize="8">
                      {n.note}
                    </text>
                  )}
                </g>
              ))}
              <line x1="385" y1="55" x2="385" y2="92" stroke="#f5b80088" strokeWidth="1" markerEnd="url(#bsArrow2)" />
              <line x1="385" y1="125" x2="385" y2="162" stroke="#f5b80088" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#bsArrow2)" />
              <line x1="420" y1="195" x2="420" y2="232" stroke="#a0e85b55" strokeWidth="1" strokeDasharray="2 4" />
              <text x="395" y="148" fill="#f5b80099" fontSize="8">OPC UA · whitelisted</text>
              <text x="425" y="218" fill="#a0e85b99" fontSize="8">air-gap (no IP path)</text>
            </svg>
          </div>
          <p className="text-white/55 text-[11px] mt-3 leading-relaxed font-mono max-w-3xl">
            IT ↔ DMZ fully inspected. DMZ ↔ OT restricted to OPC UA and historian sync. SIS isolated.
          </p>
        </>
      ),
    },

    /* ---------------- 4 · Situation ---------------- */
    {
      id: "situation",
      label: "Alert",
      kicker: "Topic 04 · live",
      title: "The situation",
      lede: "23:47. SOC just escalated. You joined the bridge call.",
      body: (
        <div className="rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-400/15 to-amber-400/5 p-5 relative overflow-hidden max-w-4xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-3 relative">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <h3 className="font-mono text-sm uppercase tracking-wider text-amber-200">
              Live SIEM alert
            </h3>
          </div>
          <div className="grid sm:grid-cols-4 gap-3 mb-3 font-mono text-[11px]">
            <Field k="Source" v={INITIAL_ALERT.source} />
            <Field k="Severity" v={INITIAL_ALERT.severity} accent="text-amber-300" />
            <Field k="Timestamp" v={INITIAL_ALERT.timestamp} />
            <Field k="Status" v="Bridge convened" />
          </div>
          <p className="text-white/85 leading-relaxed">{INITIAL_ALERT.detail}</p>
          <p className="text-white/65 text-sm mt-3 leading-relaxed italic">
            It's late. Most of the office is dark. SOC escalated to the on-call bridge.
          </p>
        </div>
      ),
    },

    /* ---------------- 5 · Roles ---------------- */
    {
      id: "roles",
      label: "Bridge",
      kicker: "Topic 05",
      title: "Who's on the bridge",
      lede: "You hold one seat. AI fills the other three.",
      body: (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl">
            {ROLES.map((r) => {
              const you = r.id === userRole.id;
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-4 ${you ? "border-[#f5b800] bg-[#f5b800]/10" : "border-white/10 bg-background/30"}`}
                >
                  <div className={`${PILL} ${you ? "text-[#f5b800]" : "text-white/40"}`}>
                    {you ? "▶ You" : "AI"}
                  </div>
                  <div className={`font-mono text-base mt-1.5 ${you ? "text-[#f5b800]" : "text-white/90"}`}>
                    {r.name}
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed mt-2">{r.description}</p>
                </div>
              );
            })}
          </div>
          <p className="text-white/60 text-xs mt-5 leading-relaxed font-mono max-w-3xl">
            All communication happens in the team chat. The Incident Commander drives decisions.
            NIS-2 clock starts at Phase 2.
          </p>
        </>
      ),
    },

    /* ---------------- 6 · Cockpit tour ---------------- */
    {
      id: "cockpit",
      label: "Cockpit",
      kicker: "Topic 06 · how it works",
      title: "Your cockpit",
      lede: "One screen, four zones. Read top to bottom, left to right.",
      body: <CockpitTour />,
    },

    /* ---------------- 7 · Ready ---------------- */
    {
      id: "ready",
      label: "Start",
      kicker: "Ready",
      title: "Phase 1 is queued.",
      lede: "When you commit a decision, the clock advances and the next phase loads.",
      body: (
        <div className="max-w-3xl space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Tile k="Phase 1" v="Initial Anomaly" />
            <Tile k="Phase 2" v="Confirmed Compromise" accent />
            <Tile k="Phase 3" v="Safety Threshold" />
          </div>
          <div className="rounded border border-[#f5b800]/40 bg-[#f5b800]/5 p-4">
            <p className="font-mono text-[11px] text-[#f5b800] uppercase tracking-wider mb-1">
              House rules
            </p>
            <ul className="text-white/75 text-sm leading-relaxed space-y-1 list-disc pl-5">
              <li>Talk to the bridge in chat. Your last message is your rationale.</li>
              <li>Press <span className="font-mono text-[#f5b800]">Commit decision</span> when ready.</li>
              <li>Safety first. Availability second. Disclosure on the regulator clock.</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[idx];
  const isFirst = idx === 0;
  const isLast = idx === slides.length - 1;

  // Keyboard nav: ← → / PageUp / PageDown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (!isLast) setIdx((i) => i + 1);
        else onStart();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (!isFirst) setIdx((i) => i - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFirst, isLast, onStart]);

  return (
    <div className="flex flex-col gap-4">
      {/* Deck header — progress + dot nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className={`${PILL} text-[#f5b800]`}>
          ▲ Briefing · {String(idx + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              title={s.label}
              aria-label={`Go to slide ${i + 1}: ${s.label}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx
                  ? "w-8 bg-[#f5b800]"
                  : i < idx
                  ? "w-3 bg-[#f5b800]/40 hover:bg-[#f5b800]/70"
                  : "w-3 bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide card */}
      <div
        key={slide.id}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-background/40 animate-fade-in"
      >
        {/* corner grid */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,184,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,184,0,0.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative p-6 md:p-8">
          <p className={`${PILL} text-[#f5b800] mb-2`}>{slide.kicker}</p>
          <h2 className="font-mono text-2xl md:text-3xl text-white leading-tight">{slide.title}</h2>
          {slide.lede && (
            <p className="text-white/70 text-sm md:text-base mt-2 leading-relaxed max-w-3xl">
              {slide.lede}
            </p>
          )}
          <div className="mt-6">{slide.body}</div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="font-mono uppercase tracking-wider border-white/15 text-white/80 hover:text-white disabled:opacity-30"
        >
          ← Back
        </Button>
        <span className="font-mono text-[10px] text-white/35 uppercase tracking-wider hidden sm:block">
          ← → keys to navigate
        </span>
        {isLast ? (
          <Button
            onClick={onStart}
            className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider shadow-[0_0_30px_rgba(245,184,0,0.4)]"
          >
            Start exercise →
          </Button>
        ) : (
          <Button
            onClick={() => setIdx((i) => i + 1)}
            className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider"
          >
            Continue →
          </Button>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * Sub-components
 * ============================================================ */

const Tile = ({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) => (
  <div className="border border-white/10 rounded p-3 bg-background/30">
    <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{k}</div>
    <div className={`font-mono text-sm mt-0.5 ${accent ? "text-[#f5b800]" : "text-white/90"}`}>
      {v}
    </div>
  </div>
);

const Field = ({ k, v, accent }: { k: string; v: string; accent?: string }) => (
  <div>
    <div className="text-white/40 uppercase">{k}</div>
    <div className={accent ?? "text-white/90"}>{v}</div>
  </div>
);

/**
 * Cockpit tour — renders the REAL cockpit panels (PhaseProgress,
 * SystemsStatusPanel, ObjectiveHud) plus faithful mocks of the three
 * lower panels, with numbered call-out badges floating over each one
 * and a matching legend on the right. Desktop-first composition so
 * the briefing slide and the live cockpit look "from one mold".
 */
const CockpitTour = () => {
  const previewPhase = PHASES[0];
  const [activeStep, setActiveStep] = useState(1);
  const totalSteps = 6;

  const items = [
    { n: 1, t: "Phase progress",  d: "IEC 62443 lifecycle. Shows where you are: Detect → Contain → Respond → Recover → Learn." },
    { n: 2, t: "Systems status",  d: "Six tiles — health of vendor VPN, jump host, OT historian, engineering WS, PLCs and the SIS." },
    { n: 3, t: "Objective HUD",   d: "Your current marching order: WATCH, ENGAGE or DECIDE. Read this first every phase." },
    { n: 4, t: "Evidence panel",  d: "Top-left. The situation brief plus every SIEM / Claroty inject that lands this phase." },
    { n: 5, t: "Implications · Your call", d: "Bottom-left. AI bridge readout — turns yellow with the question when it's your move." },
    { n: 6, t: "Team chat",       d: "Right column. You talk to the bridge here. Your last message becomes your rationale." },
  ];

  const isActive = (n: number) => n === activeStep;

  return (
    <div className="grid xl:grid-cols-[1.55fr_1fr] gap-5">
      {/* Real cockpit, scaled down and non-interactive. */}
      <div className="relative rounded-xl border border-white/10 bg-[#0e0e10] p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/35">
            Live exercise · cockpit preview
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#f5b800]/70">
            Phase 1 · T+0
          </span>
        </div>

        {/* Non-interactive wrapper so clicks don't escape into mock state. */}
        <div className="pointer-events-none select-none flex flex-col gap-2">
          <Annotated n={1} active={isActive(1)} side="left">
            <PhaseProgress currentPhase={1} phases={PHASES} streak={0} verdict={null} />
          </Annotated>

          <Annotated n={2} active={isActive(2)} side="left">
            <SystemsStatusPanel phaseIndex={1} />
          </Annotated>

          <Annotated n={3} active={isActive(3)} side="left">
            <ObjectiveHud
              phase={previewPhase}
              totalPhases={PHASES.length}
              userRoleName="You"
              step="watch"
              alertsCount={1}
              userMsgCount={0}
            />
          </Annotated>

          <div className="grid grid-cols-[1fr_1fr] gap-2 mt-1">
            <div className="grid grid-rows-2 gap-2">
              <Annotated n={4} active={isActive(4)} side="left">
                <MockEvidence />
              </Annotated>
              <Annotated n={5} active={isActive(5)} side="left">
                <MockImplications />
              </Annotated>
            </div>
            <Annotated n={6} active={isActive(6)} side="right">
              <MockChat />
            </Annotated>
          </div>
        </div>
      </div>

      {/* Legend — only the active step is fully visible; others are dimmed. */}
      <div className="flex flex-col gap-3">
        <ol className="space-y-2 flex-1">
          {items.map((it) => {
            const active = isActive(it.n);
            return (
              <li
                key={it.n}
                className={`flex gap-3 rounded-lg border p-3 transition-all duration-300 ${
                  active
                    ? "border-[#f5b800]/50 bg-[#f5b800]/10"
                    : "border-white/5 bg-background/20 opacity-40"
                }`}
              >
                <CallOut n={it.n} active={active} />
                <div className="min-w-1">
                  <div className={`font-mono text-[12px] ${active ? "text-white" : "text-white/50"}`}>
                    {it.t}
                  </div>
                  {active && (
                    <div className="text-white/70 text-xs leading-relaxed mt-1 animate-fade-in">
                      {it.d}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* Step navigation */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
            disabled={activeStep === 1}
            className="font-mono text-[10px] uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-25 transition-colors"
          >
            ← Prev
          </button>
          <span className="font-mono text-[10px] text-[#f5b800] tracking-wider">
            {String(activeStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>
          <button
            onClick={() => setActiveStep((s) => Math.min(totalSteps, s + 1))}
            disabled={activeStep === totalSteps}
            className="font-mono text-[10px] uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-25 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Annotation primitives ---------- */

const Annotated = ({
  n, side = "left", children,
}: { n: number; side?: "left" | "right"; children: ReactNode }) => (
  <div className="relative">
    <div className={`absolute -top-2 ${side === "left" ? "-left-2" : "-right-2"} z-20`}>
      <CallOut n={n} />
    </div>
    <div className="rounded-lg ring-1 ring-[#f5b800]/15 hover:ring-[#f5b800]/30 transition-shadow">
      {children}
    </div>
  </div>
);

const CallOut = ({ n }: { n: number }) => (
  <span className="inline-flex shrink-0 items-center justify-center w-7 h-7 rounded-full border border-[#f5b800] bg-[#0e0e10] text-[#f5b800] font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,184,0,0.45)]">
    {n}
  </span>
);

/* ---------- Faithful mocks of the three lower panels ---------- */

const MockEvidence = () => (
  <div
    className="flex flex-col rounded-lg border h-full min-h-[170px] overflow-hidden"
    style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
  >
    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#2a2a2a" }}>
      <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">
        Injects · Evidence
      </span>
      <span className="font-mono text-[9px] text-white/40">T+0</span>
    </div>
    <div className="p-3 space-y-2">
      <p className="text-white/75 text-[11px] leading-snug">
        Splunk fires a HIGH alert: anomalous vendor VPN session, lateral
        movement attempt from Jump Host toward OT Historian.
      </p>
      <div className="rounded border border-amber-400/40 bg-amber-400/5 px-2 py-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-amber-300 uppercase tracking-wider">SIEM · HIGH</span>
          <span className="font-mono text-[9px] text-white/40">23:47</span>
        </div>
        <div className="font-mono text-[10px] text-white/80 mt-0.5 truncate">
          Vendor VPN session · off-hours
        </div>
      </div>
    </div>
  </div>
);

const MockImplications = () => (
  <div
    className="flex flex-col rounded-lg border h-full min-h-[170px] overflow-hidden"
    style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
  >
    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#2a2a2a" }}>
      <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">
        Implications · bridge readout
      </span>
      <span className="font-mono text-[9px] text-[#f5b800]/70 animate-pulse">● live</span>
    </div>
    <div className="p-3 space-y-1.5">
      {[
        ["IT-Ops",  "EDR clean on Jump Host. Pulling VPN auth logs."],
        ["OT-Ops",  "Plant nominal. Historian read-only verified."],
        ["Mgmt",    "Holding statement drafted, not sent."],
      ].map(([who, txt]) => (
        <div key={who} className="text-[10.5px] leading-snug">
          <span className="font-mono text-[#f5b800]">{who}: </span>
          <span className="text-white/70">{txt}</span>
        </div>
      ))}
    </div>
  </div>
);

const MockChat = () => (
  <div
    className="flex flex-col rounded-lg border h-full min-h-[358px] overflow-hidden"
    style={{ backgroundColor: "#111111", borderColor: "#2a2a2a" }}
  >
    <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#2a2a2a" }}>
      <span className="font-mono text-[10px] text-white/50 uppercase tracking-wider">
        Team chat · the bridge
      </span>
      <span className="font-mono text-[9px] text-white/40">Phase 1</span>
    </div>
    <div className="flex-1 p-3 space-y-2 overflow-hidden">
      {[
        { who: "IC",     txt: "Bridge open. Read me the SIEM alert.", you: false },
        { who: "IT-Ops", txt: "HIGH on vendor VPN, lateral from Jump Host.", you: false },
        { who: "OT-Ops", txt: "Plant green. Historian unaffected so far.", you: false },
        { who: "You",    txt: "Recommend revoke vendor session now.", you: true },
      ].map((m, i) => (
        <div key={i} className={`flex ${m.you ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-md px-2 py-1 text-[10.5px] leading-snug ${
              m.you
                ? "bg-[#f5b800]/15 border border-[#f5b800]/40 text-white"
                : "bg-white/[0.04] border border-white/10 text-white/80"
            }`}
          >
            <div className={`font-mono text-[8.5px] uppercase tracking-wider mb-0.5 ${
              m.you ? "text-[#f5b800]" : "text-white/40"
            }`}>
              {m.who}
            </div>
            {m.txt}
          </div>
        </div>
      ))}
    </div>
    <div className="px-3 py-2 border-t flex items-center gap-2" style={{ borderColor: "#2a2a2a" }}>
      <div className="flex-1 rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-[10px] text-white/35">
        Type your message…
      </div>
      <div className="rounded bg-[#f5b800] text-black font-mono text-[9px] uppercase tracking-wider px-2 py-1.5">
        Send
      </div>
    </div>
  </div>
);
