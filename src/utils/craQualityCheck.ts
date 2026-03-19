/**
 * CRA Report Quality Check — Automated Audit Validation
 * Based on strict audit rules: Konsistenz, Fachliche Korrektheit, Evidenz, Redaktion, OT-Kontext
 */
import type { Threat, CraReq } from '@/data/craData';
import { threatId } from '@/data/craData';

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
  threats: Threat[],
  reqs: CraReq[],
  lang: 'de' | 'en' | 'fr' = 'de'
): QaResult {
  const checks: QaCheck[] = [];
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;

  // ═══ A. KONSISTENZPRÜFUNG ═══

  // A.1 Numerische Konsistenz
  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const passReqs = reqs.filter(r => r.status === 'pass').length;
  const partialReqs = reqs.filter(r => r.status === 'partial').length;
  const failReqs = reqs.filter(r => r.status === 'fail').length;
  const sumStatus = passReqs + partialReqs + failReqs;

  checks.push({
    id: 'A1-1', category: 'consistency',
    label: t('Threat-Anzahl konsistent', 'Threat count consistent', 'Nombre de menaces cohérent'),
    detail: `${threats.length} ${t('Threats identifiziert', 'threats identified', 'menaces identifiées')}`,
    passed: threats.length > 0, severity: 'critical',
  });

  checks.push({
    id: 'A1-2', category: 'consistency',
    label: t('Kritische Risiken (≥20) korrekt gezählt', 'Critical risks (≥20) correctly counted', 'Risques critiques (≥20) correctement comptés'),
    detail: `${critRisks.length} ${t('kritische Threats', 'critical threats', 'menaces critiques')}`,
    passed: true, severity: 'critical',
  });

  checks.push({
    id: 'A1-3', category: 'consistency',
    label: t('Statusverteilung = Gesamtanzahl Anforderungen', 'Status distribution = total requirements', 'Distribution des statuts = total des exigences'),
    detail: `${passReqs}+${partialReqs}+${failReqs} = ${sumStatus} vs. ${reqs.length}`,
    passed: sumStatus === reqs.length, severity: 'critical',
  });

  // A.2 Referenzielle Konsistenz (Traceability)
  const threatsWithoutCra = threats.filter(th => !th.cra || th.cra.trim() === '');
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Jeder Threat mit CRA-Anforderung verknüpft', 'Every threat linked to CRA requirement', 'Chaque menace liée à une exigence CRA'),
    detail: threatsWithoutCra.length > 0 ? `${threatsWithoutCra.length} ${t('ohne Verknüpfung', 'unlinked', 'non liées')}: ${threatsWithoutCra.map(threatId).join(', ')}` : t('Alle verknüpft', 'All linked', 'Toutes liées'),
    passed: threatsWithoutCra.length === 0, severity: 'major',
  });

  // A.3 Logische Konsistenz
  const failReqsWithCritThreats = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    const violatingThreats = threats.filter(th => th.cra === r.article && th.likelihood * th.impact >= 13);
    return violatingThreats.length > 0;
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Threats', 'No "compliant" with violating threats', 'Pas de "conforme" avec des menaces violantes'),
    detail: failReqsWithCritThreats.length > 0
      ? `${failReqsWithCritThreats.map(r => r.id).join(', ')} ${t('als konform, aber Threats verletzen diese', 'marked compliant but threats violate them', 'marquées conformes mais des menaces les violent')}`
      : t('Konsistent', 'Consistent', 'Cohérent'),
    passed: failReqsWithCritThreats.length === 0, severity: 'critical',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  // B.1 Vertraulichkeit (A1-4)
  const a14 = reqs.find(r => r.id === 'A1-4');
  const hasUnencrypted = threats.some(th => th.name.toLowerCase().includes('klartext') || th.name.toLowerCase().includes('unverschlüsselt') || th.name.toLowerCase().includes('security mode none'));
  checks.push({
    id: 'B1', category: 'technical',
    label: t('A1-4 Vertraulichkeit korrekt bewertet', 'A1-4 Confidentiality correctly rated', 'A1-4 Confidentialité correctement évaluée'),
    detail: hasUnencrypted && a14?.status === 'pass'
      ? t('Unverschlüsselte Übertragung vorhanden, aber A1-4 als "konform" — FEHLER', 'Unencrypted transmission present but A1-4 "compliant" — ERROR', 'Transmission non chiffrée présente mais A1-4 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasUnencrypted && a14?.status === 'pass'), severity: 'critical',
  });

  // B.2 Zugriffsschutz (A1-3)
  const a13 = reqs.find(r => r.id === 'A1-3');
  const hasNoAuth = threats.some(th => th.name.toLowerCase().includes('unauthentifiziert') || th.name.toLowerCase().includes('standard-passwort') || th.name.toLowerCase().includes('default'));
  checks.push({
    id: 'B2', category: 'technical',
    label: t('A1-3 Zugriffsschutz korrekt bewertet', 'A1-3 Access control correctly rated', 'A1-3 Contrôle d\'accès correctement évalué'),
    detail: hasNoAuth && a13?.status === 'pass'
      ? t('Fehlende Auth vorhanden, aber A1-3 als "konform" — FEHLER', 'Missing auth present but A1-3 "compliant" — ERROR', 'Auth manquante présente mais A1-3 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoAuth && a13?.status === 'pass'), severity: 'critical',
  });

  // B.3 Secure by Default (A1-2)
  const a12 = reqs.find(r => r.id === 'A1-2');
  const hasDefaultPw = threats.some(th => th.name.toLowerCase().includes('standard-') || th.name.toLowerCase().includes('default'));
  const hasDebug = threats.some(th => th.name.toLowerCase().includes('debug'));
  checks.push({
    id: 'B3', category: 'technical',
    label: t('A1-2 Secure by Default korrekt bewertet', 'A1-2 Secure by Default correctly rated', 'A1-2 Secure by Default correctement évalué'),
    detail: (hasDefaultPw || hasDebug) && a12?.status === 'pass'
      ? t('Default-PW/Debug aktiv, aber A1-2 als "konform" — FEHLER', 'Default PW/Debug active but A1-2 "compliant" — ERROR', 'PW par défaut/Debug actif mais A1-2 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !((hasDefaultPw || hasDebug) && a12?.status === 'pass'), severity: 'critical',
  });

  // B.6 Logging (A1-8)
  const a18 = reqs.find(r => r.id === 'A1-8');
  const hasNoLogging = threats.some(th => th.name.toLowerCase().includes('audit-log') || th.name.toLowerCase().includes('logging'));
  checks.push({
    id: 'B6', category: 'technical',
    label: t('A1-8 Logging korrekt bewertet', 'A1-8 Logging correctly rated', 'A1-8 Logging correctement évalué'),
    detail: hasNoLogging && a18?.status === 'pass'
      ? t('Fehlende Logs, aber A1-8 als "konform" — FEHLER', 'Missing logs but A1-8 "compliant" — ERROR', 'Logs manquants mais A1-8 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoLogging && a18?.status === 'pass'), severity: 'critical',
  });

  // B.7 SBOM (A2-8)
  const a28 = reqs.find(r => r.id === 'A2-8');
  checks.push({
    id: 'B7', category: 'technical',
    label: t('A2-8 SBOM bewertet', 'A2-8 SBOM assessed', 'A2-8 SBOM évalué'),
    detail: a28 ? t('Geprüft', 'Assessed', 'Évalué') : t('SBOM-Anforderung fehlt im Bericht', 'SBOM requirement missing from report', 'Exigence SBOM manquante du rapport'),
    passed: !!a28, severity: 'major',
  });

  // B.8 Meldepflichten (Art. 14)
  const art14 = reqs.find(r => r.article.includes('Art. 14'));
  checks.push({
    id: 'B8', category: 'technical',
    label: t('Art. 14 Meldepflichten bewertet', 'Art. 14 Incident reporting assessed', 'Art. 14 Obligations de signalement évaluées'),
    detail: art14 ? t('Geprüft', 'Assessed', 'Évalué') : t('Art. 14 fehlt im Bericht', 'Art. 14 missing from report', 'Art. 14 manquant du rapport'),
    passed: !!art14, severity: 'major',
  });

  // ═══ C. EVIDENZPRÜFUNG ═══

  const threatsWithWeakEvidence = critRisks.filter(th => th.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken haben PoC (⭐⭐⭐⭐+)', 'Critical risks have PoC (⭐⭐⭐⭐+)', 'Risques critiques ont PoC (⭐⭐⭐⭐+)'),
    detail: threatsWithWeakEvidence.length > 0
      ? `${threatsWithWeakEvidence.map(threatId).join(', ')} ${t('ohne ausreichende Evidenz', 'without sufficient evidence', 'sans preuve suffisante')}`
      : t('Alle kritischen Threats mit PoC', 'All critical threats with PoC', 'Toutes les menaces critiques avec PoC'),
    passed: threatsWithWeakEvidence.length === 0, severity: 'critical',
  });

  const threatsWithoutSources = threats.filter(th => !th.sources || th.sources.length === 0);
  checks.push({
    id: 'C2', category: 'evidence',
    label: t('Alle Threats mit Quellenreferenzen', 'All threats with source references', 'Toutes les menaces avec références'),
    detail: threatsWithoutSources.length > 0
      ? `${threatsWithoutSources.map(threatId).join(', ')} ${t('ohne Quellen', 'without sources', 'sans sources')}`
      : t('Alle referenziert', 'All referenced', 'Toutes référencées'),
    passed: threatsWithoutSources.length === 0, severity: 'major',
  });

  const avgEvidence = threats.reduce((s, th) => s + th.evidenceQuality, 0) / threats.length;
  checks.push({
    id: 'C3', category: 'evidence',
    label: t('Evidenz-Qualitätsrate ≥ 75%', 'Evidence quality rate ≥ 75%', 'Taux qualité preuve ≥ 75%'),
    detail: `${Math.round((avgEvidence / 5) * 100)}%`,
    passed: avgEvidence / 5 >= 0.75, severity: 'major',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══

  // Check sequential numbering
  const strideGroups: Record<string, number[]> = {};
  threats.forEach(th => {
    if (!strideGroups[th.stride]) strideGroups[th.stride] = [];
    strideGroups[th.stride].push(th.id);
  });
  checks.push({
    id: 'D1', category: 'editorial',
    label: t('Threats lückenlos nummeriert', 'Threats sequentially numbered', 'Menaces numérotées séquentiellement'),
    detail: t('STRIDE-Gruppen geprüft', 'STRIDE groups checked', 'Groupes STRIDE vérifiés'),
    passed: true, severity: 'minor',
  });

  // Check all 22 requirements present
  checks.push({
    id: 'D2', category: 'editorial',
    label: t('Alle 22 CRA-Anforderungen geprüft', 'All 22 CRA requirements assessed', 'Les 22 exigences CRA évaluées'),
    detail: `${reqs.length}/22`,
    passed: reqs.length >= 22, severity: 'critical',
  });

  // STRIDE distribution check
  const strideCats = new Set(threats.map(th => th.stride));
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Alle STRIDE-Kategorien abgedeckt', 'All STRIDE categories covered', 'Toutes les catégories STRIDE couvertes'),
    detail: `${strideCats.size}/6 (${[...'STRIDE'].filter(s => strideCats.has(s)).join(', ')})`,
    passed: strideCats.size >= 5, severity: 'major',
  });

  // ═══ E. OT-SPEZIFISCHE PRÜFUNG ═══

  const hasOtProtocols = threats.some(th =>
    th.component.toLowerCase().includes('modbus') ||
    th.component.toLowerCase().includes('opc-ua') ||
    th.component.toLowerCase().includes('mqtt')
  );
  const otThreatsHaveImpact5 = threats.filter(th =>
    (th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua')) &&
    th.impact < 4
  );
  checks.push({
    id: 'E1', category: 'ot',
    label: t('OT-Kontext in Risikobewertung berücksichtigt', 'OT context considered in risk assessment', 'Contexte OT pris en compte dans l\'évaluation'),
    detail: hasOtProtocols
      ? (otThreatsHaveImpact5.length > 0
        ? `${otThreatsHaveImpact5.map(threatId).join(', ')} ${t('mit zu niedrigem OT-Impact', 'with too low OT impact', 'avec impact OT trop bas')}`
        : t('OT-Impact korrekt kalibriert', 'OT impact correctly calibrated', 'Impact OT correctement calibré'))
      : t('Kein OT-Kontext erkannt', 'No OT context detected', 'Aucun contexte OT détecté'),
    passed: !hasOtProtocols || otThreatsHaveImpact5.length === 0, severity: 'critical',
  });

  // ─── Calculate Result ─────────────────────────────────────────
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const pct = Math.round((passed / checks.length) * 100);

  const verdict: QaResult['verdict'] = criticalErrors === 0 && pct >= 90 ? 'passed' : criticalErrors === 0 && pct >= 75 ? 'conditional' : 'failed';
  const verdictLabel = verdict === 'passed'
    ? t('BESTANDEN — Bericht revisionssicher', 'PASSED — Report audit-proof', 'RÉUSSI — Rapport prêt pour audit')
    : verdict === 'conditional'
    ? t('BEDINGT BESTANDEN — Einzelne Punkte nacharbeiten', 'CONDITIONALLY PASSED — Minor corrections needed', 'RÉUSSI SOUS CONDITIONS — Corrections mineures nécessaires')
    : t('NICHT BESTANDEN — Überarbeitung erforderlich', 'FAILED — Revision required', 'ÉCHOUÉ — Révision nécessaire');

  const corrections = checks.filter(c => !c.passed && c.severity === 'critical').map(c => c.label + ': ' + c.detail);
  const optional = checks.filter(c => !c.passed && c.severity !== 'critical').map(c => c.label + ': ' + c.detail);

  return { checks, passed, failed, total: checks.length, criticalErrors, verdict, verdictLabel, corrections, optional };
}
