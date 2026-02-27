import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Brain, History, Plus, Trash2, Sparkles, RotateCcw, ChevronDown, Calendar } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface IscpEntry {
  id: string;
  name: string;
  bi: number; tlt: number; cp: number; af: number; pi: number;
  maturity: 1 | 2 | 3;
  lastTested: string; // ISO date or ''
}

interface TtxSession {
  id: string;
  date: string;
  iscps: { name: string; maturity: number; result: 'passed' | 'findings' }[];
  notes: string;
}

// ── Constants ──────────────────────────────────────────────────
const DEFAULT_ISCPS: string[] = [
  'Active Directory', 'Azure Hosting Services', 'Client Systems', 'DNS',
  'Exchange Online + Email-Transport', 'Firewall', 'Identity Management (IAM)',
  'Intune', 'MFA', 'Microsoft Teams', 'PAM360 + IT-Jump-Host',
  'PKI Certificate', 'Proxy-Services', 'SD-WAN', 'SharePoint + OneDrive',
  'Switches', 'Virtualized-Infrastructure', 'Voice-Service', 'VPN-Gateway', 'WSUS',
];

const FACTOR_LABELS = ['BI', 'TLT', 'CP', 'AF', 'PI'] as const;
const FACTOR_FULL = {
  BI: 'Business Impact', TLT: 'Time Since Last Test',
  CP: 'Complexity', AF: 'Audit Findings', PI: 'Past Incidents',
};
const WEIGHTS = { bi: 0.30, tlt: 0.20, cp: 0.15, af: 0.15, pi: 0.20 };
const SCALE_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Critical'];
const MATURITY_LABELS: Record<number, string> = {
  1: 'Level 1 – Initial', 2: 'Level 2 – Medium', 3: 'Level 3 – Advanced',
};

const LS_KEY_ISCPS = 'iscp-ttx-iscps';
const LS_KEY_SESSIONS = 'iscp-ttx-sessions';

function calcScore(e: IscpEntry): number {
  return +(e.bi * WEIGHTS.bi + e.tlt * WEIGHTS.tlt + e.cp * WEIGHTS.cp + e.af * WEIGHTS.af + e.pi * WEIGHTS.pi).toFixed(2);
}

function scoreColor(s: number): string {
  if (s >= 3.5) return 'text-[#ef4444]';
  if (s >= 2.5) return 'text-[#f59e0b]';
  return 'text-[#22c55e]';
}
function scoreBg(s: number): string {
  if (s >= 3.5) return 'bg-[#ef4444]/15 border-[#ef4444]/30';
  if (s >= 2.5) return 'bg-[#f59e0b]/15 border-[#f59e0b]/30';
  return 'bg-[#22c55e]/15 border-[#22c55e]/30';
}

function genId() { return Math.random().toString(36).slice(2, 10); }

function makeDefault(): IscpEntry[] {
  return DEFAULT_ISCPS.map(name => ({
    id: genId(), name, bi: 3, tlt: 3, cp: 3, af: 2, pi: 2, maturity: 1 as const, lastTested: '',
  }));
}

// ── Select dropdown ────────────────────────────────────────────
function MiniSelect({ value, onChange, options, className = '' }: {
  value: number | string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-secondary border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground w-full pr-6 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function IspcTtxPrioritizer({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'scoring' | 'ai' | 'history'>('scoring');
  const [iscps, setIscps] = useState<IscpEntry[]>([]);
  const [sessions, setSessions] = useState<TtxSession[]>([]);
  const [newName, setNewName] = useState('');

  // AI state
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // History form
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionIscps, setSessionIscps] = useState<{ name: string; maturity: number; result: 'passed' | 'findings' }[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_ISCPS);
      if (stored) setIscps(JSON.parse(stored));
      else setIscps(makeDefault());
    } catch { setIscps(makeDefault()); }
    try {
      const stored = localStorage.getItem(LS_KEY_SESSIONS);
      if (stored) setSessions(JSON.parse(stored));
    } catch { /* noop */ }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (iscps.length) localStorage.setItem(LS_KEY_ISCPS, JSON.stringify(iscps));
  }, [iscps]);
  useEffect(() => {
    localStorage.setItem(LS_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  const updateIscp = (id: string, field: string, value: any) => {
    setIscps(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  const removeIscp = (id: string) => setIscps(prev => prev.filter(e => e.id !== id));
  const addIscp = () => {
    if (!newName.trim()) return;
    setIscps(prev => [...prev, { id: genId(), name: newName.trim(), bi: 3, tlt: 3, cp: 3, af: 2, pi: 2, maturity: 1, lastTested: '' }]);
    setNewName('');
  };

  const sorted = useMemo(() => [...iscps].sort((a, b) => calcScore(b) - calcScore(a)), [iscps]);

  // AI recommendation
  const generateAi = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const payload = sorted.map(e => ({
        name: e.name,
        score: calcScore(e),
        maturityLevel: e.maturity,
        lastTested: e.lastTested || 'nie getestet',
        factors: { BI: e.bi, TLT: e.tlt, CP: e.cp, AF: e.af, PI: e.pi },
      }));
      const { data, error } = await supabase.functions.invoke('iscp-ttx-recommend', {
        body: { iscps: payload, language },
      });
      if (error) throw error;
      setAiResult(data?.recommendation || 'Keine Empfehlung generiert.');
    } catch (e: any) {
      console.error('AI error:', e);
      setAiResult('Fehler bei der KI-Analyse. Bitte erneut versuchen.');
    } finally {
      setAiLoading(false);
    }
  };

  // Add TTX session
  const addSession = () => {
    if (!sessionDate || sessionIscps.length === 0) return;
    setSessions(prev => [...prev, { id: genId(), date: sessionDate, iscps: sessionIscps, notes: sessionNotes }]);
    setSessionDate(''); setSessionNotes(''); setSessionIscps([]); setShowAddSession(false);
  };
  const removeSession = (id: string) => setSessions(prev => prev.filter(s => s.id !== id));

  const tabs = [
    { key: 'scoring' as const, icon: Shield, label: 'ISCP Scoring' },
    { key: 'ai' as const, icon: Brain, label: 'KI-Empfehlung' },
    { key: 'history' as const, icon: History, label: 'TTX-Verlauf' },
  ];

  const scaleOpts = [1, 2, 3, 4, 5].map(v => ({ value: String(v), label: `${v} – ${SCALE_LABELS[v]}` }));
  const maturityOpts = [1, 2, 3].map(v => ({ value: String(v), label: MATURITY_LABELS[v] }));

  const wrapperClass = embedded ? 'space-y-4' : 'min-h-screen p-4 md:p-6';

  return (
    <div className={wrapperClass}>
      <PageMeta title="ISCP TTX Prioritizer" description="KI-gestützte Priorisierung von ISCP-Tests für Tabletop Exercises" />

      {/* Header */}
      <div className={embedded ? '' : 'max-w-7xl mx-auto'}>
        {!embedded && (
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono mb-1">
            ISCP TTX Prioritizer
          </h1>
        )}
        {!embedded && <p className="text-muted-foreground text-sm font-mono mb-6">Information Security Continuity Plans · Tabletop Exercise Priorisierung</p>}

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-lg p-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-mono transition-electric whitespace-nowrap flex-1 justify-center
                ${tab === t.key
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB 1: Scoring ── */}
        {tab === 'scoring' && (
          <div className="space-y-4">
            {/* Add new ISCP */}
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIscp()}
                placeholder="Neues ISCP hinzufügen…"
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button onClick={addIscp} size="sm" className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono">
                <Plus className="w-4 h-4 mr-1" /> Hinzufügen
              </Button>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-primary font-semibold">ISCP</th>
                    {FACTOR_LABELS.map(f => (
                      <th key={f} className="text-center py-2 px-1 text-highlight font-semibold" title={FACTOR_FULL[f]}>{f}</th>
                    ))}
                    <th className="text-center py-2 px-1 text-highlight font-semibold">Maturity</th>
                    <th className="text-center py-2 px-1 text-highlight font-semibold">Last Tested</th>
                    <th className="text-center py-2 px-2 text-primary font-semibold">Score</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(entry => {
                    const score = calcScore(entry);
                    return (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-electric">
                        <td className="py-2 px-2 text-foreground font-medium text-sm max-w-[200px] truncate">{entry.name}</td>
                        {(['bi', 'tlt', 'cp', 'af', 'pi'] as const).map(f => (
                          <td key={f} className="py-1 px-1">
                            <MiniSelect
                              value={entry[f]}
                              onChange={v => updateIscp(entry.id, f, Number(v))}
                              options={scaleOpts}
                              className="w-[110px] mx-auto"
                            />
                          </td>
                        ))}
                        <td className="py-1 px-1">
                          <MiniSelect
                            value={entry.maturity}
                            onChange={v => updateIscp(entry.id, 'maturity', Number(v))}
                            options={maturityOpts}
                            className="w-[140px] mx-auto"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="date"
                            value={entry.lastTested}
                            onChange={e => updateIscp(entry.id, 'lastTested', e.target.value)}
                            className="bg-secondary border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground w-[130px] mx-auto block focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full border text-sm font-bold ${scoreBg(score)} ${scoreColor(score)}`}>
                            {score.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-1">
                          <button onClick={() => removeIscp(entry.id)} className="text-muted-foreground hover:text-destructive transition-electric p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {sorted.map(entry => {
                const score = calcScore(entry);
                return (
                  <div key={entry.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-mono font-medium text-sm">{entry.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full border text-sm font-bold font-mono ${scoreBg(score)} ${scoreColor(score)}`}>
                          {score.toFixed(2)}
                        </span>
                        <button onClick={() => removeIscp(entry.id)} className="text-muted-foreground hover:text-destructive transition-electric p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['bi', 'tlt', 'cp', 'af', 'pi'] as const).map(f => (
                        <div key={f}>
                          <label className="text-[10px] text-highlight font-mono uppercase tracking-wider">{f} – {FACTOR_FULL[FACTOR_LABELS[['bi', 'tlt', 'cp', 'af', 'pi'].indexOf(f)]]}</label>
                          <MiniSelect value={entry[f]} onChange={v => updateIscp(entry.id, f, Number(v))} options={scaleOpts} />
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] text-highlight font-mono uppercase tracking-wider">Maturity</label>
                        <MiniSelect value={entry.maturity} onChange={v => updateIscp(entry.id, 'maturity', Number(v))} options={maturityOpts} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-highlight font-mono uppercase tracking-wider">Last Tested</label>
                      <input
                        type="date"
                        value={entry.lastTested}
                        onChange={e => updateIscp(entry.id, 'lastTested', e.target.value)}
                        className="bg-secondary border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ef4444]/30 border border-[#ef4444]/50" /> ≥ 3.50 Hoch</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#f59e0b]/30 border border-[#f59e0b]/50" /> 2.50–3.49 Mittel</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#22c55e]/30 border border-[#22c55e]/50" /> &lt; 2.50 Niedrig</span>
            </div>
            <p className="text-muted-foreground text-xs font-mono">Score = (BI×0.30) + (TLT×0.20) + (CP×0.15) + (AF×0.15) + (PI×0.20) · Max. 5.0</p>
          </div>
        )}

        {/* ── TAB 2: KI-Empfehlung ── */}
        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-primary font-mono font-bold text-lg mb-2">KI-gestützte TTX-Empfehlung</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Die KI analysiert alle ISCP-Scores und empfiehlt ein optimales Testprogramm
                für ein 4-stündiges Tabletop Exercise inkl. Angriffsszenario.
              </p>
              <Button
                onClick={generateAi}
                disabled={aiLoading}
                className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono"
              >
                {aiLoading ? (
                  <><span className="animate-pulse mr-2">●</span> Analyse läuft…</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> TTX-Empfehlung generieren</>
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="bg-card border border-highlight/20 rounded-lg p-5">
                <h3 className="text-highlight font-mono text-sm uppercase tracking-wider mb-3">KI-Empfehlung</h3>
                <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {aiResult}
                </div>
              </div>
            )}

            {!aiResult && !aiLoading && (
              <div className="bg-secondary/50 border border-border rounded-lg p-8 text-center">
                <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm font-mono">
                  Klicke auf "TTX-Empfehlung generieren", um die KI-Analyse zu starten.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: TTX-Verlauf ── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-primary font-mono font-bold text-lg">TTX-Verlauf</h2>
              <Button onClick={() => setShowAddSession(!showAddSession)} size="sm" className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono">
                <Plus className="w-4 h-4 mr-1" /> Session hinzufügen
              </Button>
            </div>

            {showAddSession && (
              <div className="bg-card border border-primary/20 rounded-lg p-5 space-y-4">
                <h3 className="text-primary font-mono text-sm font-semibold">Neue TTX-Session</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-highlight uppercase tracking-wider">Datum</label>
                    <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                      className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-highlight uppercase tracking-wider">Notizen</label>
                    <input value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Optional…"
                      className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-highlight uppercase tracking-wider mb-2 block">Getestete ISCPs</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {iscps.map(iscp => {
                      const added = sessionIscps.find(s => s.name === iscp.name);
                      return (
                        <div key={iscp.id} className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={!!added}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSessionIscps(prev => [...prev, { name: iscp.name, maturity: iscp.maturity, result: 'passed' }]);
                                } else {
                                  setSessionIscps(prev => prev.filter(s => s.name !== iscp.name));
                                }
                              }}
                              className="accent-primary"
                            />
                            <span className="text-sm font-mono text-foreground">{iscp.name}</span>
                          </label>
                          {added && (
                            <MiniSelect
                              value={added.result}
                              onChange={v => setSessionIscps(prev => prev.map(s => s.name === iscp.name ? { ...s, result: v as 'passed' | 'findings' } : s))}
                              options={[{ value: 'passed', label: 'Bestanden' }, { value: 'findings', label: 'Findings offen' }]}
                              className="w-[140px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={addSession} size="sm" className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono">
                    Speichern
                  </Button>
                  <Button onClick={() => setShowAddSession(false)} size="sm" variant="ghost" className="text-muted-foreground font-mono">
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {sessions.length === 0 && !showAddSession && (
              <div className="bg-secondary/50 border border-border rounded-lg p-8 text-center">
                <History className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm font-mono">Noch keine TTX-Sessions erfasst.</p>
              </div>
            )}

            {[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map(session => (
              <div key={session.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-primary font-mono font-bold text-sm">{session.date}</span>
                  </div>
                  <button onClick={() => removeSession(session.id)} className="text-muted-foreground hover:text-destructive transition-electric p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {session.notes && <p className="text-muted-foreground text-xs font-mono italic">{session.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  {session.iscps.map((s, i) => (
                    <span key={i} className={`text-xs font-mono px-2 py-1 rounded-full border ${
                      s.result === 'passed'
                        ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]'
                        : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'
                    }`}>
                      {s.name} (L{s.maturity}) · {s.result === 'passed' ? '✓' : '⚠'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
