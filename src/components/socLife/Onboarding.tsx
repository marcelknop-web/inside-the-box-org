import { useEffect, useState, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVariantT } from "./variantContext";
import {
  FloorplanPreview, MetersPreview, IncidentPreview, ConsequencePreview,
} from "./OnboardingPreviews";

interface OnboardingProps {
  onClose: () => void;
}

/**
 * 4-slide intro carousel — short, skippable, keyboard-friendly.
 * Shown once per browser via localStorage("socLife.onboarded"), and on
 * demand via the "?" button on the welcome screen.
 *
 *  Slide 1 — Move (floor plan / rooms)
 *  Slide 2 — Meters (reputation, stress, coffee, score)
 *  Slide 3 — Incidents (klaxon, required room, timer, options)
 *  Slide 4 — Consequence (verdict, deltas, continue)
 */
export function Onboarding({ onClose }: OnboardingProps) {
  const { t } = useVariantT();
  const [idx, setIdx] = useState(0);
  const total = 4;
  const isLast = idx === total - 1;

  // Keyboard nav: ←/→ navigate, Esc/Enter on last advance/close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) onClose(); else setIdx((i) => Math.min(total - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLast, onClose]);

  const slides: { Preview: ComponentType<{ className?: string }>; title: string; body: string }[] = [
    {
      Preview: FloorplanPreview,
      title: t("onboarding.s1Title"),
      body:  t("onboarding.s1Body"),
    },
    {
      Preview: MetersPreview,
      title: t("onboarding.s2Title"),
      body:  t("onboarding.s2Body"),
    },
    {
      Preview: IncidentPreview,
      title: t("onboarding.s3Title"),
      body:  t("onboarding.s3Body"),
    },
    {
      Preview: ConsequencePreview,
      title: t("onboarding.s4Title"),
      body:  t("onboarding.s4Body"),
    },
  ];

  const slide = slides[idx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-fade-in p-3">
      <div className="max-w-md w-full rounded-lg border border-primary/40 bg-background/95 p-5 sm:p-6 shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_20px_60px_-10px_hsl(var(--primary)/0.4)]">
        {/* Header: tag + skip */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
            {t("onboarding.tag")} · {idx + 1}/{total}
          </span>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("onboarding.skip")} ✕
          </button>
        </div>

        {/* Slide content: animated SVG preview + title + body */}
        <div className="mb-5">
          <div className="mb-3 rounded-md border border-border/40 bg-background/60 p-2">
            <slide.Preview />
          </div>
          <h3 className="mb-2 font-mono text-lg sm:text-xl text-foreground leading-tight">
            {slide.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {slide.body}
          </p>
        </div>

        {/* Dots */}
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`${i + 1}/${total}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>

        {/* Nav */}
        <div className="flex gap-2">
          {idx > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 font-mono"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
            >
              ← {t("onboarding.back")}
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 font-mono"
            onClick={() => isLast ? onClose() : setIdx((i) => i + 1)}
            autoFocus
          >
            {isLast ? t("onboarding.gotIt") : t("onboarding.next")} →
          </Button>
        </div>
      </div>
    </div>
  );
}
