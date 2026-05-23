import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PhaseScoreBreakdown,
  rating,
  totalScore,
} from "@/utils/blindSpotScoring";
import {
  BSHighscoreEntry,
  BS_HIGHSCORE_NAME_MAX,
  loadBSHighscores,
  qualifiesBS,
  saveBSHighscore,
} from "@/utils/blindSpotHighscore";
import { playGameOverSting } from "@/utils/blindSpotGameOverAudio";

interface Props {
  open: boolean;
  roleName: string;
  breakdowns: PhaseScoreBreakdown[];
  onContinue: () => void;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export const GameOverOverlay = ({ open, roleName, breakdowns, onContinue }: Props) => {
  const [ready, setReady] = useState(false);
  const [highscores, setHighscores] = useState<BSHighscoreEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const score = totalScore(breakdowns);
  const rate = rating(score);
  const qualifies = !submitted && qualifiesBS(score, roleName);

  useEffect(() => {
    if (!open) {
      setReady(false);
      setSubmitted(false);
      setPlayerName("");
      return;
    }
    playGameOverSting();
    setHighscores(loadBSHighscores(roleName));
    const t = window.setTimeout(() => setReady(true), 2200);
    return () => window.clearTimeout(t);
  }, [open, roleName]);

  const submit = () => {
    const list = saveBSHighscore({ name: playerName, score, role: roleName });
    setHighscores(list);
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
    >
      {!ready ? (
        <div className="text-center">
          <p
            className="font-mono font-bold tracking-[0.4em] animate-pulse"
            style={{ fontSize: 64, color: "#ef4444" }}
          >
            EXERCISE OVER
          </p>
          <p className="font-mono text-xs text-white/50 mt-3 tracking-widest">
            BLIND SPOT · {roleName.toUpperCase()}
          </p>
        </div>
      ) : (
        <div
          className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-xl animate-fade-in"
          style={{ backgroundColor: "#1a1a1a", border: "2px solid #ef4444", padding: 32 }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ color: "#ef4444" }}
          >
            ▲ Exercise over
          </p>
          <h2 className="font-mono text-2xl text-white mb-4">
            Blind Spot · {roleName}
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-md p-3 border border-white/10 bg-background/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Final score
              </div>
              <div className="mt-1 text-3xl font-mono text-[#f5b800] tabular-nums">{score}</div>
            </div>
            <div className="rounded-md p-3 border border-white/10 bg-background/40">
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Rating
              </div>
              <div
                className="mt-1 text-xl font-mono font-bold tracking-wider"
                style={{ color: rate.color }}
              >
                {rate.label}
              </div>
            </div>
          </div>

          {/* Phase breakdown */}
          <div className="mb-5 rounded-md border border-white/10 bg-background/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
              Score breakdown
            </div>
            <table className="w-full font-mono text-[11px]">
              <thead className="text-white/40">
                <tr>
                  <th className="text-left py-1">Phase</th>
                  <th className="text-right">Decision</th>
                  <th className="text-right">Speed</th>
                  <th className="text-right">Rationale</th>
                  <th className="text-right">Chat</th>
                  <th className="text-right">Compl.</th>
                  <th className="text-right">Push</th>
                  <th className="text-right text-[#f5b800]">Σ</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {breakdowns.map((b) => (
                  <tr key={b.phaseIndex} className="border-t border-white/5">
                    <td className="py-1 text-white/80">
                      P{b.phaseIndex}
                      <span
                        className="ml-2 text-[9px]"
                        style={{
                          color:
                            b.hit === "perfect"
                              ? "#22c55e"
                              : b.hit === "partial"
                              ? "#F5A623"
                              : "#ef4444",
                        }}
                      >
                        {b.hit.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right text-white/80">{b.decisionPts}</td>
                    <td className="text-right text-white/60">{b.speedPts}</td>
                    <td className="text-right text-white/60">{b.reasoningPts}</td>
                    <td className="text-right text-white/60">{b.chatPts}</td>
                    <td className="text-right text-white/60">{b.compliancePts}</td>
                    <td className="text-right text-white/60">{b.pushbackPts}</td>
                    <td className="text-right text-[#f5b800]">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Highscore entry */}
          {qualifies && (
            <div className="mb-4 rounded-md border border-[#f5b800]/40 bg-[#f5b800]/5 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#f5b800]">
                ★ New top-10 score
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) =>
                    setPlayerName(e.target.value.slice(0, BS_HIGHSCORE_NAME_MAX))
                  }
                  placeholder="Your handle"
                  maxLength={BS_HIGHSCORE_NAME_MAX}
                  autoFocus
                  className="flex-1 rounded-md border border-white/20 bg-background px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f5b800]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                />
                <Button
                  size="sm"
                  onClick={submit}
                  className="bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono shrink-0"
                >
                  Save
                </Button>
              </div>
              <button
                onClick={() => setSubmitted(true)}
                className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-white"
              >
                Skip
              </button>
            </div>
          )}

          {/* Leaderboard */}
          <div className="mb-5 rounded-md border border-white/10 bg-background/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mb-2">
              ☷ Top 10 · {roleName}
            </div>
            {highscores.length === 0 ? (
              <p className="font-mono text-xs text-white/40 italic py-2">
                No scores yet — this is your first run.
              </p>
            ) : (
              <ol className="space-y-0.5 font-mono text-[11px]">
                {highscores.map((e, i) => {
                  const isMine =
                    submitted &&
                    e.score === score &&
                    e.name ===
                      (playerName.trim().slice(0, BS_HIGHSCORE_NAME_MAX) || "ANON");
                  const medal = i < 3 ? MEDAL[i] : "  ";
                  return (
                    <li
                      key={`${e.ts}-${i}`}
                      className={
                        isMine
                          ? "flex items-baseline gap-2 rounded px-1.5 py-0.5 bg-[#f5b800]/15 text-[#f5b800]"
                          : "flex items-baseline gap-2 px-1.5 py-0.5 text-white/80"
                      }
                    >
                      <span className="w-6 text-right text-white/40 tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="w-5">{medal}</span>
                      <span className="flex-1 truncate">{e.name}</span>
                      <span className="w-14 text-right tabular-nums">{e.score}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <Button
            onClick={onContinue}
            className="w-full bg-[#f5b800] text-black hover:bg-[#f5b800]/90 font-mono uppercase tracking-wider"
          >
            View full debrief →
          </Button>
        </div>
      )}
    </div>
  );
};
