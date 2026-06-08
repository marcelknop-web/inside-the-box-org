import { useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, Network, Car,
  CreditCard, Factory, Server, RotateCcw, Lock, AlertTriangle, CheckCircle2,
  Download, FileText, ClipboardList, Presentation, ExternalLink, ChevronRight, X,
} from 'lucide-react';
import { generateMetaAssessmentPdf } from '@/utils/metaAssessmentReportPdf';
import { generateWorkingPapersPdf } from '@/utils/workingPapersPdf';
import { buildReportMeta, validateConsistency, ORIGIN, REPORT_TITLE } from '@/data/metaAssessment/reportMeta';
import { buildPresentationContent, type PresentationType } from '@/data/metaAssessment/presentationContent';
import { validateSlideMetrics } from '@/data/metaAssessment/slideValidation';
import QualityCheckPanel from '@/components/QualityCheckPanel';
import { LucideIcon } from 'lucide-react';
import { SiteChrome } from '@/components/SiteChrome';
import { PasswordGate } from '@/components/PasswordGate';
import { PageMeta } from '@/components/PageMeta';

import { supabase } from '@/integrations/supabase/client';

import { STANDARD_PROFILES, getProfile, tr, assess, MATURITY_LEVELS, maturityKey, readinessRatingLabel, attentionLabel, buildWorkingPapers, cmmiLabel, CMMI_LEVELS } from '@/data/metaAssessment';
import type {
  Lang, StandardProfile, IntakeField, IntakeAnswers,
  AssessmentResult, AssessedRequirement, ReqStatus,
  ComputedAssessment, Recommendation, InsightResult,
} from '@/data/metaAssessment/types';
import type { WorkingPapers, WorkingPaperRecord } from '@/data/metaAssessment/workingPapers';

const ICONS: Record<string, LucideIcon> = {
  Network, Sparkles, Car, CreditCard, Factory, Server, ShieldCheck,
};

type Phase = 'standard' | 'intake' | 'analyzing' | 'report';

// ── chrome strings — English only ───────────────────────────────
// The platform is positioned as an AI-Powered Internal Audit & Compliance
// Readiness Platform. Compliance is determined by the deterministic
// Assessment Engine; AI provides an interpretation & advisory layer only.
function ui(_lang: Lang) {
  return {
    section: '/ GAPZERO — INTERNAL AUDIT & COMPLIANCE READINESS',
    headline: 'GapZero — AI-Powered Internal Audit & Compliance Readiness',
    sub: 'From zero to audit-ready: pick a standard, run the assessment, get AI insights and a report.',
    valueProp: 'A rule-based engine decides compliance. AI explains and prioritises — it never alters findings, scores or risks.',
    chooseStandard: 'Choose a standard',
    moreStandards: 'More Standards',
    soon: 'Soon',
    open: 'Start',
    demo: 'Demo',
    testCases: 'Load a test case',
    testCasesHint: 'Pre-fill the whole intake with a realistic example, then review and run.',
    testCaseSkip: 'Do not apply — fill in manually',
    testCaseSkipHint: 'Start from a blank intake and enter your own answers.',
    back: 'Back',
    next: 'Next',
    run: 'Run compliance assessment',
    analyzing: 'Running the rule-based compliance assessment …',
    required: 'Required',
    restart: 'Restart',
    readiness: 'Readiness',
    checked: 'requirements assessed',
    passed: 'passed',
    partial: 'partial',
    gaps: 'gaps',
    risks: 'Risks',
    critical: 'Critical',
    findings: 'Findings per requirement',
    evidence: 'Evidence',
    gap: 'Gap',
    measure: 'Recommended measure',
    rationale: 'Rationale',
    auditorNote: 'Auditor evidence note',
    auditorNotePlaceholder: 'Add evidence references, audit observations or context for this obligation … (included in the report & PDF)',
    riskLandscape: 'Risk landscape',
    exportJson: 'Export result (JSON)',
    exportPdf: 'Report as PDF',
    pdfError: 'PDF generation failed.',
    consistencyError: 'Report consistency validation failed. Regenerate assessment results.',
    error: 'Assessment failed. Please retry.',
    summary: 'Summary',
    // ── architecture (engine separation) ──
    archTitle: 'How this platform works',
    archEngines: [
      'Assessment Engine — source of truth',
      'Risk Engine — risks from gaps',
      'AI Insight Engine — interpretation',
      'Reporting Engine — communication',
    ],
    archNote: 'AI is not responsible for compliance decisions. It explains results but never alters them.',
    // ── deterministic layer ──
    computing: 'Computing rule-based assessment …',
    deterministicNote: 'Rule-based compliance assessment (audit-safe, no AI).',
    recommendations: 'Recommendation plan',
    roadmap: 'Roadmap',
    remediationTimeline: 'Remediation Timeline',
    remediationTimelineHint: 'Sequenced delivery plan of the recommended workstreams across a 12-month horizon, phased by priority.',
    // ── AI insight & advisory layer ──
    aiAnalysis: 'AI Insights & Advisory',
    aiNote: 'AI interpretation layer — it explains the rule-based compliance results and never determines, modifies or overrides compliance status, scores or risks.',
    loadInsights: 'Load AI Insights',
    loadingInsights: 'AI is analysing the results …',
    insightsModalNote: 'This can take up to a minute. Please keep this window open — the analysis cannot be interrupted.',
    chapterLabel: 'Chapter',
    walkthroughIntro: 'Your report is ready. Review each chapter, one at a time.',
    viewFullReport: 'View full report',
    execNarrative: 'Executive narrative',
    rootCauses: 'Root causes',
    gapClusters: 'Core themes (gap clusters)',
    crossControl: 'Cross-control insights',
    roadmapRationale: 'Roadmap rationale',
    auditorQuestions: 'Deepening audit questions',
    insightsError: 'AI analysis failed. Please retry.',
    // ── progressive disclosure controls ──
    viewLabel: 'View',
    viewExecutive: 'Executive',
    viewManagement: 'Management',
    viewAudit: 'Internal Audit',
    viewFull: 'Full detail',
    viewExecutiveHint: 'Board-level: narrative and key insights only.',
    viewManagementHint: 'Management themes, programs and roadmap.',
    viewAuditHint: 'Root causes, systemic patterns, hypotheses, audit questions.',
    viewFullHint: 'Everything expanded.',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    // ── advisory layer (virtual internal auditor / advisor) ──
    consultantView: 'Consultant & Internal Audit View',
    consultantHint: 'In-depth advisory analysis: root causes, themes, programs.',
    execInsights: 'Executive Insights',
    topWeaknesses: 'Top weaknesses',
    topStrengths: 'Top strengths',
    highestBusinessRisks: 'Highest business risks',
    multiRegulatory: 'Multi-requirement issues',
    managementFocus: 'Management focus first',
    managementThemes: 'Management themes',
    currentState: 'Current state',
    riskExposure: 'Risk exposure',
    improvementOpp: 'Improvement opportunity',
    transformationPrograms: 'Transformation programs',
    objectives: 'Objectives',
    expectedBenefits: 'Expected benefits',
    complexity: 'Complexity',
    businessValue: 'Business value',
    managementRoadmap: 'Management roadmap',
    maturityInsights: 'Maturity insights',
    businessImpact: 'Business impact analysis',
    // ── fact / interpretation separation ──
    systemicWeaknesses: 'Potential systemic weaknesses',
    systemicHint: 'Recurring patterns identified across multiple findings.',
    confidenceSummary: 'Management confidence summary',
    confidenceHint: 'How much weight management can place on each layer — facts vs interpretation.',
    insightLimitations: 'AI insight limitations',
    confidence: 'Confidence',
    pattern: 'Pattern',
    assessmentFindings: 'Assessment findings',
    riskRatings: 'Risk ratings',
    deterministic: 'Deterministic',
    aiInterpretation: 'AI interpretation',
    validationActivities: 'Recommended validation activities',
    hypotheses: 'Hypotheses (require validation)',
    hypothesesHint: 'Explicit AI assumptions not directly evidenced — confirm before acting.',
    auditReadiness: 'Audit readiness',
    auditReadinessHint: 'Deterministic readiness ratings across documentation, operational, governance and evidence dimensions.',
    attentionIndex: 'Management attention index',
    attentionIndexHint: 'Overall level of management attention required, derived from risks and mandatory gaps.',
    cmmiMatching: 'CMMI maturity matching',
    cmmiControls: 'Per-control maturity',
    cmmiHint: 'Per-category mapping to the official CMMI maturity scale (1 Initial → 5 Optimizing), with the gap to the target level.',
    cmmiTarget: 'Target',
    cmmiLevel: 'Level',
    attentionDrivers: 'Key drivers',
    evidenceStrength: 'Evidence strength overview',
    evidenceStrengthHint: 'Informational overview of the strength of evidence supporting the assessment. Does not affect scoring.',
    evVeryHigh: 'Very high',
    evHigh: 'High',
    evMedium: 'Medium',
    evLow: 'Low',
    evMissing: 'No evidence',
    consultantObservations: 'Consultant observations',
    consultantObservationsHint: 'Senior-consultant / virtual-CISO commentary on the overall posture.',
    observation: 'Observation',
    implication: 'Implication',
    recommendation: 'Recommendation',
    // ── Working Papers & Assessment Traceability ──
    workingPapers: 'Working Papers & Assessment Traceability',
    workingPapersHint: 'Full audit trail: every Pass / Partial / Gap is traceable to the original inputs, the deterministic rule, the generated risk and the AI sections that referenced it.',
    internalAuditMode: 'Internal Audit Mode',
    includeWorkingPapers: 'Include Working Papers',
    includeWorkingPapersHint: 'When on, the report includes the complete traceability appendix (Internal Audit Report). When off, the executive-focused Management Report is generated.',
    auditModeGateTitle: 'Before generating the report',
    auditModeGateHint: 'Choose the report scope. You can still change this later before exporting.',
    auditModeOn: 'On — Internal Audit Report',
    auditModeOff: 'Off — Management Report',
    continueToReport: 'Continue to report',
    filterAll: 'All',
    filterStatus: 'Status',
    filterEvidence: 'Evidence strength',
    filterSearch: 'Requirement / Article',
    searchPlaceholder: 'Filter by ID, name or article…',
    wpQuestion: 'Assessment Question',
    wpUserInputs: 'Original User Inputs',
    wpAnswer: 'Answer',
    wpComments: 'Supporting Comments',
    wpEvidenceSubmitted: 'Evidence Submitted',
    wpEvidenceStrength: 'Evidence Strength',
    wpRuleId: 'Rule ID',
    wpRuleLogic: 'Assessment Rule',
    wpResult: 'Deterministic Result',
    wpRisk: 'Generated Risk',
    wpRiskFormula: 'Risk Formula',
    wpReferencedAi: 'Referenced by AI',
    wpAiSections: 'AI Sections',
    wpMetadata: 'Audit Trail Metadata',
    wpAssessmentId: 'Assessment ID',
    wpAssessor: 'Assessor',
    wpSource: 'Source System',
    wpTimestamp: 'Timestamp',
    wpNone: 'None',
    yes: 'Yes',
    no: 'No',
    evidenceRegister: 'Evidence Register',
    evidenceRegisterHint: 'Appendix mapping every evidence item to its requirement, type, strength and assessment contribution.',
    erId: 'Evidence ID',
    erRequirement: 'Requirement',
    erType: 'Type',
    erUsedFor: 'Used For',
    erContribution: 'Result Contribution',
    exportWorkingPapers: 'Export Working Papers',
    exportWorkingPapersJson: 'Working Papers (JSON)',
    noWorkingPapers: 'No working papers match the current filters.',
    // ── Executive presentation (Gamma) ──
    genPresentation: 'Generate Presentation',
    presentationTitle: 'Visual Executive Presentation',
    presentationHint: 'Transform this assessment into a visually compelling, board-ready deck via Gamma — visual first, text second. Slides are generated from the assessment, risk and AI insight engines (not raw report text) with charts, heatmaps, scorecards and timelines, and adapt automatically to the framework.',
    slideValidationTitle: 'Slide Metric Validation',
    slideValidationHint: 'Every slide is automatically checked for correct figures, units and rounding against the source metrics before the deck is generated.',
    slideValidationBlock: 'Critical metric mismatches were found. Fix the underlying assessment data before generating the deck.',
    deckExecutive: 'Visual Executive Deck',
    deckExecutiveHint: 'Default · max 10 slides · board & management · visual-first scorecards, heatmaps, timelines.',
    deckConsultant: 'Consultant Deck',
    deckConsultantHint: 'Max 15 slides · consultants & CISOs · adds root causes, hypotheses, validation & observations.',
    deckAudit: 'Internal Audit Deck',
    deckAuditHint: 'Max 20 slides · audit, compliance & risk · findings, evidence strength & traceability.',
    deckText: 'Text Mode (classic)',
    deckTextHint: 'Secondary · narrative-friendly text deck · max 10 slides.',
    presentationType: 'Presentation type',
    generating: 'Generating presentation …',
    generatingHint: 'This can take 1–3 minutes. Please keep this screen open.',
    analyzingDeck: 'Results are being analyzed by AI …',
    analyzingDeckHint: 'Please keep this screen open.',
    presentationReady: 'Presentation Ready',
    openInGamma: 'Open in Gamma',
    downloadDeckPdf: 'Download PDF',
    presentationFailed: 'Presentation generation failed.',
    retry: 'Retry',
    // ── guided waiting (shown while AI works) ──
    guideWhileYouWait: 'While you wait — what your report contains',
    guideSteps: [
      { title: 'Management attention index', body: 'Act now, or under control.' },
      { title: 'Audit readiness', body: 'Readiness per dimension + weakest link.' },
      { title: 'Findings & compliance', body: 'Pass · Partial · Gap — rule-scored.' },
      { title: 'Risks', body: 'Gaps rated — critical ones first.' },
      { title: 'Evidence base', body: 'What is proven vs. still open.' },
      { title: 'Working papers & traceability', body: 'Each conclusion tied to its proof.' },
      { title: 'AI insights & advisory', body: 'Explains results — never alters a finding.' },
    ] as { title: string; body: string }[],

  };
}


// ── Layer / confidence labelling (fact vs interpretation) ───────
type LayerKind = 'fact' | 'insight' | 'hypothesis' | 'recommendation';
const LAYER_META: Record<LayerKind, { label: string; cls: string; title: string }> = {
  fact: { label: 'FACT', cls: 'bg-green-500/10 text-green-400 border-green-500/30', title: 'Generated by deterministic assessment logic.' },
  insight: { label: 'INSIGHT', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', title: 'Generated by AI interpretation.' },
  hypothesis: { label: 'HYPOTHESIS', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30', title: 'AI assumption not directly evidenced — requires validation.' },
  recommendation: { label: 'RECOMMENDATION', cls: 'bg-primary/10 text-primary border-primary/30', title: 'Generated by AI advisory logic.' },
};

function LayerBadge({ kind }: { kind: LayerKind }) {
  const m = LAYER_META[kind];
  return (
    <span title={m.title} className={`inline-block font-mono text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded border ${m.cls}`}>
      {m.label}
    </span>
  );
}

const CONF_CLS: Record<string, string> = {
  high: 'bg-green-500/10 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  low: 'bg-destructive/10 text-destructive border-destructive/30',
};
const CONF_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  const key = level.toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded border ${CONF_CLS[key] ?? CONF_CLS.medium}`}>
      <span className="opacity-70">Confidence:</span> {CONF_LABEL[key] ?? 'Medium'}
    </span>
  );
}

const STATUS_STYLE: Record<ReqStatus, { cls: string; label: Record<Lang, string> }> = {
  pass: { cls: 'bg-green-500/10 text-green-400 border-green-500/20', label: { de: 'Erfüllt', en: 'Pass', fr: 'Conforme' } },
  partial: { cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' } },
  fail: { cls: 'bg-destructive/10 text-destructive border-destructive/20', label: { de: 'Lücke', en: 'Gap', fr: 'Lacune' } },
};
// ── Guided AI waiting modal (used for every AI wait) ────────────
function AiWaitModal({
  title, label, note, progress, u,
}: {
  title: string; label: string; note: string; progress: number; u: ReturnType<typeof ui>;
}) {
  const steps = u.guideSteps;
  const [idx, setIdx] = useState(0);

  // Dwell time scaled to reading length so every step is comfortably readable.
  const dwell = (i: number) => {
    const len = (steps[i].title.length + steps[i].body.length);
    return Math.min(9000, Math.max(5000, Math.round(len * 45))); // ~5–9s per step
  };

  // Advance through the series in order; loop back once the last step is shown.
  useEffect(() => {
    const t = setTimeout(() => setIdx((i) => (i + 1) % steps.length), dwell(idx));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, steps.length]);

  const step = steps[idx];
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
      tabIndex={-1}
    >
      <div className="w-full max-w-md bg-background border border-primary/30 rounded-xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-primary" />
          <h3 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight">{title}</h3>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono text-xs">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Guided tour through the report while the AI works */}
        <div className="rounded-lg border border-primary/15 bg-background/40 p-4 min-h-[132px]">
          <div className="flex items-center justify-end mb-2">
            <span className="font-mono text-[10px] text-muted-foreground">{idx + 1} / {steps.length}</span>
          </div>
          {/* per-step timing bar — fills over the dwell time so the user can pace reading */}
          <div className="h-0.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
            <div
              key={idx}
              className="h-full bg-primary/70 rounded-full"
              style={{ animation: `gz-step-fill ${dwell(idx)}ms linear forwards` }}
            />
          </div>
          <div key={`t-${idx}`} className="text-sm font-semibold text-foreground animate-fade-in">{step.title}</div>
          <p key={`b-${idx}`} className="text-[12px] text-muted-foreground mt-1 leading-relaxed animate-fade-in">{step.body}</p>
          <div className="flex items-center gap-1.5 mt-3">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-primary' : 'w-1.5 bg-secondary'}`} />
            ))}
          </div>
        </div>


        <p className="text-[11px] text-muted-foreground leading-relaxed">{note}</p>
      </div>
    </div>
  );
}


// ── Architecture explanation (engine separation) ────────────────
function ArchitectureNote({ u }: { u: ReturnType<typeof ui> }) {
  return (
    <div className="mb-8 bg-background/40 border border-primary/15 rounded-lg p-5">
      <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-3">{u.archTitle}</h2>
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-0">
        {u.archEngines.map((label, i) => (
          <div key={label} className="flex items-center gap-2 sm:flex-1">
            <div className="flex-1 bg-secondary/40 border border-border rounded-md px-3 py-2 text-xs text-foreground leading-snug">
              {label}
            </div>
            {i < u.archEngines.length - 1 && (
              <span className="text-primary font-mono hidden sm:inline">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{u.archNote}</p>
    </div>
  );
}

// ── Standard categories ─────────────────────────────────────────
// Thematic grouping for the standard selector. A standard may appear in
// more than one category (e.g. IEC 62443, SOC 2, Vendor Security).
const STANDARD_CATEGORIES: { label: Record<Lang, string>; ids: string[] }[] = [
  {
    label: {
      en: 'Cybersecurity & Information Security',
      de: 'Cybersecurity & Informationssicherheit',
      fr: 'Cybersécurité & sécurité de l\'information',
    },
    ids: ['nis2', 'iso27001', 'ciscontrols', 'iec62443', 'soc2', 'pcidss'],
  },
  {
    label: {
      en: 'Operational Resilience & Business Continuity',
      de: 'Operative Resilienz & Business Continuity',
      fr: 'Résilience opérationnelle & continuité d\'activité',
    },
    ids: ['dora', 'iso22301', 'vendorsec'],
  },
  {
    label: {
      en: 'AI Governance & Compliance',
      de: 'KI-Governance & Compliance',
      fr: 'Gouvernance & conformité IA',
    },
    ids: ['aiact', 'iso42001'],
  },
  {
    label: {
      en: 'Maritime Cyber Security',
      de: 'Maritime Cyber-Sicherheit',
      fr: 'Cybersécurité maritime',
    },
    ids: ['maritimecyber', 'iacse26', 'iacse27'],
  },
  {
    label: {
      en: 'Supply Chain & Third-Party Assurance',
      de: 'Lieferkette & Drittparteien-Assurance',
      fr: 'Chaîne d\'approvisionnement & assurance tierce',
    },
    ids: ['vendorsec', 'tisax'],
  },
  {
    label: {
      en: 'Product Security & Secure Development',
      de: 'Produktsicherheit & sichere Entwicklung',
      fr: 'Sécurité produit & développement sécurisé',
    },
    ids: ['cra', 'iec62443', 'soc2'],
  },
];

// ── Standard selector ───────────────────────────────────────────
function StandardSelect({ lang, onPick }: { lang: Lang; onPick: (p: StandardProfile) => void }) {
  const u = ui(lang);

  const card = (p: StandardProfile) => {
    const Icon = ICONS[p.icon] ?? ShieldCheck;
    return (
      <button
        key={p.id}
        disabled={!p.available}
        onClick={() => p.available && onPick(p)}
        className={`group text-left bg-background/40 border rounded-lg p-5 transition-colors ${
          p.available ? 'border-primary/15 hover:border-primary/40' : 'border-border/40 opacity-55 cursor-not-allowed'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <Icon size={20} className="mt-0.5 flex-shrink-0 text-primary opacity-75" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono text-[15px] text-foreground leading-tight">{p.name}</h3>
              {!p.available && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">{u.soon}</span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">{tr(p.description, lang)}</p>
            {p.available && (
              <span className="inline-flex items-center gap-1 mt-3 font-mono text-xs text-primary group-hover:gap-2 transition-all">
                {u.open}<ArrowRight size={13} />
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const categorizedIds = new Set(STANDARD_CATEGORIES.flatMap((c) => c.ids));
  const uncategorized = STANDARD_PROFILES.filter((p) => !categorizedIds.has(p.id));

  return (
    <div className="space-y-10">
      {STANDARD_CATEGORIES.map((cat) => {
        const profiles = cat.ids
          .map((id) => STANDARD_PROFILES.find((p) => p.id === id))
          .filter((p): p is StandardProfile => Boolean(p));
        if (!profiles.length) return null;
        return (
          <section key={cat.label.en}>
            <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-4">{cat.label[lang]}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map(card)}
            </div>
          </section>
        );
      })}
      {uncategorized.length > 0 && (
        <section>
          <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-4">{u.moreStandards}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorized.map(card)}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Field renderer ──────────────────────────────────────────────
function FieldView({ field, value, onChange, lang, answers, setVal }: {
  field: IntakeField; value: string | string[] | undefined;
  onChange: (v: string | string[]) => void; lang: Lang;
  answers: IntakeAnswers; setVal: (id: string, v: string | string[]) => void;
}) {
  const label = tr(field.label, lang);
  const ph = tr(field.placeholder, lang);

  if (field.type === 'text') {
    return (
      <div>
        <FieldLabel field={field} lang={lang} />
        <input
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          placeholder={ph} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div>
        <FieldLabel field={field} lang={lang} />
        <textarea rows={4}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
          placeholder={ph} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  // maturity-multi: select measures + qualify each with a maturity level
  if (field.type === 'maturity-multi') {
    const sel = Array.isArray(value) ? value : value ? [value] : [];
    const toggleMeasure = (id: string) => {
      if (sel.includes(id)) {
        onChange(sel.filter((x) => x !== id));
        setVal(maturityKey(field.id, id), '');
      } else {
        onChange([...sel, id]);
      }
    };
    return (
      <div>
        <FieldLabel field={field} lang={lang} />
        <div className="space-y-2">
          {field.options?.map((o) => {
            const on = sel.includes(o.id);
            const mat = (answers[maturityKey(field.id, o.id)] as string) || '';
            return (
              <div key={o.id}
                className={`border rounded-lg transition-all ${on ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                <button onClick={() => toggleMeasure(o.id)}
                  className="w-full px-3 py-2 text-sm flex items-center gap-2 text-left">
                  <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'
                  }`}>✓</span>
                  <span className={`font-medium break-words flex-1 ${on ? 'text-foreground' : 'text-muted-foreground'}`}>{tr(o.label, lang)}</span>
                </button>
                {on && (
                  <div className="px-3 pb-2.5 -mt-0.5 flex flex-wrap gap-1.5">
                    {MATURITY_LEVELS.map((m) => {
                      const active = mat === m.id;
                      return (
                        <button key={m.id}
                          onClick={() => setVal(maturityKey(field.id, o.id), active ? '' : m.id)}
                          className={`text-xs px-2 py-1 rounded-md border transition-all ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground font-semibold'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                          }`}>
                          {tr(m.label, lang)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // single / multi
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  const toggle = (id: string) => {
    if (field.type === 'single') { onChange(id); return; }
    onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };
  return (
    <div>
      <FieldLabel field={field} lang={lang} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {field.options?.map((o) => {
          const sel = field.type === 'single' ? value === o.id : arr.includes(o.id);
          return (
            <button key={o.id} onClick={() => toggle(o.id)}
              className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 text-left transition-all ${
                sel ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              }`}>
              {o.icon && <span className="mt-0.5 flex-shrink-0">{o.icon}</span>}
              <div className="min-w-0 flex-1">
                <div className="font-medium break-words">{tr(o.label, lang)}</div>
                {o.desc && <div className="text-xs opacity-70 mt-0.5 break-words">{tr(o.desc, lang)}</div>}
              </div>
              {sel && <span className="ml-auto text-xs text-primary">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldLabel({ field, lang }: { field: IntakeField; lang: Lang }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {tr(field.label, lang)}{field.required && <span className="text-primary"> *</span>}
      {field.help && <span className="block normal-case font-normal text-[11px] mt-0.5 opacity-70">{tr(field.help, lang)}</span>}
    </label>
  );
}

// ── Intake wizard ───────────────────────────────────────────────
function IntakeWizard({ profile, lang, initial, onFinish, onBack }: {
  profile: StandardProfile; lang: Lang; initial?: IntakeAnswers;
  onFinish: (a: IntakeAnswers) => void; onBack: () => void;
}) {
  const u = ui(lang);
  const [answers, setAnswers] = useState<IntakeAnswers>(initial ?? {});

  // Flatten all steps into one-question-per-screen to prevent information overflow.
  const questions = useMemo(
    () =>
      profile.intake.flatMap((s, si) =>
        s.fields.map((f, fi) => ({ step: s, field: f, si, firstInStep: fi === 0 })),
      ),
    [profile.intake],
  );

  const [q, setQ] = useState(0);
  // Test-case picker shown as a pop-up at the start of the intake.
  const hasScenarios = !!profile.demoScenarios && profile.demoScenarios.length > 0;
  const [testCaseOpen, setTestCaseOpen] = useState(hasScenarios);
  const current = questions[q];
  const { step, field, firstInStep } = current;
  const isLast = q === questions.length - 1;

  const setVal = useCallback((id: string, v: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }, []);

  // Demo: fill only the current question's field with test data.
  const fillDemo = useCallback(() => {
    const demo = profile.demoAnswers;
    if (!demo) return;
    setAnswers((prev) => {
      const next = { ...prev };
      if (field.id in demo) next[field.id] = demo[field.id];
      return next;
    });
  }, [profile.demoAnswers, field]);

  // Test cases: pick a full scenario on the first question (fills every field).
  const pickScenario = useCallback((id: string) => {
    const sc = profile.demoScenarios?.find((s) => s.id === id);
    if (!sc) return;
    setAnswers({ ...sc.answers });
    setTestCaseOpen(false);
  }, [profile.demoScenarios]);

  const canNext = useMemo(() => {
    if (!field.required) return true;
    const v = answers[field.id];
    return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  }, [field, answers]);

  return (
    <div className="flex flex-col min-h-[440px]">
      <div className="flex items-center gap-2 mb-5">
        {questions.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i < q ? 'bg-primary' : i === q ? 'bg-primary/60' : 'bg-secondary'}`} />
        ))}
        <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{q + 1}/{questions.length}</span>
      </div>

      {q === 0 && hasScenarios && (
        <button
          onClick={() => setTestCaseOpen(true)}
          className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-primary hover:text-primary/80 border border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08] rounded-lg px-3 py-2 mb-5 transition-colors"
        >
          <Sparkles size={13} /> {u.testCases}
        </button>
      )}

      {testCaseOpen && hasScenarios && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-background border border-primary/30 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-primary mb-1">
                  <Sparkles size={13} /> {u.testCases}
                </div>
                <div className="text-xs text-muted-foreground">{u.testCasesHint}</div>
              </div>
              <button onClick={() => setTestCaseOpen(false)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-2">
              {profile.demoScenarios!.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => pickScenario(sc.id)}
                  className="text-left rounded-lg border border-border bg-background/40 hover:border-primary/50 hover:bg-primary/[0.06] transition-colors px-3 py-2.5"
                >
                  <div className="text-sm font-semibold text-foreground">{tr(sc.label, lang)}</div>
                  {sc.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{tr(sc.description, lang)}</div>
                  )}
                </button>
              ))}
              <button
                onClick={() => setTestCaseOpen(false)}
                className="text-left rounded-lg border border-dashed border-border bg-transparent hover:border-foreground/40 hover:bg-secondary/30 transition-colors px-3 py-2.5"
              >
                <div className="text-sm font-semibold text-foreground">{u.testCaseSkip}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{u.testCaseSkipHint}</div>
              </button>
            </div>

          </div>
        </div>
      )}


      {firstInStep && (
        <>
          <div className="text-base font-bold text-foreground font-mono">{tr(step.title, lang)}</div>
          {step.subtitle && <div className="text-sm text-muted-foreground mt-0.5 mb-3">{tr(step.subtitle, lang)}</div>}
          {step.info && (
            <div className="border border-primary/20 bg-primary/10 rounded-lg px-4 py-3 text-sm text-foreground mb-4">💡 {tr(step.info, lang)}</div>
          )}
        </>
      )}

      <div className="space-y-5">
        <FieldView key={field.id} field={field} value={answers[field.id]} onChange={(v) => setVal(field.id, v)} lang={lang} answers={answers} setVal={setVal} />
      </div>

      <div className="flex justify-between items-center pt-6 mt-auto border-t border-border/40">
        <div className="flex items-center gap-2">
          <button onClick={() => (q === 0 ? onBack() : setQ(q - 1))}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
            <ArrowLeft size={14} /> {u.back}
          </button>
          {profile.demoAnswers && (
            <button onClick={fillDemo}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary/10">
              <Sparkles size={13} /> {u.demo}
            </button>
          )}
        </div>
        <button disabled={!canNext} onClick={() => (isLast ? onFinish(answers) : setQ(q + 1))}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40">
          {isLast ? u.run : u.next} {isLast ? <Sparkles size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── AI advisory insights panel ──────────────────────────────────
function InsightChips({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed flex gap-2">
            <span className="text-primary flex-shrink-0">•</span><span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValidationActivities({ items, label }: { items?: string[]; label: string }) {
  if (!items?.length) return null;
  return (
    <div className="mt-1.5 pl-3 border-l-2 border-purple-500/30">
      <div className="text-[10px] font-mono uppercase tracking-wide text-purple-400 mb-0.5">{label}</div>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-purple-400">›</span><span>{it}</span></li>
        ))}
      </ul>
    </div>
  );
}

// ── Accordion (progressive disclosure) context ──────────────────
interface AccordionCtxType {
  isOpen: (key: string) => boolean;
  toggle: (key: string) => void;
}
const AccordionContext = createContext<AccordionCtxType | null>(null);

function InsightSection({ title, children, layer = 'insight', confidence }: {
  title: string; children: React.ReactNode; layer?: LayerKind; confidence?: string;
}) {
  const ctx = useContext(AccordionContext);
  const open = ctx ? ctx.isOpen(title) : true;
  return (
    <div className="border-t border-border/60 pt-4">
      <button
        type="button"
        onClick={() => ctx?.toggle(title)}
        className="w-full flex items-center gap-2 flex-wrap text-left group"
        aria-expanded={open}
      >
        <ChevronRight
          size={14}
          className={`text-primary flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary group-hover:text-primary/80 transition-colors">{title}</h3>
        <LayerBadge kind={layer} />
        {confidence && <ConfidenceBadge level={confidence} />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}


const RATING_CLS: Record<string, string> = {
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

type InsightView = 'executive' | 'management' | 'audit' | 'full';

function InsightsPanel({ insights, computed, lang, u, reqMeta }: {
  insights: InsightResult; computed: ComputedAssessment; lang: Lang;
  u: ReturnType<typeof ui>; reqMeta: Map<string, StandardProfile['requirements'][number]>;
}) {
  const ei = insights.executiveInsights;
  const ratingLabel = (r: string) => {
    if (r === 'low') return 'Low';
    if (r === 'high') return 'High';
    return 'Medium';
  };

  // ── Progressive disclosure: section keys + view presets ──
  const allKeys = useMemo(() => [
    u.execNarrative, u.execInsights, u.rootCauses, u.gapClusters, u.managementThemes,
    u.transformationPrograms, u.businessImpact, u.maturityInsights, u.managementRoadmap,
    u.crossControl, u.systemicWeaknesses, u.hypotheses, u.consultantObservations,
    u.roadmapRationale, u.auditorQuestions, u.confidenceSummary, u.insightLimitations,
  ], [u]);

  const presets = useMemo<Record<InsightView, string[]>>(() => ({
    executive: [u.execNarrative, u.execInsights],
    management: [u.execNarrative, u.execInsights, u.managementThemes, u.transformationPrograms, u.businessImpact, u.managementRoadmap, u.maturityInsights],
    audit: [u.rootCauses, u.gapClusters, u.crossControl, u.systemicWeaknesses, u.hypotheses, u.auditorQuestions, u.consultantObservations, u.confidenceSummary, u.roadmapRationale, u.insightLimitations],
    full: allKeys,
  }), [u, allKeys]);

  const [view, setView] = useState<InsightView>('executive');
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());

  const applyView = (v: InsightView) => { setView(v); setOpenSet(new Set(presets[v])); };
  const toggle = useCallback((key: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);
  const ctx = useMemo<AccordionCtxType>(() => ({
    isOpen: (key: string) => openSet.has(key),
    toggle,
  }), [openSet, toggle]);

  const views: [InsightView, string, string][] = [
    ['executive', u.viewExecutive, u.viewExecutiveHint],
    ['management', u.viewManagement, u.viewManagementHint],
    ['audit', u.viewAudit, u.viewAuditHint],
    ['full', u.viewFull, u.viewFullHint],
  ];

  return (
    <AccordionContext.Provider value={ctx}>
    <div className="mt-5 space-y-5">
      {/* View modes + expand / collapse controls */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={u.viewLabel}>
          {views.map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              title={hint}
              onClick={() => applyView(id)}
              className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-md border transition-colors ${
                view === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background/40 text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => { setView('full'); setOpenSet(new Set(allKeys)); }}
            className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            {u.expandAll}
          </button>
          <button type="button" onClick={() => setOpenSet(new Set())}
            className="font-mono text-[11px] uppercase tracking-wider px-2.5 py-1.5 rounded-md border border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            {u.collapseAll}
          </button>
        </div>
      </div>

      {insights.executiveNarrative && (
        <InsightSection title={u.execNarrative}>
          <p className="text-sm text-foreground leading-relaxed">{insights.executiveNarrative}</p>
        </InsightSection>
      )}


      {ei && (ei.topWeaknesses.length || ei.topStrengths.length || ei.managementFocus.length) ? (
        <InsightSection title={u.execInsights} layer="insight" confidence={insights.confidence?.executiveInsights}>
          <div className="grid sm:grid-cols-2 gap-4">
            <InsightChips title={u.topWeaknesses} items={ei.topWeaknesses} />
            <InsightChips title={u.topStrengths} items={ei.topStrengths} />
            <InsightChips title={u.highestBusinessRisks} items={ei.highestBusinessRisks} />
            <InsightChips title={u.multiRegulatory} items={ei.multiRegulatoryIssues} />
            <InsightChips title={u.managementFocus} items={ei.managementFocus} />
          </div>
        </InsightSection>
      ) : null}

      {insights.rootCauses?.length > 0 && (
        <InsightSection title={u.rootCauses} layer="insight" confidence={insights.confidence?.rootCauses}>
          <div className="space-y-3">
            {insights.rootCauses.map((rc, i) => (
              <div key={i} className="text-sm leading-relaxed">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="flex-1 min-w-[60%]">
                    <span className="text-muted-foreground">{rc.symptom}</span>
                    <span className="text-primary mx-1.5">→</span>
                    <span className="text-foreground">{rc.cause}</span>
                  </span>
                  <ConfidenceBadge level={rc.confidence} />
                </div>
                <ValidationActivities items={rc.validationActivities} label={u.validationActivities} />
              </div>
            ))}
          </div>

        </InsightSection>
      )}

      {insights.gapClusters?.length > 0 && (
        <InsightSection title={u.gapClusters}>
          <div className="space-y-3">
            {insights.gapClusters.map((gc, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="text-sm font-semibold text-foreground">{gc.title}</div>
                {gc.summary && <p className="text-sm text-muted-foreground mt-0.5">{gc.summary}</p>}
                {gc.businessImpact && <p className="text-xs text-foreground mt-1.5"><span className="font-semibold">{u.businessImpact}: </span>{gc.businessImpact}</p>}
                {gc.regulatoryImpact && <p className="text-xs text-foreground mt-0.5"><span className="font-semibold">{u.multiRegulatory}: </span>{gc.regulatoryImpact}</p>}
                {gc.controlIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {gc.controlIds.map((id) => (
                      <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{id}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.managementThemes?.length > 0 && (
        <InsightSection title={u.managementThemes} layer="insight" confidence={insights.confidence?.managementThemes}>
          <div className="space-y-3">
            {insights.managementThemes.map((m, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-semibold text-foreground">{m.title}</div>
                  <ConfidenceBadge level={m.confidence} />
                </div>
                <div className="grid sm:grid-cols-3 gap-2 mt-2 text-xs">
                  {m.currentState && <div><span className="font-semibold text-muted-foreground uppercase tracking-wide">{u.currentState}</span><p className="text-foreground mt-0.5">{m.currentState}</p></div>}
                  {m.riskExposure && <div><span className="font-semibold text-muted-foreground uppercase tracking-wide">{u.riskExposure}</span><p className="text-foreground mt-0.5">{m.riskExposure}</p></div>}
                  {m.improvementOpportunity && <div><span className="font-semibold text-muted-foreground uppercase tracking-wide">{u.improvementOpp}</span><p className="text-foreground mt-0.5">{m.improvementOpportunity}</p></div>}
                </div>
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.transformationPrograms?.length > 0 && (
        <InsightSection title={u.transformationPrograms} layer="recommendation" confidence={insights.confidence?.transformationPrograms}>
          <div className="space-y-3">
            {insights.transformationPrograms.map((p, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-semibold text-foreground">{p.title}</div>
                    <ConfidenceBadge level={p.confidence} />
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${RATING_CLS[p.complexity]}`}>{u.complexity}: {ratingLabel(p.complexity)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${RATING_CLS[p.businessValue]}`}>{u.businessValue}: {ratingLabel(p.businessValue)}</span>
                  </div>
                </div>
                {p.objectives && <p className="text-xs text-foreground mt-1.5"><span className="font-semibold">{u.objectives}: </span>{p.objectives}</p>}
                {p.expectedBenefits && <p className="text-xs text-foreground mt-0.5"><span className="font-semibold">{u.expectedBenefits}: </span>{p.expectedBenefits}</p>}
                {p.relatedControlIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.relatedControlIds.map((id) => (
                      <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{id}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.businessImpact?.length > 0 && (
        <InsightSection title={u.businessImpact}>
          <div className="space-y-1.5">
            {insights.businessImpact.map((b, i) => (
              <div key={i} className="text-sm leading-relaxed">
                <span className="font-semibold text-foreground">{b.area}: </span>
                <span className="text-muted-foreground">{b.consequence}</span>
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {computed.maturity?.enabled && insights.maturityNarrative && (
        <InsightSection title={u.maturityInsights}>
          <p className="text-sm text-foreground leading-relaxed">{insights.maturityNarrative}</p>
        </InsightSection>
      )}

      {insights.managementRoadmap?.length > 0 && (
        <InsightSection title={u.managementRoadmap} layer="recommendation">
          <div className="space-y-3">
            {insights.managementRoadmap.map((r, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="font-mono text-xs text-primary font-bold">{r.phase} {u.roadmap === 'Roadmap' ? 'months' : ''}</div>
                <ul className="mt-1.5 space-y-1">
                  {r.activities.map((a, j) => (
                    <li key={j} className="text-sm text-foreground flex gap-2"><span className="text-primary flex-shrink-0">•</span><span>{a}</span></li>
                  ))}
                </ul>
                {r.rationale && <p className="text-xs text-muted-foreground mt-1.5 italic">{r.rationale}</p>}
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.crossControlInsights?.length > 0 && (
        <InsightSection title={u.crossControl} layer="insight" confidence={insights.confidence?.crossControlInsights}>
          <InsightChips title="" items={insights.crossControlInsights} />
        </InsightSection>
      )}

      {insights.systemicWeaknesses?.length > 0 && (
        <InsightSection title={u.systemicWeaknesses} layer="insight" confidence={insights.confidence?.systemicWeaknesses}>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{u.systemicHint}</p>
          <div className="space-y-3">
            {insights.systemicWeaknesses.map((s, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-sm font-semibold text-highlight">{s.area}</div>
                  <ConfidenceBadge level={s.confidence} />
                </div>
                {s.pattern && <p className="text-sm text-foreground mt-1 leading-relaxed"><span className="font-semibold text-muted-foreground">{u.pattern}: </span>{s.pattern}</p>}
                {s.relatedControlIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.relatedControlIds.map((id) => (
                      <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{id}</span>
                    ))}
                  </div>
                )}
                <ValidationActivities items={s.validationActivities} label={u.validationActivities} />
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.hypotheses?.length > 0 && (
        <InsightSection title={u.hypotheses} layer="hypothesis">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{u.hypothesesHint}</p>
          <div className="space-y-3">
            {insights.hypotheses.map((h, i) => (
              <div key={i} className="bg-purple-500/5 border border-purple-500/20 rounded-md px-3 py-2.5">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm text-foreground leading-relaxed flex-1 min-w-[60%]">{h.statement}</p>
                  <ConfidenceBadge level={h.confidence} />
                </div>
                {h.relatedControlIds?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.relatedControlIds.map((id) => (
                      <span key={id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{id}</span>
                    ))}
                  </div>
                )}
                <ValidationActivities items={h.validationActivities} label={u.validationActivities} />
              </div>
            ))}
          </div>
        </InsightSection>
      )}

      {insights.consultantObservations?.length > 0 && (
        <InsightSection title={u.consultantObservations} layer="recommendation">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{u.consultantObservationsHint}</p>
          <div className="space-y-3">
            {insights.consultantObservations.map((o, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-md px-3 py-2.5">
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-sm text-foreground leading-relaxed flex-1 min-w-[60%]">{o.observation}</p>
                  <ConfidenceBadge level={o.confidence} />
                </div>
                {o.implication && <p className="text-xs text-foreground mt-1.5"><span className="font-semibold">{u.implication}: </span>{o.implication}</p>}
                {o.recommendation && <p className="text-xs text-foreground mt-0.5"><span className="font-semibold text-primary">{u.recommendation}: </span>{o.recommendation}</p>}
              </div>
            ))}
          </div>
        </InsightSection>
      )}




      {insights.roadmapRationale && (
        <InsightSection title={u.roadmapRationale} layer="recommendation">
          <p className="text-sm text-foreground leading-relaxed">{insights.roadmapRationale}</p>
        </InsightSection>
      )}

      {insights.auditorQuestions?.length > 0 && (
        <InsightSection title={u.auditorQuestions} layer="insight">
          <InsightChips title="" items={insights.auditorQuestions} />
        </InsightSection>
      )}

      {/* Management Confidence Summary — facts vs interpretation */}
      <InsightSection title={u.confidenceSummary} layer="fact">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{u.confidenceHint}</p>
        <div className="space-y-1.5">
          {([
            [u.assessmentFindings, 'high', u.deterministic],
            [u.riskRatings, 'high', u.deterministic],
            [u.execInsights, insights.confidence?.executiveInsights ?? 'medium', u.aiInterpretation],
            [u.rootCauses, insights.confidence?.rootCauses ?? 'medium', u.aiInterpretation],
            [u.managementThemes, insights.confidence?.managementThemes ?? 'medium', u.aiInterpretation],
            [u.transformationPrograms, insights.confidence?.transformationPrograms ?? 'medium', u.aiInterpretation],
            [u.systemicWeaknesses, insights.confidence?.systemicWeaknesses ?? 'medium', u.aiInterpretation],
          ] as [string, string, string][]).map(([label, level, source]) => (
            <div key={label} className="flex items-center justify-between gap-2 bg-background/50 border border-border rounded-md px-3 py-2">
              <div className="text-sm text-foreground">{label} <span className="text-[10px] text-muted-foreground font-mono">· {source}</span></div>
              <ConfidenceBadge level={level} />
            </div>
          ))}
        </div>
      </InsightSection>

      {/* AI Insight Limitations — audit defensibility */}
      <InsightSection title={u.insightLimitations} layer="insight">
        <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed">
          {[
            'AI-generated insights are analytical interpretations of assessment results.',
            'They are intended to support internal audit, risk management and compliance improvement activities.',
            'AI insights do not constitute audit findings, legal advice, regulatory opinions or certification decisions.',
            'Root cause analyses and management observations should be validated through interviews, evidence review and management discussion.',
          ].map((l, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary flex-shrink-0">•</span><span>{l}</span></li>
          ))}
        </ul>
      </InsightSection>
    </div>
    </AccordionContext.Provider>
  );
}

// ── Working Papers & Assessment Traceability ────────────────────
function WorkingPapersSection({ wp, u }: { wp: WorkingPapers; u: ReturnType<typeof ui> }) {
  const [status, setStatus] = useState<'all' | ReqStatus>('all');
  const [strength, setStrength] = useState<string>('all');
  const [q, setQ] = useState('');

  const records = useMemo(() => wp.records.filter((r) => {
    if (status !== 'all' && r.deterministicResult !== status) return false;
    if (strength !== 'all' && r.evidenceStrength !== strength) return false;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      if (!`${r.requirementId} ${r.name} ${r.article}`.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [wp.records, status, strength, q]);

  const statusOpts: ['all' | ReqStatus, string][] = [
    ['all', u.filterAll], ['pass', u.passed], ['partial', u.partial], ['fail', u.gaps],
  ];
  const strengthOpts: [string, string][] = [
    ['all', u.filterAll], ['very_high', u.evVeryHigh], ['high', u.evHigh],
    ['medium', u.evMedium], ['low', u.evLow], ['none', u.evMissing],
  ];

  return (
    <div>
      <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">{u.workingPapers}</h2>
      <div className="text-[10px] text-muted-foreground font-mono mb-2">{ORIGIN.assessment}</div>
      <p className="text-[11px] text-muted-foreground mb-3 max-w-2xl leading-relaxed">{u.workingPapersHint}</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex gap-1">
          {statusOpts.map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)}
              className={`text-[11px] px-2 py-1 rounded border font-mono ${status === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>{l}</button>
          ))}
        </div>
        <select value={strength} onChange={(e) => setStrength(e.target.value)}
          className="text-[11px] bg-background border border-border rounded px-2 py-1 text-foreground">
          {strengthOpts.map(([v, l]) => <option key={v} value={v}>{u.filterEvidence}: {l}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={u.searchPlaceholder}
          className="text-[11px] bg-background border border-border rounded px-2 py-1 text-foreground flex-1 min-w-[160px]" />
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{u.noWorkingPapers}</p>
      ) : (
        <div className="space-y-1.5">
          {records.map((r) => {
            const st = STATUS_STYLE[r.deterministicResult];
            return (
              <details key={r.requirementId} className="bg-background/40 border border-primary/15 rounded-lg overflow-hidden">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30">
                  <span className="font-mono text-[11px] text-muted-foreground font-bold w-16 flex-shrink-0">{r.requirementId}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground break-words">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.article}{r.generatedRiskId && <span> · {u.wpRisk}: {r.generatedRiskId}</span>}{r.referencedByAI && <span> · AI ✓</span>}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${st.cls}`}>{st.label.en}</span>
                </summary>
                <div className="border-t border-border bg-secondary/20 px-4 py-3 text-sm space-y-2.5">
                  <ReportField label={u.wpQuestion}>{r.assessmentQuestion}</ReportField>
                  <div className="bg-background/50 border border-border rounded-md px-3 py-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{u.wpUserInputs}</div>
                    {r.inputs.length ? r.inputs.map((inp) => (
                      <div key={inp.fieldId} className="text-foreground"><span className="text-muted-foreground">{inp.question}: </span>{inp.answer}</div>
                    )) : <div className="text-muted-foreground">—</div>}
                  </div>
                  {r.supportingComments && <ReportField label={u.wpComments}>{r.supportingComments}</ReportField>}
                  <div><span className="font-semibold text-muted-foreground">{u.wpEvidenceSubmitted}: </span>{r.evidenceSubmitted || u.wpNone} <span className="font-mono text-[10px] text-muted-foreground">({u.wpEvidenceStrength}: {r.evidenceStrengthLabel})</span></div>
                  <div className="bg-background/50 border border-border rounded-md px-3 py-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{u.wpRuleLogic} · {r.ruleId}</div>
                    {r.ruleLogic.map((line, i) => (
                      <div key={i} className="font-mono text-xs text-foreground">{line}</div>
                    ))}
                    <div className="mt-1"><span className="font-semibold text-muted-foreground">{u.wpResult}: </span><span className="text-foreground">{r.resultLabel}</span></div>
                  </div>
                  {r.generatedRiskId && (
                    <div><span className="font-semibold text-destructive">{u.wpRisk}: </span>{r.generatedRiskId} — <span className="font-mono text-xs">{r.riskFormula} = {r.riskScore}</span> ({r.riskRatingLabel})</div>
                  )}
                  <div><span className="font-semibold text-muted-foreground">{u.wpReferencedAi}: </span>{r.referencedByAI ? u.yes : u.no}{r.aiSections.length > 0 && <span className="text-muted-foreground"> — {r.aiSections.join(', ')}</span>}</div>
                  <div className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-border">
                    {u.wpMetadata}: {r.assessmentId} · v{r.assessmentVersion} · {r.ruleId} · {r.assessor} · {new Date(r.timestamp).toLocaleString('en-GB')}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Evidence Register */}
      {wp.evidenceRegister.length > 0 && (
        <div className="mt-5">
          <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-1">{u.evidenceRegister}</h3>
          <p className="text-[11px] text-muted-foreground mb-2">{u.evidenceRegisterHint}</p>
          <div className="overflow-x-auto bg-background/40 border border-primary/15 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-mono uppercase tracking-wide">
                  <th className="text-left px-3 py-2">{u.erId}</th>
                  <th className="text-left px-3 py-2">{u.erRequirement}</th>
                  <th className="text-left px-3 py-2">{u.erType}</th>
                  <th className="text-left px-3 py-2">{u.wpEvidenceStrength}</th>
                  <th className="text-left px-3 py-2">{u.erContribution}</th>
                </tr>
              </thead>
              <tbody>
                {wp.evidenceRegister.map((e) => (
                  <tr key={e.evidenceId} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-mono text-foreground">{e.evidenceId}</td>
                    <td className="px-3 py-2 text-foreground">{e.requirementId} <span className="text-muted-foreground">{e.requirementName}</span></td>
                    <td className="px-3 py-2 text-muted-foreground">{e.typeLabel}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.strengthLabel}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.resultContributionLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report ──────────────────────────────────────────────────────
function Report({ profile, lang, result, computed, answers, onRestart }: {
  profile: StandardProfile; lang: Lang; result: AssessmentResult;
  computed: ComputedAssessment;
  answers: IntakeAnswers; onRestart: () => void;
}) {
  const u = ui(lang);
  const reqMeta = useMemo(() => new Map(profile.requirements.map((r) => [r.id, r])), [profile]);

  const merged: AssessedRequirement[] = useMemo(() => result.requirements.map((r) => {
    const meta = reqMeta.get(r.id);
    return { ...r, article: meta?.article ?? '', name: meta ? tr(meta.name, lang) : r.id };
  }), [result, reqMeta, lang]);

  // Auditor evidence notes, captured per obligation on the results screen and
  // carried into the on-screen report and the PDF export.
  const [auditorNotes, setAuditorNotes] = useState<Record<string, string>>({});
  const setNote = useCallback((id: string, v: string) => {
    setAuditorNotes((prev) => ({ ...prev, [id]: v }));
  }, []);



  // ── Single source of truth: all displayed metrics come from the
  // deterministic `computed` object (the same one used by the PDF and
  // JSON export), never from a parallel calculation. This guarantees the
  // readiness score, counts and risks never diverge between UI / PDF / JSON.
  const pass = computed.score.counts.pass;
  const partial = computed.score.counts.partial;
  const fail = computed.score.counts.fail;
  const pct = computed.score.weighted;
  const critRisks = computed.risks.filter((r) => r.rating === 'critical');

  const entityName = (answers.entityName as string) || profile.name;

  // Canonical report metadata — generated once and reused by both the JSON
  // export and the PDF so the Assessment ID / version / timestamp match.
  const docMeta = useMemo(() => buildReportMeta(profile.id), [profile.id]);

  const exportJson = () => {
    // Export the canonical computed model alongside the raw result so the
    // JSON export can never contradict the on-screen / PDF figures.
    const payload = {
      meta: { ...docMeta, standard: profile.id, entityName },
      profile: profile.id,
      entityName,
      answers,
      result,
      computed,
      insights,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.id}-assessment.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };


  // ── AI insight / advisory layer (mandatory, auto-loaded) ──
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [insightsBusy, setInsightsBusy] = useState(false);
  const [insightsProgress, setInsightsProgress] = useState(0);
  const [insightsDone, setInsightsDone] = useState(false);

  // Animate a progress bar while the AI analysis runs (creeps toward 90%).
  useEffect(() => {
    if (!insightsBusy) return;
    setInsightsProgress(8);
    const t = setInterval(() => {
      setInsightsProgress((p) => (p < 90 ? p + Math.max(1, Math.round((90 - p) * 0.08)) : p));
    }, 400);
    return () => clearInterval(t);
  }, [insightsBusy]);

  const loadInsights = useCallback(async () => {
    setInsightsBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('assessment-insights', {
        body: {
          standardName: profile.name,
          language: lang,
          score: computed.score.weighted,
          findings: result.requirements.map((r) => ({ id: r.id, status: r.status, name: r.name, gap: r.gap })),
          risks: computed.risks.map((r) => ({ name: r.name, likelihood: r.likelihood, impact: r.impact })),
          recommendations: computed.recommendations.map((r) => ({ title: r.title, priority: r.priority })),
          maturity: computed.maturity?.enabled ? { current: computed.maturity.current, target: computed.maturity.target } : undefined,
        },
      });
      if (error) throw error;
      setInsights(data as InsightResult);
      setInsightsProgress(100);
    } catch (e) {
      console.error('insights failed', e);
      alert(u.insightsError);
    } finally {
      setInsightsBusy(false);
      setInsightsDone(true);
    }
  }, [profile, lang, computed, result, u.insightsError]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [wpBusy, setWpBusy] = useState(false);
  const [includeWorkingPapers, setIncludeWorkingPapers] = useState(false);
  // Gate: ask the user to confirm the audit mode before the report is generated.
  const [auditModeAsked, setAuditModeAsked] = useState(false);

  // Working papers are derived deterministically from the same canonical
  // result/computed objects, then enriched with AI references once insights load.
  const workingPapers = useMemo(
    () => buildWorkingPapers(profile, answers, result, computed, insights, docMeta, lang),
    [profile, answers, result, computed, insights, docMeta, lang],
  );

  // ── Chapter walkthrough (shown once, after all required analysis is done) ──
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [walkthroughDone, setWalkthroughDone] = useState(false);

  const reportChapters = useMemo(() => {
    const ai = computed.attentionIndex;
    const ev = computed.evidence;
    const evTotal = merged.length || 1;
    type Chapter = { title: string; origin: string; takeaway: string; summary: string; kind: string; data: any };

    // ── Pyramid Principle: each chapter leads with its single conclusion (takeaway),
    //    then the supporting visual evidence, then the explanatory context. ──
    const attLvl = ai.level;
    const attTake = attLvl === 'critical' || attLvl === 'high'
      ? `Management action is required now — attention level is ${attentionLabel(attLvl, lang)}.`
      : `Posture is under control — attention level is ${attentionLabel(attLvl, lang)}.`;

    const weakDims = computed.auditReadiness.dimensions.filter((dm: any) => dm.pct < 60).sort((a: any, b: any) => a.pct - b.pct);
    const readyTake = weakDims.length === 0
      ? 'Audit-ready across all readiness dimensions.'
      : `Focus on ${weakDims.slice(0, 2).map((dm: any) => dm.label).join(' and ')} — the weakest readiness dimension${weakDims.length > 1 ? 's' : ''}.`;

    const findTake = `${pct}% audit-ready: ${pass} of ${merged.length} requirements pass, ${fail} gap${fail === 1 ? '' : 's'} to close.`;

    const wpTake = `Every conclusion is traceable — ${workingPapers.records.length} working-paper records evidence the assessment.`;

    const evMissingCount = ev.missing.length;
    const evTake = evMissingCount === 0
      ? 'Evidence base is complete — every requirement is supported.'
      : `${evMissingCount} requirement${evMissingCount === 1 ? '' : 's'} lack supporting evidence and need follow-up.`;

    const chs: Chapter[] = [
      {
        title: u.attentionIndex, origin: ORIGIN.assessment, kind: 'attention',
        takeaway: attTake, summary: u.attentionIndexHint,
        data: { level: ai.level, label: attentionLabel(ai.level, lang), counts: ai.counts },
      },
      {
        title: u.auditReadiness, origin: ORIGIN.assessment, kind: 'readiness',
        takeaway: readyTake, summary: u.auditReadinessHint,
        data: { dimensions: computed.auditReadiness.dimensions },
      },
      ...(computed.cmmi?.enabled ? [{
        title: u.cmmiMatching, origin: ORIGIN.assessment, kind: 'cmmi' as const,
        takeaway: `Overall CMMI level ${computed.cmmi.overall} (${computed.cmmi.overallLabel}) — target ${computed.cmmi.target}, ${computed.cmmi.gap === 0 ? 'met' : `${computed.cmmi.gap} level${computed.cmmi.gap === 1 ? '' : 's'} to close`}.`,
        summary: u.cmmiHint,
        data: { cmmi: computed.cmmi },
      }] : []),
      {
        title: u.findings, origin: ORIGIN.assessment, kind: 'findings',
        takeaway: findTake, summary: `${pass} ${u.passed} · ${partial} ${u.partial} · ${fail} ${u.gaps}`,
        data: { pass, partial, fail, total: merged.length, pct },
      },
      {
        title: u.workingPapers, origin: ORIGIN.assessment, kind: 'stat',
        takeaway: wpTake, summary: u.workingPapersHint,
        data: { value: workingPapers.records.length, label: u.workingPapers, icon: 'clipboard' },
      },
    ];
    if (computed.risks.length > 0) {
      const riskTake = critRisks.length > 0
        ? `${critRisks.length} critical risk${critRisks.length === 1 ? '' : 's'} dominate — prioritise these first.`
        : `${computed.risks.length} risks identified, none critical — manage on the standard cycle.`;
      chs.push({
        title: u.riskLandscape, origin: ORIGIN.risk, kind: 'risks',
        takeaway: riskTake, summary: `${computed.risks.length} risks · ${critRisks.length} ${u.critical}`,
        data: { risks: [...computed.risks].sort((a, b) => b.score - a.score).slice(0, 5), total: computed.risks.length, crit: critRisks.length },
      });
    }
    chs.push({
      title: u.evidenceStrength, origin: ORIGIN.assessment, kind: 'evidence',
      takeaway: evTake, summary: u.evidenceStrengthHint,
      data: {
        rows: [
          { label: u.evVeryHigh, count: ev.byStrength.very_high, cls: 'bg-green-500' },
          { label: u.evHigh, count: ev.byStrength.high, cls: 'bg-cyan-500' },
          { label: u.evMedium, count: ev.byStrength.medium, cls: 'bg-yellow-500' },
          { label: u.evLow, count: ev.byStrength.low, cls: 'bg-orange-500' },
          { label: u.evMissing, count: ev.missing.length, cls: 'bg-destructive' },
        ],
        total: evTotal,
      },
    });
    // ── Remediation timeline (Gantt) — sequence the recommended workstreams ──
    if (computed.recommendations.length > 0) {
      const PHASE_SPAN: Record<string, [number, number]> = { '0-3': [0, 3], '3-6': [3, 6], '6-12': [6, 12] };
      const prioColor: Record<string, string> = {
        critical: 'bg-destructive', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-primary',
      };
      const lanes: { title: string; start: number; end: number; cls: string; priority: string }[] = [];
      computed.roadmap.forEach((bucket) => {
        const [start, end] = PHASE_SPAN[bucket.phase] ?? [0, 12];
        bucket.items.forEach((it) => {
          lanes.push({ title: it.title, start, end, cls: prioColor[it.priority] ?? 'bg-primary', priority: it.priority });
        });
      });
      const shown = lanes.slice(0, 10);
      const phaseCount = computed.roadmap.filter((b) => b.items.length > 0).length;
      chs.push({
        title: u.remediationTimeline, origin: ORIGIN.assessment, kind: 'gantt',
        takeaway: `${shown.length} workstream${shown.length === 1 ? '' : 's'} sequenced across ${phaseCount} phase${phaseCount === 1 ? '' : 's'} over a 12-month horizon.`,
        summary: u.remediationTimelineHint,
        data: { lanes: shown, extra: lanes.length - shown.length },
      });
    }
    const aiCount = insights ? (insights.executiveInsights?.topWeaknesses?.length ?? 0) + (insights.rootCauses?.length ?? 0) : 0;
    chs.push({
      title: u.aiAnalysis, origin: ORIGIN.insight, kind: 'stat',
      takeaway: aiCount > 0
        ? `AI distilled ${aiCount} interpreted insight${aiCount === 1 ? '' : 's'} — advisory only, findings stay deterministic.`
        : 'AI advisory layer — it explains results without altering any finding.',
      summary: u.aiNote,
      data: { value: aiCount, label: u.aiAnalysis, icon: 'sparkles' },
    });
    return chs;
  }, [computed, u, lang, pass, partial, fail, pct, merged.length, critRisks.length, workingPapers.records.length, insights]);


  // Trigger the walkthrough once every required analysis has completed AND
  // the user has confirmed the Internal Audit Mode in the pre-report gate.
  useEffect(() => {
    if (insightsDone && !insightsBusy && !walkthroughDone && auditModeAsked) {
      setWalkthroughActive(true);
    }
  }, [insightsDone, insightsBusy, walkthroughDone, auditModeAsked]);


  const exportWorkingPapersJson = () => {
    const payload = { meta: { ...docMeta, standard: profile.id, entityName }, workingPapers };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.id}-working-papers.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportWorkingPapersPdf = async () => {
    const check = validateConsistency(result, computed);
    if (!check.ok) { alert(`${u.consistencyError}\n\n${check.errors.join('\n')}`); return; }
    setWpBusy(true);
    try {
      await generateWorkingPapersPdf({ profile, lang, result, computed, answers, entityName, insights, reportMeta: docMeta });
    } catch (e) {
      console.error('Working papers PDF failed', e);
      alert(u.pdfError);
    } finally {
      setWpBusy(false);
    }
  };
  const exportPdf = async () => {
    // Consistency gate — never generate a report from divergent data.
    const check = validateConsistency(result, computed);
    if (!check.ok) {
      console.error('Report consistency validation failed', check.errors);
      alert(`${u.consistencyError}\n\n${check.errors.join('\n')}`);
      return;
    }
    setPdfBusy(true);
    try {
      await generateMetaAssessmentPdf({ profile, lang, result, computed, answers, entityName, insights, reportMeta: docMeta, includeWorkingPapers, workingPapers, auditorNotes });
    } catch (e) {
      console.error('PDF generation failed', e);
      alert(u.pdfError);
    } finally {
      setPdfBusy(false);
    }
  };

  // ── Executive presentation (Gamma) ──
  const [deckType, setDeckType] = useState<PresentationType>('visual-executive');

  // Automatic slide-metric validation — checks every slide's figures, units
  // and rounding against the canonical source metrics for the selected deck type.
  const slideValidation = useMemo(
    () => validateSlideMetrics(deckType, {
      profile, lang, result, computed, answers, entityName, insights, reportMeta: docMeta,
    }),
    [deckType, profile, lang, result, computed, answers, entityName, insights, docMeta],
  );
  const [deckStatus, setDeckStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [deckUrl, setDeckUrl] = useState<string | null>(null);
  const [deckPdfUrl, setDeckPdfUrl] = useState<string | null>(null);
  const [deckProgress, setDeckProgress] = useState(0);

  // Animate a professional progress bar while the deck is generated (creeps toward 95%).
  useEffect(() => {
    if (deckStatus !== 'generating') return;
    setDeckProgress((p) => (p > 0 && p < 95 ? p : 6));
    const id = setInterval(() => {
      setDeckProgress((p) => (p < 95 ? p + Math.max(1, Math.round((95 - p) * 0.04)) : p));
    }, 1400);
    return () => clearInterval(id);
  }, [deckStatus]);

  const generatePresentation = useCallback(async () => {
    // Never lose assessment results — only the presentation state changes.
    setDeckStatus('generating');
    setDeckUrl(null);
    setDeckPdfUrl(null);
    setDeckProgress(6);
    try {
      const content = buildPresentationContent(deckType, {
        profile, lang, result, computed, answers, entityName, insights, reportMeta: docMeta,
      });
      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: {
          action: 'start',
          inputText: content.inputText,
          title: content.title,
          additionalInstructions: content.additionalInstructions,
          numCards: content.numCards,
          themeId: 'pearl',
          language: lang,
        },
      });
      if (error) throw error;
      const generationId = (data as { generationId?: string })?.generationId;
      if (!generationId) throw new Error('No generation id returned');

      // Poll for completion (up to ~3.5 min).
      const maxAttempts = 42;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const { data: poll, error: pollErr } = await supabase.functions.invoke('generate-presentation', {
          body: { action: 'status', generationId },
        });
        if (pollErr) continue;
        const status = (poll as { status?: string }).status;
        if (status === 'completed') {
          const p = poll as { gammaUrl?: string; exportUrl?: string };
          setDeckUrl(p.gammaUrl ?? null);
          setDeckPdfUrl(p.exportUrl ?? null);
          setDeckProgress(100);
          setDeckStatus('ready');
          return;
        }
        if (status === 'failed') throw new Error('Gamma generation failed');
      }
      throw new Error('Generation timed out');
    } catch (e) {
      console.error('presentation generation failed', e);
      setDeckStatus('error');
    }
  }, [deckType, profile, lang, result, computed, answers, entityName, insights, docMeta]);


  return (
    <div className="space-y-6">
      {/* Chapter walkthrough — presents each chapter as a pop-up before the full report */}
      {/* Pre-report gate: confirm Internal Audit Mode before the report is generated */}
      {insightsDone && !insightsBusy && !auditModeAsked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-background border border-primary/30 rounded-xl shadow-2xl p-6 space-y-5">
            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{u.internalAuditMode}</span>
              <h2 className="text-lg font-bold text-foreground mt-1">{u.auditModeGateTitle}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">{u.auditModeGateHint}</p>
            </div>
            <div className="flex items-center justify-between gap-3 bg-background/40 border border-primary/15 rounded-lg px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2"><ClipboardList size={15} className="text-primary" /> {u.includeWorkingPapers}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{includeWorkingPapers ? u.auditModeOn : u.auditModeOff}</p>
              </div>
              <button onClick={() => setIncludeWorkingPapers((v) => !v)}
                className={`flex-shrink-0 w-11 h-6 rounded-full border-2 border-transparent transition-colors ${includeWorkingPapers ? 'bg-primary' : 'bg-input'}`}>
                <span className={`block w-5 h-5 rounded-full bg-background shadow transition-transform ${includeWorkingPapers ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{u.includeWorkingPapersHint}</p>
            <div className="flex justify-end">
              <button onClick={() => setAuditModeAsked(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity">
                {u.continueToReport} <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {walkthroughActive && reportChapters.length > 0 && (() => {
        const total = reportChapters.length;
        const ch = reportChapters[Math.min(walkthroughStep, total - 1)];
        const isLast = walkthroughStep >= total - 1;
        const close = () => { setWalkthroughActive(false); setWalkthroughDone(true); };
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg h-[600px] max-h-[90vh] bg-background border border-primary/30 rounded-xl shadow-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between flex-shrink-0">
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{u.chapterLabel} {walkthroughStep + 1} / {total}</span>
                <button onClick={close} className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">{u.viewFullReport} ✕</button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 mt-5">
                <h2 className="font-mono text-sm tracking-[0.2em] uppercase text-highlight">{ch.title}</h2>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">{ch.origin}</div>
                {/* Pyramid Principle: conclusion first */}
                <p className="text-base font-bold text-foreground leading-snug mt-3 border-l-2 border-primary pl-3">{ch.takeaway}</p>
                {/* Supporting evidence */}
                <div className="mt-4"><ChapterVisual ch={ch} /></div>
                {/* Context */}
                <p className="text-xs text-muted-foreground leading-relaxed mt-4">{ch.summary}</p>
              </div>
              <div className="flex items-center gap-1.5 pt-4 flex-shrink-0">
                {reportChapters.map((_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i <= walkthroughStep ? 'bg-primary' : 'bg-secondary'}`} />
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 flex-shrink-0">
                <button
                  onClick={() => setWalkthroughStep((s) => Math.max(0, s - 1))}
                  disabled={walkthroughStep === 0}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft size={15} /> {u.back}
                </button>
                {isLast ? (
                  <button onClick={close} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity">
                    {u.viewFullReport} <ChevronRight size={15} />
                  </button>
                ) : (
                  <button onClick={() => setWalkthroughStep((s) => Math.min(total - 1, s + 1))} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity">
                    {u.next} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="bg-background/40 border-l-4 border-primary border border-primary/15 rounded-lg p-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-mono">{profile.name} — {tr(profile.regulation, lang)}</div>
        <div className="text-lg font-bold text-foreground mt-0.5">{entityName}</div>
        <div className="text-xs text-muted-foreground mt-1">{REPORT_TITLE}</div>
        {result.summary && <p className="text-sm text-foreground leading-relaxed mt-3">{result.summary}</p>}
        <div className="text-[10px] text-muted-foreground font-mono mt-3 pt-3 border-t border-border">
          {docMeta.assessmentId} · v{docMeta.reportVersion} · {new Date(docMeta.generatedAt).toLocaleDateString('en-GB')}
        </div>
      </div>


      {/* Readiness + stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <div className="bg-background/40 border border-primary/15 rounded-lg p-4 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold font-mono">{u.readiness}</div>
          <div className={`text-4xl font-bold font-mono mt-1 ${pct >= 70 ? 'text-green-500' : pct >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{pct}%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{merged.length} {u.checked}</div>
        </div>
        {([[pass, u.passed, 'text-green-400'], [partial, u.partial, 'text-yellow-400'], [fail, u.gaps, 'text-destructive']] as [number, string, string][]).map(([n, l, c]) => (
          <div key={l} className="bg-background/40 border border-primary/15 rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold font-mono ${c}`}>{n}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Management attention index + audit readiness (deterministic) */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Attention index */}
        <div className="bg-background/40 border border-primary/15 rounded-lg p-5">
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">{u.attentionIndex}</h2>
          <div className="text-[10px] text-muted-foreground font-mono mb-3">{ORIGIN.assessment}</div>
          {(() => {
            const ai = computed.attentionIndex;
            const lvlCls = ai.level === 'critical' ? 'bg-destructive text-destructive-foreground'
              : ai.level === 'high' ? 'bg-orange-500 text-white'
              : ai.level === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white';
            return (
              <>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded text-sm font-bold uppercase tracking-wide ${lvlCls}`}>{attentionLabel(ai.level, lang)}</span>
                  <div className="flex gap-1.5 text-[11px] font-mono">
                    <span className="text-destructive">{ai.counts.critical}C</span>
                    <span className="text-orange-500">{ai.counts.high}H</span>
                    <span className="text-yellow-500">{ai.counts.medium}M</span>
                    <span className="text-green-500">{ai.counts.low}L</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">{u.attentionIndexHint}</p>
                {ai.drivers.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{u.attentionDrivers}</div>
                    <ul className="space-y-0.5">
                      {ai.drivers.map((d, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-1.5"><span className="text-primary">•</span><span>{d}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Audit readiness dimensions */}
        <div className="bg-background/40 border border-primary/15 rounded-lg p-5">
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">{u.auditReadiness}</h2>
          <div className="text-[10px] text-muted-foreground font-mono mb-3">{ORIGIN.assessment}</div>
          <div className="space-y-2.5">
            {computed.auditReadiness.dimensions.map((d) => {
              const barCls = d.pct >= 80 ? 'bg-green-500' : d.pct >= 60 ? 'bg-yellow-500' : d.pct >= 35 ? 'bg-orange-500' : 'bg-destructive';
              return (
                <div key={d.id} title={d.basis}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{d.label}</span>
                    <span className="font-mono text-muted-foreground">{readinessRatingLabel(d.rating, lang)} · {d.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${barCls}`} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{u.auditReadinessHint}</p>
        </div>
      </div>

      {/* CMMI maturity matching (per category, official 1–5 scale) */}
      {computed.cmmi?.enabled && (
        <div className="bg-background/40 border border-primary/15 rounded-lg p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight">{u.cmmiMatching}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {u.cmmiLevel} {computed.cmmi.overall} · {computed.cmmi.overallLabel} · {u.cmmiTarget} {computed.cmmi.target}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mb-4">{ORIGIN.assessment}</div>

          {/* CMMI level legend */}
          <div className="grid grid-cols-5 gap-1 mb-4">
            {CMMI_LEVELS.map(({ level }) => {
              const active = level <= computed.cmmi!.overall;
              return (
                <div key={level} className={`rounded-md px-1 py-1.5 text-center border ${active ? 'border-primary/40 bg-primary/10' : 'border-border bg-secondary/30'}`}>
                  <div className={`font-mono text-sm font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{level}</div>
                  <div className="text-[9px] leading-tight text-muted-foreground mt-0.5">{cmmiLabel(level, lang)}</div>
                </div>
              );
            })}
          </div>

          {/* Per-category matching */}
          <div className="space-y-2.5">
            {computed.cmmi.categories.map((c) => {
              const barCls = c.level >= 4 ? 'bg-green-500' : c.level === 3 ? 'bg-yellow-500' : c.level === 2 ? 'bg-orange-500' : 'bg-destructive';
              return (
                <div key={c.id} title={`${c.pct}% compliance · target level ${c.target}`}>
                  <div className="flex items-center justify-between text-xs mb-1 gap-2">
                    <span className="text-foreground font-medium truncate">{c.name}</span>
                    <span className="font-mono text-muted-foreground whitespace-nowrap">
                      L{c.level} {c.label}{c.gap > 0 ? ` · −${c.gap}` : ' ✓'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${barCls}`} style={{ width: `${(c.level / 5) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-control maturity */}
          {computed.cmmi.controls.length > 0 && (
            <div className="mt-5">
              <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-2">{u.cmmiControls}</h3>
              <div className="space-y-3">
                {[...new Set(computed.cmmi.controls.map((c) => c.categoryId))].map((catId) => {
                  const items = computed.cmmi!.controls.filter((c) => c.categoryId === catId);
                  return (
                    <div key={catId}>
                      <div className="text-[10px] font-mono text-highlight/80 mb-1">{items[0].categoryName}</div>
                      <div className="space-y-1">
                        {items.map((c) => {
                          const dotCls = c.level >= 4 ? 'bg-green-500' : c.level === 3 ? 'bg-yellow-500' : c.level === 2 ? 'bg-orange-500' : 'bg-destructive';
                          return (
                            <div key={c.id} className="flex items-center justify-between gap-2 text-[11px] border-b border-border/40 py-1">
                              <span className="text-foreground/90 truncate">
                                {c.article ? <span className="font-mono text-muted-foreground mr-1">{c.article}</span> : null}
                                {c.name}
                              </span>
                              <span className="flex items-center gap-1.5 font-mono text-muted-foreground whitespace-nowrap">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotCls}`} />
                                L{c.level} {c.label}{c.gap > 0 ? ` · −${c.gap}` : ' ✓'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">{u.cmmiHint}</p>
        </div>
      )}

      {/* Findings */}

      <div>
        <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">{u.findings}</h2>
        <div className="text-[10px] text-muted-foreground font-mono mb-3">{ORIGIN.assessment}</div>
        <div className="space-y-1.5">
          {merged.map((r) => {
            const st = STATUS_STYLE[r.status];
            return (
              <details key={r.id} className="bg-background/40 border border-primary/15 rounded-lg overflow-hidden">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30">
                  <span className="font-mono text-[11px] text-muted-foreground font-bold w-16 flex-shrink-0">{r.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground break-words">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.article}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border flex-shrink-0 ${st.cls}`}>{st.label.en}</span>
                </summary>
                <div className="border-t border-border bg-secondary/20 px-4 py-3 text-sm space-y-2.5">
                  {r.evidence && <ReportField label={u.evidence}>{r.evidence}</ReportField>}
                  {r.gap && <div><span className="font-semibold text-destructive">{u.gap}: </span>{r.gap}</div>}
                  {r.rationale && <ReportField label={u.rationale}>{r.rationale}</ReportField>}
                  {r.measure && <div><span className="font-semibold text-primary">{u.measure}: </span>{r.measure}</div>}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-highlight uppercase tracking-wide mb-1">{u.auditorNote}</label>
                    <textarea
                      value={auditorNotes[r.id] ?? ''}
                      onChange={(e) => setNote(r.id, e.target.value)}
                      rows={3}
                      placeholder={u.auditorNotePlaceholder}
                      className="w-full rounded-lg border border-primary/20 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-y"
                    />
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Working Papers & Assessment Traceability — only when Internal Audit Mode is on */}
      {includeWorkingPapers && <WorkingPapersSection wp={workingPapers} u={u} />}

      {/* Risks — rendered from the canonical computed.risks (same scores/ratings as PDF) */}
      {computed.risks.length > 0 && (
        <div>
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">
            {u.riskLandscape} {critRisks.length > 0 && <span className="text-destructive">· {critRisks.length} {u.critical}</span>}
          </h2>
          <div className="text-[10px] text-muted-foreground font-mono mb-3">{ORIGIN.risk}</div>
          <div className="space-y-1.5">

            {[...computed.risks].sort((a, b) => b.score - a.score).map((r) => {
              const score = r.score;
              const cls = r.rating === 'critical' ? 'bg-destructive text-destructive-foreground' : r.rating === 'high' ? 'bg-orange-500 text-white' : r.rating === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white';
              return (
                <div key={r.id} className="flex items-center gap-3 bg-background/40 border border-primary/15 rounded-lg px-3 py-2.5 text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground font-bold w-8 flex-shrink-0">{r.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground truncate" title={r.name}>{r.name}</div>
                    {r.component && <div className="text-xs text-muted-foreground truncate">{r.component}</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${cls}`}>{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence strength overview (deterministic, informational) */}
      {(() => {
        const ev = computed.evidence;
        const total = merged.length || 1;
        const rows: [string, number, string][] = [
          [u.evVeryHigh, ev.byStrength.very_high, 'bg-green-500'],
          [u.evHigh, ev.byStrength.high, 'bg-cyan-500'],
          [u.evMedium, ev.byStrength.medium, 'bg-yellow-500'],
          [u.evLow, ev.byStrength.low, 'bg-orange-500'],
          [u.evMissing, ev.missing.length, 'bg-destructive'],
        ];
        return (
          <div>
            <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight mb-1">{u.evidenceStrength}</h2>
            <div className="text-[10px] text-muted-foreground font-mono mb-3">{ORIGIN.assessment}</div>
            <div className="bg-background/40 border border-primary/15 rounded-lg p-5 space-y-2.5">
              {rows.map(([label, count, cls]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground">{label}</span>
                      <span className="font-mono text-muted-foreground">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[11px] text-muted-foreground pt-1">{u.evidenceStrengthHint}</p>
            </div>
          </div>
        );
      })()}

      {/* AI advisory layer — virtual internal auditor / compliance advisor */}
      <div className="bg-background/40 border border-primary/15 rounded-lg p-5">
        <div className="mb-3">
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-highlight">{u.aiAnalysis}</h2>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{ORIGIN.insight}</div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xl leading-relaxed">{u.aiNote}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <LayerBadge kind="fact" />
            <LayerBadge kind="insight" />
            <LayerBadge kind="recommendation" />
            <span className="text-[10px] text-muted-foreground">FACT = deterministic · INSIGHT = AI interpretation · RECOMMENDATION = AI advisory</span>
          </div>
        </div>

        {insightsBusy && (
          <AiWaitModal
            title={u.aiAnalysis}
            label={u.loadingInsights}
            note={u.insightsModalNote}
            progress={insightsProgress}
            u={u}
          />
        )}


        {insights && (
          <InsightsPanel insights={insights} computed={computed} lang={lang} u={u} reqMeta={reqMeta} />
        )}
      </div>


      {/* Internal Audit Mode toggle */}
      <div className="flex items-center justify-between gap-3 bg-background/40 border border-primary/15 rounded-lg px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-foreground flex items-center gap-2"><ClipboardList size={15} className="text-primary" /> {u.internalAuditMode}: {u.includeWorkingPapers}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xl leading-relaxed">{u.includeWorkingPapersHint}</p>
        </div>
        <button onClick={() => setIncludeWorkingPapers((v) => !v)}
          className={`flex-shrink-0 w-11 h-6 rounded-full border-2 border-transparent transition-colors ${includeWorkingPapers ? 'bg-primary' : 'bg-input'}`}>
          <span className={`block w-5 h-5 rounded-full bg-background shadow transition-transform ${includeWorkingPapers ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* Executive presentation (Gamma) */}
      <div className="bg-background/40 border border-primary/15 rounded-lg p-5 space-y-4">
        {deckStatus === 'generating' && (
          <AiWaitModal
            title={u.aiAnalysis}
            label={u.analyzingDeck}
            note={u.analyzingDeckHint}
            progress={deckProgress}
            u={u}
          />
        )}

        {deckStatus !== 'generating' && (
          <>
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Presentation size={15} className="text-primary" /> {u.presentationTitle}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">{u.presentationHint}</p>
            </div>

            {deckStatus === 'ready' && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary" /> {u.presentationReady}
                </div>
              </div>
            )}

            {deckStatus === 'error' && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle size={15} /> {u.presentationFailed}
                </div>
              </div>
            )}

            {/* Automatic slide-metric validation */}
            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-primary" /> {u.slideValidationTitle}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">{u.slideValidationHint}</p>
              </div>
              <QualityCheckPanel
                result={slideValidation.result}
                fixLogs={[]}
                categories={slideValidation.categories}
              />
              {slideValidation.result.criticalErrors > 0 && (
                <p className="text-[11px] text-destructive leading-relaxed">{u.slideValidationBlock}</p>
              )}
            </div>
          </>
        )}
      </div>



      <div className="pt-2 space-y-4">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Exports</div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Report as PDF */}
          {insights && (
            <div className="bg-background/40 border border-border rounded-lg p-4 space-y-3">
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText size={15} className="text-primary" /> Report as PDF
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Full board-ready assessment report.</p>
              </div>
              <button onClick={exportPdf} disabled={pdfBusy} className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} {u.exportPdf}
              </button>
            </div>
          )}

          {/* 2. Export working papers */}
          <div className="bg-background/40 border border-border rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardList size={15} className="text-primary" /> Export working papers
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Audit traceability &amp; evidence register.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={exportWorkingPapersPdf} disabled={wpBusy} className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-60">
                {wpBusy ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />} {u.exportWorkingPapers} (PDF)
              </button>
              <button onClick={exportWorkingPapersJson} className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Download size={14} /> {u.exportWorkingPapersJson}
              </button>
            </div>
          </div>

          {/* 3. Generate presentation */}
          <div className="bg-background/40 border border-border rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Presentation size={15} className="text-primary" /> Generate presentation
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Visual slide deck generated via Gamma.</p>
            </div>
            {deckStatus === 'ready' && (deckUrl || deckPdfUrl) ? (
              <div className="flex flex-col gap-2">
                {deckUrl && (
                  <a href={deckUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <ExternalLink size={14} /> {u.openInGamma}
                  </a>
                )}
                {deckPdfUrl && (
                  <a href={deckPdfUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    <Download size={14} /> Deck as PDF
                  </a>
                )}
              </div>
            ) : deckStatus === 'error' ? (
              <button onClick={generatePresentation}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <RotateCcw size={14} /> {u.retry}
              </button>
            ) : (
              <button onClick={generatePresentation}
                disabled={slideValidation.result.criticalErrors > 0}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                <Presentation size={14} /> {u.genPresentation}
              </button>
            )}
          </div>

          {/* 4. Raw data */}
          <div className="bg-background/40 border border-border rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Download size={15} className="text-primary" /> Raw data
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">Machine-readable assessment result.</p>
            </div>
            <button onClick={exportJson} className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Download size={14} /> {u.exportJson}
            </button>
          </div>
        </div>

        <div className="pt-1">
          <button onClick={onRestart} className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            <RotateCcw size={14} /> {u.restart}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background/50 border border-border rounded-md px-3 py-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

// ── Chapter walkthrough visuals (easy-to-read graphics per chapter) ──
function ChapterVisual({ ch }: { ch: { kind: string; data: any } }) {
  const d = ch.data;
  if (ch.kind === 'attention') {
    const lvlCls = d.level === 'critical' ? 'bg-destructive text-destructive-foreground'
      : d.level === 'high' ? 'bg-orange-500 text-white'
      : d.level === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white';
    const cells: [string, number, string][] = [
      ['Critical', d.counts.critical, 'text-destructive'],
      ['High', d.counts.high, 'text-orange-500'],
      ['Medium', d.counts.medium, 'text-yellow-500'],
      ['Low', d.counts.low, 'text-green-500'],
    ];
    return (
      <div className="space-y-3">
        <div className="flex justify-center">
          <span className={`px-4 py-1.5 rounded-md text-base font-bold uppercase tracking-wide ${lvlCls}`}>{d.label}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {cells.map(([l, n, c]) => (
            <div key={l} className="bg-secondary/40 rounded-lg p-2 text-center">
              <div className={`text-2xl font-bold font-mono ${c}`}>{n}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (ch.kind === 'cmmi') {
    const m = d.cmmi;
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-4xl font-bold font-mono text-primary">L{m.overall}</div>
          <div className="text-[10px] text-muted-foreground">{m.overallLabel} · target L{m.target}</div>
        </div>
        <div className="space-y-2">
          {m.categories.map((c: any) => {
            const barCls = c.level >= 4 ? 'bg-green-500' : c.level === 3 ? 'bg-yellow-500' : c.level === 2 ? 'bg-orange-500' : 'bg-destructive';
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-foreground truncate">{c.name}</span>
                  <span className="font-mono text-muted-foreground whitespace-nowrap">L{c.level}{c.gap > 0 ? ` · −${c.gap}` : ' ✓'}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${barCls}`} style={{ width: `${(c.level / 5) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (ch.kind === 'readiness') {
    return (
      <div className="space-y-2.5">
        {d.dimensions.map((dim: any) => {
          const barCls = dim.pct >= 80 ? 'bg-green-500' : dim.pct >= 60 ? 'bg-yellow-500' : dim.pct >= 35 ? 'bg-orange-500' : 'bg-destructive';
          return (
            <div key={dim.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{dim.label}</span>
                <span className="font-mono text-muted-foreground">{dim.pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${barCls}`} style={{ width: `${dim.pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (ch.kind === 'findings') {
    const total = d.total || 1;
    const seg: [number, string][] = [[d.pass, 'bg-green-500'], [d.partial, 'bg-yellow-500'], [d.fail, 'bg-destructive']];
    const cells: [string, number, string][] = [
      ['Passed', d.pass, 'text-green-500'],
      ['Partial', d.partial, 'text-yellow-500'],
      ['Gaps', d.fail, 'text-destructive'],
    ];
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className={`text-4xl font-bold font-mono ${d.pct >= 70 ? 'text-green-500' : d.pct >= 40 ? 'text-yellow-500' : 'text-destructive'}`}>{d.pct}%</div>
          <div className="text-[10px] text-muted-foreground">{d.total} requirements assessed</div>
        </div>
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-secondary">
          {seg.map(([n, cls], i) => (
            <div key={i} className={cls} style={{ width: `${(n / total) * 100}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {cells.map(([l, n, c]) => (
            <div key={l} className="bg-secondary/40 rounded-lg p-2 text-center">
              <div className={`text-2xl font-bold font-mono ${c}`}>{n}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (ch.kind === 'risks') {
    const max = d.risks[0]?.score || 1;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold font-mono text-foreground">{d.total}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Total risks</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <div className="text-2xl font-bold font-mono text-destructive">{d.crit}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Critical</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {d.risks.map((r: any) => {
            const cls = r.rating === 'critical' ? 'bg-destructive' : r.rating === 'high' ? 'bg-orange-500' : r.rating === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 min-w-0 truncate text-foreground" title={r.name}>{r.name}</span>
                <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${cls}`} style={{ width: `${(r.score / max) * 100}%` }} />
                </div>
                <span className="font-mono text-muted-foreground w-6 text-right">{r.score}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (ch.kind === 'evidence') {
    const total = d.total || 1;
    return (
      <div className="space-y-2.5">
        {d.rows.map((row: any) => {
          const pct = Math.round((row.count / total) * 100);
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground">{row.label}</span>
                <span className="font-mono text-muted-foreground">{row.count} · {pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full ${row.cls}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (ch.kind === 'gantt') {
    const TOTAL = 12;
    const ticks = [0, 3, 6, 9, 12];
    const phaseLabel = (start: number) => start === 0 ? '0–3 mo' : start === 3 ? '3–6 mo' : '6–12 mo';
    return (
      <div className="space-y-3">
        {/* Month axis */}
        <div className="relative ml-[42%] h-4">
          {ticks.map((m) => (
            <div key={m} className="absolute top-0 -translate-x-1/2 text-[9px] font-mono text-muted-foreground" style={{ left: `${(m / TOTAL) * 100}%` }}>
              {m}
            </div>
          ))}
        </div>
        {/* Lanes */}
        <div className="space-y-1.5">
          {d.lanes.map((lane: any, i: number) => {
            const left = (lane.start / TOTAL) * 100;
            const width = ((lane.end - lane.start) / TOTAL) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-[40%] shrink-0 truncate text-[11px] text-foreground" title={lane.title}>{lane.title}</span>
                <div className="relative flex-1 h-5 rounded bg-secondary/50 overflow-hidden">
                  {/* phase gridlines */}
                  {ticks.slice(1, -1).map((m) => (
                    <div key={m} className="absolute top-0 bottom-0 w-px bg-border/60" style={{ left: `${(m / TOTAL) * 100}%` }} />
                  ))}
                  <div
                    className={`absolute top-0.5 bottom-0.5 rounded ${lane.cls} flex items-center justify-end pr-1.5`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="text-[8px] font-mono text-white/90 whitespace-nowrap">{phaseLabel(lane.start)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {d.extra > 0 && (
          <div className="text-[10px] text-muted-foreground text-right">+{d.extra} more workstream{d.extra === 1 ? '' : 's'}</div>
        )}
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {[['Critical', 'bg-destructive'], ['High', 'bg-orange-500'], ['Medium', 'bg-yellow-500'], ['Low', 'bg-primary']].map(([l, c]) => (
            <span key={l} className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${c}`} /> {l}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (ch.kind === 'stat') {
    const Icon = d.icon === 'sparkles' ? Sparkles : ClipboardList;
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <Icon size={32} className="text-primary mb-2" />
        <div className="text-5xl font-bold font-mono text-foreground">{d.value}</div>
      </div>
    );
  }
  return null;
}



// ── Page ────────────────────────────────────────────────────────
const MetaAssessmentTool = () => {
  // This platform is presented in English only, independent of the global UI language.
  const lang: Lang = 'en';
  const u = ui(lang);
  

  const [phase, setPhase] = useState<Phase>('standard');
  const [profile, setProfile] = useState<StandardProfile | null>(null);
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [computed, setComputed] = useState<ComputedAssessment | null>(null);

  // Layer 1: deterministic, instant, no AI. Identical answers → identical result.
  const runAssessment = useCallback((p: StandardProfile, a: IntakeAnswers) => {
    const { result: res, computed: comp } = assess(p, a, lang);
    setResult(res);
    setComputed(comp);
    setPhase('report');
  }, [lang]);

  const restart = useCallback(() => {
    setPhase('standard'); setProfile(null); setAnswers({}); setResult(null); setComputed(null);
  }, []);

  return (
    <SiteChrome hideLanguageSwitch>
      <PasswordGate storageKey="assessment-tools" label="GapZero">
        <PageMeta title="GapZero — AI-Powered Internal Audit & Compliance Readiness — Inside the Box" description="GapZero turns any standard into an audit-ready assessment: rule-based compliance with an AI insight & advisory layer — intake, assessment, AI insights and board-ready reporting." />
        <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <header className="mb-8">
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-primary mb-3">{u.section}</div>
            <h1 className="font-mono text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
              {phase === 'standard' ? u.headline : `${profile?.name} — ${tr(profile?.fullName, lang)}`}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-2xl leading-relaxed">{u.sub}</p>
            {phase === 'standard' && (
              <p className="text-sm text-foreground/80 mt-3 max-w-2xl leading-relaxed">{u.valueProp}</p>
            )}
          </header>

          {/* Phase nav */}
          <div className="flex items-center gap-2 mb-8 font-mono text-[11px] uppercase tracking-wider">
            {(['standard', 'intake', 'report'] as Phase[]).map((ph, i) => {
              const order = ['standard', 'intake', 'report'];
              const active = order.indexOf(phase) >= i;
              const labels = { standard: u.chooseStandard, intake: 'Intake', report: 'Assessment & Report' };
              return (
                <div key={ph} className="flex items-center gap-2">
                  {i > 0 && <span className="text-border">›</span>}
                  <span className={active ? 'text-primary' : 'text-muted-foreground/50'}>{labels[ph]}</span>
                </div>
              );
            })}
          </div>

          {phase === 'standard' && (
            <>
              <ArchitectureNote u={u} />
              <StandardSelect
                lang={lang}
                onPick={(p) => { setProfile(p); setAnswers({}); setPhase('intake'); }}
              />
            </>
          )}

          {phase === 'intake' && profile && (
            <IntakeWizard
              key={`${profile.id}-${Object.keys(answers).length}`}
              profile={profile} lang={lang} initial={answers}
              onBack={restart}
              onFinish={(a) => { setAnswers(a); runAssessment(profile, a); }}
            />
          )}

          {phase === 'report' && profile && result && computed && (
            <Report profile={profile} lang={lang} result={result} computed={computed} answers={answers} onRestart={restart} />
          )}
        </main>
      </PasswordGate>
    </SiteChrome>
  );
};

export default MetaAssessmentTool;
