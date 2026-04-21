import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';

/**
 * Hidden /overview — Engineering Blueprint.
 *
 * Visual metaphor: a technical drawing of the practice. Services are
 * components on a draughtsman's sheet — labelled boxes, dimension lines,
 * crosshair axes, coordinate ticks, drawing-frame and title-block.
 * Hover highlights a part; click navigates.
 *
 * Strict palette: hairline strokes on a faint grid, primary accent for
 * active part, muted for secondary marks. Nothing decorative — every
 * mark "means" something.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  descKey: string;
  code: string; // part number e.g. "A-01"
};

type Cluster = {
  id: string;
  groupKey: string;
  code: string; // sheet zone e.g. "A"
  services: ServiceNode[];
};

const CLUSTERS: Cluster[] = [
  {
    id: 'resilience',
    groupKey: 'nav.groupCyberResilience',
    code: 'A',
    services: [
      { id: 'cyber-crisis-management', titleKey: 'consulting.crisisTitle',   descKey: 'consulting.crisisDesc',   code: 'A-01' },
      { id: 'incident-management',     titleKey: 'consulting.incidentTitle', descKey: 'consulting.incidentDesc', code: 'A-02' },
      { id: 'arena-training',          titleKey: 'consulting.arenaTitle',    descKey: 'consulting.arenaDesc',    code: 'A-03' },
    ],
  },
  {
    id: 'regulation',
    groupKey: 'nav.groupRegulation',
    code: 'B',
    services: [
      { id: 'nis2-dora',     titleKey: 'consulting.nis2Title',  descKey: 'consulting.nis2Desc',  code: 'B-01' },
      { id: 'dora-nis2-ttx', titleKey: 'nav.ttxTraining',       descKey: 'consulting.crisisDesc', code: 'B-02' },
      { id: 'isms',          titleKey: 'consulting.ismsTitle',  descKey: 'consulting.ismsDesc',  code: 'B-03' },
      { id: 'tisax-pci-dss', titleKey: 'consulting.tisaxTitle', descKey: 'consulting.tisaxDesc', code: 'B-04' },
    ],
  },
  {
    id: 'governance',
    groupKey: 'nav.groupGovernance',
    code: 'C',
    services: [
      { id: 'virtual-ciso',         titleKey: 'consulting.vcisoTitle',  descKey: 'consulting.vcisoDesc',  code: 'C-01' },
      { id: 'assessments-concepts', titleKey: 'consulting.assessTitle', descKey: 'consulting.assessDesc', code: 'C-02' },
    ],
  },
  {
    id: 'insights',
    groupKey: 'nav.groupInsights',
    code: 'D',
    services: [
      { id: 'publications',     titleKey: 'consulting.pubTitle',         descKey: 'consulting.pubDesc',         code: 'D-01' },
      { id: 'events-workshops', titleKey: 'consulting.eventsTitle',      descKey: 'consulting.eventsDesc',      code: 'D-02' },
      { id: 'ai-workflows',     titleKey: 'consulting.aiWorkflowsTitle', descKey: 'consulting.aiWorkflowsDesc', code: 'D-03' },
    ],
  },
];

// ── Sheet geometry ─────────────────────────────────────────────────────────

const VIEW_W = 1600;
const VIEW_H = 1000;
const MARGIN = 60;        // sheet inner border
const FRAME = 28;         // frame inside sheet edge

// Layout: 4 quadrants (zones A-D), divided by central crosshair.
// Each zone hosts its services as labelled component boxes.

type Zone = {
  cluster: Cluster;
  // top-left & size of the zone (inside frame, after axis labels)
  x: number;
  y: number;
  w: number;
  h: number;
  zoneLabel: string; // e.g. "A1"
};

const buildZones = (): Zone[] => {
  // After the main border, leave room for axis ticks; then split 2x2
  const innerX = MARGIN + 60;
  const innerY = MARGIN + 60;
  const innerW = VIEW_W - innerX - MARGIN - 40;
  const innerH = VIEW_H - innerY - MARGIN - 90; // leave space for title block
  const colW = innerW / 2;
  const rowH = innerH / 2;
  // Order: A top-left, B top-right, C bottom-left, D bottom-right
  const map = [
    { id: 'resilience', col: 0, row: 0, label: 'A1' },
    { id: 'regulation', col: 1, row: 0, label: 'B1' },
    { id: 'governance', col: 0, row: 1, label: 'A2' },
    { id: 'insights',   col: 1, row: 1, label: 'B2' },
  ];
  return map.map((m) => {
    const cluster = CLUSTERS.find((c) => c.id === m.id)!;
    return {
      cluster,
      x: innerX + m.col * colW,
      y: innerY + m.row * rowH,
      w: colW,
      h: rowH,
      zoneLabel: m.label,
    };
  });
};

type Part = {
  node: ServiceNode;
  zone: Zone;
  x: number;
  y: number;
  w: number;
  h: number;
};

const layoutParts = (zones: Zone[]): Part[] => {
  const parts: Part[] = [];
  for (const zone of zones) {
    const pad = 56;
    const inner = {
      x: zone.x + pad,
      y: zone.y + pad - 10,
      w: zone.w - pad * 2,
      h: zone.h - pad * 2 + 10,
    };
    const n = zone.cluster.services.length;
    // single column stack, evenly spaced
    const gap = 18;
    const partH = Math.min(110, (inner.h - gap * (n - 1)) / n);
    const partW = Math.min(440, inner.w);
    const startY = inner.y + (inner.h - (partH * n + gap * (n - 1))) / 2;
    const startX = inner.x + (inner.w - partW) / 2;
    zone.cluster.services.forEach((s, i) => {
      parts.push({
        node: s,
        zone,
        x: startX,
        y: startY + i * (partH + gap),
        w: partW,
        h: partH,
      });
    });
  }
  return parts;
};

// ── Component ──────────────────────────────────────────────────────────────

const Overview = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const zones = useMemo(() => buildZones(), []);
  const parts = useMemo(() => layoutParts(zones), [zones]);

  const hoveredPart = useMemo(
    () => parts.find((p) => p.node.id === hoveredId) ?? null,
    [parts, hoveredId]
  );

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

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  // Sheet metadata (title block)
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
  const sheetNo = '01 / 01';
  const drawingNo = 'ITB-OVERVIEW-2026';
  const totalParts = parts.length;

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative bg-background">
      <PageMeta
        title="Blueprint"
        description="Engineering blueprint of cybersecurity services from inside-the-box.org."
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

      {/* Faint cyan grid backdrop — like blueprint paper */}
      <BlueprintGrid />

      {/* The drawing */}
      <div className="relative w-full h-screen flex items-center justify-center px-4 py-16">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-[min(95vw,calc(95vh*1.6))]"
          style={{
            transform: `translate3d(${parallax.x * -6}px, ${parallax.y * -6}px, 0)`,
            transition: 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          }}
        >
          <defs>
            <pattern id="microGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary) / 0.06)" strokeWidth="0.4" />
            </pattern>
            <pattern id="majorGrid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#microGrid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="0.6" />
            </pattern>
          </defs>

          {/* Sheet background grid */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={VIEW_W - 2 * MARGIN}
            height={VIEW_H - 2 * MARGIN}
            fill="url(#majorGrid)"
            opacity="0.6"
          />

          {/* Outer frame (double-line, draughtsman style) */}
          <rect
            x={MARGIN}
            y={MARGIN}
            width={VIEW_W - 2 * MARGIN}
            height={VIEW_H - 2 * MARGIN}
            fill="none"
            stroke="hsl(var(--primary) / 0.55)"
            strokeWidth="1.2"
          />
          <rect
            x={MARGIN + 6}
            y={MARGIN + 6}
            width={VIEW_W - 2 * MARGIN - 12}
            height={VIEW_H - 2 * MARGIN - 12}
            fill="none"
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth="0.5"
          />

          {/* Axis labels (A B / 1 2) along the frame */}
          <FrameAxisLabels />

          {/* Central crosshair dividing zones */}
          <CenterCrosshair />

          {/* Zone headers */}
          {zones.map((z) => (
            <ZoneHeader key={`zh-${z.cluster.id}`} zone={z} t={t} active={hoveredPart?.zone.cluster.id === z.cluster.id} />
          ))}

          {/* Component boxes (parts) */}
          {parts.map((p) => {
            const isHovered = hoveredId === p.node.id;
            const dimmed = hoveredId !== null && !isHovered;
            return (
              <PartBox
                key={p.node.id}
                part={p}
                t={t}
                isHovered={isHovered}
                dimmed={dimmed}
                onEnter={() => setHoveredId(p.node.id)}
                onLeave={() => setHoveredId((c) => (c === p.node.id ? null : c))}
                onClick={() => handleClick(p.node.id)}
              />
            );
          })}

          {/* Dimension lines from frame to hovered part */}
          {hoveredPart && <DimensionLines part={hoveredPart} />}

          {/* Title block (bottom-right) */}
          <TitleBlock
            dateStr={dateStr}
            sheetNo={sheetNo}
            drawingNo={drawingNo}
            totalParts={totalParts}
            hoveredCode={hoveredPart?.node.code ?? '—'}
            hoveredTitle={hoveredPart ? t(hoveredPart.node.titleKey) : 'OVERVIEW'}
          />
        </svg>

        {/* Description strip */}
        <DescriptionLayer
          title={hoveredPart ? t(hoveredPart.node.titleKey) : t('overview.title' as never) || 'Engineering Blueprint'}
          desc={
            hoveredPart
              ? t(hoveredPart.node.descKey)
              : t('overview.subtitle' as never) || 'Hover a part to inspect · Click to enter'
          }
          code={hoveredPart?.node.code ?? null}
        />
      </div>
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const BlueprintGrid = () => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{
      background:
        'radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.05) 0%, hsl(var(--background)) 70%)',
    }}
  />
);

const FrameAxisLabels = () => {
  // Top: 1 2 3 4 ; Left: A B C D — classic drawing zone refs
  const cols = ['1', '2', '3', '4'];
  const rows = ['A', 'B', 'C', 'D'];
  const colSpacing = (VIEW_W - 2 * MARGIN) / cols.length;
  const rowSpacing = (VIEW_H - 2 * MARGIN) / rows.length;
  return (
    <g fill="hsl(var(--primary) / 0.6)" fontSize="18" fontWeight="500">
      {cols.map((c, i) => {
        const x = MARGIN + colSpacing * (i + 0.5);
        return (
          <g key={`c-${c}`}>
            <text x={x} y={MARGIN - 14} textAnchor="middle">{c}</text>
            <text x={x} y={VIEW_H - MARGIN + 30} textAnchor="middle">{c}</text>
            {i > 0 && (
              <>
                <line x1={MARGIN + colSpacing * i} y1={MARGIN} x2={MARGIN + colSpacing * i} y2={MARGIN + 8} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
                <line x1={MARGIN + colSpacing * i} y1={VIEW_H - MARGIN} x2={MARGIN + colSpacing * i} y2={VIEW_H - MARGIN - 8} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
              </>
            )}
          </g>
        );
      })}
      {rows.map((r, i) => {
        const y = MARGIN + rowSpacing * (i + 0.5);
        return (
          <g key={`r-${r}`}>
            <text x={MARGIN - 22} y={y + 6} textAnchor="middle">{r}</text>
            <text x={VIEW_W - MARGIN + 22} y={y + 6} textAnchor="middle">{r}</text>
            {i > 0 && (
              <>
                <line x1={MARGIN} y1={MARGIN + rowSpacing * i} x2={MARGIN + 8} y2={MARGIN + rowSpacing * i} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
                <line x1={VIEW_W - MARGIN} y1={MARGIN + rowSpacing * i} x2={VIEW_W - MARGIN - 8} y2={MARGIN + rowSpacing * i} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.8" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

const CenterCrosshair = () => {
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2 - 25; // slightly above title block area
  const inner = MARGIN + 60;
  return (
    <g stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" strokeDasharray="6 4">
      {/* horizontal */}
      <line x1={inner} y1={cy} x2={VIEW_W - inner} y2={cy} />
      {/* vertical */}
      <line x1={cx} y1={inner} x2={cx} y2={VIEW_H - MARGIN - 90} />
      {/* center mark */}
      <g stroke="hsl(var(--primary) / 0.7)" strokeWidth="0.8" strokeDasharray="0">
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} />
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} />
        <circle cx={cx} cy={cy} r="3" fill="none" />
      </g>
    </g>
  );
};

interface ZoneHeaderProps {
  zone: Zone;
  t: (k: string) => string;
  active: boolean;
}
const ZoneHeader = ({ zone, t, active }: ZoneHeaderProps) => {
  const label = t(zone.cluster.groupKey).toUpperCase();
  return (
    <g>
      {/* zone outline (very subtle) */}
      <rect
        x={zone.x + 8}
        y={zone.y + 8}
        width={zone.w - 16}
        height={zone.h - 16}
        fill="none"
        stroke={active ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--primary) / 0.15)'}
        strokeWidth="0.5"
        strokeDasharray="2 4"
        style={{ transition: 'stroke 0.3s' }}
      />
      {/* zone code badge */}
      <g transform={`translate(${zone.x + 22}, ${zone.y + 28})`}>
        <text fontSize="10" fill="hsl(var(--primary) / 0.5)" letterSpacing="2">
          ZONE {zone.zoneLabel} · {zone.cluster.code}
        </text>
        <text y={18} fontSize="13" fill={active ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.85)'} letterSpacing="1.5" style={{ transition: 'fill 0.3s' }}>
          {label}
        </text>
        <line x1={0} y1={26} x2={150} y2={26} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.6" />
      </g>
    </g>
  );
};

interface PartBoxProps {
  part: Part;
  t: (k: string) => string;
  isHovered: boolean;
  dimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}
const PartBox = ({ part, t, isHovered, dimmed, onEnter, onLeave, onClick }: PartBoxProps) => {
  const stroke = isHovered ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)';
  const fill = isHovered ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--background) / 0.6)';
  const opacity = dimmed ? 0.3 : 1;

  // Leader line: small tick from the box code label
  return (
    <g
      style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
      opacity={opacity}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={t(part.node.titleKey)}
    >
      {/* Bounding rect */}
      <rect
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        fill={fill}
        stroke={stroke}
        strokeWidth={isHovered ? 1.2 : 0.7}
        style={{ transition: 'all 0.25s' }}
      />
      {/* Corner ticks */}
      {[
        [part.x, part.y],
        [part.x + part.w, part.y],
        [part.x, part.y + part.h],
        [part.x + part.w, part.y + part.h],
      ].map(([cx, cy], i) => (
        <g key={i} stroke={stroke} strokeWidth="0.8">
          <line
            x1={cx + (i % 2 === 0 ? 0 : -6)}
            y1={cy}
            x2={cx + (i % 2 === 0 ? 6 : 0)}
            y2={cy}
          />
          <line
            x1={cx}
            y1={cy + (i < 2 ? 0 : -6)}
            x2={cx}
            y2={cy + (i < 2 ? 6 : 0)}
          />
        </g>
      ))}
      {/* Part code (top-left inside) */}
      <text
        x={part.x + 16}
        y={part.y + 26}
        fontSize="13"
        fill="hsl(var(--primary) / 0.75)"
        letterSpacing="2.5"
      >
        PART {part.node.code}
      </text>
      {/* Part title */}
      <text
        x={part.x + 16}
        y={part.y + 58}
        fontSize="22"
        fontWeight="500"
        fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
        style={{ transition: 'fill 0.25s' }}
      >
        {truncate(t(part.node.titleKey), 32)}
      </text>
      {/* Dimension hint (bottom edge) */}
      <text
        x={part.x + part.w - 16}
        y={part.y + part.h - 12}
        fontSize="11"
        textAnchor="end"
        fill="hsl(var(--muted-foreground))"
        letterSpacing="2"
      >
        ⌀ {Math.round(part.w)}×{Math.round(part.h)}
      </text>
    </g>
  );
};

interface DimensionLinesProps {
  part: Part;
}
const DimensionLines = ({ part }: DimensionLinesProps) => {
  // Horizontal dimension above part (from left frame to part-left, and part-right to right frame)
  const leftFrame = MARGIN + 6;
  const rightFrame = VIEW_W - MARGIN - 6;
  const topFrame = MARGIN + 6;
  const bottomFrame = VIEW_H - MARGIN - 6;
  const dimY = part.y - 18;
  const dimX = part.x - 18;
  const stroke = 'hsl(var(--primary) / 0.85)';
  const arrowSize = 4;
  return (
    <g stroke={stroke} strokeWidth="0.6" fill={stroke}>
      {/* Horizontal dimension line above part */}
      <line x1={leftFrame} y1={dimY} x2={part.x} y2={dimY} />
      <line x1={part.x + part.w} y1={dimY} x2={rightFrame} y2={dimY} />
      {/* Extension lines */}
      <line x1={part.x} y1={part.y} x2={part.x} y2={dimY - 4} strokeDasharray="2 3" />
      <line x1={part.x + part.w} y1={part.y} x2={part.x + part.w} y2={dimY - 4} strokeDasharray="2 3" />
      {/* Arrowheads (small triangles) */}
      <polygon points={`${part.x},${dimY} ${part.x - arrowSize},${dimY - arrowSize} ${part.x - arrowSize},${dimY + arrowSize}`} />
      <polygon points={`${part.x + part.w},${dimY} ${part.x + part.w + arrowSize},${dimY - arrowSize} ${part.x + part.w + arrowSize},${dimY + arrowSize}`} />
      {/* Dimension number */}
      <text
        x={part.x + part.w / 2}
        y={dimY - 4}
        fontSize="10"
        textAnchor="middle"
        fill={stroke}
        stroke="none"
      >
        {Math.round(part.w)}
      </text>

      {/* Vertical dimension to left of part */}
      <line x1={dimX} y1={topFrame} x2={dimX} y2={part.y} />
      <line x1={dimX} y1={part.y + part.h} x2={dimX} y2={bottomFrame} />
      <line x1={part.x} y1={part.y} x2={dimX - 4} y2={part.y} strokeDasharray="2 3" />
      <line x1={part.x} y1={part.y + part.h} x2={dimX - 4} y2={part.y + part.h} strokeDasharray="2 3" />
      <polygon points={`${dimX},${part.y} ${dimX - arrowSize},${part.y - arrowSize} ${dimX + arrowSize},${part.y - arrowSize}`} />
      <polygon points={`${dimX},${part.y + part.h} ${dimX - arrowSize},${part.y + part.h + arrowSize} ${dimX + arrowSize},${part.y + part.h + arrowSize}`} />
      <text
        x={dimX - 6}
        y={part.y + part.h / 2}
        fontSize="10"
        textAnchor="middle"
        fill={stroke}
        stroke="none"
        transform={`rotate(-90 ${dimX - 6} ${part.y + part.h / 2})`}
      >
        {Math.round(part.h)}
      </text>

      {/* Leader from part to title-block area (bottom-right) */}
      <line
        x1={part.x + part.w / 2}
        y1={part.y + part.h / 2}
        x2={VIEW_W - MARGIN - 360}
        y2={VIEW_H - MARGIN - 80}
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <circle cx={part.x + part.w / 2} cy={part.y + part.h / 2} r="2.5" fill={stroke} />
    </g>
  );
};

interface TitleBlockProps {
  dateStr: string;
  sheetNo: string;
  drawingNo: string;
  totalParts: number;
  hoveredCode: string;
  hoveredTitle: string;
}
const TitleBlock = ({ dateStr, sheetNo, drawingNo, totalParts, hoveredCode, hoveredTitle }: TitleBlockProps) => {
  const w = 540;
  const h = 80;
  const x = VIEW_W - MARGIN - 6 - w;
  const y = VIEW_H - MARGIN - 6 - h;
  // 4 columns
  const colW = w / 4;
  return (
    <g>
      {/* outer */}
      <rect x={x} y={y} width={w} height={h} fill="hsl(var(--background) / 0.85)" stroke="hsl(var(--primary) / 0.7)" strokeWidth="1" />
      {/* internal dividers */}
      <line x1={x + colW * 2} y1={y} x2={x + colW * 2} y2={y + h} stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.6" />
      <line x1={x + colW * 3} y1={y} x2={x + colW * 3} y2={y + h} stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.6" />
      <line x1={x + colW * 2} y1={y + h / 2} x2={x + colW * 3} y2={y + h / 2} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.5" />
      <line x1={x + colW * 3} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.5" />

      {/* Col 1: project name (large) */}
      <text x={x + 14} y={y + 22} fontSize="9" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">PROJECT</text>
      <text x={x + 14} y={y + 44} fontSize="16" fill="hsl(var(--foreground))" letterSpacing="1">INSIDE-THE-BOX</text>
      <text x={x + 14} y={y + 64} fontSize="10" fill="hsl(var(--muted-foreground))" letterSpacing="1">Cybersecurity Practice · 13 / 4</text>

      {/* Col 2 (top): selected part */}
      <text x={x + colW * 2 + 10} y={y + 14} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">SELECTED</text>
      <text x={x + colW * 2 + 10} y={y + 32} fontSize="11" fill="hsl(var(--primary))" letterSpacing="1">{hoveredCode}</text>
      <text x={x + colW * 2 + 10} y={y + 46} fontSize="9" fill="hsl(var(--foreground) / 0.85)">{truncate(hoveredTitle, 22)}</text>

      {/* Col 2 (bottom): drawing no */}
      <text x={x + colW * 2 + 10} y={y + 60} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">DWG NO</text>
      <text x={x + colW * 2 + 10} y={y + 74} fontSize="9" fill="hsl(var(--foreground))">{drawingNo}</text>

      {/* Col 3 (top): scale + date */}
      <text x={x + colW * 3 + 10} y={y + 14} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">SCALE</text>
      <text x={x + colW * 3 + 10} y={y + 32} fontSize="10" fill="hsl(var(--foreground))">1 : 1</text>
      <text x={x + colW * 3 + 10} y={y + 46} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">DATE</text>
      <text x={x + colW * 3 + 10} y={y + 62} fontSize="10" fill="hsl(var(--foreground))">{dateStr}</text>

      {/* Col 4: sheet + part count */}
      <text x={x + colW * 3 + colW / 2 + 10} y={y + 14} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">SHEET</text>
      <text x={x + colW * 3 + colW / 2 + 10} y={y + 32} fontSize="10" fill="hsl(var(--foreground))">{sheetNo}</text>
      <text x={x + colW * 3 + colW / 2 + 10} y={y + 46} fontSize="8" fill="hsl(var(--primary) / 0.6)" letterSpacing="2">PARTS</text>
      <text x={x + colW * 3 + colW / 2 + 10} y={y + 62} fontSize="10" fill="hsl(var(--foreground))">{totalParts}</text>
    </g>
  );
};

interface DescriptionLayerProps {
  title: string;
  desc: string;
  code: string | null;
}
const DescriptionLayer = ({ title, desc, code }: DescriptionLayerProps) => (
  <div
    className="absolute left-0 right-0 top-16 px-6 pointer-events-none z-20"
    aria-live="polite"
  >
    <div className="max-w-3xl mx-auto text-center">
      {code && (
        <div className="font-mono text-[10px] tracking-[0.4em] text-primary/80 mb-2 animate-fade-in">
          PART {code} · CLICK TO ENTER
        </div>
      )}
      <h2
        key={title}
        className="font-mono text-base sm:text-lg md:text-xl font-light leading-tight animate-fade-in"
        style={{ letterSpacing: '0.05em' }}
      >
        {title.toUpperCase()}
      </h2>
      <p
        key={desc}
        className="text-xs text-muted-foreground max-w-xl mx-auto animate-fade-in mt-1"
      >
        {desc}
      </p>
    </div>
  </div>
);

// ── Helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
}

export default Overview;
