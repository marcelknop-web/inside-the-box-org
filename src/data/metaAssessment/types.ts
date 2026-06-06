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

/** One regulatory requirement / control the AI must assess. */
export interface ProfileRequirement {
  id: string;
  article: string;
  name: Tri;
  /** concrete acceptance criteria the AI uses as the yardstick */
  criteria?: Tri[];
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
  /** impact / likelihood scale max (default 5) */
  scaleMax?: number;
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

// ── Intake answer bag ───────────────────────────────────────────
export type IntakeAnswers = Record<string, string | string[]>;

export function tr(x: Tri | undefined, lang: Lang): string {
  if (!x) return '';
  return x[lang] ?? x.en ?? x.de;
}
