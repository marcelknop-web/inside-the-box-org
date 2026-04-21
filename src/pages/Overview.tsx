import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden /overview — Lotus Mandala.
 *
 * A real mandala: a central core, surrounded by concentric petal layers.
 * Each layer (cluster) gets its own colour and petal count = number of services.
 * Cluster colour + service code make every petal individually identifiable.
 *
 * Pure SVG, sanftly rotating. Works on every viewport, instantly readable
 * as a mandala, and meditative rather than gimmicky.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  code: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  code: string;
  colorVar: string; // hsl(var(--…)) usage
  hex: string;      // raw hex for SVG fills (Tailwind tokens not available there)
  services: ServiceNode[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    code: 'A',
    colorVar: 'hsl(var(--primary))',
    hex: '#f5b800', // gold — foundational
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle',   code: 'A-01' },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', code: 'A-02' },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    code: 'A-03' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    code: 'B',
    colorVar: 'hsl(var(--accent))',
    hex: '#00bcd4', // cyan
    services: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  code: 'B-01' },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       code: 'B-02' },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  code: 'B-03' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', code: 'B-04' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    code: 'C',
    colorVar: 'hsl(var(--primary))',
    hex: '#e8a200', // amber
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  code: 'C-01' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', code: 'C-02' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    code: 'D',
    colorVar: 'hsl(var(--accent))',
    hex: '#7ee0ec', // light cyan
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         code: 'D-01' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      code: 'D-02' },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', code: 'D-03' },
    ],
  },
];

// Petal radius per cluster (innermost = foundational)
const RING_RADIUS = [110, 175, 235, 300];

// Petal SVG path — a teardrop / lotus petal pointing outward along +X.
// Length tunable per ring; built as a smooth cubic Bezier shape.
const buildPetal = (length: number, width: number) => {
  const halfW = width / 2;
  return `
    M 0 0
    C ${length * 0.25} ${-halfW}, ${length * 0.85} ${-halfW * 0.3}, ${length} 0
    C ${length * 0.85} ${halfW * 0.3}, ${length * 0.25} ${halfW}, 0 0
    Z
  `;
};

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // Sanfte Auto-Rotation
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation((r) => (r + dt * 4) % 360); // 4°/s
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const hovered = useMemo(() => {
    if (!hoveredId) return null;
    for (const c of CLUSTERS) {
      const s = c.services.find((x) => x.id === hoveredId);
      if (s) return { cluster: c, service: s };
    }
    return null;
  }, [hoveredId]);

  // ViewBox is centered on (0,0); leaves margin for outer petals + labels
  const VB = 760;
  const half = VB / 2;

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative bg-background flex flex-col">
      <PageMeta
        title="Mandala"
        description="Lotus mandala of cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Soft halo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 70%)',
        }}
      />

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

      {/* Cluster legend (top right) */}
      <aside className="absolute right-6 top-20 z-20 flex flex-col gap-2 text-right pointer-events-none">
        <div className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground mb-1">CLUSTERS</div>
        {CLUSTERS.map((c) => (
          <div key={c.id} className="flex items-center gap-2 justify-end font-mono text-[10px] tracking-[0.2em]">
            <span className="text-foreground/85">{t(c.groupKey).toUpperCase()}</span>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.hex}` }}
            />
            <span className="text-muted-foreground w-3">{c.code}</span>
          </div>
        ))}
      </aside>

      {/* Selected indicator (bottom left) */}
      <div className="absolute left-6 bottom-16 z-20 pointer-events-none">
        <div className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground mb-1">SELECTED</div>
        <div
          key={hovered?.service.code ?? 'none'}
          className="font-mono text-base tracking-[0.25em] text-primary animate-fade-in"
        >
          {hovered?.service.code ?? '—'}
        </div>
        <div
          key={hovered?.service.titleKey ?? 'none-t'}
          className="font-mono text-[11px] tracking-[0.15em] text-foreground/90 mt-1 max-w-[260px] animate-fade-in"
        >
          {hovered ? t(hovered.service.titleKey) : 'HOVER · INSPECT'}
        </div>
        {hovered && (
          <div
            className="font-mono text-[9px] tracking-[0.3em] mt-2"
            style={{ color: hovered.cluster.hex }}
          >
            {t(hovered.cluster.groupKey).toUpperCase()}
          </div>
        )}
      </div>

      {/* Mandala SVG */}
      <div className="relative w-full flex-1 flex items-center justify-center px-4 py-16">
        <svg
          viewBox={`${-half} ${-half} ${VB} ${VB}`}
          className="w-full h-full max-w-[760px] max-h-[760px]"
          style={{ filter: 'drop-shadow(0 0 24px hsl(var(--primary) / 0.12))' }}
        >
          {/* Background guide circles — very faint */}
          {RING_RADIUS.map((r, i) => (
            <circle
              key={`g-${i}`}
              cx={0}
              cy={0}
              r={r}
              fill="none"
              stroke={CLUSTERS[i].hex}
              strokeOpacity={0.12}
              strokeWidth={0.6}
              strokeDasharray="2 4"
            />
          ))}

          {/* Decorative outer petal halo (12-fold symmetry) */}
          <g
            opacity={0.18}
            style={{ transform: `rotate(${-rotation * 0.3}deg)`, transformOrigin: '0 0', transformBox: 'fill-box' }}
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360;
              return (
                <g key={`halo-${i}`} transform={`rotate(${angle})`}>
                  <path
                    d={buildPetal(46, 14)}
                    transform={`translate(${RING_RADIUS[3] + 24}, 0)`}
                    fill={CLUSTERS[3].hex}
                    fillOpacity={0.6}
                  />
                </g>
              );
            })}
          </g>

          {/* Cluster petal layers — counter-rotating for mandala motion */}
          {CLUSTERS.map((cluster, ringIdx) => {
            const radius = RING_RADIUS[ringIdx];
            const count = cluster.services.length;
            // Pad each ring to a higher symmetry — decorative empty petals
            // soften the asymmetry of clusters with only 2-3 services.
            const symmetry = ringIdx === 0 ? 12 : ringIdx === 1 ? 16 : ringIdx === 2 ? 8 : 12;
            const dir = ringIdx % 2 === 0 ? 1 : -1;
            const petalLen = ringIdx === 0 ? 70 : ringIdx === 1 ? 78 : ringIdx === 2 ? 70 : 78;
            const petalWidth = ringIdx === 0 ? 38 : ringIdx === 1 ? 36 : ringIdx === 2 ? 32 : 30;
            // Inner radius where the petal base sits
            const baseR = radius - petalLen * 0.4;

            return (
              <g
                key={cluster.id}
                style={{
                  transform: `rotate(${rotation * dir * (1 - ringIdx * 0.15)}deg)`,
                  transformOrigin: '0 0',
                  transformBox: 'fill-box',
                  transition: 'opacity 0.4s',
                  opacity: hoveredId && !cluster.services.some((s) => s.id === hoveredId) ? 0.45 : 1,
                }}
              >
                {/* Decorative empty petals (symmetry filler) */}
                {Array.from({ length: symmetry }).map((_, i) => {
                  const angle = (i / symmetry) * 360;
                  return (
                    <g key={`fill-${i}`} transform={`rotate(${angle})`}>
                      <path
                        d={buildPetal(petalLen, petalWidth)}
                        transform={`translate(${baseR}, 0)`}
                        fill={cluster.hex}
                        fillOpacity={0.05}
                        stroke={cluster.hex}
                        strokeOpacity={0.2}
                        strokeWidth={0.5}
                      />
                    </g>
                  );
                })}

                {/* Service petals — interactive */}
                {cluster.services.map((service, i) => {
                  // Distribute services evenly across the symmetry slots
                  const slot = Math.round((i * symmetry) / count);
                  const angle = (slot / symmetry) * 360;
                  const isHovered = hoveredId === service.id;
                  return (
                    <g
                      key={service.id}
                      transform={`rotate(${angle})`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredId(service.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleClick(service.id)}
                    >
                      {/* Service petal */}
                      <path
                        d={buildPetal(petalLen, petalWidth)}
                        transform={`translate(${baseR}, 0)`}
                        fill={cluster.hex}
                        fillOpacity={isHovered ? 0.85 : 0.4}
                        stroke={cluster.hex}
                        strokeOpacity={isHovered ? 1 : 0.7}
                        strokeWidth={isHovered ? 1.6 : 0.9}
                        style={{
                          transition: 'fill-opacity 0.25s, stroke-width 0.25s, filter 0.25s',
                          filter: isHovered ? `drop-shadow(0 0 10px ${cluster.hex})` : 'none',
                        }}
                      />
                      {/* Service code label inside the petal — counter-rotated to stay upright */}
                      <g
                        transform={`translate(${baseR + petalLen * 0.55}, 0) rotate(${-rotation * dir * (1 - ringIdx * 0.15) - angle})`}
                      >
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontFamily="'IBM Plex Mono', monospace"
                          fontSize={isHovered ? 13 : 11}
                          fontWeight={600}
                          fill={isHovered ? '#0a0e1a' : cluster.hex}
                          style={{ transition: 'fill 0.25s, font-size 0.25s', pointerEvents: 'none' }}
                        >
                          {service.code}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Inner sacred-geometry layer: 6-pointed star + center */}
          <g
            style={{
              transform: `rotate(${rotation * 0.5}deg)`,
              transformOrigin: '0 0',
              transformBox: 'fill-box',
            }}
          >
            {/* Triangle 1 */}
            <polygon
              points={trianglePoints(60, 0)}
              fill="none"
              stroke={CLUSTERS[0].hex}
              strokeOpacity={0.55}
              strokeWidth={1}
            />
            {/* Triangle 2 — inverted */}
            <polygon
              points={trianglePoints(60, 60)}
              fill="none"
              stroke={CLUSTERS[1].hex}
              strokeOpacity={0.55}
              strokeWidth={1}
            />
          </g>

          {/* Center — bindu */}
          <circle cx={0} cy={0} r={18} fill={CLUSTERS[0].hex} fillOpacity={0.18} />
          <circle cx={0} cy={0} r={9} fill={CLUSTERS[0].hex} />
          <circle cx={0} cy={0} r={3} fill="#0a0e1a" />
        </svg>

        {/* Hover tooltip — fixed in viewport, no jumping */}
        {hovered && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[280px] pointer-events-none animate-fade-in"
            style={{ maxWidth: '90%' }}
          >
            <div
              className="font-mono px-4 py-2 border bg-background/90 backdrop-blur-sm text-center"
              style={{ borderColor: hovered.cluster.hex }}
            >
              <div
                className="text-[9px] tracking-[0.4em] mb-0.5"
                style={{ color: hovered.cluster.hex }}
              >
                {hovered.service.code}
              </div>
              <div className="text-[12px] tracking-[0.18em] text-foreground">
                {t(hovered.service.titleKey).toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer legend */}
      <footer className="relative z-20 border-t border-primary/15 bg-background/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          <span>4 LAYERS · {CLUSTERS.reduce((n, c) => n + c.services.length, 0)} PETALS</span>
          <span className="hidden md:block">HOVER · INSPECT &nbsp; · &nbsp; CLICK · OPEN</span>
          <span>ITB-MANDALA-2026</span>
        </div>
      </footer>
    </div>
  );
};

// Equilateral triangle inscribed in radius r, optionally rotated (deg)
const trianglePoints = (r: number, rotateDeg: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = ((i * 120 + rotateDeg - 90) * Math.PI) / 180;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
};

export default Overview;
