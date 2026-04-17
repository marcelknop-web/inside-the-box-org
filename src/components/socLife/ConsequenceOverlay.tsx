import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Letter-by-letter typewriter, gated on `start`. Mirrors the pattern used
 *  in IncidentPanel so reveal cadence feels consistent across the game. */
function useTypewriter(text: string, msPerChar = 18, start = true) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text || !start) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [text, msPerChar, start]);
  return shown;
}

/** Fires `true` after `delayMs`; resets when `deps` change. */
function useDelayedFlag(delayMs: number, deps: unknown[] = []): boolean {
  const [ready, setReady] = useState(delayMs <= 0);
  useEffect(() => {
    setReady(delayMs <= 0);
    if (delayMs <= 0) return;
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ready;
}

export interface ConsequenceData {
  /** The exact option the user picked, in their language */
  optionLabel: string;
  /** Was the option correct? */
  correct: boolean;
  /** Reputation delta applied (positive = gain, negative = loss) */
  repDelta: number;
  /** Stress delta applied (positive = more stress, negative = relief) */
  stressDelta: number;
  /** Short professional rationale shown under the verdict */
  reason: string;
  /** Localized text of the option that *would* have been correct.
   *  Only shown when the user picked a wrong option, as a learning aid. */
  bestAnswerLabel?: string;
}

interface Props {
  data: ConsequenceData;
  onContinue: () => void;
}

/**
 * Prominent, blocking overlay shown right after the analyst makes a choice.
 * Surfaces the consequence in differentiated language (4 verdict tiers based
 * on correct + delta magnitude) so the user actually feels the weight of the
 * decision before the next step kicks in. Replaces toast-spam.
 *
 * Tiers:
 *   excellent — correct + strong gain (delta >= 6)
 *   solid     — correct but modest gain
 *   risky     — wrong, modest loss
 *   severe    — wrong + heavy loss (delta <= -4)
 */
export function ConsequenceOverlay({ data, onContinue }: Props) {
  const { t } = useLanguage();

  // Allow Enter / Space to dismiss for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onContinue]);

  const tier = data.correct
    ? data.repDelta >= 6 ? "excellent" : "solid"
    : data.repDelta <= -4 ? "severe" : "risky";

  const verdictText = t(`socLife.consequence.${tier}`);
  const accent =
    tier === "excellent" ? "border-emerald-500/60 shadow-[0_0_0_1px_hsl(142_70%_45%/0.25),0_20px_60px_-10px_hsl(142_70%_45%/0.4)]"
    : tier === "solid"   ? "border-cyan-400/50 shadow-[0_0_0_1px_hsl(190_90%_50%/0.2),0_20px_60px_-10px_hsl(190_90%_50%/0.35)]"
    : tier === "risky"   ? "border-amber-400/60 shadow-[0_0_0_1px_hsl(40_90%_55%/0.25),0_20px_60px_-10px_hsl(40_90%_55%/0.4)]"
    :                      "border-rose-500/60 shadow-[0_0_0_1px_hsl(var(--destructive)/0.3),0_20px_60px_-10px_hsl(var(--destructive)/0.45)]";
  const verdictColor =
    tier === "excellent" ? "text-emerald-300"
    : tier === "solid"   ? "text-cyan-300"
    : tier === "risky"   ? "text-amber-300"
    :                      "text-rose-300";
  const symbol =
    tier === "excellent" ? "✓"
    : tier === "solid"   ? "✓"
    : tier === "risky"   ? "▲"
    :                      "✕";

  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const repColor = data.repDelta > 0 ? "text-emerald-300" : data.repDelta < 0 ? "text-rose-300" : "text-muted-foreground";
  // Stress is inverted: less stress = good
  const stressColor = data.stressDelta < 0 ? "text-emerald-300" : data.stressDelta > 0 ? "text-rose-300" : "text-muted-foreground";

  return (
    // Outer wrapper handles overflow so the panel can scroll on tiny viewports
    // instead of pushing layout around when reason text length varies.
    <div className="absolute inset-0 z-40 flex items-start sm:items-center justify-center bg-background/85 backdrop-blur-sm animate-fade-in p-3 overflow-y-auto">
      <div className={cn("max-w-md w-full my-auto rounded-lg border bg-background/95 p-4 sm:p-5", accent)}>
        {/* Verdict header */}
        <div className={cn("mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]", verdictColor)}>
          <span className="text-base leading-none">{symbol}</span>
          <span>{t("socLife.consequence.verdict")}</span>
        </div>
        <h3 className={cn("mb-3 font-mono text-lg sm:text-xl leading-tight", verdictColor)}>
          {verdictText}
        </h3>

        {/* The actual choice the user made — quoted, so they remember */}
        <div className="mb-3 rounded-md border border-border/40 bg-background/60 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {t("socLife.consequence.yourCall")}
          </div>
          <div className="text-sm text-foreground leading-snug">
            „{data.optionLabel}“
          </div>
        </div>

        {/* Short professional rationale — turns the game into a learning loop */}
        <div className={cn("mb-3 rounded-md border-l-2 bg-background/60 px-3 py-2",
          tier === "excellent" ? "border-l-emerald-500/70"
          : tier === "solid"   ? "border-l-cyan-400/70"
          : tier === "risky"   ? "border-l-amber-400/70"
          :                      "border-l-rose-500/70",
        )}>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {t("socLife.consequence.rationale")}
          </div>
          <div className="text-sm text-foreground/90 leading-relaxed">
            {data.reason}
          </div>
        </div>

        {/* If the user got it wrong, surface what *would* have been right —
            this turns every mistake into a teaching moment instead of a mystery. */}
        {!data.correct && data.bestAnswerLabel && (
          <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/90 mb-1">
              ✓ {t("socLife.consequence.bestAnswer")}
            </div>
            <div className="text-sm text-foreground leading-snug">
              „{data.bestAnswerLabel}“
            </div>
          </div>
        )}

        {/* Quantified impact */}
        <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs">
          <div className="rounded-md border border-border/40 bg-background/60 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("socLife.consequence.reputation")}
            </div>
            <div className={cn("mt-0.5 text-base tabular-nums", repColor)}>
              {fmt(data.repDelta)}
            </div>
          </div>
          <div className="rounded-md border border-border/40 bg-background/60 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("socLife.consequence.stress")}
            </div>
            <div className={cn("mt-0.5 text-base tabular-nums", stressColor)}>
              {fmt(data.stressDelta)}
            </div>
          </div>
        </div>

        <Button
          onClick={onContinue}
          className="w-full font-mono"
          size="lg"
          autoFocus
        >
          {t("socLife.consequence.continue")} →
        </Button>
      </div>
    </div>
  );
}
