/**
 * Unified Quality Check Panel — shared across all compliance tools.
 * Renders QA verdict, progress bar, categorized checks, and fix log.
 */
import { memo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Wrench } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export interface QaCheckItem {
  id: string;
  category: string;
  label: string;
  detail: string;
  passed: boolean;
  severity: 'critical' | 'major' | 'minor';
}

export interface QaPanelResult {
  checks: QaCheckItem[];
  passed: number;
  failed: number;
  total: number;
  criticalErrors: number;
  verdict: 'passed' | 'conditional' | 'failed';
  verdictLabel: string;
}

interface QualityCheckPanelProps {
  result: QaPanelResult;
  fixLogs: string[];
  /** Category order + labels. Key = category id, value = display label */
  categories: Record<string, string>;
}

const QualityCheckPanel = memo(({ result, fixLogs, categories }: QualityCheckPanelProps) => {
  const { t } = useLanguage();
  const v = result.verdict;
  const pct = Math.round((result.passed / result.total) * 100);

  const borderCls = v === 'passed' ? 'border-green-500/40' : v === 'conditional' ? 'border-yellow-500/40' : 'border-destructive/40';
  const headerBg = v === 'passed' ? 'bg-green-500/10 border-green-500/20' : v === 'conditional' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-destructive/10 border-destructive/20';
  const barColor = v === 'passed' ? 'bg-green-500' : v === 'conditional' ? 'bg-yellow-500' : 'bg-destructive';
  const textColor = v === 'passed' ? 'text-green-500' : v === 'conditional' ? 'text-yellow-500' : 'text-destructive';

  return (
    <div className={`bg-card border-2 rounded-xl overflow-hidden ${borderCls}`}>
      {/* Header */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-2">
          {v === 'passed' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : v === 'conditional' ? <AlertTriangle className="w-5 h-5 text-yellow-500" /> : <XCircle className="w-5 h-5 text-destructive" />}
          <span className={`text-sm font-bold ${textColor}`}>{result.verdictLabel}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{result.passed}/{result.total}</span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4 text-sm">
        {/* Progress bar */}
        <div className="bg-secondary rounded-full h-2.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>

        {/* Categorized checks */}
        {Object.entries(categories).map(([catKey, catLabel]) => {
          const catChecks = result.checks.filter(c => c.category === catKey);
          if (catChecks.length === 0) return null;
          const catPassed = catChecks.filter(c => c.passed).length;
          return (
            <div key={catKey} className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground text-xs">{catLabel}</span>
                <span className="text-xs font-mono text-muted-foreground">{catPassed}/{catChecks.length}</span>
              </div>
              <div className="space-y-1">
                {catChecks.map(check => (
                  <div key={check.id} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 mt-0.5">{check.passed ? '✅' : '❌'}</span>
                    <div className="flex-1">
                      <span className={check.passed ? 'text-foreground' : 'text-destructive font-medium'}>{check.label}</span>
                      <span className="text-muted-foreground ml-1.5">— {check.detail}</span>
                    </div>
                    {!check.passed && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                        check.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                        check.severity === 'major' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {check.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Fix log */}
        {fixLogs.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-primary text-xs">{t('qa.autoFixTitle')}</span>
              <span className="text-xs font-mono text-muted-foreground ml-auto">{fixLogs.length} fixes</span>
            </div>
            <ul className="space-y-1 text-xs text-foreground">
              {fixLogs.map((f, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

QualityCheckPanel.displayName = 'QualityCheckPanel';

export default QualityCheckPanel;
