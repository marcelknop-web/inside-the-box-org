import React from 'react';

/**
 * TopicScene — animated, pseudo-3D maritime scenes, one per quiz topic. Built
 * from pure SVG + CSS (perspective, layered parallax, continuous keyframe
 * motion) so it works without a WebGL/three.js dependency, stays crisp at any
 * size and matches the tech-atelier tokens (gold --primary, cyan --highlight).
 *
 *   navigation    — tilted radar dish with a sweeping beam, sonar rings, blips
 *   recht         — floating maritime law book, scales & drifting § glyphs
 *   wetter        — heeling horizon, rolling clouds, wind streaks, lightning
 *   seemannschaft — ship's helm + swinging anchor, rope, rising bubbles
 */

export type SceneTopic = 'navigation' | 'recht' | 'wetter' | 'seemannschaft';

const keyframes = `
@keyframes ts-sweep { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
@keyframes ts-ping { 0% { r: 2; opacity: .8;} 100% { r: 26; opacity: 0;} }
@keyframes ts-blip { 0%,100% { opacity: 0;} 20%,60% { opacity: 1;} }
@keyframes ts-float { 0%,100% { transform: translateY(0) rotateX(52deg) rotateZ(0deg);} 50% { transform: translateY(-3px) rotateX(52deg) rotateZ(1.5deg);} }
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

const Shell: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div className="relative w-full h-24 md:h-32 rounded-lg overflow-hidden border border-border/50"
    style={{ background: 'radial-gradient(120% 140% at 50% 0%, hsl(210 45% 12%) 0%, hsl(214 48% 8%) 55%, hsl(216 55% 5%) 100%)', perspective: '600px' }}>
    <style>{keyframes}</style>
    {/* faint grid floor */}
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
const Navigation: React.FC = () => (
  <Shell label="Navigation">
    {/* radar dish, tilted in 3D */}
    <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%,-50%)', transformStyle: 'preserve-3d' }}>
      <svg viewBox="-30 -30 60 60" className="w-28 h-28 md:w-36 md:h-36"
        style={{ animation: 'ts-float 6s ease-in-out infinite', transformOrigin: 'center' }}>
        {[10, 18, 26].map((r) => (
          <circle key={r} cx="0" cy="0" r={r} fill="none" stroke={H} strokeWidth="0.4" opacity="0.35" />
        ))}
        <line x1="-28" y1="0" x2="28" y2="0" stroke={H} strokeWidth="0.3" opacity="0.3" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke={H} strokeWidth="0.3" opacity="0.3" />
        {/* expanding sonar pings */}
        <circle cx="0" cy="0" fill="none" stroke={P} strokeWidth="0.6" style={{ animation: 'ts-ping 3s ease-out infinite' }} />
        <circle cx="0" cy="0" fill="none" stroke={P} strokeWidth="0.6" style={{ animation: 'ts-ping 3s ease-out infinite 1.5s' }} />
        {/* sweeping beam */}
        <g style={{ animation: 'ts-sweep 3.5s linear infinite', transformOrigin: 'center' }}>
          <defs>
            <linearGradient id="ts-beam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={P} stopOpacity="0.55" />
              <stop offset="100%" stopColor={P} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 0 L26 -7 A27 27 0 0 1 26 7 Z" fill="url(#ts-beam)" />
          <line x1="0" y1="0" x2="27" y2="0" stroke={P} strokeWidth="0.6" />
        </g>
        {/* blips */}
        <circle cx="12" cy="-8" r="1.3" fill={P} style={{ animation: 'ts-blip 3.5s ease-in-out infinite' }} />
        <circle cx="-14" cy="9" r="1.1" fill={H} style={{ animation: 'ts-blip 3.5s ease-in-out infinite 1.2s' }} />
        <circle cx="6" cy="16" r="1" fill={P} style={{ animation: 'ts-blip 3.5s ease-in-out infinite 2.1s' }} />
        <circle cx="0" cy="0" r="1.6" fill={P} />
      </svg>
    </div>
  </Shell>
);

/* ------------------------------------------------------------------ */
const Recht: React.FC = () => (
  <Shell label="Seerecht">
    {/* drifting paragraph glyphs */}
    {['§', '§', '§'].map((g, i) => (
      <span key={i} className="absolute font-mono font-bold text-primary/60"
        style={{ left: `${20 + i * 26}%`, top: '55%', fontSize: '14px', animation: `ts-para ${4 + i}s ease-in-out infinite ${i * 0.8}s` }}>{g}</span>
    ))}
    <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%,-52%)' }}>
      <svg viewBox="0 0 60 48" className="w-24 h-20 md:w-32 md:h-24" style={{ animation: 'ts-bob 5s ease-in-out infinite' }}>
        {/* scales */}
        <g style={{ animation: 'ts-tilt 4s ease-in-out infinite', transformOrigin: '30px 8px' }}>
          <line x1="30" y1="6" x2="30" y2="30" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="12" y1="12" x2="48" y2="12" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="30" cy="6" r="1.6" fill={P} />
          <path d="M6 15 A6 6 0 0 0 18 15 Z" fill="none" stroke={P} strokeWidth="1.1" />
          <line x1="12" y1="12" x2="12" y2="15" stroke={H} strokeWidth="0.8" />
          <path d="M42 15 A6 6 0 0 0 54 15 Z" fill="none" stroke={P} strokeWidth="1.1" />
          <line x1="48" y1="12" x2="48" y2="15" stroke={H} strokeWidth="0.8" />
        </g>
        <line x1="22" y1="30" x2="38" y2="30" stroke={P} strokeWidth="1.4" strokeLinecap="round" />
        {/* open book base */}
        <path d="M14 40 L30 36 L46 40 L30 44 Z" fill="hsl(var(--primary) / 0.18)" stroke={P} strokeWidth="1" strokeLinejoin="round" />
        <line x1="30" y1="36" x2="30" y2="44" stroke={P} strokeWidth="0.8" opacity="0.6" />
      </svg>
    </div>
  </Shell>
);

/* ------------------------------------------------------------------ */
const Wetter: React.FC = () => (
  <Shell label="Wetter & See">
    {/* heeling horizon plate */}
    <div className="absolute inset-0" style={{ animation: 'ts-tilt 7s ease-in-out infinite', transformOrigin: 'center' }}>
      <svg viewBox="0 0 120 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-2/3">
        <path d="M0 30 Q30 24 60 30 T120 30 V60 H0 Z" fill="hsl(210 60% 22% / .55)" />
        <path d="M0 38 Q30 32 60 38 T120 38 V60 H0 Z" fill="hsl(210 60% 16% / .6)" />
        <path d="M0 30 Q30 24 60 30 T120 30" fill="none" stroke={H} strokeWidth="0.6" opacity="0.5" />
      </svg>
    </div>
    {/* rolling clouds */}
    {[0, 1].map((i) => (
      <svg key={i} viewBox="0 0 40 20" className="absolute w-16 h-8 opacity-70"
        style={{ top: `${12 + i * 20}%`, animation: `ts-drift ${16 + i * 6}s linear infinite ${i * 4}s` }}>
        <path d="M6 14 A5 5 0 0 1 16 10 A4 4 0 0 1 24 12 A4 4 0 0 1 24 16 H8 A4 4 0 0 1 6 14 Z"
          fill="none" stroke={i ? H : P} strokeWidth="1" opacity={i ? 0.5 : 0.8} />
      </svg>
    ))}
    {/* wind streaks */}
    {[30, 46, 60].map((y, i) => (
      <div key={y} className="absolute h-px" style={{ top: `${y}%`, left: 0, right: 0, background: `linear-gradient(90deg, transparent, ${H}, transparent)`, opacity: 0.4, animation: `ts-drift ${5 + i}s linear infinite ${i * 0.6}s` }} />
    ))}
    {/* lightning */}
    <svg viewBox="0 0 20 40" className="absolute right-[26%] top-[18%] w-6 h-10" style={{ animation: 'ts-flash 5s linear infinite' }}>
      <path d="M11 0 L4 20 L10 20 L6 40 L18 14 L11 14 Z" fill={P} stroke={H} strokeWidth="0.5" />
    </svg>
  </Shell>
);

/* ------------------------------------------------------------------ */
const Seemannschaft: React.FC = () => (
  <Shell label="Seemannschaft">
    {/* rising bubbles */}
    {[24, 50, 72].map((x, i) => (
      <span key={x} className="absolute rounded-full border border-highlight/50"
        style={{ left: `${x}%`, bottom: '18%', width: 5 - i, height: 5 - i, animation: `ts-rise ${3 + i}s ease-in infinite ${i * 0.9}s` }} />
    ))}
    {/* helm wheel */}
    <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%,-50%)' }}>
      <svg viewBox="-24 -24 48 48" className="w-24 h-24 md:w-32 md:h-32" style={{ animation: 'ts-bob 5s ease-in-out infinite' }}>
        <g style={{ animation: 'ts-spinw 22s linear infinite', transformOrigin: 'center' }}>
          <circle r="12" fill="none" stroke={P} strokeWidth="1.6" />
          <circle r="4.5" fill="none" stroke={P} strokeWidth="1.4" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <g key={i}>
                <line x1={12 * Math.cos(a)} y1={12 * Math.sin(a)} x2={21 * Math.cos(a)} y2={21 * Math.sin(a)} stroke={P} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx={20 * Math.cos(a)} cy={20 * Math.sin(a)} r="2.4" fill="none" stroke={H} strokeWidth="1.1" />
              </g>
            );
          })}
          <circle r="1.4" fill={P} />
        </g>
      </svg>
    </div>
    {/* swinging anchor */}
    <div className="absolute right-[16%] top-0" style={{ transformOrigin: 'top center', animation: 'ts-swing 4s ease-in-out infinite' }}>
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

const TopicScene: React.FC<{ topic: SceneTopic; className?: string }> = ({ topic, className }) => {
  const Scene =
    topic === 'recht' ? Recht :
    topic === 'wetter' ? Wetter :
    topic === 'seemannschaft' ? Seemannschaft :
    Navigation;
  return (
    <div className={className}>
      <Scene />
    </div>
  );
};

export default TopicScene;
