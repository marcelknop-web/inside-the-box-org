// ── Generic meta-assessment engine: shared types ────────────────
//
// A "standard profile" is the only thing that differs between
// assessments (NIS2, DORA, AI Act, …). The engine renders the intake,
// runs the universal AI reasoning, and produces the report purely from
// this configuration. Add a new standard = add a new profile.

export type Lang = 'de' | 'en' | 'fr';
export type Tri = Record<Lang, string>;

export interface IntakeOption {
  id: string;
  label: Tri;
  icon?: string;
  desc?: Tri;
}

export type IntakeFieldType = 'text' | 'textarea' | 'single' | 'multi' | 'maturity-multi';

/**
 * Maturity levels for an implemented control, ordered from least to most
 * assured. Used by the `maturity-multi` intake field so each selected
 * measure can be qualified beyond a simple "implemented" checkbox.
 */
export const MATURITY_LEVELS: { id: string; label: Tri; short: Tri }[] = [
  {
    id: 'existing',
    label: { de: 'Vorhanden, nicht dokumentiert', en: 'Existing, not documented', fr: 'Existant, non documenté' },
    short: { de: 'Vorhanden', en: 'Existing', fr: 'Existant' },
  },
  {
    id: 'documented',
    label: { de: 'Dokumentiert', en: 'Documented', fr: 'Documenté' },
    short: { de: 'Dokumentiert', en: 'Documented', fr: 'Documenté' },
  },
  {
    id: 'audited',
    label: { de: 'Auditiert', en: 'Audited', fr: 'Audité' },
    short: { de: 'Auditiert', en: 'Audited', fr: 'Audité' },
  },
  {
    id: 'certified',
    label: { de: 'Zertifiziert', en: 'Certified', fr: 'Certifié' },
    short: { de: 'Zertifiziert', en: 'Certified', fr: 'Certifié' },
  },
];

/** Answer key that stores the maturity level for a given measure option. */
export function maturityKey(fieldId: string, optionId: string): string {
  return `${fieldId}__mat__${optionId}`;
}

export interface IntakeField {
  id: string;
  type: IntakeFieldType;
  label: Tri;
  placeholder?: Tri;
  help?: Tri;
  /** required for single / multi */
  options?: IntakeOption[];
  required?: boolean;
}

export interface IntakeStep {
  title: Tri;
  subtitle?: Tri;
  info?: Tri;
  fields: IntakeField[];
}

// ── Common data model entities (standard-agnostic) ──────────────

/** A grouping of controls (e.g. "Governance", "Technical measures"). */
export interface Category {
  id: string;
  name: Tri;
  /** relative weight of the category (default 1) */
  weight?: number;
}

/**
 * Deterministic rule that derives a finding status purely from the
 * intake answers — NO AI involved. References intake options as
 * "fieldId:optionId" (e.g. "measures:mfa") or a plain "fieldId" for
 * free-text / presence checks.
 *
 * Logic: all `requiresAll` satisfied → pass; some (or any `requiresAny`)
 * satisfied → partial; none satisfied → fail.
 */
export interface RequirementRule {
  /** every token must be present for a full pass */
  requiresAll?: string[];
  /** at least one of these counts as partial evidence */
  requiresAny?: string[];
  /** default likelihood (1–5) for the risk derived from a gap */
  riskLikelihood?: number;
  /** default impact (1–5) for the risk derived from a gap */
  riskImpact?: number;
}

/**
 * One regulatory requirement / control the AI must assess.
 * `categoryId`, `weight`, `mandatory` and `owner` power the universal
 * scoring, quality and recommendation engines without standard-specific code.
 */
export interface ProfileRequirement {
  id: string;
  article: string;
  name: Tri;
  /** concrete acceptance criteria the AI uses as the yardstick */
  criteria?: Tri[];
  /** category this control belongs to (falls back to "general") */
  categoryId?: string;
  /** scoring weight (default 1) */
  weight?: number;
  /** mandatory controls must be present or QA flags a critical issue */
  mandatory?: boolean;
  /** default remediation owner used by the recommendation engine */
  owner?: Tri;
  /** deterministic evaluation rule (Layer 1 — source of truth) */
  rule?: RequirementRule;
}

/** Optional maturity model configuration (per standard). */
export interface MaturityConfig {
  enabled: boolean;
  /** target maturity level 0–5 (default 4) */
  target?: number;
}

export interface StandardProfile {
  id: string;
  /** short label e.g. "NIS2" */
  name: string;
  /** lucide icon name, resolved in the page */
  icon: string;
  fullName: Tri;
  regulation: Tri;
  description: Tri;
  /** false → shown but not yet implemented */
  available: boolean;
  intake: IntakeStep[];
  requirements: ProfileRequirement[];
  /** control categories (optional; engine falls back to "general") */
  categories?: Category[];
  /** optional maturity assessment configuration */
  maturity?: MaturityConfig;
  /** impact / likelihood scale max (default 5) */
  scaleMax?: number;
  /** pre-filled intake answers for demo mode (test data) */
  demoAnswers?: IntakeAnswers;
}

// ── Runtime result types (what the AI returns, normalised) ──────

export type ReqStatus = 'pass' | 'partial' | 'fail';

export interface AssessedRequirement {
  id: string;
  article: string;
  name: string;
  status: ReqStatus;
  evidence: string;
  gap: string;
  rationale: string;
  measure: string;
  priority: 'high' | 'medium' | 'low' | '';
}

export interface AssessedRisk {
  id: string;
  name: string;
  component: string;
  category: string;
  likelihood: number;
  impact: number;
  evidence: string;
  rationale: string;
}

export interface AssessmentResult {
  requirements: AssessedRequirement[];
  risks: AssessedRisk[];
  summary: string;
}

// ── Computed engine output (deterministic, never from the AI) ───

export type ReadinessLevel = 'initial' | 'developing' | 'managed' | 'audit-ready';

export interface CategoryScore {
  id: string;
  name: string;
  pct: number;
  pass: number;
  partial: number;
  fail: number;
  total: number;
}

export interface ScoreResult {
  /** simple average of control scores (pass=100/partial=50/fail=0) */
  overall: number;
  /** weighted by control + category weight */
  weighted: number;
  readiness: ReadinessLevel;
  counts: { pass: number; partial: number; fail: number; total: number };
  categories: CategoryScore[];
}

export type RiskRating = 'low' | 'medium' | 'high' | 'critical';

export interface EnrichedRisk extends AssessedRisk {
  score: number;
  rating: RiskRating;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Effort = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  title: string;
  priority: Priority;
  effort: Effort;
  businessImpact: string;
  duration: string;
  owner: string;
  relatedControl: string;
  relatedControlName: string;
}

export type RoadmapPhase = '0-3' | '3-6' | '6-12';

export interface RoadmapBucket {
  phase: RoadmapPhase;
  items: Recommendation[];
}

export type EvidenceType =
  | 'statement' | 'screenshot' | 'document' | 'policy'
  | 'procedure' | 'log' | 'audit_report';

export type EvidenceStrength = 'low' | 'medium' | 'high' | 'very_high';

export interface EvidenceItem {
  controlId: string;
  controlName: string;
  type: EvidenceType;
  strength: EvidenceStrength;
  summary: string;
}

export interface EvidenceSummary {
  items: EvidenceItem[];
  /** control ids with no evidence */
  missing: string[];
  byStrength: Record<EvidenceStrength, number>;
}

export type QualitySeverity = 'critical' | 'warning';

export interface QualityIssue {
  id: string;
  severity: QualitySeverity;
  message: string;
  ref?: string;
}

export interface QualityResult {
  issues: QualityIssue[];
  /** true if any critical issue blocks report generation */
  blocking: boolean;
  passedChecks: number;
  totalChecks: number;
}

export type MaturityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface MaturityResult {
  enabled: boolean;
  current: MaturityLevel;
  target: MaturityLevel;
  gap: number;
  label: string;
}

export interface ComputedAssessment {
  score: ScoreResult;
  risks: EnrichedRisk[];
  recommendations: Recommendation[];
  roadmap: RoadmapBucket[];
  quality: QualityResult;
  evidence: EvidenceSummary;
  maturity: MaturityResult | null;
}

// ── Layer 2/3: AI Insight Engine output (explanatory, never scoring) ──

/**
 * Confidence level attached to an AI-generated interpretation.
 * - high   : assessment data strongly supports the insight
 * - medium : reasonable inference based on available evidence
 * - low    : hypothesis requiring further validation
 * Never applied to deterministic findings (those are facts, not inferences).
 */
export type Confidence = 'high' | 'medium' | 'low';

export interface RootCause {
  symptom: string;
  cause: string;
  /** AI confidence that this inferred cause is correct */
  confidence?: Confidence;
  /** concrete activities an internal auditor should run to validate the cause */
  validationActivities?: string[];
}

/**
 * An explicit AI assumption that is NOT directly evidenced by the assessment
 * data and therefore requires validation before being treated as fact.
 * Used whenever confidence is Medium/Low or the inference is speculative.
 * This is distinct from a RECOMMENDATION (advisory) and an INSIGHT
 * (supported interpretation).
 */
export interface Hypothesis {
  statement: string;
  confidence: Confidence;
  /** activities recommended to confirm or refute the hypothesis */
  validationActivities: string[];
  /** related control ids this hypothesis concerns (optional) */
  relatedControlIds?: string[];
}

export interface GapCluster {
  title: string;
  summary: string;
  controlIds: string[];
  /** business consequence of this cluster (advisory) */
  businessImpact?: string;
  /** regulatory consequence of this cluster (advisory) */
  regulatoryImpact?: string;
}

/** Executive-language overview of the most decision-relevant points. */
export interface ExecutiveInsights {
  topWeaknesses: string[];
  topStrengths: string[];
  highestBusinessRisks: string[];
  /** issues that touch multiple regulatory requirements */
  multiRegulatoryIssues: string[];
  /** what management should focus on first */
  managementFocus: string[];
}

/** A management-level theme grouping (e.g. Governance, IAM). */
export interface ManagementTheme {
  title: string;
  currentState: string;
  riskExposure: string;
  improvementOpportunity: string;
  /** AI confidence in this management-level interpretation */
  confidence?: Confidence;
}

export type ProgramRating = 'low' | 'medium' | 'high';

/** A higher-level transformation program replacing long rec lists. */
export interface TransformationProgram {
  title: string;
  objectives: string;
  expectedBenefits: string;
  relatedControlIds: string[];
  relatedRisks: string;
  complexity: ProgramRating;
  businessValue: ProgramRating;
  /** AI confidence in this advisory program */
  confidence?: Confidence;
}

/**
 * A recurring, cross-finding pattern pointing to a systemic governance or
 * capability weakness (e.g. Identity Governance, Third-Party Governance).
 * Advisory interpretation — never a deterministic finding.
 */
export interface SystemicWeakness {
  /** capability/governance area, e.g. "Third-Party Governance" */
  area: string;
  /** the recurring pattern observed across multiple findings */
  pattern: string;
  /** related control ids that exhibit the pattern */
  relatedControlIds: string[];
  confidence?: Confidence;
  /** activities recommended to validate this potential systemic weakness */
  validationActivities?: string[];
}

/**
 * Per-category confidence overview used to build the Management Confidence
 * Summary. Deterministic categories (findings, risks) are always treated as
 * High by the report layer and are not part of this AI-provided object.
 */
export interface ConfidenceSummary {
  executiveInsights: Confidence;
  rootCauses: Confidence;
  managementThemes: Confidence;
  crossControlInsights: Confidence;
  transformationPrograms: Confidence;
  systemicWeaknesses: Confidence;
}

export type ManagementPhase = '0-3' | '3-6' | '6-12' | '12+';

/** A management-decision roadmap phase with rationale. */
export interface ManagementRoadmapItem {
  phase: ManagementPhase;
  activities: string[];
  rationale: string;
}

/** Translation of a weakness into a business consequence. */
export interface BusinessImpactItem {
  area: string;
  consequence: string;
}

export interface InsightResult {
  /** Layer 3 — management situation narrative */
  executiveNarrative: string;
  /** Layer 3 — executive-language key points (strengths/weaknesses/focus) */
  executiveInsights: ExecutiveInsights;
  /** Layer 2 — symptom → suspected root cause */
  rootCauses: RootCause[];
  /** Layer 2 — findings grouped into a few core themes */
  gapClusters: GapCluster[];
  /** Layer 2 — relationships between deficits */
  crossControlInsights: string[];
  /** Layer 2/3 — management themes (current state / exposure / opportunity) */
  managementThemes: ManagementTheme[];
  /** Layer 3 — higher-level transformation programs */
  transformationPrograms: TransformationProgram[];
  /** Layer 3 — management roadmap phases */
  managementRoadmap: ManagementRoadmapItem[];
  /** Layer 3 — narrative analysis of maturity (if maturity enabled) */
  maturityNarrative: string;
  /** Layer 3 — technical weaknesses translated to business impact */
  businessImpact: BusinessImpactItem[];
  /** Layer 3 — rationale for the deterministic roadmap phases */
  roadmapRationale: string;
  /** Layer 2 — "virtual auditor" deepening questions */
  auditorQuestions: string[];
  /** Layer 2 — recurring cross-finding systemic weaknesses */
  systemicWeaknesses: SystemicWeakness[];
  /** Layer 2 — explicit AI assumptions requiring validation (HYPOTHESIS) */
  hypotheses: Hypothesis[];
  /** Per-category confidence ratings for AI interpretations */
  confidence: ConfidenceSummary;
}

// ── Intake answer bag ───────────────────────────────────────────
export type IntakeAnswers = Record<string, string | string[]>;

export function tr(x: Tri | undefined, lang: Lang): string {
  if (!x) return '';
  return x[lang] ?? x.en ?? x.de;
}
