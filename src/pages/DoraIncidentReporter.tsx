import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw, Download, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { PageMeta } from '@/components/PageMeta';

type Verdict = 'major' | 'borderline' | 'none';

interface WizardStep {
  id: string;
  question: string;
  options: { label: string; value: string; weight: number }[];
}

const STEPS: WizardStep[] = [
  {
    id: 'clients',
    question: 'Wie viele Clients / Nutzer sind betroffen?',
    options: [
      { label: '< 100', value: '<100', weight: 0 },
      { label: '100 – 1.000', value: '100-1000', weight: 1 },
      { label: '> 1.000', value: '>1000', weight: 2 },
    ],
  },
  {
    id: 'duration',
    question: 'Wie lange dauerte / dauert die Störung?',
    options: [
      { label: '< 1 Stunde', value: '<1h', weight: 0 },
      { label: '1 – 4 Stunden', value: '1-4h', weight: 1 },
      { label: '> 4 Stunden', value: '>4h', weight: 2 },
    ],
  },
  {
    id: 'geography',
    question: 'Geografische Ausbreitung?',
    options: [
      { label: 'Lokal', value: 'lokal', weight: 0 },
      { label: 'National', value: 'national', weight: 1 },
      { label: 'Grenzüberschreitend', value: 'cross-border', weight: 2 },
    ],
  },
  {
    id: 'dataloss',
    question: 'Datenverlust oder Integritätsverlust?',
    options: [
      { label: 'Nein', value: 'nein', weight: 0 },
      { label: 'Unklar', value: 'unklar', weight: 1 },
      { label: 'Ja', value: 'ja', weight: 2 },
    ],
  },
  {
    id: 'economic',
    question: 'Wirtschaftlicher Schaden?',
    options: [
      { label: '< 100.000 €', value: '<100k', weight: 0 },
      { label: '> 100.000 €', value: '>100k', weight: 1 },
      { label: '> 5 % Jahresumsatz', value: '>5%', weight: 2 },
      { label: 'Unklar', value: 'unklar', weight: 1 },
    ],
  },
  {
    id: 'criticality',
    question: 'Kritikalität des betroffenen Dienstes?',
    options: [
      { label: 'Nicht kritisch', value: 'low', weight: 0 },
      { label: 'Wichtig', value: 'medium', weight: 1 },
      { label: 'Kritisch / zahlungsrelevant', value: 'critical', weight: 2 },
    ],
  },
  {
    id: 'reputation',
    question: 'Reputationsrisiko?',
    options: [
      { label: 'Gering', value: 'low', weight: 0 },
      { label: 'Mittel', value: 'medium', weight: 1 },
      { label: 'Hoch', value: 'high', weight: 2 },
    ],
  },
];

function classify(answers: Record<string, { value: string; weight: number }>): Verdict {
  const totalWeight = Object.values(answers).reduce((sum, a) => sum + a.weight, 0);
  const maxWeight = STEPS.length * 2;
  const ratio = totalWeight / maxWeight;

  // Hard triggers for major
  if (answers.dataloss?.weight === 2) return 'major';
  if (answers.economic?.value === '>5%') return 'major';
  if (answers.criticality?.weight === 2 && answers.duration?.weight === 2) return 'major';

  if (ratio >= 0.6) return 'major';
  if (ratio >= 0.35) return 'borderline';
  return 'none';
}

const VERDICT_CONFIG = {
  major: {
    emoji: '🔴',
    title: 'MAJOR INCIDENT – Meldepflicht besteht',
    color: 'text-[hsl(0,75%,55%)]',
    borderColor: 'border-[hsl(0,75%,55%)]',
    bgColor: 'bg-[hsl(0,75%,55%,0.1)]',
  },
  borderline: {
    emoji: '🟠',
    title: 'GRENZFALL – Rücksprache empfohlen',
    color: 'text-[hsl(33,96%,49%)]',
    borderColor: 'border-[hsl(33,96%,49%)]',
    bgColor: 'bg-[hsl(33,96%,49%,0.1)]',
  },
  none: {
    emoji: '🟢',
    title: 'Kein Major Incident nach DORA Art. 19',
    color: 'text-[hsl(122,39%,45%)]',
    borderColor: 'border-[hsl(122,39%,45%)]',
    bgColor: 'bg-[hsl(122,39%,45%,0.1)]',
  },
};

export default function DoraIncidentReporter() {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number; label: string }>>({});
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  const progress = ((currentStep) / STEPS.length) * 100;

  const handleAnswer = (step: WizardStep, option: { label: string; value: string; weight: number }) => {
    const newAnswers = { ...answers, [step.id]: { value: option.value, weight: option.weight, label: option.label } };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — classify and show result
      const result = classify(newAnswers);
      setVerdict(result);
      fetchReasoning(newAnswers, result);
    }
  };

  const fetchReasoning = async (ans: Record<string, { value: string; weight: number; label: string }>, v: Verdict) => {
    setLoadingReasoning(true);
    try {
      const { data, error } = await supabase.functions.invoke('dora-reasoning', {
        body: { answers: ans, verdict: v },
      });
      if (error) throw error;
      setReasoning(data?.reasoning || 'Begründung konnte nicht generiert werden.');
    } catch (e) {
      console.error('Reasoning error:', e);
      setReasoning('Begründung konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoadingReasoning(false);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const restart = () => {
    setStarted(false);
    setCurrentStep(0);
    setAnswers({});
    setVerdict(null);
    setReasoning('');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString('de-DE');
    const vc = verdict ? VERDICT_CONFIG[verdict] : null;

    doc.setFontSize(18);
    doc.text('DORA Incident Check – Ergebnis', 20, 20);
    doc.setFontSize(10);
    doc.text(`Erstellt: ${now}`, 20, 28);

    doc.setFontSize(14);
    doc.text(`${vc?.emoji || ''} ${vc?.title || ''}`, 20, 42);

    doc.setFontSize(11);
    let y = 55;
    STEPS.forEach((step) => {
      const a = answers[step.id];
      if (a) {
        doc.text(`${step.question}`, 20, y);
        doc.setFont(undefined as any, 'bold');
        doc.text(`→ ${a.label}`, 25, y + 6);
        doc.setFont(undefined as any, 'normal');
        y += 14;
      }
    });

    y += 5;
    doc.setFontSize(11);
    const splitReasoning = doc.splitTextToSize(reasoning, 165);
    doc.text(splitReasoning, 20, y);

    y += splitReasoning.length * 5 + 10;
    doc.setFontSize(8);
    doc.text('Disclaimer: Dieses Tool ersetzt keine Rechtsberatung. Einschätzung basiert auf DORA Art. 19.', 20, y);

    doc.save(`DORA-Check_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Entry button screen
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="DORA Incident Check" description="Regelbasierter DORA Art. 19 Incident Check – Meldepflicht prüfen" />
        <button
          onClick={() => setStarted(true)}
          className="px-8 py-4 font-mono text-lg border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] flex items-center gap-3"
        >
          🔍 DORA Incident Check starten
        </button>
      </div>
    );
  }

  // Result screen
  if (verdict) {
    const vc = VERDICT_CONFIG[verdict];
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="DORA Incident Check – Ergebnis" description="Ergebnis des DORA Art. 19 Incident Checks" />
        <div className="w-full max-w-xl">
          {/* Verdict banner */}
          <div className={`${vc.bgColor} ${vc.borderColor} border-2 rounded-lg p-6 mb-6 text-center`}>
            <div className="text-4xl mb-2">{vc.emoji}</div>
            <h2 className={`text-xl md:text-2xl font-mono font-bold ${vc.color}`}>{vc.title}</h2>
          </div>

          {/* Reasoning */}
          <div className="bg-card border border-border rounded-lg p-5 mb-5">
            <h3 className="text-primary font-mono text-sm mb-2 uppercase tracking-wider">Begründung</h3>
            {loadingReasoning ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="animate-pulse">●</span> Analyse wird erstellt…
              </div>
            ) : (
              <p className="text-foreground/80 text-sm leading-relaxed">{reasoning}</p>
            )}
          </div>

          {/* Timeline for Major */}
          {verdict === 'major' && (
            <div className="bg-card border border-border rounded-lg p-5 mb-5">
              <h3 className="text-primary font-mono text-sm mb-3 uppercase tracking-wider">Meldefristen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(0,75%,55%)] font-bold min-w-[60px]">4 h</span>
                  <span className="text-foreground/80">Early Warning an zuständige Behörde (BaFin)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(33,96%,49%)] font-bold min-w-[60px]">72 h</span>
                  <span className="text-foreground/80">Intermediate Report mit aktualisierten Informationen</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(122,39%,45%)] font-bold min-w-[60px]">1 Monat</span>
                  <span className="text-foreground/80">Final Report mit Ursachenanalyse und Maßnahmen</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-3">Zuständige Behörde: BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht)</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Button onClick={exportPdf} variant="outline" className="flex-1 border-primary/30 text-primary hover:bg-primary/10 font-mono">
              <Download className="w-4 h-4 mr-2" /> PDF exportieren
            </Button>
            <Button onClick={restart} variant="outline" className="flex-1 border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 font-mono">
              <RotateCcw className="w-4 h-4 mr-2" /> Neu starten
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-muted-foreground text-xs text-center italic">
            Dieses Tool ersetzt keine Rechtsberatung. Einschätzung basiert auf DORA Art. 19.
          </p>
        </div>
      </div>
    );
  }

  // Wizard steps
  const step = STEPS[currentStep];
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <PageMeta title="DORA Incident Check" description="Regelbasierter DORA Art. 19 Incident Check" />
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground font-mono mb-2">
            <span>Schritt {currentStep + 1} / {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        {/* Question */}
        <h2 className="text-lg md:text-xl font-mono text-primary mb-6 leading-snug">
          {step.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {step.options.map((opt) => {
            const isSelected = answers[step.id]?.value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(step, opt)}
                className={`w-full text-left px-5 py-4 rounded-lg border-2 font-mono text-sm md:text-base transition-electric
                  ${isSelected
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-primary/5'
                  }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Back button */}
        {currentStep > 0 && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-muted-foreground text-sm font-mono hover:text-primary transition-electric"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
        )}
      </div>
    </div>
  );
}
