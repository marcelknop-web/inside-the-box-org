import { useState, useMemo, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight, ArrowLeft, Loader2, Sparkles, ShieldCheck, Network, Car,
  CreditCard, Factory, Server, RotateCcw, Lock, AlertTriangle, CheckCircle2,
  Download, FileText,
} from 'lucide-react';
import { generateMetaAssessmentPdf } from '@/utils/metaAssessmentReportPdf';
import { buildReportMeta, validateConsistency, ORIGIN, REPORT_TITLE } from '@/data/metaAssessment/reportMeta';
import { LucideIcon } from 'lucide-react';
import { SiteChrome } from '@/components/SiteChrome';
import { PasswordGate } from '@/components/PasswordGate';
import { PageMeta } from '@/components/PageMeta';

import { supabase } from '@/integrations/supabase/client';

import { STANDARD_PROFILES, getProfile, tr, assess, MATURITY_LEVELS, maturityKey, readinessRatingLabel, attentionLabel } from '@/data/metaAssessment';
import type {
  Lang, StandardProfile, IntakeField, IntakeAnswers,
  AssessmentResult, AssessedRequirement, ReqStatus,
  ComputedAssessment, Recommendation, InsightResult,
} from '@/data/metaAssessment/types';

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
    section: '/ INTERNAL AUDIT & COMPLIANCE READINESS',
    headline: 'AI-Powered Internal Audit & Compliance Readiness Platform',
    sub: 'Pick a standard → intake → compliance assessment → AI insights → reporting.',
    valueProp: 'The Assessment Engine determines compliance. The AI Insight Engine explains why issues exist, how they connect, which matter most and what to prioritise — it never alters findings, scores or risks.',
    chooseStandard: 'Choose a standard',
    soon: 'Soon',
    open: 'Start',
    demo: 'Demo',
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
      'Deterministic Assessment Engine — source of truth',
      'Risk Engine — risks derived from gaps',
      'AI Insight Engine — interpretation layer',
      'Reporting Engine — communication layer',
    ],
    archNote: 'AI is not responsible for compliance decisions. It explains results but never alters them.',
    // ── deterministic layer ──
    computing: 'Computing rule-based assessment …',
    deterministicNote: 'Rule-based compliance assessment (audit-safe, no AI).',
    recommendations: 'Recommendation plan',
    roadmap: 'Roadmap',
    // ── AI insight & advisory layer ──
    aiAnalysis: 'AI Insights & Advisory',
    aiNote: 'AI interpretation layer — it explains the rule-based compliance results and never determines, modifies or overrides compliance status, scores or risks.',
    loadInsights: 'Load AI Insights',
    loadingInsights: 'AI is analysing the results …',
    execNarrative: 'Executive narrative',
    rootCauses: 'Root causes',
    gapClusters: 'Core themes (gap clusters)',
    crossControl: 'Cross-control insights',
    roadmapRationale: 'Roadmap rationale',
    auditorQuestions: 'Deepening audit questions',
    insightsError: 'AI analysis failed. Please retry.',
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
    attentionDrivers: 'Key drivers',
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

// ── Standard selector ───────────────────────────────────────────
function StandardSelect({ lang, onPick }: { lang: Lang; onPick: (p: StandardProfile) => void }) {
  const u = ui(lang);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STANDARD_PROFILES.map((p) => {
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
      })}
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
  const [sub, setSub] = useState(0);
  const [answers, setAnswers] = useState<IntakeAnswers>(initial ?? {});
  const step = profile.intake[sub];
  const isLast = sub === profile.intake.length - 1;

  const setVal = useCallback((id: string, v: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }, []);

  // Demo: fill only the current step's fields with test data (like DORA/NIS2/E26)
  const fillDemo = useCallback(() => {
    const demo = profile.demoAnswers;
    if (!demo) return;
    setAnswers((prev) => {
      const next = { ...prev };
      for (const f of step.fields) {
        if (f.id in demo) next[f.id] = demo[f.id];
      }
      return next;
    });
  }, [profile.demoAnswers, step]);

  const canNext = useMemo(() => step.fields.every((f) => {
    if (!f.required) return true;
    const v = answers[f.id];
    return Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  }), [step, answers]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {profile.intake.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-all ${i < sub ? 'bg-primary' : i === sub ? 'bg-primary/60' : 'bg-secondary'}`} />
        ))}
        <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">{sub + 1}/{profile.intake.length}</span>
      </div>

      <div className="text-base font-bold text-foreground font-mono">{tr(step.title, lang)}</div>
      {step.subtitle && <div className="text-sm text-muted-foreground mt-0.5 mb-3">{tr(step.subtitle, lang)}</div>}
      {step.info && (
        <div className="border border-primary/20 bg-primary/10 rounded-lg px-4 py-3 text-sm text-foreground mb-4">💡 {tr(step.info, lang)}</div>
      )}

      <div className="space-y-5">
        {step.fields.map((f) => (
          <FieldView key={f.id} field={f} value={answers[f.id]} onChange={(v) => setVal(f.id, v)} lang={lang} answers={answers} setVal={setVal} />
        ))}
      </div>

      <div className="flex justify-between items-center pt-6">
        <div className="flex items-center gap-2">
          <button onClick={() => (sub === 0 ? onBack() : setSub(sub - 1))}
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
        <button disabled={!canNext} onClick={() => (isLast ? onFinish(answers) : setSub(sub + 1))}
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


function InsightSection({ title, children, layer = 'insight', confidence }: {
  title: string; children: React.ReactNode; layer?: LayerKind; confidence?: string;
}) {
  return (
    <div className="border-t border-border/60 pt-4">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <h3 className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary">{title}</h3>
        <LayerBadge kind={layer} />
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>
      {children}
    </div>
  );
}

const RATING_CLS: Record<string, string> = {
  low: 'bg-green-500/10 text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

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
  return (
    <div className="mt-5 space-y-5">
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
    }
  }, [profile, lang, computed, result, u.insightsError]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const [pdfBusy, setPdfBusy] = useState(false);
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
      await generateMetaAssessmentPdf({ profile, lang, result, computed, answers, entityName, insights, reportMeta: docMeta });
    } catch (e) {
      console.error('PDF generation failed', e);
      alert(u.pdfError);
    } finally {
      setPdfBusy(false);
    }
  };


  return (
    <div className="space-y-6">
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
                </div>
              </details>
            );
          })}
        </div>
      </div>

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
          <div className="py-3 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {u.loadingInsights}</span>
              <span className="font-mono text-xs">{insightsProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${insightsProgress}%` }} />
            </div>
          </div>
        )}

        {insights && (
          <InsightsPanel insights={insights} computed={computed} lang={lang} u={u} reqMeta={reqMeta} />
        )}
      </div>


      <div className="flex flex-wrap gap-3 pt-2">
        {insights && (
          <button onClick={exportPdf} disabled={pdfBusy} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} {u.exportPdf}
          </button>
        )}
        <button onClick={exportJson} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Download size={14} /> {u.exportJson}
        </button>
        <button onClick={onRestart} className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
          <RotateCcw size={14} /> {u.restart}
        </button>
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
    <SiteChrome>
      <PasswordGate storageKey="assessment-tools" label="Meta Assessment">
        <PageMeta title="AI-Powered Internal Audit & Compliance Readiness Platform — Inside the Box" description="Rule-based compliance assessment with an AI insight & advisory layer: pick a standard, intake, compliance assessment, AI insights, reporting." />
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
