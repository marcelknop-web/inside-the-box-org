/**
 * IEC 62443 Report Quality Check — Automated Audit Validation
 * Based on IEC 62443 Foundational Requirements (FR1-FR7)
 */
import type { IecThreat, IecReq, IecIntakeData } from '@/data/iec62443Data';
import { threatId } from '@/data/iec62443Data';

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
    label: t('Threat-Anzahl konsistent', 'Threat count consistent', 'Nombre de menaces coherent'),
    detail: `${threats.length} ${t('Threats identifiziert', 'threats identified', 'menaces identifiees')}`,
    passed: threats.length > 0, severity: 'critical',
  });

  checks.push({
    id: 'A1-3', category: 'consistency',
    label: t('Statusverteilung = Gesamtanzahl Anforderungen', 'Status distribution = total requirements', 'Distribution = total exigences'),
    detail: `${passReqs}+${partialReqs}+${failReqs} = ${passReqs + partialReqs + failReqs} vs. ${reqs.length}`,
    passed: passReqs + partialReqs + failReqs === reqs.length, severity: 'critical',
  });

  // A2: Traceability — threats linked to SR
  const threatsWithoutRef = threats.filter(th => !th.iecRef || th.iecRef.trim() === '');
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Jeder Threat mit IEC 62443 SR verknuepft', 'Every threat linked to IEC 62443 SR', 'Chaque menace liee a un SR IEC 62443'),
    detail: threatsWithoutRef.length > 0 ? `${threatsWithoutRef.length} ${t('ohne Verknuepfung', 'unlinked', 'non liees')}` : t('Alle verknuepft', 'All linked', 'Toutes liees'),
    passed: threatsWithoutRef.length === 0, severity: 'major',
  });

  // A2-2 Bidirectional traceability
  const nonPassReqsWithoutThreats = reqs.filter(r =>
    r.status !== 'pass' && !threats.some(th => th.iecRef === r.article)
  );
  checks.push({
    id: 'A2-2', category: 'consistency',
    label: t('Bidirektionale Traceability', 'Bidirectional traceability', 'Tracabilite bidirectionnelle'),
    detail: nonPassReqsWithoutThreats.length > 0
      ? `${t('Ohne Threat-Verknuepfung', 'Missing threat links', 'Liens manquants')}: ${nonPassReqsWithoutThreats.map(r => r.id).join(', ')}`
      : t('Alle verknuepft', 'All linked', 'Toutes liees'),
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
      : t('Konsistent', 'Consistent', 'Coherent'),
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
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: partialWithCritical.length === 0, severity: 'critical',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  // B1: FR1 (Auth) check
  const fr1Reqs = reqs.filter(r => r.id.startsWith('FR1'));
  const hasNoAuth = threats.some(th => th.name.toLowerCase().includes('shared account') || th.name.toLowerCase().includes('standard-passwort') || th.name.toLowerCase().includes('default') || th.name.toLowerCase().includes('fehlende authentifizierung'));
  const fr1Pass = fr1Reqs.some(r => r.status === 'pass');
  checks.push({
    id: 'B1', category: 'technical',
    label: t('FR1 Authentifizierung korrekt bewertet', 'FR1 Authentication correctly rated', 'FR1 Authentification correctement evaluee'),
    detail: hasNoAuth && fr1Pass
      ? t('Auth-Schwaechen vorhanden, aber FR1-Req als konform', 'Auth weaknesses but FR1 req compliant', 'Faiblesses auth mais FR1 conforme')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoAuth && fr1Pass), severity: 'critical',
  });

  // B2: FR5 (Segmentation)
  const fr5_1 = reqs.find(r => r.id === 'FR5-1');
  const hasNoSegmentation = threats.some(th => th.name.toLowerCase().includes('segmentierung') || th.name.toLowerCase().includes('flaches netzwerk'));
  checks.push({
    id: 'B2', category: 'technical',
    label: t('FR5 Netzwerksegmentierung korrekt bewertet', 'FR5 Network segmentation correctly rated', 'FR5 Segmentation correctement evaluee'),
    detail: hasNoSegmentation && fr5_1?.status === 'pass'
      ? t('Segmentierung fehlt, aber FR5-1 konform', 'Segmentation missing but FR5-1 compliant', 'Segmentation manquante mais FR5-1 conforme')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoSegmentation && fr5_1?.status === 'pass'), severity: 'critical',
  });

  // B9/B10: effort + priority for non-pass reqs
  const noEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  checks.push({
    id: 'B9', category: 'technical',
    label: t('Aufwandsschaetzung fuer alle nicht-konformen Massnahmen', 'Effort estimates for all non-compliant', 'Estimation effort pour non-conformes'),
    detail: noEffort.length > 0 ? `${t('Ohne Aufwand', 'Missing effort', 'Effort manquant')}: ${noEffort.map(r => r.id).join(', ')}` : t('Alle mit Aufwand', 'All have effort', 'Toutes avec effort'),
    passed: noEffort.length === 0, severity: 'critical',
  });

  const noPrio = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));
  checks.push({
    id: 'B10', category: 'technical',
    label: t('Priorisierung (P0-P3) fuer alle nicht-konformen Massnahmen', 'Priority (P0-P3) for all non-compliant', 'Priorite (P0-P3) pour non-conformes'),
    detail: noPrio.length > 0 ? `${t('Ohne Prioritaet', 'Missing priority', 'Priorite manquante')}: ${noPrio.map(r => r.id).join(', ')}` : t('Alle priorisiert', 'All prioritised', 'Toutes priorisees'),
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
    label: t('Alle Threats mit Quellenreferenzen', 'All threats with source references', 'Toutes les menaces avec references'),
    detail: noSources.length > 0 ? `${noSources.map(threatId).join(', ')}` : t('Alle referenziert', 'All referenced', 'Toutes referencees'),
    passed: noSources.length === 0, severity: 'major',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══
  const frCats = new Set(threats.map(th => th.fr));
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Alle FR-Kategorien abgedeckt (FR1-FR7)', 'All FR categories covered (FR1-FR7)', 'Toutes categories FR couvertes'),
    detail: `${frCats.size}/7 (${[...frCats].sort().join(', ')})`,
    passed: frCats.size >= 6, severity: 'major',
  });

  // ═══ E. OT-SPEZIFISCHE PRÜFUNG ═══
  const otThreatsLowImpact = threats.filter(th =>
    (th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('sps') || th.component.toLowerCase().includes('plc')) &&
    th.impact < 4
  );
  checks.push({
    id: 'E1', category: 'ot',
    label: t('OT-Impact korrekt kalibriert (SPS/Modbus >= 4)', 'OT impact correctly calibrated', 'Impact OT correctement calibre'),
    detail: otThreatsLowImpact.length > 0
      ? `${otThreatsLowImpact.map(threatId).join(', ')} ${t('mit zu niedrigem Impact', 'with too low impact', 'avec impact trop bas')}`
      : t('Korrekt', 'Correct', 'Correct'),
    passed: otThreatsLowImpact.length === 0, severity: 'critical',
  });

  // ─── Result ───
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const pct = Math.round((passed / checks.length) * 100);

  const verdict: QaResult['verdict'] = criticalErrors === 0 && pct >= 90 ? 'passed' : criticalErrors === 0 && pct >= 75 ? 'conditional' : 'failed';
  const verdictLabel = verdict === 'passed'
    ? t('BESTANDEN — Bericht revisionssicher', 'PASSED — Report audit-proof', 'REUSSI — Rapport pret pour audit')
    : verdict === 'conditional'
    ? t('BEDINGT BESTANDEN — Einzelne Punkte nacharbeiten', 'CONDITIONALLY PASSED — Minor corrections needed', 'REUSSI SOUS CONDITIONS')
    : t('NICHT BESTANDEN — Ueberarbeitung erforderlich', 'FAILED — Revision required', 'ECHOUE — Revision necessaire');

  const corrections = checks.filter(c => !c.passed && c.severity === 'critical').map(c => c.label + ': ' + c.detail);
  const optional = checks.filter(c => !c.passed && c.severity !== 'critical').map(c => c.label + ': ' + c.detail);

  return { checks, passed, failed, total: checks.length, criticalErrors, verdict, verdictLabel, corrections, optional };
}
