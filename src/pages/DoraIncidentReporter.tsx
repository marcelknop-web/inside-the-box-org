import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';

type Verdict = 'major' | 'borderline' | 'none';

interface WizardStep {
  id: string;
  question: string;
  options: { label: string; value: string; weight: number }[];
}

interface StepDef {
  id: string;
  question: Record<string, string>;
  options: { label: Record<string, string>; value: string; weight: number }[];
}

const STEP_DEFS: StepDef[] = [
  {
    id: 'clients',
    question: { de: 'Wie viele Clients / Nutzer sind betroffen?', en: 'How many clients / users are affected?', fr: 'Combien de clients / utilisateurs sont concernés ?' },
    options: [
      { label: { de: '< 100', en: '< 100', fr: '< 100' }, value: '<100', weight: 0 },
      { label: { de: '100 – 1.000', en: '100 – 1,000', fr: '100 – 1 000' }, value: '100-1000', weight: 1 },
      { label: { de: '> 1.000', en: '> 1,000', fr: '> 1 000' }, value: '>1000', weight: 2 },
    ],
  },
  {
    id: 'duration',
    question: { de: 'Wie lange dauerte / dauert die Störung?', en: 'How long did / does the disruption last?', fr: 'Quelle est la durée de la perturbation ?' },
    options: [
      { label: { de: '< 1 Stunde', en: '< 1 hour', fr: '< 1 heure' }, value: '<1h', weight: 0 },
      { label: { de: '1 – 4 Stunden', en: '1 – 4 hours', fr: '1 – 4 heures' }, value: '1-4h', weight: 1 },
      { label: { de: '> 4 Stunden', en: '> 4 hours', fr: '> 4 heures' }, value: '>4h', weight: 2 },
    ],
  },
  {
    id: 'geography',
    question: { de: 'Geografische Ausbreitung?', en: 'Geographic spread?', fr: 'Étendue géographique ?' },
    options: [
      { label: { de: 'Lokal', en: 'Local', fr: 'Local' }, value: 'lokal', weight: 0 },
      { label: { de: 'National', en: 'National', fr: 'National' }, value: 'national', weight: 1 },
      { label: { de: 'Grenzüberschreitend', en: 'Cross-border', fr: 'Transfrontalier' }, value: 'cross-border', weight: 2 },
    ],
  },
  {
    id: 'dataloss',
    question: { de: 'Datenverlust oder Integritätsverlust?', en: 'Data loss or integrity loss?', fr: 'Perte de données ou d\'intégrité ?' },
    options: [
      { label: { de: 'Nein', en: 'No', fr: 'Non' }, value: 'nein', weight: 0 },
      { label: { de: 'Unklar', en: 'Unclear', fr: 'Incertain' }, value: 'unklar', weight: 1 },
      { label: { de: 'Ja', en: 'Yes', fr: 'Oui' }, value: 'ja', weight: 2 },
    ],
  },
  {
    id: 'economic',
    question: { de: 'Wirtschaftlicher Schaden?', en: 'Economic impact?', fr: 'Impact économique ?' },
    options: [
      { label: { de: '< 100.000 €', en: '< €100,000', fr: '< 100 000 €' }, value: '<100k', weight: 0 },
      { label: { de: '> 100.000 €', en: '> €100,000', fr: '> 100 000 €' }, value: '>100k', weight: 1 },
      { label: { de: '> 5 % Jahresumsatz', en: '> 5% annual revenue', fr: '> 5 % du chiffre d\'affaires' }, value: '>5%', weight: 2 },
      { label: { de: 'Unklar', en: 'Unclear', fr: 'Incertain' }, value: 'unklar', weight: 1 },
    ],
  },
  {
    id: 'criticality',
    question: { de: 'Kritikalität des betroffenen Dienstes?', en: 'Criticality of the affected service?', fr: 'Criticité du service concerné ?' },
    options: [
      { label: { de: 'Nicht kritisch', en: 'Not critical', fr: 'Non critique' }, value: 'low', weight: 0 },
      { label: { de: 'Wichtig', en: 'Important', fr: 'Important' }, value: 'medium', weight: 1 },
      { label: { de: 'Kritisch / zahlungsrelevant', en: 'Critical / payment-relevant', fr: 'Critique / lié aux paiements' }, value: 'critical', weight: 2 },
    ],
  },
  {
    id: 'reputation',
    question: { de: 'Reputationsrisiko?', en: 'Reputational risk?', fr: 'Risque de réputation ?' },
    options: [
      { label: { de: 'Gering', en: 'Low', fr: 'Faible' }, value: 'low', weight: 0 },
      { label: { de: 'Mittel', en: 'Medium', fr: 'Moyen' }, value: 'medium', weight: 1 },
      { label: { de: 'Hoch', en: 'High', fr: 'Élevé' }, value: 'high', weight: 2 },
    ],
  },
];

const I18N = {
  title: { de: 'DORA Incident Check', en: 'DORA Incident Check', fr: 'DORA Incident Check' },
  step: { de: 'Schritt', en: 'Step', fr: 'Étape' },
  back: { de: 'Zurück', en: 'Back', fr: 'Retour' },
  restart: { de: 'Neu starten', en: 'Restart', fr: 'Recommencer' },
  reasoning: { de: 'Begründung', en: 'Reasoning', fr: 'Justification' },
  loading: { de: 'Analyse wird erstellt…', en: 'Generating analysis…', fr: 'Analyse en cours…' },
  deadlines: { de: 'Meldefristen', en: 'Reporting Deadlines', fr: 'Délais de notification' },
  earlyWarning: { de: 'Early Warning an zuständige Behörde (BaFin)', en: 'Early Warning to competent authority (BaFin)', fr: 'Alerte précoce à l\'autorité compétente (BaFin)' },
  intermediate: { de: 'Intermediate Report mit aktualisierten Informationen', en: 'Intermediate Report with updated information', fr: 'Rapport intermédiaire avec informations actualisées' },
  finalReport: { de: 'Final Report mit Ursachenanalyse und Maßnahmen', en: 'Final Report with root cause analysis and measures', fr: 'Rapport final avec analyse des causes et mesures' },
  authority: { de: 'Zuständige Behörde: BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht)', en: 'Competent authority: BaFin (Federal Financial Supervisory Authority)', fr: 'Autorité compétente : BaFin (Autorité fédérale de surveillance financière)' },
  disclaimer: { de: 'Dieses Tool ersetzt keine Rechtsberatung. Einschätzung basiert auf DORA Art. 19.', en: 'This tool does not constitute legal advice. Assessment based on DORA Art. 19.', fr: 'Cet outil ne constitue pas un avis juridique. Évaluation basée sur DORA Art. 19.' },
  verdictMajor: { de: 'MAJOR INCIDENT – Meldepflicht besteht', en: 'MAJOR INCIDENT – Reporting obligation applies', fr: 'INCIDENT MAJEUR – Obligation de notification' },
  verdictBorderline: { de: 'GRENZFALL – Rücksprache empfohlen', en: 'BORDERLINE – Consultation recommended', fr: 'CAS LIMITE – Consultation recommandée' },
  verdictNone: { de: 'Kein Major Incident nach DORA Art. 19', en: 'No Major Incident per DORA Art. 19', fr: 'Pas d\'incident majeur selon DORA Art. 19' },
  start: { de: '🔍 DORA Incident Check starten', en: '🔍 Start DORA Incident Check', fr: '🔍 Lancer le DORA Incident Check' },
};

function classify(answers: Record<string, { value: string; weight: number }>): Verdict {
  const totalWeight = Object.values(answers).reduce((sum, a) => sum + a.weight, 0);
  const maxWeight = STEP_DEFS.length * 2;
  const ratio = totalWeight / maxWeight;

  if (answers.dataloss?.weight === 2) return 'major';
  if (answers.economic?.value === '>5%') return 'major';
  if (answers.criticality?.weight === 2 && answers.duration?.weight === 2) return 'major';

  if (ratio >= 0.6) return 'major';
  if (ratio >= 0.35) return 'borderline';
  return 'none';
}

const VERDICT_STYLES = {
  major: { emoji: '🔴', color: 'text-[hsl(0,75%,55%)]', borderColor: 'border-[hsl(0,75%,55%)]', bgColor: 'bg-[hsl(0,75%,55%,0.1)]' },
  borderline: { emoji: '🟠', color: 'text-[hsl(33,96%,49%)]', borderColor: 'border-[hsl(33,96%,49%)]', bgColor: 'bg-[hsl(33,96%,49%,0.1)]' },
  none: { emoji: '🟢', color: 'text-[hsl(122,39%,45%)]', borderColor: 'border-[hsl(122,39%,45%)]', bgColor: 'bg-[hsl(122,39%,45%,0.1)]' },
};

export default function DoraIncidentReporter({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  const steps: WizardStep[] = STEP_DEFS.map(s => ({
    id: s.id,
    question: s.question[lang] || s.question.en,
    options: s.options.map(o => ({ label: o.label[lang] || o.label.en, value: o.value, weight: o.weight })),
  }));

  const verdictTitles: Record<Verdict, string> = {
    major: t(I18N.verdictMajor),
    borderline: t(I18N.verdictBorderline),
    none: t(I18N.verdictNone),
  };

  const [started, setStarted] = useState(embedded);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number; label: string }>>({});
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  const progress = ((currentStep) / steps.length) * 100;

  const handleAnswer = (step: WizardStep, option: { label: string; value: string; weight: number }) => {
    const newAnswers = { ...answers, [step.id]: { value: option.value, weight: option.weight, label: option.label } };
    setAnswers(newAnswers);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const result = classify(newAnswers);
      setVerdict(result);
      fetchReasoning(newAnswers, result);
    }
  };

  const fetchReasoning = async (ans: Record<string, { value: string; weight: number; label: string }>, v: Verdict) => {
    setLoadingReasoning(true);
    try {
      const { data, error } = await supabase.functions.invoke('dora-reasoning', {
        body: { answers: ans, verdict: v, language: lang },
      });
      if (error) throw error;
      setReasoning(data?.reasoning || t({ de: 'Begründung konnte nicht generiert werden.', en: 'Reasoning could not be generated.', fr: 'La justification n\'a pas pu être générée.' }));
    } catch (e) {
      console.error('Reasoning error:', e);
      setReasoning(t({ de: 'Begründung konnte nicht geladen werden.', en: 'Reasoning could not be loaded.', fr: 'La justification n\'a pas pu être chargée.' }));
    } finally {
      setLoadingReasoning(false);
    }
  };

  const goBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const restart = () => { setStarted(embedded); setCurrentStep(0); setAnswers({}); setVerdict(null); setReasoning(''); };

  const wrapperClass = embedded ? 'flex items-center justify-center p-4' : 'min-h-screen flex items-center justify-center p-4';

  // Entry button (standalone only)
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="DORA Incident Check" description="DORA Art. 19 Incident Check" />
        <button onClick={() => setStarted(true)} className="px-8 py-4 font-mono text-lg border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] flex items-center gap-3">
          {t(I18N.start)}
        </button>
      </div>
    );
  }

  // Result screen
  if (verdict) {
    const vs = VERDICT_STYLES[verdict];
    return (
      <div className={wrapperClass}>
        <PageMeta title="DORA Incident Check" description="DORA Art. 19 Incident Check" />
        <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono mb-6">
          <Typewriter text={t(I18N.title)} charDelay={12} />
        </h1>
        <div className="w-full max-w-xl">
          <div className={`${vs.bgColor} ${vs.borderColor} border-2 rounded-lg p-6 mb-6 text-center`}>
            <div className="text-4xl mb-2">{vs.emoji}</div>
            <h2 className={`text-xl md:text-2xl font-mono font-bold ${vs.color}`}>{verdictTitles[verdict]}</h2>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 mb-5">
            <h3 className="text-primary font-mono text-sm mb-2 uppercase tracking-wider">{t(I18N.reasoning)}</h3>
            {loadingReasoning ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="animate-pulse">●</span> {t(I18N.loading)}
              </div>
            ) : (
              <p className="text-foreground/80 text-sm leading-relaxed">{reasoning}</p>
            )}
          </div>

          {verdict === 'major' && (
            <div className="bg-card border border-border rounded-lg p-5 mb-5">
              <h3 className="text-primary font-mono text-sm mb-3 uppercase tracking-wider">{t(I18N.deadlines)}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(0,75%,55%)] font-bold min-w-[60px]">4 h</span>
                  <span className="text-foreground/80">{t(I18N.earlyWarning)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(33,96%,49%)] font-bold min-w-[60px]">72 h</span>
                  <span className="text-foreground/80">{t(I18N.intermediate)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[hsl(122,39%,45%)] font-bold min-w-[60px]">1 {lang === 'fr' ? 'mois' : lang === 'de' ? 'Monat' : 'month'}</span>
                  <span className="text-foreground/80">{t(I18N.finalReport)}</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-3">{t(I18N.authority)}</p>
            </div>
          )}

          <div className="flex justify-center mb-5">
            <Button onClick={restart} variant="outline" className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 font-mono">
              <RotateCcw className="w-4 h-4 mr-2" /> {t(I18N.restart)}
            </Button>
          </div>

          <p className="text-muted-foreground text-xs text-center italic">{t(I18N.disclaimer)}</p>
        </div>
      </div>
    );
  }

  // Wizard steps
  const step = steps[currentStep];
  return (
    <div className={wrapperClass}>
      <PageMeta title="DORA Incident Check" description="DORA Art. 19 Incident Check" />
      <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono mb-6">
        <Typewriter text={t(I18N.title)} charDelay={12} />
      </h1>
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground font-mono mb-2">
            <span>{t(I18N.step)} {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        <h2 className="text-lg md:text-xl font-mono text-primary mb-6 leading-snug">{step.question}</h2>

        <div className="space-y-3 mb-6">
          {step.options.map((opt) => {
            const isSelected = answers[step.id]?.value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(step, opt)}
                className={`w-full text-left px-5 py-4 rounded-lg border-2 font-mono text-sm md:text-base transition-electric
                  ${isSelected ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-primary/5'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {currentStep > 0 && (
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground text-sm font-mono hover:text-primary transition-electric">
            <ArrowLeft className="w-4 h-4" /> {t(I18N.back)}
          </button>
        )}
      </div>
    </div>
  );
}
