import { useState, useMemo, useCallback } from 'react';
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

// Inner-process labels (clockwise from top: ANALYSE, UMSETZUNG, TRAINING, AUDIT)
const PROCESS_LABELS_BY_LANG: Record<string, [string, string, string, string]> = {
  de: ['ANALYSE', 'UMSETZUNG', 'TRAINING', 'AUDIT'],
  en: ['ANALYSE', 'EXECUTE',   'TRAIN',    'AUDIT'],
  fr: ['ANALYSE', 'EXÉCUTION', 'FORMATION','AUDIT'],
};

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

// Concentric radii — tightly packed, fills the canvas
const R_CORE = 92;         // central monogram tile
const R_PROCESS_IN = 132;  // inner process ring start
const R_PROCESS_OUT = 282; // inner process ring end
const R_CLUSTER_IN = 282;  // cluster ring start (shares boundary)
const R_CLUSTER_OUT = 462; // cluster ring end
const R_GUIDE = 500;       // faint outer guide circle
const R_DIAMOND = 524;     // diamond marker centre
const R_LABEL = 560;       // service label baseline radius

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
// Distribute services evenly across the outer band, then place each one at a
// fixed angle. We anchor each cluster's services around its centre.
const ALL_SERVICE_SLOTS: Array<{
  service: ServiceNode;
  cluster: Cluster;
  angleDeg: number;
}> = (() => {
  const slots: Array<{ service: ServiceNode; cluster: Cluster; angleDeg: number }> = [];
  // Services span almost the full quadrant — denser, less empty arc
  const SERVICE_SPREAD = 86;
  for (const cluster of CLUSTERS) {
    const n = cluster.services.length;
    if (n === 0) continue;
    // evenly spread across SERVICE_SPREAD around the cluster centre
    const step = n === 1 ? 0 : SERVICE_SPREAD / (n - 1);
    const start = cluster.centerDeg - (n === 1 ? 0 : SERVICE_SPREAD / 2);
    for (let i = 0; i < n; i++) {
      slots.push({
        service: cluster.services[i],
        cluster,
        angleDeg: start + i * step,
      });
    }
  }
  return slots;
})();

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const hovered = useMemo(() => {
    if (!hoveredId) return null;
    const slot = ALL_SERVICE_SLOTS.find((s) => s.service.id === hoveredId);
    if (!slot) return null;
    return { cluster: slot.cluster, service: slot.service };
  }, [hoveredId]);

  const processLabels = PROCESS_LABELS_BY_LANG[language] ?? PROCESS_LABELS_BY_LANG.en;

  // Cluster sector geometry — each cluster occupies 90° of the wheel
  const SECTOR_GAP = 1.5;

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
          viewBox={`${-HALF} ${-HALF} ${VB} ${VB}`}
          className="w-full h-full max-w-[960px] max-h-[960px]"
          style={{ filter: 'drop-shadow(0 0 28px hsl(var(--primary) / 0.18))' }}
        >
          {/* Outer guide circles */}
          <circle cx={0} cy={0} r={R_GUIDE} fill="none" stroke={GOLD} strokeOpacity={0.18} strokeWidth={0.6} />
          <circle cx={0} cy={0} r={R_GUIDE + 80} fill="none" stroke={GOLD} strokeOpacity={0.08} strokeWidth={0.5} />

          {/* === Cluster ring (mid) ============================================ */}
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
                  fontSize={38}
                  fontWeight={600}
                  letterSpacing={9}
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

          {/* === Process ring (inner) ========================================= */}
          {processLabels.map((label, i) => {
            // Process quadrants offset by 45° vs clusters so the spokes line up
            // with the cluster gaps. Order clockwise from top: ANALYSE, UMSETZUNG, TRAINING, AUDIT.
            const center = i * 90; // 0, 90, 180, 270
            const start = center - 45 + SECTOR_GAP / 2;
            const end = center + 45 - SECTOR_GAP / 2;
            const flip = center > 90 && center < 270;
            const arcId = `proc-arc-${i}`;
            return (
              <g key={`proc-${i}`}>
                <path
                  d={sectorPath(R_PROCESS_IN, R_PROCESS_OUT, start, end)}
                  fill="none"
                  stroke={GOLD}
                  strokeOpacity={0.35}
                  strokeWidth={0.8}
                  strokeDasharray="3 4"
                />
                <defs>
                  <path id={arcId} d={textArc((R_PROCESS_IN + R_PROCESS_OUT) / 2, start + 6, end - 6, flip)} />
                </defs>
                <text
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize={26}
                  fontWeight={500}
                  letterSpacing={7}
                  fill={GOLD}
                  fillOpacity={0.85}
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

          {/* Spokes between cluster sectors */}
          {[0, 90, 180, 270].map((deg) => {
            const p1 = polar(R_PROCESS_IN, deg);
            const p2 = polar(R_CLUSTER_OUT, deg);
            return (
              <line
                key={`spoke-${deg}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={GOLD}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
            );
          })}

          {/* === Service diamonds + horizontal labels ========================= */}
          {ALL_SERVICE_SLOTS.map(({ service, cluster, angleDeg }) => {
            const dPos = polar(R_DIAMOND, angleDeg);
            const lPos = polar(R_LABEL, angleDeg);
            const isHovered = hoveredId === service.id;
            const dimmed = hoveredId !== null && !isHovered;
            const label = t(service.titleKey);

            // Anchor labels horizontally based on which side of the wheel they sit
            const anchor: 'start' | 'middle' | 'end' =
              lPos.x < -8 ? 'end' : lPos.x > 8 ? 'start' : 'middle';

            // Diamond size + rotation (always upright — pointing radially outward)
            const D = 18;
            return (
              <g
                key={service.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleClick(service.id)}
                opacity={dimmed ? 0.45 : 1}
              >
                {/* Diamond marker */}
                <g transform={`translate(${dPos.x.toFixed(2)} ${dPos.y.toFixed(2)}) rotate(${angleDeg})`}>
                  <rect
                    x={-D}
                    y={-D}
                    width={D * 2}
                    height={D * 2}
                    transform="rotate(45)"
                    fill={GOLD}
                    fillOpacity={isHovered ? 0.95 : 0.12}
                    stroke={GOLD}
                    strokeOpacity={isHovered ? 1 : 0.85}
                    strokeWidth={1.4}
                    style={{
                      transition: 'fill-opacity 0.2s, stroke-width 0.2s',
                      filter: isHovered ? `drop-shadow(0 0 8px ${GOLD})` : 'none',
                    }}
                  />
                </g>

                {/* Hit area */}
                <circle cx={dPos.x} cy={dPos.y} r={26} fill="transparent" />

                {/* Horizontal label — always upright, never rotated */}
                <text
                  x={lPos.x}
                  y={lPos.y}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize={24}
                  fontWeight={500}
                  letterSpacing={1}
                  fill={isHovered ? GOLD : '#e8ecf3'}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  textRendering="geometricPrecision"
                  style={{ transition: 'fill 0.2s', pointerEvents: 'none' }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* === Centre monogram ============================================= */}
          {/* Outer faint diamond ring around centre */}
          <g>
            <rect
              x={-R_PROCESS_IN + 6}
              y={-R_PROCESS_IN + 6}
              width={(R_PROCESS_IN - 6) * 2}
              height={(R_PROCESS_IN - 6) * 2}
              transform="rotate(45)"
              fill="none"
              stroke={GOLD}
              strokeOpacity={0.45}
              strokeWidth={0.8}
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
              y={-6}
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={18}
              fontWeight={600}
              fill={GOLD}
              letterSpacing={0.5}
            >
              inside-the-box
            </text>
            <text
              x={0}
              y={16}
              textAnchor="middle"
              fontFamily="'IBM Plex Mono', monospace"
              fontSize={8}
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
