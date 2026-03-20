/**
 * DORA Report Quality Check — Automated Audit Validation
 * Based on DORA (EU) 2022/2554 audit rules
 * Mirrors CRA quality check architecture with DORA-specific checks
 *
 * RULE: No content is invented. All checks validate existing data consistency.
 */
import type { DoraRisk, DoraReq, DoraIntakeData } from '@/data/doraData';
import { riskId } from '@/data/doraData';

/** Check if a risk's doraRef matches a requirement's article (supports partial matching) */
function refsMatch(riskRef: string, reqArticle: string): boolean {
  if (riskRef === reqArticle) return true;
  // Extract base article (e.g. "Art. 9" from "Art. 9 Abs. 1-2")
  const baseRisk = riskRef.split(' Abs.')[0].split(' lit.')[0];
  const baseReq = reqArticle.split(' Abs.')[0].split(' lit.')[0];
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
  corrections: string[];
  optional: string[];
}

export function runDoraQualityCheck(
  risks: DoraRisk[],
  reqs: DoraReq[],
  lang: 'de' | 'en' | 'fr' = 'de',
  intakeData?: DoraIntakeData
): QaResult {
  const checks: QaCheck[] = [];
  const t = (de: string, en: string, fr: string) => lang === 'de' ? de : lang === 'fr' ? fr : en;

  // ═══ A. KONSISTENZPRÜFUNG ═══

  // A1: Risk count
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  checks.push({
    id: 'A1-1', category: 'consistency',
    label: t('Risiko-Anzahl konsistent', 'Risk count consistent', 'Nombre de risques coherent'),
    detail: `${risks.length} ${t('Risiken identifiziert', 'risks identified', 'risques identifies')}`,
    passed: risks.length > 0, severity: 'critical',
  });

  // A1-2: Status distribution = total
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

  // A2: Bidirectional traceability: non-pass reqs should have linked risks
  const nonPassReqsWithoutRisks = reqs.filter(r => r.status !== 'pass' && !risks.some(ri => refsMatch(ri.doraRef, r.article)));
  checks.push({
    id: 'A2-1', category: 'consistency',
    label: t('Bidirektionale Traceability: Nicht-konforme Anforderungen mit Risiko-Verknüpfung', 'Bidirectional traceability: Non-compliant requirements linked to risks', 'Tracabilite bidirectionnelle'),
    detail: nonPassReqsWithoutRisks.length > 0
      ? `${t('Ohne Risiko-Verknüpfung', 'Missing risk links', 'Liens manquants')}: ${nonPassReqsWithoutRisks.map(r => r.id).join(', ')}`
      : t('Alle verknüpft', 'All linked', 'Toutes liees'),
    passed: nonPassReqsWithoutRisks.length === 0, severity: 'critical',
  });

  // A3: No "pass" with violating risks (score >= 13)
  const passReqsWithViolatingRisks = reqs.filter(r => {
    if (r.status !== 'pass') return false;
    return risks.some(ri => refsMatch(ri.doraRef, r.article) && ri.likelihood * ri.impact >= 13);
  });
  checks.push({
    id: 'A3-1', category: 'consistency',
    label: t('Kein "konform" bei verletzenden Risiken (Score >= 13)', 'No "compliant" with violating risks (score >= 13)', 'Pas de "conforme" avec risques >= 13'),
    detail: passReqsWithViolatingRisks.length > 0
      ? `${passReqsWithViolatingRisks.map(r => r.id).join(', ')} ${t('als konform, aber Risiken verletzen diese', 'marked compliant but risks violate them', 'marquees conformes mais violees')}`
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: passReqsWithViolatingRisks.length === 0, severity: 'critical',
  });

  // A3-1b: No "partial" with critical risks (>= 20)
  const partialReqsWithCriticalRisks = reqs.filter(r => {
    if (r.status !== 'partial') return false;
    return risks.some(ri => refsMatch(ri.doraRef, r.article) && ri.likelihood * ri.impact >= 20);
  });
  checks.push({
    id: 'A3-1b', category: 'consistency',
    label: t('Kein "teilweise konform" bei kritischen Risiken (Score >= 20)', 'No "partial" with critical risks (>= 20)', 'Pas de "partiel" avec risques critiques'),
    detail: partialReqsWithCriticalRisks.length > 0
      ? `${partialReqsWithCriticalRisks.map(r => r.id).join(', ')}`
      : t('Konsistent', 'Consistent', 'Coherent'),
    passed: partialReqsWithCriticalRisks.length === 0, severity: 'critical',
  });

  // A4: Risk category distribution — each component >= 2 categories
  const catPerComponent = new Map<string, Set<string>>();
  for (const ri of risks) {
    const comp = ri.component.split('—')[0].trim();
    if (!catPerComponent.has(comp)) catPerComponent.set(comp, new Set());
    catPerComponent.get(comp)!.add(ri.category);
  }
  const compsWithLessThan2 = [...catPerComponent.entries()].filter(([, s]) => s.size < 2);
  checks.push({
    id: 'A4-1', category: 'consistency',
    label: t('Risikokategorie-Verteilung: Jede Komponente >= 2 Kategorien', 'Risk category distribution: Each component >= 2 categories', 'Distribution des categories >= 2 par composant'),
    detail: compsWithLessThan2.length > 0
      ? `${compsWithLessThan2.map(([c, s]) => `${c} (${s.size})`).join(', ')}`
      : t('Alle ausreichend abgedeckt', 'All sufficiently covered', 'Tous couverts'),
    passed: compsWithLessThan2.length === 0, severity: 'major',
  });

  // ═══ B. FACHLICHE KORREKTHEIT ═══

  // B1: D8-1 Schutzmaßnahmen — if unencrypted internal comms exist, must be fail
  const d81 = reqs.find(r => r.id === 'D8-1');
  const hasUnencryptedRisk = risks.some(ri =>
    ri.name.toLowerCase().includes('unverschlüssel') || ri.name.toLowerCase().includes('klartext') ||
    ri.name.toLowerCase().includes('unverschlüsselt') || ri.name.toLowerCase().includes('ohne tls')
  );
  checks.push({
    id: 'B1', category: 'technical',
    label: t('D8-1 Schutzmaßnahmen korrekt bewertet', 'D8-1 Protection measures correctly rated', 'D8-1 correctement evalue'),
    detail: hasUnencryptedRisk && d81?.status !== 'fail'
      ? t(`Unverschlüsselte Kommunikation vorhanden, aber D8-1 als "${d81?.status}" — muss "nicht konform" sein`,
          `Unencrypted comms present but D8-1 "${d81?.status}" — must be fail`,
          `Communication non chiffree mais D8-1 "${d81?.status}"`)
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasUnencryptedRisk && d81 && d81.status !== 'fail'), severity: 'critical',
  });

  // B2: D9-2 Access control — if IDOR/auth issues exist, must be fail
  const d92 = reqs.find(r => r.id === 'D9-2');
  const hasAuthRisk = risks.some(ri =>
    ri.name.toLowerCase().includes('idor') || ri.name.toLowerCase().includes('zugriffsschutz') ||
    ri.name.toLowerCase().includes('unauthentifiziert') || ri.name.toLowerCase().includes('unzureichend')
  );
  checks.push({
    id: 'B2', category: 'technical',
    label: t('D9-2 Zugangskontrolle korrekt bewertet', 'D9-2 Access control correctly rated', 'D9-2 correctement evalue'),
    detail: hasAuthRisk && d92?.status === 'pass'
      ? t('Auth-Schwachstelle vorhanden, aber D9-2 als "konform"', 'Auth weakness present but D9-2 "compliant"', 'Faiblesse auth presente mais D9-2 "conforme"')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasAuthRisk && d92?.status === 'pass'), severity: 'critical',
  });

  // B3: D19-1 Incident reporting — 4h timeline must be fail if not implemented
  const d191 = reqs.find(r => r.id === 'D19-1');
  const hasIncidentRisk = risks.some(ri => ri.doraRef.includes('Art. 19'));
  checks.push({
    id: 'B3', category: 'technical',
    label: t('D19-1 Meldepflichten korrekt bewertet', 'D19-1 Incident reporting correctly rated', 'D19-1 correctement evalue'),
    detail: hasIncidentRisk && d191?.status === 'pass'
      ? t('Meldefrist-Risiko vorhanden, aber D19-1 als "konform"', 'Reporting deadline risk present but D19-1 "compliant"', 'Risque de delai mais D19-1 "conforme"')
      : t('Korrekt', 'Correct', 'Correct'),
    passed: !(hasIncidentRisk && d191?.status === 'pass'), severity: 'critical',
  });

  // B4: Effort/Priority for all non-pass reqs
  const nonPassWithoutEffort = reqs.filter(r => r.status !== 'pass' && (!r.effort || r.effort.trim() === ''));
  checks.push({
    id: 'B4', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen haben Aufwandsschätzung', 'All non-compliant requirements have effort estimates', 'Toutes les exigences non conformes avec effort'),
    detail: nonPassWithoutEffort.length > 0
      ? `${t('Ohne Aufwand', 'Missing effort', 'Effort manquant')}: ${nonPassWithoutEffort.map(r => r.id).join(', ')}`
      : t('Alle mit Aufwand', 'All have effort', 'Toutes avec effort'),
    passed: nonPassWithoutEffort.length === 0, severity: 'critical',
  });

  const nonPassWithoutPriority = reqs.filter(r => r.status !== 'pass' && (!r.priority || r.priority.trim() === ''));
  checks.push({
    id: 'B5', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen haben Priorität', 'All non-compliant requirements have priority', 'Toutes avec priorite'),
    detail: nonPassWithoutPriority.length > 0
      ? `${t('Ohne Priorität', 'Missing priority', 'Priorite manquante')}: ${nonPassWithoutPriority.map(r => r.id).join(', ')}`
      : t('Alle priorisiert', 'All prioritised', 'Toutes priorisees'),
    passed: nonPassWithoutPriority.length === 0, severity: 'critical',
  });

  // B6: Gap completeness
  const nonPassWithoutGap = reqs.filter(r => r.status !== 'pass' && (!r.gap || r.gap.trim() === ''));
  checks.push({
    id: 'B6', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Gap-Beschreibung', 'All non-compliant requirements have gap description', 'Toutes avec description de gap'),
    detail: nonPassWithoutGap.length > 0
      ? `${t('Ohne Gap', 'Missing gap', 'Gap manquant')}: ${nonPassWithoutGap.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentees'),
    passed: nonPassWithoutGap.length === 0, severity: 'major',
  });

  // B7: Measure completeness
  const nonPassWithoutMeasure = reqs.filter(r => r.status !== 'pass' && (!r.measure || r.measure.trim() === ''));
  checks.push({
    id: 'B7', category: 'technical',
    label: t('Alle nicht-konformen Anforderungen mit Maßnahme', 'All non-compliant requirements have measure', 'Toutes avec mesure'),
    detail: nonPassWithoutMeasure.length > 0
      ? `${t('Ohne Maßnahme', 'Missing measure', 'Mesure manquante')}: ${nonPassWithoutMeasure.map(r => r.id).join(', ')}`
      : t('Alle dokumentiert', 'All documented', 'Toutes documentees'),
    passed: nonPassWithoutMeasure.length === 0, severity: 'major',
  });

  // ═══ C. EVIDENZPRÜFUNG ═══

  const risksWithWeakEvidence = critRisks.filter(r => r.evidenceQuality < 4);
  checks.push({
    id: 'C1', category: 'evidence',
    label: t('Kritische Risiken haben ausreichende Evidenz (4/5+)', 'Critical risks have sufficient evidence (4/5+)', 'Risques critiques avec preuve suffisante'),
    detail: risksWithWeakEvidence.length > 0
      ? `${risksWithWeakEvidence.map(r => `${riskId(r)} (${r.evidenceQuality}/5)`).join(', ')}`
      : t('Alle mit ausreichender Evidenz', 'All with sufficient evidence', 'Toutes avec preuve suffisante'),
    passed: risksWithWeakEvidence.length === 0, severity: 'major',
  });

  const highRisks = risks.filter(r => r.likelihood * r.impact >= 15 && r.evidenceQuality < 3);
  checks.push({
    id: 'C1b', category: 'evidence',
    label: t('Hohe Risiken (>= 15) mit Mindest-Evidenz (3/5+)', 'High risks (>= 15) with min evidence (3/5+)', 'Risques eleves avec preuve minimale'),
    detail: highRisks.length > 0
      ? `${highRisks.map(r => `${riskId(r)} (${r.evidenceQuality}/5)`).join(', ')}`
      : t('Alle mit Mindest-Evidenz', 'All with min evidence', 'Toutes avec preuve minimale'),
    passed: highRisks.length === 0, severity: 'major',
  });

  const risksWithoutSources = risks.filter(r => !r.sources || r.sources.length === 0);
  checks.push({
    id: 'C2', category: 'evidence',
    label: t('Alle Risiken mit Quellenreferenzen', 'All risks with source references', 'Tous les risques avec references'),
    detail: risksWithoutSources.length > 0
      ? `${risksWithoutSources.map(riskId).join(', ')}`
      : t('Alle mit Quellen', 'All with sources', 'Toutes avec sources'),
    passed: risksWithoutSources.length === 0, severity: 'minor',
  });

  // ═══ D. REDAKTIONELLE PRÜFUNG ═══

  // D1: Sequential numbering
  const ids = reqs.map(r => r.id);
  const hasDuplicateIds = new Set(ids).size < ids.length;
  checks.push({
    id: 'D1', category: 'editorial',
    label: t('Eindeutige Anforderungs-IDs', 'Unique requirement IDs', 'IDs uniques'),
    detail: hasDuplicateIds ? t('Doppelte IDs gefunden', 'Duplicate IDs found', 'IDs dupliques trouvees') : t('Alle eindeutig', 'All unique', 'Toutes uniques'),
    passed: !hasDuplicateIds, severity: 'major',
  });

  // D2: All reqs have article reference
  const refsWithoutArticle = reqs.filter(r => !r.article || r.article.trim() === '');
  checks.push({
    id: 'D2', category: 'editorial',
    label: t('Alle Anforderungen mit Artikel-Referenz', 'All requirements with article reference', 'Toutes avec reference'),
    detail: refsWithoutArticle.length > 0
      ? `${refsWithoutArticle.map(r => r.id).join(', ')}`
      : t('Alle referenziert', 'All referenced', 'Toutes referencees'),
    passed: refsWithoutArticle.length === 0, severity: 'major',
  });

  // D3: Typo detection
  const typoMap: [string, string][] = [
    ['Netzwerkcan', 'Netzwerkscan'], ['Aush', 'Auth'], ['SBM', 'SBOM'],
    ['Fur', 'für'], ['Uber', 'über'],
  ];
  let typoCount = 0;
  const checkTypos = (text: string) => {
    for (const [wrong] of typoMap) {
      if (new RegExp(`\\b${wrong}\\b`, 'gi').test(text)) typoCount++;
    }
  };
  risks.forEach(r => { checkTypos(r.evidence); checkTypos(r.rationale); checkTypos(r.name); });
  reqs.forEach(r => { checkTypos(r.evidence); checkTypos(r.rationale); checkTypos(r.gap); checkTypos(r.measure); });
  checks.push({
    id: 'D3', category: 'editorial',
    label: t('Keine bekannten Tippfehler', 'No known typos', 'Pas de fautes de frappe'),
    detail: typoCount > 0
      ? `${typoCount} ${t('Tippfehler gefunden', 'typos found', 'fautes trouvees')}`
      : t('Keine gefunden', 'None found', 'Aucune trouvee'),
    passed: typoCount === 0, severity: 'minor',
  });

  // ═══ E. REGULATORISCHE PRÜFUNG (DORA-spezifisch) ═══

  // E1: Art. 5 — Governance check: management responsibility must be addressed
  const d51 = reqs.find(r => r.article.includes('Art. 5'));
  checks.push({
    id: 'E1', category: 'regulatory',
    label: t('Art. 5 Leitungsverantwortung geprüft', 'Art. 5 Management responsibility assessed', 'Art. 5 Responsabilite evaluee'),
    detail: d51 ? t('Geprüft', 'Assessed', 'Evalue') : t('Art. 5 fehlt im Bericht', 'Art. 5 missing', 'Art. 5 manquant'),
    passed: !!d51, severity: 'critical',
  });

  // E2: Art. 19 — Incident reporting must be assessed
  const art19 = reqs.find(r => r.article.includes('Art. 19'));
  checks.push({
    id: 'E2', category: 'regulatory',
    label: t('Art. 19 Meldepflichten bewertet', 'Art. 19 Incident reporting assessed', 'Art. 19 Obligations evaluees'),
    detail: art19 ? t('Geprüft', 'Assessed', 'Evalue') : t('Art. 19 fehlt', 'Art. 19 missing', 'Art. 19 manquant'),
    passed: !!art19, severity: 'critical',
  });

  // E3: Art. 28 — Third-party risk must be assessed
  const art28 = reqs.find(r => r.article.includes('Art. 28'));
  checks.push({
    id: 'E3', category: 'regulatory',
    label: t('Art. 28 Drittanbieter-Risikomanagement bewertet', 'Art. 28 Third-party risk assessed', 'Art. 28 Risques tiers evaluees'),
    detail: art28 ? t('Geprüft', 'Assessed', 'Evalue') : t('Art. 28 fehlt', 'Art. 28 missing', 'Art. 28 manquant'),
    passed: !!art28, severity: 'critical',
  });

  // E4: Art. 26 — TLPT required for significant/critical entities
  const d261 = reqs.find(r => r.article.includes('Art. 26'));
  const needsTlpt = intakeData && (intakeData.criticality === 'significant' || intakeData.criticality === 'critical');
  checks.push({
    id: 'E4', category: 'regulatory',
    label: t('Art. 26 TLPT-Anforderung bewertet', 'Art. 26 TLPT requirement assessed', 'Art. 26 Exigence TLPT evaluee'),
    detail: needsTlpt && !d261
      ? t('Signifikantes/kritisches Institut — TLPT-Prüfung fehlt', 'Significant/critical entity — TLPT check missing', 'Entite significative — verification TLPT manquante')
      : t('Geprüft', 'Assessed', 'Evalue'),
    passed: !(needsTlpt && !d261), severity: 'critical',
  });

  // ═══ VERDICT ═══
  const passed = checks.filter(c => c.passed).length;
  const failed = checks.filter(c => !c.passed).length;
  const criticalErrors = checks.filter(c => !c.passed && c.severity === 'critical').length;
  const total = checks.length;

  const verdict: QaResult['verdict'] =
    criticalErrors > 0 ? 'failed' :
    failed > 0 ? 'conditional' : 'passed';

  const verdictLabel = verdict === 'passed'
    ? t('QUALITY GATE: BESTANDEN', 'QUALITY GATE: PASSED', 'QUALITY GATE: REUSSI')
    : verdict === 'conditional'
    ? t(`QUALITY GATE: BEDINGT (${passed}/${total})`, `QUALITY GATE: CONDITIONAL (${passed}/${total})`, `QUALITY GATE: CONDITIONNEL (${passed}/${total})`)
    : t(`QUALITY GATE: NICHT BESTANDEN (${passed}/${total})`, `QUALITY GATE: FAILED (${passed}/${total})`, `QUALITY GATE: ECHOUE (${passed}/${total})`);

  const corrections = checks.filter(c => !c.passed && (c.severity === 'critical' || c.severity === 'major')).map(c => `${c.id}: ${c.label} — ${c.detail}`);
  const optional = checks.filter(c => !c.passed && c.severity === 'minor').map(c => `${c.id}: ${c.label}`);

  return { checks, passed, failed, total, criticalErrors, verdict, verdictLabel, corrections, optional };
}
