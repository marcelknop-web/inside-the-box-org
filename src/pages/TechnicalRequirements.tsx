import { PageLayout } from '@/components/PageLayout';
import { ServiceCard } from '@/components/ServiceCard';
import { PageNavButtons } from '@/components/PageNavButtons';
import { Monitor, Network, Wifi, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PortResult {
  port: number;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
}

const DEFAULT_HOST = 'cyberrange.inside-the-box.org';

const PORT_GROUPS = [
  { label: 'RDP (Training)', ports: Array.from({ length: 21 }, (_, i) => 7000 + i) },
  { label: 'HTTPS', ports: [443] },
];

const TechnicalRequirements = () => {
  const [host, setHost] = useState(DEFAULT_HOST);
  const [results, setResults] = useState<PortResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    const allPorts = PORT_GROUPS.flatMap((g) => g.ports);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-ports', {
        body: { host, ports: allPorts, timeout: 5000 },
      });

      if (fnError) throw fnError;
      setResults(data.results as PortResult[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const getGroupResults = (ports: number[]) =>
    results?.filter((r) => ports.includes(r.port)) ?? [];

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
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 w-full">
                  <label htmlFor="host" className="block text-sm font-mono text-muted-foreground mb-1">
                    Target Host
                  </label>
                  <input
                    id="host"
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={runCheck}
                  disabled={loading || !host.trim()}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded font-mono text-sm hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
                  ) : (
                    <><Wifi className="w-4 h-4" /> Run Test</>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-destructive font-mono text-sm">{error}</p>
              )}

              {results && (
                <div className="space-y-4 pt-2">
                  {PORT_GROUPS.map((group) => {
                    const groupResults = getGroupResults(group.ports);
                    const reachable = groupResults.filter((r) => r.reachable).length;
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
                              title={r.reachable ? `${r.latencyMs}ms` : r.error}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${
                                r.reachable
                                  ? 'border-green-500/30 bg-green-500/10 text-green-500'
                                  : 'border-destructive/30 bg-destructive/10 text-destructive'
                              }`}
                            >
                              {r.reachable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {r.port}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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