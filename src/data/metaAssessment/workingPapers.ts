// ── Working Papers & Assessment Traceability engine (deterministic) ──
//
// Produces professional-grade audit working papers from one canonical
// assessment result object. Every Pass / Partial / Gap decision is made
// fully traceable: the original user inputs, the deterministic rule that
// was applied, the generated risk and the AI sections that referenced the
// requirement are all reconstructed here — never invented by the AI.
//
// This is the foundation for internal-audit, compliance and readiness
// working papers: Single Assessment → Single Result Model → Multiple Views.

import type {
  Lang, StandardProfile, IntakeAnswers, AssessmentResult, ComputedAssessment,
  InsightResult, ReqStatus, EvidenceType, EvidenceStrength,
} from './types';
import { tr } from './types';
import {
  EVIDENCE_TYPE_LABEL, EVIDENCE_STRENGTH_LABEL,
} from './engine';
import type { ReportMeta } from './reportMeta';
import { ASSESSMENT_ENGINE_VERSION } from './reportMeta';

const STATUS_LABEL: Record<ReqStatus, Record<Lang, string>> = {
  pass: { de: 'Erfüllt', en: 'Pass', fr: 'Conforme' },
  partial: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' },
  fail: { de: 'Lücke', en: 'Gap', fr: 'Lacune' },
};

const RISK_RATING_LABEL: Record<string, Record<Lang, string>> = {
  critical: { de: 'Kritisch', en: 'Critical', fr: 'Critique' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  low: { de: 'Niedrig', en: 'Low', fr: 'Faible' },
};

const trL = (x: Record<Lang, string>, lang: Lang) => x[lang] ?? x.en;

export interface WorkingPaperInput {
  fieldId: string;
  question: string;
  answer: string;
}

export interface WorkingPaperRecord {
  requirementId: string;
  article: string;
  name: string;
  assessmentQuestion: string;
  inputs: WorkingPaperInput[];
  supportingComments: string;
  evidenceSubmitted: string;
  evidenceType: EvidenceType | 'none';
  evidenceTypeLabel: string;
  evidenceName: string;
  evidenceSource: string;
  evidenceStrength: EvidenceStrength | 'none';
  evidenceStrengthLabel: string;
  ruleId: string;
  ruleLogic: string[];
  deterministicResult: ReqStatus;
  resultLabel: string;
  generatedRiskId: string | null;
  riskFormula: string | null;
  riskScore: number | null;
  riskRatingLabel: string | null;
  referencedByAI: boolean;
  aiSections: string[];
  // audit-trail metadata
  assessmentId: string;
  assessmentVersion: string;
  timestamp: string;
  assessor: string;
  sourceSystem: string;
}

export interface EvidenceRegisterEntry {
  evidenceId: string;
  requirementId: string;
  requirementName: string;
  type: EvidenceType;
  typeLabel: string;
  strength: EvidenceStrength;
  strengthLabel: string;
  description: string;
  usedFor: string;
  resultContribution: ReqStatus;
  resultContributionLabel: string;
}

export interface WorkingPapers {
  records: WorkingPaperRecord[];
  evidenceRegister: EvidenceRegisterEntry[];
}

const SOURCE_SYSTEM = 'Inside the Box — Internal Audit & Compliance Readiness Platform';
const DEFAULT_ASSESSOR = 'Inside the Box (rule-based assessment engine)';

/** Build a lookup of intake field metadata + option labels for token resolution. */
function buildFieldIndex(profile: StandardProfile, lang: Lang) {
  const fieldLabel = new Map<string, string>();
  const fieldType = new Map<string, string>();
  const optionLabel = new Map<string, string>(); // "fieldId:optionId" → label
  for (const step of profile.intake) {
    for (const f of step.fields) {
      fieldLabel.set(f.id, tr(f.label, lang));
      fieldType.set(f.id, f.type);
      for (const o of f.options ?? []) optionLabel.set(`${f.id}:${o.id}`, tr(o.label, lang));
    }
  }
  return { fieldLabel, fieldType, optionLabel };
}

/** Human-readable answer for a single intake field. */
function answerText(
  fieldId: string, answers: IntakeAnswers,
  idx: ReturnType<typeof buildFieldIndex>, lang: Lang,
): string {
  const v = answers[fieldId];
  const none = { de: 'Keine Angabe', en: 'No response', fr: 'Aucune réponse' }[lang];
  if (v == null || (Array.isArray(v) && v.length === 0) || v === '') return none;
  const lbl = (id: string) => idx.optionLabel.get(`${fieldId}:${id}`) ?? id;
  if (Array.isArray(v)) return v.map(lbl).join(', ');
  // single-select resolves via option labels; free text is preserved verbatim
  return idx.optionLabel.get(`${fieldId}:${v}`) ?? String(v);
}

/** Translate a requirement's deterministic rule into plain-language logic. */
function ruleLogic(
  requiresAll: string[], requiresAny: string[],
  idx: ReturnType<typeof buildFieldIndex>, hasRule: boolean, lang: Lang,
): string[] {
  const lbl = (tk: string) => {
    const [fid, oid] = tk.split(':');
    if (oid) return idx.optionLabel.get(tk) ?? oid;
    return idx.fieldLabel.get(fid) ?? fid;
  };
  if (!hasRule) {
    return [{
      de: 'Keine deterministische Regel definiert → konservativ als Lücke bewertet (kein Nachweis zur Bestätigung).',
      en: 'No deterministic rule defined → conservatively assessed as Gap (no evidence to confirm).',
      fr: 'Aucune règle déterministe définie → évalué prudemment comme Lacune (aucune preuve de confirmation).',
    }[lang]];
  }
  const lines: string[] = [];
  if (requiresAll.length) {
    lines.push(`IF ${requiresAll.map(lbl).join(' AND ')} → Pass`);
  }
  if (requiresAny.length) {
    lines.push(`IF ANY OF [ ${requiresAny.map(lbl).join(' , ')} ] → Partial`);
  } else if (requiresAll.length) {
    lines.push(`IF SOME OF [ ${requiresAll.map(lbl).join(' , ')} ] → Partial`);
  }
  lines.push('ELSE → Gap');
  return lines;
}

/** Does a free-text/array AI field reference the requirement id? */
function mentionsId(id: string, ...texts: (string | undefined)[]): boolean {
  return texts.some((t) => !!t && t.includes(id));
}

/** Determine which AI sections referenced a given requirement id. */
function aiSectionsFor(id: string, insights: InsightResult | null | undefined): string[] {
  if (!insights) return [];
  const out: string[] = [];
  const ei = insights.executiveInsights;
  if (mentionsId(id, insights.executiveNarrative)) out.push('Executive Narrative');
  if (ei && mentionsId(id, ...(ei.topWeaknesses ?? []), ...(ei.topStrengths ?? []), ...(ei.highestBusinessRisks ?? []), ...(ei.multiRegulatoryIssues ?? []), ...(ei.managementFocus ?? []))) {
    out.push('Executive Insights');
  }
  if ((insights.rootCauses ?? []).some((rc) => mentionsId(id, rc.symptom, rc.cause, ...(rc.validationActivities ?? [])))) out.push('Root Cause Analysis');
  if ((insights.gapClusters ?? []).some((gc) => (gc.controlIds ?? []).includes(id) || mentionsId(id, gc.title, gc.summary, gc.businessImpact, gc.regulatoryImpact))) out.push('Gap Clusters');
  if (mentionsId(id, ...(insights.crossControlInsights ?? []))) out.push('Cross-control Insights');
  if ((insights.managementThemes ?? []).some((m) => mentionsId(id, m.title, m.currentState, m.riskExposure, m.improvementOpportunity))) out.push('Management Themes');
  if ((insights.transformationPrograms ?? []).some((p) => (p.relatedControlIds ?? []).includes(id) || mentionsId(id, p.title, p.objectives, p.expectedBenefits, p.relatedRisks))) out.push('Transformation Programs');
  if ((insights.systemicWeaknesses ?? []).some((s) => (s.relatedControlIds ?? []).includes(id) || mentionsId(id, s.area, s.pattern))) out.push('Systemic Weaknesses');
  if ((insights.hypotheses ?? []).some((h) => (h.relatedControlIds ?? []).includes(id) || mentionsId(id, h.statement))) out.push('Hypotheses');
  if ((insights.consultantObservations ?? []).some((o) => mentionsId(id, o.observation, o.implication, o.recommendation))) out.push('Consultant Observations');
  if ((insights.businessImpact ?? []).some((b) => mentionsId(id, b.area, b.consequence))) out.push('Business Impact Analysis');
  return [...new Set(out)];
}

export function buildWorkingPapers(
  profile: StandardProfile,
  answers: IntakeAnswers,
  result: AssessmentResult,
  computed: ComputedAssessment,
  insights: InsightResult | null | undefined,
  reportMeta: ReportMeta | undefined,
  lang: Lang,
): WorkingPapers {
  const idx = buildFieldIndex(profile, lang);
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const riskById = new Map(computed.risks.map((r) => [r.id, r]));

  // Re-derive the deterministic finding → risk mapping (R1, R2 … assigned in
  // finding order to every non-pass requirement — mirrors deriveRisks()).
  const riskIdByReq = new Map<string, string>();
  let riskN = 0;
  for (const f of result.requirements) {
    if (f.status !== 'pass') riskIdByReq.set(f.id, `R${++riskN}`);
  }

  const assessmentId = reportMeta?.assessmentId ?? `${profile.id.toUpperCase()}-LIVE`;
  const version = reportMeta?.assessmentEngineVersion ?? ASSESSMENT_ENGINE_VERSION;
  const timestamp = reportMeta?.generatedAt ?? new Date().toISOString();

  const records: WorkingPaperRecord[] = result.requirements.map((f) => {
    const meta = metaById.get(f.id);
    const name = meta ? tr(meta.name, lang) : f.name || f.id;
    const rule = meta?.rule;
    const requiresAll = rule?.requiresAll ?? [];
    const requiresAny = rule?.requiresAny ?? [];

    // Original user inputs that fed this requirement's rule (audit trail).
    const fieldIds = [...new Set([...requiresAll, ...requiresAny].map((tk) => tk.split(':')[0]))];
    const inputs: WorkingPaperInput[] = fieldIds.map((fid) => ({
      fieldId: fid,
      question: idx.fieldLabel.get(fid) ?? fid,
      answer: answerText(fid, answers, idx, lang),
    }));

    // Evidence (from the deterministic evidence engine — display only).
    const evItem = computed.evidence.items.find((e) => e.controlId === f.id);
    const evidenceStrength: EvidenceStrength | 'none' = evItem ? evItem.strength : 'none';
    const evidenceStrengthLabel = evItem
      ? trL(EVIDENCE_STRENGTH_LABEL[evItem.strength] as Record<Lang, string>, lang)
      : { de: 'Kein Nachweis', en: 'No Evidence', fr: 'Aucune preuve' }[lang];

    // Generated risk traceability.
    const riskId = riskIdByReq.get(f.id) ?? null;
    const enriched = riskId ? riskById.get(riskId) : undefined;
    const riskFormula = enriched ? `Likelihood ${enriched.likelihood} × Impact ${enriched.impact}` : null;
    const riskScore = enriched ? enriched.score : null;
    const riskRatingLabel = enriched ? trL(RISK_RATING_LABEL[enriched.rating], lang) : null;

    const aiSections = aiSectionsFor(f.id, insights);

    return {
      requirementId: f.id,
      article: meta?.article ?? f.article ?? '',
      name,
      assessmentQuestion: `Has the organization implemented and evidenced "${name}" as required by ${meta?.article || profile.name}?`,
      inputs,
      supportingComments: (f.evidence || '').trim(),
      evidenceSubmitted: evItem ? evItem.summary : (f.evidence || '').trim(),
      evidenceStrength,
      evidenceStrengthLabel,
      ruleId: `${f.id}-RULE`,
      ruleLogic: ruleLogic(requiresAll, requiresAny, idx, !!rule, lang),
      deterministicResult: f.status,
      resultLabel: trL(STATUS_LABEL[f.status], lang),
      generatedRiskId: riskId,
      riskFormula,
      riskScore,
      riskRatingLabel,
      referencedByAI: aiSections.length > 0,
      aiSections,
      assessmentId,
      assessmentVersion: version,
      timestamp,
      assessor: DEFAULT_ASSESSOR,
      sourceSystem: SOURCE_SYSTEM,
    };
  });

  // ── Evidence Register (appendix) ──────────────────────────────
  const statusById = new Map(result.requirements.map((f) => [f.id, f.status]));
  const evidenceRegister: EvidenceRegisterEntry[] = computed.evidence.items.map((it, i) => {
    const status = statusById.get(it.controlId) ?? 'fail';
    return {
      evidenceId: `E-${String(i + 1).padStart(3, '0')}`,
      requirementId: it.controlId,
      requirementName: it.controlName,
      type: it.type,
      typeLabel: trL(EVIDENCE_TYPE_LABEL[it.type] as Record<Lang, string>, lang),
      strength: it.strength,
      strengthLabel: trL(EVIDENCE_STRENGTH_LABEL[it.strength] as Record<Lang, string>, lang),
      description: it.summary,
      usedFor: it.controlName,
      resultContribution: status,
      resultContributionLabel: trL(STATUS_LABEL[status], lang),
    };
  });

  return { records, evidenceRegister };
}
