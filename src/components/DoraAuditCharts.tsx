/**
 * DORA Audit Dashboard — Interactive KPI charts for managers & auditors
 */
import { useMemo, useState, memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Legend,
} from 'recharts';
import type { DoraRisk, DoraReq } from '@/data/doraData';
import { RISK_CATEGORIES } from '@/data/doraData';
import { useLanguage } from '@/i18n/LanguageContext';

const RISK_COLORS = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_COLORS = { pass: '#22c55e', partial: '#eab308', fail: '#dc2626' };

const CAT_COLORS: Record<string, string> = { C: '#3b82f6', I: '#f97316', A: '#ef4444', G: '#a855f7', T: '#eab308', R: '#22c55e' };

type TabId = 'overview' | 'risks' | 'compliance' | 'gaps';

const KpiCard = memo(({ value, label, color, sub }: { value: string | number; label: string; color: string; sub?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-md">
    <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</div>
    {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
  </div>
));

const ChartCard = memo(({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{title}</h4>
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

  // Category Radar
  const catRadar = useMemo(() => {
    const cats = 'CIAGTR'.split('');
    return cats.map(c => {
      const catRisks = risks.filter(r => r.category === c);
      const catLabel = RISK_CATEGORIES[c]?.label[language] || c;
      return {
        category: catLabel,
        short: c,
        count: catRisks.length,
        avgScore: catRisks.length ? +(catRisks.reduce((a, r) => a + r.likelihood * r.impact, 0) / catRisks.length).toFixed(1) : 0,
        maxScore: catRisks.length ? Math.max(...catRisks.map(r => r.likelihood * r.impact)) : 0,
      };
    });
  }, [risks, language]);

  // Top risks bar
  const topRisks = useMemo(() =>
    [...risks].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)).slice(0, 8).map(r => ({
      name: `${r.category}-${String(r.id).padStart(3, '0')}`,
      score: r.likelihood * r.impact,
      color: r.likelihood * r.impact >= 20 ? RISK_COLORS.critical : r.likelihood * r.impact >= 13 ? RISK_COLORS.high : RISK_COLORS.medium,
      label: r.name.length > 35 ? r.name.slice(0, 32) + '...' : r.name,
    }))
  , [risks]);

  // Evidence quality
  const evidenceData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    risks.forEach(r => { buckets[r.evidenceQuality - 1]++; });
    return buckets.map((count, i) => ({
      name: `${i + 1}/5`,
      count,
      color: i >= 3 ? '#22c55e' : i >= 2 ? '#eab308' : '#dc2626',
    }));
  }, [risks]);

  // DORA Chapter compliance heatmap
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

  // Gap priority
  const gapPriority = useMemo(() => {
    const gaps = reqs.filter(r => r.status !== 'pass');
    const prios: Record<string, number> = {};
    gaps.forEach(r => { const p = r.priority || 'P2'; prios[p] = (prios[p] || 0) + 1; });
    return ['P0', 'P1', 'P2', 'P3'].filter(p => prios[p]).map(p => ({
      name: p,
      value: prios[p] || 0,
      color: p === 'P0' ? '#dc2626' : p === 'P1' ? '#f97316' : p === 'P2' ? '#eab308' : '#22c55e',
      label: p === 'P0' ? (de ? 'Sofort' : 'Immediate') : p === 'P1' ? (de ? 'Kurzfristig' : 'Short-term') : p === 'P2' ? (de ? 'Mittelfristig' : 'Medium-term') : (de ? 'Langfristig' : 'Long-term'),
    }));
  }, [reqs, de]);

  // Effort estimation
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
      {/* Tab Nav */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(tab => <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} onClick={() => setActiveTab(tab.id)} />)}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard value={risks.length} label={de ? 'IKT-Risiken' : 'ICT Risks'} color="text-foreground" sub={de ? 'identifiziert' : 'identified'} />
            <KpiCard value={critCount} label={de ? 'Kritisch' : 'Critical'} color="text-destructive" sub={`Score >= 20`} />
            <KpiCard value={`${complianceRate}%`} label={de ? 'DORA-Compliance' : 'DORA Compliance'} color={complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'} />
            <KpiCard value={failCount} label={de ? 'Offene Luecken' : 'Open Gaps'} color="text-destructive" sub={`${totalEffort.min}-${totalEffort.max}h`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={de ? 'Risikoverteilung' : 'Risk Distribution'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDist} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                    {riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">
                {riskDist.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: <span className="font-bold font-mono">{d.value}</span>
                  </span>
                ))}
              </div>
            </ChartCard>

            <ChartCard title={de ? 'DORA-Konformitaet' : 'DORA Compliance'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={complianceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                    {complianceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">
                {complianceData.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: <span className="font-bold font-mono">{d.value}</span>
                  </span>
                ))}
              </div>
            </ChartCard>
          </div>

          {/* Compliance by DORA Chapter */}
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
            {/* Category Radar */}
            <ChartCard title={de ? 'CIAGTR-Risikoprofil' : 'CIAGTR Risk Profile'}>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={catRadar}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="short" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name={de ? 'Anzahl' : 'Count'} dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={de ? 'Ø Score' : 'Avg Score'} dataKey="avgScore" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Evidence Quality */}
            <ChartCard title={de ? 'Evidenzqualitaet' : 'Evidence Quality'}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={evidenceData} margin={{ left: -15, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {evidenceData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top Risks */}
          <ChartCard title={de ? 'Hoechste Risiko-Scores' : 'Top Risk Scores'}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topRisks} layout="vertical" margin={{ left: 15, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 25]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontFamily: 'monospace' }} width={55} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _name: string, props: any) => [value, props.payload.label]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {topRisks.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ═══ COMPLIANCE ═══ */}
      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Compliance Scorecard */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{de ? 'Gesamt-Compliance-Score' : 'Overall Compliance Score'}</div>
            <div className="relative inline-flex items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                <circle
                  cx="70" cy="70" r="58" fill="none"
                  stroke={complianceRate >= 70 ? '#22c55e' : complianceRate >= 40 ? '#eab308' : '#dc2626'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(complianceRate / 100) * 364.4} 364.4`}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono ${complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{complianceRate}%</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-3">
              {complianceRate >= 70
                ? (de ? 'Gutes Konformitaetsniveau — Optimierungen empfohlen' : 'Good compliance level — optimisations recommended')
                : complianceRate >= 40
                  ? (de ? 'Teilweise konform — signifikante Luecken vorhanden' : 'Partially compliant — significant gaps exist')
                  : (de ? 'Kritische Luecken — sofortiger Handlungsbedarf' : 'Critical gaps — immediate action required')}
            </div>
          </div>

          {/* Requirement Status Table */}
          <ChartCard title={de ? 'Anforderungs-Status' : 'Requirement Status'}>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Distribution */}
            <ChartCard title={de ? 'Prioritaetsverteilung' : 'Priority Distribution'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={gapPriority} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} strokeWidth={0}>
                    {gapPriority.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">
                {gapPriority.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.label}): <span className="font-bold font-mono">{d.value}</span>
                  </span>
                ))}
              </div>
            </ChartCard>

            {/* Gap Detail List */}
            <ChartCard title={de ? 'Luecken nach Prioritaet' : 'Gaps by Priority'}>
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {reqs.filter(r => r.status !== 'pass').sort((a, b) => (a.priority || 'P2').localeCompare(b.priority || 'P2')).map(r => (
                  <div key={r.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-secondary/30 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-bold font-mono flex-shrink-0 ${r.priority === 'P0' ? 'bg-destructive/10 text-destructive' : r.priority === 'P1' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {r.priority || 'P2'}
                    </span>
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
