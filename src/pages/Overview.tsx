import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden /overview — Sri-Yantra-style Grid Mandala.
 *
 * Structure: 4 sectors (clusters) × N rings (services per cluster).
 * Each service has a unique cell, located by:
 *   • Sector (cluster colour, outer label)
 *   • Ring   (radial distance from centre)
 * Service name is printed on a curved arc inside its cell — readable
 * without hover. The whole mandala rotates very slowly; the text
 * counter-rotates so labels never go upside down.
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
  hex: string;
  services: ServiceNode[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    code: 'A',
    hex: '#f5b800',
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
    hex: '#00bcd4',
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
    hex: '#e8a200',
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  code: 'C-01' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', code: 'C-02' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    code: 'D',
    hex: '#7ee0ec',
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         code: 'D-01' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      code: 'D-02' },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', code: 'D-03' },
    ],
  },
];

// Mandala geometry — generous ring thickness so labels truly fill their cells
const VB = 1080;                         // viewBox dimension (room for outer label band)
const HALF = VB / 2;
const R_INNER = 78;                      // start of first ring (after centre)
const RING_THICK = 84;                   // each service ring thickness
const MAX_RINGS = Math.max(...CLUSTERS.map((c) => c.services.length));   // 4
const R_OUTER = R_INNER + RING_THICK * MAX_RINGS;                         // 414
const LABEL_BAND_THICK = 70;             // dedicated outer band for cluster labels
const R_LABEL_OUT = R_OUTER + LABEL_BAND_THICK;                           // 484
const R_LABEL_TEXT = R_OUTER + LABEL_BAND_THICK / 2;                      // 449 — text baseline

// Sector geometry — each cluster gets one sector.
// Sectors are evenly spaced around the circle.
const SECTOR_COUNT = CLUSTERS.length;     // 4
const SECTOR_DEG = 360 / SECTOR_COUNT;    // 90°
// Tiny gap between sectors so the mandala "breathes"
const SECTOR_GAP_DEG = 1.2;

const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° at top, clockwise
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
};

// Build an annular-segment path (a "cell"): inner arc + outer arc + sides.
const buildCell = (rIn: number, rOut: number, degStart: number, degEnd: number): string => {
  const p1 = polar(rOut, degStart);
  const p2 = polar(rOut, degEnd);
  const p3 = polar(rIn, degEnd);
  const p4 = polar(rIn, degStart);
  const sweep = degEnd - degStart;
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
};

// Build a centred arc path for text-on-path along the middle of a cell.
// We need the arc to read left-to-right (top of mandala upright). For sectors
// in the bottom half (90° < midDeg < 270°), flip the arc direction so the
// text is not upside-down.
const buildTextArc = (
  r: number,
  degStart: number,
  degEnd: number,
  flip: boolean,
): string => {
  const a = flip ? degEnd : degStart;
  const b = flip ? degStart : degEnd;
  const p1 = polar(r, a);
  const p2 = polar(r, b);
  const sweep = flip ? 0 : 1;
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
};

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Statisch — keine Bewegung. Bewegung lenkt vom Lesen ab.
  const rotation = 0;

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const hovered = useMemo(() => {
    if (!hoveredId) return null;
    for (const c of CLUSTERS) {
      const s = c.services.find((x) => x.id === hoveredId);
      if (s) return { cluster: c, service: s };
    }
    return null;
  }, [hoveredId]);

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative bg-background flex flex-col">
      <PageMeta
        title="Mandala"
        description="Grid mandala of cybersecurity services from inside-the-box.org."
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Halo */}
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

      {/* Selected indicator (bottom-left, fixed) */}
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
          {hovered ? t(hovered.service.titleKey) : 'HOVER · CLICK · OPEN'}
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

      {/* Mandala */}
      <div className="relative w-full flex-1 flex items-center justify-center px-2 py-12">
        <svg
          viewBox={`${-HALF} ${-HALF} ${VB} ${VB}`}
          className="w-full h-full max-w-[820px] max-h-[820px]"
          style={{ filter: 'drop-shadow(0 0 24px hsl(var(--primary) / 0.12))' }}
        >
          {/* Faint guide circles for every ring boundary */}
          {Array.from({ length: MAX_RINGS + 1 }).map((_, i) => (
            <circle
              key={`g-${i}`}
              cx={0}
              cy={0}
              r={R_INNER + RING_THICK * i}
              fill="none"
              stroke="#f5b800"
              strokeOpacity={0.1}
              strokeWidth={0.5}
              strokeDasharray="2 4"
            />
          ))}

          {/* Whole mandala rotates as one — labels counter-rotate per cell below */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '0 0',
              transformBox: 'fill-box',
            }}
          >
            {CLUSTERS.map((cluster, sIdx) => {
              const sectorStart = sIdx * SECTOR_DEG + SECTOR_GAP_DEG / 2;
              const sectorEnd = (sIdx + 1) * SECTOR_DEG - SECTOR_GAP_DEG / 2;
              const sectorMid = (sectorStart + sectorEnd) / 2;

              return (
                <g key={cluster.id}>
                  {/* Service cells inside this sector — one per ring */}
                  {cluster.services.map((service, ringIdx) => {
                    const rIn = R_INNER + ringIdx * RING_THICK;
                    const rOut = rIn + RING_THICK;
                    const isHovered = hoveredId === service.id;
                    const dimmed = hoveredId !== null && !isHovered;

                    // Label arc lives mid-cell. Flip if the sector mid is in
                    // the bottom half so text doesn't read upside-down.
                    // Account for global rotation when deciding flip.
                    const effectiveMid = (sectorMid + rotation) % 360;
                    const flip = effectiveMid > 90 && effectiveMid < 270;
                    const rText = (rIn + rOut) / 2;
                    const arcId = `arc-${service.id}`;
                    // Slight inset so the curved text doesn't crash into the cell sides
                    const textInset = 3;
                    const arcStart = sectorStart + textInset;
                    const arcEnd = sectorEnd - textInset;

                    const label = t(service.titleKey).toUpperCase();

                    return (
                      <g
                        key={service.id}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredId(service.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleClick(service.id)}
                      >
                        {/* Cell shape */}
                        <path
                          d={buildCell(rIn, rOut, sectorStart, sectorEnd)}
                          fill={cluster.hex}
                          fillOpacity={isHovered ? 0.55 : dimmed ? 0.06 : 0.14}
                          stroke={cluster.hex}
                          strokeOpacity={isHovered ? 1 : dimmed ? 0.25 : 0.55}
                          strokeWidth={isHovered ? 1.6 : 0.8}
                          style={{
                            transition: 'fill-opacity 0.25s, stroke-opacity 0.25s, stroke-width 0.25s, filter 0.25s',
                            filter: isHovered ? `drop-shadow(0 0 10px ${cluster.hex})` : 'none',
                          }}
                        />

                        {/* Hidden arc the text follows */}
                        <defs>
                          <path
                            id={arcId}
                            d={buildTextArc(rText, arcStart, arcEnd, flip)}
                          />
                        </defs>

                        {/* Service code — small, near inner edge */}
                        <text
                          fontFamily="'IBM Plex Mono', monospace"
                          fontSize={11}
                          letterSpacing={3}
                          fill={cluster.hex}
                          fillOpacity={isHovered ? 1 : 0.85}
                          style={{ pointerEvents: 'none' }}
                          dy={flip ? 20 : -20}
                        >
                          <textPath
                            href={`#${arcId}`}
                            startOffset="50%"
                            textAnchor="middle"
                          >
                            {service.code}
                          </textPath>
                        </text>

                        {/* Service name — main label, curved along arc */}
                        <text
                          fontFamily="'IBM Plex Mono', monospace"
                          fontSize={isHovered ? 20 : 18}
                          fontWeight={500}
                          letterSpacing={2}
                          fill={isHovered ? '#0a0e1a' : '#f1f4fa'}
                          style={{
                            pointerEvents: 'none',
                            transition: 'fill 0.25s, font-size 0.25s',
                          }}
                        >
                          <textPath
                            href={`#${arcId}`}
                            startOffset="50%"
                            textAnchor="middle"
                          >
                            {label}
                          </textPath>
                        </text>
                      </g>
                    );
                  })}

                  {/* Empty filler cells for shorter clusters — keep mandala symmetric */}
                  {Array.from({ length: MAX_RINGS - cluster.services.length }).map((_, k) => {
                    const ringIdx = cluster.services.length + k;
                    const rIn = R_INNER + ringIdx * RING_THICK;
                    const rOut = rIn + RING_THICK;
                    return (
                      <path
                        key={`empty-${cluster.id}-${k}`}
                        d={buildCell(rIn, rOut, sectorStart, sectorEnd)}
                        fill={cluster.hex}
                        fillOpacity={0.025}
                        stroke={cluster.hex}
                        strokeOpacity={0.18}
                        strokeWidth={0.5}
                        strokeDasharray="2 3"
                      />
                    );
                  })}

                  {/* Outer cluster name — curved along an arc beyond R_OUTER */}
                  <defs>
                    <path
                      id={`outer-${cluster.id}`}
                      d={buildTextArc(
                        R_LABELS,
                        sectorStart + 4,
                        sectorEnd - 4,
                        ((sectorMid + rotation) % 360) > 90 && ((sectorMid + rotation) % 360) < 270,
                      )}
                    />
                  </defs>
                  <text
                    fontFamily="'IBM Plex Mono', monospace"
                    fontSize={17}
                    fontWeight={600}
                    letterSpacing={6}
                    fill={cluster.hex}
                    style={{ pointerEvents: 'none' }}
                  >
                    <textPath
                      href={`#outer-${cluster.id}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {`${cluster.code} · ${t(cluster.groupKey).toUpperCase()}`}
                    </textPath>
                  </text>
                </g>
              );
            })}

            {/* Sector dividers — thin radial lines */}
            {Array.from({ length: SECTOR_COUNT }).map((_, i) => {
              const deg = i * SECTOR_DEG;
              const p1 = polar(R_INNER, deg);
              const p2 = polar(R_OUTER, deg);
              return (
                <line
                  key={`div-${i}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#f5b800"
                  strokeOpacity={0.25}
                  strokeWidth={0.6}
                />
              );
            })}
          </g>

          {/* Centre — bindu (does not rotate) */}
          <circle cx={0} cy={0} r={R_INNER - 8} fill="none" stroke="#f5b800" strokeOpacity={0.2} strokeWidth={0.6} />
          <circle cx={0} cy={0} r={28} fill="#f5b800" fillOpacity={0.12} />
          <circle cx={0} cy={0} r={14} fill="#f5b800" />
          <circle cx={0} cy={0} r={4} fill="#0a0e1a" />
        </svg>
      </div>

      {/* Footer legend */}
      <footer className="relative z-20 border-t border-primary/15 bg-background/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          <span>{SECTOR_COUNT} SECTORS · {CLUSTERS.reduce((n, c) => n + c.services.length, 0)} CELLS</span>
          <span className="hidden md:block">SECTOR · CLUSTER &nbsp; · &nbsp; RING · DEPTH &nbsp; · &nbsp; CLICK · OPEN</span>
          <span>ITB-MANDALA-2026</span>
        </div>
      </footer>
    </div>
  );
};

export default Overview;
