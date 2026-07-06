import React, { useMemo } from 'react';
import { PORTS, STAGES } from '@/lib/nordstern/stages';

/**
 * NauticalChart — a hand-drawn, game-quality sea chart of the Aegean route
 * Athen → Bodrum. Deep-sea gradient, bathymetric depth rings, stylised
 * island landmasses, rhumb lines, an ornate compass rose, animated wave
 * bands, a flowing sailed route and the ship at the current position.
 *
 * Pure SVG in a 0 0 100 70 viewBox, styled through the project's design
 * tokens (gold --primary, cyan --highlight).
 */

// Smooth closed coastline through a set of points (Q-curve chaining).
function smoothClosed(pts: [number, number][]): string {
  const p = pts;
  if (p.length < 3) return '';
  const first: [number, number] = [(p[0][0] + p[p.length - 1][0]) / 2, (p[0][1] + p[p.length - 1][1]) / 2];
  let d = `M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`;
  for (let i = 0; i < p.length; i++) {
    const next = p[(i + 1) % p.length];
    const mid: [number, number] = [(p[i][0] + next[0]) / 2, (p[i][1] + next[1]) / 2];
    d += ` Q ${p[i][0].toFixed(2)} ${p[i][1].toFixed(2)} ${mid[0].toFixed(2)} ${mid[1].toFixed(2)}`;
  }
  return d + ' Z';
}

// Deterministic organic island around a centre.
function islandPoints(cx: number, cy: number, r: number, seed: number, n = 12): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.68 + 0.42 * Math.abs(Math.sin(seed + i * 1.73)) + 0.14 * Math.cos(seed * 2 + i));
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82]);
  }
  return out;
}

type Island = { cx: number; cy: number; r: number; seed: number };

const NauticalChart: React.FC<{ currentStage: number }> = ({ currentStage }) => {
  const clamped = Math.min(currentStage, PORTS.length - 1);

  const islands: Island[] = useMemo(
    () => PORTS.map((p, i) => ({
      cx: p.x,
      cy: p.y,
      r: [3.6, 2.2, 2.4, 3.0, 3.4, 2.6, 3.2, 4.0][i] ?? 2.6,
      seed: i * 4.7 + 1.3,
    })),
    [],
  );

  const shipPos = PORTS[clamped];

  // Rhumb lines from the compass rose (top-right).
  const rose = { x: 84, y: 13 };
  const rhumbs = useMemo(() => {
    const lines: { x2: number; y2: number }[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      lines.push({ x2: rose.x + Math.cos(a) * 120, y2: rose.y + Math.sin(a) * 120 });
    }
    return lines;
  }, []);

  const plannedPts = PORTS.map(p => `${p.x},${p.y}`).join(' ');
  const sailedPts = PORTS.slice(0, clamped + 1).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      viewBox="0 0 100 70"
      className="w-auto h-auto max-w-full max-h-full rounded-md"
      style={{ aspectRatio: '100 / 70' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="ncSea" cx="42%" cy="38%" r="85%">
          <stop offset="0%" stopColor="hsl(210 45% 14%)" />
          <stop offset="55%" stopColor="hsl(214 48% 9%)" />
          <stop offset="100%" stopColor="hsl(216 55% 5%)" />
        </radialGradient>
        <linearGradient id="ncLand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.22)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.08)" />
        </linearGradient>
        <radialGradient id="ncVignette" cx="50%" cy="46%" r="72%">
          <stop offset="60%" stopColor="hsl(216 55% 5% / 0)" />
          <stop offset="100%" stopColor="hsl(216 60% 3% / 0.85)" />
        </radialGradient>
        <pattern id="ncGrid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(var(--highlight))" strokeWidth="0.08" opacity="0.18" />
        </pattern>
        <filter id="ncGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
        <filter id="ncSoft"><feGaussianBlur stdDeviation="0.35" /></filter>
      </defs>

      {/* Sea */}
      <rect width="100" height="70" fill="url(#ncSea)" />
      <rect width="100" height="70" fill="url(#ncGrid)" />

      {/* Rhumb lines (nautical chart web) */}
      <g clipPath="url(#ncClip)" opacity="0.5">
        <clipPath id="ncClip"><rect width="100" height="70" /></clipPath>
        {rhumbs.map((l, i) => (
          <line key={i} x1={rose.x} y1={rose.y} x2={l.x2} y2={l.y2}
            stroke="hsl(var(--highlight))" strokeWidth="0.06" opacity="0.28" />
        ))}
      </g>

      {/* Animated wave bands */}
      {[10, 22, 34, 47, 60].map((y, i) => (
        <path key={y}
          d={`M -5 ${y} Q 20 ${y - 1.6}, 45 ${y} T 105 ${y}`}
          fill="none" stroke="hsl(var(--highlight))" strokeWidth="0.14" opacity="0.16">
          <animate attributeName="d"
            values={`M -5 ${y} Q 20 ${y - 1.6}, 45 ${y} T 105 ${y};M -5 ${y} Q 20 ${y + 1.6}, 45 ${y} T 105 ${y};M -5 ${y} Q 20 ${y - 1.6}, 45 ${y} T 105 ${y}`}
            dur={`${7 + i}s`} repeatCount="indefinite" />
        </path>
      ))}

      {/* Bathymetric depth rings + island landmasses */}
      {islands.map((is, i) => {
        const base = islandPoints(is.cx, is.cy, is.r, is.seed);
        const ring1 = islandPoints(is.cx, is.cy, is.r * 1.5, is.seed);
        const ring2 = islandPoints(is.cx, is.cy, is.r * 2.05, is.seed);
        return (
          <g key={`isl-${i}`}>
            <path d={smoothClosed(ring2)} fill="none" stroke="hsl(var(--highlight))" strokeWidth="0.09" opacity="0.16" />
            <path d={smoothClosed(ring1)} fill="none" stroke="hsl(var(--highlight))" strokeWidth="0.1" opacity="0.24" />
            <path d={smoothClosed(base)} fill="url(#ncLand)" stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.16" />
            {/* tiny relief hatch */}
            <path d={smoothClosed(islandPoints(is.cx, is.cy - is.r * 0.15, is.r * 0.5, is.seed + 2))}
              fill="hsl(var(--primary) / 0.14)" stroke="none" />
          </g>
        );
      })}

      {/* Planned route (thin dotted) */}
      <polyline points={plannedPts} fill="none" stroke="hsl(var(--primary))"
        strokeWidth="0.35" strokeDasharray="0.6 1.1" strokeLinecap="round" opacity="0.45" />

      {/* Sailed route (glowing + flowing dashes) */}
      {clamped > 0 && (
        <>
          <polyline points={sailedPts} fill="none" stroke="hsl(var(--primary))"
            strokeWidth="1.1" strokeLinecap="round" opacity="0.45" filter="url(#ncGlow)" />
          <polyline points={sailedPts} fill="none" stroke="hsl(var(--primary))"
            strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1.4 1.2">
            <animate attributeName="stroke-dashoffset" values="0;-2.6" dur="1.1s" repeatCount="indefinite" />
          </polyline>
        </>
      )}

      {/* Leg distance labels */}
      {STAGES.map((s, i) => {
        const from = PORTS[i], to = PORTS[i + 1];
        if (!to) return null;
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        const done = i < clamped;
        return (
          <text key={`nm-${i}`} x={mx} y={my - 1} textAnchor="middle" fontSize="1.5"
            className="font-mono"
            fill={done ? 'hsl(var(--primary))' : 'hsl(var(--highlight))'}
            opacity={done ? 0.9 : 0.5}>{s.nm} sm</text>
        );
      })}

      {/* Ports */}
      {PORTS.map((p, i) => {
        const done = i <= clamped;
        const active = i === clamped;
        return (
          <g key={p.name}>
            {active && (
              <circle cx={p.x} cy={p.y} r="2" fill="hsl(var(--primary) / 0.35)">
                <animate attributeName="r" values="1.6;3.4;1.6" dur="2.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2.6s" repeatCount="indefinite" />
              </circle>
            )}
            {/* anchor tick */}
            <circle cx={p.x} cy={p.y} r={active ? 1.15 : 0.75}
              fill={active ? 'hsl(var(--primary))' : done ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--highlight) / 0.7)'}
              stroke="hsl(216 55% 5%)" strokeWidth="0.18" />
            <text x={p.x} y={p.y - 1.9} textAnchor="middle" fontSize="2"
              className="font-mono font-semibold"
              fill={active ? 'hsl(var(--primary))' : done ? 'hsl(var(--primary) / 0.85)' : 'hsl(220 30% 70%)'}
              stroke="hsl(216 55% 5%)" strokeWidth="0.35" paintOrder="stroke">{p.name}</text>
          </g>
        );
      })}

      {/* Ship at current position */}
      <g transform={`translate(${shipPos.x}, ${shipPos.y})`}>
        <text textAnchor="middle" fontSize="4.2" y="-0.6"
          style={{ filter: 'drop-shadow(0 0.3px 0.6px hsl(var(--primary) / 0.6))' }}>⛵
          <animateTransform attributeName="transform" type="translate"
            values="0 0; 0 -0.5; 0 0" dur="3s" repeatCount="indefinite" />
        </text>
      </g>

      {/* Ornate compass rose (top-right) */}
      <g transform={`translate(${rose.x}, ${rose.y})`}>
        <circle r="7.4" fill="hsl(216 55% 5% / 0.55)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="0.18" />
        <circle r="5.6" fill="none" stroke="hsl(var(--highlight) / 0.4)" strokeWidth="0.12" />
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="120s" repeatCount="indefinite" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const long = i % 2 === 0;
            const len = long ? 6.6 : 3.4;
            const x = Math.cos(a) * len, y = Math.sin(a) * len;
            const px = Math.cos(a + 0.24) * 1.3, py = Math.sin(a + 0.24) * 1.3;
            const qx = Math.cos(a - 0.24) * 1.3, qy = Math.sin(a - 0.24) * 1.3;
            return (
              <path key={i} d={`M ${x} ${y} L ${px} ${py} L 0 0 L ${qx} ${qy} Z`}
                fill={long ? 'hsl(var(--primary) / 0.85)' : 'hsl(var(--highlight) / 0.6)'}
                stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.06" />
            );
          })}
        </g>
        <circle r="0.9" fill="hsl(var(--primary))" />
        <text y="-8.3" textAnchor="middle" fontSize="2.1" className="font-mono font-bold" fill="hsl(var(--primary))">N</text>
        <text y="9.9" textAnchor="middle" fontSize="1.6" className="font-mono" fill="hsl(var(--highlight))">S</text>
        <text x="8.3" y="0.6" textAnchor="middle" fontSize="1.6" className="font-mono" fill="hsl(var(--highlight))">E</text>
        <text x="-8.3" y="0.6" textAnchor="middle" fontSize="1.6" className="font-mono" fill="hsl(var(--highlight))">W</text>
      </g>

      {/* Meltemi wind arrows (top-left, NE origin) */}
      <g opacity="0.4" stroke="hsl(var(--highlight))" strokeWidth="0.16" fill="none" strokeLinecap="round">
        {[[6, 5], [11, 8], [4, 11]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x}, ${y}) rotate(35)`}>
            <path d="M0 0 L 6 0" />
            <path d="M 4.6 -1.1 L 6 0 L 4.6 1.1" />
          </g>
        ))}
        <text x="4" y="3" fontSize="1.5" className="font-mono" fill="hsl(var(--highlight))" stroke="none">MELTEMI</text>
      </g>

      {/* Decorative tall-ship silhouette in open water */}
      <g transform="translate(40, 16)" opacity="0.3" fill="hsl(var(--primary) / 0.5)" stroke="hsl(var(--primary) / 0.6)" strokeWidth="0.12">
        <path d="M -3 1.4 L 3 1.4 L 2.2 2.6 L -2.2 2.6 Z" />
        <path d="M 0 1.4 L 0 -3" stroke="hsl(var(--primary) / 0.6)" strokeWidth="0.14" />
        <path d="M 0 -3 Q 2.3 -1.4 0.2 0.3 Z" />
        <path d="M 0 -2.2 Q -1.9 -1 -0.2 0.3 Z" />
      </g>

      {/* Title cartouche (bottom-left) */}
      <g transform="translate(4, 61)">
        <line x1="0" y1="0" x2="26" y2="0" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.12" />
        <text x="0" y="3.4" fontSize="2.8" className="font-mono font-bold" fill="hsl(var(--primary))"
          letterSpacing="0.4">MARE·AEGAEUM</text>
        <text x="0" y="5.9" fontSize="1.5" className="font-mono" fill="hsl(220 30% 62%)"
          letterSpacing="0.3">ATHEN → BODRUM · 7 ETAPPEN</text>
      </g>

      {/* Scale bar (bottom-right) */}
      <g transform="translate(74, 65)" fill="hsl(220 30% 68%)">
        <rect x="0" y="0" width="4" height="0.8" fill="hsl(var(--primary) / 0.8)" />
        <rect x="4" y="0" width="4" height="0.8" fill="hsl(216 55% 5%)" stroke="hsl(var(--primary) / 0.8)" strokeWidth="0.1" />
        <rect x="8" y="0" width="4" height="0.8" fill="hsl(var(--primary) / 0.8)" />
        <text x="0" y="-0.6" fontSize="1.3" className="font-mono">0</text>
        <text x="12" y="-0.6" textAnchor="end" fontSize="1.3" className="font-mono">30 sm</text>
      </g>

      {/* Border frame + graticule ticks */}
      <rect x="0.6" y="0.6" width="98.8" height="68.8" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="0.3" />
      <rect x="1.6" y="1.6" width="96.8" height="66.8" fill="none" stroke="hsl(var(--primary) / 0.18)" strokeWidth="0.12" />
      {Array.from({ length: 19 }).map((_, i) => {
        const x = 5 + i * 5;
        return <line key={`tx-${i}`} x1={x} y1="0.6" x2={x} y2="1.9" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.1" />;
      })}
      {Array.from({ length: 13 }).map((_, i) => {
        const y = 5 + i * 5;
        return <line key={`ty-${i}`} x1="0.6" y1={y} x2="1.9" y2={y} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.1" />;
      })}

      {/* Vignette on top */}
      <rect width="100" height="70" fill="url(#ncVignette)" pointerEvents="none" />
    </svg>
  );
};

export default NauticalChart;
