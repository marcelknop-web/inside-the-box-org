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

export type IntakeFieldType = 'text' | 'textarea' | 'single' | 'multi';

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

// ── Intake answer bag ───────────────────────────────────────────
export type IntakeAnswers = Record<string, string | string[]>;

export function tr(x: Tri | undefined, lang: Lang): string {
  if (!x) return '';
  return x[lang] ?? x.en ?? x.de;
}
