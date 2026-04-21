import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Languages } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage, nextLanguage } from '@/i18n/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Hidden /overview — Engineering Blueprint.
 *
 * Visual metaphor: a technical drawing of the practice. Services are
 * components on a draughtsman's sheet — labelled boxes, dimension lines,
 * crosshair axes, coordinate ticks, drawing-frame and title-block.
 *
 * The drawing itself is FIXED (no parallax) so the frame never jumps.
 * Hover refinement happens *inside* the parts: soft glow, animated
 * corner ticks and a left accent rail. Selected info is shown in a
 * dedicated, non-overlapping info bar below the sheet — no more text
 * stacking on top of the drawing.
 */

type ServiceNode = {
  id: string;
  titleKey: string;
  descKey: string;
  code: string;
};

type Cluster = {
  id: string;
  groupKey: string;
  code: string;
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
const MARGIN = 60;

type Zone = {
  cluster: Cluster;
  x: number;
  y: number;
  w: number;
  h: number;
  zoneLabel: string;
};

const buildZones = (): Zone[] => {
  const innerX = MARGIN + 60;
  const innerY = MARGIN + 60;
  const innerW = VIEW_W - innerX - MARGIN - 40;
  const innerH = VIEW_H - innerY - MARGIN - 90;
  const colW = innerW / 2;
  const rowH = innerH / 2;
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
  const isMobile = useIsMobile();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const zones = useMemo(() => buildZones(), []);
  const parts = useMemo(() => layoutParts(zones), [zones]);

  const hoveredPart = useMemo(
    () => parts.find((p) => p.node.id === hoveredId) ?? null,
    [parts, hoveredId]
  );

  const handleClick = useCallback((id: string) => navigate(`/${id}`), [navigate]);

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
  const sheetNo = '01 / 01';
  const drawingNo = 'ITB-OVERVIEW-2026';
  const totalParts = parts.length;

  if (isMobile) {
    return (
      <MobileBlueprint
        t={t}
        language={language}
        setLanguage={setLanguage}
        navigate={navigate}
        dateStr={dateStr}
        drawingNo={drawingNo}
        totalParts={totalParts}
      />
    );
  }

  return (
    <div className="min-h-screen w-full text-foreground overflow-hidden relative bg-background flex flex-col">
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

      <BlueprintGrid />

      {/* The drawing — fixed, no parallax */}
      <div className="relative w-full flex-1 flex items-center justify-center px-4 pt-14 pb-2">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-[min(95vw,calc(82vh*1.6))]"
          style={{
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
            {/* Soft glow for hovered part */}
            <filter id="partGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x={MARGIN}
            y={MARGIN}
            width={VIEW_W - 2 * MARGIN}
            height={VIEW_H - 2 * MARGIN}
            fill="url(#majorGrid)"
            opacity="0.6"
          />

          {/* Outer frame (double-line) */}
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

          <FrameAxisLabels />
          <CenterCrosshair />

          {zones.map((z) => (
            <ZoneHeader key={`zh-${z.cluster.id}`} zone={z} t={t} active={hoveredPart?.zone.cluster.id === z.cluster.id} />
          ))}

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

          {hoveredPart && <DimensionLines part={hoveredPart} />}

          <TitleBlock
            dateStr={dateStr}
            sheetNo={sheetNo}
            drawingNo={drawingNo}
            totalParts={totalParts}
            hoveredCode={hoveredPart?.node.code ?? '—'}
            hoveredTitle={hoveredPart ? t(hoveredPart.node.titleKey) : 'OVERVIEW'}
          />
        </svg>
      </div>

      {/* Info bar below sheet — no overlap with the drawing */}
      <InfoBar
        t={t}
        hoveredPart={hoveredPart}
      />
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const BlueprintGrid = () => (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none"
    style={{
      background:
        'radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.05) 0%, hsl(var(--background)) 70%)',
    }}
  />
);

const FrameAxisLabels = () => {
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
  const cy = VIEW_H / 2 - 25;
  const inner = MARGIN + 60;
  return (
    <g stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" strokeDasharray="6 4">
      <line x1={inner} y1={cy} x2={VIEW_W - inner} y2={cy} />
      <line x1={cx} y1={inner} x2={cx} y2={VIEW_H - MARGIN - 90} />
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
    <g style={{ transition: 'opacity 0.4s' }}>
      <rect
        x={zone.x + 8}
        y={zone.y + 8}
        width={zone.w - 16}
        height={zone.h - 16}
        fill="none"
        stroke={active ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--primary) / 0.15)'}
        strokeWidth="0.5"
        strokeDasharray="2 4"
        style={{ transition: 'stroke 0.5s cubic-bezier(0.2,0.8,0.2,1)' }}
      />
      <g transform={`translate(${zone.x + 26}, ${zone.y + 32})`}>
        <text fontSize="14" fill="hsl(var(--primary) / 0.6)" letterSpacing="3">
          ZONE {zone.zoneLabel} · {zone.cluster.code}
        </text>
        <text y={26} fontSize="20" fontWeight="500" fill={active ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.9)'} letterSpacing="2" style={{ transition: 'fill 0.5s cubic-bezier(0.2,0.8,0.2,1)' }}>
          {label}
        </text>
        <line x1={0} y1={36} x2={220} y2={36} stroke="hsl(var(--primary) / 0.45)" strokeWidth="0.8" />
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
  const fill = isHovered ? 'hsl(var(--primary) / 0.06)' : 'hsl(var(--background) / 0.5)';
  const opacity = dimmed ? 0.32 : 1;
  // Animated corner-tick length: longer on hover for a refined "engaged" feel
  const tick = isHovered ? 14 : 6;
  // Left accent rail width — appears on hover
  const railW = isHovered ? 4 : 0;
  const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

  return (
    <g
      style={{ cursor: 'pointer', transition: `opacity 0.45s ${ease}` }}
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
      {/* Soft glow layer (only visible on hover) */}
      {isHovered && (
        <rect
          x={part.x}
          y={part.y}
          width={part.w}
          height={part.h}
          fill="hsl(var(--primary) / 0.10)"
          stroke="hsl(var(--primary) / 0.35)"
          strokeWidth="0.6"
          filter="url(#partGlow)"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Base rect */}
      <rect
        x={part.x}
        y={part.y}
        width={part.w}
        height={part.h}
        fill={fill}
        stroke={stroke}
        strokeWidth={isHovered ? 1 : 0.7}
        style={{ transition: `fill 0.5s ${ease}, stroke 0.5s ${ease}, stroke-width 0.5s ${ease}` }}
      />

      {/* Left accent rail — slides in on hover */}
      <rect
        x={part.x}
        y={part.y}
        width={railW}
        height={part.h}
        fill="hsl(var(--primary))"
        style={{ transition: `width 0.5s ${ease}` }}
      />

      {/* Corner ticks — extend on hover */}
      {[
        [part.x, part.y, 1, 1],
        [part.x + part.w, part.y, -1, 1],
        [part.x, part.y + part.h, 1, -1],
        [part.x + part.w, part.y + part.h, -1, -1],
      ].map(([cx, cy, sx, sy], i) => (
        <g key={i} stroke={stroke} strokeWidth={isHovered ? 1.1 : 0.8} style={{ transition: `stroke 0.5s ${ease}, stroke-width 0.5s ${ease}` }}>
          <line x1={cx as number} y1={cy as number} x2={(cx as number) + (sx as number) * tick} y2={cy as number} style={{ transition: `all 0.5s ${ease}` }} />
          <line x1={cx as number} y1={cy as number} x2={cx as number} y2={(cy as number) + (sy as number) * tick} style={{ transition: `all 0.5s ${ease}` }} />
        </g>
      ))}

      {/* Part code (top-left inside) */}
      <text
        x={part.x + 16 + (isHovered ? 8 : 0)}
        y={part.y + 26}
        fontSize="13"
        fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.75)'}
        letterSpacing="2.5"
        style={{ transition: `fill 0.5s ${ease}, x 0.5s ${ease}` }}
      >
        PART {part.node.code}
      </text>
      {/* Part title */}
      <text
        x={part.x + 16 + (isHovered ? 8 : 0)}
        y={part.y + 58}
        fontSize="22"
        fontWeight="500"
        fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
        style={{ transition: `fill 0.5s ${ease}, x 0.5s ${ease}` }}
      >
        {truncate(t(part.node.titleKey), 32)}
      </text>
      {/* Bottom hint: dimensions when idle, "OPEN →" on hover */}
      <text
        x={part.x + part.w - 16}
        y={part.y + part.h - 12}
        fontSize="11"
        textAnchor="end"
        fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
        letterSpacing="2.5"
        style={{ transition: `fill 0.5s ${ease}` }}
      >
        {isHovered ? 'OPEN →' : `⌀ ${Math.round(part.w)}×${Math.round(part.h)}`}
      </text>
    </g>
  );
};

interface DimensionLinesProps {
  part: Part;
}
const DimensionLines = ({ part }: DimensionLinesProps) => {
  const leftFrame = MARGIN + 6;
  const rightFrame = VIEW_W - MARGIN - 6;
  const topFrame = MARGIN + 6;
  const bottomFrame = VIEW_H - MARGIN - 6;
  const dimY = part.y - 18;
  const dimX = part.x - 18;
  const stroke = 'hsl(var(--primary) / 0.85)';
  const arrowSize = 4;
  return (
    <g stroke={stroke} strokeWidth="0.6" fill={stroke} style={{ pointerEvents: 'none' }} className="animate-fade-in">
      <line x1={leftFrame} y1={dimY} x2={part.x} y2={dimY} />
      <line x1={part.x + part.w} y1={dimY} x2={rightFrame} y2={dimY} />
      <line x1={part.x} y1={part.y} x2={part.x} y2={dimY - 4} strokeDasharray="2 3" />
      <line x1={part.x + part.w} y1={part.y} x2={part.x + part.w} y2={dimY - 4} strokeDasharray="2 3" />
      <polygon points={`${part.x},${dimY} ${part.x - arrowSize},${dimY - arrowSize} ${part.x - arrowSize},${dimY + arrowSize}`} />
      <polygon points={`${part.x + part.w},${dimY} ${part.x + part.w + arrowSize},${dimY - arrowSize} ${part.x + part.w + arrowSize},${dimY + arrowSize}`} />
      <text x={part.x + part.w / 2} y={dimY - 6} fontSize="14" fontWeight="500" textAnchor="middle" fill={stroke} stroke="none">
        {Math.round(part.w)}
      </text>

      <line x1={dimX} y1={topFrame} x2={dimX} y2={part.y} />
      <line x1={dimX} y1={part.y + part.h} x2={dimX} y2={bottomFrame} />
      <line x1={part.x} y1={part.y} x2={dimX - 4} y2={part.y} strokeDasharray="2 3" />
      <line x1={part.x} y1={part.y + part.h} x2={dimX - 4} y2={part.y + part.h} strokeDasharray="2 3" />
      <polygon points={`${dimX},${part.y} ${dimX - arrowSize},${part.y - arrowSize} ${dimX + arrowSize},${part.y - arrowSize}`} />
      <polygon points={`${dimX},${part.y + part.h} ${dimX - arrowSize},${part.y + part.h + arrowSize} ${dimX + arrowSize},${part.y + part.h + arrowSize}`} />
      <text
        x={dimX - 8}
        y={part.y + part.h / 2}
        fontSize="14"
        fontWeight="500"
        textAnchor="middle"
        fill={stroke}
        stroke="none"
        transform={`rotate(-90 ${dimX - 8} ${part.y + part.h / 2})`}
      >
        {Math.round(part.h)}
      </text>

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
  const w = 720;
  const h = 110;
  const x = VIEW_W - MARGIN - 6 - w;
  const y = VIEW_H - MARGIN - 6 - h;
  const colW = w / 4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="hsl(var(--background) / 0.85)" stroke="hsl(var(--primary) / 0.7)" strokeWidth="1.2" />
      <line x1={x + colW * 2} y1={y} x2={x + colW * 2} y2={y + h} stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.8" />
      <line x1={x + colW * 3} y1={y} x2={x + colW * 3} y2={y + h} stroke="hsl(var(--primary) / 0.55)" strokeWidth="0.8" />
      <line x1={x + colW * 2} y1={y + h / 2} x2={x + colW * 3} y2={y + h / 2} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.6" />
      <line x1={x + colW * 3} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.6" />

      <text x={x + 18} y={y + 28} fontSize="12" fill="hsl(var(--primary) / 0.65)" letterSpacing="3">PROJECT</text>
      <text x={x + 18} y={y + 60} fontSize="22" fontWeight="500" fill="hsl(var(--foreground))" letterSpacing="2">INSIDE-THE-BOX</text>
      <text x={x + 18} y={y + 88} fontSize="13" fill="hsl(var(--muted-foreground))" letterSpacing="1.5">Cybersecurity Practice · 13 / 4</text>

      <text x={x + colW * 2 + 14} y={y + 20} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">SELECTED</text>
      <text x={x + colW * 2 + 14} y={y + 38} fontSize="14" fontWeight="500" fill="hsl(var(--primary))" letterSpacing="1.5">{hoveredCode}</text>
      <text x={x + colW * 2 + 14} y={y + 52} fontSize="11" fill="hsl(var(--foreground) / 0.85)">{truncate(hoveredTitle, 22)}</text>

      <text x={x + colW * 2 + 14} y={y + 78} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">DWG NO</text>
      <text x={x + colW * 2 + 14} y={y + 96} fontSize="12" fill="hsl(var(--foreground))">{drawingNo}</text>

      <text x={x + colW * 3 + 14} y={y + 20} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">SCALE</text>
      <text x={x + colW * 3 + 14} y={y + 42} fontSize="13" fill="hsl(var(--foreground))">1 : 1</text>
      <text x={x + colW * 3 + 14} y={y + 78} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">DATE</text>
      <text x={x + colW * 3 + 14} y={y + 100} fontSize="13" fill="hsl(var(--foreground))">{dateStr}</text>

      <text x={x + colW * 3 + colW / 2 + 14} y={y + 20} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">SHEET</text>
      <text x={x + colW * 3 + colW / 2 + 14} y={y + 42} fontSize="13" fill="hsl(var(--foreground))">{sheetNo}</text>
      <text x={x + colW * 3 + colW / 2 + 14} y={y + 78} fontSize="11" fill="hsl(var(--primary) / 0.65)" letterSpacing="2.5">PARTS</text>
      <text x={x + colW * 3 + colW / 2 + 14} y={y + 100} fontSize="13" fill="hsl(var(--foreground))">{totalParts}</text>
    </g>
  );
};

interface InfoBarProps {
  t: (k: string) => string;
  hoveredPart: Part | null;
}
const InfoBar = ({ t, hoveredPart }: InfoBarProps) => {
  const code = hoveredPart?.node.code ?? '—';
  const title = hoveredPart ? t(hoveredPart.node.titleKey) : (t('overview.title' as never) || 'Engineering Blueprint');
  const desc = hoveredPart
    ? t(hoveredPart.node.descKey)
    : (t('overview.subtitle' as never) || 'Hover a part to inspect · Click to enter');
  const zoneLabel = hoveredPart?.zone.zoneLabel ?? '—';

  return (
    <div className="relative z-20 border-t border-primary/20 bg-background/85 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 grid grid-cols-12 gap-4 items-start">
        {/* Left: code + zone */}
        <div className="col-span-12 sm:col-span-3 flex sm:flex-col gap-3 sm:gap-1 items-center sm:items-start">
          <div className="font-mono text-[10px] tracking-[0.35em] text-primary/65">PART</div>
          <div key={code} className="font-mono text-base sm:text-lg text-primary tracking-[0.25em] animate-fade-in">
            {code}
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground sm:mt-2">
            ZONE {zoneLabel}
          </div>
        </div>

        {/* Middle: title + desc */}
        <div className="col-span-12 sm:col-span-7 min-w-0">
          <div className="font-mono text-[10px] tracking-[0.35em] text-primary/65 mb-1">SUBJECT</div>
          <h2
            key={title}
            className="font-mono text-lg sm:text-xl md:text-2xl font-light leading-snug animate-fade-in truncate"
            style={{ letterSpacing: '0.04em' }}
          >
            {title.toUpperCase()}
          </h2>
          <p
            key={desc}
            className="text-sm text-muted-foreground mt-1.5 line-clamp-2 animate-fade-in"
          >
            {desc}
          </p>
        </div>

        {/* Right: action */}
        <div className="col-span-12 sm:col-span-2 flex sm:justify-end">
          <div className="font-mono text-[10px] tracking-[0.35em] text-primary/85 border border-primary/40 px-3 py-2">
            {hoveredPart ? 'CLICK · OPEN' : 'HOVER · INSPECT'}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
}

export default Overview;
