// ── Report metadata, engine versions & consistency validation ───
//
// Phase 1 — "Single source of truth" support. These helpers guarantee
// that the UI, the PDF report and the JSON export describe the same
// assessment with the same metadata, and that a report can never be
// generated from internally inconsistent data.

import type { AssessmentResult, ComputedAssessment } from './types';

/** Standardized product / report title used across UI, PDF and JSON. */
export const REPORT_TITLE = 'Internal Audit & Compliance Readiness Assessment';

/** Versions surfaced in report metadata for traceability / auditability. */
export const ASSESSMENT_ENGINE_VERSION = '1.0.0';
export const AI_INSIGHT_ENGINE_VERSION = '1.0.0';
export const REPORT_VERSION = '1.0.0';

/** Canonical data-origin labels (data lineage transparency). */
export const ORIGIN = {
  assessment: 'Source: Deterministic Assessment Engine',
  risk: 'Source: Deterministic Risk Engine',
  insight: 'Source: AI Insight Engine',
  advisory: 'Source: AI Advisory Engine',
} as const;

/**
 * Canonical metadata object for one assessment run. Generated once when the
 * report is shown and then reused by every output so the Assessment ID,
 * version and timestamp can never diverge between UI / PDF / JSON.
 */
export interface ReportMeta {
  title: string;
  assessmentId: string;
  reportVersion: string;
  assessmentEngineVersion: string;
  aiInsightEngineVersion: string;
  generatedAt: string;
}

export function buildReportMeta(profileId: string): ReportMeta {
  return {
    title: REPORT_TITLE,
    assessmentId: `${profileId.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`,
    reportVersion: REPORT_VERSION,
    assessmentEngineVersion: ASSESSMENT_ENGINE_VERSION,
    aiInsightEngineVersion: AI_INSIGHT_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
  };
}

// ── Consistency validation (pre-PDF gate) ───────────────────────

export interface ConsistencyResult {
  ok: boolean;
  errors: string[];
}

/**
 * Verifies that the deterministic `computed` model is internally consistent
 * with the raw `result` it was derived from. This is the guard that blocks
 * report generation when scores, counts or risks would otherwise diverge
 * between the on-screen view, the PDF and the JSON export.
 */
export function validateConsistency(
  result: AssessmentResult,
  computed: ComputedAssessment,
): ConsistencyResult {
  const errors: string[] = [];

  const pass = result.requirements.filter((r) => r.status === 'pass').length;
  const partial = result.requirements.filter((r) => r.status === 'partial').length;
  const fail = result.requirements.filter((r) => r.status === 'fail').length;
  const total = result.requirements.length;
  const c = computed.score.counts;

  if (pass !== c.pass) errors.push(`Passed count mismatch (result ${pass} vs computed ${c.pass}).`);
  if (partial !== c.partial) errors.push(`Partial count mismatch (result ${partial} vs computed ${c.partial}).`);
  if (fail !== c.fail) errors.push(`Gap count mismatch (result ${fail} vs computed ${c.fail}).`);
  if (total !== c.total) errors.push(`Requirements assessed mismatch (result ${total} vs computed ${c.total}).`);
  if (pass + partial + fail !== total) errors.push('Status counts do not sum to total requirements.');

  if (result.risks.length !== computed.risks.length) {
    errors.push(`Risk count mismatch (result ${result.risks.length} vs computed ${computed.risks.length}).`);
  }

  const w = computed.score.weighted;
  if (!Number.isFinite(w) || w < 0 || w > 100) {
    errors.push(`Readiness score out of range (${w}).`);
  }

  return { ok: errors.length === 0, errors };
}
