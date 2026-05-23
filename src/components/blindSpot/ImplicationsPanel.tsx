import { useEffect, useRef, useState } from "react";
import {
  Crosshair,
  ShieldAlert,
  Gavel,
  Building2,
  Lock,
  FileSearch,
} from "lucide-react";

/**
 * ImplicationsPanel
 * ──────────────────
 * Listens to what the AI bridge members are saying and visualises the
 * downstream implications across six incident dimensions. Trains the
 * player to read between the lines of operational chatter.
 *
 * Heuristic only — keyword + phrase matching. Each AI message can lift
 * one or more meters; the latest contributing quote is shown under its
 * dimension. Meters reset at the start of every phase.
 */

type DimKey =
  | "scope"
  | "safety"
  | "regulatory"
  | "business"
  | "containment"
  | "evidence";

interface Dimension {
  key: DimKey;
  label: string;
  hint: string;
  color: string;       // tailwind text/border accent
  fillFrom: string;    // gradient start
  fillTo: string;      // gradient end
  Icon: typeof Crosshair;
  triggers: RegExp[];
  weights: number[];   // weight per trigger
}

const DIMENSIONS: Dimension[] = [
  {
    key: "scope",
    label: "Threat scope",
    hint: "lateral · spread · attacker reach",
    color: "text-rose-300 border-rose-400/40",
    fillFrom: "from-rose-500/80",
    fillTo: "to-rose-300",
    Icon: Crosshair,
    triggers: [
      /\blateral\b|\bpivot(ed|ing)?\b|\beast[- ]?west\b/i,
      /\bjump host\b|\bvpn\b|\bvendor\b/i,
      /\bexfil(trat\w+)?\b|\bbeacon\w*\b|\bc2\b|\bcommand[- ]and[- ]control\b/i,
      /\bplc\b|\bs7[- ]?1500\b|\bhistorian\b|\bot\b/i,
      /\badditional host\w*\b|\bspread\w*\b|\bpropagat\w+\b/i,
    ],
    weights: [22, 14, 20, 16, 18],
  },
  {
    key: "safety",
    label: "Safety risk",
    hint: "SIS · kinetic · physical harm",
    color: "text-amber-300 border-amber-400/40",
    fillFrom: "from-amber-500/80",
    fillTo: "to-amber-300",
    Icon: ShieldAlert,
    triggers: [
      /\bsis\b|\bsafety( instrumented)?( system)?\b/i,
      /\bair[- ]?gap\w*\b/i,
      /\bshut ?down\b|\btrip\b|\bemergency stop\b|\be[- ]?stop\b/i,
      /\bkinetic\b|\bphysical\b|\bturbine\b|\bgrid\b|\bblack ?out\b/i,
      /\bsetpoint\w*\b|\boverride\w*\b|\bbypass\w*\b/i,
    ],
    weights: [28, 12, 22, 22, 24],
  },
  {
    key: "regulatory",
    label: "Regulatory clock",
    hint: "NIS-2 · NSM · notification window",
    color: "text-[#f5b800] border-[#f5b800]/40",
    fillFrom: "from-[#f5b800]/80",
    fillTo: "to-[#f5b800]",
    Icon: Gavel,
    triggers: [
      /\bnis[- ]?2\b/i,
      /\bnsm\b|\bregulator\w*\b|\bauthority\b/i,
      /\bearly warning\b|\b24 ?h\b|\b72 ?h\b|\bnotif(y|ication)\b/i,
      /\bdisclos\w*\b|\breport(ing)? obligation\b/i,
      /\blegal\b|\bcompliance\b/i,
    ],
    weights: [26, 18, 24, 18, 12],
  },
  {
    key: "business",
    label: "Business impact",
    hint: "downtime · customers · revenue",
    color: "text-cyan-300 border-cyan-400/40",
    fillFrom: "from-cyan-500/80",
    fillTo: "to-cyan-300",
    Icon: Building2,
    triggers: [
      /\bdowntime\b|\boutage\b|\bunavailab\w*\b/i,
      /\bcustomer\w*\b|\bclient\w*\b|\bmunicipal\w*\b|\bindustrial\b/i,
      /\brevenue\b|\bsla\b|\bcontract\w*\b|\bpenalt\w*\b/i,
      /\bproduction\b|\boperation\w*\b|\boutput\b/i,
      /\bboard\b|\bceo\b|\bcfo\b|\bmedia\b|\bpress\b/i,
    ],
    weights: [22, 16, 20, 18, 18],
  },
  {
    key: "containment",
    label: "Containment readiness",
    hint: "isolate · block · segment",
    color: "text-emerald-300 border-emerald-400/40",
    fillFrom: "from-emerald-500/80",
    fillTo: "to-emerald-300",
    Icon: Lock,
    triggers: [
      /\bisolat\w*\b|\bsegregat\w*\b|\bquarantin\w*\b/i,
      /\bblock\w*\b|\bdeny\w*\b|\bdisable\w*\b/i,
      /\bsegment\w*\b|\bfirewall\w*\b|\bconduit\w*\b/i,
      /\brevoke\w*\b|\brotate\w*\b|\bkill\b|\bdisconnect\w*\b/i,
      /\bcontain\w*\b/i,
    ],
    weights: [24, 18, 18, 20, 16],
  },
  {
    key: "evidence",
    label: "Evidence quality",
    hint: "logs · forensics · IOC",
    color: "text-violet-300 border-violet-400/40",
    fillFrom: "from-violet-500/80",
    fillTo: "to-violet-300",
    Icon: FileSearch,
    triggers: [
      /\blog\w*\b|\bsplunk\b|\bsiem\b/i,
      /\bhash(es)?\b|\bioc\w*\b|\bindicator\w*\b/i,
      /\bpcap\b|\bpacket\b|\bnetflow\b/i,
      /\bforensic\w*\b|\bartifact\w*\b|\btimeline\b/i,
      /\bedr\b|\bdetection\b|\balert\w*\b/i,
    ],
    weights: [16, 22, 16, 22, 14],
  },
];

const truncate = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";

interface Props {
  /** latest text per AI role, keyed by role display name */
  aiOutputs: Record<string, string>;
  /** resets meters whenever it changes */
  phaseIndex: number;
}

interface MeterState {
  value: number;
  quote: string | null;
  byRole: string | null;
  bumpedAt: number; // for pulse animation
}

const EMPTY: Record<DimKey, MeterState> = {
  scope: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
  safety: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
  regulatory: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
  business: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
  containment: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
  evidence: { value: 0, quote: null, byRole: null, bumpedAt: 0 },
};

export const ImplicationsPanel = ({ aiOutputs, phaseIndex }: Props) => {
  const [meters, setMeters] = useState<Record<DimKey, MeterState>>(EMPTY);
  const lastByRole = useRef<Record<string, string>>({});
  const lastPhase = useRef<number>(phaseIndex);

  // Reset on phase change
  useEffect(() => {
    if (lastPhase.current !== phaseIndex) {
      lastPhase.current = phaseIndex;
      lastByRole.current = {};
      setMeters(EMPTY);
    }
  }, [phaseIndex]);

  // Score new AI utterances
  useEffect(() => {
    const newQuotesPerDim: Partial<Record<DimKey, { quote: string; role: string; gain: number }>> = {};
    const gains: Partial<Record<DimKey, number>> = {};

    for (const [role, text] of Object.entries(aiOutputs)) {
      if (!text) continue;
      if (lastByRole.current[role] === text) continue;
      lastByRole.current[role] = text;

      for (const dim of DIMENSIONS) {
        let dimGain = 0;
        for (let i = 0; i < dim.triggers.length; i++) {
          if (dim.triggers[i].test(text)) dimGain += dim.weights[i];
        }
        if (dimGain > 0) {
          gains[dim.key] = (gains[dim.key] ?? 0) + dimGain;
          // Capture sentence containing the strongest hit
          const sentences = text.split(/(?<=[.!?])\s+/);
          let best = sentences[0] ?? text;
          let bestScore = -1;
          for (const s of sentences) {
            let sc = 0;
            for (let i = 0; i < dim.triggers.length; i++) {
              if (dim.triggers[i].test(s)) sc += dim.weights[i];
            }
            if (sc > bestScore) { bestScore = sc; best = s; }
          }
          newQuotesPerDim[dim.key] = {
            quote: truncate(best.trim(), 110),
            role,
            gain: dimGain,
          };
        }
      }
    }

    if (Object.keys(gains).length === 0) return;

    const now = Date.now();
    setMeters((prev) => {
      const next = { ...prev };
      for (const dim of DIMENSIONS) {
        const g = gains[dim.key];
        if (!g) continue;
        const q = newQuotesPerDim[dim.key];
        next[dim.key] = {
          value: Math.min(100, prev[dim.key].value + g),
          quote: q?.quote ?? prev[dim.key].quote,
          byRole: q?.role ?? prev[dim.key].byRole,
          bumpedAt: now,
        };
      }
      return next;
    });
  }, [aiOutputs]);

  const anySignal = Object.values(meters).some((m) => m.value > 0);

  return (
    <div className="rounded-lg border border-white/10 bg-background/40 h-full min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5b800] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
            Implications · live read
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
          derived from bridge chatter
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-1.5">
        {!anySignal && (
          <div className="text-[11px] text-white/40 font-mono italic py-3">
            Listening to the bridge… implications appear as the team speaks.
          </div>
        )}

        {DIMENSIONS.map((dim) => {
          const m = meters[dim.key];
          const Icon = dim.Icon;
          const pct = Math.round(m.value);
          const bumped = m.bumpedAt > 0 && Date.now() - m.bumpedAt < 1200;
          return (
            <div
              key={dim.key}
              className={`group rounded border ${
                pct > 0 ? dim.color : "border-white/10"
              } bg-black/20 px-2 py-1.5 transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`w-3 h-3 shrink-0 ${pct > 0 ? "" : "opacity-40"}`}
                  strokeWidth={2.25}
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 flex-1 truncate">
                  {dim.label}
                </span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    pct > 0 ? "text-white/85" : "text-white/30"
                  } ${bumped ? "animate-pulse" : ""}`}
                >
                  {pct.toString().padStart(2, "0")}
                </span>
              </div>

              {/* Bar */}
              <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${dim.fillFrom} ${dim.fillTo} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Quote */}
              {m.quote && (
                <div className="mt-1 flex items-start gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 shrink-0 mt-px">
                    {m.byRole}
                  </span>
                  <span className="text-[10.5px] leading-snug text-white/70 italic">
                    “{m.quote}”
                  </span>
                </div>
              )}
              {!m.quote && pct === 0 && (
                <div className="mt-1 text-[9.5px] text-white/30 font-mono">
                  {dim.hint}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
