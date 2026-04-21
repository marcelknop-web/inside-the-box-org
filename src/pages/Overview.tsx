import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden artistic overview at /overview.
 *
 * Visual metaphor: a living organism — flowing petals that bloom from a
 * pulsing core. Each cluster is a soft lobe of color; each service is a
 * rounded petal that drifts on its own micro-orbit. Hovering swells the
 * petal and softens its neighbors. Click navigates to that service.
 *
 * No rigid sectors. Curves everywhere. Type breathes around the form.
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

// ── Geometry ───────────────────────────────────────────────────────────────

const VIEW = 1000;
const CENTER = VIEW / 2;
const R_CORE = 64;
const R_LOBE = 240;        // distance of cluster lobe centers from core
const LOBE_RADIUS = 195;   // size of the soft cluster blob
const R_PETAL_ORBIT = 245; // distance of petals from core
const PETAL_SIZE = 56;     // base petal radius

const pol = (cx: number, cy: number, deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

/** Build a smooth closed blob path from N points using cubic Bezier curves. */
const blobPath = (points: Array<{ x: number; y: number }>): string => {
  const n = points.length;
  if (n < 3) return '';
  const tension = 0.42; // higher = more curvy
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) * tension * 0.5;
    const cp1y = p1.y + (p2.y - p0.y) * tension * 0.5;
    const cp2x = p2.x - (p3.x - p1.x) * tension * 0.5;
    const cp2y = p2.y - (p3.y - p1.y) * tension * 0.5;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d + ' Z';
};

/** Generate a soft, slightly irregular blob centered at (cx, cy) with given mean radius. */
const softBlob = (cx: number, cy: number, meanR: number, seed: number, t: number): string => {
  const N = 18;
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * 360;
    // Multiple sine layers for organic wobble
    const wob =
      Math.sin((ang * Math.PI) / 180 * 2 + seed + t * 0.5) * 0.06 +
      Math.sin((ang * Math.PI) / 180 * 3 + seed * 1.7 + t * 0.3) * 0.04 +
      Math.sin((ang * Math.PI) / 180 * 5 + seed * 2.3) * 0.03;
    const r = meanR * (1 + wob);
    pts.push(pol(cx, cy, ang, r));
  }
  return blobPath(pts);
};

// ── Layout ─────────────────────────────────────────────────────────────────

type ClusterLayout = {
  cluster: Cluster;
  angle: number;            // angle of lobe center
  cx: number;
  cy: number;
  seed: number;
  petals: Array<{
    node: ServiceNode;
    angle: number;          // absolute angle from CENTER
    cx: number;
    cy: number;
    seed: number;
    orbitPhase: number;
    orbitAmp: number;
  }>;
};

const layoutOrganism = (clusters: Cluster[]): ClusterLayout[] => {
  const N = clusters.length;
  return clusters.map((cluster, i) => {
    const angle = (i / N) * 360;
    const lobe = pol(CENTER, CENTER, angle, R_LOBE);
    const sCount = cluster.services.length;
    // spread petals across an arc of ~75deg around the lobe direction
    const span = 78;
    const start = angle - span / 2;
    const step = sCount > 1 ? span / (sCount - 1) : 0;
    const petals = cluster.services.map((node, j) => {
      const a = sCount === 1 ? angle : start + j * step;
      const p = pol(CENTER, CENTER, a, R_PETAL_ORBIT);
      return {
        node,
        angle: a,
        cx: p.x,
        cy: p.y,
        seed: i * 13 + j * 7 + 1.3,
        orbitPhase: (i * 1.7 + j * 0.9) % (Math.PI * 2),
        orbitAmp: 4 + (j % 2) * 3,
      };
    });
    return {
      cluster,
      angle,
      cx: lobe.x,
      cy: lobe.y,
      seed: i * 11 + 0.7,
      petals,
    };
  });
};

// ── Component ──────────────────────────────────────────────────────────────

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  const rafRef = useRef<number>(0);

  const layout = useMemo(() => layoutOrganism(CLUSTERS), []);

  const hoveredInfo = useMemo(() => {
    if (!hoveredId) return null;
    if (hoveredId.startsWith('lobe:')) {
      const id = hoveredId.slice(5);
      const cl = layout.find((l) => l.cluster.id === id);
      if (!cl) return null;
      return { type: 'cluster' as const, cluster: cl, petal: null };
    }
    for (const cl of layout) {
      const p = cl.petals.find((p) => p.node.id === hoveredId);
      if (p) return { type: 'service' as const, cluster: cl, petal: p };
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

  // Continuous animation clock — drives breathing + petal drift
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => t + dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback(
    (id: string) => navigate(`/${id}`),
    [navigate]
  );

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative">
      <PageMeta
        title="Mandala"
        description="A living mandala of cybersecurity services from inside-the-box.org."
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
            'radial-gradient(ellipse at 50% 50%, hsl(var(--primary) / 0.14) 0%, hsl(var(--background)) 65%), radial-gradient(circle at 75% 25%, hsl(var(--highlight) / 0.10), transparent 55%), radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.06), transparent 50%)',
        }}
      />

      {/* The organism */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-[min(100vh,100vw)] max-h-[min(100vh,100vw)]"
          style={{
            transform: `translate3d(${parallax.x * -14}px, ${parallax.y * -14}px, 0)`,
            transition: 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
              <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lobePrimary" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
            </radialGradient>
            <radialGradient id="lobeHighlight" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="hsl(var(--highlight))" stopOpacity="0.55" />
              <stop offset="60%" stopColor="hsl(var(--highlight))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--highlight))" stopOpacity="0.02" />
            </radialGradient>
            <radialGradient id="petalPrimary" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            </radialGradient>
            <radialGradient id="petalHighlight" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="hsl(var(--highlight))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--highlight))" stopOpacity="0.55" />
            </radialGradient>
            <filter id="softBloom" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="goo" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" in="SourceGraphic" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>

          {/* Diffuse outer aura */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R_LOBE + LOBE_RADIUS * 0.7}
            fill="url(#coreGlow)"
            opacity={0.4}
          />

          {/* CLUSTER LOBES — soft, breathing blobs that gooify with petals */}
          <g style={{ filter: 'url(#goo)' }}>
            {layout.map((cl) => {
              const isHovered = hoveredId === `lobe:${cl.cluster.id}`;
              const containsHovered = hoveredInfo?.cluster.cluster.id === cl.cluster.id;
              const dimmed = hoveredId !== null && !containsHovered;
              const grad = cl.cluster.tone === 'primary' ? 'url(#lobePrimary)' : 'url(#lobeHighlight)';
              // breathing scale
              const breathe = 1 + Math.sin(time * 0.6 + cl.seed) * 0.04;
              const opacity = dimmed ? 0.25 : isHovered ? 1 : 0.85;
              return (
                <g key={`lobe-${cl.cluster.id}`} style={{ transition: 'opacity 0.5s ease' }} opacity={opacity}>
                  <path
                    d={softBlob(cl.cx, cl.cy, LOBE_RADIUS * breathe, cl.seed, time)}
                    fill={grad}
                    onMouseEnter={() => setHoveredId(`lobe:${cl.cluster.id}`)}
                    onMouseLeave={() =>
                      setHoveredId((c) => (c === `lobe:${cl.cluster.id}` ? null : c))
                    }
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              );
            })}

            {/* Core blob inside the goo so everything melds */}
            <path
              d={softBlob(CENTER, CENTER, R_CORE * (1 + Math.sin(time * 1.2) * 0.05), 0, time)}
              fill="hsl(var(--primary))"
              opacity={0.85}
            />
          </g>

          {/* PETALS — drift slightly on individual orbits */}
          {layout.map((cl) =>
            cl.petals.map((p) => {
              const isHovered = hoveredId === p.node.id;
              const containsHovered = hoveredInfo?.cluster.cluster.id === cl.cluster.id;
              const dimmed = hoveredId !== null && !isHovered && !containsHovered;
              // orbit drift along petal's angle (tangential motion)
              const tangent = p.angle + 90;
              const drift = Math.sin(time * 0.45 + p.orbitPhase) * p.orbitAmp;
              const breath = 1 + Math.sin(time * 0.9 + p.seed) * 0.05;
              const dx = Math.cos(((tangent - 90) * Math.PI) / 180) * drift;
              const dy = Math.sin(((tangent - 90) * Math.PI) / 180) * drift;
              const radialPush = isHovered ? 22 : 0;
              const radDx = Math.cos(((p.angle - 90) * Math.PI) / 180) * radialPush;
              const radDy = Math.sin(((p.angle - 90) * Math.PI) / 180) * radialPush;
              const px = p.cx + dx + radDx;
              const py = p.cy + dy + radDy;
              const r = PETAL_SIZE * (isHovered ? 1.25 : breath);
              const grad = cl.cluster.tone === 'primary' ? 'url(#petalPrimary)' : 'url(#petalHighlight)';
              const tone = cl.cluster.tone === 'primary' ? 'var(--primary)' : 'var(--highlight)';
              return (
                <g
                  key={`petal-${p.node.id}`}
                  style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}
                  opacity={dimmed ? 0.3 : 1}
                  onMouseEnter={() => setHoveredId(p.node.id)}
                  onMouseLeave={() => setHoveredId((c) => (c === p.node.id ? null : c))}
                  onClick={() => handleClick(p.node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClick(p.node.id);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={t(p.node.titleKey)}
                >
                  {/* soft outer halo on hover */}
                  {isHovered && (
                    <circle
                      cx={px}
                      cy={py}
                      r={r * 1.6}
                      fill={`hsl(${tone} / 0.18)`}
                      filter="url(#softBloom)"
                    />
                  )}
                  <path
                    d={softBlob(px, py, r, p.seed, time)}
                    fill={grad}
                    stroke={isHovered ? `hsl(${tone})` : 'none'}
                    strokeWidth={isHovered ? 1 : 0}
                    style={{ transition: 'stroke-width 0.3s ease' }}
                  />
                  {/* tiny inner highlight dot — gives each petal a 'pearl' look */}
                  <circle
                    cx={px - r * 0.25}
                    cy={py - r * 0.3}
                    r={r * 0.12}
                    fill="hsl(var(--background))"
                    opacity={0.35}
                  />
                </g>
              );
            })
          )}

          {/* Hairline filaments from core to each petal — only on hover, very faint otherwise */}
          {layout.map((cl) =>
            cl.petals.map((p) => {
              const isHovered = hoveredId === p.node.id;
              const containsHovered = hoveredInfo?.cluster.cluster.id === cl.cluster.id;
              const opacity = isHovered ? 0.55 : containsHovered ? 0.22 : 0.08;
              const tone = cl.cluster.tone === 'primary' ? 'var(--primary)' : 'var(--highlight)';
              // gentle curve via quadratic
              const mid = pol(CENTER, CENTER, p.angle, R_LOBE * 0.55);
              return (
                <path
                  key={`fil-${p.node.id}`}
                  d={`M ${CENTER} ${CENTER} Q ${mid.x} ${mid.y} ${p.cx} ${p.cy}`}
                  fill="none"
                  stroke={`hsl(${tone})`}
                  strokeWidth={isHovered ? 1.2 : 0.6}
                  opacity={opacity}
                  style={{ transition: 'all 0.4s ease', pointerEvents: 'none' }}
                />
              );
            })
          )}

          {/* Core ring (decorative, above goo) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R_CORE + 14}
            fill="none"
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth="0.6"
            strokeDasharray="2 6"
          />

          {/* Center label */}
          <g style={{ pointerEvents: 'none' }}>
            {hoveredInfo?.petal ? (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 6}
                  textAnchor="middle"
                  fontSize="8"
                  letterSpacing="3"
                  className="font-mono"
                  fill="hsl(var(--background))"
                  opacity="0.9"
                >
                  {t(hoveredInfo.cluster.cluster.groupKey).toUpperCase()}
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 12}
                  textAnchor="middle"
                  fontSize="10"
                  className="font-mono"
                  fill="hsl(var(--background))"
                >
                  {trimForCore(t(hoveredInfo.petal.node.titleKey))}
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
                fill="hsl(var(--background))"
              >
                {t(hoveredInfo.cluster.cluster.groupKey).toUpperCase()}
              </text>
            ) : (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 2}
                  textAnchor="middle"
                  fontSize="8"
                  letterSpacing="4"
                  className="font-mono"
                  fill="hsl(var(--background))"
                  opacity="0.95"
                >
                  INSIDE-THE-BOX
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 13}
                  textAnchor="middle"
                  fontSize="7"
                  letterSpacing="3"
                  className="font-mono"
                  fill="hsl(var(--background))"
                  opacity="0.7"
                >
                  13 · 4
                </text>
              </>
            )}
          </g>
        </svg>

        {/* Description strip */}
        <DescriptionLayer
          title={
            hoveredInfo?.petal
              ? t(hoveredInfo.petal.node.titleKey)
              : hoveredInfo?.type === 'cluster'
              ? t(hoveredInfo.cluster.cluster.groupKey)
              : t('overview.title' as never)
          }
          desc={
            hoveredInfo?.petal
              ? t(hoveredInfo.petal.node.descKey)
              : hoveredInfo?.type === 'cluster'
              ? `${hoveredInfo.cluster.cluster.services.length} ${pluralize(language)}`
              : t('overview.subtitle' as never) || 'Hover to bloom · Click to enter'
          }
          isService={!!hoveredInfo?.petal}
        />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

function trimForCore(label: string): string {
  const cut = label.split(/[,—–]/)[0].trim();
  return cut.length > 22 ? cut.slice(0, 20).trim() + '…' : cut;
}

function pluralize(lang: string): string {
  if (lang === 'de') return 'Vertiefungen';
  if (lang === 'fr') return 'approfondissements';
  return 'depths';
}

export default Overview;
