import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, RotateCcw, CheckCircle2, AlertTriangle, XCircle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

type Level = -1 | 0 | 1 | 2 | 3;

interface CriteriaRatings {
  bi: Level;
  tlt: Level;
  cp: Level;
  af: Level;
}

interface IscpEntry {
  name: string;
  criteria: CriteriaRatings;
}

const LEVEL_STYLE: Record<number, { bg: string; border: string; color: string }> = {
  0: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
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

function renderAiResult(text: string) {
  const sections = text.split(/(?=###?\s)/).filter(Boolean);
  if (sections.length <= 1) {
    return text.split('\n').filter(Boolean).map((line, i) => {
      const rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  }
  return sections.map((section, i) => {
    const lines = section.trim().split('\n').filter(Boolean);
    const headingMatch = lines[0]?.match(/^###?\s*\d*\.?\s*(.*)/);
    const heading = headingMatch ? headingMatch[1] : lines[0];
    const body = (headingMatch ? lines.slice(1) : lines).join('\n');
    const rendered = body
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
      .replace(/^\d+\.\s/gm, '→ ');
    return (
      <div key={i} className="border-l-2 border-highlight/30 pl-3">
        <p className="text-highlight text-xs font-semibold uppercase tracking-wider mb-1">{heading}</p>
        <p className="text-foreground text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    );
  });
}

const LS_KEY = 'iscp-criteria-ratings';
const emptyCriteria = (): CriteriaRatings => ({ bi: -1, tlt: -1, cp: -1, af: -1 });

function useCriteria(t: (key: string) => string) {
  return [
    { key: 'bi' as const, label: t('iscp.bi'), description: t('iscp.biDesc'),
      levels: { 1: t('iscp.biLow'), 2: t('iscp.biMed'), 3: t('iscp.biHigh') } },
    { key: 'tlt' as const, label: t('iscp.tlt'), description: t('iscp.tltDesc'),
      levels: { 1: t('iscp.tltLow'), 2: t('iscp.tltMed'), 3: t('iscp.tltHigh') } },
    { key: 'cp' as const, label: t('iscp.cp'), description: t('iscp.cpDesc'),
      levels: { 1: t('iscp.cpLow'), 2: t('iscp.cpMed'), 3: t('iscp.cpHigh') } },
    { key: 'af' as const, label: t('iscp.af'), description: t('iscp.afDesc'),
      levels: { 1: t('iscp.afLow'), 2: t('iscp.afMed'), 3: t('iscp.afHigh') } },
  ];
}

export default function IspcTtxPrioritizer({ embedded = false }: { embedded?: boolean }) {
  const { language, t, tArray } = useLanguage();
  const [entries, setEntries] = useState<IscpEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [newIscp, setNewIscp] = useState('');

  const criteria = useCriteria(t);
  const defaultIscps = tArray('iscp.defaultIscps');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setEntries(JSON.parse(stored));
      else setEntries(defaultIscps.map(name => ({ name, criteria: emptyCriteria() })));
    } catch { setEntries(defaultIscps.map(name => ({ name, criteria: emptyCriteria() }))); }
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
    setEntries(defaultIscps.map(name => ({ name, criteria: emptyCriteria() })));
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
      setAiResult(data?.recommendation || t('iscp.aiEmpty'));
    } catch (e) {
      console.error('AI error:', e);
      setAiResult(t('iscp.aiError'));
    } finally {
      setAiLoading(false);
    }
  };

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 md:p-6 max-w-3xl mx-auto';

  // ── Result view ──
  if (showResult) {
    return (
      <div className={wrapperClass}>
        <PageMeta title="ISCP TTX Prioritizer" description="ISCP TTX Prioritization" />

        <div className="flex items-center justify-between mb-2">
          <h1 className={`${embedded ? 'text-lg' : 'text-xl'} font-bold text-primary font-mono`}>{t('iscp.resultTitle')}</h1>
          <div className="flex gap-3 text-xs font-mono">
            <span className="text-[#ef4444]">● {highCount} {t('iscp.high')}</span>
            <span className="text-[#f59e0b]">● {medCount} {t('iscp.medium')}</span>
            <span className="text-[#22c55e]">● {sorted.length - highCount - medCount} {t('iscp.low')}</span>
          </div>
        </div>
        <p className="text-foreground/80 text-sm font-mono mb-4">
          {t('iscp.resultIntro')}
        </p>

        <div className="space-y-1 mb-4">
          {sorted.map((r) => {
            const sc = scoreColor(r.score);
            const Icon = sc.icon;
            return (
              <div key={r.name} className={`flex items-center gap-2 ${sc.bg} ${sc.border} border rounded-md px-3 py-2`}>
                <Icon className={`w-3.5 h-3.5 ${sc.color} shrink-0`} />
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
            <><span className="animate-pulse mr-2">●</span> {t('iscp.analyzing')}</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> {t('iscp.ttxSuggestion')}</>
          )}
        </Button>

        {aiResult && (
          <div className="bg-card border border-highlight/20 rounded-lg p-4 mb-3">
            <h3 className="text-highlight font-mono text-xs uppercase tracking-wider mb-3">{t('iscp.ttxSuggestionLabel')}</h3>
            <div className="text-foreground text-sm leading-relaxed font-mono space-y-3">
              {renderAiResult(aiResult)}
            </div>
          </div>
        )}

        <Button onClick={restart} variant="outline" size="sm" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-mono">
          <RotateCcw className="w-4 h-4 mr-2" /> {t('iscp.restart')}
        </Button>
      </div>
    );
  }

  // ── Rating view ──
  return (
    <div className={wrapperClass}>
      <PageMeta title="ISCP TTX Prioritizer" description="ISCP TTX Prioritization" />
      <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-2`}>
        {t('iscp.title')}
      </h1>
      <p className="text-foreground/80 text-sm font-mono mb-3">
        {t('iscp.subtitle')}
      </p>
      <div className="bg-card border border-border rounded-lg p-4 mb-5 space-y-2">
        <p className="text-foreground text-sm leading-relaxed">
          <span className="text-primary font-semibold">{t('iscp.whatIsIscp')}</span> — {t('iscp.whatIsIscpText')}
        </p>
        <p className="text-foreground text-sm leading-relaxed">
          <span className="text-primary font-semibold">{t('iscp.whatIsTtx')}</span> — {t('iscp.whatIsTtxText')}
        </p>
        <p className="text-foreground/80 text-xs leading-relaxed">
          <strong>{t('iscp.howTo')}</strong> {t('iscp.howToText')}
        </p>
      </div>

      <p className="text-foreground/80 text-xs font-mono mb-2">
        {ratedEntries.length}/{entries.length} {t('iscp.rated')} · {fullyRated.length} {t('iscp.complete')}
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
          const isCustom = !defaultIscps.includes(e.name);

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
                <span className="text-foreground/60 text-xs font-mono">{done}/4</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-foreground/60" /> : <ChevronDown className="w-4 h-4 text-foreground/60" />}
                {isCustom && (
                  <button onClick={(ev) => { ev.stopPropagation(); setEntries(prev => prev.filter(x => x.name !== e.name)); }} className="text-foreground/60 hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {criteria.map(cr => (
                    <div key={cr.key}>
                      <p className="text-foreground/80 text-xs font-mono mb-1.5">
                        <span className="font-semibold text-foreground">{cr.label}</span>
                        <span className="text-foreground/60 ml-1">— {cr.description}</span>
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {([0, 1, 2, 3] as Level[]).map(val => {
                          const label = val === 0 ? t('iscp.dontKnow') : cr.levels[val as 1|2|3];
                          const style = LEVEL_STYLE[val];
                          const active = e.criteria[cr.key] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => setCriterion(e.name, cr.key, val)}
                              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all
                                ${active
                                  ? `${style.bg} ${style.border} ${style.color}`
                                  : 'border-primary/40 text-foreground/60 hover:border-primary/60 hover:text-foreground/80'}`}
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
          placeholder={t('iscp.addTopic')}
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
        {t('iscp.showResult')} ({ratedEntries.length} {t('iscp.rated')})
      </Button>
    </div>
  );
}
