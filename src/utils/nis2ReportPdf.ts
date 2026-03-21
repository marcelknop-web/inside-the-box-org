// NIS-2 Report PDF — refactored to use shared pdfCore engine
import type { Nis2IntakeData, Nis2Risk, Nis2Req } from '@/data/nis2ComplianceData';
import { riskId, RISK_CATEGORIES } from '@/data/nis2ComplianceData';
import type { QaCheck } from '@/utils/nis2QualityCheck';
import { createPdfDoc, C, LAYOUT } from '@/utils/pdfCore';

export interface Nis2ReportData {
  intakeData: Nis2IntakeData;
  risks: Nis2Risk[];
  reqs: Nis2Req[];
  language: 'de' | 'en' | 'fr';
  entityTypeName: string;
  criticalityName: string;
  isDraft?: boolean;
  qaChecks?: QaCheck[];
  fixLog?: string[];
  qaIterations?: number;
}

const I18N: Record<string, Record<string, string>> = {
  title: { de: 'NIS-2 Konformitätsbewertung', en: 'NIS-2 Compliance Assessment', fr: 'Évaluation de conformité NIS-2' },
  subtitle: { de: 'Prüfbericht nach Richtlinie (EU) 2022/2555', en: 'Assessment Report pursuant to Directive (EU) 2022/2555', fr: 'Rapport selon la directive (UE) 2022/2555' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'Rapport N°' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  entity: { de: 'Einrichtung', en: 'Entity', fr: 'Entité' },
  entityType: { de: 'Sektor', en: 'Sector', fr: 'Secteur' },
  criticality: { de: 'Einstufung', en: 'Classification', fr: 'Classification' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Komponente', en: 'Component', fr: 'Composant' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Evidenz', en: 'Evidence', fr: 'Éléments de preuve' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Rationale', fr: 'Fondement' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Évaluation du risque' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart identifié' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandée' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estimé' },
  nis2Ref: { de: 'NIS-2-Referenz', en: 'NIS-2 Reference', fr: 'Référence NIS-2' },
  draftWatermark: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },
  measures: { de: 'Maßnahme', en: 'Measure', fr: 'Mesure' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dok.', en: 'Doc.', fr: 'Doc.' },
  audited: { de: 'Audit', en: 'Audit', fr: 'Audit' },
  certified: { de: 'Zert.', en: 'Cert.', fr: 'Cert.' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  totalRisks: { de: 'Risiken', en: 'Risks', fr: 'Risques' },
  criticalRisks: { de: 'Kritisch', en: 'Critical', fr: 'Critiques' },
  nonCompliant: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformité' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

export async function generateNis2Report(data: Nis2ReportData): Promise<void> {
  const { intakeData, risks, reqs, language: lang, entityTypeName, criticalityName, isDraft } = data;
  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  const pdf = await createPdfDoc({
    lang,
    isDraft,
    reportPrefix: 'NIS2',
    confidentialLabel: l('confidential', lang),
    pageLabel: l('page', lang),
    draftWatermark: l('draftWatermark', lang),
  });

  // ═══ COVER PAGE ═══
  pdf.coverPage({
    title: l('title', lang),
    subtitle: l('subtitle', lang),
    entityName: intakeData.entityName,
    fields: [
      [l('entityType', lang), entityTypeName],
      [l('criticality', lang), criticalityName],
      [l('generated', lang), today],
      [l('reportId', lang), pdf.reportId],
    ],
    confidentialNote: l('confidential', lang) + '  —  ' + (lang === 'de' ? 'Nur für den internen Gebrauch des Empfängers bestimmt' : 'For internal use of the recipient only'),
  });

  // ═══ MANAGEMENT SUMMARY ═══
  const passCount = reqs.filter(r => r.status === 'pass').length;
  const partCount = reqs.filter(r => r.status === 'partial').length;
  const failCount = reqs.filter(r => r.status === 'fail').length;
  const critCount = risks.filter(r => r.likelihood * r.impact >= 20).length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);

  pdf.newPage();
  pdf.heading(lang === 'de' ? '1  Zusammenfassung für die Geschäftsleitung' : '1  Management Summary');

  const verdictText = lang === 'de'
    ? `${intakeData.entityName} erreicht derzeit ${complianceRate}% NIS-2-Konformität. ${risks.length} Risikoszenarien identifiziert, davon ${critCount} kritisch. Von ${reqs.length} Anforderungen bestehen ${failCount} Lücken.`
    : `${intakeData.entityName} currently achieves ${complianceRate}% NIS-2 compliance. ${risks.length} risk scenarios identified, ${critCount} critical. Of ${reqs.length} requirements, ${failCount} gaps remain.`;
  pdf.verdictBox(verdictText);

  pdf.kpiRow([
    [String(risks.length), l('totalRisks', lang)],
    [String(critCount), l('criticalRisks', lang)],
    [String(failCount), l('nonCompliant', lang)],
    [`${complianceRate}%`, l('complianceRate', lang)],
  ]);

  // ═══ SCOPE ═══
  pdf.newPage();
  pdf.heading(lang === 'de' ? '2  Gegenstand der Prüfung' : '2  Scope of Assessment');
  pdf.field(l('entity', lang), intakeData.entityName);
  pdf.field(l('entityType', lang), entityTypeName);
  pdf.field(l('criticality', lang), criticalityName);
  if (intakeData.description) pdf.bodyParagraph(intakeData.description);
  if (intakeData.infrastructure.length > 0) pdf.field(lang === 'de' ? 'Infrastruktur' : 'Infrastructure', intakeData.infrastructure.join(', '));
  if (intakeData.supplyChainProviders.length > 0) pdf.field(lang === 'de' ? 'Lieferanten' : 'Suppliers', intakeData.supplyChainProviders.join(', '));
  if (intakeData.roles.length > 0) pdf.field(lang === 'de' ? 'Rollen' : 'Roles', intakeData.roles.join(', '));
  if (intakeData.knownIssues) {
    pdf.heading(lang === 'de' ? '2.1  Bekannte Schwachstellen' : '2.1  Known Weaknesses', 2);
    pdf.bodyParagraph(intakeData.knownIssues);
  }

  // ═══ RISKS ═══
  pdf.newPage();
  pdf.heading(lang === 'de' ? '3  Feststellungen — Risikolandschaft' : '3  Findings — Risk Landscape');
  pdf.introText(lang === 'de'
    ? 'Jedes Risikoszenario wird nach Eintrittswahrscheinlichkeit (1-5) und Auswirkung (1-5) bewertet.'
    : 'Each risk scenario is rated by likelihood (1-5) and impact (1-5).');

  risks.forEach(ri => {
    pdf.checkSpace(50);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');

    pdf.heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    pdf.metaLine(`${RISK_CATEGORIES[ri.category]?.label[lang] || ri.category}  |  ${sev}  |  ${ri.nis2Ref}  |  ${lang === 'de' ? 'Evidenz' : 'Evidence'}: ${ri.evidenceQuality}/5`);
    pdf.scoreBar(`${l('riskScore', lang)}: ${ri.likelihood} × ${ri.impact} = ${score} (${sev})`);

    pdf.fieldInline(l('component', lang), ri.component);
    pdf.fieldInline(l('attacker', lang), ri.attacker);
    pdf.fieldInline(l('attackPath', lang), ri.path);
    pdf.y += 2;
    pdf.bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    pdf.bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) pdf.bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);
    pdf.separator();
  });

  // ═══ REQUIREMENTS ═══
  pdf.newPage();
  pdf.heading(lang === 'de' ? '4  NIS-2-Konformitätslücken' : '4  NIS-2 Compliance Gaps');
  reqs.forEach(r => {
    pdf.checkSpace(42);
    pdf.heading(`${r.id}: ${r.name}`, 3);
    pdf.checkSpace(8);
    const afterBadge = pdf.statusBadge(r.status);
    pdf.doc.setFont(pdf.headFontName, 'normal'); pdf.doc.setFontSize(7); pdf.doc.setTextColor(...C.mid);
    pdf.doc.text(r.article, afterBadge, pdf.y);
    pdf.y += 6; pdf.doc.setTextColor(...C.dark);

    pdf.bodyText(`${l('evidence', lang)}: ${r.evidence}`, 0);
    pdf.bodyText(`${l('rationale', lang)}: ${r.rationale}`, 0);
    if (r.gap) pdf.bodyText(`${l('gap', lang)}: ${r.gap}`, 0);
    if (r.measure) pdf.bodyText(`${l('measureAction', lang)}: ${r.measure}`, 0);
    if (r.effort) pdf.fieldInline(l('effort', lang), r.effort);
    if (r.priority) pdf.fieldInline(l('priority', lang), r.priority);
    if (r.criteria && r.criteria.length > 0) {
      pdf.sectionLabel(lang === 'de' ? 'UMSETZUNGSKRITERIEN' : 'ACCEPTANCE CRITERIA');
      r.criteria.forEach((c, i) => pdf.bulletItem(`${i + 1}. ${c}`, 4));
    }
    pdf.separator();
  });

  // ═══ RECOMMENDATIONS ═══
  pdf.newPage();
  pdf.heading(lang === 'de' ? '5  Handlungsempfehlungen' : '5  Recommendations');
  for (const prio of ['P0', 'P1', 'P2', 'P3']) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    const prioLabel: Record<string, string> = {
      P0: lang === 'de' ? 'P0 — Sofort' : 'P0 — Immediate',
      P1: lang === 'de' ? 'P1 — 3 Monate' : 'P1 — 3 months',
      P2: lang === 'de' ? 'P2 — 6 Monate' : 'P2 — 6 months',
      P3: lang === 'de' ? 'P3 — Empfohlen' : 'P3 — Recommended',
    };
    pdf.heading(prioLabel[prio] || prio, 2);
    prioReqs.forEach(r => {
      pdf.checkSpace(20);
      pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(9); pdf.doc.setTextColor(...C.navy);
      pdf.doc.text(`[${r.id}: ${r.name}]`, LAYOUT.LEFT + 4, pdf.y);
      pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setTextColor(...C.dark); pdf.y += 6;
      if (r.measure) pdf.bodyText(r.measure, 4);
      if (r.effort) pdf.fieldInline(l('effort', lang), r.effort, 4);
      pdf.y += 3;
    });
  }

  // ═══ QA ═══
  if (data.qaChecks && data.qaChecks.length > 0) {
    pdf.newPage();
    pdf.heading(lang === 'de' ? '6  Qualitätssicherung' : '6  Quality Assurance');
    const catLabelsMap: Record<string, string> = {
      consistency: lang === 'de' ? 'Konsistenzprüfung' : 'Consistency',
      technical: lang === 'de' ? 'Fachliche Korrektheit' : 'Technical',
      evidence: lang === 'de' ? 'Evidenzprüfung' : 'Evidence',
      editorial: lang === 'de' ? 'Redaktionell' : 'Editorial',
      regulatory: lang === 'de' ? 'Regulatorisch' : 'Regulatory',
      'golden-rule': lang === 'de' ? 'Goldene Regeln' : 'Golden Rules',
    };
    pdf.qaChecks(
      data.qaChecks,
      ['consistency', 'technical', 'evidence', 'editorial', 'regulatory', 'golden-rule'],
      catLabelsMap,
      lang === 'de' ? 'Durchläufe' : 'Iterations',
      data.qaIterations
    );
  }
  if (data.fixLog && data.fixLog.length > 0) {
    pdf.heading(lang === 'de' ? '6.1  Automatisierte Korrekturen' : '6.1  Automated Corrections', 2);
    pdf.fixLog(data.fixLog);
  }

  // ═══ DISCLAIMER ═══
  pdf.y += 5;
  pdf.heading(lang === 'de' ? '7  Einschränkungen und Haftungsausschluss' : '7  Limitations and Disclaimer');
  pdf.bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den Informationen zum Prüfungszeitpunkt. Er ersetzt keine offizielle Prüfung durch BSI oder eine andere zuständige Behörde. Für Vollständigkeit und Richtigkeit wird keine Haftung übernommen. Der Bericht ist vertraulich.'
    : 'This report is based on information available at the time of assessment. It does not replace an official audit by the competent authority. No liability is assumed. The report is confidential.');

  // ═══ SAVE ═══
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  pdf.save(`NIS2_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
