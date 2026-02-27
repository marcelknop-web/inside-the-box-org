import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_ISCPS = [
  'E-Mail & Kommunikation', 'Identitäts- & Zugriffsmanagement',
  'Cloud-Dienste', 'Backup & Recovery', 'Patch-Management',
];

type Level = -1 | 0 | 1 | 2 | 3; // -1=unbewertet, 0=weiß nicht

interface CriteriaRatings {
  bi: Level;  // Business Impact
  tlt: Level; // Time since Last Test
  cp: Level;  // Complexity
  af: Level;  // Audit Findings
}

interface IscpEntry {
  name: string;
  criteria: CriteriaRatings;
}

const CRITERIA = [
  { key: 'bi' as const, label: 'Business Impact', short: 'BI', description: 'Kritikalität für den Geschäftsbetrieb',
    levels: { 1: 'Gering', 2: 'Mittel', 3: 'Kritisch' } },
  { key: 'tlt' as const, label: 'Letzter Test', short: 'LT', description: 'Wie lange liegt der letzte Test zurück?',
    levels: { 1: 'Kürzlich', 2: 'Länger her', 3: 'Nie / Unklar' } },
  { key: 'cp' as const, label: 'Komplexität', short: 'KX', description: 'Abhängigkeiten & Schnittstellen',
    levels: { 1: 'Einfach', 2: 'Mittel', 3: 'Komplex' } },
  { key: 'af' as const, label: 'Offene Findings', short: 'AF', description: 'Ungelöste Audit-Findings',
    levels: { 1: 'Keine', 2: 'Wenige', 3: 'Mehrere' } },
];

const LEVEL_STYLE: Record<number, { bg: string; border: string; color: string }> = {
  0: { color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-muted-foreground/30' },
  1: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  2: { color: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/50' },
  3: { color: 'text-primary', bg: 'bg-primary/30', border: 'border-primary/70' },
};

const SCORE_ICONS = { low: CheckCircle2, med: AlertTriangle, high: XCircle };

function calcScore(c: CriteriaRatings): number {
  const rated = [c.bi, c.tlt, c.cp, c.af].filter(v => v > 0);
  if (rated.length === 0) return 0;
  return +(rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1);
}

function scoreColor(score: number) {
  if (score >= 2.5) return { color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/15', border: 'border-[#ef4444]/40', icon: SCORE_ICONS.high };
  if (score >= 1.5) return { color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/15', border: 'border-[#f59e0b]/40', icon: SCORE_ICONS.med };
  return { color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/15', border: 'border-[#22c55e]/40', icon: SCORE_ICONS.low };
}

function completeness(c: CriteriaRatings): number {
  return [c.bi, c.tlt, c.cp, c.af].filter(v => v >= 0).length;
}

const LS_KEY = 'iscp-criteria-ratings';
const emptyCriteria = (): CriteriaRatings => ({ bi: -1, tlt: -1, cp: -1, af: -1 });

export default function IspcTtxPrioritizer({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const [entries, setEntries] = useState<IscpEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [newIscp, setNewIscp] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setEntries(JSON.parse(stored));
      else setEntries(DEFAULT_ISCPS.map(name => ({ name, criteria: emptyCriteria() })));
    } catch { setEntries(DEFAULT_ISCPS.map(name => ({ name, criteria: emptyCriteria() }))); }
  }, []);

  useEffect(() => {
    if (entries.length) localStorage.setItem(LS_KEY, JSON.stringify(entries));
  }, [entries]);

  const setCriterion = (name: string, key: keyof CriteriaRatings, val: Level) => {
    setEntries(prev => prev.map(e =>
      e.name === name ? { ...e, criteria: { ...e.criteria, [key]: val } } : e
    ));
    setShowResult(false);
    setAiResult('');
  };

  const ratedEntries = entries.filter(e => completeness(e.criteria) > 0);
  const fullyRated = entries.filter(e => completeness(e.criteria) === 4);
  const progress = Math.round((ratedEntries.length / entries.length) * 100);

  const sorted = useMemo(() =>
    [...entries].filter(e => completeness(e.criteria) > 0)
      .map(e => ({ ...e, score: calcScore(e.criteria) }))
      .sort((a, b) => b.score - a.score),
    [entries]
  );

  const highCount = sorted.filter(r => r.score >= 2.5).length;
  const medCount = sorted.filter(r => r.score >= 1.5 && r.score < 2.5).length;

  const restart = () => {
    setEntries(DEFAULT_ISCPS.map(name => ({ name, criteria: emptyCriteria() })));
    setShowResult(false);
    setAiResult('');
    setExpanded(null);
  };

  const generateAi = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const payload = sorted.map(r => ({
        name: r.name,
        score: r.score,
        maturityLevel: 1,
        lastTested: 'nicht bekannt',
        factors: { BI: r.criteria.bi, TLT: r.criteria.tlt, CP: r.criteria.cp, AF: r.criteria.af, PI: Math.round(r.score) },
      }));
      const { data, error } = await supabase.functions.invoke('iscp-ttx-recommend', {
        body: { iscps: payload, language },
      });
      if (error) throw error;
      setAiResult(data?.recommendation || 'Keine Empfehlung generiert.');
    } catch (e) {
      console.error('AI error:', e);
      setAiResult('Fehler bei der KI-Analyse. Bitte erneut versuchen.');
    } finally {
      setAiLoading(false);
    }
  };

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 md:p-6 max-w-3xl mx-auto';

  // ── Result view ──
  if (showResult) {
    return (
      <div className={wrapperClass}>
        <PageMeta title="ISCP TTX Prioritizer" description="ISCP-Bewertung für Tabletop Exercises" />
        <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-3`}>
          TTX-Priorisierung
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3 text-center">
            <span className="text-[#ef4444] text-2xl font-bold font-mono">{highCount}</span>
            <p className="text-foreground/70 text-xs font-mono mt-1">Hoch</p>
          </div>
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl p-3 text-center">
            <span className="text-[#f59e0b] text-2xl font-bold font-mono">{medCount}</span>
            <p className="text-foreground/70 text-xs font-mono mt-1">Mittel</p>
          </div>
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-3 text-center">
            <span className="text-[#22c55e] text-2xl font-bold font-mono">{sorted.length - highCount - medCount}</span>
            <p className="text-foreground/70 text-xs font-mono mt-1">Niedrig</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4">
          {sorted.map((r, i) => {
            const sc = scoreColor(r.score);
            const Icon = sc.icon;
            return (
              <div key={r.name} className={`flex items-center gap-3 ${sc.bg} ${sc.border} border rounded-lg px-4 py-2.5`}>
                <span className={`text-xs font-mono font-bold ${sc.color} w-5`}>{i + 1}.</span>
                <Icon className={`w-4 h-4 ${sc.color} shrink-0`} />
                <span className="text-foreground text-sm font-mono flex-1">{r.name}</span>
                <span className={`text-xs font-mono font-semibold ${sc.color}`}>{r.score}</span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={generateAi}
          disabled={aiLoading}
          className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono mb-3"
        >
          {aiLoading ? (
            <><span className="animate-pulse mr-2">●</span> Analyse läuft…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> KI-Empfehlung für nächstes TTX</>
          )}
        </Button>

        {aiResult && (
          <div className="bg-card border border-highlight/20 rounded-lg p-4 mb-3">
            <h3 className="text-highlight font-mono text-xs uppercase tracking-wider mb-2">KI-Empfehlung</h3>
            <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap font-mono">{aiResult}</div>
          </div>
        )}

        <Button onClick={restart} variant="outline" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-mono">
          <RotateCcw className="w-4 h-4 mr-2" /> Neu bewerten
        </Button>
      </div>
    );
  }

  // ── Rating view ──
  return (
    <div className={wrapperClass}>
      <PageMeta title="ISCP TTX Prioritizer" description="ISCP-Bewertung für Tabletop Exercises" />
      <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-2`}>
        ISCP Quick Check
      </h1>
      <p className="text-muted-foreground text-sm font-mono mb-3">
        Wie dringend muss dieses ISCP im nächsten Tabletop Exercise getestet werden?
      </p>
      <div className="bg-card border border-border rounded-lg p-4 mb-5 space-y-2">
        <p className="text-foreground/90 text-sm leading-relaxed">
          <span className="text-primary font-semibold">Was ist ein ISCP?</span> — Ein Information Security Continuity Plan beschreibt, wie ein IT-Service bei einem Ausfall wiederhergestellt wird.
        </p>
        <p className="text-foreground/90 text-sm leading-relaxed">
          <span className="text-primary font-semibold">Was ist ein TTX?</span> — Ein Tabletop Exercise ist eine Übung am Tisch, bei der Teams den Ernstfall durchspielen — ohne echte Systeme abzuschalten.
        </p>
        <p className="text-foreground/70 text-xs leading-relaxed">
          <strong>So geht's:</strong> Tippe auf ein ISCP und bewerte es nach 4 Kriterien: Business Impact, Letzter Test, Komplexität und Offene Findings. Ab 3 bewerteten ISCPs kannst du die Auswertung sehen.
        </p>
      </div>

      <p className="text-muted-foreground text-xs font-mono mb-2">
        {ratedEntries.length}/{entries.length} bewertet · {fullyRated.length} vollständig
      </p>
      <div className="w-full bg-secondary rounded-full h-2 mb-5">
        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-2 mb-3">
        {entries.map(e => {
          const isOpen = expanded === e.name;
          const done = completeness(e.criteria);
          const score = calcScore(e.criteria);
          const sc = score > 0 ? scoreColor(score) : null;
          const isCustom = !DEFAULT_ISCPS.includes(e.name);

          return (
            <div key={e.name} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : e.name)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-foreground text-sm font-mono flex-1">{e.name}</span>
                {done > 0 && sc && (
                  <span className={`text-xs font-mono font-bold ${sc.color}`}>{score}</span>
                )}
                <span className="text-muted-foreground text-xs font-mono">{done}/4</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                {isCustom && (
                  <button onClick={(ev) => { ev.stopPropagation(); setEntries(prev => prev.filter(x => x.name !== e.name)); }} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {CRITERIA.map(cr => (
                    <div key={cr.key}>
                      <p className="text-foreground/80 text-xs font-mono mb-1.5">
                        <span className="font-semibold text-foreground">{cr.label}</span>
                        <span className="text-muted-foreground ml-1">— {cr.description}</span>
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {([0, 1, 2, 3] as Level[]).map(val => {
                          const label = val === 0 ? 'Weiß nicht' : cr.levels[val as 1|2|3];
                          const style = LEVEL_STYLE[val];
                          const active = e.criteria[cr.key] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => setCriterion(e.name, cr.key, val)}
                              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all
                                ${active
                                  ? `${style.bg} ${style.border} ${style.color}`
                                  : 'border-primary/40 text-muted-foreground hover:border-primary/60 hover:text-foreground/70'}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={(ev) => {
        ev.preventDefault();
        const trimmed = newIscp.trim();
        if (trimmed && !entries.find(e => e.name.toLowerCase() === trimmed.toLowerCase())) {
          setEntries(prev => [...prev, { name: trimmed, criteria: emptyCriteria() }]);
          setNewIscp('');
        }
      }} className="flex gap-2 mb-5">
        <Input
          value={newIscp}
          onChange={ev => setNewIscp(ev.target.value)}
          placeholder="Eigenes Thema hinzufügen…"
          className="font-mono text-sm flex-1"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!newIscp.trim()} className="font-mono">
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      <Button
        onClick={() => setShowResult(true)}
        disabled={ratedEntries.length < 3}
        className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono disabled:opacity-40"
      >
        Auswertung anzeigen ({ratedEntries.length} bewertet)
      </Button>
    </div>
  );
}
