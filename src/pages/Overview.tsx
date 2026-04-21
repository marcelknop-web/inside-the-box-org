import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden artistic constellation of the entire service offering.
 * Route: /overview — not linked from the main navigation.
 *
 * Visual metaphor: a star map. Four cluster-suns anchor the composition,
 * each surrounded by orbiting service-stars. Thin filaments connect them.
 * The whole canvas breathes (subtle pulse + parallax on cursor). Hover a
 * star to reveal its name and a one-line description directly in the
 * canvas. Click navigates straight to the service page (no detail sheet).
 */

type Node = {
  id: string;
  titleKey: string;
  descKey: string;
  /** Polar angle (deg) within the cluster orbit. */
  angle: number;
  /** Orbit radius from cluster center in viewBox units. */
  radius: number;
};

type Cluster = {
  id: string;
  groupKey: string;
  /** Cluster center in viewBox coords (0..1000 x, 0..700 y). */
  cx: number;
  cy: number;
  /** Hue rotation hint for the sun glow (uses primary or highlight tokens via CSS vars). */
  tone: 'primary' | 'highlight';
  nodes: Node[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    cx: 270,
    cy: 220,
    tone: 'primary',
    nodes: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle', descKey: 'consulting.crisisDesc', angle: -110, radius: 130 },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc', angle: -25,  radius: 145 },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    descKey: 'consulting.arenaDesc',    angle: 70,   radius: 120 },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    cx: 760,
    cy: 200,
    tone: 'highlight',
    nodes: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  descKey: 'consulting.nis2Desc',  angle: -130, radius: 140 },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       descKey: 'consulting.crisisDesc', angle: -40,  radius: 155 },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  descKey: 'consulting.ismsDesc',  angle: 50,   radius: 130 },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', descKey: 'consulting.tisaxDesc', angle: 140,  radius: 145 },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    cx: 250,
    cy: 530,
    tone: 'primary',
    nodes: [
      { id: 'virtual-ciso',          titleKey: 'consulting.vcisoTitle',  descKey: 'consulting.vcisoDesc',  angle: -150, radius: 135 },
      { id: 'assessments-concepts',  titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc', angle: -30,  radius: 130 },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    cx: 770,
    cy: 540,
    tone: 'highlight',
    nodes: [
      { id: 'publications',      titleKey: 'consulting.pubTitle',         descKey: 'consulting.pubDesc',         angle: -135, radius: 135 },
      { id: 'events-workshops',  titleKey: 'consulting.eventsTitle',      descKey: 'consulting.eventsDesc',      angle: -30,  radius: 145 },
      { id: 'ai-workflows',      titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc', angle: 90,   radius: 130 },
    ],
  },
];

// Cross-cluster filaments: thematic bridges across the map.
// Each pair is [serviceId, serviceId]; rendered as faint curves.
const BRIDGES: Array<[string, string]> = [
  ['nis2-dora', 'cyber-crisis-management'],
  ['nis2-dora', 'isms'],
  ['isms', 'assessments-concepts'],
  ['virtual-ciso', 'isms'],
  ['cyber-crisis-management', 'incident-management'],
  ['incident-management', 'arena-training'],
  ['dora-nis2-ttx', 'cyber-crisis-management'],
  ['ai-workflows', 'incident-management'],
  ['publications', 'events-workshops'],
  ['assessments-concepts', 'tisax-pci-dss'],
];

// ── Geometry helpers ────────────────────────────────────────────────────────

const polar = (cx: number, cy: number, angleDeg: number, r: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

type Positioned = Node & { x: number; y: number; clusterId: string };

const positionAll = (clusters: Cluster[]): Positioned[] =>
  clusters.flatMap((c) =>
    c.nodes.map((n) => ({ ...n, ...polar(c.cx, c.cy, n.angle, n.radius), clusterId: c.id }))
  );

// ── Component ───────────────────────────────────────────────────────────────

const VIEW_W = 1000;
const VIEW_H = 700;

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const positioned = useMemo(() => positionAll(CLUSTERS), []);
  const byId = useMemo(() => Object.fromEntries(positioned.map((p) => [p.id, p])), [positioned]);
  const clusterById = useMemo(() => Object.fromEntries(CLUSTERS.map((c) => [c.id, c])), []);

  const hoveredNode = hoveredId ? byId[hoveredId] : null;
  const hoveredCluster = hoveredNode ? clusterById[hoveredNode.clusterId] : null;

  // Mouse parallax — subtle, responsive
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = (e.clientX / w - 0.5) * 2; // -1..1
      const ny = (e.clientY / h - 0.5) * 2;
      setParallax({ x: nx, y: ny });
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const handleNavigate = useCallback(
    (id: string) => navigate(`/${id}`),
    [navigate]
  );

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden">
      <PageMeta
        title="Constellation"
        description="A constellation of cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar — minimal, almost invisible */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
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

      {/* The canvas fills the viewport */}
      <div className="relative w-full h-screen">
        {/* Cosmic background dust */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 30%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(ellipse at 75% 70%, hsl(var(--highlight) / 0.06), transparent 60%)',
          }}
        />
        <StarDust />

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate3d(${parallax.x * -8}px, ${parallax.y * -8}px, 0)`,
            transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)',
          }}
        >
          <defs>
            <radialGradient id="sunGlowPrimary" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sunGlowHighlight" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--highlight))" stopOpacity="0.5" />
              <stop offset="60%" stopColor="hsl(var(--highlight))" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(var(--highlight))" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
              <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cross-cluster bridges — drawn first, dimmest */}
          <g>
            {BRIDGES.map(([a, b], i) => {
              const pa = byId[a];
              const pb = byId[b];
              if (!pa || !pb) return null;
              const involved = hoveredId === a || hoveredId === b;
              const dimmed = hoveredId !== null && !involved;
              const mx = (pa.x + pb.x) / 2;
              const my = (pa.y + pb.y) / 2 - 30;
              return (
                <path
                  key={i}
                  d={`M ${pa.x} ${pa.y} Q ${mx} ${my} ${pb.x} ${pb.y}`}
                  fill="none"
                  stroke={involved ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
                  strokeWidth={involved ? 0.8 : 0.4}
                  strokeOpacity={dimmed ? 0.04 : involved ? 0.55 : 0.12}
                  strokeDasharray={involved ? '0' : '2 4'}
                  style={{ transition: 'all 0.4s ease' }}
                />
              );
            })}
          </g>

          {/* Suns + orbital lines + stars per cluster */}
          {CLUSTERS.map((cluster) => {
            const clusterHovered = hoveredNode?.clusterId === cluster.id;
            const otherHovered = hoveredId !== null && !clusterHovered;
            return (
              <g key={cluster.id}>
                {/* Sun glow */}
                <circle
                  cx={cluster.cx}
                  cy={cluster.cy}
                  r={170}
                  fill={`url(#sunGlow${cluster.tone === 'primary' ? 'Primary' : 'Highlight'})`}
                  opacity={otherHovered ? 0.35 : 1}
                  style={{ transition: 'opacity 0.6s ease' }}
                  className="animate-pulse-slow"
                />
                {/* Spokes from sun to each star */}
                {cluster.nodes.map((n) => {
                  const p = polar(cluster.cx, cluster.cy, n.angle, n.radius);
                  const isHovered = hoveredId === n.id;
                  return (
                    <line
                      key={`spoke-${n.id}`}
                      x1={cluster.cx}
                      y1={cluster.cy}
                      x2={p.x}
                      y2={p.y}
                      stroke={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
                      strokeWidth={isHovered ? 0.9 : 0.5}
                      strokeOpacity={otherHovered && !isHovered ? 0.06 : isHovered ? 0.65 : 0.18}
                      style={{ transition: 'all 0.35s ease' }}
                    />
                  );
                })}
                {/* Sun core */}
                <circle
                  cx={cluster.cx}
                  cy={cluster.cy}
                  r={6}
                  fill={cluster.tone === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--highlight))'}
                  opacity={0.9}
                  filter="url(#softGlow)"
                />
                {/* Sun label */}
                <text
                  x={cluster.cx}
                  y={cluster.cy + 200}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="9"
                  letterSpacing="3"
                  fill="hsl(var(--muted-foreground))"
                  opacity={otherHovered ? 0.3 : 0.7}
                  style={{ transition: 'opacity 0.4s ease' }}
                >
                  {t(cluster.groupKey).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Stars (interactive) — drawn last so they sit on top */}
          {positioned.map((p) => {
            const isHovered = hoveredId === p.id;
            const isOtherHovered = hoveredId !== null && !isHovered;
            return (
              <g
                key={p.id}
                style={{ cursor: 'pointer', transition: 'opacity 0.35s ease' }}
                opacity={isOtherHovered ? 0.35 : 1}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId((cur) => (cur === p.id ? null : cur))}
                onClick={() => handleNavigate(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNavigate(p.id);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={t(p.titleKey)}
              >
                {/* halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 22 : 14}
                  fill="url(#starGlow)"
                  opacity={isHovered ? 0.9 : 0.55}
                  style={{ transition: 'all 0.3s ease' }}
                  className={isHovered ? '' : 'animate-pulse-slow'}
                />
                {/* invisible larger hit target */}
                <circle cx={p.x} cy={p.y} r={28} fill="transparent" />
                {/* core */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : 2.6}
                  fill="hsl(var(--foreground))"
                  style={{ transition: 'r 0.3s ease' }}
                />
                {/* short label always visible, faint */}
                <text
                  x={p.x}
                  y={p.y + (p.y > 350 ? 40 : -22)}
                  textAnchor="middle"
                  fontSize="11"
                  fill="hsl(var(--foreground))"
                  opacity={isHovered ? 1 : 0.55}
                  style={{ transition: 'opacity 0.3s ease', pointerEvents: 'none' }}
                  className="font-mono"
                >
                  {shortLabel(t(p.titleKey))}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Reveal layer — bottom-anchored typographic gesture */}
        <RevealLayer
          title={hoveredNode ? t(hoveredNode.titleKey) : t('overview.title' as never)}
          desc={
            hoveredNode
              ? t(hoveredNode.descKey)
              : (t('overview.subtitle' as never) || 'Hover a star · Click to enter')
          }
          cluster={hoveredCluster ? t(hoveredCluster.groupKey) : ''}
          isHover={!!hoveredNode}
        />

        {/* Foot signature */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground/50">
            CONSTELLATION · 13 SERVICES
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

/** Drift-twinkling background dots, purely decorative. */
const StarDust = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: Math.random() * 1.4 + 0.3,
        d: Math.random() * 5 + 4,
        o: Math.random() * 0.5 + 0.15,
        delay: Math.random() * 5,
        key: i,
      })),
    []
  );
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <span
          key={d.key}
          className="absolute rounded-full bg-foreground"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.s}px`,
            height: `${d.s}px`,
            opacity: d.o,
            animation: `twinkle ${d.d}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%   { opacity: 0.1; transform: scale(0.8); }
          100% { opacity: 0.85; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

interface RevealLayerProps {
  title: string;
  desc: string;
  cluster: string;
  isHover: boolean;
}

const RevealLayer = ({ title, desc, cluster, isHover }: RevealLayerProps) => (
  <div
    className="absolute left-0 right-0 bottom-16 px-6 pointer-events-none"
    aria-live="polite"
  >
    <div className="max-w-3xl mx-auto text-center">
      <p
        className="font-mono text-[10px] tracking-[0.4em] text-primary mb-3 transition-opacity duration-300"
        style={{ opacity: isHover ? 1 : 0.5 }}
      >
        {isHover ? cluster.toUpperCase() : 'INSIDE-THE-BOX · CONSTELLATION'}
      </p>
      <h1
        key={title}
        className="font-mono text-2xl sm:text-4xl md:text-5xl font-light leading-tight mb-3 animate-fade-in"
        style={{ letterSpacing: '-0.01em' }}
      >
        {title}
      </h1>
      <p
        key={desc}
        className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto animate-fade-in"
      >
        {desc}
      </p>
      {isHover && (
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary/70 mt-5 animate-fade-in">
          → CLICK TO ENTER
        </p>
      )}
    </div>
  </div>
);

// Strip prefixes / shorten long titles for in-canvas labels.
function shortLabel(label: string): string {
  // Take everything before first comma or em-dash; cap length.
  const cut = label.split(/[,—–]/)[0].trim();
  return cut.length > 26 ? cut.slice(0, 24).trim() + '…' : cut;
}

export default Overview;
