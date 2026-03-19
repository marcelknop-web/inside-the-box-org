/**
 * CRA Audit Charts — Professional visual representation of key audit findings
 */
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import type { Threat, CraReq } from '@/data/craData';
import { useLanguage } from '@/i18n/LanguageContext';

const RISK_COLORS = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STRIDE_COLORS: Record<string, string> = { S: '#a855f7', T: '#f97316', R: '#eab308', I: '#3b82f6', D: '#ef4444', E: '#f43f5e' };
const STATUS_COLORS = { pass: '#22c55e', partial: '#eab308', fail: '#dc2626' };

export function CraAuditCharts({ threats, reqs }: { threats: Threat[]; reqs: CraReq[] }) {
  const { t } = useLanguage();

  // ═══ STRIDE Radar ═══
  const strideData = useMemo(() => {
    const counts: Record<string, number> = {};
    'STRIDE'.split('').forEach(s => counts[s] = 0);
    threats.forEach(th => { counts[th.stride] = (counts[th.stride] || 0) + 1; });
    return Object.entries(counts).map(([key, count]) => ({
      category: key,
      count,
      fullMark: Math.max(...Object.values(counts), 4),
    }));
  }, [threats]);

  // ═══ Risk Distribution ═══
  const riskDist = useMemo(() => {
    const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
    threats.forEach(th => {
      const s = th.likelihood * th.impact;
      if (s >= 20) buckets.critical++;
      else if (s >= 13) buckets.high++;
      else if (s >= 6) buckets.medium++;
      else buckets.low++;
    });
    return [
      { name: t('cra.critical'), value: buckets.critical, color: RISK_COLORS.critical },
      { name: t('cra.high'), value: buckets.high, color: RISK_COLORS.high },
      { name: t('cra.medium'), value: buckets.medium, color: RISK_COLORS.medium },
      { name: t('cra.low'), value: buckets.low, color: RISK_COLORS.low },
    ];
  }, [threats, t]);

  // ═══ Compliance Status Donut ═══
  const complianceData = useMemo(() => {
    const p = reqs.filter(r => r.status === 'pass').length;
    const pa = reqs.filter(r => r.status === 'partial').length;
    const f = reqs.filter(r => r.status === 'fail').length;
    return [
      { name: t('cra.statusPass'), value: p, color: STATUS_COLORS.pass },
      { name: t('cra.statusPartial'), value: pa, color: STATUS_COLORS.partial },
      { name: t('cra.statusFail'), value: f, color: STATUS_COLORS.fail },
    ];
  }, [reqs, t]);

  // ═══ Evidence Quality Distribution ═══
  const evidenceData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 1-5 stars
    threats.forEach(th => { buckets[th.evidenceQuality - 1]++; });
    return buckets.map((count, i) => ({
      name: '★'.repeat(i + 1),
      count,
      color: i >= 3 ? '#22c55e' : i >= 2 ? '#eab308' : '#dc2626',
    }));
  }, [threats]);

  // ═══ Top Risks Bar ═══
  const topRisks = useMemo(() => {
    return [...threats]
      .sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact))
      .slice(0, 6)
      .map(th => ({
        name: `${th.stride}-${String(th.id).padStart(3, '0')}`,
        score: th.likelihood * th.impact,
        color: th.likelihood * th.impact >= 20 ? RISK_COLORS.critical : th.likelihood * th.impact >= 13 ? RISK_COLORS.high : RISK_COLORS.medium,
      }));
  }, [threats]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* STRIDE Radar */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">STRIDE {t('cra.tmDistribution') || 'Distribution'}</h4>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={strideData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="category" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
              <Radar name="Threats" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Donut */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">CRA {t('cra.cmReadiness') || 'Compliance'}</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={complianceData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                {complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => [value, '']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-1">
            {complianceData.map(d => (
              <span key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                {d.name}: <span className="font-bold font-mono">{d.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Top Risks */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Top Risk Scores</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topRisks} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 25]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontFamily: 'monospace' }} width={55} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {topRisks.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evidence Quality */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">{t('cra.tmEvidence') || 'Evidence'} Quality</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={evidenceData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {evidenceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
