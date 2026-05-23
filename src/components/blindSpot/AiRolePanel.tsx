import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  aiRole: string;
  userRole: string;
  phaseName: string;
  phaseTimestamp: string;
  situation: string;
  userInput?: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  onReady: (text: string) => void;
  triggerKey: string; // change to re-fetch
}

const ROLE_ICON: Record<string, string> = {
  "IT-Ops": "⌬",
  "OT-Ops": "⚙",
  "Incident Commander": "✦",
  "Management & Comms": "◈",
};

export const AiRolePanel = ({
  aiRole,
  userRole,
  phaseName,
  phaseTimestamp,
  situation,
  userInput,
  history,
  onReady,
  triggerKey,
}: Props) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      setText("");
      try {
        const { data, error } = await supabase.functions.invoke("blind-spot-chat", {
          body: {
            mode: "role",
            aiRole,
            userRole,
            phaseName,
            phaseTimestamp,
            situation,
            userInput,
            history,
          },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const out = (data?.text as string) ?? "";
        setText(out);
        onReady(out);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  return (
    <div
      className={`rounded-lg border bg-background/40 p-4 transition-all ${
        loading ? "border-[#f5b800]/60 animate-pulse" : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#f5b800]">
          <span className="text-lg leading-none">{ROLE_ICON[aiRole] ?? "•"}</span>
          {aiRole}
        </div>
        {loading && (
          <span className="text-[10px] font-mono text-white/40">assessing…</span>
        )}
      </div>
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
          {text || (loading ? `${aiRole} is assessing the situation…` : "")}
        </p>
      )}
    </div>
  );
};
