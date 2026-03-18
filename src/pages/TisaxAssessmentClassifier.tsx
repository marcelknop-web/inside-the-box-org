import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';
import { StaggerReveal } from '@/components/StaggerReveal';
import { generateTisaxProtocol } from '@/utils/tisaxProtocolPdf';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

type AssessmentLevel = 'AL1' | 'AL2' | 'AL3' | 'none';

interface StepDef {
  id: string;
  question: Record<string, string>;
  options: { label: Record<string, string>; value: string; weight: number }[];
}

const STEP_DEFS: StepDef[] = [
  {
    id: 'role',
    question: {
      de: 'Welche Beschreibung trifft auf Ihre Organisation zu?',
      en: 'Which description applies to your organization?',
      fr: 'Quelle description correspond à votre organisation ?',
    },
    options: [
      { label: { de: 'OEM (Fahrzeughersteller)', en: 'OEM (Vehicle manufacturer)', fr: 'OEM (Constructeur automobile)' }, value: 'oem', weight: 3 },
      { label: { de: 'Tier-1 Zulieferer (Direktlieferant an OEM)', en: 'Tier-1 supplier (direct supplier to OEM)', fr: 'Fournisseur Tier-1 (fournisseur direct OEM)' }, value: 'tier1', weight: 3 },
      { label: { de: 'Tier-2 / Tier-N Zulieferer', en: 'Tier-2 / Tier-N supplier', fr: 'Fournisseur Tier-2 / Tier-N' }, value: 'tier2', weight: 2 },
      { label: { de: 'Dienstleister / IT-Provider für die Automobilindustrie', en: 'Service provider / IT provider for automotive', fr: 'Prestataire / fournisseur IT pour l\'automobile' }, value: 'provider', weight: 2 },
      { label: { de: 'Sonstige (kein direkter Automotive-Bezug)', en: 'Other (no direct automotive relation)', fr: 'Autre (pas de lien automobile direct)' }, value: 'other', weight: 0 },
    ],
  },
  {
    id: 'information',
    question: {
      de: 'Welche Informationen erhalten oder verarbeiten Sie von OEMs oder Tier-1?',
      en: 'What information do you receive or process from OEMs or Tier-1?',
      fr: 'Quelles informations recevez-vous ou traitez-vous des OEM ou Tier-1 ?',
    },
    options: [
      { label: { de: 'Konstruktions- und Entwicklungsdaten (CAD, technische Zeichnungen)', en: 'Design and development data (CAD, technical drawings)', fr: 'Données de conception et développement (CAO, dessins techniques)' }, value: 'cad', weight: 3 },
      { label: { de: 'Prototypen-Informationen oder Fahrzeugdesign (noch nicht veröffentlicht)', en: 'Prototype information or vehicle design (not yet published)', fr: 'Informations prototypes ou design véhicule (non publié)' }, value: 'prototype', weight: 3 },
      { label: { de: 'Persönliche Daten von Mitarbeitern oder Kunden', en: 'Personal data of employees or customers', fr: 'Données personnelles d\'employés ou de clients' }, value: 'personal', weight: 2 },
      { label: { de: 'Finanz- oder Vertragsdaten', en: 'Financial or contract data', fr: 'Données financières ou contractuelles' }, value: 'financial', weight: 1 },
      { label: { de: 'Keine der genannten Kategorien', en: 'None of the above', fr: 'Aucune des catégories ci-dessus' }, value: 'none', weight: 0 },
    ],
  },
  {
    id: 'prototype',
    question: {
      de: 'Sind Sie an der Entwicklung, dem Transport oder der Lagerung von Prototypenfahrzeugen oder -komponenten beteiligt?',
      en: 'Are you involved in development, transport or storage of prototype vehicles or components?',
      fr: 'Êtes-vous impliqué dans le développement, le transport ou le stockage de prototypes ?',
    },
    options: [
      { label: { de: 'Ja, direkt (Entwicklung, Bau, Test)', en: 'Yes, directly (development, build, test)', fr: 'Oui, directement (développement, construction, test)' }, value: 'direct', weight: 3 },
      { label: { de: 'Ja, indirekt (Transport, Lagerung, Absicherung)', en: 'Yes, indirectly (transport, storage, security)', fr: 'Oui, indirectement (transport, stockage, sécurisation)' }, value: 'indirect', weight: 2 },
      { label: { de: 'Nein', en: 'No', fr: 'Non' }, value: 'no', weight: 0 },
    ],
  },
  {
    id: 'network',
    question: {
      de: 'Haben Sie Netzwerkzugang zu IT-Systemen eines OEM oder Tier-1?',
      en: 'Do you have network access to IT systems of an OEM or Tier-1?',
      fr: 'Avez-vous un accès réseau aux systèmes IT d\'un OEM ou Tier-1 ?',
    },
    options: [
      { label: { de: 'Ja, direkter Netzwerkzugang (VPN, EDI, gemeinsame Systeme)', en: 'Yes, direct network access (VPN, EDI, shared systems)', fr: 'Oui, accès réseau direct (VPN, EDI, systèmes partagés)' }, value: 'direct', weight: 2 },
      { label: { de: 'Ja, indirekter Zugang (Portale, Cloud-Dienste des OEM)', en: 'Yes, indirect access (portals, OEM cloud services)', fr: 'Oui, accès indirect (portails, services cloud OEM)' }, value: 'indirect', weight: 1 },
      { label: { de: 'Nein', en: 'No', fr: 'Non' }, value: 'no', weight: 0 },
    ],
  },
  {
    id: 'dataclass',
    question: {
      de: 'Wie würden Sie die sensibelsten Informationen einordnen, die Sie verarbeiten?',
      en: 'How would you classify the most sensitive information you process?',
      fr: 'Comment classeriez-vous les informations les plus sensibles que vous traitez ?',
    },
    options: [
      { label: { de: 'Streng vertraulich (z.B. Vorentwicklung, Fahrzeugarchitektur)', en: 'Strictly confidential (e.g. pre-development, vehicle architecture)', fr: 'Strictement confidentiel (ex. pré-développement, architecture véhicule)' }, value: 'strictly-confidential', weight: 3 },
      { label: { de: 'Vertraulich (z.B. Projektpläne, Lieferantenverträge)', en: 'Confidential (e.g. project plans, supplier contracts)', fr: 'Confidentiel (ex. plans de projet, contrats fournisseurs)' }, value: 'confidential', weight: 2 },
      { label: { de: 'Intern (z.B. allgemeine Geschäftsdokumente)', en: 'Internal (e.g. general business documents)', fr: 'Interne (ex. documents commerciaux généraux)' }, value: 'internal', weight: 1 },
      { label: { de: 'Öffentlich / keine sensiblen Daten', en: 'Public / no sensitive data', fr: 'Public / pas de données sensibles' }, value: 'public', weight: 0 },
    ],
  },
  {
    id: 'oemrequest',
    question: {
      de: 'Haben Sie bereits eine konkrete TISAX-Anforderung von einem OEM erhalten?',
      en: 'Have you already received a concrete TISAX requirement from an OEM?',
      fr: 'Avez-vous déjà reçu une exigence TISAX concrète d\'un OEM ?',
    },
    options: [
      { label: { de: 'Ja, OEM fordert AL3 (Prototypenschutz / höchste Vertraulichkeit)', en: 'Yes, OEM requires AL3 (prototype protection / highest confidentiality)', fr: 'Oui, OEM exige AL3 (protection prototypes / confidentialité maximale)' }, value: 'yes-al3', weight: 3 },
      { label: { de: 'Ja, OEM fordert AL2 (Standard-Informationssicherheits-Audit)', en: 'Yes, OEM requires AL2 (standard information security audit)', fr: 'Oui, OEM exige AL2 (audit standard de sécurité de l\'information)' }, value: 'yes-al2', weight: 2 },
      { label: { de: 'Ja, ohne Angabe eines Levels', en: 'Yes, without specified level', fr: 'Oui, sans niveau spécifié' }, value: 'yes-nolevel', weight: 2 },
      { label: { de: 'Nein, aber wir erwarten eine Anforderung', en: 'No, but we expect a requirement', fr: 'Non, mais nous attendons une exigence' }, value: 'expected', weight: 1 },
      { label: { de: 'Nein', en: 'No', fr: 'Non' }, value: 'no', weight: 0 },
    ],
  },
];

const I18N = {
  title: { de: 'TISAX Einstufungs-Check', en: 'TISAX Assessment Check', fr: 'TISAX Classification Check' },
  step: { de: 'Schritt', en: 'Step', fr: 'Étape' },
  back: { de: 'Zurück', en: 'Back', fr: 'Retour' },
  next: { de: 'Weiter', en: 'Next', fr: 'Suivant' },
  restart: { de: 'Neu starten', en: 'Restart', fr: 'Recommencer' },
  reasoning: { de: 'Begründung', en: 'Reasoning', fr: 'Justification' },
  loading: { de: 'TISAX-Einstufung wird analysiert…', en: 'Analyzing TISAX classification…', fr: 'Analyse de la classification TISAX…' },
  start: { de: '🚗 TISAX Einstufungs-Check starten', en: '🚗 Start TISAX Assessment Check', fr: '🚗 Lancer le TISAX Classification Check' },
  disclaimer: { de: 'Dieses Tool ersetzt keine offizielle TISAX-Beratung. Einschätzung basiert auf den VDA ISA Kriterien und dem ENX TISAX-Regelwerk.', en: 'This tool does not replace official TISAX consulting. Assessment based on VDA ISA criteria and ENX TISAX framework.', fr: 'Cet outil ne remplace pas un conseil TISAX officiel. Évaluation basée sur les critères VDA ISA et le cadre ENX TISAX.' },
  nextSteps: { de: 'Nächste Schritte', en: 'Next Steps', fr: 'Prochaines étapes' },
  nextStep1: { de: 'Registrierung im ENX-Portal (enx.com/tisax)', en: 'Register on the ENX portal (enx.com/tisax)', fr: 'Inscription sur le portail ENX (enx.com/tisax)' },
  nextStep2: { de: 'Auditplanung mit akkreditiertem Prüfdienstleister', en: 'Audit planning with accredited audit provider', fr: 'Planification d\'audit avec un prestataire accrédité' },
  nextStep3: { de: 'VDA ISA Self-Assessment als Vorbereitung', en: 'VDA ISA self-assessment as preparation', fr: 'Auto-évaluation VDA ISA en préparation' },
  criterion: { de: 'Kriterium', en: 'Criterion', fr: 'Critère' },
  yourAnswer: { de: 'Ihre Angabe', en: 'Your Answer', fr: 'Votre réponse' },
  relevance: { de: 'Relevanz', en: 'Relevance', fr: 'Pertinence' },
  backToWorkflows: { de: 'Zurück zu KI-Workflows', en: 'Back to AI Workflows', fr: 'Retour aux workflows IA' },
  downloadProtocol: { de: 'Prüfprotokoll herunterladen', en: 'Download Assessment Protocol', fr: 'Télécharger le protocole' },
  plausibilityWarning: { de: 'Plausibilitätshinweis', en: 'Plausibility Notice', fr: 'Avis de plausibilité' },
  demo: { de: 'Demo', en: 'Demo', fr: 'Démo' },
  demoHint: { de: 'Beispielwerte einfügen', en: 'Insert example values', fr: 'Insérer des valeurs d\'exemple' },
};

/* ── Demo scenarios (plausible profiles) ── */
const DEMO_SCENARIOS: Record<string, string>[] = [
  { role: 'tier1', information: 'cad', prototype: 'indirect', network: 'direct', dataclass: 'confidential', oemrequest: 'yes-al2' },
  { role: 'oem', information: 'prototype', prototype: 'direct', network: 'direct', dataclass: 'strictly-confidential', oemrequest: 'yes-al3' },
  { role: 'provider', information: 'personal', prototype: 'no', network: 'indirect', dataclass: 'internal', oemrequest: 'expected' },
  { role: 'tier2', information: 'financial', prototype: 'no', network: 'indirect', dataclass: 'internal', oemrequest: 'no' },
  { role: 'tier1', information: 'prototype', prototype: 'direct', network: 'direct', dataclass: 'strictly-confidential', oemrequest: 'yes-al3' },
  { role: 'provider', information: 'cad', prototype: 'indirect', network: 'direct', dataclass: 'confidential', oemrequest: 'yes-al2' },
  { role: 'tier2', information: 'personal', prototype: 'no', network: 'no', dataclass: 'internal', oemrequest: 'expected' },
  { role: 'oem', information: 'cad', prototype: 'indirect', network: 'direct', dataclass: 'confidential', oemrequest: 'yes-nolevel' },
];

const STEP_LABELS: Record<string, Record<string, string>> = {
  role: { de: 'Rolle in Supply Chain', en: 'Role in Supply Chain', fr: 'Rôle dans la chaîne' },
  information: { de: 'Informationskategorie', en: 'Information Category', fr: 'Catégorie d\'information' },
  prototype: { de: 'Prototypenschutz', en: 'Prototype Protection', fr: 'Protection des prototypes' },
  network: { de: 'OEM-Netzwerkzugang', en: 'OEM Network Access', fr: 'Accès réseau OEM' },
  dataclass: { de: 'Datenkategorie', en: 'Data Category', fr: 'Catégorie de données' },
  oemrequest: { de: 'OEM-Anforderung', en: 'OEM Requirement', fr: 'Exigence OEM' },
};

/** Detect contradictory answer combinations */
function getPlausibilityWarnings(answers: Record<string, { value: string; weight: number }>, lang: 'de' | 'en' | 'fr'): string[] {
  const warnings: string[] = [];
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  // "Other / no automotive" but high-sensitivity data or prototypes
  if (answers.role?.value === 'other') {
    if (answers.prototype?.value === 'direct') {
      warnings.push(t({
        de: 'Rolle „Sonstige" steht im Widerspruch zu direktem Prototypen-Kontakt. Bitte prüfen.',
        en: 'Role "Other" contradicts direct prototype involvement. Please review.',
        fr: 'Rôle « Autre » en contradiction avec l\'implication directe dans les prototypes. Veuillez vérifier.',
      }));
    }
    if (answers.dataclass?.value === 'strictly-confidential') {
      warnings.push(t({
        de: 'Rolle „Sonstige" steht im Widerspruch zu streng vertraulichen Daten. Bitte prüfen.',
        en: 'Role "Other" contradicts strictly confidential data. Please review.',
        fr: 'Rôle « Autre » en contradiction avec des données strictement confidentielles. Veuillez vérifier.',
      }));
    }
  }

  // No sensitive data but OEM requests specific level
  if (answers.information?.value === 'none' && answers.dataclass?.value === 'public') {
    if (answers.oemrequest?.value === 'yes-al3' || answers.oemrequest?.value === 'yes-al2') {
      warnings.push(t({
        de: 'OEM-Anforderung vorhanden, aber keine sensiblen Daten angegeben. Bitte Datenkategorien prüfen.',
        en: 'OEM requirement present but no sensitive data indicated. Please review data categories.',
        fr: 'Exigence OEM présente mais aucune donnée sensible indiquée. Veuillez vérifier les catégories.',
      }));
    }
  }

  return warnings;
}

function classify(answers: Record<string, { value: string; weight: number }>): AssessmentLevel {
  const role = answers.role?.value;
  const info = answers.information?.value;
  const proto = answers.prototype?.value;
  const net = answers.network?.value;
  const data = answers.dataclass?.value;
  const oem = answers.oemrequest?.value;

  const hasAutomotiveContext = role !== 'other' && role !== undefined;

  // ── AL3: Only with automotive context OR explicit OEM AL3 request ──
  if (oem === 'yes-al3') return 'AL3';
  if (proto === 'direct' && hasAutomotiveContext) return 'AL3';
  if (data === 'strictly-confidential' && hasAutomotiveContext) return 'AL3';
  if (info === 'prototype' && hasAutomotiveContext) return 'AL3';

  // ── AL2: Explicit OEM AL2, or significant indicators with context ──
  if (oem === 'yes-al2') return 'AL2';
  if (proto === 'indirect') return 'AL2';
  if (data === 'confidential') return 'AL2';
  if (info === 'cad' && hasAutomotiveContext) return 'AL2';
  if (net === 'direct' && hasAutomotiveContext) return 'AL2';
  if (oem === 'yes-nolevel') return 'AL2';

  // Fix #2: Role alone (OEM/Tier-1) triggers AL2 only with at least one supporting indicator
  if (role === 'oem' || role === 'tier1') {
    const hasSupporting = info !== 'none' || data !== 'public' || net !== 'no' || proto !== 'no';
    if (hasSupporting) return 'AL2';
  }

  // ── AL1: Weight-based with raised threshold (Fix #3) ──
  const totalWeight = Object.values(answers).reduce((s, a) => s + a.weight, 0);
  if (totalWeight >= 5) return 'AL1';
  if (oem === 'expected' && totalWeight >= 3) return 'AL1';

  return 'none';
}

function getRelevance(weight: number): { emoji: string; label: Record<string, string>; color: string } {
  if (weight >= 3) return { emoji: '🔴', label: { de: 'Hoch', en: 'High', fr: 'Élevé' }, color: 'text-[hsl(0,75%,55%)]' };
  if (weight >= 2) return { emoji: '🟠', label: { de: 'Mittel', en: 'Medium', fr: 'Moyen' }, color: 'text-[hsl(33,96%,49%)]' };
  if (weight >= 1) return { emoji: '🟡', label: { de: 'Gering', en: 'Low', fr: 'Faible' }, color: 'text-[hsl(45,80%,55%)]' };
  return { emoji: '🟢', label: { de: 'Nicht relevant', en: 'Not relevant', fr: 'Non pertinent' }, color: 'text-[hsl(122,39%,45%)]' };
}

const VERDICT_STYLES: Record<AssessmentLevel, { emoji: string; color: string; borderColor: string; bgColor: string; label: Record<string, string> }> = {
  AL3: { emoji: '🔴', color: 'text-[hsl(0,75%,55%)]', borderColor: 'border-[hsl(0,75%,55%)]', bgColor: 'bg-[hsl(0,75%,55%,0.1)]', label: { de: 'AL3 – Erweiterter Audit (Prototypenschutz / hohe Vertraulichkeit)', en: 'AL3 – Extended audit (prototype protection / high confidentiality)', fr: 'AL3 – Audit étendu (protection des prototypes / haute confidentialité)' } },
  AL2: { emoji: '🟠', color: 'text-[hsl(33,96%,49%)]', borderColor: 'border-[hsl(33,96%,49%)]', bgColor: 'bg-[hsl(33,96%,49%,0.1)]', label: { de: 'AL2 – Audit durch akkreditierten Prüfdienstleister erforderlich', en: 'AL2 – Audit by accredited audit provider required', fr: 'AL2 – Audit par prestataire accrédité requis' } },
  AL1: { emoji: '🟢', color: 'text-[hsl(122,39%,45%)]', borderColor: 'border-[hsl(122,39%,45%)]', bgColor: 'bg-[hsl(122,39%,45%,0.1)]', label: { de: 'AL1 – Self-Assessment ausreichend', en: 'AL1 – Self-assessment sufficient', fr: 'AL1 – Auto-évaluation suffisante' } },
  none: { emoji: '⚪', color: 'text-muted-foreground', borderColor: 'border-muted-foreground/50', bgColor: 'bg-muted/20', label: { de: 'Kein TISAX-Bedarf erkennbar', en: 'No TISAX need identified', fr: 'Aucun besoin TISAX identifié' } },
};

export default function TisaxAssessmentClassifier({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  const [started, setStarted] = useState(embedded);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number; label: string }>>({});
  const [verdict, setVerdict] = useState<AssessmentLevel | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  const steps = STEP_DEFS.map(s => ({
    id: s.id,
    question: s.question[lang] || s.question.en,
    options: s.options.map(o => ({ label: o.label[lang] || o.label.en, value: o.value, weight: o.weight })),
  }));

  const progress = (currentStep / steps.length) * 100;

  const selectOption = (stepId: string, option: { label: string; value: string; weight: number }) => {
    setAnswers(prev => ({ ...prev, [stepId]: { value: option.value, weight: option.weight, label: option.label } }));
  };

  const advanceStep = () => {
    const step = steps[currentStep];
    if (!answers[step.id]) return; // nothing selected
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const result = classify(answers);
      setVerdict(result);
      fetchReasoning(answers, result);
    }
  };

  const handleDemo = () => {
    const scenario = DEMO_SCENARIOS[Math.floor(Math.random() * DEMO_SCENARIOS.length)];
    const step = steps[currentStep];
    const stepDef = STEP_DEFS[currentStep];
    const targetValue = scenario[step.id];
    const opt = stepDef.options.find(o => o.value === targetValue);
    if (opt) {
      selectOption(step.id, { label: opt.label[lang] || opt.label.en, value: opt.value, weight: opt.weight });
    }
  };

  const fetchReasoning = async (ans: Record<string, { value: string; weight: number; label: string }>, v: AssessmentLevel) => {
    setLoadingReasoning(true);
    try {
      const { data, error } = await supabase.functions.invoke('tisax-reasoning', {
        body: { answers: ans, verdict: v, language: lang },
      });
      if (error) throw error;
      setReasoning(data?.reasoning || t({ de: 'Begründung konnte nicht generiert werden.', en: 'Reasoning could not be generated.', fr: 'La justification n\'a pas pu être générée.' }));
    } catch (e) {
      console.error('TISAX reasoning error:', e);
      setReasoning(t({ de: 'Begründung konnte nicht geladen werden.', en: 'Reasoning could not be loaded.', fr: 'La justification n\'a pas pu être chargée.' }));
    } finally {
      setLoadingReasoning(false);
    }
  };


  const goBack = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const restart = () => { setStarted(embedded); setCurrentStep(0); setAnswers({}); setVerdict(null); setReasoning(''); };

  const wrapperClass = embedded ? 'space-y-3' : 'min-h-screen p-4 max-w-2xl mx-auto';

  // Entry button (standalone only)
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PageMeta title="TISAX Assessment Check" description="TISAX Assessment Level Classifier" />
        <button onClick={() => setStarted(true)} className="px-8 py-4 font-mono text-lg border-2 border-primary/60 bg-primary/10 text-primary rounded-lg transition-electric hover:bg-primary/20 hover:border-primary hover:shadow-[var(--shadow-electric)] flex items-center gap-3">
          {t(I18N.start)}
        </button>
      </div>
    );
  }

  // Result screen
  if (verdict) {
    const vs = VERDICT_STYLES[verdict];
    const warnings = getPlausibilityWarnings(answers, lang);
    return (
      <div className={wrapperClass}>
        <PageMeta title="TISAX Assessment Check" description="TISAX Assessment Level Classifier" />
        <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-3`}>
          <Typewriter text={t(I18N.title)} charDelay={8} />
        </h1>
        <StaggerReveal stagger={400}>
          <div className={`${vs.bgColor} ${vs.borderColor} border-2 rounded-lg p-6 text-center`}>
            <div className="text-4xl mb-2">{vs.emoji}</div>
            <h2 className={`text-xl md:text-2xl font-mono font-bold ${vs.color}`}>{t(vs.label)}</h2>
          </div>

          {/* Plausibility warnings */}
          {warnings.length > 0 && (
            <div className="bg-[hsl(45,80%,55%,0.1)] border-2 border-[hsl(45,80%,55%,0.4)] rounded-lg p-4">
              <div className="font-mono text-sm font-bold text-[hsl(45,80%,55%)] uppercase tracking-wider mb-2">⚠️ {t(I18N.plausibilityWarning)}</div>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {warnings.map((w, i) => (
                  <li key={i} className="flex gap-2"><span className="text-[hsl(45,80%,55%)] flex-shrink-0">›</span>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary table */}
          <div className="bg-highlight/5 border border-highlight/20 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.criterion)}</TableHead>
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.yourAnswer)}</TableHead>
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.relevance)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(answers).map(([key, val]) => {
                  const rel = getRelevance(val.weight);
                  return (
                    <TableRow key={key} className="border-primary/10">
                      <TableCell className="font-mono text-sm text-foreground/80">{t(STEP_LABELS[key] || { de: key, en: key, fr: key })}</TableCell>
                      <TableCell className="text-sm text-foreground/80">{val.label}</TableCell>
                      <TableCell className={`text-sm font-semibold ${rel.color}`}>{rel.emoji} {t(rel.label)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* AI reasoning */}
          <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-5">
            <h3 className="text-primary font-mono text-sm mb-2 uppercase tracking-wider">{t(I18N.reasoning)}</h3>
            {loadingReasoning ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="animate-pulse">●</span> {t(I18N.loading)}
              </div>
            ) : (
              <p className="text-foreground/80 text-sm leading-relaxed">{reasoning}</p>
            )}
          </div>

          {/* Next steps */}
          {verdict !== 'none' && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-5">
              <h3 className="text-primary font-mono text-sm mb-3 uppercase tracking-wider">{t(I18N.nextSteps)}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-primary font-bold">1.</span>
                  <span className="text-foreground/80">{t(I18N.nextStep1)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-bold">2.</span>
                  <span className="text-foreground/80">{t(I18N.nextStep2)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-bold">3.</span>
                  <span className="text-foreground/80">{t(I18N.nextStep3)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              onClick={() => generateTisaxProtocol({
                answers,
                verdict,
                verdictLabel: t(vs.label),
                reasoning: reasoning || t({ de: 'Begründung wird geladen…', en: 'Reasoning loading…', fr: 'Justification en cours…' }),
                language: lang,
                stepLabels: Object.fromEntries(Object.keys(answers).map(k => [k, t(STEP_LABELS[k] || { de: k, en: k, fr: k })])),
                stepQuestions: Object.fromEntries(STEP_DEFS.map(s => [s.id, s.question[lang] || s.question.en])),
              })}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-mono"
            >
              <FileText className="w-4 h-4 mr-2" /> {t(I18N.downloadProtocol)}
            </Button>
            <Button onClick={restart} variant="outline" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-mono">
              <RotateCcw className="w-4 h-4 mr-2" /> {t(I18N.restart)}
            </Button>
          </div>

          <p className="text-muted-foreground text-xs text-center italic">{t(I18N.disclaimer)}</p>
        </StaggerReveal>
      </div>
    );
  }

  // Wizard steps
  const step = steps[currentStep];
  return (
    <div className={wrapperClass}>
      <PageMeta title="TISAX Assessment Check" description="TISAX Assessment Level Classifier" />
      <h1 className={`${embedded ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-primary font-mono mb-3`}>
        <Typewriter text={t(I18N.title)} charDelay={8} />
      </h1>
      <div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground font-mono mb-2">
            <span>{t(I18N.step)} {currentStep + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        <h2 className="text-lg md:text-xl font-mono text-primary mb-6 leading-snug">{step.question}</h2>

        <StaggerReveal resetKey={step.id} stagger={300} className="mb-6">
          {step.options.map((opt) => {
            const isSelected = answers[step.id]?.value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(step.id, opt)}
                className={`w-full text-left px-5 py-4 rounded-lg border-2 font-mono text-sm md:text-base transition-electric
                  ${isSelected ? 'border-highlight bg-highlight/15 text-highlight' : 'border-primary/40 bg-transparent text-foreground/80 hover:border-highlight hover:bg-highlight/5 hover:text-highlight'}`}
              >
                {opt.label}
              </button>
            );
          })}
        </StaggerReveal>

        {currentStep > 0 && (
          <button onClick={goBack} className="flex items-center gap-2 text-muted-foreground text-sm font-mono hover:text-primary transition-electric">
            <ArrowLeft className="w-4 h-4" /> {t(I18N.back)}
          </button>
        )}
      </div>
    </div>
  );
}
