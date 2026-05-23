import { useEffect, useState } from "react";
import { Phase, phaseColor } from "@/data/blindSpotScenario";

interface Props {
  phase: Phase | null;
  show: boolean;
  onDone: () => void;
}

export const PhaseTransition = ({ phase, show, onDone }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show || !phase) return;
    setVisible(true);
    const t1 = window.setTimeout(() => setVisible(false), 1600);
    const t2 = window.setTimeout(() => onDone(), 2000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [show, phase, onDone]);

  if (!show || !phase) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85), rgba(0,0,0,0.95))" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* Sweeping bands */}
        <div
          className="absolute left-0 right-0 h-px bg-[#f5b800]/70"
          style={{ top: "30%", animation: "phaseSweep 1.6s ease-out forwards" }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-[#f5b800]/40"
          style={{ top: "70%", animation: "phaseSweep 1.6s ease-out 0.15s forwards" }}
        />
      </div>

      <style>{`
        @keyframes phaseSweep {
          0% { transform: translateX(-100%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes phaseZoom {
          0% { opacity: 0; transform: scale(0.85); letter-spacing: 0.4em; }
          50% { opacity: 1; transform: scale(1); letter-spacing: 0.1em; }
          100% { opacity: 1; transform: scale(1); letter-spacing: 0.1em; }
        }
      `}</style>

      <div
        className="text-center"
        style={{ animation: "phaseZoom 0.9s cubic-bezier(0.2, 0.9, 0.2, 1) forwards" }}
      >
        <div className={`inline-flex font-mono text-[10px] uppercase tracking-[0.4em] px-3 py-1 rounded border mb-4 ${phaseColor(phase.colorKey)}`}>
          {phase.timestamp}
        </div>
        <p className="font-mono text-[11px] text-[#f5b800] uppercase tracking-[0.5em] mb-2">
          Phase {phase.index} incoming
        </p>
        <h2 className="font-mono text-3xl md:text-5xl font-bold text-white tracking-tight">
          {phase.name.split("—")[1]?.trim() ?? phase.name}
        </h2>
      </div>
    </div>
  );
};
