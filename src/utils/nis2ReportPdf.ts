// NIS-2 Report PDF — full audit report matching DORA detail level
// Uses shared pdfCore engine for professional typography and layout
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

/* ════════════════════════════════════════════════════════════
   I18N
   ════════════════════════════════════════════════════════════ */
const I18N: Record<string, Record<string, string>> = {
  title: { de: 'NIS-2 Konformitätsbewertung', en: 'NIS-2 Compliance Assessment', fr: 'Évaluation de conformité NIS-2' },
  subtitle: { de: 'Prüfbericht nach Richtlinie (EU) 2022/2555', en: 'Assessment Report pursuant to Directive (EU) 2022/2555', fr: 'Rapport selon la directive (UE) 2022/2555' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'Rapport N°' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  sec1: { de: '1  Ausgangslage und Zielsetzung', en: '1  Context and Objectives', fr: '1  Contexte et objectifs' },
  sec2: { de: '2  Zusammenfassung für die Geschäftsleitung', en: '2  Management Summary', fr: '2  Synthèse pour la direction' },
  sec3: { de: '3  Gegenstand der Prüfung', en: '3  Scope of Assessment', fr: '3  Périmètre de l\'évaluation' },
  sec3a: { de: '3.1  Einrichtungsprofil', en: '3.1  Entity Profile', fr: '3.1  Profil de l\'entité' },
  sec3b: { de: '3.2  Infrastruktur und Lieferkette', en: '3.2  Infrastructure and Supply Chain', fr: '3.2  Infrastructure et chaîne d\'approvisionnement' },
  sec3c: { de: '3.3  Implementierte Sicherheitsmaßnahmen', en: '3.3  Implemented Security Measures', fr: '3.3  Mesures de sécurité mises en œuvre' },
  sec3d: { de: '3.4  Bekannte Schwachstellen', en: '3.4  Known Weaknesses', fr: '3.4  Faiblesses connues' },
  sec3e: { de: '3.5  Eingereichte Dokumentation', en: '3.5  Submitted Documentation', fr: '3.5  Documentation soumise' },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Detailed Findings', fr: '4  Constatations détaillées' },
  sec4a: { de: '4.1  Risikolandschaft', en: '4.1  Risk Landscape', fr: '4.1  Paysage des risques' },
  sec4b: { de: '4.2  NIS-2-Konformitätslücken', en: '4.2  NIS-2 Compliance Gaps', fr: '4.2  Lacunes de conformité NIS-2' },
  sec5: { de: '5  Handlungsempfehlungen und Roadmap', en: '5  Recommendations and Roadmap', fr: '5  Recommandations et feuille de route' },
  sec5a: { de: '5.1  Priorisierte Maßnahmen (P0-P3)', en: '5.1  Prioritised Measures (P0-P3)', fr: '5.1  Mesures priorisées (P0-P3)' },
  sec5b: { de: '5.2  Umsetzungs-Roadmap', en: '5.2  Remediation Roadmap', fr: '5.2  Feuille de route de remédiation' },
  sec5c: { de: '5.3  Wirtschaftliche Betrachtung', en: '5.3  Economic Impact Assessment', fr: '5.3  Analyse économique' },
  sec6: { de: '6  Methodik und Prüfungsgrundlagen', en: '6  Methodology and Audit Standards', fr: '6  Méthodologie et normes d\'audit' },
  sec6a: { de: '6.1  Risikobewertungsmatrix', en: '6.1  Risk Rating Matrix', fr: '6.1  Matrice d\'évaluation des risques' },
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilité' },
  secA: { de: 'A  Strukturierte Prüfdaten (maschinenlesbar)', en: 'A  Structured Audit Data (machine-readable)', fr: 'A  Données d\'audit structurées' },
  secB: { de: 'B  Prüfwerkzeuge und Versionen', en: 'B  Tools and Versions', fr: 'B  Outils et versions' },
  secC: { de: 'C  Evidenz-Material-Index', en: 'C  Evidence Material Index', fr: 'C  Index des éléments de preuve' },
  secD: { de: 'D  Qualitätssicherung', en: 'D  Quality Assurance', fr: 'D  Assurance qualité' },
  secE: { de: 'E  Arbeitspapiere (Working Papers)', en: 'E  Working Papers', fr: 'E  Papiers de travail' },
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
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  totalRisks: { de: 'Risiken', en: 'Risks', fr: 'Risques' },
  criticalRisks: { de: 'Kritisch', en: 'Critical', fr: 'Critiques' },
  nonCompliant: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformité' },
  measures: { de: 'Maßnahme', en: 'Measure', fr: 'Mesure' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dok.', en: 'Doc.', fr: 'Doc.' },
  audited: { de: 'Audit', en: 'Audit', fr: 'Audit' },
  certified: { de: 'Zert.', en: 'Cert.', fr: 'Cert.' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noFilesSubmitted: { de: 'Keine Dokumente eingereicht.', en: 'No documents submitted.', fr: 'Aucun document soumis.' },
  draftWatermark: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

/* ════════════════════════════════════════════════════════════
   Prose blocks — proper sentences, not staccato
   ════════════════════════════════════════════════════════════ */
function getContextText(name: string, typeName: string, critName: string, date: string, lang: string, intake?: Nis2IntakeData): string {
  let landscapeDe = '';
  let landscapeEn = '';
  if (intake) {
    const infraList = intake.infrastructure.length > 0 ? intake.infrastructure.join(', ') : null;
    const scList = intake.supplyChainProviders.length > 0 ? intake.supplyChainProviders.join(', ') : null;
    const measureCount = Object.entries(intake.measures).filter(([, m]) => m.active).length;
    const certCount = Object.entries(intake.measures).filter(([, m]) => m.certified).length;
    const auditCount = Object.entries(intake.measures).filter(([, m]) => m.audited).length;
    if (infraList || scList) {
      landscapeDe = `\n\nDie technische Infrastruktur von ${name} umfasst ${infraList ? `die folgenden Kernkomponenten: ${infraList}` : 'nicht näher spezifizierte Systeme'}.`;
      if (scList) landscapeDe += ` In der Lieferkette stützt sich die Einrichtung auf folgende Dienstleister: ${scList}.`;
      landscapeDe += ` Von den ${Object.keys(intake.measures).length} bewerteten Sicherheitsmaßnahmen sind ${measureCount} aktiv implementiert`;
      if (auditCount > 0) landscapeDe += `, ${auditCount} davon auditiert`;
      if (certCount > 0) landscapeDe += ` und ${certCount} zertifiziert`;
      landscapeDe += '.';

      landscapeEn = `\n\nThe technical infrastructure of ${name} encompasses ${infraList ? `the following core components: ${infraList}` : 'systems not further specified'}.`;
      if (scList) landscapeEn += ` Within the supply chain, the entity relies on the following providers: ${scList}.`;
      landscapeEn += ` Of the ${Object.keys(intake.measures).length} assessed security measures, ${measureCount} are actively implemented`;
      if (auditCount > 0) landscapeEn += `, ${auditCount} audited`;
      if (certCount > 0) landscapeEn += ` and ${certCount} certified`;
      landscapeEn += '.';
    }
  }
  if (lang === 'de') return `Am ${date} wurde für ${name} (Sektor: ${typeName}, Einstufung: ${critName}) eine Konformitätsbewertung nach der Richtlinie (EU) 2022/2555 — der NIS-2-Richtlinie — durchgeführt. Die Bewertung orientiert sich an den Anforderungen der Artikel 20 (Verantwortung der Geschäftsleitung), 21 (Risikomanagementmaßnahmen) und 23 (Meldepflichten).${landscapeDe}\n\nDer Bericht richtet sich an die Geschäftsleitung, die Informationssicherheitsbeauftragten, die Compliance-Abteilung sowie — im Prüfungsfall — an die zuständige nationale Aufsichtsbehörde.`;
  return `On ${date}, a compliance assessment was conducted for ${name} (sector: ${typeName}, classification: ${critName}) pursuant to Directive (EU) 2022/2555 — the NIS-2 Directive. The assessment covers the requirements of Articles 20 (governance responsibilities), 21 (risk management measures), and 23 (reporting obligations).${landscapeEn}\n\nThis report is intended for the board and executive management, information security officers, the compliance function, and — in the event of a supervisory review — the competent national authority.`;
}

function getMgmtSummary(name: string, risks: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, passReqs: number, lang: string) {
  const rate = totalReqs > 0 ? Math.round(((passReqs + partialReqs * 0.5) / totalReqs) * 100) : 0;
  const ready = crit === 0 && failReqs === 0;
  const partial = !ready && rate >= 60;

  const totalEffortMin = failReqs * 20 + partialReqs * 10;
  const totalEffortMax = failReqs * 60 + partialReqs * 30;
  const effortPM = totalEffortMax > 0 ? `${Math.ceil(totalEffortMin / 160)}-${Math.ceil(totalEffortMax / 160)}` : '0';
  const p0Count = failReqs;
  const timelineWeeks = crit > 0 ? (lang === 'de' ? '4-6 Wochen' : '4-6 weeks') : (lang === 'de' ? '3-6 Monate' : '3-6 months');

  if (lang === 'de') {
    return {
      context: `Die NIS-2-Richtlinie (Richtlinie (EU) 2022/2555) verpflichtet Betreiber wesentlicher und wichtiger Einrichtungen in der EU zu umfassenden Cybersicherheitsmaßnahmen. Sie regelt die Verantwortung der Geschäftsleitung (Art. 20), technische und organisatorische Risikomanagementmaßnahmen (Art. 21) sowie Meldepflichten bei erheblichen Sicherheitsvorfällen (Art. 23). In Deutschland wird NIS-2 durch das NIS-2-Umsetzungs- und Cybersicherheitsstärkungsgesetz (NIS2UmsuCG) in nationales Recht überführt. Die Einhaltung wird vom BSI überwacht.`,
      verdict: ready
        ? `${name} erfüllt die wesentlichen NIS-2-Anforderungen. Die geprüften Risikomanagementmaßnahmen entsprechen den regulatorischen Vorgaben.`
        : partial
          ? `${name} erreicht eine NIS-2-Konformität von ${rate} Prozent. In einigen Bereichen bestehen Abweichungen, die zeitnah adressiert werden sollten, um regulatorische Risiken zu minimieren.`
          : `${name} erreicht derzeit ${rate} Prozent NIS-2-Konformität. Ohne zügige Umsetzung der empfohlenen Maßnahmen besteht ein erhebliches regulatorisches und operatives Risiko.`,
      situation: `Im Rahmen der Bewertung wurden ${risks} Risikoszenarien identifiziert, von denen ${crit} als kritisch eingestuft wurden. Von den ${totalReqs} geprüften Anforderungen sind ${failReqs} nicht erfüllt und ${partialReqs} nur teilweise erfüllt.`,
      findings: [
        ...(crit > 0 ? [{ t: `${crit} kritische Risiken erfordern sofortiges Handeln`, d: 'In diesen Bereichen fehlen grundlegende Schutzmechanismen, die von der NIS-2-Richtlinie zwingend gefordert werden. Kritische Risiken (Score ≥ 20) bedeuten, dass sowohl Eintrittswahrscheinlichkeit als auch potenzielle Auswirkung als hoch bewertet werden.' }] : []),
        ...(failReqs > 0 ? [{ t: `${failReqs} NIS-2-Anforderungen sind nicht erfüllt`, d: 'Die Abweichungen betreffen zentrale Bereiche wie Governance, Risikomanagement, Lieferkettensicherheit oder Meldepflichten. Jede nicht erfüllte Anforderung stellt bei einer Prüfung durch das BSI einen beanstandbaren Mangel dar.' }] : []),
        ...(partialReqs > 0 ? [{ t: `${partialReqs} Anforderungen sind nur teilweise erfüllt`, d: 'Grundlegende Ansätze sind vorhanden, aber die vollständige Umsetzung steht noch aus. In der Regel fehlen entweder die Dokumentation, regelmäßige Tests oder die organisatorische Verankerung der Maßnahmen.' }] : []),
        ...(passReqs > 0 ? [{ t: `${passReqs} Anforderungen sind vollständig erfüllt`, d: 'Diese Bereiche bedürfen keines unmittelbaren Handlungsbedarfs, sollten aber im Rahmen des kontinuierlichen Verbesserungsprozesses überwacht werden.' }] : []),
      ],
      effortEstimate: ready
        ? 'Kein unmittelbarer Handlungsbedarf. Laufende Kosten für Monitoring und Überprüfung: ca. 2-4 Personentage pro Quartal.'
        : `Der geschätzte Gesamtaufwand für die Herstellung der NIS-2-Konformität beträgt ${totalEffortMin}-${totalEffortMax} Stunden (ca. ${effortPM} Personenmonate). Die ${p0Count} als P0 priorisierten Maßnahmen sollten innerhalb von ${timelineWeeks} umgesetzt werden. Für die vollständige Umsetzung aller Empfehlungen ist ein Zeitraum von 6-12 Monaten realistisch. Je nach Verfügbarkeit interner Ressourcen kann externer Beratungsbedarf entstehen, insbesondere in den Bereichen OT-Sicherheit und Lieferkettenmanagement.`,
      importance: ready
        ? 'Die Konformität ist aktuell gegeben. Regelmäßige Re-Assessments werden empfohlen, da die regulatorischen Anforderungen durch Durchführungsrechtsakte weiter konkretisiert werden.'
        : crit > 0
          ? `Die Dringlichkeit ist hoch. ${crit} kritische Risikoszenarien und ${failReqs} nicht-konforme Anforderungen setzen ${name} einem erheblichen operativen und regulatorischen Risiko aus. Bei einer Prüfung durch das BSI ist mit sofortigen Beanstandungen zu rechnen. Darüber hinaus erhöhen die identifizierten Schwachstellen die Wahrscheinlichkeit eines erfolgreichen Cyberangriffs, der — insbesondere bei kritischer Infrastruktur — auch Auswirkungen auf die öffentliche Versorgung haben kann.`
          : `Die Umsetzung der Empfehlungen hat hohe Priorität. Zwar wurden keine unmittelbar kritischen Risiken identifiziert, aber die bestehenden Abweichungen stellen bei einer aufsichtlichen Prüfung beanstandbare Mängel dar. Eine proaktive Umsetzung stärkt nicht nur die Compliance-Position, sondern verbessert auch die tatsächliche Widerstandsfähigkeit gegen Cyberangriffe und Betriebsunterbrechungen.`,
      implication: ready
        ? 'Auf Basis der vorliegenden Bewertung wurden keine regulatorischen Risiken identifiziert.'
        : `Werden die identifizierten Mängel bei einer Prüfung durch die zuständige Aufsichtsbehörde beanstandet, drohen Sanktionen nach Art. 34 NIS-2 — einschließlich Bußgeldern von bis zu 10 Millionen Euro oder 2 Prozent des weltweiten Jahresumsatzes für wesentliche Einrichtungen. Darüber hinaus kann die persönliche Haftung der Geschäftsleitung nach Art. 20 greifen.`,
      action: ready
        ? 'Als nächsten Schritt empfehlen wir die Einrichtung eines kontinuierlichen Überwachungsprozesses.'
        : 'Als nächsten Schritt empfehlen wir, die P0-Maßnahmen mit konkreten Verantwortlichkeiten und verbindlichen Fristen zu versehen und ein Projektteam für die Umsetzung zu benennen.',
    };
  }
  return {
    context: `The NIS-2 Directive (Directive (EU) 2022/2555) requires operators of essential and important entities in the EU to implement comprehensive cybersecurity measures. It covers governance responsibilities of management bodies (Art. 20), technical and organisational risk management measures (Art. 21), and reporting obligations for significant security incidents (Art. 23). NIS-2 is transposed into national law in each member state and supervised by the competent national authority.`,
    verdict: ready
      ? `${name} meets all essential NIS-2 requirements. The assessed risk management measures comply with regulatory expectations.`
      : partial
        ? `${name} achieves ${rate}% NIS-2 compliance. Targeted remediation is needed in several areas to reduce regulatory exposure.`
        : `${name} currently achieves ${rate}% NIS-2 compliance. Without timely remediation, significant regulatory and operational risks remain.`,
    situation: `The assessment identified ${risks} risk scenarios, of which ${crit} are rated as critical. Of the ${totalReqs} assessed requirements, ${failReqs} are non-compliant and ${partialReqs} are partially compliant.`,
    findings: [
      ...(crit > 0 ? [{ t: `${crit} critical risks require immediate action`, d: 'Fundamental protective mechanisms mandated by NIS-2 are missing in these areas. Critical risks (score ≥ 20) indicate both high likelihood and high potential impact.' }] : []),
      ...(failReqs > 0 ? [{ t: `${failReqs} NIS-2 requirements are not met`, d: 'Deviations affect core areas such as governance, risk management, supply chain security, or reporting obligations. Each non-compliant requirement constitutes a challengeable deficiency in a supervisory examination.' }] : []),
      ...(partialReqs > 0 ? [{ t: `${partialReqs} requirements are only partially met`, d: 'Basic approaches exist but full implementation is pending. Typically, documentation, regular testing, or organisational embedding is missing.' }] : []),
      ...(passReqs > 0 ? [{ t: `${passReqs} requirements fully met`, d: 'No immediate action needed; continuous monitoring recommended.' }] : []),
    ],
    effortEstimate: ready
      ? 'No immediate action required. Ongoing monitoring costs: approx. 2-4 person-days per quarter.'
      : `Estimated total remediation effort is ${totalEffortMin}-${totalEffortMax} hours (approx. ${effortPM} person-months). The ${p0Count} P0-prioritised measures should be completed within ${timelineWeeks}. Full implementation of all recommendations is realistic within 6-12 months. External advisory support may be needed, particularly in OT security and supply chain management.`,
    importance: ready
      ? 'Compliance is currently achieved. Regular re-assessments are recommended as regulatory requirements continue to evolve through implementing acts.'
      : crit > 0
        ? `Urgency is high. ${crit} critical risk scenarios and ${failReqs} non-compliant requirements expose ${name} to significant operational and regulatory risk. Supervisory examination would likely result in immediate findings. Moreover, the identified weaknesses increase the probability of a successful cyberattack that — particularly for critical infrastructure — may also impact public services.`
        : `Implementation of recommendations is a high priority. While no immediately critical risks were identified, the existing deviations constitute challengeable deficiencies in a supervisory examination. Proactive implementation strengthens not only the compliance posture but also actual resilience against cyber threats and business disruption.`,
    implication: ready ? 'No regulatory risks identified based on the current assessment.' : 'Supervisory action under Art. 34 NIS-2 may result, including fines of up to EUR 10 million or 2% of global turnover for essential entities. Additionally, personal liability of management bodies under Art. 20 may apply.',
    action: ready ? 'Next step: Establish a continuous monitoring process.' : 'Next step: Assign P0 measures with owners and binding deadlines, and designate a project team for implementation.',
  };
}

function linkReqs(ri: Nis2Risk, reqs: Nis2Req[]): Nis2Req[] {
  const baseRisk = ri.nis2Ref.split(' Abs.')[0].split(' lit.')[0];
  return reqs.filter(r => {
    const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
    return baseRisk === baseReq;
  });
}

/* ════════════════════════════════════════════════════════════
   PDF Generation
   ════════════════════════════════════════════════════════════ */
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

  // ═══ TABLE OF CONTENTS ═══
  const tocEntries = [
    l('sec1', lang), l('sec2', lang), l('sec3', lang),
    `    ${l('sec3a', lang)}`, `    ${l('sec3b', lang)}`, `    ${l('sec3c', lang)}`,
    `    ${l('sec3d', lang)}`, `    ${l('sec3e', lang)}`,
    l('sec4', lang), `    ${l('sec4a', lang)}`, `    ${l('sec4b', lang)}`,
    l('sec5', lang), `    ${l('sec5a', lang)}`, `    ${l('sec5b', lang)}`, `    ${l('sec5c', lang)}`,
    l('sec6', lang), l('sec7', lang), null,
    l('secA', lang), l('secB', lang), l('secC', lang), l('secD', lang), l('secE', lang),
  ];
  pdf.tableOfContents(l('toc', lang), tocEntries);

  // ═══ SECTION 1: Context ═══
  pdf.newPage();
  pdf.heading(l('sec1', lang));
  pdf.bodyParagraph(getContextText(intakeData.entityName, entityTypeName, criticalityName, today, lang, intakeData));

  // ═══ SECTION 2: Management Summary ═══
  const passCount = reqs.filter(r => r.status === 'pass').length;
  const partCount = reqs.filter(r => r.status === 'partial').length;
  const failCount = reqs.filter(r => r.status === 'fail').length;
  const critCount = risks.filter(r => r.likelihood * r.impact >= 20).length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);

  pdf.heading(l('sec2', lang));
  pdf.introText(lang === 'de'
    ? 'Was muss die Geschäftsleitung wissen? Dieser Abschnitt fasst die wichtigsten Ergebnisse zusammen — einschließlich regulatorischem Kontext, Aufwandsschätzung und Handlungsdringlichkeit.'
    : 'What does the board need to know? This section summarises the key findings — including regulatory context, effort estimates, and urgency.');

  const summary = getMgmtSummary(intakeData.entityName, risks.length, critCount, failCount, partCount, reqs.length, passCount, lang);

  // Regulatory context
  pdf.heading(lang === 'de' ? 'Regulatorischer Kontext' : 'Regulatory Context', 3);
  pdf.bodyParagraph(summary.context);

  pdf.verdictBox(summary.verdict);

  pdf.kpiRow([
    [String(risks.length), l('totalRisks', lang)],
    [String(critCount), lang === 'de' ? 'Kritisch (≥ 20)' : 'Critical (≥ 20)'],
    [String(failCount), l('nonCompliant', lang)],
    [`${complianceRate}%`, l('complianceRate', lang)],
  ]);

  pdf.bodyText(summary.situation);
  pdf.y += 3;

  summary.findings.forEach(f => {
    pdf.checkSpace(18);
    pdf.doc.setFont(pdf.headFontName, 'bold');
    pdf.doc.setFontSize(9);
    pdf.doc.setTextColor(...C.navy);
    pdf.doc.text(f.t, LAYOUT.LEFT, pdf.y);
    pdf.y += 5;
    pdf.doc.setTextColor(...C.dark);
    pdf.bodyText(f.d, 4);
    pdf.y += 2;
  });

  // Effort & Timeline
  pdf.heading(lang === 'de' ? 'Geschätzter Aufwand und Zeitrahmen' : 'Estimated Effort and Timeline', 3);
  pdf.bodyParagraph(summary.effortEstimate);

  // Importance / Urgency
  pdf.heading(lang === 'de' ? 'Dringlichkeit und Bedeutung' : 'Urgency and Importance', 3);
  pdf.bodyParagraph(summary.importance);

  pdf.heading(lang === 'de' ? 'Regulatorische Implikation' : 'Regulatory Implication', 3);
  pdf.bodyParagraph(summary.implication);
  pdf.heading(lang === 'de' ? 'Empfohlenes Vorgehen' : 'Recommended Action', 3);
  pdf.bodyParagraph(summary.action);

  // ═══ SECTION 3: Scope ═══
  pdf.newPage();
  pdf.heading(l('sec3', lang));
  pdf.introText(lang === 'de'
    ? 'Bevor die identifizierten Risiken und Konformitätslücken im Detail dargestellt werden, dokumentiert dieser Abschnitt den Prüfungsgegenstand und die zugrunde liegenden Informationen.'
    : 'Before presenting identified risks and compliance gaps in detail, this section documents the scope of the assessment and the underlying information.');

  pdf.heading(l('sec3a', lang), 2);
  pdf.field(l('entity', lang), intakeData.entityName);
  pdf.field(l('entityType', lang), entityTypeName);
  pdf.field(l('criticality', lang), criticalityName);
  if (intakeData.description) pdf.bodyParagraph(intakeData.description);

  pdf.heading(l('sec3b', lang), 2);
  if (intakeData.infrastructure.length > 0) pdf.field(lang === 'de' ? 'Infrastruktur' : 'Infrastructure', intakeData.infrastructure.join(', '));
  if (intakeData.supplyChainProviders.length > 0) pdf.field(lang === 'de' ? 'Lieferanten / Dienstleister' : 'Suppliers / Service Providers', intakeData.supplyChainProviders.join(', '));
  if (intakeData.roles.length > 0) pdf.field(lang === 'de' ? 'Verantwortliche Rollen' : 'Responsible Roles', intakeData.roles.join(', '));

  pdf.heading(l('sec3c', lang), 2);
  pdf.introText(lang === 'de'
    ? 'Welche Sicherheitsmaßnahmen nach Art. 21 NIS-2 sind bereits vorhanden und wie ausgereift sind sie?'
    : 'Which security measures per Art. 21 NIS-2 are already in place, and how mature are they?');
  const measureEntries = Object.entries(intakeData.measures);
  if (measureEntries.length > 0) {
    pdf.measuresTable(measureEntries, {
      measure: l('measures', lang), active: l('active', lang), doc: l('documented', lang),
      audit: l('audited', lang), cert: l('certified', lang), yes: l('yes', lang), no: l('no', lang),
    });
  }

  pdf.heading(l('sec3d', lang), 2);
  if (intakeData.knownIssues) pdf.bodyParagraph(intakeData.knownIssues);
  else pdf.bodyText(lang === 'de' ? 'Es wurden keine bekannten Schwachstellen angegeben.' : 'No known weaknesses were reported.');

  pdf.heading(l('sec3e', lang), 2);
  if (intakeData.files.length > 0) {
    intakeData.files.forEach(f => {
      pdf.checkSpace(5);
      pdf.doc.setFontSize(7.5); pdf.doc.setFont(pdf.dataFontName, 'normal'); pdf.doc.setTextColor(...C.dark);
      pdf.doc.text(`${f.name}  (${(f.size / 1024).toFixed(0)} KB)`, LAYOUT.LEFT + 4, pdf.y);
      pdf.y += 4.5;
    });
    pdf.doc.setFont(pdf.bodyFontName, 'normal');
  } else {
    pdf.bodyText(l('noFilesSubmitted', lang));
  }

  // ═══ SECTION 4: Detailed Findings ═══
  pdf.newPage();
  pdf.heading(l('sec4', lang));
  pdf.introText(lang === 'de'
    ? 'Jedes identifizierte Risiko und jede Konformitätslücke wird in diesem Abschnitt einzeln dargestellt und bewertet.'
    : 'Each identified risk and compliance gap is presented and assessed individually in this section.');

  // 4.1 Risk Landscape
  pdf.heading(l('sec4a', lang), 2);
  pdf.introText(lang === 'de'
    ? 'Jedes Risikoszenario wird nach Eintrittswahrscheinlichkeit (1-5) und Auswirkung (1-5) bewertet. Szenarien mit einem Score ab 20 gelten als kritisch und erfordern sofortige Maßnahmen.'
    : 'Each risk scenario is rated by likelihood (1-5) and impact (1-5). Scenarios scoring 20 or above are classified as critical and require immediate action.');

  risks.forEach((ri, idx) => {
    pdf.checkSpace(55);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');
    const cat = RISK_CATEGORIES[ri.category]?.label[lang] || ri.category;
    const eId = `E-${String(idx + 1).padStart(3, '0')}`;

    pdf.heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    pdf.metaLine(`${cat}  |  ${sev}  |  ${ri.nis2Ref}  |  ${eId}  |  ${lang === 'de' ? 'Evidenz' : 'Evidence'}: ${ri.evidenceQuality}/5`);

    pdf.scoreBar(`${l('riskScore', lang)}: ${ri.likelihood} × ${ri.impact} = ${score} (${sev})`);

    pdf.fieldInline(l('component', lang), ri.component);
    pdf.fieldInline(l('attacker', lang), ri.attacker);
    pdf.fieldInline(l('attackPath', lang), ri.path);
    pdf.y += 2;
    pdf.bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    pdf.bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) pdf.bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);

    const linked = linkReqs(ri, reqs);
    if (linked.length > 0) {
      const wpRefs = linked.map(r => `AP-${r.id}`).join(', ');
      pdf.metaLine(`${lang === 'de' ? 'Arbeitspapiere' : 'Working Papers'}: ${wpRefs}`);
    }
    pdf.separator();
  });

  // 4.2 Compliance Gaps
  pdf.newPage();
  pdf.heading(l('sec4b', lang), 2);
  pdf.introText(lang === 'de'
    ? 'Jede NIS-2-Anforderung wird einzeln bewertet. Für jede Anforderung wird dokumentiert, welche Evidenz erhoben wurde, auf welcher Grundlage die Bewertung erfolgte und welche Maßnahmen empfohlen werden.'
    : 'Each NIS-2 requirement is assessed individually. For each requirement, the collected evidence, the assessment rationale, and the recommended actions are documented.');

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

  // ═══ SECTION 5: Recommendations ═══
  pdf.newPage();
  pdf.heading(l('sec5', lang));
  pdf.introText(lang === 'de'
    ? 'Welche Maßnahmen sind jetzt erforderlich, und in welcher Reihenfolge sollten sie umgesetzt werden?'
    : 'What measures are required now, and in what order should they be implemented?');

  pdf.heading(l('sec5a', lang), 2);
  const prioLabels: Record<string, Record<string, string>> = {
    P0: { de: 'P0 — Sofort (innerhalb 4 Wochen)', en: 'P0 — Immediate (within 4 weeks)' },
    P1: { de: 'P1 — Kurzfristig (innerhalb 3 Monate)', en: 'P1 — Short-term (within 3 months)' },
    P2: { de: 'P2 — Mittelfristig (innerhalb 6 Monate)', en: 'P2 — Medium-term (within 6 months)' },
    P3: { de: 'P3 — Empfohlen (innerhalb 12 Monate)', en: 'P3 — Recommended (within 12 months)' },
  };
  for (const prio of ['P0', 'P1', 'P2', 'P3']) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    pdf.heading(prioLabels[prio][lang] || prio, 2);
    prioReqs.forEach(r => {
      pdf.checkSpace(35);
      pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(9); pdf.doc.setTextColor(...C.navy);
      pdf.doc.text(`[${r.id}: ${r.name}]`, LAYOUT.LEFT + 4, pdf.y);
      pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setTextColor(...C.dark); pdf.y += 6;
      if (r.measure) pdf.bodyText(r.measure, 4);

      if (r.effort) {
        const efM = r.effort.match(/(\d+)\s*-\s*(\d+)/);
        const minH = efM ? parseInt(efM[1]) : 0;
        const maxH = efM ? parseInt(efM[2]) : 0;
        const needsExternal = maxH > 80 || r.measure?.toLowerCase().includes('extern');
        const hasToolCost = r.measure?.toLowerCase().includes('tool') || r.measure?.toLowerCase().includes('lizenz');

        pdf.effortBox({
          header: lang === 'de' ? 'AUFWANDSSCHÄTZUNG' : 'EFFORT ESTIMATE',
          rangeText: `${lang === 'de' ? 'Geschätzter Aufwand' : 'Estimated effort'}: ${r.effort}`,
          assumptions: lang === 'de' ? [
            `Verfügbare interne Ressourcen: 1 FTE (${r.priority === 'P0' ? 'dediziert' : 'anteilig'})`,
            `Externe Unterstützung: ${needsExternal ? 'Ja, Fachberater erforderlich' : 'Nein, interne Umsetzung möglich'}`,
            `Lizenz- oder Toolkosten: ${hasToolCost ? 'Ja, zusätzliche Beschaffung notwendig' : 'Nein, mit vorhandenen Mitteln umsetzbar'}`,
          ] : [
            `Available internal resources: 1 FTE (${r.priority === 'P0' ? 'dedicated' : 'partial'})`,
            `External support: ${needsExternal ? 'Yes, specialist consultant required' : 'No, internal implementation feasible'}`,
            `Licence/tool costs: ${hasToolCost ? 'Yes, additional procurement needed' : 'No, achievable with existing resources'}`,
          ],
          uncertainties: lang === 'de' ? [
            maxH > 60 ? 'Die Komplexität der vorhandenen Systemlandschaft kann den Aufwand erheblich beeinflussen.' : 'Der tatsächliche Umfang hängt von der konkreten IT-Architektur und den vorhandenen Prozessen ab.',
          ] : [
            maxH > 60 ? 'Legacy system complexity may significantly influence the required effort.' : 'Actual scope depends on the specific IT architecture and existing processes.',
          ],
          validation: lang === 'de'
            ? `Diese Schätzung basiert auf Erfahrungswerten vergleichbarer Projekte (${minH}-${maxH}h für ${r.priority}-Maßnahmen).`
            : `This estimate is based on empirical data from comparable projects (${minH}-${maxH}h for ${r.priority} measures).`,
          assumptionsLabel: lang === 'de' ? 'ANNAHMEN' : 'ASSUMPTIONS',
          uncertaintiesLabel: lang === 'de' ? 'UNSICHERHEITEN' : 'UNCERTAINTIES',
          validationLabel: lang === 'de' ? 'VALIDIERUNG' : 'VALIDATION',
        });
      }

      if (r.criteria && r.criteria.length > 0) {
        pdf.sectionLabel(lang === 'de' ? 'SMARTE UMSETZUNGSKRITERIEN' : 'SMART ACCEPTANCE CRITERIA');
        r.criteria.forEach((c, ci) => pdf.bulletItem(`${ci + 1}. ${c}`, 8));
      }
      pdf.y += 4;
    });
  }

  // 5.2 Roadmap
  pdf.heading(l('sec5b', lang), 2);
  const phases = lang === 'de' ? [
    { label: 'Phase 0 (0-4 Wochen)', desc: 'Kritische Lücken schließen: Die als P0 eingestuften Maßnahmen adressieren die dringendsten Defizite, insbesondere in den Bereichen Governance und Meldepflichten.' },
    { label: 'Phase 1 (1-3 Monate)', desc: 'Kernprozesse etablieren: Risikomanagement-Framework aufbauen, Lieferantenbewertungen initiieren und Incident-Response-Prozesse auf NIS-2-Fristen ausrichten.' },
    { label: 'Phase 2 (3-6 Monate)', desc: 'Resilienz stärken: BCP-Tests durchführen, Schwachstellenmanagement systematisieren und technische Redundanzen schaffen.' },
    { label: 'Phase 3 (6-12 Monate)', desc: 'Kontinuierliche Verbesserung: Monitoring-Prozesse etablieren, regelmäßige Überprüfungszyklen einrichten und Zertifizierungen anstreben.' },
  ] : [
    { label: 'Phase 0 (0-4 weeks)', desc: 'Close critical gaps: P0 measures address the most urgent deficits, particularly in governance and reporting obligations.' },
    { label: 'Phase 1 (1-3 months)', desc: 'Establish core processes: Build risk management framework, initiate supplier assessments, and align incident response processes with NIS-2 timelines.' },
    { label: 'Phase 2 (3-6 months)', desc: 'Strengthen resilience: Conduct BCP tests, systematise vulnerability management, and create technical redundancies.' },
    { label: 'Phase 3 (6-12 months)', desc: 'Continuous improvement: Establish monitoring processes, set up regular review cycles, and pursue certifications.' },
  ];
  phases.forEach(p => {
    pdf.checkSpace(16);
    pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(9); pdf.doc.setTextColor(...C.navy);
    pdf.doc.text(p.label, LAYOUT.LEFT, pdf.y); pdf.y += 5;
    pdf.doc.setTextColor(...C.dark);
    pdf.bodyText(p.desc, 4);
    pdf.y += 2;
  });

  // 5.3 Economic Impact
  pdf.heading(l('sec5c', lang), 2);
  pdf.bodyParagraph(lang === 'de'
    ? `Die NIS-2-Richtlinie sieht bei Verstößen erhebliche Sanktionen vor. Für wesentliche Einrichtungen können Bußgelder bis zu 10 Millionen Euro oder 2 Prozent des weltweiten Jahresumsatzes verhängt werden. Die derzeit ${failCount} nicht-konformen Anforderungen erhöhen das regulatorische Risiko erheblich. Der geschätzte Gesamtaufwand für die Herstellung der Konformität beträgt 6-18 Personenmonate, abhängig von der Verfügbarkeit interner Ressourcen und dem Bedarf an externer Unterstützung. Diesen Investitionen steht das Schadenspotenzial eines erheblichen Sicherheitsvorfalls gegenüber, das neben Bußgeldern auch Betriebsausfälle, Reputationsschäden und Haftungsansprüche umfassen kann.`
    : `The NIS-2 Directive provides for significant sanctions in case of non-compliance. For essential entities, fines of up to EUR 10 million or 2% of global turnover may be imposed. The current ${failCount} non-compliant requirements significantly increase regulatory risk. Estimated total remediation effort is 6-18 person-months, depending on internal resource availability and external support needs. These investments should be weighed against the damage potential of a significant security incident, which may include fines, business disruption, reputational damage, and liability claims.`);

  // ═══ SECTION 6: Methodology ═══
  pdf.newPage();
  pdf.heading(l('sec6', lang));
  pdf.bodyParagraph(lang === 'de'
    ? 'Die Prüfung basiert auf der Richtlinie (EU) 2022/2555 (NIS-2-Richtlinie), den zugehörigen Durchführungsrechtsakten sowie dem nationalen Umsetzungsgesetz (NIS2UmsuCG). Die Risikobewertung folgt einer standardisierten 5×5-Matrix, in der Eintrittswahrscheinlichkeit und Auswirkung jeweils auf einer Skala von 1 bis 5 bewertet werden. Das Produkt beider Werte ergibt den Risikoscore, der die Priorisierung der Maßnahmen bestimmt.'
    : 'The assessment is based on Directive (EU) 2022/2555 (NIS-2 Directive), the associated implementing acts, and the national transposition law. Risk assessment follows a standardised 5×5 matrix where likelihood and impact are each rated on a scale of 1 to 5. The product of both values yields the risk score that determines measure prioritisation.');

  pdf.heading(l('sec6a', lang), 2);
  [['Score ≥ 20', lang === 'de' ? 'KRITISCH — Sofortige Umsetzung erforderlich' : 'CRITICAL — Immediate action required'],
   ['Score 13-19', lang === 'de' ? 'HOCH — Umsetzung innerhalb von 3 Monaten' : 'HIGH — Action within 3 months'],
   ['Score 6-12', lang === 'de' ? 'MITTEL — Umsetzung innerhalb von 6 Monaten' : 'MEDIUM — Action within 6 months'],
   ['Score 1-5', lang === 'de' ? 'NIEDRIG — Beobachtung und kontinuierliches Monitoring' : 'LOW — Monitor and continuous observation']].forEach(([score, action]) => {
    pdf.checkSpace(8);
    pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(8); pdf.doc.setTextColor(...C.navy);
    pdf.doc.text(score, LAYOUT.LEFT + 4, pdf.y);
    pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setFontSize(8.5); pdf.doc.setTextColor(...C.dark);
    pdf.doc.text(action, LAYOUT.LEFT + 32, pdf.y);
    pdf.y += 6;
  });

  // ═══ SECTION 7: Disclaimer ═══
  pdf.y += 5;
  pdf.heading(l('sec7', lang));
  pdf.bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den zum Zeitpunkt der Prüfung vorliegenden Informationen und Dokumenten. Er ersetzt keine offizielle Prüfung durch das BSI oder eine andere zuständige nationale Aufsichtsbehörde. Für die Vollständigkeit und Richtigkeit der zugrunde liegenden Angaben wird keine Haftung übernommen. Der Bericht ist vertraulich und ausschließlich für den internen Gebrauch des Empfängers bestimmt.'
    : 'This report is based on information and documents available at the time of the assessment. It does not replace an official audit by the competent national authority. No liability is assumed for the completeness or accuracy of the underlying information. The report is confidential and intended solely for the internal use of the recipient.');

  // ═══ APPENDIX A: Structured Data ═══
  pdf.newPage();
  pdf.heading(l('secA', lang));
  pdf.heading(`A.1 ${lang === 'de' ? 'Risiken' : 'Risks'}`, 2);
  pdf.dataTableHeader('ID         | Risiko                          | L  I  S  | Referenz');
  risks.forEach(ri => {
    const score = ri.likelihood * ri.impact;
    pdf.dataTableRow(`${riskId(ri).padEnd(10)} | ${ri.name.substring(0, 32).padEnd(32)} | ${ri.likelihood}  ${ri.impact}  ${String(score).padStart(2)} | ${ri.nis2Ref}`);
  });

  pdf.heading(`A.2 ${lang === 'de' ? 'NIS-2-Anforderungen' : 'NIS-2 Requirements'}`, 2);
  pdf.dataTableHeader('ID      | Anforderung                     | Status  | Prio | Aufwand');
  reqs.forEach(r => {
    const s = r.status === 'pass' ? 'PASS   ' : r.status === 'partial' ? 'PARTIAL' : 'FAIL   ';
    pdf.dataTableRow(`${r.id.padEnd(7)} | ${r.name.substring(0, 32).padEnd(32)} | ${s} | ${(r.priority || '-').padEnd(4)} | ${r.effort || '-'}`);
  });

  // ═══ APPENDIX B: Tools ═══
  pdf.newPage();
  pdf.heading(l('secB', lang));
  [{ cat: lang === 'de' ? 'Netzwerkanalyse' : 'Network Analysis', tools: 'Wireshark 4.x, Nmap 7.x' },
   { cat: lang === 'de' ? 'Schwachstellen-Scanning' : 'Vulnerability Scanning', tools: 'Qualys, Tenable.io, OpenVAS' },
   { cat: lang === 'de' ? 'Konfigurationsanalyse' : 'Configuration Audit', tools: 'CIS-Benchmark, Lynis, CSPM' },
   { cat: lang === 'de' ? 'OT-/ICS-Sicherheit' : 'OT/ICS Security', tools: 'Dragos, Claroty, Nozomi Networks' },
   { cat: lang === 'de' ? 'Penetrationstest' : 'Penetration Testing', tools: 'Burp Suite, OWASP ZAP, Metasploit' }].forEach(t => {
    pdf.checkSpace(8);
    pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(8); pdf.doc.setTextColor(...C.navy);
    pdf.doc.text(t.cat, LAYOUT.LEFT + 4, pdf.y);
    pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setFontSize(8); pdf.doc.setTextColor(...C.dark);
    pdf.doc.text(t.tools, LAYOUT.LEFT + 52, pdf.y);
    pdf.y += 5.5;
  });

  // ═══ APPENDIX C: Evidence Index ═══
  pdf.y += 5;
  pdf.heading(l('secC', lang));
  pdf.dataTableHeader('E-ID    | Risiko     | Qualität | Reproduzierbarkeit');
  risks.forEach((ri, i) => {
    pdf.dataTableRow(`E-${String(i + 1).padStart(3, '0')}   | ${riskId(ri).padEnd(10)} | ${ri.evidenceQuality}/5       | ${ri.reproducibility}`);
  });

  // ═══ APPENDIX D: Quality Assurance ═══
  pdf.newPage();
  pdf.heading(l('secD', lang));
  if (data.qaChecks && data.qaChecks.length > 0) {
    const catLabelsMap: Record<string, string> = {
      consistency: lang === 'de' ? 'Konsistenzprüfung' : 'Consistency',
      technical: lang === 'de' ? 'Fachliche Korrektheit' : 'Technical',
      evidence: lang === 'de' ? 'Evidenzprüfung' : 'Evidence',
      editorial: lang === 'de' ? 'Redaktionell' : 'Editorial',
      regulatory: lang === 'de' ? 'Regulatorisch' : 'Regulatory',
      'golden-rule': lang === 'de' ? '10 Goldene Regeln' : '10 Golden Rules',
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
    pdf.heading(`D.3 ${lang === 'de' ? 'Automatisierte Korrekturen' : 'Automated Corrections'}`, 2);
    pdf.fixLog(data.fixLog);
  }

  // ═══ APPENDIX E: Working Papers ═══
  pdf.newPage();
  pdf.heading(l('secE', lang));
  pdf.introText(lang === 'de'
    ? 'Für jede NIS-2-Anforderung wurde ein eigenständiges Arbeitspapier erstellt, das den Prüfungsgegenstand, die erhobene Evidenz, die Bewertungsgrundlage sowie gegebenenfalls festgestellte Abweichungen und empfohlene Maßnahmen dokumentiert.'
    : 'A dedicated working paper has been prepared for each NIS-2 requirement, documenting the scope of examination, collected evidence, assessment rationale, and — where applicable — identified deviations and recommended actions.');

  reqs.forEach((r, idx) => {
    const apId = `AP-${r.id}`;
    const linkedRisks = risks.filter(ri => {
      const baseRisk = ri.nis2Ref.split(' Abs.')[0].split(' lit.')[0];
      const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
      return baseRisk === baseReq;
    });
    const linkedEvidence = linkedRisks.map((_, i2) => {
      const gi = risks.indexOf(linkedRisks[i2]);
      return `E-${String(gi + 1).padStart(3, '0')}`;
    });

    pdf.checkSpace(65);
    pdf.heading(`${apId}: ${r.name}`, 2);

    pdf.metaBox([
      {
        labels: [lang === 'de' ? 'ARBEITSPAPIER-NR.' : 'WORKING PAPER NO.', lang === 'de' ? 'NIS-2-ARTIKEL' : 'NIS-2 ARTICLE', lang === 'de' ? 'BEWERTUNG' : 'ASSESSMENT'],
        values: [apId, r.article, ''],
        badge: { status: r.status, col: 2 },
      },
      {
        labels: [lang === 'de' ? 'BERICHT-REF.' : 'REPORT REF.', lang === 'de' ? 'RISIKO-VERKNÜPFUNG' : 'LINKED RISKS', lang === 'de' ? 'EVIDENZ-REF.' : 'EVIDENCE REF.'],
        values: [`${lang === 'de' ? 'Abschn.' : 'Sec.'} 4.2, ${r.id}`, linkedRisks.length > 0 ? linkedRisks.map(riskId).join(', ') : '-', linkedEvidence.length > 0 ? linkedEvidence.join(', ') : '-'],
      },
    ]);

    pdf.sectionLabel(lang === 'de' ? 'PRÜFUNGSGEGENSTAND' : 'SCOPE OF EXAMINATION');
    pdf.bodyText(r.name + (r.article ? ` (${r.article})` : ''), 0);
    pdf.sectionLabel(lang === 'de' ? 'ERHOBENE EVIDENZ' : 'COLLECTED EVIDENCE');
    pdf.bodyText(r.evidence, 0);
    pdf.sectionLabel(lang === 'de' ? 'BEWERTUNGSGRUNDLAGE' : 'ASSESSMENT RATIONALE');
    pdf.bodyText(r.rationale, 0);

    if (r.gap) { pdf.sectionLabel(lang === 'de' ? 'FESTGESTELLTE ABWEICHUNG' : 'IDENTIFIED DEVIATION'); pdf.bodyText(r.gap, 0); }
    if (r.measure) { pdf.sectionLabel(lang === 'de' ? 'EMPFOHLENE MASSNAHME' : 'RECOMMENDED ACTION'); pdf.bodyText(r.measure, 0); }
    if (r.effort || r.priority) {
      pdf.sectionLabel(lang === 'de' ? 'AUFWAND / PRIORITÄT' : 'EFFORT / PRIORITY');
      const parts = [];
      if (r.priority) parts.push(`${l('priority', lang)}: ${r.priority}`);
      if (r.effort) parts.push(`${l('effort', lang)}: ${r.effort}`);
      pdf.bodyText(parts.join('  |  '), 0);
    }
    if (r.criteria && r.criteria.length > 0) {
      pdf.sectionLabel(lang === 'de' ? 'UMSETZUNGSKRITERIEN' : 'ACCEPTANCE CRITERIA');
      r.criteria.forEach((c, i) => pdf.bulletItem(`${i + 1}. ${c}`, 4));
    }
    if (linkedRisks.length > 0) {
      pdf.sectionLabel(lang === 'de' ? 'VERKNÜPFTE RISIKEN' : 'LINKED RISKS');
      linkedRisks.forEach(ri => {
        const score = ri.likelihood * ri.impact;
        pdf.checkSpace(5);
        pdf.doc.setFont(pdf.headFontName, 'normal'); pdf.doc.setFontSize(7.5); pdf.doc.setTextColor(...C.dark);
        pdf.doc.text(`${riskId(ri)}: ${ri.name} (Score: ${score})`, LAYOUT.LEFT + 4, pdf.y);
        pdf.y += 4.5;
      });
    }
    if (r.status === 'pass' && (!r.gap || r.gap.trim() === '') && linkedRisks.length === 0) {
      pdf.checkSpace(8);
      pdf.doc.setFillColor(...C.bg); pdf.doc.roundedRect(LAYOUT.LEFT, pdf.y - 1, LAYOUT.WIDTH, 7, 0.8, 0.8, 'F');
      pdf.doc.setFont(pdf.headFontName, 'normal'); pdf.doc.setFontSize(7.5); pdf.doc.setTextColor(...C.pass);
      pdf.doc.text(lang === 'de' ? 'Keine Abweichung festgestellt.' : 'No deviation identified.', LAYOUT.LEFT + 4, pdf.y + 3.5);
      pdf.doc.setTextColor(...C.dark);
      pdf.y += 10;
    }
    if (idx < reqs.length - 1) {
      pdf.checkSpace(10);
      pdf.doc.setDrawColor(...C.navy); pdf.doc.setLineWidth(0.25);
      pdf.doc.line(LAYOUT.LEFT, pdf.y, LAYOUT.RIGHT, pdf.y);
      pdf.y += 8;
    }
  });

  // ═══ SAVE ═══
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  pdf.save(`NIS2_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
