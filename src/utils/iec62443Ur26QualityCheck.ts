/**
 * IACS UR E26 Report Quality Check — Automated Audit Validation
 * Based on IACS UR E26 requirement categories
 */
import type { IecThreat, IecReq, IecIntakeData } from '@/data/iec62443Ur26Data';
import { threatId } from '@/data/iec62443Ur26Data';

export interface QaCheck {
  id: string;
  category: 'consistency' | 'technical' | 'evidence' | 'editorial' | 'ot';
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

export function runQualityCheck(
  threats: IecThreat[],
  reqs: IecReq[],
  lang: 'de' | 'en' | 'fr' = 'de',
  _intakeData?: IecIntakeData
): QaResult {
  const checks: QaCheck[] = [];
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;

  // ═══ A. KONSISTENZPRÜFUNG ═══
  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const passReqs = reqs.filter(r => r.status === 'pass').length;
  const partialReqs = reqs.filter(r => r.status === 'partial').length;
  const failReqs = reqs.filter(r => r.status === 'fail').length;

  checks.push({
    id: 'A1-1', category: 'consistency',
    label: t('Threat-Anzahl konsistent', 'Threat count consistent', 'Nombre de menaces cohérent'),
    detail: `${threats.length} ${t('Threats identifiziert', 'threats identified', 'menaces identifiées')}`,
    passed: threats.length > 0, severity: 'critical',
  });

  checks.push({
    id: 'A1-3', category: 'consistency',
    label: t('Statusverteilung = Gesamtanzahl Anforderungen', 'Status distribution = total requirements', 'Distribution = total exigences'),
    detail: `${passReqs}+${partialReqs}+${failReqs} = ${passReqs + partialReqs + failReqs} vs. ${reqs.length}`,
    passed: passReqs + partialReqs + failReqs === reqs.length, severity: 'critical',
  });

  // A2: Traceability — threats linked to E26 requirement
  const threatsWithoutRef = threats.filter(th => !th.iecRef || th.iecRef.trim() === '');
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Jeder Threat mit E26-Anforderung verknüpft', 'Every threat linked to E26 requirement', 'Chaque menace liée à une exigence E26'),
    detail: threatsWithoutRef.length > 0 ? `${threatsWithoutRef.length} ${t('ohne Verknüpfung', 'unlinked', 'non liées')}` : t('Alle verknüpft', 'All linked', 'Toutes liées'),
    passed: threatsWithoutRef.length === 0, severity: 'major',
  });

  // A2-2 Bidirectional traceability
  const nonPassReqsWithoutThreats = reqs.filter(r =>
    r.status !== 'pass' && !threats.some(th => th.iecRef === r.article)
  );
  checks.push({
    id: 'A2-2', category: 'consistency',
    label: t('Bidirektionale Traceability', 'Bidirectional traceability', 'Traçabilité bidirectionnelle'),
    detail: nonPassReqsWithoutThreats.length > 0
      ? `${t('Ohne Threat-Verknüpfung', 'Missing threat links', 'Liens manquants')}: ${nonPassReqsWithoutThreats.map(r => r.id).join(', ')}`
      : t('Alle verknüpft', 'All linked', 'Toutes liées'),
    passed: nonPassReqsWithoutThreats.length === 0, severity: 'critical',
  });

  // A3: No "pass" with violating threats
  const passReqsWithViolating = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return threats.some(th => th.iecRef === r.article && th.likelihood * th.impact >= 13);
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Threats (Score >= 13)', 'No "compliant" with violating threats', 'Pas de "conforme" avec menaces violantes'),
    detail: passReqsWithViolating.length > 0
      ? passReqsWithViolating.map(r => r.id).join(', ')
      : t('Konsistent', 'Consistent', 'Cohérent'),
    passed: passReqsWithViolating.length === 0, severity: 'critical',
  });

  // A3-1b: partial with critical threats
  const partialWithCritical = reqs.filter(r => {
    if (r.status !== 'partial') return false;
    return threats.some(th => th.iecRef === r.article && th.likelihood * th.impact >= 20);
  });
  checks.push({
    id: 'A3-1b', category: 'consistency',
    label: t('Kein "teilweise" bei kritischen Threats (>= 20)', 'No "partial" with critical threats', 'Pas de "partiel" avec menaces critiques'),
    detail: partialWithCritical.length > 0
      ? partialWithCritical.map(r => r.id).join(', ')
      : t('Konsistent', 'Consistent', 'Cohérent'),
    passed: partialWithCritical.length === 0, severity: 'critical',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  // B1: IAC (Auth) check
  const iacReqs = reqs.filter(r => r.id.startsWith('IAC'));
  const hasNoAuth = threats.some(th => th.name.toLowerCase().includes('shared account') || th.name.toLowerCase().includes('standard-passwort') || th.name.toLowerCase().includes('default') || th.name.toLowerCase().includes('fehlende authentifizierung'));
  const iacPass = iacReqs.some(r => r.status === 'pass');
  checks.push({
    id: 'B1', category: 'technical',
    label: t('IAC Authentifizierung korrekt bewertet', 'IAC Authentication correctly rated', 'IAC Authentification correctement évaluée'),
    detail: hasNoAuth && iacPass
      ? t('Auth-Schwächen vorhanden, aber IAC-Req als konform', 'Auth weaknesses but IAC req compliant', 'Faiblesses auth mais IAC conforme')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoAuth && iacPass), severity: 'critical',
  });

  // B2: UTN (Segmentation)
  const utn2 = reqs.find(r => r.id === 'UTN-2');
  const hasNoSegmentation = threats.some(th => th.name.toLowerCase().includes('segmentierung') || th.name.toLowerCase().includes('flaches netzwerk'));
  checks.push({
    id: 'B2', category: 'technical',
    label: t('UTN Netzwerksegmentierung korrekt bewertet', 'UTN Network segmentation correctly rated', 'UTN Segmentation correctement évaluée'),
    detail: hasNoSegmentation && utn2?.status === 'pass'
      ? t('Segmentierung fehlt, aber UTN-2 konform', 'Segmentation missing but UTN-2 compliant', 'Segmentation manquante mais UTN-2 conforme')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoSegmentation && utn2?.status === 'pass'), severity: 'critical',
  });

  // B9/B10: effort + priority for non-pass reqs
  const noEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  checks.push({
    id: 'B9', category: 'technical',
    label: t('Aufwandsschätzung für alle nicht-konformen Maßnahmen', 'Effort estimates for all non-compliant', 'Estimation effort pour non-conformes'),
    detail: noEffort.length > 0 ? `${t('Ohne Aufwand', 'Missing effort', 'Effort manquant')}: ${noEffort.map(r => r.id).join(', ')}` : t('Alle mit Aufwand', 'All have effort', 'Toutes avec effort'),
    passed: noEffort.length === 0, severity: 'critical',
  });

  const noPrio = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));
  checks.push({
    id: 'B10', category: 'technical',
    label: t('Priorisierung (P0-P3) für alle nicht-konformen Maßnahmen', 'Priority (P0-P3) for all non-compliant', 'Priorité (P0-P3) pour non-conformes'),
    detail: noPrio.length > 0 ? `${t('Ohne Priorität', 'Missing priority', 'Priorité manquante')}: ${noPrio.map(r => r.id).join(', ')}` : t('Alle priorisiert', 'All prioritised', 'Toutes priorisées'),
    passed: noPrio.length === 0, severity: 'critical',
  });

  // ═══ C. EVIDENZPRÜFUNG ═══
  const critWithWeakEvid = critRisks.filter(th => th.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken mit PoC (4/5+)', 'Critical risks with PoC (4/5+)', 'Risques critiques avec PoC (4/5+)'),
    detail: critWithWeakEvid.length > 0
      ? critWithWeakEvid.map(th => `${threatId(th)} (${th.evidenceQuality}/5)`).join(', ')
      : t('Alle kritischen mit PoC', 'All critical with PoC', 'Toutes critiques avec PoC'),
    passed: critWithWeakEvid.length === 0, severity: 'critical',
  });

  const noSources = threats.filter(th => !th.sources || th.sources.length === 0);
  checks.push({
    id: 'C2', category: 'evidence',
    label: t('Alle Threats mit Quellenreferenzen', 'All threats with source references', 'Toutes les menaces avec références'),
    detail: noSources.length > 0 ? `${noSources.map(threatId).join(', ')}` : t('Alle referenziert', 'All referenced', 'Toutes référencées'),
    passed: noSources.length === 0, severity: 'major',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══
  const frCats = new Set(threats.map(th => th.fr));
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Alle E26-Kategorien abgedeckt', 'All E26 categories covered', 'Toutes catégories E26 couvertes'),
    detail: `${frCats.size}/7 (${[...frCats].sort().join(', ')})`,
    passed: frCats.size >= 5, severity: 'major',
  });

  // ═══ E. MARITIME-SPEZIFISCHE PRÜFUNG ═══
  const nmea = threats.filter(th =>
    (th.component.toLowerCase().includes('nmea') || th.component.toLowerCase().includes('ecdis') || th.component.toLowerCase().includes('navigation')) &&
    th.impact < 4
  );
  checks.push({
    id: 'E1', category: 'ot',
    label: t('Maritime-Impact korrekt kalibriert (Navigation/ECDIS >= 4)', 'Maritime impact correctly calibrated', 'Impact maritime correctement calibré'),
    detail: nmea.length > 0
      ? `${nmea.map(threatId).join(', ')} ${t('mit zu niedrigem Impact', 'with too low impact', 'avec impact trop bas')}`
      : t('Korrekt', 'Correct', 'Correct'),
    passed: nmea.length === 0, severity: 'critical',
  });

  // ─── Result ───
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const pct = Math.round((passed / checks.length) * 100);

  const verdict: QaResult['verdict'] = criticalErrors === 0 && pct >= 90 ? 'passed' : criticalErrors === 0 && pct >= 75 ? 'conditional' : 'failed';
  const verdictLabel = verdict === 'passed'
    ? t('BESTANDEN — Bericht revisionssicher', 'PASSED — Report audit-proof', 'RÉUSSI — Rapport prêt pour audit')
    : verdict === 'conditional'
    ? t('BEDINGT BESTANDEN — Einzelne Punkte nacharbeiten', 'CONDITIONALLY PASSED — Minor corrections needed', 'RÉUSSI SOUS CONDITIONS')
    : t('NICHT BESTANDEN — Überarbeitung erforderlich', 'FAILED — Revision required', 'ÉCHOUÉ — Révision nécessaire');

  const corrections = checks.filter(c => !c.passed && c.severity === 'critical').map(c => c.label + ': ' + c.detail);
  const optional = checks.filter(c => !c.passed && c.severity !== 'critical').map(c => c.label + ': ' + c.detail);

  return { checks, passed, failed, total: checks.length, criticalErrors, verdict, verdictLabel, corrections, optional };
}
