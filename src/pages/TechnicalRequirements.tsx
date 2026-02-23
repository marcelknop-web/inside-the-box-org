import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { SystemCheck } from '@/components/SystemCheck';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';
import { Monitor, Network, Wifi, CheckCircle, XCircle, Loader2, HelpCircle } from 'lucide-react';
import { useState, useCallback } from 'react';

interface PortResult {
  port: number;
  status: 'reachable' | 'blocked' | 'uncertain';
  latencyMs?: number;
}

const HOST = 'portquiz.net';
const TIMEOUT_MS = 12000;

const PORT_GROUPS = [
  { label: 'RDP (Training)', ports: Array.from({ length: 21 }, (_, i) => 7000 + i) },
  { label: 'HTTPS', ports: [443] },
];

function probePort(host: string, port: number, timeoutMs: number): Promise<PortResult> {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    let settled = false;
    const settle = (status: PortResult['status']) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      img.src = '';
      resolve({ port, status, latencyMs: Math.round(performance.now() - start) });
    };
    const timer = setTimeout(() => settle('blocked'), timeoutMs);
    img.onload = () => settle('reachable');
    img.onerror = () => {
      const elapsed = performance.now() - start;
      settle(elapsed < 5000 ? 'reachable' : 'blocked');
    };
    img.src = `http://${host}:${port}/?cachebust=${Date.now()}-${port}`;
  });
}

const TechnicalRequirements = () => {
  const { t, language } = useLanguage();
  const [results, setResults] = useState<PortResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const systemItems = language === 'de'
    ? ['Moderner Computer (Windows/Mac/Linux)', 'Mindestens 8GB RAM', 'Stabile Internetverbindung (10+ Mbps)', 'Mindestauflösung 1024x768', 'RDP-Client installiert']
    : ['Modern computer (Windows/Mac/Linux)', '8GB RAM minimum', 'Stable internet (10+ Mbps)', '1024x768 resolution minimum', 'RDP client installed'];

  const networkItems = language === 'de'
    ? ['RDP: 7000-7020/TCP ausgehend', 'HTTPS: 443/TCP ausgehend', 'Keine eingehenden Internetverbindungen erforderlich', 'Konnektivität vorab testen', 'Backup-Kommunikation bereithalten']
    : ['RDP: 7000-7020/TCP outbound', 'HTTPS: 443/TCP outbound', 'No inbound internet connections required', 'Test connectivity beforehand', 'Backup communication ready'];

  const runCheck = useCallback(async () => {
    setLoading(true);
    setResults(null);
    const allPorts = PORT_GROUPS.flatMap((g) => g.ports);
    setProgress({ done: 0, total: allPorts.length });
    const collected: PortResult[] = [];
    for (let i = 0; i < allPorts.length; i += 5) {
      const batch = allPorts.slice(i, i + 5);
      const batchResults = await Promise.all(batch.map((p) => probePort(HOST, p, TIMEOUT_MS)));
      collected.push(...batchResults);
      setProgress({ done: collected.length, total: allPorts.length });
    }
    setResults([...collected]);
    setLoading(false);
  }, []);

  const getGroupResults = (ports: number[]) => results?.filter((r) => ports.includes(r.port)) ?? [];

  const statusIcon = (status: PortResult['status']) => {
    switch (status) {
      case 'reachable': return <CheckCircle className="w-3 h-3" />;
      case 'blocked': return <XCircle className="w-3 h-3" />;
      case 'uncertain': return <HelpCircle className="w-3 h-3" />;
    }
  };

  const statusClass = (status: PortResult['status']) => {
    switch (status) {
      case 'reachable': return 'border-green-500/30 bg-green-500/10 text-green-500';
      case 'blocked': return 'border-destructive/30 bg-destructive/10 text-destructive';
      case 'uncertain': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500';
    }
  };

  return (
    <PageLayout>
      <div className="space-y-8">
        <h1 className="text-primary text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-12">
          {t('techReq.title')}
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">{t('techReq.intro')}</p>
          
          <div className="space-y-6">
            <h2 className="text-primary text-2xl font-bold font-mono mb-6">{t('techReq.requirements')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard icon={Monitor} title={t('techReq.systemTitle')} description={t('techReq.systemDesc')}>
                <ul className="text-base text-foreground space-y-2 mt-4">
                  {systemItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="flex-shrink-0">•</span><span>{item}</span></li>
                  ))}
                </ul>
              </ServiceCard>
              
              <ServiceCard icon={Network} title={t('techReq.networkTitle')} description={t('techReq.networkDesc')}>
                <ul className="text-base text-foreground space-y-2 mt-4">
                  {networkItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="flex-shrink-0">•</span><span className="font-mono">{item}</span></li>
                  ))}
                </ul>
              </ServiceCard>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-highlight text-2xl font-bold font-mono mb-6">{t('techReq.systemCheckTitle')}</h2>
            <SystemCheck />
            <ServiceCard icon={Wifi} title={t('techReq.connectivityTitle')} variant="highlight" description={t('techReq.connectivityDesc')}>
              <div className="mt-4 space-y-4">
                <button onClick={runCheck} disabled={loading} className="flex items-center gap-2 bg-highlight text-highlight-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap">
                  {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> {t('techReq.testing')}</>) : (<><Wifi className="w-4 h-4" /> {t('techReq.runTest')}</>)}
                </button>

                {loading && (
                  <div className="space-y-2">
                    <Progress value={(progress.done / progress.total) * 100} className="h-2" />
                    <p className="text-sm font-mono text-muted-foreground">{progress.done}/{progress.total} {t('techReq.portsChecked')}</p>
                  </div>
                )}

                {results && (
                  <div className="space-y-4 pt-2">
                    {PORT_GROUPS.map((group) => {
                      const groupResults = getGroupResults(group.ports);
                      const reachable = groupResults.filter((r) => r.status === 'reachable').length;
                      const total = groupResults.length;
                      return (
                        <div key={group.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-base text-foreground font-semibold">{group.label}</span>
                            <span className={`font-mono text-base ${reachable === total ? 'text-green-500' : reachable > 0 ? 'text-yellow-500' : 'text-destructive'}`}>
                              {reachable}/{total} {t('techReq.reachable')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {groupResults.map((r) => (
                              <span key={r.port} title={`${r.latencyMs}ms – ${r.status}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${statusClass(r.status)}`}>
                                {statusIcon(r.status)} {r.port}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {results.every((r) => r.status === 'reachable') ? (
                      <div className="flex items-start gap-2 mt-3 p-3 rounded border border-green-500/30 bg-green-500/10 text-green-500">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-base font-sans">{t('techReq.allPortsOk')}</p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 mt-3 p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                        <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-base font-sans">{t('techReq.someBlocked')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ServiceCard>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: t('techReq.backToTraining') },
            { href: '/contact', label: t('nav.contact'), variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default TechnicalRequirements;
