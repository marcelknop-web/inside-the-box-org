/**
 * Nis2FindingsView — Findings and fixes visualization for NIS-2 audit
 */
import { useMemo, memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import type { Nis2Risk, Nis2Req } from '@/data/nis2ComplianceData';
import type { QaResult } from '@/utils/nis2QualityCheck';
import { useLanguage } from '@/i18n/LanguageContext';
import { CheckCircle2, XCircle, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS = { critical: '#dc2626', major: '#f97316', minor: '#eab308' };
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,.15)' };

const Card = memo(({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</h4>
    {subtitle && <p className="text-[11px] text-muted-foreground/70 mb-4 leading-relaxed">{subtitle}</p>}
    {!subtitle && <div className="mb-3" />}
    {children}
  </div>
));

interface Props {
  risks: Nis2Risk[];
  reqs: Nis2Req[];
  qaResult: QaResult;
  preFixChecks: QaResult['checks'] | null;
  fixLog: string[];
  fixesApplied: boolean;
}

export function Nis2FindingsView({ qaResult, preFixChecks, fixLog, fixesApplied, reqs, risks }: Props) {
  const { language } = useLanguage();
  const de = language === 'de';

  const failedChecks = useMemo(() => qaResult.checks.filter(c => !c.passed), [qaResult]);
  const originalFailed = useMemo(() => preFixChecks ? preFixChecks.filter(c => !c.passed) : failedChecks, [preFixChecks, failedChecks]);

  const severityData = useMemo(() => {
    const counts = { critical: 0, major: 0, minor: 0 };
    originalFailed.forEach(c => counts[c.severity]++);
    return [
      { name: de ? 'Kritisch' : 'Critical', value: counts.critical, color: SEVERITY_COLORS.critical },
      { name: de ? 'Wesentlich' : 'Major', value: counts.major, color: SEVERITY_COLORS.major },
      { name: de ? 'Geringfügig' : 'Minor', value: counts.minor, color: SEVERITY_COLORS.minor },
    ].filter(d => d.value > 0);
  }, [originalFailed, de]);

  const CATEGORY_LABELS: Record<string, string> = {
    consistency: de ? 'Konsistenz' : 'Consistency', technical: de ? 'Fachlich' : 'Technical',
    evidence: de ? 'Evidenz' : 'Evidence', editorial: de ? 'Redaktionell' : 'Editorial',
    regulatory: de ? 'Regulatorisch' : 'Regulatory', 'golden-rule': de ? 'Goldene Regeln' : 'Golden Rules',
  };

  const categoryData = useMemo(() => {
    const cats: Record<string, { found: number; fixed: number }> = {};
    originalFailed.forEach(c => { if (!cats[c.category]) cats[c.category] = { found: 0, fixed: 0 }; cats[c.category].found++; });
    if (fixesApplied) { originalFailed.forEach(c => { const stillFailed = failedChecks.find(f => f.id === c.id); if (!stillFailed) cats[c.category].fixed++; }); }
    return Object.entries(cats).map(([cat, d]) => ({
      name: CATEGORY_LABELS[cat] || cat,
      [de ? 'Befunde' : 'Findings']: d.found,
      ...(fixesApplied ? { [de ? 'Behoben' : 'Fixed']: d.fixed } : {}),
    }));
  }, [originalFailed, failedChecks, fixesApplied, de]);

  const beforeCount = originalFailed.length;
  const afterCount = failedChecks.length;
  const fixedCount = beforeCount - afterCount;
  const beforeRate = qaResult.total > 0 ? Math.round(((qaResult.total - beforeCount) / qaResult.total) * 100) : 100;
  const afterRate = qaResult.total > 0 ? Math.round((qaResult.passed / qaResult.total) * 100) : 100;

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        {de ? 'Prüfungsergebnisse — Befunde und Korrekturen' : 'Audit Results — Findings and Corrections'}
      </div>

      {fixesApplied ? (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono text-destructive">{beforeCount}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Befunde (vorher)' : 'Findings (before)'}</div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono text-primary">{fixedCount}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Behoben' : 'Fixed'}</div>
          </div>
          <div className={`border rounded-xl p-4 text-center ${afterCount > 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
            <div className={`text-2xl font-bold font-mono ${afterCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{afterCount}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Verbleibend' : 'Remaining'}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-mono text-muted-foreground">{beforeRate}%</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
              <span className={`text-lg font-bold font-mono ${afterRate >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{afterRate}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Qualitäts-Score' : 'Quality Score'}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold font-mono text-destructive">{beforeCount}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Befunde' : 'Findings'}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold font-mono text-foreground">{qaResult.passed}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Bestanden' : 'Passed'}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${beforeRate >= 70 ? 'text-green-500' : beforeRate >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{beforeRate}%</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-medium">{de ? 'Qualität' : 'Quality'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title={de ? 'Befunde nach Schweregrad' : 'Findings by Severity'}>
          {severityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={severityData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} strokeWidth={0}>{severityData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-[11px]">{severityData.map(d => (<span key={d.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}: <span className="font-bold font-mono">{d.value}</span></span>))}</div>
            </>
          ) : <div className="text-center text-green-500 py-8 text-sm font-medium">{de ? 'Keine Befunde' : 'No findings'}</div>}
        </Card>
        <Card title={de ? 'Befunde nach Kategorie' : 'Findings by Category'}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey={de ? 'Befunde' : 'Findings'} fill="#dc2626" radius={[4, 4, 0, 0]} />
              {fixesApplied && <Bar dataKey={de ? 'Behoben' : 'Fixed'} fill="#22c55e" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {fixesApplied && (
        <Card title={de ? 'Qualitätsverbesserung' : 'Quality Improvement'}>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">{de ? 'Vor Korrektur' : 'Before'}</span><span className="text-xs font-mono text-muted-foreground">{beforeRate}%</span></div>
              <div className="bg-secondary rounded-full h-3 overflow-hidden"><div className="h-full rounded-full bg-destructive/60" style={{ width: `${beforeRate}%` }} /></div>
            </div>
            <div className="flex justify-center"><TrendingUp className="w-4 h-4 text-primary" /></div>
            <div>
              <div className="flex items-center justify-between mb-1"><span className="text-xs text-foreground font-semibold">{de ? 'Nach Korrektur' : 'After'}</span><span className="text-xs font-bold font-mono text-primary">{afterRate}%</span></div>
              <div className="bg-secondary rounded-full h-3 overflow-hidden"><div className={`h-full rounded-full ${afterRate >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${afterRate}%` }} /></div>
            </div>
          </div>
        </Card>
      )}

      <Card title={de ? 'Einzelbefunde' : 'Individual Findings'}>
        <div className="space-y-2 max-h-[350px] overflow-y-auto">
          {originalFailed.map(check => {
            const wasFixed = fixesApplied && !failedChecks.find(f => f.id === check.id);
            return (
              <div key={check.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${wasFixed ? 'bg-green-500/5 border-green-500/20' : 'bg-destructive/5 border-destructive/15'}`}>
                <div className="flex-shrink-0 mt-0.5">{wasFixed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-destructive" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground">{check.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${check.severity === 'critical' ? 'bg-destructive/10 text-destructive' : check.severity === 'major' ? 'bg-orange-500/10 text-orange-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {check.severity.toUpperCase()}
                    </span>
                    {wasFixed && <span className="text-[10px] text-green-500 font-bold">✓ {de ? 'BEHOBEN' : 'FIXED'}</span>}
                  </div>
                  <div className="text-xs text-foreground mt-1 font-medium">{check.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{check.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
