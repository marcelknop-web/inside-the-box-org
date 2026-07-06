import React from 'react';

/**
 * BriefingIcons — bespoke, game-quality maritime line-art for the Nordstern
 * briefing card. Every glyph is hand-built SVG on a 0 0 48 48 grid, styled
 * through the project's design tokens (gold --primary, cyan --highlight) so it
 * sits inside the dark tech-atelier aesthetic. These replace the emoji /
 * generic lucide icons with crafted illustrations that match each element:
 *
 *   WindGauge   — Beaufort dial with a swinging wind vane
 *   DistanceIcon— log/route marker over a swell of waves
 *   CrewIcon    — ship's helm wheel
 *   TopicIcon   — per-topic emblem (compass rose / scales / storm / anchor)
 */

type IconProps = { className?: string };

const P = 'hsl(var(--primary))';
const H = 'hsl(var(--highlight))';

const frame = (children: React.ReactNode, cls?: string) => (
  <svg viewBox="0 0 48 48" className={cls} fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

/* ------------------------------------------------------------------ */
/* Beaufort wind gauge                                                 */
/* ------------------------------------------------------------------ */
export const WindGauge: React.FC<{ bft: number; className?: string }> = ({ bft, className }) => {
  const pct = Math.min(1, Math.max(0, bft / 12));
  // arc from 135deg to 405deg (270deg sweep)
  const start = 135;
  const sweep = 270;
  const r = 19;
  const cx = 24, cy = 24;
  const toXY = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const [sx, sy] = toXY(start);
  const [ex, ey] = toXY(start + sweep);
  const [vx, vy] = toXY(start + sweep * pct);
  const large = sweep > 180 ? 1 : 0;
  const [vex, vey] = toXY(start + sweep * pct); // needle tip
  return frame(
    <>
      {/* tick marks */}
      {Array.from({ length: 13 }).map((_, i) => {
        const deg = start + (sweep * i) / 12;
        const a = (deg * Math.PI) / 180;
        const inner = i % 3 === 0 ? 15 : 16.5;
        return (
          <line key={i}
            x1={cx + inner * Math.cos(a)} y1={cy + inner * Math.sin(a)}
            x2={cx + 18 * Math.cos(a)} y2={cy + 18 * Math.sin(a)}
            stroke={H} strokeWidth={i % 3 === 0 ? 1 : 0.5} opacity={0.5} strokeLinecap="round" />
        );
      })}
      {/* track */}
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
        stroke={H} strokeOpacity={0.2} strokeWidth={2.5} strokeLinecap="round" />
      {/* value arc */}
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${sweep * pct > 180 ? 1 : 0} 1 ${vx} ${vy}`}
        stroke={P} strokeWidth={2.5} strokeLinecap="round" />
      {/* needle */}
      <line x1={cx} y1={cy} x2={vex} y2={vey} stroke={P} strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
      <circle cx={cx} cy={cy} r={2.4} fill={P} />
    </>,
    className,
  );
};

/* ------------------------------------------------------------------ */
/* Distance / route log                                                */
/* ------------------------------------------------------------------ */
export const DistanceIcon: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      {/* swell */}
      <path d="M4 34 Q10 30 16 34 T28 34 T40 34 T52 34" stroke={H} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
      <path d="M4 40 Q10 36 16 40 T28 40 T40 40 T52 40" stroke={H} strokeWidth={1.4} strokeLinecap="round" opacity={0.3} />
      {/* dotted route */}
      <path d="M8 26 Q20 8 40 14" stroke={P} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="1 3.5" opacity={0.85} />
      {/* start marker */}
      <circle cx="8" cy="26" r="2.4" fill={P} />
      {/* end marker — small flag */}
      <circle cx="40" cy="14" r="2" fill="none" stroke={P} strokeWidth={1.4} />
      <path d="M40 14 L40 5 L47 8 L40 11" fill={P} stroke={P} strokeWidth={0.8} strokeLinejoin="round" />
    </>,
    className,
  );

/* ------------------------------------------------------------------ */
/* Crew — helm wheel                                                   */
/* ------------------------------------------------------------------ */
export const CrewIcon: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      <circle cx="24" cy="24" r="9" fill="none" stroke={P} strokeWidth={1.8} />
      <circle cx="24" cy="24" r="3.4" fill="none" stroke={P} strokeWidth={1.6} />
      <circle cx="24" cy="24" r="1" fill={P} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x1 = 24 + 9 * Math.cos(a), y1 = 24 + 9 * Math.sin(a);
        const x2 = 24 + 16 * Math.cos(a), y2 = 24 + 16 * Math.sin(a);
        const kx = 24 + 15 * Math.cos(a), ky = 24 + 15 * Math.sin(a);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P} strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={kx} cy={ky} r={1.9} fill="none" stroke={H} strokeWidth={1.3} />
          </g>
        );
      })}
    </>,
    className,
  );

/* ------------------------------------------------------------------ */
/* Topic emblems                                                       */
/* ------------------------------------------------------------------ */
const CompassRose: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      <circle cx="24" cy="24" r="17" fill="none" stroke={H} strokeWidth={1} opacity={0.5} />
      <circle cx="24" cy="24" r="13" fill="none" stroke={H} strokeWidth={0.6} opacity={0.3} />
      {/* N-S-E-W star */}
      <path d="M24 6 L27 24 L24 42 L21 24 Z" fill={P} opacity={0.9} />
      <path d="M6 24 L24 21 L42 24 L24 27 Z" fill={P} opacity={0.55} />
      {/* diagonals */}
      <path d="M12 12 L24 24 L36 36" stroke={H} strokeWidth={0.8} opacity={0.4} />
      <path d="M36 12 L24 24 L12 36" stroke={H} strokeWidth={0.8} opacity={0.4} />
      <circle cx="24" cy="24" r="2" fill={P} />
    </>,
    className,
  );

const Scales: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      <line x1="24" y1="8" x2="24" y2="40" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      <line x1="10" y1="14" x2="38" y2="14" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="24" cy="8" r="2" fill={P} />
      {/* base */}
      <path d="M17 40 H31" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      {/* left pan */}
      <line x1="10" y1="14" x2="10" y2="18" stroke={H} strokeWidth={1} />
      <path d="M4 18 A6 6 0 0 0 16 18 Z" fill="none" stroke={P} strokeWidth={1.5} strokeLinejoin="round" />
      <line x1="4" y1="18" x2="16" y2="18" stroke={P} strokeWidth={1.3} />
      {/* right pan */}
      <line x1="38" y1="14" x2="38" y2="18" stroke={H} strokeWidth={1} />
      <path d="M32 18 A6 6 0 0 0 44 18 Z" fill="none" stroke={P} strokeWidth={1.5} strokeLinejoin="round" />
      <line x1="32" y1="18" x2="44" y2="18" stroke={P} strokeWidth={1.3} />
    </>,
    className,
  );

const StormCloud: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      {/* cloud */}
      <path d="M14 24 A7 7 0 0 1 27 20 A6 6 0 0 1 37 25 A5 5 0 0 1 36 34 H15 A6 6 0 0 1 14 24 Z"
        fill="none" stroke={P} strokeWidth={1.8} strokeLinejoin="round" />
      {/* lightning */}
      <path d="M25 33 L21 41 L26 40 L22 47" stroke={H} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* wind gust */}
      <path d="M8 30 H18" stroke={H} strokeWidth={1.3} strokeLinecap="round" opacity={0.6} />
      <path d="M6 26 H14" stroke={H} strokeWidth={1.3} strokeLinecap="round" opacity={0.4} />
    </>,
    className,
  );

const AnchorEmblem: React.FC<IconProps> = ({ className }) =>
  frame(
    <>
      <circle cx="24" cy="11" r="3.4" fill="none" stroke={P} strokeWidth={1.8} />
      <line x1="24" y1="14.4" x2="24" y2="38" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      <line x1="16" y1="20" x2="32" y2="20" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M11 28 A13 13 0 0 0 24 40 A13 13 0 0 0 37 28" fill="none" stroke={P} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M11 28 L8 31 M11 28 L14 31" stroke={H} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M37 28 L34 31 M37 28 L40 31" stroke={H} strokeWidth={1.5} strokeLinecap="round" />
    </>,
    className,
  );

export type TopicKey = 'navigation' | 'recht' | 'wetter' | 'seemannschaft';

export const TopicIcon: React.FC<{ topic: TopicKey; className?: string }> = ({ topic, className }) => {
  switch (topic) {
    case 'recht': return <Scales className={className} />;
    case 'wetter': return <StormCloud className={className} />;
    case 'seemannschaft': return <AnchorEmblem className={className} />;
    case 'navigation':
    default: return <CompassRose className={className} />;
  }
};
