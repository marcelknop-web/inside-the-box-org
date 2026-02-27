import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/PageMeta';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, RotateCcw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const DEFAULT_ISCPS = [
  'Active Directory', 'Azure Hosting', 'Client Systems', 'DNS',
  'Exchange Online / Email', 'Firewall', 'IAM', 'Intune', 'MFA',
  'Microsoft Teams', 'PAM360 / Jump-Host', 'PKI Certificate',
  'Proxy-Services', 'SD-WAN', 'SharePoint / OneDrive', 'Switches',
  'Virtualized Infrastructure', 'Voice-Service', 'VPN-Gateway', 'WSUS',
];

type Rating = 0 | 1 | 2 | 3; // 0=unbewertet, 1=niedrig, 2=mittel, 3=hoch

interface IscpRating {
  name: string;
  rating: Rating;
}

const RATING_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  1: { label: 'Niedrig', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/15', border: 'border-[#22c55e]/40', icon: CheckCircle2 },
  2: { label: 'Mittel', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/15', border: 'border-[#f59e0b]/40', icon: AlertTriangle },
  3: { label: 'Hoch', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/15', border: 'border-[#ef4444]/40', icon: XCircle },
};

const LS_KEY = 'iscp-quick-ratings';

export default function IspcTtxPrioritizer({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const [ratings, setRatings] = useState<IscpRating[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setRatings(JSON.parse(stored));
      else setRatings(DEFAULT_ISCPS.map(name => ({ name, rating: 0 })));
    } catch { setRatings(DEFAULT_ISCPS.map(name => ({ name, rating: 0 }))); }
  }, []);

  useEffect(() => {
    if (ratings.length) localStorage.setItem(LS_KEY, JSON.stringify(ratings));
  }, [ratings]);

  const setRating = (name: string, rating: Rating) => {
    setRatings(prev => prev.map(r => r.name === name ? { ...r, rating } : r));
    setShowResult(false);
    setAiResult('');
  };

  const rated = ratings.filter(r => r.rating > 0);
  const allRated = rated.length === ratings.length;
  const progress = Math.round((rated.length / ratings.length) * 100);

  const sorted = useMemo(() =>
    [...ratings].filter(r => r.rating > 0).sort((a, b) => b.rating - a.rating),
    [ratings]
  );

  const highCount = sorted.filter(r => r.rating === 3).length;
  const medCount = sorted.filter(r => r.rating === 2).length;

  const restart = () => {
    setRatings(DEFAULT_ISCPS.map(name => ({ name, rating: 0 })));
    setShowResult(false);
    setAiResult('');
  };

  const generateAi = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const payload = sorted.map(r => ({
        name: r.name,
        score: r.rating === 3 ? 4.2 : r.rating === 2 ? 3.0 : 1.5,
        maturityLevel: 1,
        lastTested: 'nicht bekannt',
        factors: { BI: r.rating + 1, TLT: 3, CP: 3, AF: r.rating, PI: r.rating },
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
        <PageMeta title="ISCP TTX Prioritizer" description="Schnelle ISCP-Bewertung für Tabletop Exercises" />
        <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-3`}>
          TTX-Priorisierung
        </h1>

        {/* Summary */}
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

        {/* Ranked list */}
        <div className="space-y-1.5 mb-4">
          {sorted.map((r, i) => {
            const cfg = RATING_CONFIG[r.rating];
            return (
              <div key={r.name} className={`flex items-center gap-3 ${cfg.bg} ${cfg.border} border rounded-lg px-4 py-2.5`}>
                <span className={`text-xs font-mono font-bold ${cfg.color} w-5`}>{i + 1}.</span>
                <cfg.icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                <span className="text-foreground text-sm font-mono flex-1">{r.name}</span>
                <span className={`text-xs font-mono font-semibold ${cfg.color}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {/* AI button */}
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
      <PageMeta title="ISCP TTX Prioritizer" description="Schnelle ISCP-Bewertung für Tabletop Exercises" />
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
          <strong>So geht's:</strong> Bewerte jedes ISCP nach Testpriorität (Niedrig / Mittel / Hoch). Je höher die Bewertung, desto dringender sollte es im nächsten TTX getestet werden. Ab 3 Bewertungen kannst du die Auswertung sehen und eine KI-Empfehlung generieren.
        </p>
      </div>
      <p className="text-muted-foreground text-xs font-mono mb-2">
        {rated.length}/{ratings.length} bewertet
      </p>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2 mb-5">
        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* ISCP list */}
      <div className="space-y-2 mb-5">
        {ratings.map(r => (
          <div key={r.name} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <span className="text-foreground text-sm font-mono flex-1 min-w-[140px]">{r.name}</span>
            <div className="flex gap-1.5">
              {([1, 2, 3] as Rating[]).map(val => {
                const cfg = RATING_CONFIG[val];
                const active = r.rating === val;
                return (
                  <button
                    key={val}
                    onClick={() => setRating(r.name, active ? 0 : val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-electric
                      ${active
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground/70'}`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <Button
        onClick={() => setShowResult(true)}
        disabled={rated.length < 3}
        className="w-full bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 font-mono disabled:opacity-40"
      >
        Auswertung anzeigen ({rated.length} bewertet)
      </Button>
    </div>
  );
}
