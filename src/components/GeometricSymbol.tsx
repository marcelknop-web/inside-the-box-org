interface GeometricSymbolProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  hoverCyan?: boolean;
}

/**
 * inside-the-box.org — Brand Mark
 *
 * A precision-engineered emblem rendered as a single SVG.
 * Layers (outside → inside):
 *   1. Crosshair tick marks (4 cardinal axes)
 *   2. Outer hairline ring
 *   3. Concentric rotated squares (3 levels) — the "box-in-box" idea
 *   4. Central aperture with gold core
 *
 * All strokes are vector hairlines (scale-independent, crisp at any size).
 * Colors come from the design system (primary / highlight) — no hard-coded hex.
 */
export const GeometricSymbol = ({ size = 'lg', className = '', hoverCyan = false }: GeometricSymbolProps) => {
  const sizePx: Record<NonNullable<GeometricSymbolProps['size']>, number> = {
    xs: 24,
    sm: 96,
    md: 128,
    lg: 192,
  };
  const px = sizePx[size];

  // Stroke palette — tied to design tokens via CSS variables.
  const stroke = 'hsl(var(--primary))';
  const strokeSoft = 'hsl(var(--primary) / 0.55)';
  const strokeFaint = 'hsl(var(--primary) / 0.25)';
  const coreFill = 'hsl(var(--primary) / 0.85)';
  const coreGlow = 'hsl(var(--primary) / 0.18)';

  const hoverGroupClass = hoverCyan ? 'group-hover/welcome:[&_*]:!stroke-[hsl(var(--highlight))]' : '';

  return (
    <div
      className={`${className} inline-flex items-center justify-center ${hoverGroupClass}`}
      style={{ width: px, height: px }}
    >
      <svg
        viewBox="0 0 200 200"
        width={px}
        height={px}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          {/* Soft inner glow on the core — adds depth without losing crispness */}
          <radialGradient id="its-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={coreFill} stopOpacity="1" />
            <stop offset="55%" stopColor={coreFill} stopOpacity="0.4" />
            <stop offset="100%" stopColor={coreGlow} stopOpacity="0" />
          </radialGradient>
          {/* Subtle fill for the outermost rotated square */}
          <linearGradient id="its-outer-shade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.06)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.00)" />
          </linearGradient>
        </defs>

        {/* ───── Crosshair tick marks (cardinal axes) ───── */}
        <g stroke={strokeFaint} strokeWidth="1" strokeLinecap="square">
          <line x1="100" y1="4"   x2="100" y2="14" />
          <line x1="100" y1="186" x2="100" y2="196" />
          <line x1="4"   y1="100" x2="14"  y2="100" />
          <line x1="186" y1="100" x2="196" y2="100" />
        </g>

        {/* ───── Outer hairline ring ───── */}
        <circle cx="100" cy="100" r="92" stroke={strokeFaint} strokeWidth="0.75" />

        {/* ───── Outer rotated square (45°), with gentle gradient fill ───── */}
        <g transform="rotate(45 100 100)">
          <rect
            x="22" y="22" width="156" height="156"
            stroke={strokeSoft} strokeWidth="1.25"
            fill="url(#its-outer-shade)"
          />
        </g>

        {/* ───── Mid orthogonal frame (acts as the "box") ───── */}
        <rect
          x="40" y="40" width="120" height="120"
          stroke={strokeSoft} strokeWidth="1.25"
        />
        {/* Corner notches — engineering / blueprint feel */}
        <g stroke={stroke} strokeWidth="1.5" strokeLinecap="square">
          <line x1="40"  y1="40"  x2="50"  y2="40" />
          <line x1="40"  y1="40"  x2="40"  y2="50" />
          <line x1="160" y1="40"  x2="150" y2="40" />
          <line x1="160" y1="40"  x2="160" y2="50" />
          <line x1="40"  y1="160" x2="50"  y2="160" />
          <line x1="40"  y1="160" x2="40"  y2="150" />
          <line x1="160" y1="160" x2="150" y2="160" />
          <line x1="160" y1="160" x2="160" y2="150" />
        </g>

        {/* ───── Inner rotated square (a smaller "box inside") ───── */}
        <g transform="rotate(45 100 100)">
          <rect
            x="62" y="62" width="76" height="76"
            stroke={stroke} strokeWidth="1.5"
          />
        </g>

        {/* ───── Innermost orthogonal square ───── */}
        <rect
          x="78" y="78" width="44" height="44"
          stroke={strokeSoft} strokeWidth="1"
        />

        {/* ───── Central aperture: glow halo + solid core diamond ───── */}
        <circle cx="100" cy="100" r="14" fill="url(#its-core-glow)" />
        <g transform="rotate(45 100 100)">
          <rect x="92" y="92" width="16" height="16" fill={coreFill} />
        </g>

        {/* ───── Cardinal sight lines from core to mid frame (very faint) ───── */}
        <g stroke={strokeFaint} strokeWidth="0.5" strokeLinecap="square">
          <line x1="100" y1="40"  x2="100" y2="78" />
          <line x1="100" y1="122" x2="100" y2="160" />
          <line x1="40"  y1="100" x2="78"  y2="100" />
          <line x1="122" y1="100" x2="160" y2="100" />
        </g>
      </svg>
    </div>
  );
};
