import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Monitor, Network, Wifi, CheckCircle, XCircle, Loader2, HelpCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PortResult {
  port: number;
  status: 'reachable' | 'blocked' | 'uncertain';
  latencyMs?: number;
  error?: string;
}

const DEFAULT_HOST = 'portquiz.net';

const PORT_GROUPS = [
  { label: 'RDP (Training)', ports: Array.from({ length: 21 }, (_, i) => 7000 + i) },
  { label: 'HTTPS', ports: [443] },
];


const TechnicalRequirements = () => {
  const host = DEFAULT_HOST;
  const [results, setResults] = useState<PortResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const runCheck = useCallback(async () => {
    setLoading(true);
    setResults(null);

    const allPorts = PORT_GROUPS.flatMap((g) => g.ports);
    setProgress({ done: 0, total: allPorts.length });

    try {
      const { data, error } = await supabase.functions.invoke('check-ports', {
        body: { host, ports: allPorts, timeout: 5000 },
      });

      if (error) throw error;

      const mapped: PortResult[] = (data.results as Array<{ port: number; reachable: boolean; latencyMs?: number; error?: string }>).map(
        (r) => ({
          port: r.port,
          status: r.reachable ? 'reachable' as const : 'blocked' as const,
          latencyMs: r.latencyMs,
          error: r.error,
        })
      );
      setResults(mapped);
    } catch (e: unknown) {
      setResults(allPorts.map((p) => ({ port: p, status: 'uncertain' as const })));
    } finally {
      setProgress({ done: allPorts.length, total: allPorts.length });
      setLoading(false);
    }
  }, []);

  const getGroupResults = (ports: number[]) =>
    results?.filter((r) => ports.includes(r.port)) ?? [];

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
          Technical Requirements
        </h1>
        
        <div className="space-y-8 text-foreground leading-relaxed">
          <p className="text-lg font-sans mb-8">
            Training takes place in a virtual environment. 
            Participants connect via RDP from their own devices.
          </p>
          
          <div className="space-y-6">
            <h2 className="text-primary text-2xl font-bold font-mono mb-6">
              Requirements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ServiceCard
                icon={Monitor}
                title="System"
                description="Hardware and software requirements for training participation."
              >
                <ul className="text-base text-foreground space-y-2 mt-4">
                  <li className="pl-4 -indent-4">• Modern computer (Windows/Mac/Linux)</li>
                  <li className="pl-4 -indent-4">• 8GB RAM minimum</li>
                  <li className="pl-4 -indent-4">• Stable internet (10+ Mbps)</li>
                  <li className="pl-4 -indent-4">• 1920x1080 resolution</li>
                  <li className="pl-4 -indent-4">• RDP client installed</li>
                </ul>
              </ServiceCard>
              
              <ServiceCard
                icon={Network}
                title="Network"
                description="Network connectivity and port requirements for training access."
              >
                <ul className="text-base text-foreground space-y-2 mt-4">
                  <li className="pl-4 -indent-4">• <span className="font-mono">RDP: 7000-7020/TCP outbound</span></li>
                  <li className="pl-4 -indent-4">• <span className="font-mono">HTTPS: 443/TCP outbound</span></li>
                  <li className="pl-4 -indent-4">• No inbound internet connections required</li>
                  <li className="pl-4 -indent-4">• Test connectivity beforehand</li>
                  <li className="pl-4 -indent-4">• Backup communication ready</li>
                </ul>
              </ServiceCard>
            </div>
          </div>

          {/* Connectivity Check */}
          <div className="space-y-6">
            <h2 className="text-primary text-2xl font-bold font-mono mb-6">
              Connectivity Check
            </h2>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <p className="text-sm text-muted-foreground font-sans">
                Prüft ob die benötigten TCP-Ports (RDP 7000–7020, HTTPS 443) von unserem Server aus erreichbar sind.
                Der Test verbindet sich mit <span className="font-mono">portquiz.net</span>, einem öffentlichen Dienst der auf allen TCP-Ports antwortet.
              </p>

              <button
                onClick={runCheck}
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
                ) : (
                  <><Wifi className="w-4 h-4" /> Run Test</>
                )}
              </button>

              {results && (
                <div className="space-y-4 pt-2">
                  {PORT_GROUPS.map((group) => {
                    const groupResults = getGroupResults(group.ports);
                    const reachable = groupResults.filter((r) => r.status === 'reachable').length;
                    const total = groupResults.length;

                    return (
                      <div key={group.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold">{group.label}</span>
                          <span className={`font-mono text-sm ${reachable === total ? 'text-green-500' : reachable > 0 ? 'text-yellow-500' : 'text-destructive'}`}>
                            {reachable}/{total} reachable
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {groupResults.map((r) => (
                            <span
                              key={r.port}
                              title={`${r.latencyMs}ms – ${r.status}`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${statusClass(r.status)}`}
                            >
                              {statusIcon(r.status)}
                              {r.port}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-xs text-muted-foreground mt-2">
                    <HelpCircle className="w-3 h-3 inline mr-1" />
                    Tests TCP connectivity to <span className="font-mono">portquiz.net</span> from our server.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <PageNavButtons buttons={[
            { href: '/training', label: 'Back to Training' },
            { href: '/contact', label: 'Contact', variant: 'highlight' },
          ]} />
        </div>
      </div>
    </PageLayout>
  );
};

export default TechnicalRequirements;
