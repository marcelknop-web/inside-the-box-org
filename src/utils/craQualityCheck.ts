/**
 * CRA Report Quality Check — Automated Audit Validation
 * Based on strict audit rules: Konsistenz, Fachliche Korrektheit, Evidenz, Redaktion, OT-Kontext
 *
 * Audit-Review findings addressed:
 * - A1-4 "partial" with unencrypted protocols must be "fail"
 * - A1-5 consistency: Modbus threat (T-010) violates integrity → cannot be "pass"
 * - All non-pass reqs must have effort AND priority
 * - Bidirectional traceability: fail-reqs must have linked threats
 * - STRIDE distribution per component
 * - Editorial quality: duplicate text fragments, common typos
 */
import type { Threat, CraReq, IntakeData } from '@/data/craData';
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
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: IntakeData
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
    label: t('Threat-Anzahl konsistent', 'Threat count consistent', 'Nombre de menaces coherent'),
    detail: `${threats.length} ${t('Threats identifiziert', 'threats identified', 'menaces identifiees')}`,
    passed: threats.length > 0, severity: 'critical',
  });

  // A1-2: Critical risk threshold — at least 1 critical threat expected when unencrypted/OT protocols exist
  const expectsCritical = threats.some(th =>
    th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua') ||
    th.name.toLowerCase().includes('klartext') || th.name.toLowerCase().includes('unverschl')
  );
  checks.push({
    id: 'A1-2', category: 'consistency',
    label: t('Kritische Risiken (>=20) korrekt gezaehlt', 'Critical risks (>=20) correctly counted', 'Risques critiques (>=20) correctement comptes'),
    detail: `${critRisks.length} ${t('kritische Threats', 'critical threats', 'menaces critiques')}${expectsCritical && critRisks.length === 0 ? ' — ' + t('erwartet > 0 bei OT/unverschl. Protokollen', 'expected > 0 with OT/unencrypted protocols', 'attendu > 0 avec protocoles OT/non chiffres') : ''}`,
    passed: !(expectsCritical && critRisks.length === 0), severity: 'critical',
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
    label: t('Jeder Threat mit CRA-Anforderung verknuepft', 'Every threat linked to CRA requirement', 'Chaque menace liee a une exigence CRA'),
    detail: threatsWithoutCra.length > 0 ? `${threatsWithoutCra.length} ${t('ohne Verknuepfung', 'unlinked', 'non liees')}: ${threatsWithoutCra.map(threatId).join(', ')}` : t('Alle verknuepft', 'All linked', 'Toutes liees'),
    passed: threatsWithoutCra.length === 0, severity: 'major',
  });

  // A.2b Bidirektionale Traceability: Jede fail/partial-Anforderung hat >= 1 verknuepften Threat
  const nonPassReqsWithoutThreats = reqs.filter(r => r.status !== 'pass' && !threats.some(th => th.cra === r.article));
  checks.push({
    id: 'A2-2', category: 'consistency',
    label: t('Bidirektionale Traceability: Jede nicht-konforme Anforderung hat verknuepfte Threats', 'Bidirectional traceability: Every non-compliant requirement has linked threats', 'Tracabilite bidirectionnelle : chaque exigence non conforme a des menaces liees'),
    detail: nonPassReqsWithoutThreats.length > 0
      ? `${t('Ohne Threat-Verknuepfung', 'Missing threat links', 'Liens de menaces manquants')}: ${nonPassReqsWithoutThreats.map(r => r.id).join(', ')}`
      : t('Alle verknuepft', 'All linked', 'Toutes liees'),
    passed: nonPassReqsWithoutThreats.length === 0, severity: 'critical',
  });

  // A.3 Logische Konsistenz: kein "konform" bei verletzenden Threats (>= 13)
  const passReqsWithViolatingThreats = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return threats.some(th => th.cra === r.article && th.likelihood * th.impact >= 13);
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Threats (Score >= 13)', 'No "compliant" with violating threats (score >= 13)', 'Pas de "conforme" avec des menaces violantes (score >= 13)'),
    detail: passReqsWithViolatingThreats.length > 0
      ? `${passReqsWithViolatingThreats.map(r => r.id).join(', ')} ${t('als konform, aber Threats verletzen diese', 'marked compliant but threats violate them', 'marquees conformes mais des menaces les violent')}`
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: passReqsWithViolatingThreats.length === 0, severity: 'critical',
  });

  // A.3b "partial" bei kritischen Threats (>= 20) muss "fail" sein
  const partialReqsWithCriticalThreats = reqs.filter(r => {
    if (r.status !== 'partial') return false;
    return threats.some(th => th.cra === r.article && th.likelihood * th.impact >= 20);
  });
  checks.push({
    id: 'A3-1b', category: 'consistency',
    label: t('Kein "teilweise konform" bei kritischen Threats (Score >= 20)', 'No "partial" with critical threats (score >= 20)', 'Pas de "partiel" avec menaces critiques (score >= 20)'),
    detail: partialReqsWithCriticalThreats.length > 0
      ? `${partialReqsWithCriticalThreats.map(r => r.id).join(', ')} ${t('als teilweise, aber kritische Threats erfordern "nicht konform"', 'marked partial but critical threats require "non-compliant"', 'marquees partielles mais menaces critiques exigent "non conforme"')}`
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: partialReqsWithCriticalThreats.length === 0, severity: 'critical',
  });

  // A.3b Logische Konsistenz: kein "konform" bei kritischen Threats (>= 20) — strictere Pruefung
  const passReqsWithCriticalThreats = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return threats.some(th => th.cra === r.article && th.likelihood * th.impact >= 20);
  });
  checks.push({
    id: 'A3-2', category: 'consistency',
    label: t('Kein "konform" bei kritischen Threats (Score >= 20)', 'No "compliant" with critical threats (score >= 20)', 'Pas de "conforme" avec menaces critiques (score >= 20)'),
    detail: passReqsWithCriticalThreats.length > 0
      ? `${t('Widerspruch', 'Contradiction', 'Contradiction')}: ${passReqsWithCriticalThreats.map(r => r.id).join(', ')}`
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: passReqsWithCriticalThreats.length === 0, severity: 'critical',
  });

  // A.4 STRIDE-Verteilung pro Komponente (>= 2 Kategorien)
  const stridePerComponent = new Map<string, Set<string>>();
  for (const th of threats) {
    const comp = th.component.split('—')[0].trim();
    if (!stridePerComponent.has(comp)) stridePerComponent.set(comp, new Set());
    stridePerComponent.get(comp)!.add(th.stride);
  }
  const componentsWithLessThan2 = [...stridePerComponent.entries()].filter(([, s]) => s.size < 2);
  checks.push({
    id: 'A4-1', category: 'consistency',
    label: t('STRIDE-Verteilung: Jede Komponente >= 2 Kategorien', 'STRIDE distribution: Each component >= 2 categories', 'Distribution STRIDE : chaque composant >= 2 categories'),
    detail: componentsWithLessThan2.length > 0
      ? `${componentsWithLessThan2.map(([c, s]) => `${c} (${s.size})`).join(', ')}`
      : t('Alle Komponenten ausreichend abgedeckt', 'All components sufficiently covered', 'Tous les composants suffisamment couverts'),
    passed: componentsWithLessThan2.length === 0, severity: 'major',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  // B.1 Vertraulichkeit (A1-4) — STRICTER: partial is also wrong with unencrypted protocols
  const a14 = reqs.find(r => r.id === 'A1-4');
  const hasUnencryptedThreat = threats.some(th =>
    th.name.toLowerCase().includes('klartext') ||
    th.name.toLowerCase().includes('unverschl') ||
    th.name.toLowerCase().includes('security mode none')
  );
  const hasUnencryptedInterfaces = intakeData ? (
    intakeData.interfaces.includes('MQTT (unverschl.)') ||
    intakeData.interfaces.includes('HTTP')
  ) : false;
  const hasUnencrypted = hasUnencryptedThreat || hasUnencryptedInterfaces;
  checks.push({
    id: 'B1', category: 'technical',
    label: t('A1-4 Vertraulichkeit korrekt bewertet', 'A1-4 Confidentiality correctly rated', 'A1-4 Confidentialite correctement evaluee'),
    detail: hasUnencrypted && a14?.status !== 'fail'
      ? t(
        `Unverschluesselte Uebertragung vorhanden, aber A1-4 als "${a14?.status === 'pass' ? 'konform' : 'teilweise konform'}" — muss "nicht konform" sein`,
        `Unencrypted transmission present but A1-4 "${a14?.status}" — must be "non-compliant"`,
        `Transmission non chiffree presente mais A1-4 "${a14?.status}" — doit etre "non conforme"`
      )
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasUnencrypted && a14 && a14.status !== 'fail'), severity: 'critical',
  });

  // B.2 Zugriffsschutz (A1-3)
  const a13 = reqs.find(r => r.id === 'A1-3');
  const hasNoAuth = threats.some(th => th.name.toLowerCase().includes('unauthentifiziert') || th.name.toLowerCase().includes('standard-passwort') || th.name.toLowerCase().includes('default'));
  checks.push({
    id: 'B2', category: 'technical',
    label: t('A1-3 Zugriffsschutz korrekt bewertet', 'A1-3 Access control correctly rated', 'A1-3 Controle d\'acces correctement evalue'),
    detail: hasNoAuth && a13?.status === 'pass'
      ? t('Fehlende Auth vorhanden, aber A1-3 als "konform" — FEHLER', 'Missing auth present but A1-3 "compliant" — ERROR', 'Auth manquante presente mais A1-3 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoAuth && a13?.status === 'pass'), severity: 'critical',
  });

  // B.3 Secure by Default (A1-2)
  const a12 = reqs.find(r => r.id === 'A1-2');
  const hasDefaultPw = threats.some(th => th.name.toLowerCase().includes('standard-') || th.name.toLowerCase().includes('default'));
  const hasDebug = threats.some(th => th.name.toLowerCase().includes('debug'));
  checks.push({
    id: 'B3', category: 'technical',
    label: t('A1-2 Secure by Default korrekt bewertet', 'A1-2 Secure by Default correctly rated', 'A1-2 Secure by Default correctement evalue'),
    detail: (hasDefaultPw || hasDebug) && a12?.status === 'pass'
      ? t('Default-PW/Debug aktiv, aber A1-2 als "konform" — FEHLER', 'Default PW/Debug active but A1-2 "compliant" — ERROR', 'PW par defaut/Debug actif mais A1-2 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !((hasDefaultPw || hasDebug) && a12?.status === 'pass'), severity: 'critical',
  });

  // B.4 Integritaet (A1-5) — NEW: Check consistency with Modbus threat
  const a15 = reqs.find(r => r.id === 'A1-5');
  const integrityViolatingThreats = threats.filter(th =>
    th.cra === a15?.article &&
    th.likelihood * th.impact >= 15
  );
  const modbusManipulationThreat = threats.find(th =>
    th.name.toLowerCase().includes('modbus') &&
    th.name.toLowerCase().includes('manipulation')
  );
  const a15Inconsistent = a15?.status === 'pass' && (integrityViolatingThreats.length > 0 || modbusManipulationThreat);
  checks.push({
    id: 'B4', category: 'technical',
    label: t('A1-5 Integritaet konsistent bewertet', 'A1-5 Integrity consistently rated', 'A1-5 Integrite evaluee de maniere coherente'),
    detail: a15Inconsistent
      ? t(
        `A1-5 als "konform", aber ${modbusManipulationThreat ? 'Modbus-Manipulation-Threat (unauthentifiziert) verletzt Integritaet' : 'verletzende Threats vorhanden'} — inkonsistent`,
        `A1-5 "compliant" but ${modbusManipulationThreat ? 'Modbus manipulation threat (unauthenticated) violates integrity' : 'violating threats exist'} — inconsistent`,
        `A1-5 "conforme" mais ${modbusManipulationThreat ? 'menace de manipulation Modbus viole l\'integrite' : 'menaces violantes existent'} — incoherent`
      )
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !a15Inconsistent, severity: 'critical',
  });

  // B.6 Logging (A1-8)
  const a18 = reqs.find(r => r.id === 'A1-8');
  const hasNoLogging = threats.some(th => th.name.toLowerCase().includes('audit-log') || th.name.toLowerCase().includes('logging'));
  checks.push({
    id: 'B6', category: 'technical',
    label: t('A1-8 Logging korrekt bewertet', 'A1-8 Logging correctly rated', 'A1-8 Logging correctement evalue'),
    detail: hasNoLogging && a18?.status === 'pass'
      ? t('Fehlende Logs, aber A1-8 als "konform" — FEHLER', 'Missing logs but A1-8 "compliant" — ERROR', 'Logs manquants mais A1-8 "conforme" — ERREUR')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasNoLogging && a18?.status === 'pass'), severity: 'critical',
  });

  // B.7 SBOM (A2-8)
  const a28 = reqs.find(r => r.id === 'A2-8');
  checks.push({
    id: 'B7', category: 'technical',
    label: t('A2-8 SBOM bewertet', 'A2-8 SBOM assessed', 'A2-8 SBOM evalue'),
    detail: a28 ? t('Geprueft', 'Assessed', 'Evalue') : t('SBOM-Anforderung fehlt im Bericht', 'SBOM requirement missing from report', 'Exigence SBOM manquante du rapport'),
    passed: !!a28, severity: 'major',
  });

  // B.8 Meldepflichten (Art. 14)
  const art14 = reqs.find(r => r.article.includes('Art. 14') || r.article.includes('Artikel 14'));
  checks.push({
    id: 'B8', category: 'technical',
    label: t('Art. 14 Meldepflichten bewertet', 'Art. 14 Incident reporting assessed', 'Art. 14 Obligations de signalement evaluees'),
    detail: art14 ? t('Geprueft', 'Assessed', 'Evalue') : t('Art. 14 fehlt im Bericht', 'Art. 14 missing from report', 'Art. 14 manquant du rapport'),
    passed: !!art14, severity: 'major',
  });

  // B.9 Effort/Priority for all non-pass reqs — NEW
  const nonPassReqsWithoutEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  checks.push({
    id: 'B9', category: 'technical',
    label: t('Alle nicht-konformen Massnahmen haben Aufwandsschaetzung', 'All non-compliant measures have effort estimates', 'Toutes les mesures non conformes ont une estimation d\'effort'),
    detail: nonPassReqsWithoutEffort.length > 0
      ? `${t('Ohne Aufwand', 'Missing effort', 'Effort manquant')}: ${nonPassReqsWithoutEffort.map(r => r.id).join(', ')}`
      : t('Alle mit Aufwand', 'All have effort', 'Toutes avec effort'),
    passed: nonPassReqsWithoutEffort.length === 0, severity: 'critical',
  });

  const nonPassReqsWithoutPriority = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));
  checks.push({
    id: 'B10', category: 'technical',
    label: t('Alle nicht-konformen Massnahmen haben P0-P3-Priorisierung', 'All non-compliant measures have P0-P3 prioritisation', 'Toutes les mesures non conformes ont une priorite P0-P3'),
    detail: nonPassReqsWithoutPriority.length > 0
      ? `${t('Ohne Prioritaet', 'Missing priority', 'Priorite manquante')}: ${nonPassReqsWithoutPriority.map(r => r.id).join(', ')}`
      : t('Alle priorisiert', 'All prioritised', 'Toutes priorisees'),
    passed: nonPassReqsWithoutPriority.length === 0, severity: 'critical',
  });

  // B.11 Gap completeness: every non-pass req must explain the deficiency
  const nonPassReqsWithoutGap = reqs.filter(r => r.status !== 'pass' && (!r.gap || r.gap.trim() === ''));
  checks.push({
    id: 'B11', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Gap-Beschreibung', 'All non-compliant requirements have gap description', 'Toutes les exigences non conformes avec description de gap'),
    detail: nonPassReqsWithoutGap.length > 0
      ? `${t('Ohne Gap', 'Missing gap', 'Gap manquant')}: ${nonPassReqsWithoutGap.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentees'),
    passed: nonPassReqsWithoutGap.length === 0, severity: 'major',
  });

  // B.12 Measure completeness: every non-pass req must have remediation measure
  const nonPassReqsWithoutMeasure = reqs.filter(r => r.status !== 'pass' && (!r.measure || r.measure.trim() === ''));
  checks.push({
    id: 'B12', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Massnahme', 'All non-compliant requirements have remediation measure', 'Toutes les exigences non conformes avec mesure corrective'),
    detail: nonPassReqsWithoutMeasure.length > 0
      ? `${t('Ohne Massnahme', 'Missing measure', 'Mesure manquante')}: ${nonPassReqsWithoutMeasure.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentees'),
    passed: nonPassReqsWithoutMeasure.length === 0, severity: 'major',
  });

  // ═══ C. EVIDENZPRÜFUNG ═══

  const threatsWithWeakEvidence = critRisks.filter(th => th.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken haben PoC (4/5+)', 'Critical risks have PoC (4/5+)', 'Risques critiques ont PoC (4/5+)'),
    detail: threatsWithWeakEvidence.length > 0
      ? `${threatsWithWeakEvidence.map(th => `${threatId(th)} (${th.evidenceQuality}/5)`).join(', ')} ${t('ohne ausreichende Evidenz', 'without sufficient evidence', 'sans preuve suffisante')}`
      : t('Alle kritischen Threats mit PoC', 'All critical threats with PoC', 'Toutes les menaces critiques avec PoC'),
    passed: threatsWithWeakEvidence.length === 0, severity: 'critical',
  });

  const highRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 15 && s < 20; });
  const highWithoutEvidence = highRisks.filter(th => th.evidenceQuality < 3);
  checks.push({
    id: 'C1b', category: 'evidence',
    label: t('Hohe Risiken (15-19) haben Evidenz (3/5+)', 'High risks (15-19) have evidence (3/5+)', 'Risques eleves (15-19) ont preuve (3/5+)'),
    detail: highWithoutEvidence.length > 0
      ? `${highWithoutEvidence.map(th => `${threatId(th)} (${th.evidenceQuality}/5)`).join(', ')} ${t('mit schwacher Evidenz', 'with weak evidence', 'avec preuve faible')}`
      : t('Alle hohen Threats mit ausreichender Evidenz', 'All high threats with sufficient evidence', 'Toutes les menaces elevees avec preuve suffisante'),
    passed: highWithoutEvidence.length === 0, severity: 'major',
  });

  const threatsWithoutSources = threats.filter(th => !th.sources || th.sources.length === 0);
  checks.push({
    id: 'C2', category: 'evidence',
    label: t('Alle Threats mit Quellenreferenzen', 'All threats with source references', 'Toutes les menaces avec references'),
    detail: threatsWithoutSources.length > 0
      ? `${threatsWithoutSources.map(threatId).join(', ')} ${t('ohne Quellen', 'without sources', 'sans sources')}`
      : t('Alle referenziert', 'All referenced', 'Toutes referencees'),
    passed: threatsWithoutSources.length === 0, severity: 'major',
  });

  const evidAbove75 = threats.length > 0 && (threats.filter(th => th.evidenceQuality >= 3).length / threats.length) >= 0.75;
  checks.push({
    id: 'C3', category: 'evidence',
    label: t('Evidenz-Qualitaetsrate >= 75%', 'Evidence quality rate >= 75%', 'Taux qualite preuve >= 75%'),
    detail: `${threats.length > 0 ? Math.round((threats.filter(th => th.evidenceQuality >= 3).length / threats.length) * 100) : 0}%`,
    passed: evidAbove75, severity: 'major',
  });

  // C.4 Requirement evidence: non-pass reqs should have evidence documenting the finding
  const nonPassReqsWithoutEvidence = reqs.filter(r => r.status !== 'pass' && (!r.evidence || r.evidence.trim() === ''));
  checks.push({
    id: 'C4', category: 'evidence',
    label: t('Nicht-konforme Anforderungen haben Evidenz', 'Non-compliant requirements have evidence', 'Exigences non conformes avec preuve'),
    detail: nonPassReqsWithoutEvidence.length > 0
      ? `${t('Ohne Evidenz', 'Missing evidence', 'Preuve manquante')}: ${nonPassReqsWithoutEvidence.map(r => r.id).join(', ')}`
      : t('Alle mit Evidenz', 'All with evidence', 'Toutes avec preuve'),
    passed: nonPassReqsWithoutEvidence.length === 0, severity: 'major',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══

  // D.1 Sequential numbering — actually verify within each STRIDE group
  const numbGaps: string[] = [];
  for (const cat of 'STRIDE'.split('')) {
    const ids = threats.filter(th => th.stride === cat).map(th => th.id).sort((a, b) => a - b);
    for (let i = 1; i < ids.length; i++) {
      if (ids[i] !== ids[i - 1] + 1) {
        numbGaps.push(`${cat}: ${t('Luecke nach', 'gap after', 'lacune apres')} ${cat}-${String(ids[i - 1]).padStart(3, '0')}`);
      }
    }
  }
  checks.push({
    id: 'D1', category: 'editorial',
    label: t('Threats lueckenlos nummeriert', 'Threats sequentially numbered', 'Menaces numerotees sequentiellement'),
    detail: numbGaps.length > 0 ? numbGaps.join('; ') : t('Alle Gruppen lueckenlos', 'All groups sequential', 'Tous les groupes sequentiels'),
    passed: numbGaps.length === 0, severity: 'minor',
  });

  // D.2 All 22 requirements present
  checks.push({
    id: 'D2', category: 'editorial',
    label: t('Alle 22 CRA-Anforderungen geprueft', 'All 22 CRA requirements assessed', 'Les 22 exigences CRA evaluees'),
    detail: `${reqs.length}/22`,
    passed: reqs.length >= 22, severity: 'critical',
  });

  // D.3 STRIDE coverage
  const strideCats = new Set(threats.map(th => th.stride));
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Alle STRIDE-Kategorien abgedeckt', 'All STRIDE categories covered', 'Toutes les categories STRIDE couvertes'),
    detail: `${strideCats.size}/6 (${[...'STRIDE'].filter(s => strideCats.has(s)).join(', ')})`,
    passed: strideCats.size >= 5, severity: 'major',
  });

  // D.4 Editorial quality: detect common text issues in evidence/rationale — NEW
  const textIssues: string[] = [];
  for (const th of threats) {
    const tid = threatId(th);
    // Check for duplicate consecutive lines in evidence
    const evidLines = th.evidence.split('. ');
    const seenLines = new Set<string>();
    for (const line of evidLines) {
      const normalized = line.trim().toLowerCase();
      if (normalized.length > 20 && seenLines.has(normalized)) {
        textIssues.push(`${tid}: ${t('Doppelte Zeile in Evidenz', 'Duplicate line in evidence', 'Ligne dupliquee dans la preuve')}`);
        break;
      }
      seenLines.add(normalized);
    }
    // Check for common typos
    const allText = `${th.evidence} ${th.rationale} ${th.name}`;
    const typoPatterns: [RegExp, string][] = [
      [/\bNetzwerkcan\b/i, 'Netzwerkcan->Netzwerkscan'],
      [/\bAush\b/, 'Aush->Auth'],
      [/\bSBM\b/, 'SBM->SBOM'],
      [/\bFur\b/, 'Fur->fuer'],
    ];
    for (const [pat, fix] of typoPatterns) {
      if (pat.test(allText)) {
        textIssues.push(`${tid}: ${t('Tippfehler', 'Typo', 'Faute de frappe')}: ${fix}`);
      }
    }
  }
  // Also check req texts
  for (const r of reqs) {
    const allText = `${r.evidence} ${r.rationale} ${r.gap} ${r.measure}`;
    const typoPatterns: [RegExp, string][] = [
      [/\bSBM\b/, 'SBM->SBOM'],
      [/\bFur\b/, 'Fur->fuer'],
      [/\bUber\b/, 'Uber->ueber'],
    ];
    for (const [pat, fix] of typoPatterns) {
      if (pat.test(allText)) {
        textIssues.push(`${r.id}: ${t('Tippfehler', 'Typo', 'Faute de frappe')}: ${fix}`);
      }
    }
  }
  checks.push({
    id: 'D4', category: 'editorial',
    label: t('Redaktionelle Qualitaet (Tippfehler, Duplikate)', 'Editorial quality (typos, duplicates)', 'Qualite editoriale (fautes, doublons)'),
    detail: textIssues.length > 0
      ? `${textIssues.length} ${t('Befunde', 'issues', 'problemes')}: ${textIssues.slice(0, 3).join('; ')}${textIssues.length > 3 ? ' ...' : ''}`
      : t('Keine Auffaelligkeiten', 'No issues found', 'Aucun probleme trouve'),
    passed: textIssues.length === 0, severity: 'minor',
  });

  // ═══ E. OT-SPEZIFISCHE PRÜFUNG ═══

  const hasOtProtocols = threats.some(th =>
    th.component.toLowerCase().includes('modbus') ||
    th.component.toLowerCase().includes('opc-ua') ||
    th.component.toLowerCase().includes('mqtt')
  );
  const otThreatsWithLowImpact = threats.filter(th =>
    (th.component.toLowerCase().includes('modbus') || th.component.toLowerCase().includes('opc-ua')) &&
    th.impact < 4
  );
  checks.push({
    id: 'E1', category: 'ot',
    label: t('OT-Kontext in Risikobewertung beruecksichtigt', 'OT context considered in risk assessment', 'Contexte OT pris en compte dans l\'evaluation'),
    detail: hasOtProtocols
      ? (otThreatsWithLowImpact.length > 0
        ? `${otThreatsWithLowImpact.map(threatId).join(', ')} ${t('mit zu niedrigem OT-Impact', 'with too low OT impact', 'avec impact OT trop bas')}`
        : t('OT-Impact korrekt kalibriert', 'OT impact correctly calibrated', 'Impact OT correctement calibre'))
      : t('Kein OT-Kontext erkannt', 'No OT context detected', 'Aucun contexte OT detecte'),
    passed: !hasOtProtocols || otThreatsWithLowImpact.length === 0, severity: 'critical',
  });

  // ─── Calculate Result ─────────────────────────────────────────
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const pct = Math.round((passed / checks.length) * 100);

  const verdict: QaResult['verdict'] = criticalErrors === 0 && pct >= 90 ? 'passed' : criticalErrors === 0 && pct >= 75 ? 'conditional' : 'failed';
  const verdictLabel = verdict === 'passed'
    ? t('BESTANDEN — Bericht revisionssicher', 'PASSED — Report audit-proof', 'REUSSI — Rapport pret pour audit')
    : verdict === 'conditional'
    ? t('BEDINGT BESTANDEN — Einzelne Punkte nacharbeiten', 'CONDITIONALLY PASSED — Minor corrections needed', 'REUSSI SOUS CONDITIONS — Corrections mineures necessaires')
    : t('NICHT BESTANDEN — Ueberarbeitung erforderlich', 'FAILED — Revision required', 'ECHOUE — Revision necessaire');

  const corrections = checks.filter(c => !c.passed && c.severity === 'critical').map(c => c.label + ': ' + c.detail);
  const optional = checks.filter(c => !c.passed && c.severity !== 'critical').map(c => c.label + ': ' + c.detail);

  return { checks, passed, failed, total: checks.length, criticalErrors, verdict, verdictLabel, corrections, optional };
}