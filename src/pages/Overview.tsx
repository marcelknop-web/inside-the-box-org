import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden mandala overview at /overview.
 *
 * Visual: a massive sun-wheel.
 *  – Outer ring: 4 colored cluster sectors (Cyber Resilience, Regulation,
 *    Governance, Insights). Each tinted Gold or Cyan.
 *  – Inner ring: every service as a wedge inside its parent cluster.
 *    Wedges are clickable and link straight to that service page.
 *  – Center: a pulsing core with the active hover label.
 *
 * Interaction: hover lifts a wedge outward (radial bloom), neighbors
 * recede slightly. Click navigates directly. The whole wheel breathes
 * and accepts subtle parallax from cursor for depth.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  descKey: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  tone: 'primary' | 'highlight';
  services: ServiceNode[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    tone: 'primary',
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle',   descKey: 'consulting.crisisDesc' },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    descKey: 'consulting.arenaDesc' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    tone: 'highlight',
    services: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  descKey: 'consulting.nis2Desc' },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       descKey: 'consulting.crisisDesc' },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  descKey: 'consulting.ismsDesc' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', descKey: 'consulting.tisaxDesc' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    tone: 'highlight',
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         descKey: 'consulting.pubDesc' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      descKey: 'consulting.eventsDesc' },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    tone: 'primary',
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  descKey: 'consulting.vcisoDesc' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
    ],
  },
];

// ── Geometry constants ─────────────────────────────────────────────────────

const VIEW = 1000;          // square viewBox
const CENTER = VIEW / 2;
const R_CORE = 72;          // central core radius
const R_INNER = 110;        // inner edge of service ring
const R_INNER_OUT = 320;    // outer edge of service ring
const R_OUTER_IN = 340;     // inner edge of cluster ring
const R_OUTER_OUT = 460;    // outer edge of cluster ring
const HOVER_BLOOM = 28;     // px the wedge pushes outward on hover
const GAP_DEG = 1.2;        // gap between wedges (degrees)

// Helper: polar to cartesian
const pt = (cx: number, cy: number, angleDeg: number, r: number) => {
  const a = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0deg points up
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

/** Build an SVG path for an annular wedge (donut slice). */
const wedgePath = (
  cx: number,
  cy: number,
  startDeg: number,
  endDeg: number,
  rIn: number,
  rOut: number
): string => {
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  const a = pt(cx, cy, startDeg, rOut);
  const b = pt(cx, cy, endDeg, rOut);
  const c = pt(cx, cy, endDeg, rIn);
  const d = pt(cx, cy, startDeg, rIn);
  return [
    `M ${a.x} ${a.y}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${d.x} ${d.y}`,
    'Z',
  ].join(' ');
};

/** Build an SVG path for a radial direction translation of a wedge — pre-baked into a transform. */
const radialTransform = (midDeg: number, distance: number): string => {
  const a = ((midDeg - 90) * Math.PI) / 180;
  const dx = Math.cos(a) * distance;
  const dy = Math.sin(a) * distance;
  return `translate(${dx}, ${dy})`;
};

/** Curved text path id helper. */
const arcPathId = (id: string) => `arc-${id}`;

/** Build an arc path used as textPath baseline. */
const arcPath = (cx: number, cy: number, startDeg: number, endDeg: number, r: number) => {
  const a = pt(cx, cy, startDeg, r);
  const b = pt(cx, cy, endDeg, r);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
};

// ── Layout: compute angles ──────────────────────────────────────────────────

type ClusterLayout = {
  cluster: Cluster;
  startDeg: number;
  endDeg: number;
  midDeg: number;
  services: Array<{
    node: ServiceNode;
    startDeg: number;
    endDeg: number;
    midDeg: number;
  }>;
};

const layoutWheel = (clusters: Cluster[]): ClusterLayout[] => {
  const total = 360;
  const per = total / clusters.length;
  return clusters.map((cluster, i) => {
    const cStart = i * per;
    const cEnd = cStart + per;
    const innerSpan = per - GAP_DEG * 2; // gap on each side
    const innerStart = cStart + GAP_DEG;
    const sCount = cluster.services.length;
    const sSpan = (innerSpan - GAP_DEG * (sCount - 1)) / sCount;
    const services = cluster.services.map((node, j) => {
      const sStart = innerStart + j * (sSpan + GAP_DEG);
      const sEnd = sStart + sSpan;
      return { node, startDeg: sStart, endDeg: sEnd, midDeg: (sStart + sEnd) / 2 };
    });
    return {
      cluster,
      startDeg: cStart,
      endDeg: cEnd,
      midDeg: (cStart + cEnd) / 2,
      services,
    };
  });
};

// ── Component ───────────────────────────────────────────────────────────────

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);

  const layout = useMemo(() => layoutWheel(CLUSTERS), []);

  // Find hovered service + its cluster (for center label)
  const hoveredInfo = useMemo(() => {
    if (!hoveredId) return null;
    if (hoveredId.startsWith('cluster:')) {
      const id = hoveredId.slice(8);
      const cl = layout.find((l) => l.cluster.id === id);
      if (!cl) return null;
      return { type: 'cluster' as const, cluster: cl, service: null };
    }
    for (const cl of layout) {
      const s = cl.services.find((s) => s.node.id === hoveredId);
      if (s) return { type: 'service' as const, cluster: cl, service: s };
    }
    return null;
  }, [hoveredId, layout]);

  // Mouse parallax
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setParallax({
        x: (e.clientX / w - 0.5) * 2,
        y: (e.clientY / h - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  // Slow auto-rotation of the whole wheel — almost imperceptible
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // pause rotation while hovering
      if (!hoveredId) setRotate((r) => (r + dt * 1.2) % 360); // 1.2 deg/s
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hoveredId]);

  const handleClick = useCallback(
    (id: string) => navigate(`/${id}`),
    [navigate]
  );

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative">
      <PageMeta
        title="Mandala"
        description="A mandala of cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-5">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
        >
          ← INSIDE-THE-BOX
        </button>
        <button
          onClick={() => setLanguage(nextLanguage(language))}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          aria-label="Language"
        >
          <Languages className="w-3 h-3" />
          {language.toUpperCase()}
        </button>
      </header>

      {/* Atmospheric backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.12) 0%, hsl(var(--background)) 60%), radial-gradient(circle at 80% 20%, hsl(var(--highlight) / 0.08), transparent 50%)',
        }}
      />

      {/* The mandala fills the viewport */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-[min(100vh,100vw)] max-h-[min(100vh,100vw)]"
          style={{
            transform: `translate3d(${parallax.x * -10}px, ${parallax.y * -10}px, 0)`,
            transition: 'transform 0.5s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ringGlowPrimary" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ringGlowHighlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--highlight))" stopOpacity="0" />
              <stop offset="70%" stopColor="hsl(var(--highlight))" stopOpacity="0.18" />
              <stop offset="100%" stopColor="hsl(var(--highlight))" stopOpacity="0" />
            </radialGradient>
            <filter id="wedgeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer atmospheric halo */}
          <circle cx={CENTER} cy={CENTER} r={R_OUTER_OUT + 60} fill="url(#ringGlowPrimary)" opacity={0.6} />

          {/* Whole wheel rotates slowly */}
          <g
            transform={`rotate(${rotate} ${CENTER} ${CENTER})`}
            style={{ transition: hoveredId ? 'transform 0.6s ease' : 'none' }}
          >
            {/* Faint guide rings */}
            <circle cx={CENTER} cy={CENTER} r={R_INNER} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
            <circle cx={CENTER} cy={CENTER} r={R_INNER_OUT} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
            <circle cx={CENTER} cy={CENTER} r={R_OUTER_OUT} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />

            {/* OUTER RING — cluster sectors */}
            {layout.map((cl) => {
              const isHovered = hoveredId === `cluster:${cl.cluster.id}`;
              const containsHovered = hoveredInfo?.cluster.cluster.id === cl.cluster.id;
              const dimmed = hoveredId !== null && !containsHovered;
              const tone = cl.cluster.tone === 'primary' ? 'var(--primary)' : 'var(--highlight)';
              const bloom = isHovered ? HOVER_BLOOM * 0.5 : 0;
              return (
                <g
                  key={`cluster-${cl.cluster.id}`}
                  transform={radialTransform(cl.midDeg, bloom)}
                  style={{ transition: 'transform 0.45s cubic-bezier(0.2,0.8,0.2,1)' }}
                >
                  <path
                    d={wedgePath(CENTER, CENTER, cl.startDeg + GAP_DEG, cl.endDeg - GAP_DEG, R_OUTER_IN, R_OUTER_OUT)}
                    fill={`hsl(${tone} / ${dimmed ? 0.18 : isHovered ? 0.95 : 0.72})`}
                    style={{ transition: 'fill 0.4s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(`cluster:${cl.cluster.id}`)}
                    onMouseLeave={() => setHoveredId((c) => (c === `cluster:${cl.cluster.id}` ? null : c))}
                  />
                  {/* Curved cluster label along inner edge of outer ring */}
                  <path
                    id={arcPathId(cl.cluster.id)}
                    d={arcPath(CENTER, CENTER, cl.startDeg + 3, cl.endDeg - 3, R_OUTER_IN + 22)}
                    fill="none"
                  />
                  <text
                    fontSize="14"
                    letterSpacing="6"
                    className="font-mono"
                    fill={`hsl(var(--background))`}
                    opacity={dimmed ? 0.4 : 0.9}
                    style={{ transition: 'opacity 0.3s ease', pointerEvents: 'none' }}
                  >
                    <textPath href={`#${arcPathId(cl.cluster.id)}`} startOffset="50%" textAnchor="middle">
                      {t(cl.cluster.groupKey).toUpperCase()}
                    </textPath>
                  </text>
                </g>
              );
            })}

            {/* INNER RING — service wedges */}
            {layout.map((cl) =>
              cl.services.map((s) => {
                const isHovered = hoveredId === s.node.id;
                const containsHovered = hoveredInfo?.cluster.cluster.id === cl.cluster.id;
                const dimmed = hoveredId !== null && !isHovered;
                const tone = cl.cluster.tone === 'primary' ? 'var(--primary)' : 'var(--highlight)';
                const bloom = isHovered ? HOVER_BLOOM : 0;
                const fillOpacity = isHovered ? 0.55 : containsHovered ? 0.32 : dimmed ? 0.08 : 0.22;
                return (
                  <g
                    key={`svc-${s.node.id}`}
                    transform={radialTransform(s.midDeg, bloom)}
                    style={{ transition: 'transform 0.45s cubic-bezier(0.2,0.8,0.2,1)', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredId(s.node.id)}
                    onMouseLeave={() => setHoveredId((c) => (c === s.node.id ? null : c))}
                    onClick={() => handleClick(s.node.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick(s.node.id);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={t(s.node.titleKey)}
                  >
                    <path
                      d={wedgePath(CENTER, CENTER, s.startDeg, s.endDeg, R_INNER, R_INNER_OUT)}
                      fill={`hsl(${tone} / ${fillOpacity})`}
                      stroke={isHovered ? `hsl(${tone})` : `hsl(${tone} / 0.4)`}
                      strokeWidth={isHovered ? 1.6 : 0.5}
                      filter={isHovered ? 'url(#wedgeGlow)' : undefined}
                      style={{ transition: 'all 0.35s ease' }}
                    />
                    {/* Curved service label along outer edge of inner ring */}
                    <path
                      id={arcPathId('s-' + s.node.id)}
                      d={arcPath(CENTER, CENTER, s.startDeg + 1, s.endDeg - 1, R_INNER_OUT - 18)}
                      fill="none"
                    />
                    <text
                      fontSize={isHovered ? 13 : 11}
                      letterSpacing="2"
                      className="font-mono"
                      fill={isHovered ? `hsl(${tone})` : 'hsl(var(--foreground))'}
                      opacity={dimmed ? 0.35 : 0.92}
                      style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
                    >
                      <textPath href={`#${arcPathId('s-' + s.node.id)}`} startOffset="50%" textAnchor="middle">
                        {shortLabel(t(s.node.titleKey)).toUpperCase()}
                      </textPath>
                    </text>
                  </g>
                );
              })
            )}

            {/* Spokes between cluster sectors — visual separators */}
            {layout.map((cl) => {
              const a = pt(CENTER, CENTER, cl.startDeg, R_INNER);
              const b = pt(CENTER, CENTER, cl.startDeg, R_OUTER_OUT);
              return (
                <line
                  key={`spoke-${cl.cluster.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="hsl(var(--background))"
                  strokeWidth="2"
                  opacity="0.9"
                />
              );
            })}
          </g>

          {/* Pulsing core (does NOT rotate) */}
          <circle cx={CENTER} cy={CENTER} r={R_CORE + 30} fill="url(#coreGlow)" className="animate-pulse-slow" />
          <circle cx={CENTER} cy={CENTER} r={R_CORE} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.95" />
          <circle cx={CENTER} cy={CENTER} r={R_CORE - 12} fill="none" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.5" />

          {/* Center label group */}
          <g style={{ pointerEvents: 'none' }}>
            {hoveredInfo?.service ? (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 8}
                  textAnchor="middle"
                  fontSize="9"
                  letterSpacing="3"
                  className="font-mono"
                  fill="hsl(var(--primary))"
                  opacity="0.9"
                >
                  {t(hoveredInfo.cluster.cluster.groupKey).toUpperCase()}
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 14}
                  textAnchor="middle"
                  fontSize="11"
                  className="font-mono"
                  fill="hsl(var(--foreground))"
                >
                  {trimForCore(t(hoveredInfo.service.node.titleKey))}
                </text>
              </>
            ) : hoveredInfo?.type === 'cluster' ? (
              <text
                x={CENTER}
                y={CENTER + 4}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="3"
                className="font-mono"
                fill="hsl(var(--primary))"
              >
                {t(hoveredInfo.cluster.cluster.groupKey).toUpperCase()}
              </text>
            ) : (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 4}
                  textAnchor="middle"
                  fontSize="9"
                  letterSpacing="4"
                  className="font-mono"
                  fill="hsl(var(--primary))"
                  opacity="0.85"
                >
                  INSIDE-THE-BOX
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 12}
                  textAnchor="middle"
                  fontSize="8"
                  letterSpacing="3"
                  className="font-mono"
                  fill="hsl(var(--muted-foreground))"
                >
                  13 SERVICES · 4 MODULES
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Description strip — large typographic gesture, bottom-anchored */}
        <DescriptionLayer
          title={
            hoveredInfo?.service
              ? t(hoveredInfo.service.node.titleKey)
              : hoveredInfo?.type === 'cluster'
              ? t(hoveredInfo.cluster.cluster.groupKey)
              : t('overview.title' as never)
          }
          desc={
            hoveredInfo?.service
              ? t(hoveredInfo.service.node.descKey)
              : hoveredInfo?.type === 'cluster'
              ? `${hoveredInfo.cluster.cluster.services.length} ${pluralize(language)}`
              : t('overview.subtitle' as never) || 'Hover to explore · Click to enter'
          }
          isService={!!hoveredInfo?.service}
        />
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface DescriptionLayerProps {
  title: string;
  desc: string;
  isService: boolean;
}

const DescriptionLayer = ({ title, desc, isService }: DescriptionLayerProps) => (
  <div
    className="absolute left-0 right-0 bottom-8 px-6 pointer-events-none z-20"
    aria-live="polite"
  >
    <div className="max-w-2xl mx-auto text-center">
      <h2
        key={title}
        className="font-mono text-xl sm:text-2xl md:text-3xl font-light leading-tight mb-2 animate-fade-in"
        style={{ letterSpacing: '-0.005em' }}
      >
        {title}
      </h2>
      <p
        key={desc}
        className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto animate-fade-in"
      >
        {desc}
      </p>
      {isService && (
        <p className="font-mono text-[10px] tracking-[0.4em] text-primary/70 mt-3 animate-fade-in">
          → CLICK TO ENTER
        </p>
      )}
    </div>
  </div>
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function shortLabel(label: string): string {
  const cut = label.split(/[,—–]/)[0].trim();
  return cut.length > 22 ? cut.slice(0, 20).trim() + '…' : cut;
}

function trimForCore(label: string): string {
  const cut = label.split(/[,—–]/)[0].trim();
  return cut.length > 24 ? cut.slice(0, 22).trim() + '…' : cut;
}

function pluralize(lang: string): string {
  if (lang === 'de') return 'Vertiefungen';
  if (lang === 'fr') return 'approfondissements';
  return 'depths';
}

export default Overview;
