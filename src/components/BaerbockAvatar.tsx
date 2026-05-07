import { useEffect, useState } from "react";
import portrait from "@/assets/baerbock-portrait.jpg";

type Props = {
  mouth: number;       // 0..1 mouth openness from audio amplitude
  speaking: boolean;
  size?: number;
};

/**
 * Photo-based avatar with subtle lip-sync overlay, blink and gentle head sway.
 * Mouth opening is faked with a dark ellipse positioned over the lips,
 * scaled by amplitude. Subtle but synced to the audio.
 */
export default function BaerbockAvatar({ mouth, speaking, size = 160 }: Props) {
  const [blink, setBlink] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let t: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 120);
      t = window.setTimeout(loop, 2500 + Math.random() * 2800);
    };
    t = window.setTimeout(loop, 1800);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!speaking) return;
    let raf: number;
    const start = performance.now();
    const loop = () => {
      setTick((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [speaking]);

  const m = Math.min(1, Math.max(0, mouth));
  const sway = speaking ? Math.sin(tick * 2.6) * 0.8 : 0;
  const nod = speaking ? Math.sin(tick * 1.7) * 1 : 0;

  // Mouth overlay geometry — tuned to the generated portrait
  // (lips sit roughly at ~66% vertical, ~50% horizontal in the image)
  const mouthOpen = m; // 0..1
  const mouthHeightPct = 1.5 + mouthOpen * 5.5; // % of avatar height
  const mouthWidthPct = 11 + mouthOpen * 1.5;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "9999px",
        overflow: "hidden",
        transform: `rotate(${sway}deg) translateY(${nod}px)`,
        transition: "transform 80ms linear",
        boxShadow:
          "0 12px 40px hsl(320 60% 30% / 0.35), 0 0 0 2px hsl(0 0% 100% / 0.08) inset",
      }}
      aria-hidden
    >
      <img
        src={portrait}
        alt=""
        loading="lazy"
        width={size}
        height={size}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Mouth opening overlay */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "70%",
          transform: "translate(-50%, -50%)",
          width: `${mouthWidthPct}%`,
          height: `${mouthHeightPct}%`,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(60,15,25,0.92) 0%, rgba(60,15,25,0.85) 55%, rgba(60,15,25,0.0) 100%)",
          opacity: mouthOpen > 0.05 ? 0.85 : 0,
          transition: "opacity 80ms linear, height 60ms linear, width 60ms linear",
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}
      />

      {/* Blink overlays — two thin bars over each eye */}
      <BlinkLid show={blink} side="left" />
      <BlinkLid show={blink} side="right" />

      {/* Subtle warm vignette while speaking */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 60%, hsl(320 80% 60% / 0.12), transparent 60%)",
          opacity: speaking ? 1 : 0,
          transition: "opacity 250ms ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function BlinkLid({ show, side }: { show: boolean; side: "left" | "right" }) {
  // Eye positions tuned to the generated portrait (~52% vertical)
  const left = side === "left" ? "39%" : "61%";
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: "53%",
        width: "11%",
        height: show ? "3.5%" : "0%",
        transform: "translate(-50%, -50%)",
        background:
          "linear-gradient(to bottom, rgba(225,180,150,0.95), rgba(190,140,110,0.9))",
        borderRadius: "40%",
        transition: "height 90ms ease",
        pointerEvents: "none",
      }}
    />
  );
}
