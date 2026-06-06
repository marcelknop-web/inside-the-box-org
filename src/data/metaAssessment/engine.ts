// ── Universal assessment engine (deterministic) ─────────────────
//
// All scoring, risk, recommendation, quality, evidence and maturity
// math lives here and is standard-agnostic. The AI never computes any
// of this — it only supplies explanatory narratives. Adding a standard
// requires NO changes to this file.

import type {
  Lang, Tri, StandardProfile, ProfileRequirement, AssessmentResult,
  AssessedRequirement, AssessedRisk, ScoreResult, CategoryScore, ReadinessLevel,
  EnrichedRisk, RiskRating, Recommendation, Priority, Effort, RoadmapBucket,
  RoadmapPhase, QualityResult, QualityIssue, EvidenceSummary, EvidenceItem,
  EvidenceType, EvidenceStrength, MaturityResult, MaturityLevel, ComputedAssessment,
  IntakeAnswers,
} from './types';
import { tr } from './types';

// ── tiny i18n helper local to the engine ────────────────────────
type L = Record<Lang, string>;
const t = (x: L, lang: Lang) => x[lang] ?? x.en;

const STATUS_SCORE: Record<string, number> = { pass: 100, partial: 50, fail: 0 };

// ════════════════════════════════════════════════════════════════
// LAYER 1 — DETERMINISTIC FINDINGS ENGINE  (Source of Truth)
// ════════════════════════════════════════════════════════════════
//
// Findings are derived purely from the intake answers via each
// requirement's `rule`. The AI is NEVER involved here, so identical
// answers always yield an identical, audit-defensible result.

/** Build a lookup of intake option labels: "fieldId:optionId" → label. */
function buildOptionLabels(profile: StandardProfile, lang: Lang): Map<string, string> {
  const map = new Map<string, string>();
  for (const step of profile.intake) {
    for (const f of step.fields) {
      for (const o of f.options ?? []) {
        map.set(`${f.id}:${o.id}`, tr(o.label, lang));
      }
    }
  }
  return map;
}

/** Is a rule token ("fieldId:optionId" or "fieldId") satisfied by the answers? */
function tokenSatisfied(token: string, answers: IntakeAnswers): boolean {
  const [fieldId, optionId] = token.split(':');
  const v = answers[fieldId];
  if (v === undefined || v === null) return false;
  if (optionId) {
    return Array.isArray(v) ? v.includes(optionId) : v === optionId;
  }
  return Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0;
}

export function deriveFindings(
  profile: StandardProfile,
  answers: IntakeAnswers,
  lang: Lang,
): AssessedRequirement[] {
  const labels = buildOptionLabels(profile, lang);
  const label = (token: string) => labels.get(token) ?? token.split(':')[1] ?? token;

  const NONE = t({ de: 'Kein Nachweis in den Intake-Daten angegeben.', en: 'No evidence provided in the intake data.', fr: "Aucune preuve fournie dans les données d'intake." }, lang);
  const evidenceLead = t({ de: 'Nachgewiesen', en: 'Evidenced', fr: 'Justifié' }, lang);
  const gapLead = t({ de: 'Nicht nachgewiesen', en: 'Not evidenced', fr: 'Non justifié' }, lang);
  const measureLead = t({ de: 'Umsetzen / nachweisen', en: 'Implement / evidence', fr: 'Mettre en œuvre / justifier' }, lang);

  return profile.requirements.map((r) => {
    const rule = r.rule;
    const reqName = tr(r.name, lang);
    if (!rule) {
      // No rule → conservatively report as a gap (no evidence to confirm).
      return mkFinding(r.id, 'fail', NONE, `${gapLead}: ${reqName}`, `${measureLead}: ${reqName}`, 'high');
    }

    const all = rule.requiresAll ?? [];
    const any = rule.requiresAny ?? [];
    const allHit = all.filter((tk) => tokenSatisfied(tk, answers));
    const anyHit = any.filter((tk) => tokenSatisfied(tk, answers));
    const allMiss = all.filter((tk) => !tokenSatisfied(tk, answers));

    let status: AssessedRequirement['status'];
    if (all.length > 0 && allHit.length === all.length) status = 'pass';
    else if (allHit.length > 0 || anyHit.length > 0) status = 'partial';
    else status = 'fail';

    const hitTokens = [...allHit, ...anyHit];
    const evidence = hitTokens.length
      ? `${evidenceLead}: ${hitTokens.map(label).join(', ')}.`
      : NONE;
    const gap = allMiss.length
      ? `${gapLead}: ${allMiss.map(label).join(', ')}.`
      : '';
    const measure = status === 'pass'
      ? ''
      : `${measureLead}: ${(allMiss.length ? allMiss.map(label) : [reqName]).join(', ')}.`;
    const priority: AssessedRequirement['priority'] =
      status === 'fail' ? 'high' : status === 'partial' ? 'medium' : 'low';

    return mkFinding(r.id, status, evidence, gap, measure, priority);
  });
}

function mkFinding(
  id: string, status: AssessedRequirement['status'],
  evidence: string, gap: string, measure: string,
  priority: AssessedRequirement['priority'],
): AssessedRequirement {
  return { id, article: '', name: '', status, evidence, gap, rationale: '', measure, priority };
}

/** Deterministically derive risks from gap/partial findings. */
export function deriveRisks(
  profile: StandardProfile,
  findings: AssessedRequirement[],
  lang: Lang,
): AssessedRisk[] {
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const catName = new Map((profile.categories ?? []).map((c) => [c.id, tr(c.name, lang)]));
  const lead = t({ de: 'Defizit bei', en: 'Deficiency in', fr: 'Déficience dans' }, lang);

  const risks: AssessedRisk[] = [];
  let n = 1;
  for (const f of findings) {
    if (f.status === 'pass') continue;
    const meta = metaById.get(f.id);
    const rule = meta?.rule;
    // partial findings are less likely to materialise than full gaps
    const baseL = rule?.riskLikelihood ?? (f.status === 'fail' ? 4 : 3);
    const baseI = rule?.riskImpact ?? 3;
    const likelihood = Math.min(5, Math.max(1, f.status === 'partial' ? baseL - 1 : baseL));
    const impact = Math.min(5, Math.max(1, baseI));
    const catId = meta?.categoryId ?? 'general';
    risks.push({
      id: `R${n++}`,
      name: `${lead}: ${meta ? tr(meta.name, lang) : f.id}`,
      component: meta?.article ?? '',
      category: catName.get(catId) ?? catId,
      likelihood,
      impact,
      evidence: f.gap || f.evidence,
      rationale: '',
    });
  }
  return risks;
}



// ════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ════════════════════════════════════════════════════════════════
export function computeScore(
  profile: StandardProfile,
  findings: AssessedRequirement[],
  lang: Lang,
): ScoreResult {
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const catName = new Map((profile.categories ?? []).map((c) => [c.id, t(c.name as L, lang)]));

  const counts = { pass: 0, partial: 0, fail: 0, total: findings.length };
  let wSum = 0, wScore = 0, simpleSum = 0;
  const catAgg = new Map<string, CategoryScore>();

  for (const f of findings) {
    counts[f.status]++;
    const meta = metaById.get(f.id);
    const w = meta?.weight ?? 1;
    const score = STATUS_SCORE[f.status] ?? 0;
    simpleSum += score;
    wSum += w;
    wScore += score * w;

    const catId = meta?.categoryId ?? 'general';
    const cur = catAgg.get(catId) ?? {
      id: catId,
      name: catName.get(catId) ?? (catId === 'general' ? t({ de: 'Allgemein', en: 'General', fr: 'Général' }, lang) : catId),
      pct: 0, pass: 0, partial: 0, fail: 0, total: 0,
    };
    cur[f.status]++;
    cur.total++;
    catAgg.set(catId, cur);
  }

  for (const c of catAgg.values()) {
    c.pct = c.total ? Math.round(((c.pass * 100 + c.partial * 50) / c.total)) : 0;
  }

  const overall = counts.total ? Math.round(simpleSum / counts.total) : 0;
  const weighted = wSum ? Math.round(wScore / wSum) : overall;

  return {
    overall,
    weighted,
    readiness: readinessOf(weighted),
    counts,
    categories: [...catAgg.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function readinessOf(pct: number): ReadinessLevel {
  if (pct >= 80) return 'audit-ready';
  if (pct >= 60) return 'managed';
  if (pct >= 35) return 'developing';
  return 'initial';
}

export const READINESS_LABEL: Record<ReadinessLevel, L> = {
  'audit-ready': { de: 'Auditbereit', en: 'Audit-ready', fr: 'Prêt pour audit' },
  managed: { de: 'Gesteuert', en: 'Managed', fr: 'Maîtrisé' },
  developing: { de: 'In Entwicklung', en: 'Developing', fr: 'En développement' },
  initial: { de: 'Initial', en: 'Initial', fr: 'Initial' },
};

export const readinessLabel = (r: ReadinessLevel, lang: Lang) => t(READINESS_LABEL[r], lang);

// ════════════════════════════════════════════════════════════════
// RISK ENGINE  (Risk = Likelihood × Impact, 1–5 scale)
// ════════════════════════════════════════════════════════════════
export function ratingOf(score: number): RiskRating {
  if (score >= 20) return 'critical';
  if (score >= 13) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

export function enrichRisks(result: AssessmentResult): EnrichedRisk[] {
  return [...result.risks]
    .map((r) => {
      const score = r.likelihood * r.impact;
      return { ...r, score, rating: ratingOf(score) };
    })
    .sort((a, b) => b.score - a.score);
}

export function riskCounts(risks: EnrichedRisk[]) {
  return {
    critical: risks.filter((r) => r.rating === 'critical').length,
    high: risks.filter((r) => r.rating === 'high').length,
    medium: risks.filter((r) => r.rating === 'medium').length,
    low: risks.filter((r) => r.rating === 'low').length,
  };
}

// ════════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ════════════════════════════════════════════════════════════════
const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const DURATION: Record<Priority, L> = {
  critical: { de: '0–1 Monat', en: '0–1 month', fr: '0–1 mois' },
  high: { de: '1–3 Monate', en: '1–3 months', fr: '1–3 mois' },
  medium: { de: '3–6 Monate', en: '3–6 months', fr: '3–6 mois' },
  low: { de: '6–12 Monate', en: '6–12 months', fr: '6–12 mois' },
};

const BUSINESS_IMPACT: Record<Priority, L> = {
  critical: { de: 'Direkte Regulierungs- und Betriebsrisiken', en: 'Direct regulatory & operational exposure', fr: 'Exposition réglementaire et opérationnelle directe' },
  high: { de: 'Erhebliche Compliance-Lücke', en: 'Material compliance gap', fr: 'Lacune de conformité importante' },
  medium: { de: 'Moderate Restrisiken', en: 'Moderate residual risk', fr: 'Risque résiduel modéré' },
  low: { de: 'Geringe Optimierung', en: 'Minor optimisation', fr: 'Optimisation mineure' },
};

const EFFORT_BY_PRIORITY: Record<Priority, Effort> = {
  critical: 'high', high: 'medium', medium: 'medium', low: 'low',
};

function priorityFor(f: AssessedRequirement): Priority {
  if (f.status === 'fail') return f.priority === 'high' ? 'critical' : 'high';
  if (f.status === 'partial') return f.priority === 'high' ? 'high' : 'medium';
  return 'low';
}

export function buildRecommendations(
  profile: StandardProfile,
  findings: AssessedRequirement[],
  lang: Lang,
): Recommendation[] {
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const defaultOwner = t({ de: 'CISO / IT-Sicherheit', en: 'CISO / IT Security', fr: 'RSSI / Sécurité' }, lang);

  const recs: Recommendation[] = [];
  let n = 1;
  for (const f of findings) {
    if (f.status === 'pass') continue;
    const meta = metaById.get(f.id);
    const priority = priorityFor(f);
    const measure = (f.measure || '').trim();
    recs.push({
      id: `REC-${String(n++).padStart(2, '0')}`,
      title: measure || (meta ? tr(meta.name, lang) : f.name),
      priority,
      effort: EFFORT_BY_PRIORITY[priority],
      businessImpact: t(BUSINESS_IMPACT[priority], lang),
      duration: t(DURATION[priority], lang),
      owner: meta?.owner ? tr(meta.owner, lang) : defaultOwner,
      relatedControl: f.id,
      relatedControlName: meta ? tr(meta.name, lang) : f.name,
    });
  }
  return recs.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export function buildRoadmap(recs: Recommendation[]): RoadmapBucket[] {
  const phaseOf = (p: Priority): RoadmapPhase =>
    p === 'critical' ? '0-3' : p === 'high' ? '0-3' : p === 'medium' ? '3-6' : '6-12';
  const buckets: Record<RoadmapPhase, Recommendation[]> = { '0-3': [], '3-6': [], '6-12': [] };
  for (const r of recs) buckets[phaseOf(r.priority)].push(r);
  return (['0-3', '3-6', '6-12'] as RoadmapPhase[]).map((phase) => ({ phase, items: buckets[phase] }));
}

// ════════════════════════════════════════════════════════════════
// EVIDENCE ENGINE  (display only — never affects scoring)
// ════════════════════════════════════════════════════════════════
function classifyEvidence(text: string): { type: EvidenceType; strength: EvidenceStrength } {
  const s = text.toLowerCase();
  let type: EvidenceType = 'statement';
  if (/audit|prüfbericht|rapport d'audit|certif|zertif/.test(s)) type = 'audit_report';
  else if (/policy|richtlinie|politique/.test(s)) type = 'policy';
  else if (/procedure|verfahren|prozess|procédure/.test(s)) type = 'procedure';
  else if (/log|protokoll|journal/.test(s)) type = 'log';
  else if (/screenshot|bildschirm/.test(s)) type = 'screenshot';
  else if (/document|dokument|nachweis|attestation/.test(s)) type = 'document';

  let strength: EvidenceStrength = 'low';
  const len = text.trim().length;
  if (type === 'audit_report') strength = 'very_high';
  else if (type === 'policy' || type === 'procedure' || type === 'document') strength = 'high';
  else if (len > 140) strength = 'medium';
  return { type, strength };
}

export function buildEvidence(
  profile: StandardProfile,
  findings: AssessedRequirement[],
  lang: Lang,
): EvidenceSummary {
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const items: EvidenceItem[] = [];
  const missing: string[] = [];
  const byStrength: Record<EvidenceStrength, number> = { low: 0, medium: 0, high: 0, very_high: 0 };

  for (const f of findings) {
    const text = (f.evidence || '').trim();
    const name = metaById.get(f.id) ? tr(metaById.get(f.id)!.name, lang) : f.name;
    if (!text) { missing.push(f.id); continue; }
    const { type, strength } = classifyEvidence(text);
    byStrength[strength]++;
    items.push({ controlId: f.id, controlName: name, type, strength, summary: text });
  }
  return { items, missing, byStrength };
}

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, L> = {
  statement: { de: 'Aussage', en: 'Statement', fr: 'Déclaration' },
  screenshot: { de: 'Screenshot', en: 'Screenshot', fr: 'Capture' },
  document: { de: 'Dokument', en: 'Document', fr: 'Document' },
  policy: { de: 'Richtlinie', en: 'Policy', fr: 'Politique' },
  procedure: { de: 'Verfahren', en: 'Procedure', fr: 'Procédure' },
  log: { de: 'Protokoll', en: 'Log file', fr: 'Journal' },
  audit_report: { de: 'Auditbericht', en: 'Audit report', fr: "Rapport d'audit" },
};

export const EVIDENCE_STRENGTH_LABEL: Record<EvidenceStrength, L> = {
  low: { de: 'Gering', en: 'Low', fr: 'Faible' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  very_high: { de: 'Sehr hoch', en: 'Very high', fr: 'Très élevé' },
};

// ════════════════════════════════════════════════════════════════
// QUALITY ASSURANCE ENGINE
// ════════════════════════════════════════════════════════════════
export function runQuality(
  profile: StandardProfile,
  findings: AssessedRequirement[],
  recs: Recommendation[],
  risks: EnrichedRisk[],
  lang: Lang,
): QualityResult {
  const issues: QualityIssue[] = [];
  const foundIds = new Set(findings.map((f) => f.id));
  let passedChecks = 0;
  const totalChecks = 7;

  // 1. Completeness — every requirement must be assessed
  const expected = profile.requirements.length;
  if (expected > 0 && findings.length < expected) {
    issues.push({ id: 'completeness', severity: 'critical',
      message: t({ de: `Unvollständig: ${findings.length}/${expected} Anforderungen bewertet.`, en: `Incomplete: ${findings.length}/${expected} requirements assessed.`, fr: `Incomplet : ${findings.length}/${expected} exigences évaluées.` }, lang) });
  } else passedChecks++;

  // 2. Mandatory controls present
  const missingMandatory = profile.requirements.filter((r) => r.mandatory && !foundIds.has(r.id));
  if (missingMandatory.length) {
    issues.push({ id: 'mandatory', severity: 'critical',
      message: t({ de: `Pflichtkontrollen fehlen: ${missingMandatory.map((r) => r.id).join(', ')}.`, en: `Mandatory controls missing: ${missingMandatory.map((r) => r.id).join(', ')}.`, fr: `Contrôles obligatoires manquants : ${missingMandatory.map((r) => r.id).join(', ')}.` }, lang) });
  } else passedChecks++;

  // 3. Pass without evidence
  const passNoEvidence = findings.filter((f) => f.status === 'pass' && !(f.evidence || '').trim());
  if (passNoEvidence.length) {
    issues.push({ id: 'pass-no-evidence', severity: 'warning',
      message: t({ de: `Konform ohne Nachweis: ${passNoEvidence.map((f) => f.id).join(', ')}.`, en: `Pass without evidence: ${passNoEvidence.map((f) => f.id).join(', ')}.`, fr: `Conforme sans preuve : ${passNoEvidence.map((f) => f.id).join(', ')}.` }, lang) });
  } else passedChecks++;

  // 4. Contradiction — pass but a gap is recorded
  const contradictions = findings.filter((f) => f.status === 'pass' && (f.gap || '').trim());
  if (contradictions.length) {
    issues.push({ id: 'contradiction', severity: 'warning',
      message: t({ de: `Widersprüchlich (Konform + Lücke): ${contradictions.map((f) => f.id).join(', ')}.`, en: `Contradictory (pass + gap): ${contradictions.map((f) => f.id).join(', ')}.`, fr: `Contradictoire (conforme + lacune) : ${contradictions.map((f) => f.id).join(', ')}.` }, lang) });
  } else passedChecks++;

  // 5. Risk without recommendation
  if (risks.length > 0 && recs.length === 0) {
    issues.push({ id: 'risk-no-rec', severity: 'warning',
      message: t({ de: 'Risiken erfasst, aber keine Empfehlungen abgeleitet.', en: 'Risks recorded but no recommendations derived.', fr: 'Risques enregistrés mais aucune recommandation.' }, lang) });
  } else passedChecks++;

  // 6. Recommendation without owner
  const noOwner = recs.filter((r) => !r.owner.trim());
  if (noOwner.length) {
    issues.push({ id: 'rec-no-owner', severity: 'warning',
      message: t({ de: `Empfehlungen ohne Verantwortliche: ${noOwner.map((r) => r.id).join(', ')}.`, en: `Recommendations without owner: ${noOwner.map((r) => r.id).join(', ')}.`, fr: `Recommandations sans responsable : ${noOwner.map((r) => r.id).join(', ')}.` }, lang) });
  } else passedChecks++;

  // 7. Traceability — every gap needs a remediation measure
  const noTrace = findings.filter((f) => f.status === 'fail' && !(f.measure || '').trim());
  if (noTrace.length) {
    issues.push({ id: 'traceability', severity: 'warning',
      message: t({ de: `Lücke ohne Maßnahme: ${noTrace.map((f) => f.id).join(', ')}.`, en: `Gap without measure: ${noTrace.map((f) => f.id).join(', ')}.`, fr: `Lacune sans mesure : ${noTrace.map((f) => f.id).join(', ')}.` }, lang) });
  } else passedChecks++;

  return { issues, blocking: issues.some((i) => i.severity === 'critical'), passedChecks, totalChecks };
}

// ════════════════════════════════════════════════════════════════
// MATURITY ENGINE  (optional, per standard)
// ════════════════════════════════════════════════════════════════
const MATURITY_LABEL: Record<MaturityLevel, L> = {
  0: { de: 'Nicht vorhanden', en: 'Nonexistent', fr: 'Inexistant' },
  1: { de: 'Ad hoc', en: 'Ad hoc', fr: 'Ad hoc' },
  2: { de: 'Wiederholbar', en: 'Repeatable', fr: 'Reproductible' },
  3: { de: 'Definiert', en: 'Defined', fr: 'Défini' },
  4: { de: 'Gemessen', en: 'Measured', fr: 'Mesuré' },
  5: { de: 'Optimiert', en: 'Optimized', fr: 'Optimisé' },
};

export const maturityLabel = (l: MaturityLevel, lang: Lang) => t(MATURITY_LABEL[l], lang);

function maturityFromPct(pct: number): MaturityLevel {
  if (pct >= 90) return 5;
  if (pct >= 75) return 4;
  if (pct >= 55) return 3;
  if (pct >= 35) return 2;
  if (pct >= 15) return 1;
  return 0;
}

export function computeMaturity(profile: StandardProfile, score: ScoreResult, lang: Lang): MaturityResult | null {
  if (!profile.maturity?.enabled) return null;
  const current = maturityFromPct(score.weighted);
  const target = (profile.maturity.target ?? 4) as MaturityLevel;
  return {
    enabled: true,
    current,
    target,
    gap: Math.max(0, target - current),
    label: t(MATURITY_LABEL[current], lang),
  };
}

// ════════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ════════════════════════════════════════════════════════════════
export function computeAssessment(
  profile: StandardProfile,
  result: AssessmentResult,
  findings: AssessedRequirement[],
  lang: Lang,
): ComputedAssessment {
  const score = computeScore(profile, findings, lang);
  const risks = enrichRisks(result);
  const recommendations = buildRecommendations(profile, findings, lang);
  const roadmap = buildRoadmap(recommendations);
  const quality = runQuality(profile, findings, recommendations, risks, lang);
  const evidence = buildEvidence(profile, findings, lang);
  const maturity = computeMaturity(profile, score, lang);
  return { score, risks, recommendations, roadmap, quality, evidence, maturity };
}
