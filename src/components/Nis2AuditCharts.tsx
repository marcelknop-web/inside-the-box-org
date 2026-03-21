/**
 * NIS-2 Audit Dashboard — reuses DORA chart patterns with NIS-2 types
 */
import { useMemo, useState, memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend,
} from 'recharts';
import type { Nis2Risk, Nis2Req } from '@/data/nis2ComplianceData';
import { RISK_CATEGORIES } from '@/data/nis2ComplianceData';
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
  <button onClick={onClick} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all active:scale-[0.97] ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{label}</button>
));

const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' };

export function Nis2AuditCharts({ risks, reqs }: { risks: Nis2Risk[]; reqs: Nis2Req[] }) {
  const { language } = useLanguage();
  const de = language === 'de';
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
      { name: de ? 'Erfüllt' : 'Pass', value: p, color: STATUS_COLORS.pass },
      { name: de ? 'Teilweise' : 'Partial', value: pa, color: STATUS_COLORS.partial },
      { name: de ? 'Nicht erfüllt' : 'Fail', value: f, color: STATUS_COLORS.fail },
    ];
  }, [reqs, de]);

  const complianceRate = useMemo(() => {
    const total = reqs.length;
    if (!total) return 0;
    const score = reqs.reduce((acc, r) => acc + (r.status === 'pass' ? 1 : r.status === 'partial' ? 0.5 : 0), 0);
    return Math.round((score / total) * 100);
  }, [reqs]);

  const catRadar = useMemo(() => {
    return 'CIAGSR'.split('').map(c => {
      const catRisks = risks.filter(r => r.category === c);
      return {
        category: RISK_CATEGORIES[c]?.label[language] || c,
        count: catRisks.length,
        avgScore: catRisks.length ? +(catRisks.reduce((a, r) => a + r.likelihood * r.impact, 0) / catRisks.length).toFixed(1) : 0,
      };
    });
  }, [risks, language]);

  const topRisks = useMemo(() =>
    [...risks].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact)).slice(0, 8).map(r => {
      const s = r.likelihood * r.impact;
      const shortName = r.name.length > 28 ? r.name.slice(0, 25) + '…' : r.name;
      return { name: `${r.category}-${String(r.id).padStart(3, '0')}  ${shortName}`, score: s, color: s >= 20 ? RISK_COLORS.critical : s >= 13 ? RISK_COLORS.high : RISK_COLORS.medium, label: r.name };
    })
  , [risks]);

  const critCount = riskDist[0].value;
  const failCount = complianceData[2].value;
  const totalEffort = useMemo(() => {
    let minH = 0, maxH = 0;
    reqs.filter(r => r.effort).forEach(r => { const m = r.effort.match(/(\d+)\s*-\s*(\d+)/); if (m) { minH += parseInt(m[1]); maxH += parseInt(m[2]); } });
    return { min: minH, max: maxH };
  }, [reqs]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: de ? 'Übersicht' : 'Overview' },
    { id: 'risks', label: de ? 'Risikoanalyse' : 'Risk Analysis' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'gaps', label: de ? 'Maßnahmenplan' : 'Action Plan' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(tab => <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} onClick={() => setActiveTab(tab.id)} />)}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard value={risks.length} label={de ? 'Risiken' : 'Risks'} color="text-foreground" />
            <KpiCard value={critCount} label={de ? 'Kritisch' : 'Critical'} color="text-destructive" sub=">= 20" />
            <KpiCard value={`${complianceRate}%`} label="NIS-2 Compliance" color={complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'} />
            <KpiCard value={failCount} label={de ? 'Offene Lücken' : 'Open Gaps'} color="text-destructive" sub={`${totalEffort.min}-${totalEffort.max}h`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard title={de ? 'Risikoverteilung' : 'Risk Distribution'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={riskDist} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>{riskDist.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">{riskDist.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </ChartCard>
            <ChartCard title={de ? 'NIS-2-Konformität' : 'NIS-2 Compliance'}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={complianceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>{complianceData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-[11px] mt-1">{complianceData.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <ChartCard title={de ? 'CIAGSR-Risikoprofil' : 'CIAGSR Risk Profile'} subtitle={de ? 'Radardarstellung der sechs NIS-2-Risikokategorien.' : 'Radar view of six NIS-2 risk categories.'}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={catRadar}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name={de ? 'Anzahl' : 'Count'} dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={de ? 'Ø Score' : 'Avg Score'} dataKey="avgScore" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={de ? 'Höchste Risiko-Scores' : 'Top Risk Scores'}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topRisks} layout="vertical" margin={{ left: 15, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 25]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }} width={200} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number, _name: string, props: any) => [value, props.payload.label]} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>{topRisks.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{de ? 'NIS-2-Compliance-Score' : 'NIS-2 Compliance Score'}</div>
            <div className="relative inline-flex items-center justify-center">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
                <circle cx="70" cy="70" r="58" fill="none" stroke={complianceRate >= 70 ? '#22c55e' : complianceRate >= 40 ? '#eab308' : '#dc2626'} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(complianceRate / 100) * 364.4} 364.4`} transform="rotate(-90 70 70)" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono ${complianceRate >= 70 ? 'text-green-500' : complianceRate >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{complianceRate}%</span>
              </div>
            </div>
          </div>
          <ChartCard title={de ? 'Anforderungs-Status' : 'Requirement Status'}>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {reqs.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'pass' ? 'bg-green-500' : r.status === 'partial' ? 'bg-yellow-500' : 'bg-destructive'}`} />
                  <span className="font-mono text-xs text-muted-foreground w-12 flex-shrink-0">{r.article.split(' ')[1]}</span>
                  <span className="flex-1 text-foreground truncate">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'pass' ? 'bg-green-500/10 text-green-500' : r.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-destructive/10 text-destructive'}`}>
                    {r.status === 'pass' ? 'OK' : r.status === 'partial' ? (de ? 'TEIL' : 'PART') : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard value={reqs.filter(r => r.status !== 'pass').length} label={de ? 'Offene Punkte' : 'Open Items'} color="text-foreground" />
            <KpiCard value={reqs.filter(r => r.priority === 'P0').length} label="P0" color="text-destructive" />
            <KpiCard value={`${totalEffort.min}-${totalEffort.max}`} label={de ? 'Aufwand (Std.)' : 'Effort (hrs)'} color="text-foreground" />
            <KpiCard value={failCount} label={de ? 'Nicht erfüllt' : 'Failed'} color="text-destructive" />
          </div>
          <ChartCard title={de ? 'Lücken nach Priorität' : 'Gaps by Priority'}>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
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
      )}
    </div>
  );
}
