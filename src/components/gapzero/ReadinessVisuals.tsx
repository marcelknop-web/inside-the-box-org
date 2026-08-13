/**
 * GapZero result visuals — quiet, auditor-grade data graphics for the
 * on-screen report. No decoration: every element encodes a number that also
 * appears as text, so the visuals stay defensible in a review situation.
 */

const toneClass = (pct: number) =>
  pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-destructive';

const toneStroke = (pct: number) =>
  pct >= 70 ? 'hsl(142 70% 42%)' : pct >= 40 ? 'hsl(45 90% 48%)' : 'hsl(0 72% 51%)';

/** Semicircular readiness gauge with the value as text in the centre. */
export function ReadinessGauge({ pct, label, sub }: { pct: number; label: string; sub?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 46;
  const len = Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 120 68" className="w-full max-w-[190px]" role="img" aria-label={`${label}: ${pct}%`}>
        <path d={`M 14 58 A ${r} ${r} 0 0 1 106 58`} fill="none" stroke="hsl(var(--secondary))" strokeWidth="9" strokeLinecap="round" />
        <path
          d={`M 14 58 A ${r} ${r} 0 0 1 106 58`}
          fill="none"
          stroke={toneStroke(clamped)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * len} ${len}`}
        />
        <text x="60" y="52" textAnchor="middle" className={`font-mono font-bold ${toneClass(clamped)}`} style={{ fontSize: 22, fill: 'currentColor' }}>
          {Math.round(clamped)}%
        </text>
      </svg>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export interface VerdictCounts {
  pass: number;
  partial: number;
  fail: number;
}

/** Stacked verdict bar plus a labelled breakdown with mini bars. */
export function VerdictBreakdown({
  counts,
  labels,
}: {
  counts: VerdictCounts;
  labels: { pass: string; partial: string; fail: string };
}) {
  const total = counts.pass + counts.partial + counts.fail || 1;
  const rows: [string, number, string, string][] = [
    [labels.pass, counts.pass, 'bg-green-500', 'text-green-400'],
    [labels.partial, counts.partial, 'bg-yellow-500', 'text-yellow-400'],
    [labels.fail, counts.fail, 'bg-destructive', 'text-destructive'],
  ];
  return (
    <div className="w-full">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${labels.pass} ${counts.pass}, ${labels.partial} ${counts.partial}, ${labels.fail} ${counts.fail}`}>
        {rows.map(([lbl, n, cls]) => (
          <div key={lbl} className={cls} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map(([lbl, n, cls, txt]) => (
          <div key={lbl} className="flex items-center gap-3">
            <span className={`h-2 w-2 shrink-0 rounded-sm ${cls}`} />
            <span className="text-xs text-foreground min-w-0 flex-1 truncate">{lbl}</span>
            <span className="h-1.5 w-24 sm:w-32 rounded-full bg-secondary overflow-hidden">
              <span className={`block h-full rounded-full ${cls}`} style={{ width: `${(n / total) * 100}%` }} />
            </span>
            <span className={`font-mono text-xs font-bold w-6 text-right ${txt}`}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small multiples: one verdict bar per requirement area. */
export function CategoryBars({
  rows,
  title,
  hint,
}: {
  rows: { label: string; pass: number; partial: number; fail: number }[];
  title: string;
  hint?: string;
}) {
  if (rows.length < 2) return null;
  return (
    <div className="bg-background/40 border border-primary/15 rounded-lg p-5">
      <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((r) => {
          const total = r.pass + r.partial + r.fail || 1;
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-xs text-foreground truncate">{r.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">{r.pass}/{total}</span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="bg-green-500" style={{ width: `${(r.pass / total) * 100}%` }} />
                <div className="bg-yellow-500" style={{ width: `${(r.partial / total) * 100}%` }} />
                <div className="bg-destructive" style={{ width: `${(r.fail / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground mt-4">{hint}</p>}
    </div>
  );
}

/** Generic labelled distribution bar (evidence substantiation, phases …). */
export function DistributionStrip({
  segments,
  title,
  hint,
}: {
  segments: { label: string; value: number; cls: string }[];
  title: string;
  hint?: string;
}) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  return (
    <div>
      <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{title}</h3>
      <div className="flex h-6 w-full overflow-hidden rounded-md bg-secondary">
        {shown.map((s) => {
          const w = (s.value / total) * 100;
          return (
            <div key={s.label} className={`${s.cls} flex items-center justify-center`} style={{ width: `${w}%` }} title={`${s.label}: ${s.value}`}>
              {w > 9 && <span className="font-mono text-[10px] font-bold text-background">{Math.round(w)}%</span>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {shown.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`h-2 w-2 rounded-sm ${s.cls}`} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>}
    </div>
  );
}
