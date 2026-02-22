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
  const osName = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : 'Unknown';
  results.push({
    label: 'Operating System',
    status: isWindows || isMac || isLinux ? 'pass' : 'unknown',
    detail: osName,
  });

  // 2. RAM check (navigator.deviceMemory – Chrome/Edge only)
  const mem = (navigator as any).deviceMemory as number | undefined;
  if (mem !== undefined) {
    results.push({
      label: 'RAM',
      status: mem >= 8 ? 'pass' : 'fail',
      detail: `${mem} GB detected${mem < 8 ? ' (minimum 8 GB)' : ''}`,
    });
  } else {
    results.push({
      label: 'RAM',
      status: 'unknown',
      detail: 'Not detectable in this browser',
    });
  }

  // 3. Screen resolution
  const w = window.screen.width;
  const h = window.screen.height;
  const resOk = w >= 1920 && h >= 1080;
  results.push({
    label: 'Screen Resolution',
    status: resOk ? 'pass' : 'fail',
    detail: `${w}×${h}${!resOk ? ' (minimum 1920×1080)' : ''}`,
  });

  // 4. Internet speed estimate (navigator.connection – Chrome/Edge only)
  const conn = (navigator as any).connection as { downlink?: number } | undefined;
  if (conn?.downlink !== undefined) {
    const mbps = conn.downlink;
    results.push({
      label: 'Internet Speed',
      status: mbps >= 10 ? 'pass' : mbps >= 5 ? 'unknown' : 'fail',
      detail: `~${mbps} Mbps${mbps < 10 ? ' (minimum 10 Mbps recommended)' : ''}`,
    });
  } else {
    results.push({
      label: 'Internet Speed',
      status: 'unknown',
      detail: 'Not detectable in this browser',
    });
  }

  // 5. RDP client – cannot be checked from browser
  results.push({
    label: 'RDP Client',
    status: 'unknown',
    detail: 'Please verify manually that an RDP client is installed',
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
    // Small delay so the spinner is visible
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
      description="Checks your device against the minimum system requirements: operating system, RAM, screen resolution, and internet speed. Some values may not be detectable in all browsers."
    >
      <div className="mt-4 space-y-4">
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
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
                  All checks passed — your system meets the requirements.
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
                  Some values could not be detected. Please verify manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ServiceCard>
  );
};
