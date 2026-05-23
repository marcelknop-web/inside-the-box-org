import { useEffect, useRef, useState } from "react";

export type DecisionChoice = "YES" | "NO" | "CONDITIONAL";

interface OptionDef {
  key: DecisionChoice;
  label: string;
  hover: string; // hex
}

interface Props {
  open: boolean;
  isUserIC: boolean;
  question: string;
  options: { yes: string; no: string; conditional: string };
  iec62443Ref: string;
  nis2Flag?: string;
  /** Seconds for the countdown. Default 180. */
  seconds?: number;
  /** Called when user commits as IC. */
  onCommitUser: (choice: DecisionChoice, reasoning: string, remainingSecs: number) => void;
  /** Called when running as non-IC — receives the user's recommendation to IC + remaining timer secs. */
  onAiIcAuto: (recommendation: { stance: DecisionChoice; reasoning: string; remainingSecs: number }) => void;
}

const OPTS: OptionDef[] = [
  { key: "YES", label: "YES", hover: "#22c55e" },
  { key: "NO", label: "NO", hover: "#ef4444" },
  { key: "CONDITIONAL", label: "CONDITIONAL", hover: "#F5A623" },
];

const fmt = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const a = Math.abs(s);
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const sec = a % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const MIN_REASONING = 20;

export const DecisionModal = ({
  open,
  isUserIC,
  question,
  options,
  iec62443Ref,
  nis2Flag,
  seconds = 180,
  onCommitUser,
  onAiIcAuto,
}: Props) => {
  const [choice, setChoice] = useState<DecisionChoice | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [remaining, setRemaining] = useState(seconds);
  const [hover, setHover] = useState<DecisionChoice | null>(null);

  // Non-IC recommendation state
  const [recStance, setRecStance] = useState<DecisionChoice | null>(null);
  const [recReasoning, setRecReasoning] = useState("");
  const [recSent, setRecSent] = useState(false);
  const autoFiredRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setChoice(null);
      setReasoning("");
      setRemaining(seconds);
      setHover(null);
      setRecStance(null);
      setRecReasoning("");
      setRecSent(false);
      autoFiredRef.current = false;
      return;
    }
    const t = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearInterval(t);
  }, [open, seconds]);

  // Capture timer at the moment the non-IC user sends their recommendation
  // so the speed bonus reflects when *they* acted, not when the AI replies.
  const recRemainingRef = useRef<number>(seconds);

  // Non-IC: only after user submits recommendation, schedule AI IC auto-decision
  useEffect(() => {
    if (!open || isUserIC || !recSent || autoFiredRef.current) return;
    autoFiredRef.current = true;
    const id = window.setTimeout(() => {
      if (recStance)
        onAiIcAuto({
          stance: recStance,
          reasoning: recReasoning.trim(),
          remainingSecs: recRemainingRef.current,
        });
    }, 4000);
    return () => window.clearTimeout(id);
  }, [open, isUserIC, recSent, recStance, recReasoning, onAiIcAuto]);

  if (!open) return null;

  const timerColor =
    remaining <= 30 ? "#ef4444" : remaining <= 90 ? "#F5A623" : "#22c55e";
  const overdue = remaining <= 0;

  const optionLabel = (k: DecisionChoice) =>
    k === "YES" ? options.yes : k === "NO" ? options.no : options.conditional;

  const trimmedLen = reasoning.trim().length;
  const reasoningTooShort = trimmedLen < MIN_REASONING;
  const canCommit = !!choice && !reasoningTooShort;

  const recTrimmedLen = recReasoning.trim().length;
  const recTooShort = recTrimmedLen < MIN_REASONING;
  const canSendRec = !!recStance && !recTooShort;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[600px] rounded-xl"
        style={{
          backgroundColor: "#1a1a1a",
          border: "2px solid #ef4444",
          padding: 40,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded font-mono text-[11px] uppercase tracking-wider"
            style={{ backgroundColor: "#ef4444", color: "#000" }}
          >
            ⚠ {isUserIC
              ? "IC Decision Required"
              : recSent
              ? "IC Decision in Progress"
              : "Your Recommendation Required"}
          </span>
          <div className="text-right">
            <div
              className={`font-mono text-lg font-bold ${overdue ? "animate-pulse" : ""}`}
              style={{ color: timerColor }}
            >
              {fmt(remaining)}
            </div>
            {overdue && (
              <div className="font-mono text-[10px] text-red-400 mt-0.5">
                Decision overdue — IC inaction is a decision
              </div>
            )}
          </div>
        </div>
        <div className="h-px w-full mb-6" style={{ backgroundColor: "#ef4444" }} />

        {/* Question */}
        <p className="text-white text-[20px] leading-snug text-center mb-6">{question}</p>

        {isUserIC ? (
          <>
            {/* Options */}
            <div className="space-y-2 mb-5">
              {OPTS.map((o) => {
                const selected = choice === o.key;
                const isHover = hover === o.key;
                const active = selected || isHover;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setChoice(o.key)}
                    onMouseEnter={() => setHover(o.key)}
                    onMouseLeave={() => setHover(null)}
                    className="w-full rounded-md font-mono text-sm uppercase tracking-wider transition-all"
                    style={{
                      padding: "14px 16px",
                      backgroundColor: selected ? o.hover : "#222",
                      border: `1px solid ${active ? o.hover : "#444"}`,
                      color: selected ? "#000" : "#fff",
                      transform: selected ? "scale(1.02)" : "scale(1)",
                      textAlign: "left",
                    }}
                  >
                    <span className="font-bold mr-2">{o.label}</span>
                    <span className="opacity-80 normal-case tracking-normal">
                      — {optionLabel(o.key)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Reasoning */}
            {choice && (
              <div className="mb-5 animate-fade-in">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-2">
                  Your reasoning — one sentence (required)
                </label>
                <div className="relative">
                  <textarea
                    value={reasoning}
                    maxLength={200}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={2}
                    className="w-full rounded-md px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none"
                    style={{
                      backgroundColor: "#111",
                      border: "1px solid #F5A623",
                    }}
                  />
                  <span
                    className="absolute bottom-1.5 right-2 font-mono text-[10px]"
                    style={{ color: reasoningTooShort ? "#ef4444" : "rgba(255,255,255,0.4)" }}
                  >
                    {trimmedLen}/200
                  </span>
                </div>
                {reasoningTooShort && (
                  <p
                    className="font-mono mt-1.5"
                    style={{ color: "#ef4444", fontSize: "11px" }}
                  >
                    Reasoning too short — describe your rationale (min. 20 characters)
                  </p>
                )}
              </div>
            )}
          </>
        ) : !recSent ? (
          <>
            <p className="font-mono text-[11px] uppercase tracking-wider text-white/60 mb-3 text-center">
              Recommend a stance to the Incident Commander
            </p>
            <div className="space-y-2 mb-5">
              {OPTS.map((o) => {
                const selected = recStance === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setRecStance(o.key)}
                    className="w-full rounded-md font-mono text-sm uppercase tracking-wider transition-all"
                    style={{
                      padding: "14px 16px",
                      backgroundColor: selected ? o.hover : "#222",
                      border: `1px solid ${selected ? o.hover : "#444"}`,
                      color: selected ? "#000" : "#fff",
                      transform: selected ? "scale(1.02)" : "scale(1)",
                      textAlign: "left",
                    }}
                  >
                    <span className="font-bold mr-2">RECOMMEND {o.label}</span>
                    <span className="opacity-80 normal-case tracking-normal">
                      — {optionLabel(o.key)}
                    </span>
                  </button>
                );
              })}
            </div>

            {recStance && (
              <div className="mb-5 animate-fade-in">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-white/60 mb-2">
                  Your rationale to the IC (required)
                </label>
                <div className="relative">
                  <textarea
                    value={recReasoning}
                    maxLength={240}
                    onChange={(e) => setRecReasoning(e.target.value)}
                    rows={3}
                    className="w-full rounded-md px-3 py-2 font-mono text-sm text-white resize-none focus:outline-none"
                    style={{ backgroundColor: "#111", border: "1px solid #F5A623" }}
                  />
                  <span
                    className="absolute bottom-1.5 right-2 font-mono text-[10px]"
                    style={{ color: recTooShort ? "#ef4444" : "rgba(255,255,255,0.4)" }}
                  >
                    {recTrimmedLen}/240
                  </span>
                </div>
                {recTooShort && (
                  <p className="font-mono mt-1.5" style={{ color: "#ef4444", fontSize: "11px" }}>
                    Rationale too short — explain your recommendation (min. 20 characters)
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 flex items-center justify-center gap-3 py-6">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#F5A623" }}
            />
            <span className="font-mono text-sm text-white/70">
              Recommendation sent — waiting for Incident Commander…
            </span>
          </div>
        )}

        {/* References */}
        <div className="font-mono text-[11px] text-white/50 space-y-0.5 mb-5">
          <div>
            <span className="text-[#f5b800]">IEC 62443:</span> {iec62443Ref}
          </div>
          {nis2Flag && (
            <div>
              <span className="text-red-300">NIS-2:</span> {nis2Flag}
            </div>
          )}
        </div>

        {/* Commit / Send */}
        {isUserIC && (
          <button
            type="button"
            disabled={!canCommit}
            onClick={() => choice && onCommitUser(choice, reasoning.trim())}
            className="w-full rounded-md font-mono text-sm uppercase tracking-wider transition-opacity disabled:opacity-40"
            style={{
              padding: "12px 16px",
              backgroundColor: "#F5A623",
              color: "#000",
            }}
          >
            Commit decision →
          </button>
        )}
        {!isUserIC && !recSent && (
          <button
            type="button"
            disabled={!canSendRec}
            onClick={() => setRecSent(true)}
            className="w-full rounded-md font-mono text-sm uppercase tracking-wider transition-opacity disabled:opacity-40"
            style={{
              padding: "12px 16px",
              backgroundColor: "#F5A623",
              color: "#000",
            }}
          >
            Send recommendation to IC →
          </button>
        )}
      </div>
    </div>
  );
};
