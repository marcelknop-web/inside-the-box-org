import { useState, useCallback } from 'react';
import { ServiceCard } from '@/components/ServiceCard';
import { Monitor, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';

interface SystemCheckResult {
  label: string;
  status: 'pass' | 'fail' | 'unknown';
  detail: string;
}

function runSystemChecks(): SystemCheckResult[] {
  const results: SystemCheckResult[] = [];

  // 1. OS check
  const ua = navigator.userAgent;
  const isWindows = /Windows/.test(ua);
  const isMac = /Macintosh|Mac OS/.test(ua);
  const isLinux = /Linux/.test(ua) && !/Android/.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod/.test(ua);
  const osName = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isMobile ? 'Mobile Device' : 'Unknown';
  results.push({
    label: 'Operating System',
    status: isMobile ? 'fail' : (isWindows || isMac || isLinux) ? 'pass' : 'unknown',
    detail: isMobile ? `${osName} — a desktop OS is required for RDP` : osName,
  });

  // 2. Screen resolution (physical screen, not browser window)
  const w = window.screen.width * (window.devicePixelRatio || 1);
  const h = window.screen.height * (window.devicePixelRatio || 1);
  const logicalW = window.screen.width;
  const logicalH = window.screen.height;
  // RDP needs at least 1280×720 logical resolution; 1920×1080 recommended
  const minOk = logicalW >= 1280 && logicalH >= 720;
  const recommended = logicalW >= 1920 && logicalH >= 1080;
  results.push({
    label: 'Screen Resolution',
    status: recommended ? 'pass' : minOk ? 'pass' : 'fail',
    detail: `${logicalW}×${logicalH}${recommended ? '' : minOk ? ' (OK, 1920×1080 recommended)' : ' (minimum 1280×720 required)'}`,
  });

  // 3. Browser check – modern browser with sufficient capabilities
  const isChrome = /Chrome\//.test(ua) && !/Edge/.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome/.test(ua);
  const isEdge = /Edg\//.test(ua);
  const browserName = isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown';
  results.push({
    label: 'Browser',
    status: (isChrome || isFirefox || isSafari || isEdge) ? 'pass' : 'unknown',
    detail: browserName,
  });

  return results;
}

const statusIcon = (status: SystemCheckResult['status']) => {
  switch (status) {
    case 'pass': return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    case 'fail': return <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
    case 'unknown': return <HelpCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
  }
};

export const SystemCheck = () => {
  const [results, setResults] = useState<SystemCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setResults(runSystemChecks());
      setLoading(false);
    }, 400);
  }, []);

  const allPass = results?.every((r) => r.status === 'pass');
  const anyFail = results?.some((r) => r.status === 'fail');

  return (
    <ServiceCard
      icon={Monitor}
      title="System Check"
      variant="highlight"
      description="Checks your device against the basic requirements for RDP access: operating system, screen resolution, and browser compatibility."
    >
      <div className="mt-4 space-y-4">
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 bg-highlight text-highlight-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
          ) : (
            <><Monitor className="w-4 h-4" /> Run Check</>
          )}
        </button>

        {results && (
          <div className="space-y-3 pt-2">
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
                  All checks passed — your system meets the requirements for RDP access.
                </p>
              </div>
            ) : anyFail ? (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-base font-sans">
                  Some requirements are not met. Please review the items above.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 mt-3 p-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-500">
                <HelpCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-base font-sans">
                  Some values could not be determined. Please verify manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ServiceCard>
  );
};
