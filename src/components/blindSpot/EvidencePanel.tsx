import { useState } from "react";
import { AlertCard } from "./CommsFeed";

interface EvidenceItem {
  card: AlertCard;
  time: string;
  source: string;
}

interface Props {
  phaseName: string;
  phaseTimestamp: string;
  situation: string;
  nis2Flag?: string;
  alerts: EvidenceItem[];
}

export const EvidencePanel = ({
  phaseName,
  phaseTimestamp,
  situation,
  nis2Flag,
  alerts,
}: Props) => {
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
        <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
          Injects · Evidence
        </span>
        <span className="font-mono text-[10px] text-white/40">{phaseTimestamp}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Situation block */}
        <div className="rounded-md border border-white/10 bg-background/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#f5b800] mb-1.5">
            Situation · {phaseName}
          </p>
          <p className="text-[13px] text-white/85 leading-relaxed">{situation}</p>
          {nis2Flag && (
            <p className="mt-2 font-mono text-[11px] text-red-300 border-l-2 border-red-400 pl-2">
              {nis2Flag}
            </p>
          )}
        </div>

        {alerts.length === 0 && (
          <p className="font-mono text-[11px] text-white/40 italic px-1">
            Awaiting telemetry…
          </p>
        )}

        {alerts.map((a, i) => (
          <div key={`${a.source}-${i}`} className="animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                {a.source}
              </span>
              <span className="font-mono text-[10px] text-white/30">{a.time}</span>
            </div>
            <AlertCardView card={a.card} />
          </div>
        ))}
      </div>
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
      className="rounded-md p-3 mt-1 border"
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
    </div>
  );
};
