/**
 * EU AI Act Quality Check — Automated audit validation.
 * Based on Regulation (EU) 2024/1689.
 * RULE: No content is invented. All checks validate existing data consistency.
 */
import type { AiActRisk, AiActReq, AiActIntakeData, AiRiskClass } from '@/data/aiActData';
import { riskId, classifyAiSystem } from '@/data/aiActData';

function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  const baseRisk = riskRef.split(' Abs.')[0].trim();
  const baseReq = reqArticle.split(' Abs.')[0].trim();
  return baseRisk === baseReq;
}

export interface QaCheck {
  id: string;
  category: 'consistency' | 'technical' | 'evidence' | 'editorial' | 'regulatory';
  label: string;
  detail: string;
  passed: boolean;
  severity: 'critical' | 'major' | 'minor';
}

export interface QaResult {
  checks: QaCheck[];
  passed: number;
  failed: number;
  total: number;
  criticalErrors: number;
  verdict: 'passed' | 'conditional' | 'failed';
  verdictLabel: string;
  classification: AiRiskClass;
  corrections: string[];
  optional: string[];
}

export function runAiActQualityCheck(
  risks: AiActRisk[],
  reqs: AiActReq[],
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: AiActIntakeData,
): QaResult {
  const checks: QaCheck[] = [];
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;
  const classification: AiRiskClass = intakeData ? classifyAiSystem(intakeData) : 'minimal';

  // ═══ A. CONSISTENCY ═══
  checks.push({
    id: 'A1-1', category: 'consistency',
    label: t('Risiko-Anzahl konsistent', 'Risk count consistent', 'Nombre de risques cohérent'),
    detail: `${risks.length}`,
    passed: risks.length > 0, severity: 'critical',
  });

  const passReqs = reqs.filter(r => r.status === 'pass').length;
  const partialReqs = reqs.filter(r => r.status === 'partial').length;
  const failReqs = reqs.filter(r => r.status === 'fail').length;
  checks.push({
    id: 'A1-2', category: 'consistency',
    label: t('Statusverteilung = Gesamtanzahl', 'Status distribution = total', 'Distribution = total'),
    detail: `${passReqs}+${partialReqs}+${failReqs} = ${passReqs+partialReqs+failReqs} vs. ${reqs.length}`,
    passed: passReqs + partialReqs + failReqs === reqs.length, severity: 'critical',
  });

  const REGULATORY_ONLY = new Set(['A50-1', 'A50-2', 'A26-1']);
  const nonPassWithoutRisks = reqs.filter(r =>
    r.status !== 'pass' && !REGULATORY_ONLY.has(r.id) && !risks.some(ri => refsMatch(ri.aiActRef, r.article))
  );
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Bidirektionale Traceability', 'Bidirectional traceability', 'Traçabilité bidirectionnelle'),
    detail: nonPassWithoutRisks.length > 0
      ? `${t('Ohne Risiko-Verknüpfung','Missing risk links','Liens manquants')}: ${nonPassWithoutRisks.map(r => r.id).join(', ')}`
      : t('Alle verknüpft', 'All linked', 'Toutes liées'),
    passed: nonPassWithoutRisks.length === 0, severity: 'critical',
  });

  const passReqsWithCritRisks = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return risks.some(ri => refsMatch(ri.aiActRef, r.article) && ri.likelihood * ri.impact >= 13);
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Risiken (Score >= 13)', 'No "compliant" with violating risks', 'Pas de "conforme" avec risques >= 13'),
    detail: passReqsWithCritRisks.length > 0 ? passReqsWithCritRisks.map(r => r.id).join(', ') : t('Konsistent','Consistent','Cohérent'),
    passed: passReqsWithCritRisks.length === 0, severity: 'critical',
  });

  // ═══ B. TECHNICAL ═══
  // B1: Hochrisiko (highRisk) ohne Art. 9 (RMS) → muss fail/partial sein
  if (classification === 'highRisk' || classification === 'gpaiSystemic') {
    const a09 = reqs.find(r => r.id === 'A09-1');
    checks.push({
      id: 'B1', category: 'technical',
      label: t('Hochrisiko ohne RMS (Art. 9) korrekt bewertet', 'High-risk without RMS (Art. 9) correctly rated', 'Haut risque sans SGR'),
      detail: !a09 ? 'Art. 9 fehlt' : a09.status === 'pass' ? `A09-1 als "${a09.status}"` : t('Korrekt','Correct','Correct'),
      passed: !!a09 && a09.status !== 'pass', severity: 'critical',
    });
  }

  // B2: Bias-Risiko vorhanden → Art. 10 nicht "pass"
  const hasBiasRisk = risks.some(r => r.category === 'B' && r.likelihood * r.impact >= 13);
  const a10 = reqs.find(r => r.id === 'A10-1');
  checks.push({
    id: 'B2', category: 'technical',
    label: t('Bias-Risiko → Art. 10 nicht "konform"', 'Bias risk → Art. 10 not "pass"', 'Risque de biais → Art. 10 pas "conforme"'),
    detail: hasBiasRisk && a10?.status === 'pass' ? `A10-1 als "${a10.status}"` : t('Korrekt','Correct','Correct'),
    passed: !(hasBiasRisk && a10?.status === 'pass'), severity: 'critical',
  });

  // B3: Prompt-Injection / Adversarial → Art. 15 Abs. 5 muss fail/partial sein
  const hasSecRisk = risks.some(r => r.category === 'S' && r.likelihood * r.impact >= 13);
  const a155 = reqs.find(r => r.id === 'A15-5');
  checks.push({
    id: 'B3', category: 'technical',
    label: t('Sicherheitsrisiko → Art. 15(5) korrekt bewertet', 'Security risk → Art. 15(5) correctly rated', 'Risque sécurité → Art. 15(5)'),
    detail: hasSecRisk && a155?.status === 'pass' ? `A15-5 als "${a155.status}"` : t('Korrekt','Correct','Correct'),
    passed: !(hasSecRisk && a155?.status === 'pass'), severity: 'critical',
  });

  const nonPassWithoutEffort = reqs.filter(r => r.status !== 'pass' && !r.effort?.trim());
  checks.push({
    id: 'B4', category: 'technical',
    label: t('Aufwandsschätzungen vorhanden', 'Effort estimates present', 'Estimations présentes'),
    detail: nonPassWithoutEffort.length > 0 ? nonPassWithoutEffort.map(r => r.id).join(', ') : t('Alle','All','Toutes'),
    passed: nonPassWithoutEffort.length === 0, severity: 'major',
  });

  const nonPassWithoutPriority = reqs.filter(r => r.status !== 'pass' && !r.priority?.trim());
  checks.push({
    id: 'B5', category: 'technical',
    label: t('Prioritäten vorhanden', 'Priorities present', 'Priorités présentes'),
    detail: nonPassWithoutPriority.length > 0 ? nonPassWithoutPriority.map(r => r.id).join(', ') : t('Alle','All','Toutes'),
    passed: nonPassWithoutPriority.length === 0, severity: 'major',
  });

  // ═══ C. EVIDENCE ═══
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  const weakEv = critRisks.filter(r => r.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken mit ausreichender Evidenz', 'Critical risks with sufficient evidence', 'Risques critiques avec preuve suffisante'),
    detail: weakEv.length > 0 ? weakEv.map(r => `${riskId(r)} (${r.evidenceQuality}/5)`).join(', ') : t('OK','OK','OK'),
    passed: weakEv.length === 0, severity: 'major',
  });

  const noEv = risks.filter(r => !r.evidence?.trim());
  checks.push({
    id: 'C2', category: 'evidence',
    label: t('Kein Befund ohne Evidenz', 'No finding without evidence', 'Pas de constat sans preuve'),
    detail: noEv.length > 0 ? noEv.map(riskId).join(', ') : t('OK','OK','OK'),
    passed: noEv.length === 0, severity: 'critical',
  });

  // ═══ D. EDITORIAL ═══
  const ids = reqs.map(r => r.id);
  const dup = new Set(ids).size < ids.length;
  checks.push({
    id: 'D1', category: 'editorial',
    label: t('Eindeutige Anforderungs-IDs', 'Unique requirement IDs', 'IDs uniques'),
    detail: dup ? t('Doppelte','Duplicate','Dupliqués') : t('OK','OK','OK'),
    passed: !dup, severity: 'major',
  });

  // ═══ E. REGULATORY (AI-Act-spezifisch) ═══
  // E1: Verbotene Praxis erkannt → automatisch failed
  if (classification === 'prohibited') {
    checks.push({
      id: 'E1', category: 'regulatory',
      label: t('Verbotene Praxis erkannt (Art. 5)', 'Prohibited practice detected (Art. 5)', 'Pratique interdite détectée'),
      detail: t('Verstoß gegen Art. 5 — Inverkehrbringen untersagt', 'Violation of Art. 5 — placing on market prohibited', 'Violation Art. 5'),
      passed: false, severity: 'critical',
    });
  }

  // E2: GPAI mit systemischem Risiko → Art. 53 + 55 müssen geprüft sein
  if (classification === 'gpaiSystemic') {
    const a53 = reqs.find(r => r.id === 'A53-1');
    checks.push({
      id: 'E2', category: 'regulatory',
      label: t('Systemisches GPAI: Art. 53 geprüft', 'Systemic GPAI: Art. 53 assessed', 'GPAI systémique: Art. 53'),
      detail: a53 ? t('Geprüft','Assessed','Évalué') : t('Art. 53 fehlt','Art. 53 missing','Art. 53 manquant'),
      passed: !!a53, severity: 'critical',
    });
  }

  // E3: Hochrisiko → Art. 14 (Human Oversight) muss bewertet sein
  if (classification === 'highRisk') {
    const a14 = reqs.find(r => r.id === 'A14-1');
    checks.push({
      id: 'E3', category: 'regulatory',
      label: t('Hochrisiko: Art. 14 (Aufsicht) bewertet', 'High-risk: Art. 14 (oversight) assessed', 'Haut risque: Art. 14 évalué'),
      detail: a14 ? t('Geprüft','Assessed','Évalué') : t('Art. 14 fehlt','Art. 14 missing','Art. 14 manquant'),
      passed: !!a14, severity: 'critical',
    });
  }

  // ═══ VERDICT ═══
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const total = checks.length;

  const verdict: QaResult['verdict'] = criticalErrors > 0 ? 'failed' : failed > 0 ? 'conditional' : 'passed';
  const verdictLabel = verdict === 'passed'
    ? t('QUALITY GATE: BESTANDEN', 'QUALITY GATE: PASSED', 'QUALITY GATE: RÉUSSI')
    : verdict === 'conditional'
    ? t(`QUALITY GATE: BEDINGT (${passed}/${total})`, `QUALITY GATE: CONDITIONAL (${passed}/${total})`, `QUALITY GATE: CONDITIONNEL`)
    : t(`QUALITY GATE: NICHT BESTANDEN (${passed}/${total})`, `QUALITY GATE: FAILED (${passed}/${total})`, `QUALITY GATE: ÉCHOUÉ`);

  const corrections = checks.filter(c => !c.passed && (c.severity === 'critical' || c.severity === 'major')).map(c => `${c.id}: ${c.label} — ${c.detail}`);
  const optional = checks.filter(c => !c.passed && c.severity === 'minor').map(c => `${c.id}: ${c.label}`);

  return { checks, passed, failed, total, criticalErrors, verdict, verdictLabel, classification, corrections, optional };
}
