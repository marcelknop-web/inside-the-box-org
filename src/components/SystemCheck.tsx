import { useState, useCallback } from 'react';
import { ServiceCard } from '@/components/ServiceCard';
import { Monitor, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface SystemCheckResult {
  label: string;
  status: 'pass' | 'fail' | 'unknown';
  detail: string;
}

function runSystemChecks(t: (key: string) => string): SystemCheckResult[] {
  const results: SystemCheckResult[] = [];

  // 1. OS check
  const ua = navigator.userAgent;
  const isWindows = /Windows/.test(ua);
  const isMac = /Macintosh|Mac OS/.test(ua);
  const isLinux = /Linux/.test(ua) && !/Android/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod/.test(ua);
  const osName = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isMobile ? 'Mobile Device' : 'Unknown';
  results.push({
    label: t('techReq.sysCheckLabelOS'),
    status: isMobile ? 'fail' : (isWindows || isMac || isLinux) ? 'pass' : 'unknown',
    detail: isMobile ? `${osName} — ${t('techReq.sysCheckMobileFail')}` : osName,
  });

  // 2. Screen resolution
  const logicalW = window.screen.width;
  const logicalH = window.screen.height;
  const minOk = logicalW >= 1024 && logicalH >= 768;
  results.push({
    label: t('techReq.sysCheckLabelScreen'),
    status: minOk ? 'pass' : 'fail',
    detail: `${logicalW}×${logicalH}${minOk ? '' : ` (${t('techReq.sysCheckMinRes')})`}`,
  });

  // 3. Browser check
  const isChrome = /Chrome\//.test(ua) && !/Edge/.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome/.test(ua);
  const isEdge = /Edg\//.test(ua);
  const browserName = isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown';
  results.push({
    label: t('techReq.sysCheckLabelBrowser'),
    status: (isChrome || isFirefox || isSafari || isEdge) ? 'pass' : 'unknown',
    detail: browserName,
  });

  return results;
}

const statusIcon = (status: SystemCheckResult['status']) => {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
    case 'fail':
      return <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />;
    default:
      return <HelpCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
  }
};

export const SystemCheck = () => {
  const { t, language } = useLanguage();
  const [results, setResults] = useState<SystemCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setResults(runSystemChecks(t));
      setLoading(false);
    }, 800);
  }, [t]);

  const allPass = results?.every((r) => r.status === 'pass');
  const anyFail = results?.some((r) => r.status === 'fail');

  return (
    <ServiceCard
      icon={Monitor}
      title={t('techReq.sysCheckCardTitle')}
      variant="highlight"
      description={t('techReq.sysCheckCardDesc')}
    >
      <div className="mt-4 space-y-4">
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 bg-highlight text-highlight-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {t('techReq.sysCheckRunning')}</>
          ) : (
            <><Monitor className="w-4 h-4" /> {t('techReq.sysCheckRunBtn')}</>
          )}
        </button>

        {results && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-base text-foreground font-semibold">{t('techReq.sysCheckCardTitle')}</span>
              <span className={`font-mono text-base ${allPass ? 'text-green-500' : anyFail ? 'text-destructive' : 'text-yellow-500'}`}>
                {results.filter(r => r.status === 'pass').length}/{results.length} {language === 'de' ? 'bestanden' : language === 'fr' ? 'réussi' : 'passed'}
              </span>
            </div>
            {results.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                {statusIcon(r.status)}
                <div>
                  <span className="font-mono text-sm text-foreground font-semibold">{r.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">{r.detail}</span>
                </div>
              </div>
            ))}

            {allPass ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-green-500/30 bg-green-500/10 text-green-500">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-base font-sans">
                  {t('techReq.sysCheckAllPass')}
                </p>
              </div>
            ) : anyFail ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-base font-sans">
                  {t('techReq.sysCheckSomeFail')}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
                <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-base font-sans">
                  {t('techReq.sysCheckUnknown')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ServiceCard>
  );
};
