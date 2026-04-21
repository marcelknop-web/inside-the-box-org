import { useMemo, useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  DIMENSIONS, MAX_PER_DIM, MAX_TOTAL, getVerdict, type L, type Lang,
} from '@/data/ttxReadinessData';

const I18N = {
  pageTitle: { de: 'TTX Readiness · Self-Assessment', en: 'TTX Readiness · Self-Assessment', fr: 'TTX Readiness · Self-Assessment' } as L,
  metaDesc: {
    de: 'Self-Assessment für Tabletop-Exercise-Programme nach DORA und NIS-2. Acht Dimensionen, Reifegrad-Score, visuelle Auswertung.',
    en: 'Self-assessment for tabletop exercise programmes under DORA and NIS-2. Eight dimensions, maturity score, visual analysis.',
    fr: 'Self-assessment des programmes de tabletop sous DORA et NIS-2. Huit dimensions, score de maturité, analyse visuelle.',
  } as L,
  back: { de: 'Zurück', en: 'Back', fr: 'Retour' } as L,
  intro: {
    de: 'Acht Dimensionen, die Aufsicht und Auditoren unter DORA und NIS-2 erwarten. ~10 Minuten. Bewertung am Ende: Reifegrad, Radar, Top-3-Schwächen mit konkreten Empfehlungen.',
    en: 'Eight dimensions that supervisors and auditors expect under DORA and NIS-2. ~10 minutes. Final scoring: maturity, radar, top-3 gaps with concrete recommendations.',
    fr: 'Huit dimensions attendues par les superviseurs et auditeurs sous DORA et NIS-2. ~10 minutes. Bilan final : maturité, radar, 3 lacunes prioritaires avec recommandations concrètes.',
  } as L,
  scaleHeader: { de: 'Skala', en: 'Scale', fr: 'Échelle' } as L,
  scale0: { de: '0 nicht zutreffend', en: '0 does not apply', fr: '0 non applicable' } as L,
  scale1: { de: '1 teilweise', en: '1 partial', fr: '1 partiel' } as L,
  scale2: { de: '2 überwiegend', en: '2 mostly', fr: '2 globalement' } as L,
  scale3: { de: '3 voll auditfähig', en: '3 fully audit-ready', fr: '3 pleinement auditable' } as L,
  total: { de: 'Gesamt', en: 'Total', fr: 'Total' } as L,
  reset: { de: 'Zurücksetzen', en: 'Reset', fr: 'Réinitialiser' } as L,
  evaluate: { de: 'Bewertung anzeigen', en: 'Show evaluation', fr: 'Afficher l\'évaluation' } as L,
  fillRemaining: { de: 'Noch offen', en: 'Open', fr: 'Reste à compléter' } as L,
  question: { de: 'Frage', en: 'Question', fr: 'Question' } as L,
  of: { de: 'von', en: 'of', fr: 'sur' } as L,
  previous: { de: 'Zurück', en: 'Previous', fr: 'Précédent' } as L,
  resultTitle: { de: 'Bewertung', en: 'Evaluation', fr: 'Évaluation' } as L,
  radarTitle: { de: 'Reifegrad pro Dimension', en: 'Maturity per dimension', fr: 'Maturité par dimension' } as L,
  breakdownTitle: { de: 'Dimensionsweise Bewertung', en: 'Per-dimension breakdown', fr: 'Détail par dimension' } as L,
  prioritiesTitle: { de: 'Top-Schwächen & Empfehlungen', en: 'Top gaps & recommendations', fr: 'Lacunes prioritaires & recommandations' } as L,
  noPriorities: {
    de: 'Keine kritischen Lücken erkannt. Fokus: Wirksamkeit nachhalten und Szenarien-Portfolio weiterentwickeln.',
    en: 'No critical gaps detected. Focus: sustain effectiveness and evolve the scenario portfolio.',
    fr: 'Aucune lacune critique détectée. Focus : maintenir l\'efficacité et faire évoluer le portefeuille de scénarios.',
  } as L,
  ctaTitle: { de: 'Ergebnis besprechen?', en: 'Want to discuss your result?', fr: 'Discuter de vos résultats ?' } as L,
  ctaDesc: {
    de: 'In einem 30-Minuten-Call ordnen wir Ihre Ergebnisse ein und zeigen konkrete Ansatzpunkte für ein auditfestes TTX-Programm unter DORA und NIS-2.',
    en: 'In a 30-minute call we put your results in context and show concrete entry points for an audit-proof TTX programme under DORA and NIS-2.',
    fr: 'Lors d\'un appel de 30 minutes, nous contextualisons vos résultats et identifions des leviers concrets pour un programme TTX auditable sous DORA et NIS-2.',
  } as L,
  ctaButton: { de: '→ Kontakt aufnehmen', en: '→ Get in touch', fr: '→ Prendre contact' } as L,
  disclaimer: {
    de: 'Orientierungshilfe. Ersetzt keine formale Prüfung durch Auditoren oder Aufsichtsbehörden.',
    en: 'Indicative guidance. Does not replace formal audits or supervisory reviews.',
    fr: 'Outil indicatif. Ne remplace pas un audit formel ni une revue de l\'autorité de tutelle.',
  } as L,
  recHeader: { de: 'Empfehlung', en: 'Recommendation', fr: 'Recommandation' } as L,
};

export default function TtxReadinessPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language as Lang;
  const t = (l: L) => l[lang] || l.en;

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Flat list of all questions across all dimensions
  const flatQuestions = useMemo(() =>
    DIMENSIONS.flatMap(dim =>
      dim.items.map((item, i) => ({
        key: `${dim.id}-${i}`,
        dim,
        item,
        itemIndex: i,
      }))
    ), []);

  const totalItems = flatQuestions.length;
  const totalAnswered = Object.keys(answers).length;
  const score = useMemo(() => Object.values(answers).reduce((a, b) => a + b, 0), [answers]);

  const dimScores = useMemo(() => DIMENSIONS.map(d => {
    const s = [0, 1, 2].reduce((acc, i) => acc + (answers[`${d.id}-${i}`] ?? 0), 0);
    return { id: d.id, dim: d, score: s, pct: Math.round((s / MAX_PER_DIM) * 100) };
  }), [answers]);

  const radarData = dimScores.map(({ dim, pct }) => ({ subject: t(dim.short), value: pct }));

  const priorities = useMemo(() => [...dimScores]
    .filter(d => d.score < MAX_PER_DIM)
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .slice(0, 3), [dimScores]);

  const currentQ = flatQuestions[currentIdx];
  const isLastQuestion = currentIdx === totalItems - 1;

  const answer = (val: number) => {
    if (!currentQ) return;
    setAnswers(p => ({ ...p, [currentQ.key]: val }));
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  const reset = () => {
    setAnswers({});
    setShowResult(false);
    setCurrentIdx(0);
  };

  const verdict = getVerdict(score);

  useEffect(() => {
    if (showResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showResult]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title={t(I18N.pageTitle)} description={t(I18N.metaDesc)} />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <button
          onClick={() => navigate('/nis2-dora')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-mono text-sm transition-electric"
        >
          <ArrowLeft className="w-4 h-4" /> {t(I18N.back)}
        </button>

        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono">
            <Typewriter text={t(I18N.pageTitle)} charDelay={6} />
          </h1>
          <p className="text-foreground/80 text-sm md:text-base font-sans leading-relaxed">{t(I18N.intro)}</p>
        </header>

        {/* Sticky-ish progress + scale */}
        <div className="sticky top-2 z-10 bg-background/85 backdrop-blur border border-primary/20 rounded-lg px-4 py-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-xs md:text-sm">
              <span className="text-muted-foreground">{t(I18N.total)}: </span>
              <span className="text-primary font-bold">{score}</span>
              <span className="text-muted-foreground"> / {MAX_TOTAL}</span>
              <span className="text-muted-foreground ml-3">{totalAnswered}/{totalItems}</span>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-primary transition-electric"
            >
              <RotateCcw className="w-3 h-3" /> {t(I18N.reset)}
            </button>
          </div>
          <div className="h-1.5 w-full bg-muted/40 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-highlight transition-all"
              style={{ width: `${(totalAnswered / totalItems) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-[10px] md:text-[11px] font-mono text-muted-foreground">
            <span>{t(I18N.scale0)}</span>
            <span>{t(I18N.scale1)}</span>
            <span>{t(I18N.scale2)}</span>
            <span>{t(I18N.scale3)}</span>
          </div>
        </div>

        {/* Dimensions */}
        <StaggerReveal stagger={100} className="space-y-3">
          {DIMENSIONS.map(dim => {
            const dimSum = [0, 1, 2].reduce((acc, i) => acc + (answers[`${dim.id}-${i}`] ?? 0), 0);
            const answered = [0, 1, 2].filter(i => answers[`${dim.id}-${i}`] !== undefined).length;
            return (
              <section key={dim.id} className="bg-card/40 border border-primary/15 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-highlight font-mono text-sm md:text-base">{t(dim.title)}</h2>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {dimSum}/{MAX_PER_DIM} · {answered}/3
                  </span>
                </div>
                <div className="space-y-3">
                  {dim.items.map((item, i) => {
                    const key = `${dim.id}-${i}`;
                    const val = answers[key];
                    return (
                      <div key={key} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <p className="text-foreground/85 text-sm font-sans leading-snug flex-1">{t(item)}</p>
                        <div className="flex gap-1 shrink-0" role="radiogroup" aria-label={t(item)}>
                          {[0, 1, 2, 3].map(n => {
                            const sel = val === n;
                            return (
                              <button
                                key={n}
                                role="radio"
                                aria-checked={sel}
                                onClick={() => set(key, n)}
                                className={`w-9 h-9 rounded border-2 font-mono text-sm transition-electric ${
                                  sel
                                    ? 'border-highlight bg-highlight/15 text-highlight'
                                    : 'border-primary/40 text-foreground/70 hover:border-highlight hover:text-highlight'
                                }`}
                              >
                                {n}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </StaggerReveal>

        {/* Evaluate button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setShowResult(true)}
            disabled={totalAnswered < totalItems}
            className="px-6 py-3 font-mono text-sm md:text-base border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t(I18N.evaluate)}
          </button>
          {totalAnswered < totalItems && (
            <p className="text-muted-foreground text-xs font-mono">
              {t(I18N.fillRemaining)}: {totalItems - totalAnswered}
            </p>
          )}
        </div>

        {/* Result */}
        {showResult && (
          <div ref={resultRef} className="space-y-5 pt-4">
            <h2 className="text-primary font-mono text-xl md:text-2xl">{t(I18N.resultTitle)}</h2>

            {/* Verdict hero */}
            <div
              className="border-2 rounded-xl p-5 md:p-6"
              style={{
                borderColor: `hsl(${verdict.hsl})`,
                backgroundColor: `hsl(${verdict.hsl} / 0.08)`,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-1">
                    {t(I18N.total)}
                  </div>
                  <div
                    className="font-mono font-bold text-3xl md:text-4xl"
                    style={{ color: `hsl(${verdict.hsl})` }}
                  >
                    {score} / {MAX_TOTAL}
                  </div>
                </div>
                <div className="md:text-right">
                  <div
                    className="font-mono font-bold text-lg md:text-xl"
                    style={{ color: `hsl(${verdict.hsl})` }}
                  >
                    {t(verdict.title)}
                  </div>
                </div>
              </div>
              {/* gradient bar */}
              <div className="mt-4 h-2 w-full rounded overflow-hidden bg-muted/30 relative">
                <div
                  className="h-full"
                  style={{
                    width: '100%',
                    background:
                      'linear-gradient(to right, hsl(0,75%,55%) 0%, hsl(0,75%,55%) 33%, hsl(45,90%,55%) 33%, hsl(45,90%,55%) 67%, hsl(33,96%,49%) 67%, hsl(33,96%,49%) 83%, hsl(122,39%,45%) 83%, hsl(122,39%,45%) 100%)',
                    opacity: 0.3,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-foreground rounded"
                  style={{ left: `calc(${(score / MAX_TOTAL) * 100}% - 2px)` }}
                />
              </div>
              <p className="text-foreground/85 text-sm md:text-[15px] font-sans leading-relaxed mt-4">
                {t(verdict.desc)}
              </p>
            </div>

            {/* Radar chart */}
            <div className="bg-card/40 border border-primary/15 rounded-xl p-4 md:p-5">
              <h3 className="text-highlight font-mono text-sm uppercase tracking-wider mb-3">
                {t(I18N.radarTitle)}
              </h3>
              <div className="w-full h-[320px] md:h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--primary) / 0.25)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: 'hsl(var(--foreground) / 0.8)', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      stroke="hsl(var(--primary) / 0.2)"
                    />
                    <Radar
                      name="score"
                      dataKey="value"
                      stroke={`hsl(${verdict.hsl})`}
                      fill={`hsl(${verdict.hsl})`}
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-dimension breakdown bars */}
            <div className="bg-card/40 border border-primary/15 rounded-xl p-4 md:p-5">
              <h3 className="text-highlight font-mono text-sm uppercase tracking-wider mb-3">
                {t(I18N.breakdownTitle)}
              </h3>
              <div className="space-y-3">
                {dimScores.map(({ dim, score: s, pct }) => {
                  const v = getVerdict(Math.round((s / MAX_PER_DIM) * (MAX_TOTAL / DIMENSIONS.length) * (DIMENSIONS.length))); // approximate per-dim color via thresholds on full scale
                  // Use per-dim thresholds: <34% red, <67% yellow, <89% orange, else green
                  const color =
                    pct < 34 ? '0, 75%, 55%'
                    : pct < 67 ? '45, 90%, 55%'
                    : pct < 89 ? '33, 96%, 49%'
                    : '122, 39%, 45%';
                  void v;
                  return (
                    <div key={dim.id}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-mono text-xs md:text-sm text-foreground/85">{t(dim.title)}</span>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{s}/{MAX_PER_DIM} · {pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted/30 rounded overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: `hsl(${color})` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priorities */}
            <div className="bg-card/40 border border-primary/15 rounded-xl p-4 md:p-5">
              <h3 className="text-highlight font-mono text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t(I18N.prioritiesTitle)}
              </h3>
              {priorities.length === 0 ? (
                <div className="flex items-start gap-2 text-foreground/85 text-sm font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(122,39%,45%)] mt-0.5 shrink-0" />
                  <p>{t(I18N.noPriorities)}</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {priorities.map((p, i) => (
                    <li key={p.id} className="border-l-2 border-highlight/60 pl-3">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-mono text-sm text-primary">
                          #{i + 1} · {t(p.dim.title)}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{p.score}/{MAX_PER_DIM}</span>
                      </div>
                      <p className="text-foreground/85 text-sm font-sans leading-relaxed">
                        <span className="text-muted-foreground font-mono text-[11px] uppercase tracking-wider mr-2">
                          {t(I18N.recHeader)}:
                        </span>
                        {t(p.dim.recommendation)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="text-primary font-mono text-base mb-2">{t(I18N.ctaTitle)}</h3>
              <p className="text-foreground/85 text-sm font-sans leading-relaxed mb-3">{t(I18N.ctaDesc)}</p>
              <button
                onClick={() => navigate('/contact')}
                className="text-highlight font-mono font-bold text-sm hover:text-primary transition-electric bg-transparent border-none p-0"
              >
                {t(I18N.ctaButton)}
              </button>
            </div>

            <p className="text-muted-foreground text-[11px] italic text-center">{t(I18N.disclaimer)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
