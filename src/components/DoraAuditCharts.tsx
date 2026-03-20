/**
 * DORA Audit Dashboard — Interactive KPI charts for managers & auditors
 */
import { useMemo, useState, memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend,
} from 'recharts';
import type { DoraRisk, DoraReq } from '@/data/doraData';
import { RISK_CATEGORIES } from '@/data/doraData';
import { useLanguage } from '@/i18n/LanguageContext';

const RISK_COLORS = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_COLORS = { pass: '#22c55e', partial: '#eab308', fail: '#dc2626' };

type TabId = 'overview' | 'risks' | 'compliance' | 'gaps';

const KpiCard = memo(({ value, label, color, sub }: { value: string | number; label: string; color: string; sub?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-md">
    <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
  </div>
));

const ChartCard = memo(({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</h4>
    {subtitle && <p className="text-[11px] text-muted-foreground/70 mb-4 leading-relaxed">{subtitle}</p>}
    {!subtitle && <div className="mb-3" />}
    {children}
  </div>
));

const TabButton = memo(({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.97] ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
  >
    {label}
  </button>
));

/* ═══ Simplified Gantt Chart — Focus on readability ═══ */
const PHASE_META: Record<string, { weeks: [number, number]; color: string; label: { de: string; en: string } }> = {
  P0: { weeks: [0, 4], color: '#dc2626', label: { de: 'Sofort (0-4 Wo.)', en: 'Immediate (0-4 wk)' } },
  P1: { weeks: [4, 16], color: '#f97316', label: { de: 'Kurzfristig (1-3 Mo.)', en: 'Short-term (1-3 mo)' } },
  P2: { weeks: [16, 28], color: '#eab308', label: { de: 'Mittelfristig (3-6 Mo.)', en: 'Medium-term (3-6 mo)' } },
  P3: { weeks: [28, 52], color: '#22c55e', label: { de: 'Langfristig (6-12 Mo.)', en: 'Long-term (6-12 mo)' } },
};
const GANTT_TOTAL_WEEKS = 52;

type SortMode = 'priority' | 'article';

function GanttChart({ reqs, de }: { reqs: DoraReq[]; de: boolean }) {
  const [sortMode, setSortMode] = useState<SortMode>('priority');

  const allGaps = useMemo(() => {
    const gaps = reqs.filter(r => r.status !== 'pass' && r.priority);
    if (sortMode === 'article') {
      return [...gaps].sort((a, b) => a.article.localeCompare(b.article, undefined, { numeric: true }));
    }
    const prioOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
    return [...gaps].sort((a, b) => (prioOrder[a.priority] ?? 2) - (prioOrder[b.priority] ?? 2));
  }, [reqs, sortMode]);

  if (allGaps.length === 0) {
    return <div className="text-center text-muted-foreground text-sm py-8">{de ? 'Keine offenen Massnahmen' : 'No open measures'}</div>;
  }

  const totalHours = allGaps.reduce((s, r) => {
    const m = r.effort?.match(/(\d+)\s*-\s*(\d+)/);
    return s + (m ? (parseInt(m[1]) + parseInt(m[2])) / 2 : 0);
  }, 0);

  // Build cascading waterfall — each item starts where previous one in its phase ended
  const phaseEnd: Record<string, number> = {};
  const itemPositions = allGaps.map(item => {
    const phase = PHASE_META[item.priority] || PHASE_META.P2;
    const m = item.effort?.match(/(\d+)\s*-\s*(\d+)/);
    const avgHours = m ? (parseInt(m[1]) + parseInt(m[2])) / 2 : 30;
    const durationWeeks = Math.max(2, Math.round(avgHours / 35));
    const phaseStart = phase.weeks[0];
    const currentStart = Math.max(phaseStart, phaseEnd[item.priority] ?? phaseStart);
    const endWeek = Math.min(currentStart + durationWeeks, phase.weeks[1]);
    phaseEnd[item.priority] = endWeek;
    return { item, startWeek: currentStart, endWeek, phase, avgHours };
  });

  return (
    <div className="space-y-5">
      {/* Header with sort toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-bold text-foreground">{de ? 'Umsetzungs-Roadmap' : 'Remediation Roadmap'}</h4>
          <span className="text-xs text-muted-foreground font-mono">{allGaps.length} {de ? 'Massnahmen' : 'measures'} · ~{Math.round(totalHours)} {de ? 'Std.' : 'hrs'}</span>
        </div>
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setSortMode('priority')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all active:scale-[0.97] ${sortMode === 'priority' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {de ? 'Nach Priorität' : 'By Priority'}
          </button>
          <button
            onClick={() => setSortMode('article')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all active:scale-[0.97] ${sortMode === 'article' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {de ? 'Nach Artikel' : 'By Article'}
          </button>
        </div>
      </div>

      {/* Priority summary pills */}
      <div className="flex gap-2 flex-wrap">
        {['P0', 'P1', 'P2', 'P3'].map(prio => {
          const count = allGaps.filter(g => g.priority === prio).length;
          if (count === 0) return null;
          const phase = PHASE_META[prio];
          return (
            <div key={prio} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: phase.color }}>
              {prio} <span className="font-mono opacity-80">×{count}</span>
            </div>
          );
        })}
      </div>

      {/* Waterfall chart */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Timeline header */}
        <div className="flex items-center bg-muted/50 border-b border-border px-3 py-2.5">
          <div className="w-[180px] flex-shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {de ? 'Massnahme' : 'Measure'}
          </div>
          <div className="flex-1 grid grid-cols-4">
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
              <div key={q} className="text-center text-[11px] font-bold text-muted-foreground">{q}</div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30">
          {itemPositions.map(({ item, startWeek, endWeek, phase, avgHours }, idx) => {
            const barLeft = (startWeek / GANTT_TOTAL_WEEKS) * 100;
            const barWidth = Math.max(5, ((endWeek - startWeek) / GANTT_TOTAL_WEEKS) * 100);
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.id}
                className={`flex items-center px-3 py-2 group relative transition-colors duration-150 hover:bg-accent/40 ${isEven ? 'bg-transparent' : 'bg-muted/20'}`}
              >
                <div className="w-[180px] flex-shrink-0 pr-3 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: phase.color }} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-foreground leading-tight truncate">{item.id}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.name}</div>
                  </div>
                </div>

                <div className="flex-1 relative h-9">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div key={pct} className="absolute top-0 bottom-0 border-l border-border/20" style={{ left: `${pct}%` }} />
                  ))}
                  <div
                    className="absolute top-1 h-7 rounded-md flex items-center px-2 transition-all duration-200 group-hover:shadow-lg group-hover:brightness-110 cursor-default peer"
                    style={{
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${phase.color}, ${phase.color}bb)`,
                      boxShadow: `0 1px 4px ${phase.color}25`,
                    }}
                  >
                    <span className="text-[9px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.effort || item.id}
                    </span>
                  </div>
                  {/* Hover detail card */}
                  <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-card border border-border rounded-xl p-3 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                    <div className="text-xs font-bold text-foreground mb-1">{item.id}: {item.name}</div>
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <div className="flex justify-between"><span>{de ? 'Artikel' : 'Article'}:</span><span className="font-mono font-bold">Art. {item.article}</span></div>
                      <div className="flex justify-between"><span>{de ? 'Prioritaet' : 'Priority'}:</span><span className="font-bold" style={{ color: phase.color }}>{item.priority}</span></div>
                      <div className="flex justify-between"><span>{de ? 'Aufwand' : 'Effort'}:</span><span className="font-mono">{item.effort || '—'}</span></div>
                      <div className="flex justify-between"><span>{de ? 'Zeitraum' : 'Timeline'}:</span><span className="font-mono">{de ? `Woche ${startWeek}–${endWeek}` : `Week ${startWeek}–${endWeek}`}</span></div>
                      <div className="flex justify-between"><span>Status:</span><span className={`font-bold ${item.status === 'fail' ? 'text-destructive' : 'text-yellow-500'}`}>{item.status === 'fail' ? (de ? 'Nicht erfuellt' : 'Failed') : (de ? 'Teilweise' : 'Partial')}</span></div>
                      {item.gap && <div className="pt-1 border-t border-border mt-1 text-muted-foreground/80 line-clamp-2">{item.gap}</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {Object.entries(PHASE_META).map(([prio, meta]) => (
          <div key={prio} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: meta.color }} />
            <span>{prio}: {de ? meta.label.de : meta.label.en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoraAuditCharts({ risks, reqs }: { risks: DoraRisk[]; reqs: DoraReq[] }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ── Computed Data ──────────────────────────────────
  const riskScores = useMemo(() => risks.map(r => r.likelihood * r.impact), [risks]);

  const riskDist = useMemo(() => {
    const b = { critical: 0, high: 0, medium: 0, low: 0 };
    riskScores.forEach(s => { if (s >= 20) b.critical++; else if (s >= 13) b.high++; else if (s >= 6) b.medium++; else b.low++; });
    return [
      { name: de ? 'Kritisch' : 'Critical', value: b.critical, color: RISK_COLORS.critical },
      { name: de ? 'Hoch' : 'High', value: b.high, color: RISK_COLORS.high },
      { name: de ? 'Mittel' : 'Medium', value: b.medium, color: RISK_COLORS.medium },
      { name: de ? 'Niedrig' : 'Low', value: b.low, color: RISK_COLORS.low },
    ];
  }, [riskScores, de]);

  const complianceData = useMemo(() => {
    const p = reqs.filter(r => r.status === 'pass').length;
    const pa = reqs.filter(r => r.status === 'partial').length;
    const f = reqs.filter(r => r.status === 'fail').length;
    return [
      { name: de ? 'Erfuellt' : 'Pass', value: p, color: STATUS_COLORS.pass },
      { name: de ? 'Teilweise' : 'Partial', value: pa, color: STATUS_COLORS.partial },
      { name: de ? 'Nicht erfuellt' : 'Fail', value: f, color: STATUS_COLORS.fail },
    ];
  }, [reqs, de]);

  const complianceRate = useMemo(() => {
    const total = reqs.length;
    if (!total) return 0;
    const score = reqs.reduce((acc, r) => acc + (r.status === 'pass' ? 1 : r.status === 'partial' ? 0.5 : 0), 0);
    return Math.round((score / total) * 100);
  }, [reqs]);

  const avgRiskScore = useMemo(() => {
    if (!riskScores.length) return 0;
    return (riskScores.reduce((a, b) => a + b, 0) / riskScores.length).toFixed(1);
  }, [riskScores]);

  const catRadar = useMemo(() => {
    return 'CIAGTR'.split('').map(c => {
      const catRisks = risks.filter(r => r.category === c);
      return {
        category: RISK_CATEGORIES[c]?.label[language] || c,
        short: c,
        count: catRisks.length,
        avgScore: catRisks.length ? +(catRisks.reduce((a, r) => a + r.likelihood * r.impact, 0) / catRisks.length).toFixed(1) : 0,
        maxScore: catRisks.length ? Math.max(...catRisks.map(r => r.likelihood * r.impact)) : 0,
      };
    });
  }, [risks, language]);

  const topRisks = useMemo(() =>
    [...risks].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)).slice(0, 8).map(r => ({
      name: `${r.category}-${String(r.id).padStart(3, '0')}`,
      score: r.likelihood * r.impact,
      color: r.likelihood * r.impact >= 20 ? RISK_COLORS.critical : r.likelihood * r.impact >= 13 ? RISK_COLORS.high : RISK_COLORS.medium,
      label: r.name.length > 35 ? r.name.slice(0, 32) + '...' : r.name,
    }))
  , [risks]);

  const evidenceData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    risks.forEach(r => { buckets[r.evidenceQuality - 1]++; });
    return buckets.map((count, i) => ({ name: `${i + 1}/5`, count, color: i >= 3 ? '#22c55e' : i >= 2 ? '#eab308' : '#dc2626' }));
  }, [risks]);

  const chapterData = useMemo(() => {
    const chapters: Record<string, { pass: number; partial: number; fail: number; total: number }> = {};
    reqs.forEach(r => {
      const ch = r.article.split(' ')[1]?.split('.')[0] || r.article;
      const chNum = parseInt(ch);
      let chLabel: string;
      if (chNum <= 16) chLabel = de ? 'Kap. II: IKT-Risiko' : 'Ch. II: ICT Risk';
      else if (chNum <= 23) chLabel = de ? 'Kap. III: Vorfaelle' : 'Ch. III: Incidents';
      else if (chNum <= 27) chLabel = de ? 'Kap. IV: Resilienz' : 'Ch. IV: Resilience';
      else chLabel = de ? 'Kap. V: Drittanbieter' : 'Ch. V: Third-Party';
      if (!chapters[chLabel]) chapters[chLabel] = { pass: 0, partial: 0, fail: 0, total: 0 };
      chapters[chLabel].total++;
      chapters[chLabel][r.status]++;
    });
    return Object.entries(chapters).map(([name, d]) => ({
      name,
      [de ? 'Erfuellt' : 'Pass']: d.pass,
      [de ? 'Teilweise' : 'Partial']: d.partial,
      [de ? 'Nicht erfuellt' : 'Fail']: d.fail,
    }));
  }, [reqs, de]);

  const gapPriority = useMemo(() => {
    const gaps = reqs.filter(r => r.status !== 'pass');
    const prios: Record<string, number> = {};
    gaps.forEach(r => { const p = r.priority || 'P2'; prios[p] = (prios[p] || 0) + 1; });
    return ['P0', 'P1', 'P2', 'P3'].filter(p => prios[p]).map(p => ({
      name: p, value: prios[p] || 0,
      color: p === 'P0' ? '#dc2626' : p === 'P1' ? '#f97316' : p === 'P2' ? '#eab308' : '#22c55e',
      label: p === 'P0' ? (de ? 'Sofort' : 'Immediate') : p === 'P1' ? (de ? 'Kurzfristig' : 'Short-term') : p === 'P2' ? (de ? 'Mittelfristig' : 'Medium-term') : (de ? 'Langfristig' : 'Long-term'),
    }));
  }, [reqs, de]);

  const totalEffort = useMemo(() => {
    let minH = 0, maxH = 0;
    reqs.filter(r => r.effort).forEach(r => {
      const m = r.effort.match(/(\d+)\s*-\s*(\d+)/);
      if (m) { minH += parseInt(m[1]); maxH += parseInt(m[2]); }
    });
    return { min: minH, max: maxH };
  }, [reqs]);

  const critCount = riskDist[0].value;
  const failCount = complianceData[2].value;
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: de ? 'Uebersicht' : 'Overview' },
    { id: 'risks', label: de ? 'Risikoanalyse' : 'Risk Analysis' },
    { id: 'compliance', label: de ? 'Compliance' : 'Compliance' },
    { id: 'gaps', label: de ? 'Massnahmenplan' : 'Action Plan' },
  ];
  const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(tab => <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} onClick={() => setActiveTab(tab.id)} />)}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard value={risks.length} label={de ? 'IKT-Risiken' : 'ICT Risks'} color="text-foreground" sub={de ? 'identifiziert' : 'identified'} />
            <KpiCard value={critCount} label={de ? 'Kritisch' : 'Critical'} color="text-destructive" sub="Score >= 20" />
            <KpiCard value={`${complianceRate}%`} label={de ? 'DORA-Compliance' : 'DORA Compliance'} color={complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'} />
            <KpiCard value={failCount} label={de ? 'Offene Luecken' : 'Open Gaps'} color="text-destructive" sub={`${totalEffort.min}-${totalEffort.max}h`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={de ? 'Risikoverteilung' : 'Risk Distribution'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={riskDist} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>{riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">{riskDist.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </ChartCard>
            <ChartCard title={de ? 'DORA-Konformitaet' : 'DORA Compliance'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={complianceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>{complianceData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">{complianceData.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </ChartCard>
          </div>
          <ChartCard title={de ? 'Konformitaet nach DORA-Kapitel' : 'Compliance by DORA Chapter'}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chapterData} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey={de ? 'Erfuellt' : 'Pass'} stackId="a" fill={STATUS_COLORS.pass} radius={0} />
                <Bar dataKey={de ? 'Teilweise' : 'Partial'} stackId="a" fill={STATUS_COLORS.partial} radius={0} />
                <Bar dataKey={de ? 'Nicht erfuellt' : 'Fail'} stackId="a" fill={STATUS_COLORS.fail} radius={[0, 4, 4, 0]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ═══ RISK ANALYSIS ═══ */}
      {activeTab === 'risks' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-3 gap-3">
            <KpiCard value={avgRiskScore} label={de ? 'Ø Risiko-Score' : 'Avg Risk Score'} color="text-foreground" sub="/25" />
            <KpiCard value={Math.max(...riskScores)} label={de ? 'Hoechster Score' : 'Max Score'} color="text-destructive" sub="/25" />
            <KpiCard value={risks.filter(r => r.evidenceQuality >= 4).length} label={de ? 'Hohe Evidenz' : 'High Evidence'} color="text-green-500" sub={`/ ${risks.length}`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={de ? 'CIAGTR-Risikoprofil' : 'CIAGTR Risk Profile'}>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={catRadar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="short" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name={de ? 'Anzahl' : 'Count'} dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={de ? 'Ø Score' : 'Avg Score'} dataKey="avgScore" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={de ? 'Evidenzqualitaet' : 'Evidence Quality'}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={evidenceData} margin={{ left: -15, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>{evidenceData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <ChartCard title={de ? 'Hoechste Risiko-Scores' : 'Top Risk Scores'}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topRisks} layout="vertical" margin={{ left: 15, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 25]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontFamily: 'monospace' }} width={55} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _name: string, props: any) => [value, props.payload.label]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>{topRisks.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ═══ COMPLIANCE ═══ */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{de ? 'Gesamt-Compliance-Score' : 'Overall Compliance Score'}</div>
            <div className="relative inline-flex items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                <circle cx="70" cy="70" r="58" fill="none" stroke={complianceRate >= 70 ? '#22c55e' : complianceRate >= 40 ? '#eab308' : '#dc2626'} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(complianceRate / 100) * 364.4} 364.4`} transform="rotate(-90 70 70)" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono ${complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{complianceRate}%</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-3">
              {complianceRate >= 70 ? (de ? 'Gutes Konformitaetsniveau — Optimierungen empfohlen' : 'Good compliance level — optimisations recommended')
                : complianceRate >= 40 ? (de ? 'Teilweise konform — signifikante Luecken vorhanden' : 'Partially compliant — significant gaps exist')
                : (de ? 'Kritische Luecken — sofortiger Handlungsbedarf' : 'Critical gaps — immediate action required')}
            </div>
          </div>
          <ChartCard title={de ? 'Anforderungs-Status' : 'Requirement Status'} subtitle={de ? 'Alle geprueften DORA-Anforderungen mit aktuellem Bewertungsstatus.' : 'All assessed DORA requirements with their current evaluation status.'}>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {reqs.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'pass' ? 'bg-green-500' : r.status === 'partial' ? 'bg-yellow-500' : 'bg-destructive'}`} />
                  <span className="font-mono text-xs text-muted-foreground w-12 flex-shrink-0">{r.article}</span>
                  <span className="flex-1 text-foreground truncate">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'pass' ? 'bg-green-500/10 text-green-500' : r.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-destructive/10 text-destructive'}`}>
                    {r.status === 'pass' ? (de ? 'OK' : 'PASS') : r.status === 'partial' ? (de ? 'TEIL' : 'PART') : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ═══ GAPS / ACTION PLAN ═══ */}
      {activeTab === 'gaps' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard value={reqs.filter(r => r.status !== 'pass').length} label={de ? 'Offene Punkte' : 'Open Items'} color="text-foreground" />
            <KpiCard value={reqs.filter(r => r.priority === 'P0').length} label={de ? 'Sofort (P0)' : 'Immediate (P0)'} color="text-destructive" />
            <KpiCard value={`${totalEffort.min}-${totalEffort.max}`} label={de ? 'Aufwand (Std.)' : 'Effort (hrs)'} color="text-foreground" />
            <KpiCard value={reqs.filter(r => r.status === 'fail').length} label={de ? 'Nicht erfuellt' : 'Failed'} color="text-destructive" />
          </div>

          {/* ═══ GANTT CHART ═══ */}
          <ChartCard title={de ? 'Umsetzungs-Roadmap' : 'Remediation Roadmap'} subtitle={de ? 'Zeitlicher Ablauf aller offenen Massnahmen als Wasserfall-Darstellung. Fahren Sie mit der Maus ueber einen Balken fuer Details.' : 'Timeline of all open measures as a waterfall view. Hover over a bar for details.'}>
            <GanttChart reqs={reqs} de={de} />
          </ChartCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={de ? 'Prioritaetsverteilung' : 'Priority Distribution'} subtitle={de ? 'Anteil der offenen Massnahmen nach Dringlichkeitsstufe (P0 = sofort, P3 = langfristig).' : 'Share of open measures by urgency level (P0 = immediate, P3 = long-term).'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={gapPriority} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} strokeWidth={0}>{gapPriority.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">{gapPriority.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name} ({d.label}): <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </ChartCard>
            <ChartCard title={de ? 'Luecken nach Prioritaet' : 'Gaps by Priority'}>
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {reqs.filter(r => r.status !== 'pass').sort((a, b) => (a.priority || 'P2').localeCompare(b.priority || 'P2')).map(r => (
                  <div key={r.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-secondary/30 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-bold font-mono flex-shrink-0 ${r.priority === 'P0' ? 'bg-destructive/10 text-destructive' : r.priority === 'P1' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-500'}`}>{r.priority || 'P2'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{r.article}: {r.name}</div>
                      {r.gap && <div className="text-muted-foreground mt-0.5 line-clamp-2">{r.gap}</div>}
                    </div>
                    {r.effort && <span className="text-muted-foreground font-mono flex-shrink-0">{r.effort}</span>}
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
