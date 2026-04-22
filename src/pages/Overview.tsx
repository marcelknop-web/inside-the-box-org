import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * /overview — Speichenrad-Mandala.
 *
 *  • Innerer Ring: 4 Prozess-Phasen (ANALYSE / UMSETZUNG / TRAINING / AUDIT)
 *  • Mittlerer Ring: 4 Cluster (CYBER RESILIENCE / COMPLIANCE / GOVERNANCE / INSIGHTS)
 *  • Äußerer Ring: Service-Marker (Diamant) mit waagerechten Beschriftungen
 *
 *  Alles ist statisch, gut lesbar, ohne Rotation.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  descKey?: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  /** angle of cluster centre, in degrees (0° = top, clockwise) */
  centerDeg: number;
  /** Services rendered as diamonds around this cluster, ordered left-to-right */
  services: ServiceNode[];
};

// Cluster-Anordnung exakt wie Referenzbild:
// CYBER RESILIENCE = oben rechts, COMPLIANCE = unten rechts,
// GOVERNANCE = unten links, INSIGHTS = oben links.
const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    centerDeg: 45,
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle',   descKey: 'consulting.crisisDesc' },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    descKey: 'consulting.arenaDesc'  },
      { id: 'red-team',                titleKey: 'nav.redTeam',              descKey: undefined               },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    centerDeg: 135,
    services: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  descKey: 'consulting.nis2Desc'  },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       descKey: 'nav.ttxTrainingDesc'  },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  descKey: 'consulting.ismsDesc'  },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', descKey: 'consulting.tisaxDesc' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    centerDeg: 225,
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  descKey: 'consulting.vcisoDesc'  },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    centerDeg: 315,
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         descKey: 'consulting.pubDesc'         },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      descKey: 'consulting.eventsDesc'      },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc' },
    ],
  },
];


// Cluster labels rendered inside the wheel (uppercase, English for impact)
const CLUSTER_DISPLAY_LABEL: Record<string, string> = {
  resilience: 'CYBER RESILIENCE',
  regulation: 'COMPLIANCE',
  governance: 'GOVERNANCE',
  insights:   'INSIGHTS',
};

// === Geometry ============================================================
const VB = 1200;
const HALF = VB / 2;

// Concentric radii — services live inside the cluster quadrants
const R_CORE = 100;        // central monogram tile
const R_SERVICES_IN = 130; // inner service area starts here
const R_SERVICES_OUT = 410;// inner service area ends here
const R_CLUSTER_IN = 410;  // cluster band start
const R_CLUSTER_OUT = 560; // cluster band end (uses outer space too)

const GOLD = '#f5b800';

const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
};

// Annular sector path (inner arc + outer arc + sides)
const sectorPath = (rIn: number, rOut: number, degStart: number, degEnd: number): string => {
  const p1 = polar(rOut, degStart);
  const p2 = polar(rOut, degEnd);
  const p3 = polar(rIn, degEnd);
  const p4 = polar(rIn, degStart);
  const sweep = degEnd - degStart;
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// Centred text-on-path arc — flips so labels read left-to-right
const textArc = (r: number, degStart: number, degEnd: number, flip: boolean): string => {
  const a = flip ? degEnd : degStart;
  const b = flip ? degStart : degEnd;
  const p1 = polar(r, a);
  const p2 = polar(r, b);
  const sweep = flip ? 0 : 1;
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
};

// === Service slot positioning ============================================
// Lookup helper: find which cluster a hovered service belongs to.
const findClusterForService = (id: string): Cluster | undefined =>
  CLUSTERS.find((c) => c.services.some((s) => s.id === id));

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const hovered = useMemo(() => {
    if (!hoveredId) return null;
    const cluster = findClusterForService(hoveredId);
    if (!cluster) return null;
    const service = cluster.services.find((s) => s.id === hoveredId);
    if (!service) return null;
    return { cluster, service };
  }, [hoveredId]);

  // Cluster sector geometry — each cluster occupies 90° of the wheel
  const SECTOR_GAP = 1.5;

  // Measure rendered SVG width to scale typography against viewBox (1200u)
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [renderedWidth, setRenderedWidth] = useState(900);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setRenderedWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compensation factor: SVG scales viewBox to renderedWidth.
  // To keep labels at a constant *visible* px size, multiply font sizes by
  // (designWidth / renderedWidth) when the SVG is rendered smaller than 900px.
  // Capped at 1.9× so on very small phones we don't blow up text past the
  // available arc length.
  const comp = Math.min(1.9, Math.max(1, 900 / Math.max(renderedWidth, 1)));
  const fs = {
    cluster: 38 * comp,
    clusterTrack: 9 * comp,
    process: 26 * comp,
    processTrack: 7 * comp,
    service: 24 * comp,
    serviceTrack: 1 * comp,
    diamond: 18 * comp,
    coreTitle: 18 * comp,
    coreSub: 8 * comp,
  };

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative flex flex-col">
      <PageMeta
        title="Mandala"
        description="Service mandala of inside-the-box.org — cybersecurity consulting & training overview."
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

      {/* Hover info (bottom-left) */}
      {hovered && (
        <div
          key={hovered.service.titleKey}
          className="absolute left-6 bottom-16 z-20 pointer-events-none max-w-[360px] animate-fade-in"
        >
          <div className="font-mono text-[10px] tracking-[0.35em] mb-3 text-primary">
            {(CLUSTER_DISPLAY_LABEL[hovered.cluster.id] ?? t(hovered.cluster.groupKey)).toUpperCase()}
          </div>
          <div className="font-mono font-semibold text-xl md:text-2xl leading-[1.1] tracking-[0.04em] text-foreground mb-3">
            {t(hovered.service.titleKey)}
          </div>
          {hovered.service.descKey && (
            <p className="font-sans text-sm leading-snug text-muted-foreground">
              {t(hovered.service.descKey)}
            </p>
          )}
        </div>
      )}

      {/* Mandala */}
      <div className="relative w-full flex-1 flex items-center justify-center px-2 py-4">
        <svg
          ref={svgRef}
          viewBox={`${-HALF} ${-HALF} ${VB} ${VB}`}
          className="w-full h-full max-w-[960px] max-h-[960px]"
          style={{ filter: 'drop-shadow(0 0 28px hsl(var(--primary) / 0.18))' }}
        >
          {/* Faint outer guide circle for visual containment */}
          <circle cx={0} cy={0} r={R_CLUSTER_OUT + 18} fill="none" stroke={GOLD} strokeOpacity={0.12} strokeWidth={0.6} />
          <circle cx={0} cy={0} r={R_SERVICES_IN - 8} fill="none" stroke={GOLD} strokeOpacity={0.18} strokeWidth={0.5} />

          {/* === Cluster ring (outer band) =================================== */}
          {CLUSTERS.map((cluster) => {
            const start = cluster.centerDeg - 45 + SECTOR_GAP / 2;
            const end = cluster.centerDeg + 45 - SECTOR_GAP / 2;
            const mid = cluster.centerDeg;
            const flip = mid > 90 && mid < 270;
            const arcId = `cluster-arc-${cluster.id}`;
            const label = CLUSTER_DISPLAY_LABEL[cluster.id] ?? t(cluster.groupKey).toUpperCase();
            const isClusterHovered = hovered?.cluster.id === cluster.id;

            return (
              <g key={cluster.id}>
                <path
                  d={sectorPath(R_CLUSTER_IN, R_CLUSTER_OUT, start, end)}
                  fill={GOLD}
                  fillOpacity={isClusterHovered ? 0.18 : 0.08}
                  stroke={GOLD}
                  strokeOpacity={0.7}
                  strokeWidth={1}
                  style={{ transition: 'fill-opacity 0.25s' }}
                />
                <defs>
                  <path id={arcId} d={textArc((R_CLUSTER_IN + R_CLUSTER_OUT) / 2, start + 4, end - 4, flip)} />
                </defs>
                <text
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize={fs.cluster}
                  fontWeight={600}
                  letterSpacing={fs.clusterTrack}
                  fill={GOLD}
                  textRendering="geometricPrecision"
                  style={{ pointerEvents: 'none' }}
                >
                  <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                    {label}
                  </textPath>
                </text>
              </g>
            );
          })}

          {/* Spokes between cluster sectors (separate the inner quadrants too) */}
          {[0, 90, 180, 270].map((deg) => {
            const p1 = polar(R_SERVICES_IN, deg);
            const p2 = polar(R_CLUSTER_OUT, deg);
            return (
              <line
                key={`spoke-${deg}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={GOLD}
                strokeOpacity={0.45}
                strokeWidth={0.8}
              />
            );
          })}

          {/* === Services inside each cluster quadrant ====================== */}
          {/* Each quadrant lists its services as horizontal text rows, stacked
              vertically along the radial axis of the cluster. */}
          {CLUSTERS.map((cluster) => {
            const services = cluster.services;
            if (services.length === 0) return null;

            // Radial direction unit vector (cluster centre direction)
            const rad = ((cluster.centerDeg - 90) * Math.PI) / 180;
            const ux = Math.cos(rad);
            const uy = Math.sin(rad);
            // Perpendicular (for tangential offsets if ever needed)

            // Distribute service rows along the radial line, between
            // R_SERVICES_IN+pad and R_SERVICES_OUT-pad.
            const innerPad = 18;
            const outerPad = 18;
            const rStart = R_SERVICES_IN + innerPad;
            const rEnd = R_SERVICES_OUT - outerPad;
            const span = rEnd - rStart;
            const step = services.length === 1 ? 0 : span / (services.length - 1);

            return (
              <g key={`svc-${cluster.id}`}>
                {services.map((service, i) => {
                  const r = rStart + i * step;
                  const x = ux * r;
                  const y = uy * r;
                  const isHovered = hoveredId === service.id;
                  const dimmed = hoveredId !== null && !isHovered;
                  const label = t(service.titleKey);

                  return (
                    <g
                      key={service.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredId(service.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleClick(service.id)}
                      opacity={dimmed ? 0.4 : 1}
                    >
                      {/* Hover hit area — generous for usability */}
                      <rect
                        x={x - 140}
                        y={y - fs.service * 0.9}
                        width={280}
                        height={fs.service * 1.8}
                        fill="transparent"
                      />
                      {/* Bullet diamond preceding the label */}
                      <g transform={`translate(${(x - fs.service * 0.55).toFixed(2)} ${y.toFixed(2)}) rotate(45)`}>
                        <rect
                          x={-fs.service * 0.18}
                          y={-fs.service * 0.18}
                          width={fs.service * 0.36}
                          height={fs.service * 0.36}
                          fill={isHovered ? GOLD : 'none'}
                          stroke={GOLD}
                          strokeOpacity={isHovered ? 1 : 0.7}
                          strokeWidth={1}
                          style={{ transition: 'fill 0.2s, stroke-opacity 0.2s' }}
                        />
                      </g>
                      <text
                        x={x + fs.service * 0.1}
                        y={y}
                        fontFamily="'IBM Plex Mono', monospace"
                        fontSize={fs.service}
                        fontWeight={500}
                        letterSpacing={fs.serviceTrack}
                        fill={isHovered ? GOLD : '#e8ecf3'}
                        textAnchor="start"
                        dominantBaseline="middle"
                        textRendering="geometricPrecision"
                        style={{ transition: 'fill 0.2s', pointerEvents: 'none' }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* === Centre monogram ============================================= */}
          {/* Outer faint diamond ring around centre */}
          <g>
            <rect
              x={-R_CORE - 14}
              y={-R_CORE - 14}
              width={(R_CORE + 14) * 2}
              height={(R_CORE + 14) * 2}
              transform="rotate(45)"
              fill="none"
              stroke={GOLD}
              strokeOpacity={0.35}
              strokeWidth={0.6}
            />
            <rect
              x={-R_CORE}
              y={-R_CORE}
              width={R_CORE * 2}
              height={R_CORE * 2}
              transform="rotate(45)"
              fill="hsl(var(--background))"
              stroke={GOLD}
              strokeOpacity={0.85}
              strokeWidth={1.2}
            />
            <rect
              x={-R_CORE * 0.55}
              y={-R_CORE * 0.55}
              width={R_CORE * 1.1}
              height={R_CORE * 1.1}
              transform="rotate(45)"
              fill="none"
              stroke={GOLD}
              strokeOpacity={0.7}
              strokeWidth={0.8}
            />
            <text
              x={0}
              y={-fs.coreSub * 0.7}
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={fs.coreTitle}
              fontWeight={600}
              fill={GOLD}
              letterSpacing={0.5}
            >
              inside-the-box
            </text>
            <text
              x={0}
              y={fs.coreTitle * 0.9}
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={fs.coreSub}
              fill={GOLD}
              fillOpacity={0.7}
              letterSpacing={2.5}
            >
              PROZESSE UNTER STRESS
            </text>
          </g>
        </svg>
      </div>

      {/* Footer — copyright + contact */}
      <footer className="relative z-20 border-t border-primary/10 bg-background/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
          <span>© {new Date().getFullYear()} INSIDE-THE-BOX</span>
          <a
            href="mailto:marcel@inside-the-box.org"
            className="hover:text-primary transition-colors"
          >
            MARCEL@INSIDE-THE-BOX.ORG
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Overview;
