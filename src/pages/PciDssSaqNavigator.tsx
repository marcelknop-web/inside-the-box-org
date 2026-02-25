import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageMeta } from '@/components/PageMeta';
import Typewriter from '@/components/Typewriter';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

type SaqType = 'A' | 'A-EP' | 'B' | 'B-IP' | 'C' | 'C-VT' | 'D-Merchant' | 'D-SP' | 'none';

interface StepDef {
  id: string;
  question: Record<string, string>;
  options: { label: Record<string, string>; value: string; weight: number }[];
  condition?: (answers: Record<string, { value: string }>) => boolean;
}

const STEP_DEFS: StepDef[] = [
  {
    id: 'role',
    question: {
      de: 'Wie ist Ihre Organisation am Zahlungsprozess beteiligt?',
      en: 'How is your organization involved in the payment process?',
      fr: 'Comment votre organisation est-elle impliquée dans le processus de paiement ?',
    },
    options: [
      { label: { de: 'Händler (Merchant) – ich nehme Kartenzahlungen an', en: 'Merchant – I accept card payments', fr: 'Commerçant – j\'accepte les paiements par carte' }, value: 'merchant', weight: 2 },
      { label: { de: 'Dienstleister (Service Provider) – ich verarbeite Kartendaten für andere', en: 'Service Provider – I process card data for others', fr: 'Prestataire – je traite les données de carte pour d\'autres' }, value: 'service-provider', weight: 3 },
      { label: { de: 'Beides', en: 'Both', fr: 'Les deux' }, value: 'both', weight: 3 },
      { label: { de: 'Keine direkte Beteiligung', en: 'No direct involvement', fr: 'Pas d\'implication directe' }, value: 'none', weight: 0 },
    ],
  },
  {
    id: 'channel',
    question: {
      de: 'Über welche Kanäle nehmen Sie Kartenzahlungen an?',
      en: 'Through which channels do you accept card payments?',
      fr: 'Par quels canaux acceptez-vous les paiements par carte ?',
    },
    options: [
      { label: { de: 'Nur E-Commerce (ausschließlich online)', en: 'E-commerce only (online only)', fr: 'E-commerce uniquement (en ligne)' }, value: 'ecommerce', weight: 2 },
      { label: { de: 'Nur stationär (POS-Terminal im Geschäft)', en: 'In-store only (POS terminal)', fr: 'En magasin uniquement (terminal POS)' }, value: 'pos', weight: 1 },
      { label: { de: 'Telefonisch / Mail Order (MOTO)', en: 'Phone / Mail Order (MOTO)', fr: 'Téléphone / commande postale (MOTO)' }, value: 'moto', weight: 2 },
      { label: { de: 'Kombination mehrerer Kanäle', en: 'Combination of multiple channels', fr: 'Combinaison de plusieurs canaux' }, value: 'multi', weight: 3 },
    ],
  },
  {
    id: 'chd',
    question: {
      de: 'Speichern, verarbeiten oder übertragen Sie selbst Karteninhaber-Daten?',
      en: 'Do you store, process or transmit cardholder data yourself?',
      fr: 'Stockez-vous, traitez-vous ou transmettez-vous vous-même les données des titulaires de carte ?',
    },
    options: [
      { label: { de: 'Nein, vollständig ausgelagert an zertifizierten Payment Provider', en: 'No, fully outsourced to certified payment provider', fr: 'Non, entièrement externalisé à un prestataire certifié' }, value: 'outsourced', weight: 0 },
      { label: { de: 'Ja, aber nur verschlüsselt / tokenisiert', en: 'Yes, but only encrypted / tokenized', fr: 'Oui, mais uniquement chiffré / tokenisé' }, value: 'encrypted', weight: 1 },
      { label: { de: 'Ja, im Klartext', en: 'Yes, in plain text', fr: 'Oui, en clair' }, value: 'plaintext', weight: 3 },
    ],
  },
  {
    id: 'ecommerce-page',
    question: {
      de: 'Wie ist Ihre Zahlungsseite technisch umgesetzt?',
      en: 'How is your payment page technically implemented?',
      fr: 'Comment votre page de paiement est-elle techniquement implémentée ?',
    },
    condition: (answers) => ['ecommerce', 'multi'].includes(answers.channel?.value),
    options: [
      { label: { de: 'Vollständige Weiterleitung zum Payment Provider (Redirect, z.B. PayPal, Stripe Checkout)', en: 'Full redirect to payment provider (e.g. PayPal, Stripe Checkout)', fr: 'Redirection complète vers le prestataire (ex. PayPal, Stripe Checkout)' }, value: 'redirect', weight: 0 },
      { label: { de: 'iFrame des Payment Providers eingebettet', en: 'Payment provider iFrame embedded', fr: 'iFrame du prestataire intégré' }, value: 'iframe', weight: 1 },
      { label: { de: 'Eigenes Zahlungsformular auf meiner Website (direkte Karteneingabe)', en: 'Own payment form on my website (direct card entry)', fr: 'Formulaire de paiement propre sur mon site (saisie directe)' }, value: 'own-form', weight: 2 },
      { label: { de: 'Eigenes Formular mit direkter API-Integration zum Acquirer', en: 'Own form with direct API integration to acquirer', fr: 'Formulaire propre avec intégration API directe au acquéreur' }, value: 'direct-api', weight: 3 },
    ],
  },
  {
    id: 'network',
    question: {
      de: 'Sind Ihre Zahlungssysteme mit anderen IT-Systemen verbunden?',
      en: 'Are your payment systems connected to other IT systems?',
      fr: 'Vos systèmes de paiement sont-ils connectés à d\'autres systèmes IT ?',
    },
    options: [
      { label: { de: 'Nein, vollständig segmentiertes Netzwerk (CDE isoliert)', en: 'No, fully segmented network (CDE isolated)', fr: 'Non, réseau entièrement segmenté (CDE isolé)' }, value: 'isolated', weight: 0 },
      { label: { de: 'Ja, aber mit Firewall / Segmentierung', en: 'Yes, but with firewall / segmentation', fr: 'Oui, mais avec pare-feu / segmentation' }, value: 'segmented', weight: 1 },
      { label: { de: 'Ja, keine Segmentierung vorhanden', en: 'Yes, no segmentation in place', fr: 'Oui, pas de segmentation en place' }, value: 'flat', weight: 3 },
      { label: { de: 'Unbekannt', en: 'Unknown', fr: 'Inconnu' }, value: 'unknown', weight: 2 },
    ],
  },
  {
    id: 'volume',
    question: {
      de: 'Wie viele Kartentransaktionen verarbeiten Sie jährlich?',
      en: 'How many card transactions do you process annually?',
      fr: 'Combien de transactions par carte traitez-vous annuellement ?',
    },
    options: [
      { label: { de: '<20.000 (E-Commerce) oder <1 Mio. (alle Kanäle)', en: '<20,000 (e-commerce) or <1M (all channels)', fr: '<20 000 (e-commerce) ou <1M (tous canaux)' }, value: 'low', weight: 0 },
      { label: { de: '20.000–1 Mio. (E-Commerce)', en: '20,000–1M (e-commerce)', fr: '20 000–1M (e-commerce)' }, value: 'medium', weight: 1 },
      { label: { de: '1–6 Mio.', en: '1–6M', fr: '1–6M' }, value: 'high', weight: 2 },
      { label: { de: '>6 Mio.', en: '>6M', fr: '>6M' }, value: 'very-high', weight: 3 },
    ],
  },
  {
    id: 'certification',
    question: {
      de: 'Haben Sie bereits eine PCI-DSS Zertifizierung oder laufende Compliance?',
      en: 'Do you already have a PCI-DSS certification or ongoing compliance?',
      fr: 'Avez-vous déjà une certification PCI-DSS ou une conformité en cours ?',
    },
    options: [
      { label: { de: 'Ja, aktuelles AOC vorhanden', en: 'Yes, current AOC in place', fr: 'Oui, AOC actuel en place' }, value: 'current', weight: 0 },
      { label: { de: 'Ja, abgelaufen', en: 'Yes, expired', fr: 'Oui, expiré' }, value: 'expired', weight: 1 },
      { label: { de: 'Nein, Erstbewertung', en: 'No, initial assessment', fr: 'Non, évaluation initiale' }, value: 'first', weight: 2 },
      { label: { de: 'Unbekannt', en: 'Unknown', fr: 'Inconnu' }, value: 'unknown', weight: 1 },
    ],
  },
];

const I18N = {
  title: { de: 'PCI-DSS SAQ Navigator', en: 'PCI-DSS SAQ Navigator', fr: 'PCI-DSS SAQ Navigator' },
  step: { de: 'Schritt', en: 'Step', fr: 'Étape' },
  back: { de: 'Zurück', en: 'Back', fr: 'Retour' },
  restart: { de: 'Neu starten', en: 'Restart', fr: 'Recommencer' },
  reasoning: { de: 'Begründung', en: 'Reasoning', fr: 'Justification' },
  loading: { de: 'SAQ-Einstufung wird analysiert…', en: 'Analyzing SAQ classification…', fr: 'Analyse de la classification SAQ…' },
  start: { de: '💳 PCI-DSS SAQ Navigator starten', en: '💳 Start PCI-DSS SAQ Navigator', fr: '💳 Lancer le PCI-DSS SAQ Navigator' },
  disclaimer: { de: 'Dieses Tool ersetzt keine offizielle PCI-DSS Beratung oder QSA-Bewertung. Einschätzung basiert auf PCI DSS v4.0 SAQ-Kriterien.', en: 'This tool does not replace official PCI-DSS consulting or QSA assessment. Based on PCI DSS v4.0 SAQ criteria.', fr: 'Cet outil ne remplace pas un conseil PCI-DSS officiel ou une évaluation QSA. Basé sur les critères SAQ PCI DSS v4.0.' },
  nextSteps: { de: 'Nächste Schritte', en: 'Next Steps', fr: 'Prochaines étapes' },
  nextStep1: { de: 'QSA (Qualified Security Assessor) einschalten', en: 'Engage a QSA (Qualified Security Assessor)', fr: 'Engager un QSA (Qualified Security Assessor)' },
  nextStep2: { de: 'SAQ ausfüllen und Evidenz zusammenstellen', en: 'Complete SAQ and compile evidence', fr: 'Remplir le SAQ et compiler les preuves' },
  nextStep3: { de: 'AOC (Attestation of Compliance) erstellen', en: 'Create AOC (Attestation of Compliance)', fr: 'Créer l\'AOC (Attestation of Compliance)' },
  criterion: { de: 'Kriterium', en: 'Criterion', fr: 'Critère' },
  yourAnswer: { de: 'Ihre Angabe', en: 'Your Answer', fr: 'Votre réponse' },
  impact: { de: 'Einfluss auf SAQ', en: 'Impact on SAQ', fr: 'Impact sur SAQ' },
  merchantLevel: { de: 'Merchant Level', en: 'Merchant Level', fr: 'Merchant Level' },
  exportPdf: { de: 'Ergebnis als PDF exportieren', en: 'Export result as PDF', fr: 'Exporter le résultat en PDF' },
  backToWorkflows: { de: 'Zurück zu KI-Workflows', en: 'Back to AI Workflows', fr: 'Retour aux workflows IA' },
};

const STEP_LABELS: Record<string, Record<string, string>> = {
  role: { de: 'Rolle im Zahlungsprozess', en: 'Role in Payment Process', fr: 'Rôle dans le paiement' },
  channel: { de: 'Zahlungskanal', en: 'Payment Channel', fr: 'Canal de paiement' },
  chd: { de: 'CHD-Verarbeitung', en: 'CHD Processing', fr: 'Traitement CHD' },
  'ecommerce-page': { de: 'Zahlungsseite', en: 'Payment Page', fr: 'Page de paiement' },
  network: { de: 'Netzwerksegmentierung', en: 'Network Segmentation', fr: 'Segmentation réseau' },
  volume: { de: 'Transaktionsvolumen', en: 'Transaction Volume', fr: 'Volume de transactions' },
  certification: { de: 'Bestehende Zertifizierung', en: 'Existing Certification', fr: 'Certification existante' },
};

function classify(answers: Record<string, { value: string; weight: number }>): SaqType {
  const role = answers.role?.value;
  const channel = answers.channel?.value;
  const chd = answers.chd?.value;
  const ecommPage = answers['ecommerce-page']?.value;
  const network = answers.network?.value;

  // No involvement
  if (role === 'none') return 'none';

  // Service Provider → always SAQ D (SP)
  if (role === 'service-provider' || role === 'both') return 'D-SP';

  // Merchant path
  // Plaintext CHD or flat network → SAQ D
  if (chd === 'plaintext' || network === 'flat') return 'D-Merchant';

  // Fully outsourced CHD
  if (chd === 'outsourced') {
    if (channel === 'ecommerce' || channel === 'multi') {
      if (ecommPage === 'redirect') return 'A';
      if (ecommPage === 'iframe') return 'A-EP';
      // Own form even with outsourced → higher scope
      return 'A-EP';
    }
    if (channel === 'pos') return 'B';
    if (channel === 'moto') return 'C-VT';
    return 'A';
  }

  // Encrypted/tokenized CHD
  if (chd === 'encrypted') {
    if (channel === 'pos') return 'B-IP';
    if (channel === 'ecommerce') {
      if (ecommPage === 'redirect' || ecommPage === 'iframe') return 'A-EP';
      return 'C';
    }
    if (channel === 'moto') return 'C-VT';
    // Multi-channel with encrypted
    return 'C';
  }

  return 'D-Merchant';
}

function getMerchantLevel(volume: string): Record<string, string> {
  switch (volume) {
    case 'very-high': return { de: 'Level 1 – Jährlicher On-Site Audit durch QSA erforderlich', en: 'Level 1 – Annual on-site audit by QSA required', fr: 'Niveau 1 – Audit annuel sur site par QSA requis' };
    case 'high': return { de: 'Level 2 – Jährlicher SAQ + vierteljährlicher Netzwerk-Scan', en: 'Level 2 – Annual SAQ + quarterly network scan', fr: 'Niveau 2 – SAQ annuel + scan réseau trimestriel' };
    case 'medium': return { de: 'Level 3 – Jährlicher SAQ + vierteljährlicher Netzwerk-Scan', en: 'Level 3 – Annual SAQ + quarterly network scan', fr: 'Niveau 3 – SAQ annuel + scan réseau trimestriel' };
    default: return { de: 'Level 4 – Jährlicher SAQ empfohlen', en: 'Level 4 – Annual SAQ recommended', fr: 'Niveau 4 – SAQ annuel recommandé' };
  }
}

function getImpact(weight: number): { emoji: string; label: Record<string, string>; color: string } {
  if (weight >= 3) return { emoji: '🔴', label: { de: 'Hoch', en: 'High', fr: 'Élevé' }, color: 'text-[hsl(0,75%,55%)]' };
  if (weight >= 2) return { emoji: '🟠', label: { de: 'Mittel', en: 'Medium', fr: 'Moyen' }, color: 'text-[hsl(33,96%,49%)]' };
  if (weight >= 1) return { emoji: '🟡', label: { de: 'Scope-relevant', en: 'Scope-relevant', fr: 'Relevant pour le scope' }, color: 'text-[hsl(45,80%,55%)]' };
  return { emoji: '🟢', label: { de: 'Scope-reduzierend', en: 'Scope-reducing', fr: 'Réduction du scope' }, color: 'text-[hsl(122,39%,45%)]' };
}

const VERDICT_STYLES: Record<SaqType, { emoji: string; color: string; borderColor: string; bgColor: string; label: Record<string, string> }> = {
  'A': { emoji: '🟢', color: 'text-[hsl(122,39%,45%)]', borderColor: 'border-[hsl(122,39%,45%)]', bgColor: 'bg-[hsl(122,39%,45%,0.1)]', label: { de: 'SAQ A – Vollständige Auslagerung, minimaler Scope', en: 'SAQ A – Full outsourcing, minimal scope', fr: 'SAQ A – Externalisation complète, scope minimal' } },
  'A-EP': { emoji: '🟢', color: 'text-[hsl(122,39%,45%)]', borderColor: 'border-[hsl(122,39%,45%)]', bgColor: 'bg-[hsl(122,39%,45%,0.1)]', label: { de: 'SAQ A-EP – E-Commerce mit iFrame / Redirect, eigene Website betroffen', en: 'SAQ A-EP – E-commerce with iFrame / redirect, own website affected', fr: 'SAQ A-EP – E-commerce avec iFrame / redirection, site web propre affecté' } },
  'B': { emoji: '🟠', color: 'text-[hsl(33,96%,49%)]', borderColor: 'border-[hsl(33,96%,49%)]', bgColor: 'bg-[hsl(33,96%,49%,0.1)]', label: { de: 'SAQ B – Nur POS-Terminals, keine elektronische Speicherung', en: 'SAQ B – POS terminals only, no electronic storage', fr: 'SAQ B – Terminaux POS uniquement, pas de stockage électronique' } },
  'B-IP': { emoji: '🟠', color: 'text-[hsl(33,96%,49%)]', borderColor: 'border-[hsl(33,96%,49%)]', bgColor: 'bg-[hsl(33,96%,49%,0.1)]', label: { de: 'SAQ B-IP – IP-basierte POS-Terminals', en: 'SAQ B-IP – IP-based POS terminals', fr: 'SAQ B-IP – Terminaux POS basés sur IP' } },
  'C': { emoji: '🟠', color: 'text-[hsl(33,96%,49%)]', borderColor: 'border-[hsl(33,96%,49%)]', bgColor: 'bg-[hsl(33,96%,49%,0.1)]', label: { de: 'SAQ C – Zahlungsapplikation mit Internetverbindung', en: 'SAQ C – Payment application with internet connection', fr: 'SAQ C – Application de paiement avec connexion internet' } },
  'C-VT': { emoji: '🔴', color: 'text-[hsl(0,75%,55%)]', borderColor: 'border-[hsl(0,75%,55%)]', bgColor: 'bg-[hsl(0,75%,55%,0.1)]', label: { de: 'SAQ C-VT – Webbasierte virtuelle Terminals', en: 'SAQ C-VT – Web-based virtual terminals', fr: 'SAQ C-VT – Terminaux virtuels web' } },
  'D-Merchant': { emoji: '🔴', color: 'text-[hsl(0,75%,55%)]', borderColor: 'border-[hsl(0,75%,55%)]', bgColor: 'bg-[hsl(0,75%,55%,0.1)]', label: { de: 'SAQ D (Merchant) – Vollständiger Scope', en: 'SAQ D (Merchant) – Full scope', fr: 'SAQ D (Merchant) – Scope complet' } },
  'D-SP': { emoji: '🔴', color: 'text-[hsl(0,75%,55%)]', borderColor: 'border-[hsl(0,75%,55%)]', bgColor: 'bg-[hsl(0,75%,55%,0.1)]', label: { de: 'SAQ D (Service Provider) – Service Provider', en: 'SAQ D (Service Provider)', fr: 'SAQ D (Prestataire de services)' } },
  'none': { emoji: '⚪', color: 'text-muted-foreground', borderColor: 'border-muted-foreground/50', bgColor: 'bg-muted/20', label: { de: 'Kein PCI-DSS Scope erkennbar', en: 'No PCI-DSS scope identified', fr: 'Aucun scope PCI-DSS identifié' } },
};

export default function PciDssSaqNavigator({ embedded = false }: { embedded?: boolean }) {
  const { language } = useLanguage();
  const lang = language as 'de' | 'en' | 'fr';
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  const [started, setStarted] = useState(embedded);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; weight: number; label: string }>>({});
  const [verdict, setVerdict] = useState<SaqType | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [loadingReasoning, setLoadingReasoning] = useState(false);

  // Filter steps based on conditions
  const activeSteps = STEP_DEFS.filter(s => !s.condition || s.condition(answers));
  const activeStepIds = activeSteps.map(s => s.id);

  // Map currentStep to active steps
  const currentStepDef = activeSteps[currentStep];
  const steps = activeSteps.map(s => ({
    id: s.id,
    question: s.question[lang] || s.question.en,
    options: s.options.map(o => ({ label: o.label[lang] || o.label.en, value: o.value, weight: o.weight })),
  }));

  const progress = (currentStep / steps.length) * 100;

  const handleAnswer = (stepId: string, option: { label: string; value: string; weight: number }) => {
    const newAnswers = { ...answers, [stepId]: { value: option.value, weight: option.weight, label: option.label } };
    setAnswers(newAnswers);

    // Recalculate active steps with new answers
    const nextActiveSteps = STEP_DEFS.filter(s => !s.condition || s.condition(newAnswers));
    if (currentStep < nextActiveSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const result = classify(newAnswers);
      setVerdict(result);
      fetchReasoning(newAnswers, result);
    }
  };

  const fetchReasoning = async (ans: Record<string, { value: string; weight: number; label: string }>, v: SaqType) => {
    setLoadingReasoning(true);
    try {
      const { data, error } = await supabase.functions.invoke('pci-reasoning', {
        body: { answers: ans, verdict: v, language: lang },
      });
      if (error) throw error;
      setReasoning(data?.reasoning || t({ de: 'Begründung konnte nicht generiert werden.', en: 'Reasoning could not be generated.', fr: 'La justification n\'a pas pu être générée.' }));
    } catch (e) {
      console.error('PCI reasoning error:', e);
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
        <PageMeta title="PCI-DSS SAQ Navigator" description="PCI-DSS SAQ Type Navigator" />
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
        <PageMeta title="PCI-DSS SAQ Navigator" description="PCI-DSS SAQ Type Navigator" />
        <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono mb-6">
          <Typewriter text={t(I18N.title)} charDelay={8} />
        </h1>
        <div>
          <div className={`${vs.bgColor} ${vs.borderColor} border-2 rounded-lg p-6 mb-6 text-center`}>
            <div className="text-4xl mb-2">{vs.emoji}</div>
            <h2 className={`text-xl md:text-2xl font-mono font-bold ${vs.color}`}>{t(vs.label)}</h2>
          </div>

          {/* Merchant Level */}
          {answers.volume && verdict !== 'none' && (
            <div className="bg-card/40 border border-primary/20 rounded-lg p-4 mb-5">
              <h3 className="text-primary font-mono text-sm mb-1 uppercase tracking-wider">{t(I18N.merchantLevel)}</h3>
              <p className="text-foreground/80 text-sm font-mono">{t(getMerchantLevel(answers.volume.value))}</p>
            </div>
          )}

          {/* Summary table */}
          <div className="bg-card/40 border border-primary/20 rounded-lg mb-5 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.criterion)}</TableHead>
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.yourAnswer)}</TableHead>
                  <TableHead className="text-primary font-mono text-xs uppercase">{t(I18N.impact)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(answers).map(([key, val]) => {
                  if (!activeStepIds.includes(key)) return null;
                  const imp = getImpact(val.weight);
                  return (
                    <TableRow key={key} className="border-primary/10">
                      <TableCell className="font-mono text-sm text-foreground/80">{t(STEP_LABELS[key] || { de: key, en: key, fr: key })}</TableCell>
                      <TableCell className="text-sm text-foreground/80">{val.label}</TableCell>
                      <TableCell className={`text-sm font-semibold ${imp.color}`}>{imp.emoji} {t(imp.label)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* AI reasoning */}
          <div className="bg-card/40 border border-border rounded-lg p-5 mb-5">
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
            <div className="bg-card/40 border border-border rounded-lg p-5 mb-5">
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
          <div className="flex justify-center gap-3 mb-5 flex-wrap">
            <Button onClick={restart} variant="outline" className="border-highlight/30 text-highlight hover:bg-highlight/10 hover:border-highlight/50 font-mono">
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
      <PageMeta title="PCI-DSS SAQ Navigator" description="PCI-DSS SAQ Type Navigator" />
      <h1 className="text-2xl md:text-3xl font-bold text-primary font-mono mb-6">
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

        <div className="space-y-3 mb-6">
          {step.options.map((opt) => {
            const isSelected = answers[step.id]?.value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(step.id, opt)}
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
