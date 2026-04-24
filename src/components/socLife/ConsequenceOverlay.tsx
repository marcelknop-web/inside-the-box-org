import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVariantT } from "./variantContext";

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
  const { t } = useVariantT();

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

  // Tier thresholds — calibrated so wrong answers register as "lückenhaft/risky"
  // (the realistic case: an analyst made a defensible-but-incomplete call) rather
  // than as catastrophic. The "severe" bucket is reserved for truly egregious
  // procedural failures (delta ≤ -8). With the current option deltas (-2…-5)
  // every wrong pick lands in "risky", which matches the design intent: no
  // playbook step in this game models a cartoonishly wrong action.
  const tier = data.correct
    ? data.repDelta >= 6 ? "excellent" : "solid"
    : data.repDelta <= -8 ? "severe" : "risky";

  const verdictText = t(`consequence.${tier}`);
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

  // === Sequenced reveal cascade ===
  // Lets the user actually *follow* what's happening: verdict → quoted call →
  // rationale → (best answer if wrong) → numbers + continue. Each section is
  // gated on the previous one being fully typed, mirroring IncidentPanel.
  // Reset key includes `reason` so each new consequence re-animates from zero.
  const stepKey = data.reason;

  // T+0   verdict label visible immediately, title types after a tiny pause
  const titleStarts = useDelayedFlag(150, [stepKey]);
  const typedTitle  = useTypewriter(verdictText, 32, titleStarts);
  const titleDone   = titleStarts && typedTitle.length >= verdictText.length;

  // Quoted choice — types after the verdict title is done
  const callStarts  = useDelayedFlag(250, [titleDone]) && titleDone;
  const typedCall   = useTypewriter(data.optionLabel, 14, callStarts);
  const callDone    = callStarts && typedCall.length >= data.optionLabel.length;

  // Rationale — the meat of the learning loop
  const reasonStarts = useDelayedFlag(300, [callDone]) && callDone;
  const typedReason  = useTypewriter(data.reason, 16, reasonStarts);
  const reasonDone   = reasonStarts && typedReason.length >= data.reason.length;

  // Optional best-answer (only shown on wrong picks)
  const showBest = !data.correct && !!data.bestAnswerLabel;
  const bestStarts = useDelayedFlag(300, [reasonDone, showBest]) && reasonDone && showBest;
  const typedBest  = useTypewriter(data.bestAnswerLabel ?? "", 14, bestStarts);
  const bestDone   = !showBest || (bestStarts && typedBest.length >= (data.bestAnswerLabel?.length ?? 0));

  // Numbers + continue — only after all text has finished
  const tailReady = useDelayedFlag(250, [reasonDone, bestDone]) && reasonDone && bestDone;

  // Caret used inline while a section is still typing — visual hint that more
  // is coming, so the user doesn't try to dismiss too early.
  const caret = (color: string) => (
    <span className={cn("ml-0.5 inline-block w-1.5 h-3 align-middle animate-pulse", color)} />
  );

  return (
    // Renders inline in place of the IncidentPanel (same column, same slot)
    // so there's exactly one panel visible per step — no overlapping or
    // duplicated answer surfaces.
    <div className={cn("w-full rounded-lg border bg-background/95 backdrop-blur-sm p-4 sm:p-5 animate-fade-in", accent)}>
      <>
        {/* Verdict header */}
        <div className={cn("mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em]", verdictColor)}>
          <span className="text-base leading-none">{symbol}</span>
          <span>{t("consequence.verdict")}</span>
        </div>
        <h3 className={cn("mb-3 font-mono text-lg sm:text-xl leading-tight min-h-[1.5em]", verdictColor)}>
          {typedTitle}
          {titleStarts && !titleDone && caret("bg-current")}
        </h3>

        {/* The actual choice the user made — quoted, so they remember */}
        {callStarts && (
          <div className="mb-3 rounded-md border border-border/40 bg-background/60 p-3 animate-fade-in">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {t("consequence.yourCall")}
            </div>
            <div className="text-sm text-foreground leading-snug min-h-[1.4em]">
              „{typedCall}“
              {!callDone && caret("bg-foreground/60")}
            </div>
          </div>
        )}

        {/* Short professional rationale — turns the game into a learning loop */}
        {reasonStarts && (
          <div className={cn("mb-3 rounded-md border-l-2 bg-background/60 px-3 py-2 animate-fade-in",
            tier === "excellent" ? "border-l-emerald-500/70"
            : tier === "solid"   ? "border-l-cyan-400/70"
            : tier === "risky"   ? "border-l-amber-400/70"
            :                      "border-l-rose-500/70",
          )}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {t("consequence.rationale")}
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed min-h-[1.4em]">
              {typedReason}
              {!reasonDone && caret("bg-foreground/60")}
            </div>
          </div>
        )}

        {/* If the user got it wrong, surface what *would* have been right —
            this turns every mistake into a teaching moment instead of a mystery. */}
        {showBest && bestStarts && (
          <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 animate-fade-in">
            <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/90 mb-1">
              ✓ {t("consequence.bestAnswer")}
            </div>
            <div className="text-sm text-foreground leading-snug min-h-[1.4em]">
              „{typedBest}“
              {bestStarts && typedBest.length < (data.bestAnswerLabel?.length ?? 0) && caret("bg-emerald-300/70")}
            </div>
          </div>
        )}

        {/* Quantified impact + continue — only after the text has fully arrived */}
        {tailReady && (
          <div className="animate-fade-in">
            <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="rounded-md border border-border/40 bg-background/60 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("consequence.reputation")}
                </div>
                <div className={cn("mt-0.5 text-base tabular-nums", repColor)}>
                  {fmt(data.repDelta)}
                </div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/60 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("consequence.stress")}
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
              {t("consequence.continue")} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
