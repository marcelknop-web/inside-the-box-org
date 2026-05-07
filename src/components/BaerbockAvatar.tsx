import { useEffect, useRef, useState } from "react";

type Props = {
  /** 0..1 mouth openness (driven by audio amplitude) */
  mouth: number;
  /** whether the bot is currently speaking */
  speaking: boolean;
  /** size in px */
  size?: number;
};

/**
 * Stylized cartoon avatar inspired by a certain "Baerbock" archetype:
 * blonde bob, round cheeks, big enthusiastic smile.
 * Pure SVG so we can drive lip sync from audio amplitude.
 */
export default function BaerbockAvatar({ mouth, speaking, size = 140 }: Props) {
  const [blink, setBlink] = useState(false);
  const [tick, setTick] = useState(0);

  // Periodic blinking
  useEffect(() => {
    let t: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 130);
      t = window.setTimeout(loop, 2200 + Math.random() * 2800);
    };
    t = window.setTimeout(loop, 1500);
    return () => window.clearTimeout(t);
  }, []);

  // Animation tick for subtle sway when speaking
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

  const sway = speaking ? Math.sin(tick * 3.2) * 1.6 : 0;
  const nod = speaking ? Math.sin(tick * 2.1) * 1.2 : 0;

  // Mouth geometry
  const m = Math.min(1, Math.max(0, mouth));
  const mouthH = 3 + m * 22; // open height
  const mouthW = 28 + m * 6;
  const eyeRy = blink ? 0.6 : 3.2;
  const browLift = speaking ? 1 + Math.sin(tick * 4) * 1.2 : 0;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{
        transform: `rotate(${sway}deg) translateY(${nod}px)`,
        transition: "transform 60ms linear",
        filter: "drop-shadow(0 10px 30px hsl(320 80% 50% / 0.25))",
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id="bb-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(320 85% 78%)" />
          <stop offset="60%" stopColor="hsl(290 60% 35%)" />
          <stop offset="100%" stopColor="hsl(260 40% 18%)" />
        </radialGradient>
        <linearGradient id="bb-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3d27a" />
          <stop offset="100%" stopColor="#caa14a" />
        </linearGradient>
        <radialGradient id="bb-skin" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#ffe1cf" />
          <stop offset="100%" stopColor="#f0b896" />
        </radialGradient>
        <radialGradient id="bb-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(350 85% 70% / 0.85)" />
          <stop offset="100%" stopColor="hsl(350 85% 70% / 0)" />
        </radialGradient>
      </defs>

      {/* halo / backdrop */}
      <circle cx="100" cy="100" r="96" fill="url(#bb-bg)" opacity="0.6" />

      {/* hair back */}
      <path
        d="M40 110 C 35 55, 80 25, 100 25 C 125 25, 168 50, 162 110 L 158 150 C 158 155, 152 158, 148 154 C 140 145, 132 138, 120 138 L 80 138 C 68 138, 60 145, 52 154 C 48 158, 42 155, 42 150 Z"
        fill="url(#bb-hair)"
      />

      {/* face */}
      <ellipse cx="100" cy="108" rx="48" ry="54" fill="url(#bb-skin)" />

      {/* cheeks */}
      <ellipse cx="72" cy="122" rx="14" ry="8" fill="url(#bb-cheek)" />
      <ellipse cx="128" cy="122" rx="14" ry="8" fill="url(#bb-cheek)" />

      {/* hair fringe (bob) */}
      <path
        d="M55 90 C 60 55, 95 38, 100 38 C 110 38, 145 55, 148 95 C 140 78, 122 70, 100 72 C 80 73, 64 80, 55 90 Z"
        fill="url(#bb-hair)"
      />

      {/* eyebrows */}
      <path
        d={`M68 ${92 - browLift} q 10 -4 22 0`}
        stroke="#8a6a2a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M110 ${92 - browLift} q 10 -4 22 0`}
        stroke="#8a6a2a"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <ellipse cx="80" cy="105" rx="4" ry={eyeRy} fill="#2a1a3a" />
      <ellipse cx="120" cy="105" rx="4" ry={eyeRy} fill="#2a1a3a" />
      {!blink && (
        <>
          <circle cx="81.5" cy="103.5" r="1.1" fill="#fff" />
          <circle cx="121.5" cy="103.5" r="1.1" fill="#fff" />
        </>
      )}

      {/* nose */}
      <path
        d="M100 112 q -3 8 -2 14 q 2 3 6 1"
        stroke="#c98c6a"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* mouth — animated */}
      <g transform={`translate(100 ${142 + m * 2})`}>
        {/* smile baseline */}
        <path
          d={`M ${-mouthW / 2} 0 Q 0 ${6 + m * 4} ${mouthW / 2} 0`}
          stroke="#9a2a4a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* open mouth */}
        <ellipse
          cx="0"
          cy={mouthH / 2 + 1}
          rx={mouthW / 2 - 2}
          ry={mouthH / 2}
          fill="#5a1530"
        />
        {/* teeth */}
        {m > 0.15 && (
          <rect
            x={-mouthW / 2 + 3}
            y={1}
            width={mouthW - 6}
            height={Math.min(5, mouthH * 0.35)}
            rx="1.5"
            fill="#fff8ee"
          />
        )}
        {/* tongue */}
        {m > 0.45 && (
          <ellipse
            cx="0"
            cy={mouthH * 0.7}
            rx={mouthW / 2 - 5}
            ry={mouthH * 0.3}
            fill="#d75a78"
          />
        )}
      </g>

      {/* earrings (tiny) */}
      <circle cx="50" cy="128" r="2.2" fill="#f3d27a" />
      <circle cx="150" cy="128" r="2.2" fill="#f3d27a" />
    </svg>
  );
}
