/**
 * NIS-2 Report Quality Check — Automated Audit Validation
 * Based on NIS-2 Directive (EU) 2022/2555
 * RULE: No content is invented. All checks validate existing data consistency.
 */
import type { Nis2Risk, Nis2Req, Nis2IntakeData } from '@/data/nis2ComplianceData';
import { riskId } from '@/data/nis2ComplianceData';

function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  const baseRisk = riskRef.split(' Abs.')[0].split(' lit.')[0];
  const baseReq = reqArticle.split(' Abs.')[0].split(' lit.')[0];
  return baseRisk === baseReq;
}

export interface QaCheck {
  id: string;
  category: 'consistency' | 'technical' | 'evidence' | 'editorial' | 'regulatory' | 'golden-rule';
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
  corrections: string[];
  optional: string[];
}

export function runNis2QualityCheck(
  risks: Nis2Risk[],
  reqs: Nis2Req[],
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: Nis2IntakeData
): QaResult {
  const checks: QaCheck[] = [];
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;

  // ═══ A. KONSISTENZPRÜFUNG ═══
  checks.push({
    id: 'A1-1', category: 'consistency',
    label: t('Risiko-Anzahl konsistent', 'Risk count consistent', 'Nombre de risques cohérent'),
    detail: `${risks.length} ${t('Risiken identifiziert', 'risks identified', 'risques identifiés')}`,
    passed: risks.length > 0, severity: 'critical',
  });

  const passReqs = reqs.filter(r => r.status === 'pass').length;
  const partialReqs = reqs.filter(r => r.status === 'partial').length;
  const failReqs = reqs.filter(r => r.status === 'fail').length;
  const sumStatus = passReqs + partialReqs + failReqs;
  checks.push({
    id: 'A1-2', category: 'consistency',
    label: t('Statusverteilung = Gesamtanzahl Anforderungen', 'Status distribution = total requirements', 'Distribution des statuts = total'),
    detail: `${passReqs}+${partialReqs}+${failReqs} = ${sumStatus} vs. ${reqs.length}`,
    passed: sumStatus === reqs.length, severity: 'critical',
  });

  const nonPassReqsWithoutRisks = reqs.filter(r => r.status !== 'pass' && !risks.some(ri => refsMatch(ri.nis2Ref, r.article)));
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Bidirektionale Traceability', 'Bidirectional traceability', 'Traçabilité bidirectionnelle'),
    detail: nonPassReqsWithoutRisks.length > 0
      ? `${t('Ohne Risiko-Verknüpfung', 'Missing risk links', 'Liens manquants')}: ${nonPassReqsWithoutRisks.map(r => r.id).join(', ')}`
      : t('Alle verknüpft', 'All linked', 'Toutes liées'),
    passed: nonPassReqsWithoutRisks.length === 0, severity: 'critical',
  });

  const passReqsWithViolatingRisks = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return risks.some(ri => refsMatch(ri.nis2Ref, r.article) && ri.likelihood * ri.impact >= 13);
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Risiken (Score >= 13)', 'No "compliant" with violating risks', 'Pas de "conforme" avec risques >= 13'),
    detail: passReqsWithViolatingRisks.length > 0
      ? passReqsWithViolatingRisks.map(r => r.id).join(', ')
      : t('Konsistent', 'Consistent', 'Cohérent'),
    passed: passReqsWithViolatingRisks.length === 0, severity: 'critical',
  });

  const partialReqsWithCriticalRisks = reqs.filter(r => {
    if (r.status !== 'partial') return false;
    return risks.some(ri => refsMatch(ri.nis2Ref, r.article) && ri.likelihood * ri.impact >= 20);
  });
  checks.push({
    id: 'A3-1b', category: 'consistency',
    label: t('Kein "teilweise konform" bei kritischen Risiken (>= 20)', 'No "partial" with critical risks (>= 20)', 'Pas de "partiel" avec risques critiques'),
    detail: partialReqsWithCriticalRisks.length > 0
      ? partialReqsWithCriticalRisks.map(r => r.id).join(', ')
      : t('Konsistent', 'Consistent', 'Cohérent'),
    passed: partialReqsWithCriticalRisks.length === 0, severity: 'critical',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  const n218 = reqs.find(r => r.id === 'N21-8');
  const hasUnencryptedRisk = risks.some(ri =>
    ri.name.toLowerCase().includes('unverschlüssel') || ri.name.toLowerCase().includes('klartext') || ri.name.toLowerCase().includes('ohne tls')
  );
  checks.push({
    id: 'B1', category: 'technical',
    label: t('N21-8 Kryptografie korrekt bewertet', 'N21-8 Cryptography correctly rated', 'N21-8 correctement évalué'),
    detail: hasUnencryptedRisk && n218?.status !== 'fail'
      ? t(`Unverschlüsselte Kommunikation, aber N21-8 als "${n218?.status}"`, `Unencrypted comms but N21-8 "${n218?.status}"`, `Communication non chiffrée mais N21-8 "${n218?.status}"`)
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasUnencryptedRisk && n218 && n218.status !== 'fail'), severity: 'critical',
  });

  const n231 = reqs.find(r => r.id === 'N23-1');
  const hasIncidentRisk = risks.some(ri => ri.nis2Ref.includes('Art. 23'));
  checks.push({
    id: 'B3', category: 'technical',
    label: t('N23-1 Meldepflichten korrekt bewertet', 'N23-1 Reporting correctly rated', 'N23-1 correctement évalué'),
    detail: hasIncidentRisk && n231?.status === 'pass'
      ? t('Melderisiko vorhanden, aber N23-1 als "konform"', 'Reporting risk but N23-1 "compliant"', 'Risque de signalement mais N23-1 "conforme"')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasIncidentRisk && n231?.status === 'pass'), severity: 'critical',
  });

  const nonPassWithoutEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  checks.push({
    id: 'B4', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Aufwandsschätzung', 'All non-compliant requirements have effort estimates', 'Toutes avec effort'),
    detail: nonPassWithoutEffort.length > 0
      ? `${t('Ohne Aufwand', 'Missing effort', 'Effort manquant')}: ${nonPassWithoutEffort.map(r => r.id).join(', ')}`
      : t('Alle mit Aufwand', 'All have effort', 'Toutes avec effort'),
    passed: nonPassWithoutEffort.length === 0, severity: 'critical',
  });

  const nonPassWithoutPriority = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));
  checks.push({
    id: 'B5', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Priorität', 'All non-compliant with priority', 'Toutes avec priorité'),
    detail: nonPassWithoutPriority.length > 0
      ? `${t('Ohne Priorität', 'Missing priority', 'Priorité manquante')}: ${nonPassWithoutPriority.map(r => r.id).join(', ')}`
      : t('Alle priorisiert', 'All prioritised', 'Toutes priorisées'),
    passed: nonPassWithoutPriority.length === 0, severity: 'critical',
  });

  const nonPassWithoutGap = reqs.filter(r => r.status !== 'pass' && (!r.gap || r.gap.trim() === ''));
  checks.push({
    id: 'B6', category: 'technical',
    label: t('Alle nicht-konformen mit Gap-Beschreibung', 'All non-compliant with gap description', 'Toutes avec description de gap'),
    detail: nonPassWithoutGap.length > 0
      ? `${nonPassWithoutGap.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentées'),
    passed: nonPassWithoutGap.length === 0, severity: 'major',
  });

  const nonPassWithoutMeasure = reqs.filter(r => r.status !== 'pass' && (!r.measure || r.measure.trim() === ''));
  checks.push({
    id: 'B7', category: 'technical',
    label: t('Alle nicht-konformen mit Maßnahme', 'All non-compliant with measure', 'Toutes avec mesure'),
    detail: nonPassWithoutMeasure.length > 0
      ? `${nonPassWithoutMeasure.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentées'),
    passed: nonPassWithoutMeasure.length === 0, severity: 'major',
  });

  const risksWithoutQuantRationale = risks.filter(r => {
    const rat = r.rationale.toLowerCase();
    const hasQuantitative = /\d{2,}/.test(rat) || /%/.test(rat) || /\d+\s*[x×]\s*\d+/.test(rat) ||
      rat.includes('benchmark') || rat.includes('statistisch') || rat.includes('skala') ||
      rat.includes('wahrscheinlichkeit') || rat.includes('probability') || rat.includes('likelihood');
    return !hasQuantitative;
  });
  checks.push({
    id: 'B8', category: 'technical',
    label: t('Risikobewertungen quantitativ hergeleitet', 'Risk scores quantitatively substantiated', 'Scores quantitativement étayés'),
    detail: risksWithoutQuantRationale.length > 0
      ? `${risksWithoutQuantRationale.map(riskId).join(', ')} ${t('ohne quantitative Herleitung', 'without quantitative basis', 'sans base quantitative')}`
      : t('Alle quantitativ begründet', 'All quantitatively justified', 'Toutes justifiées'),
    passed: risksWithoutQuantRationale.length === 0, severity: 'major',
  });

  // ═══ C. EVIDENZPRÜFUNG ═══
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  const risksWithWeakEvidence = critRisks.filter(r => r.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken mit ausreichender Evidenz (4/5+)', 'Critical risks with sufficient evidence', 'Risques critiques avec preuve suffisante'),
    detail: risksWithWeakEvidence.length > 0
      ? risksWithWeakEvidence.map(r => `${riskId(r)} (${r.evidenceQuality}/5)`).join(', ')
      : t('Alle mit ausreichender Evidenz', 'All with sufficient evidence', 'Toutes avec preuve suffisante'),
    passed: risksWithWeakEvidence.length === 0, severity: 'major',
  });

  const risksWithoutEvidence = risks.filter(r => !r.evidence || r.evidence.trim() === '');
  checks.push({
    id: 'C3', category: 'evidence',
    label: t('Kein Befund ohne Evidenz-Referenz', 'No finding without evidence', 'Pas de constat sans preuve'),
    detail: risksWithoutEvidence.length > 0
      ? `${risksWithoutEvidence.map(riskId).join(', ')} ${t('ohne Evidenz', 'without evidence', 'sans preuve')}`
      : t('Alle mit Evidenz', 'All with evidence', 'Toutes avec preuve'),
    passed: risksWithoutEvidence.length === 0, severity: 'critical',
  });

  const risksWithoutRepro = risks.filter(r => !r.reproducibility || r.reproducibility.trim() === '');
  checks.push({
    id: 'C4', category: 'evidence',
    label: t('Reproduzierbarkeit dokumentiert', 'Reproducibility documented', 'Reproductibilité documentée'),
    detail: risksWithoutRepro.length > 0
      ? risksWithoutRepro.map(riskId).join(', ')
      : t('Alle dokumentiert', 'All documented', 'Toutes documentées'),
    passed: risksWithoutRepro.length === 0, severity: 'minor',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══
  const ids = reqs.map(r => r.id);
  const hasDuplicateIds = new Set(ids).size < ids.length;
  checks.push({
    id: 'D1', category: 'editorial',
    label: t('Eindeutige Anforderungs-IDs', 'Unique requirement IDs', 'IDs uniques'),
    detail: hasDuplicateIds ? t('Doppelte IDs', 'Duplicate IDs', 'IDs dupliqués') : t('Alle eindeutig', 'All unique', 'Toutes uniques'),
    passed: !hasDuplicateIds, severity: 'major',
  });

  let typoCount = 0;
  const typoMap: [string, string][] = [['Netzwerkcan', 'Netzwerkscan'], ['SBM', 'SBOM'], ['Fur', 'für'], ['Uber', 'über']];
  const checkTypos = (text: string) => { for (const [wrong] of typoMap) { if (new RegExp(`\\b${wrong}\\b`, 'gi').test(text)) typoCount++; } };
  risks.forEach(r => { checkTypos(r.evidence); checkTypos(r.rationale); checkTypos(r.name); });
  reqs.forEach(r => { checkTypos(r.evidence); checkTypos(r.rationale); checkTypos(r.gap); checkTypos(r.measure); });
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Keine bekannten Tippfehler', 'No known typos', 'Pas de fautes'),
    detail: typoCount > 0 ? `${typoCount} ${t('Tippfehler', 'typos', 'fautes')}` : t('Keine gefunden', 'None found', 'Aucune'),
    passed: typoCount === 0, severity: 'minor',
  });

  // ═══ E. REGULATORISCHE PRÜFUNG (NIS-2-spezifisch) ═══
  const art20 = reqs.find(r => r.article.includes('Art. 20'));
  checks.push({
    id: 'E1', category: 'regulatory',
    label: t('Art. 20 GL-Verantwortung geprüft', 'Art. 20 Management responsibility assessed', 'Art. 20 Responsabilité évaluée'),
    detail: art20 ? t('Geprüft', 'Assessed', 'Évalué') : t('Art. 20 fehlt', 'Art. 20 missing', 'Art. 20 manquant'),
    passed: !!art20, severity: 'critical',
  });

  const art23 = reqs.find(r => r.article.includes('Art. 23'));
  checks.push({
    id: 'E2', category: 'regulatory',
    label: t('Art. 23 Meldepflichten bewertet', 'Art. 23 Reporting assessed', 'Art. 23 Obligations évaluées'),
    detail: art23 ? t('Geprüft', 'Assessed', 'Évalué') : t('Art. 23 fehlt', 'Art. 23 missing', 'Art. 23 manquant'),
    passed: !!art23, severity: 'critical',
  });

  const art21d = reqs.find(r => r.article.includes('lit. d'));
  checks.push({
    id: 'E3', category: 'regulatory',
    label: t('Art. 21 lit. d Lieferkettensicherheit bewertet', 'Art. 21(d) Supply chain assessed', 'Art. 21(d) Chaîne évaluée'),
    detail: art21d ? t('Geprüft', 'Assessed', 'Évalué') : t('Art. 21 lit. d fehlt', 'Missing', 'Manquant'),
    passed: !!art21d, severity: 'critical',
  });

  // ═══ F. GOLDENE REGELN ═══
  // GR6: All non-pass reqs fully documented (gap + measure + effort + priority)
  const incompleteNonPassReqs = reqs.filter(r => r.status !== 'pass' && (
    !r.gap || r.gap.trim() === '' || !r.measure || r.measure.trim() === '' ||
    !r.effort || r.effort.trim() === '' || !r.priority || r.priority.trim() === ''
  ));
  checks.push({
    id: 'GR6', category: 'golden-rule',
    label: t('Regel 6: Nicht-konforme Anforderungen vollständig dokumentiert', 'Rule 6: Non-compliant requirements fully documented', 'Règle 6: Exigences non conformes documentées'),
    detail: incompleteNonPassReqs.length === 0
      ? t('Alle mit Gap, Maßnahme, Aufwand und Priorität', 'All have gap, measure, effort and priority', 'Toutes complètes')
      : `${incompleteNonPassReqs.length} ${t('unvollständig', 'incomplete', 'incomplètes')}`,
    passed: incompleteNonPassReqs.length === 0, severity: 'critical',
  });

  checks.push({
    id: 'GR7', category: 'golden-rule',
    label: t('Regel 7: Aufwandsschätzungen vorhanden', 'Rule 7: Effort estimates present', 'Règle 7: Estimations présentes'),
    detail: nonPassWithoutEffort.length === 0 ? t('Alle vorhanden', 'All present', 'Toutes présentes') : `${nonPassWithoutEffort.length} ${t('ohne Aufwand', 'without effort', 'sans effort')}`,
    passed: nonPassWithoutEffort.length === 0, severity: 'critical',
  });

  // ═══ VERDICT ═══
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const total = checks.length;

  const verdict: QaResult['verdict'] = criticalErrors > 0 ? 'failed' : failed > 0 ? 'conditional' : 'passed';
  const verdictLabel = verdict === 'passed'
    ? t('QUALITY GATE: BESTANDEN', 'QUALITY GATE: PASSED', 'QUALITY GATE: RÉUSSI')
    : verdict === 'conditional'
    ? t(`QUALITY GATE: BEDINGT (${passed}/${total})`, `QUALITY GATE: CONDITIONAL (${passed}/${total})`, `QUALITY GATE: CONDITIONNEL (${passed}/${total})`)
    : t(`QUALITY GATE: NICHT BESTANDEN (${passed}/${total})`, `QUALITY GATE: FAILED (${passed}/${total})`, `QUALITY GATE: ÉCHOUÉ (${passed}/${total})`);

  const corrections = checks.filter(c => !c.passed && (c.severity === 'critical' || c.severity === 'major')).map(c => `${c.id}: ${c.label} — ${c.detail}`);
  const optional = checks.filter(c => !c.passed && c.severity === 'minor').map(c => `${c.id}: ${c.label}`);

  return { checks, passed, failed, total, criticalErrors, verdict, verdictLabel, corrections, optional };
}
