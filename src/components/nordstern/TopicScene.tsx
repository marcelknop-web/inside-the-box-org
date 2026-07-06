import React, { useMemo } from 'react';

/**
 * TopicScene — animated, pseudo-3D maritime scenes, one per quiz topic. Built
 * from pure SVG + CSS (perspective, layered parallax, continuous keyframe
 * motion) so it works without a WebGL/three.js dependency, stays crisp at any
 * size and matches the tech-atelier tokens (gold --primary, cyan --highlight).
 *
 * Each scene is additionally varied by a deterministic `seed` derived from the
 * concrete question text: the same question always renders the same variant,
 * but different questions differ in element counts, positions, tempo, tilt,
 * accent mix and secondary motifs. So two navigation questions never look
 * identical even though they share the radar motif.
 *
 *   navigation    — tilted radar dish with a sweeping beam, sonar rings, blips
 *   recht         — floating maritime law book, scales & drifting § glyphs
 *   wetter        — heeling horizon, rolling clouds, wind streaks, lightning
 *   seemannschaft — ship's helm + swinging anchor, rope, rising bubbles
 */

export type SceneTopic = 'navigation' | 'recht' | 'wetter' | 'seemannschaft';

/** FNV-1a string hash → unsigned 32-bit seed. */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) with helpers. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    pick: <T,>(arr: T[]) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
  };
}

const keyframes = `
@keyframes ts-sweep { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
@keyframes ts-sweepr { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
@keyframes ts-ping { 0% { r: 2; opacity: .8;} 100% { r: 26; opacity: 0;} }
@keyframes ts-blip { 0%,100% { opacity: 0;} 20%,60% { opacity: 1;} }
@keyframes ts-float { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-3px);} }
@keyframes ts-tilt { 0%,100% { transform: rotate(-2.2deg);} 50% { transform: rotate(2.2deg);} }
@keyframes ts-drift { 0% { transform: translateX(-8%);} 100% { transform: translateX(108%);} }
@keyframes ts-flash { 0%,92%,100% { opacity: 0;} 94%,97% { opacity: .9;} }
@keyframes ts-swing { 0%,100% { transform: rotate(-9deg);} 50% { transform: rotate(9deg);} }
@keyframes ts-spinw { from { transform: rotate(0);} to { transform: rotate(360deg);} }
@keyframes ts-rise { 0% { transform: translateY(6px); opacity: 0;} 30% { opacity: .7;} 100% { transform: translateY(-30px); opacity: 0;} }
@keyframes ts-para { 0% { transform: translateY(4px) rotate(-6deg); opacity: 0;} 25%,70% { opacity: .8;} 100% { transform: translateY(-16px) rotate(6deg); opacity: 0;} }
@keyframes ts-bob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-2.5px);} }
`;

const P = 'hsl(var(--primary))';
const H = 'hsl(var(--highlight))';

type Rng = ReturnType<typeof makeRng>;

const Shell: React.FC<{ children: React.ReactNode; label: string; hue: number }> = ({ children, label, hue }) => (
  <div className="relative w-full h-24 md:h-32 rounded-lg overflow-hidden border border-border/50"
    style={{ background: `radial-gradient(120% 140% at 50% 0%, hsl(${hue} 45% 12%) 0%, hsl(${hue} 48% 8%) 55%, hsl(216 55% 5%) 100%)`, perspective: '600px' }}>
    <style>{keyframes}</style>
    <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(${H} 1px, transparent 1px), linear-gradient(90deg, ${H} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
        transform: 'rotateX(62deg) translateY(30%) scale(1.6)',
        transformOrigin: 'center bottom',
        maskImage: 'linear-gradient(to top, black, transparent 75%)',
        WebkitMaskImage: 'linear-gradient(to top, black, transparent 75%)',
      }} />
    {children}
    <div className="absolute bottom-1.5 left-2.5 text-[9px] font-mono uppercase tracking-[0.2em] text-primary/70 select-none">{label}</div>
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(120% 100% at 50% 40%, transparent 55%, hsl(216 60% 3% / .8) 100%)' }} />
  </div>
);

/* ------------------------------------------------------------------ */
const Navigation: React.FC<{ rng: Rng }> = ({ rng }) => {
  const sweepDur = rng.range(3, 5).toFixed(2);
  const sweepDir = rng.bool() ? 'ts-sweep' : 'ts-sweepr';
  const rings = rng.int(2, 3);
  const blips = useMemo(
    () => Array.from({ length: rng.int(2, 4) }).map(() => ({
      x: rng.range(-16, 16), y: rng.range(-16, 16),
      r: rng.range(0.9, 1.6), c: rng.bool(0.6) ? P : H, d: rng.range(0, 3).toFixed(2),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const dishX = rng.range(-14, 14);
  return (
    <Shell label="Navigation" hue={rng.int(206, 216)}>
      <div className="absolute top-1/2" style={{ left: `calc(50% + ${dishX}px)`, transform: 'translate(-50%,-50%)' }}>
        <svg viewBox="-30 -30 60 60" className="w-28 h-28 md:w-36 md:h-36"
          style={{ animation: `ts-float ${rng.range(5, 7).toFixed(2)}s ease-in-out infinite` }}>
          {Array.from({ length: rings }).map((_, i) => (
            <circle key={i} cx="0" cy="0" r={10 + i * 8} fill="none" stroke={H} strokeWidth="0.4" opacity="0.35" />
          ))}
          <line x1="-28" y1="0" x2="28" y2="0" stroke={H} strokeWidth="0.3" opacity="0.3" />
          <line x1="0" y1="-28" x2="0" y2="28" stroke={H} strokeWidth="0.3" opacity="0.3" />
          <circle cx="0" cy="0" fill="none" stroke={P} strokeWidth="0.6" style={{ animation: `ts-ping ${sweepDur}s ease-out infinite` }} />
          <circle cx="0" cy="0" fill="none" stroke={P} strokeWidth="0.6" style={{ animation: `ts-ping ${sweepDur}s ease-out infinite ${(+sweepDur / 2).toFixed(2)}s` }} />
          <g style={{ animation: `${sweepDir} ${sweepDur}s linear infinite`, transformOrigin: 'center' }}>
            <defs>
              <linearGradient id={`ts-beam-${rng.int(0, 9999)}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={P} stopOpacity="0.55" />
                <stop offset="100%" stopColor={P} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 0 L26 -7 A27 27 0 0 1 26 7 Z" fill={P} fillOpacity="0.28" />
            <line x1="0" y1="0" x2="27" y2="0" stroke={P} strokeWidth="0.6" />
          </g>
          {blips.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c}
              style={{ animation: `ts-blip ${sweepDur}s ease-in-out infinite ${b.d}s` }} />
          ))}
          <circle cx="0" cy="0" r="1.6" fill={P} />
        </svg>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
const Recht: React.FC<{ rng: Rng }> = ({ rng }) => {
  const count = rng.int(2, 4);
  const glyphs = useMemo(
    () => Array.from({ length: count }).map((_, i) => ({
      left: rng.range(12, 82), top: rng.range(45, 62),
      size: rng.range(11, 17), dur: rng.range(3.5, 5.5).toFixed(2), delay: (i * 0.7).toFixed(2),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const tiltDur = rng.range(3.4, 5).toFixed(2);
  return (
    <Shell label="Seerecht" hue={rng.int(210, 220)}>
      {glyphs.map((g, i) => (
        <span key={i} className="absolute font-mono font-bold text-primary/60"
          style={{ left: `${g.left}%`, top: `${g.top}%`, fontSize: `${g.size}px`, animation: `ts-para ${g.dur}s ease-in-out infinite ${g.delay}s` }}>§</span>
      ))}
      <div className="absolute top-1/2" style={{ left: `calc(50% + ${rng.range(-10, 10).toFixed(0)}px)`, transform: 'translate(-50%,-52%)' }}>
        <svg viewBox="0 0 60 48" className="w-24 h-20 md:w-32 md:h-24" style={{ animation: `ts-bob ${rng.range(4.5, 6).toFixed(2)}s ease-in-out infinite` }}>
          <g style={{ animation: `ts-tilt ${tiltDur}s ease-in-out infinite`, transformOrigin: '30px 8px' }}>
            <line x1="30" y1="6" x2="30" y2="30" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="12" y1="12" x2="48" y2="12" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="30" cy="6" r="1.6" fill={P} />
            <path d="M6 15 A6 6 0 0 0 18 15 Z" fill="none" stroke={P} strokeWidth="1.1" />
            <line x1="12" y1="12" x2="12" y2="15" stroke={H} strokeWidth="0.8" />
            <path d="M42 15 A6 6 0 0 0 54 15 Z" fill="none" stroke={P} strokeWidth="1.1" />
            <line x1="48" y1="12" x2="48" y2="15" stroke={H} strokeWidth="0.8" />
          </g>
          <line x1="22" y1="30" x2="38" y2="30" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M14 40 L30 36 L46 40 L30 44 Z" fill="hsl(var(--primary) / 0.18)" stroke={P} strokeWidth="1" strokeLinejoin="round" />
          <line x1="30" y1="36" x2="30" y2="44" stroke={P} strokeWidth="0.8" opacity="0.6" />
        </svg>
      </div>
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
const Wetter: React.FC<{ rng: Rng }> = ({ rng }) => {
  const tiltDur = rng.range(6, 9).toFixed(2);
  const cloudCount = rng.int(1, 3);
  const clouds = useMemo(
    () => Array.from({ length: cloudCount }).map((_, i) => ({
      top: rng.range(8, 34), dur: rng.range(14, 24).toFixed(2), delay: (i * 3.5).toFixed(2), accent: rng.bool(),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const streaks = useMemo(() => Array.from({ length: rng.int(2, 4) }).map(() => rng.range(28, 62)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const storm = rng.bool(0.7);
  const boltX = rng.range(18, 74);
  return (
    <Shell label="Wetter & See" hue={rng.int(205, 214)}>
      <div className="absolute inset-0" style={{ animation: `ts-tilt ${tiltDur}s ease-in-out infinite`, transformOrigin: 'center' }}>
        <svg viewBox="0 0 120 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-2/3">
          <path d="M0 30 Q30 24 60 30 T120 30 V60 H0 Z" fill="hsl(210 60% 22% / .55)" />
          <path d="M0 38 Q30 32 60 38 T120 38 V60 H0 Z" fill="hsl(210 60% 16% / .6)" />
          <path d="M0 30 Q30 24 60 30 T120 30" fill="none" stroke={H} strokeWidth="0.6" opacity="0.5" />
        </svg>
      </div>
      {clouds.map((c, i) => (
        <svg key={i} viewBox="0 0 40 20" className="absolute w-16 h-8 opacity-70"
          style={{ top: `${c.top}%`, animation: `ts-drift ${c.dur}s linear infinite ${c.delay}s` }}>
          <path d="M6 14 A5 5 0 0 1 16 10 A4 4 0 0 1 24 12 A4 4 0 0 1 24 16 H8 A4 4 0 0 1 6 14 Z"
            fill="none" stroke={c.accent ? H : P} strokeWidth="1" opacity={c.accent ? 0.5 : 0.8} />
        </svg>
      ))}
      {streaks.map((y, i) => (
        <div key={i} className="absolute h-px" style={{ top: `${y}%`, left: 0, right: 0, background: `linear-gradient(90deg, transparent, ${H}, transparent)`, opacity: 0.4, animation: `ts-drift ${(5 + i).toFixed(1)}s linear infinite ${(i * 0.6).toFixed(2)}s` }} />
      ))}
      {storm && (
        <svg viewBox="0 0 20 40" className="absolute w-6 h-10" style={{ left: `${boltX}%`, top: `${rng.range(14, 24).toFixed(0)}%`, animation: `ts-flash ${rng.range(4, 6).toFixed(2)}s linear infinite` }}>
          <path d="M11 0 L4 20 L10 20 L6 40 L18 14 L11 14 Z" fill={P} stroke={H} strokeWidth="0.5" />
        </svg>
      )}
    </Shell>
  );
};

/* ------------------------------------------------------------------ */
const Seemannschaft: React.FC<{ rng: Rng }> = ({ rng }) => {
  const bubbles = useMemo(
    () => Array.from({ length: rng.int(2, 4) }).map((_, i) => ({
      x: rng.range(15, 82), size: rng.range(3, 6), dur: rng.range(2.6, 4.5).toFixed(2), delay: (i * 0.8).toFixed(2),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const spinDur = rng.range(16, 28).toFixed(2);
  const spinDir = rng.bool() ? 'ts-spinw' : 'ts-sweepr';
  const swingDur = rng.range(3.4, 5).toFixed(2);
  const anchorX = rng.range(10, 24);
  const wheelX = rng.range(-8, 8);
  return (
    <Shell label="Seemannschaft" hue={rng.int(210, 218)}>
      {bubbles.map((b, i) => (
        <span key={i} className="absolute rounded-full border border-highlight/50"
          style={{ left: `${b.x}%`, bottom: '18%', width: b.size, height: b.size, animation: `ts-rise ${b.dur}s ease-in infinite ${b.delay}s` }} />
      ))}
      <div className="absolute top-1/2" style={{ left: `calc(50% + ${wheelX.toFixed(0)}px)`, transform: 'translate(-50%,-50%)' }}>
        <svg viewBox="-24 -24 48 48" className="w-24 h-24 md:w-32 md:h-32" style={{ animation: `ts-bob ${rng.range(4.5, 6).toFixed(2)}s ease-in-out infinite` }}>
          <g style={{ animation: `${spinDir} ${spinDur}s linear infinite`, transformOrigin: 'center' }}>
            <circle r="12" fill="none" stroke={P} strokeWidth="1.6" />
            <circle r="4.5" fill="none" stroke={P} strokeWidth="1.4" />
            {Array.from({ length: rng.int(6, 8) }).map((_, i, a) => {
              const ang = (i / a.length) * Math.PI * 2;
              return (
                <g key={i}>
                  <line x1={12 * Math.cos(ang)} y1={12 * Math.sin(ang)} x2={21 * Math.cos(ang)} y2={21 * Math.sin(ang)} stroke={P} strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx={20 * Math.cos(ang)} cy={20 * Math.sin(ang)} r="2.4" fill="none" stroke={H} strokeWidth="1.1" />
                </g>
              );
            })}
            <circle r="1.4" fill={P} />
          </g>
        </svg>
      </div>
      <div className="absolute top-0" style={{ right: `${anchorX}%`, transformOrigin: 'top center', animation: `ts-swing ${swingDur}s ease-in-out infinite` }}>
        <div className="w-px h-6 md:h-9 mx-auto" style={{ background: `linear-gradient(${H}, transparent)` }} />
        <svg viewBox="0 0 24 30" className="w-6 h-8 -mt-0.5">
          <circle cx="12" cy="4" r="2.4" fill="none" stroke={P} strokeWidth="1.4" />
          <line x1="12" y1="6.4" x2="12" y2="26" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="7" y1="11" x2="17" y2="11" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4 19 A9 9 0 0 0 12 26 A9 9 0 0 0 20 19" fill="none" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
    </Shell>
  );
};

const TopicScene: React.FC<{ topic: SceneTopic; seed?: number | string; className?: string }> = ({ topic, seed, className }) => {
  const numericSeed = typeof seed === 'string' ? hashSeed(seed) : (seed ?? 0);
  // Re-create the RNG whenever the seed changes so variation is stable per question.
  const rng = useMemo(() => makeRng(numericSeed || 1), [numericSeed]);
  const Scene =
    topic === 'recht' ? Recht :
    topic === 'wetter' ? Wetter :
    topic === 'seemannschaft' ? Seemannschaft :
    Navigation;
  return (
    <div className={className} key={numericSeed}>
      <Scene rng={rng} />
    </div>
  );
};

export default TopicScene;
