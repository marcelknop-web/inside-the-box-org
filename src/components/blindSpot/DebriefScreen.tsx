import { useMemo } from "react";
import { Button } from "@/components/ui/button";

export interface DebriefDecision {
  phase: string;
  timestamp: string; // "T+0", "T+45 min", "T+90 min", "T+4 h"
  question: string;
  choice: "YES" | "NO" | "CONDITIONAL";
  reasoning: string;
  iec62443Ref: string;
  nis2Flag?: string;
}

export interface DebriefAnalysis {
  perDecision: Array<{
    iec62443: string;
    nis2: "met" | "at_risk" | "missed";
    nis2Note: string;
  }>;
  overallAssessment: string;
  lessons: string[];
  iec62443Gap: string;
  nis2Gap: string;
  rating: "STRONG RESPONSE" | "ADEQUATE" | "CRITICAL GAPS";
  ratingNote: string;
}

interface Props {
  userRoleName: string;
  decisions: DebriefDecision[];
  analysis: DebriefAnalysis | null;
  loading: boolean;
  onRestart: () => void;
}

/* ---------- helpers ---------- */
const tsToMinutes = (t: string): number => {
  // Accept "T+0", "T+45 min", "T+90 min", "T+4 h"
  const m = t.match(/T\+(\d+)\s*(h|min)?/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return /h/i.test(m[2] ?? "") ? n * 60 : n;
};

const PHASE_STARTS = [0, 45, 90, 240]; // minutes
const PHASE_LABELS = ["P1", "P2", "P3", "P4"];
const X_AXIS_MIN = 0;
const X_AXIS_MAX = 270;
const TIMELINE_WIDTH = 1200; // virtual px, container scrolls
const TIMELINE_HEIGHT = 140;

const xFor = (min: number) =>
  ((min - X_AXIS_MIN) / (X_AXIS_MAX - X_AXIS_MIN)) * (TIMELINE_WIDTH - 40) + 30;

interface AlertPoint {
  minute: number;
  severity: "CRIT" | "HIGH" | "MED" | "INFO";
  text: string;
}

// Hard-coded alert sequence matching the scripted comms feed per phase
const ALERTS: AlertPoint[] = [
  // Phase 1
  { minute: 0,        severity: "CRIT", text: "Anomalous vendor VPN session · src: 10.10.20.50" },
  { minute: 0 + 31/60,  severity: "MED",  text: "Port scan · Jump Host → OT Historian" },
  { minute: 0 + 48/60,  severity: "HIGH", text: "Auth attempt · OT Historian · vendor account" },
  // Phase 2
  { minute: 45,       severity: "CRIT", text: "Unauthorised S7comm write · PLC-01" },
  { minute: 45 + 10/60, severity: "CRIT", text: "Ransomware payload · ENG-WS-01" },
  { minute: 46,       severity: "HIGH", text: "OT Historian unreachable · 10.10.20.30" },
  { minute: 47,       severity: "INFO", text: "NIS-2 incident clock started" },
  // Phase 3
  { minute: 90,       severity: "CRIT", text: "SIS pre-alarm triggered · 10.10.30.99" },
  { minute: 91,       severity: "CRIT", text: "Emergency shutdown executed" },
  { minute: 92,       severity: "CRIT", text: "Ransom note displayed · HMI-01 · SCADA-SRV" },
  { minute: 93,       severity: "HIGH", text: "Encrypted external message received" },
  // Phase 4
  { minute: 240,      severity: "INFO", text: "Forensics team engaged" },
  { minute: 240 + 10/60, severity: "INFO", text: "PLC-02 + SIS unaffected — partial restart feasible" },
  { minute: 240 + 20/60, severity: "MED",  text: "Media inquiry received" },
  { minute: 240 + 30/60, severity: "HIGH", text: "NIS-2 window: ~68h remaining" },
];

const sevColor = (s: AlertPoint["severity"]) =>
  s === "CRIT" ? "#ef4444" : s === "HIGH" ? "#F5A623" : s === "MED" ? "#eab308" : "#6b7280";

const choiceColor = (c: DebriefDecision["choice"]) =>
  c === "YES" ? "#22c55e" : c === "NO" ? "#ef4444" : "#F5A623";

const nis2Pill = (s: "met" | "at_risk" | "missed") => {
  if (s === "met")
    return { label: "✓ Compliant", color: "#10b981", bg: "rgba(16,185,129,0.08)" };
  if (s === "at_risk")
    return { label: "⚠ At risk", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" };
  return { label: "✗ Missed", color: "#ef4444", bg: "rgba(239,68,68,0.08)" };
};

const ratingBadgeStyle = (rating: DebriefAnalysis["rating"]) => {
  if (rating === "STRONG RESPONSE")
    return { bg: "#10b981", fg: "#04150d" };
  if (rating === "ADEQUATE") return { bg: "#f59e0b", fg: "#1a0f00" };
  return { bg: "#ef4444", fg: "#1a0303" };
};

/* ---------- component ---------- */
export const DebriefScreen = ({
  userRoleName,
  decisions,
  analysis,
  loading,
  onRestart,
}: Props) => {
  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const counts = useMemo(() => {
    const c = { met: 0, at_risk: 0, missed: 0 };
    analysis?.perDecision.forEach((p) => {
      c[p.nis2] += 1;
    });
    return c;
  }, [analysis]);

  const rating = analysis?.rating;
  const badge = rating ? ratingBadgeStyle(rating) : null;

  return (
    <div
      id="blind-spot-debrief"
      className="blind-spot-debrief w-full"
      style={{ backgroundColor: "#111111", color: "#ffffff", padding: "48px" }}
    >
      <style>{`
        @media print {
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          #blind-spot-debrief, #blind-spot-debrief * { visibility: visible !important; }
          #blind-spot-debrief {
            position: absolute !important; left: 0; top: 0; width: 100%;
            background: #ffffff !important; color: #000000 !important;
            padding: 24px !important;
          }
          #blind-spot-debrief .no-print { display: none !important; }
          #blind-spot-debrief .print-only { display: block !important; }
          #blind-spot-debrief * { color: #000000 !important; border-color: #888 !important; background: transparent !important; }
          #blind-spot-debrief .keep-bg { background: #f0f0f0 !important; }
          #blind-spot-debrief .keep-color-amber { color: #b45309 !important; }
          #blind-spot-debrief .keep-color-red { color: #b91c1c !important; }
          #blind-spot-debrief .keep-color-green { color: #047857 !important; }
          #blind-spot-debrief .page-break { page-break-before: always; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ===== Section 1: Header ===== */}
      <section>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1
              className="font-mono font-bold tracking-tight"
              style={{ fontSize: "32px", lineHeight: 1.1 }}
            >
              EXERCISE DEBRIEF — BLIND SPOT
            </h1>
            <p
              className="font-mono mt-3"
              style={{ color: "#9ca3af", fontSize: "13px" }}
            >
              netsecure.no · {dateStr} · Role played:{" "}
              <span style={{ color: "#f5b800" }}>{userRoleName}</span>
            </p>
          </div>
          {badge && (
            <div
              className="font-mono font-bold keep-bg"
              style={{
                backgroundColor: badge.bg,
                color: badge.fg,
                fontSize: "14px",
                padding: "10px 18px",
                borderRadius: "999px",
                letterSpacing: "0.08em",
              }}
            >
              {rating}
            </div>
          )}
        </div>
        <div
          style={{
            height: "1px",
            backgroundColor: "#f5b800",
            opacity: 0.7,
            marginTop: "24px",
          }}
        />
      </section>

      {/* ===== Section 2: Event timeline ===== */}
      <section style={{ marginTop: "32px" }}>
        <p
          className="font-mono"
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Event timeline
        </p>
        <div
          className="overflow-x-auto"
          style={{
            backgroundColor: "#0a0a0a",
            borderRadius: "8px",
            border: "1px solid #2a2a2a",
          }}
        >
          <svg
            width={TIMELINE_WIDTH}
            height={TIMELINE_HEIGHT}
            style={{ display: "block" }}
          >
            {/* Phase dashed verticals + labels */}
            {PHASE_STARTS.map((m, i) => {
              const x = xFor(m);
              return (
                <g key={`phase-${i}`}>
                  <line
                    x1={x}
                    y1={20}
                    x2={x}
                    y2={TIMELINE_HEIGHT - 20}
                    stroke="#f5b800"
                    strokeOpacity={0.4}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={x + 4}
                    y={16}
                    fill="#f5b800"
                    fontFamily="ui-monospace, monospace"
                    fontSize={11}
                  >
                    {PHASE_LABELS[i]}
                  </text>
                </g>
              );
            })}
            {/* X-axis labels every 30min */}
            {Array.from({ length: 9 }).map((_, i) => {
              const m = i * 30;
              const x = xFor(m);
              return (
                <g key={`tick-${i}`}>
                  <line
                    x1={x}
                    y1={TIMELINE_HEIGHT - 20}
                    x2={x}
                    y2={TIMELINE_HEIGHT - 14}
                    stroke="#3a3a3a"
                  />
                  <text
                    x={x}
                    y={TIMELINE_HEIGHT - 4}
                    fill="#6b7280"
                    fontFamily="ui-monospace, monospace"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {m === 0 ? "T+0" : m >= 60 ? `T+${(m / 60).toFixed(m % 60 ? 1 : 0)}h` : `T+${m}m`}
                  </text>
                </g>
              );
            })}
            {/* Lane separators */}
            <line x1={30} y1={50} x2={TIMELINE_WIDTH - 10} y2={50} stroke="#1f1f1f" />
            <line x1={30} y1={90} x2={TIMELINE_WIDTH - 10} y2={90} stroke="#1f1f1f" />
            <text x={4} y={45} fill="#6b7280" fontFamily="ui-monospace, monospace" fontSize={9}>
              ALERTS
            </text>
            <text x={4} y={85} fill="#6b7280" fontFamily="ui-monospace, monospace" fontSize={9}>
              DECISIONS
            </text>

            {/* Alert dots */}
            {ALERTS.map((a, i) => (
              <g key={`alert-${i}`}>
                <title>{`[${a.severity}] ${a.text}`}</title>
                <circle cx={xFor(a.minute)} cy={40} r={6} fill={sevColor(a.severity)} />
              </g>
            ))}

            {/* Decision diamonds */}
            {decisions.map((d, i) => {
              const m = tsToMinutes(d.timestamp);
              const x = xFor(m);
              const y = 80;
              const s = 8;
              return (
                <g key={`dec-${i}`}>
                  <title>{`${d.question}\nChoice: ${d.choice}\nReasoning: ${d.reasoning}`}</title>
                  <polygon
                    points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
                    fill={choiceColor(d.choice)}
                    stroke="#000"
                    strokeWidth={1}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <div
          className="flex gap-4 mt-3 font-mono"
          style={{ fontSize: "11px", color: "#9ca3af" }}
        >
          <span><span style={{ color: sevColor("CRIT") }}>●</span> CRIT</span>
          <span><span style={{ color: sevColor("HIGH") }}>●</span> HIGH</span>
          <span><span style={{ color: sevColor("MED") }}>●</span> MED</span>
          <span><span style={{ color: sevColor("INFO") }}>●</span> INFO</span>
          <span className="ml-6"><span style={{ color: "#10b981" }}>◆</span> YES</span>
          <span><span style={{ color: "#ef4444" }}>◆</span> NO</span>
          <span><span style={{ color: "#f59e0b" }}>◆</span> CONDITIONAL</span>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "#2a2a2a", margin: "40px 0" }} />

      {/* ===== Section 3: Decision log table ===== */}
      <section className="page-break">
        <p
          className="font-mono"
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Decision log
        </p>
        <div className="overflow-x-auto">
          <table
            className="w-full font-mono"
            style={{ fontSize: "13px", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                <th style={{ padding: "10px 12px" }}>Phase</th>
                <th style={{ padding: "10px 12px" }}>Decision question</th>
                <th style={{ padding: "10px 12px" }}>Choice</th>
                <th style={{ padding: "10px 12px" }}>Reasoning</th>
                <th style={{ padding: "10px 12px" }}>IEC 62443</th>
                <th style={{ padding: "10px 12px" }}>NIS-2</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d, i) => {
                const per = analysis?.perDecision[i];
                const pill = per ? nis2Pill(per.nis2) : null;
                return (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#1a1a1a" : "#141414",
                      verticalAlign: "top",
                    }}
                  >
                    <td style={{ padding: "10px 12px", color: "#f5b800" }}>
                      P{i + 1} · {d.timestamp}
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: 260 }}>{d.question}</td>
                    <td style={{ padding: "10px 12px", color: choiceColor(d.choice) }}>
                      {d.choice}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#d1d5db", maxWidth: 260 }}>
                      {d.reasoning}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#9ca3af", maxWidth: 200 }}>
                      {d.iec62443Ref}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {pill ? (
                        <span
                          className="keep-bg"
                          style={{
                            color: pill.color,
                            backgroundColor: pill.bg,
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {pill.label}
                        </span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {analysis && (
                <tr style={{ backgroundColor: "#0a0a0a" }}>
                  <td
                    colSpan={6}
                    style={{ padding: "10px 12px", color: "#9ca3af" }}
                  >
                    Totals: <span className="keep-color-green" style={{ color: "#10b981" }}>{counts.met} compliant</span>{" · "}
                    <span className="keep-color-amber" style={{ color: "#f59e0b" }}>{counts.at_risk} at risk</span>{" · "}
                    <span className="keep-color-red" style={{ color: "#ef4444" }}>{counts.missed} missed</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ height: "1px", backgroundColor: "#2a2a2a", margin: "40px 0" }} />

      {/* ===== Section 4: AI feedback ===== */}
      <section className="page-break">
        <p
          className="font-mono"
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Assessor feedback
        </p>

        {loading || !analysis ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded" style={{ backgroundColor: "#1f1f1f" }} />
            <div className="h-4 w-full animate-pulse rounded" style={{ backgroundColor: "#1f1f1f" }} />
            <div className="h-4 w-5/6 animate-pulse rounded" style={{ backgroundColor: "#1f1f1f" }} />
            <div className="h-4 w-2/3 animate-pulse rounded" style={{ backgroundColor: "#1f1f1f" }} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p
                className="font-mono"
                style={{
                  color: "#f5b800",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  marginBottom: "8px",
                }}
              >
                OVERALL ASSESSMENT
              </p>
              <p style={{ color: "#ffffff", fontSize: "14px", lineHeight: 1.7 }}>
                {analysis.overallAssessment}
              </p>
            </div>

            <div>
              <p
                className="font-mono"
                style={{
                  color: "#f5b800",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  marginBottom: "8px",
                }}
              >
                LESSONS LEARNED
              </p>
              <ul className="space-y-2">
                {analysis.lessons.slice(0, 3).map((l, i) => (
                  <li
                    key={i}
                    style={{ color: "#e5e7eb", fontSize: "14px", lineHeight: 1.6 }}
                  >
                    <span style={{ color: "#f5b800", marginRight: "10px" }}>—</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="font-mono"
              style={{
                border: "1px solid #f59e0b",
                backgroundColor: "rgba(245,158,11,0.05)",
                padding: "14px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#fde68a",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  color: "#f59e0b",
                  marginBottom: "6px",
                }}
              >
                IEC 62443 GAP
              </div>
              {analysis.iec62443Gap}
            </div>

            <div
              className="font-mono"
              style={{
                border: "1px solid #ef4444",
                backgroundColor: "rgba(239,68,68,0.05)",
                padding: "14px 16px",
                borderRadius: "6px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#fecaca",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.18em",
                  color: "#ef4444",
                  marginBottom: "6px",
                }}
              >
                NIS-2 GAP
              </div>
              {analysis.nis2Gap}
            </div>
          </div>
        )}
      </section>

      <div style={{ height: "1px", backgroundColor: "#2a2a2a", margin: "40px 0" }} />

      {/* ===== Section 5: Performance rating ===== */}
      {analysis && badge && (
        <section className="text-center page-break">
          <p
            className="font-mono"
            style={{
              color: "#9ca3af",
              fontSize: "11px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Performance rating
          </p>
          <div
            className="font-mono font-bold inline-block keep-bg"
            style={{
              backgroundColor: badge.bg,
              color: badge.fg,
              fontSize: "18px",
              padding: "14px 28px",
              borderRadius: "999px",
              letterSpacing: "0.1em",
            }}
          >
            {analysis.rating}
          </div>
          <p
            style={{
              color: "#d1d5db",
              fontSize: "14px",
              lineHeight: 1.7,
              marginTop: "16px",
              maxWidth: "640px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {analysis.ratingNote}
          </p>
        </section>
      )}

      {/* Print-only footer */}
      <div
        className="print-only"
        style={{
          marginTop: "40px",
          paddingTop: "12px",
          borderTop: "1px solid #888",
          fontSize: "10px",
          textAlign: "center",
          letterSpacing: "0.15em",
        }}
      >
        CONFIDENTIAL — EXERCISE USE ONLY
      </div>

      {/* ===== Section 6 + 7: Actions ===== */}
      <div className="no-print" style={{ marginTop: "48px" }}>
        <Button
          onClick={() => window.print()}
          className="w-full font-mono font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "#F5A623",
            color: "#000000",
            fontSize: "16px",
            height: "52px",
            borderRadius: "8px",
          }}
        >
          Download session report
        </Button>
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={onRestart}
            className="font-mono uppercase tracking-wider"
            style={{
              borderColor: "#f5b800",
              color: "#f5b800",
              backgroundColor: "transparent",
            }}
          >
            Play again as a different role →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DebriefScreen;
