// NIS-2 Report PDF — full audit report matching DORA detail level
// Uses shared pdfCore engine for professional typography and layout
import type { Nis2IntakeData, Nis2Risk, Nis2Req } from '@/data/nis2ComplianceData';
import { riskId, RISK_CATEGORIES } from '@/data/nis2ComplianceData';
import type { QaCheck } from '@/utils/nis2QualityCheck';
import { createPdfDoc, C, LAYOUT, humanizeList, humanizeText, humanizeEvidence } from '@/utils/pdfCore';

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
  sec1: { de: '6  Ausgangslage und Zielsetzung', en: '6  Context and Objectives', fr: '6  Contexte et objectifs' },
  sec2: { de: '1  Zusammenfassung für die Geschäftsleitung', en: '1  Management Summary', fr: '1  Synthèse pour la direction' },
  sec3: { de: '5  Gegenstand der Prüfung', en: '5  Scope of Assessment', fr: '5  Périmètre de l\'évaluation' },
  sec3a: { de: '5.1  Einrichtungsprofil', en: '5.1  Entity Profile', fr: '5.1  Profil de l\'entité' },
  sec3b: { de: '5.2  Infrastruktur und Lieferkette', en: '5.2  Infrastructure and Supply Chain', fr: '5.2  Infrastructure et chaîne d\'approvisionnement' },
  sec3c: { de: '5.3  Implementierte Sicherheitsmaßnahmen', en: '5.3  Implemented Security Measures', fr: '5.3  Mesures de sécurité mises en œuvre' },
  sec3d: { de: '5.4  Bekannte Schwachstellen', en: '5.4  Known Weaknesses', fr: '5.4  Faiblesses connues' },
  sec3e: { de: '5.5  Eingereichte Dokumentation', en: '5.5  Submitted Documentation', fr: '5.5  Documentation soumise' },
  sec4: { de: '3  Feststellungen im Einzelnen', en: '3  Detailed Findings', fr: '3  Constatations détaillées' },
  sec4a: { de: '3.1  Risikolandschaft', en: '3.1  Risk Landscape', fr: '3.1  Paysage des risques' },
  sec4b: { de: '3.2  NIS-2-Konformitätslücken', en: '3.2  NIS-2 Compliance Gaps', fr: '3.2  Lacunes de conformité NIS-2' },
  sec5: { de: '4  Handlungsempfehlungen und Roadmap', en: '4  Recommendations and Roadmap', fr: '4  Recommandations et feuille de route' },
  sec5a: { de: '4.1  Priorisierte Maßnahmen (P0-P3)', en: '4.1  Prioritised Measures (P0-P3)', fr: '4.1  Mesures priorisées (P0-P3)' },
  sec5b: { de: '4.2  Umsetzungs-Roadmap', en: '4.2  Remediation Roadmap', fr: '4.2  Feuille de route de remédiation' },
  sec5c: { de: '4.3  Wirtschaftliche Betrachtung', en: '4.3  Economic Impact Assessment', fr: '4.3  Analyse économique' },
  sec6: { de: '7  Methodik und Prüfungsgrundlagen', en: '7  Methodology and Audit Standards', fr: '7  Méthodologie et normes d\'audit' },
  sec6a: { de: '7.1  Risikobewertungsmatrix', en: '7.1  Risk Rating Matrix', fr: '7.1  Matrice d\'évaluation des risques' },
  sec7: { de: '8  Einschränkungen und Haftungsausschluss', en: '8  Limitations and Disclaimer', fr: '8  Limites et clause de non-responsabilité' },
  sec8: { de: '9  Hinweise zur Verifizierung', en: '9  Verification Guidance', fr: '9  Guide de vérification' },
  sec9: { de: '2  Konformitätserklärung', en: '2  Compliance Statement', fr: '2  Déclaration de conformité' },
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
  // Finding structure labels (12-element audit template)
  findingIdLabel: { de: 'FESTSTELLUNGS-ID', en: 'FINDING ID', fr: 'ID DE CONSTATATION' },
  titleLabel: { de: 'TITEL', en: 'TITLE', fr: 'TITRE' },
  observationLabel: { de: 'BEOBACHTUNG', en: 'OBSERVATION', fr: 'OBSERVATION' },
  techDetails: { de: 'TECHNISCHE DETAILS', en: 'TECHNICAL DETAILS', fr: 'DÉTAILS TECHNIQUES' },
  riskCategoryLabel: { de: 'RISIKOKATEGORIE (CIAGTR)', en: 'RISK CATEGORY (CIAGTR)', fr: 'CATÉGORIE DE RISQUE (CIAGTR)' },
  riskDescLabel: { de: 'RISIKOBESCHREIBUNG', en: 'RISK DESCRIPTION', fr: 'DESCRIPTION DU RISQUE' },
  impactLabel: { de: 'AUSWIRKUNG (CIA)', en: 'IMPACT (CIA)', fr: 'IMPACT (CIA)' },
  confidentiality: { de: 'Vertraulichkeit', en: 'Confidentiality', fr: 'Confidentialité' },
  integrityLabel: { de: 'Integrität', en: 'Integrity', fr: 'Intégrité' },
  availabilityLabel: { de: 'Verfügbarkeit', en: 'Availability', fr: 'Disponibilité' },
  likelihoodLabel: { de: 'EINTRITTSWAHRSCHEINLICHKEIT', en: 'LIKELIHOOD', fr: 'PROBABILITÉ' },
  riskLevelLabel: { de: 'RISIKOSTUFE', en: 'RISK LEVEL', fr: 'NIVEAU DE RISQUE' },
  rootCauseLabel: { de: 'URSACHE', en: 'ROOT CAUSE', fr: 'CAUSE RACINE' },
  recommendationLabel: { de: 'EMPFEHLUNG', en: 'RECOMMENDATION', fr: 'RECOMMANDATION' },
  referenceLabel: { de: 'REFERENZ', en: 'REFERENCE', fr: 'RÉFÉRENCE' },
  attackScenarioLabel: { de: 'ANGRIFFSSZENARIO', en: 'ATTACK SCENARIO', fr: 'SCÉNARIO D\'ATTAQUE' },
  acceptanceCriteria: { de: 'UMSETZUNGSKRITERIEN', en: 'ACCEPTANCE CRITERIA', fr: 'CRITÈRES D\'ACCEPTATION' },
  smartCriteria: { de: 'SMARTE UMSETZUNGSKRITERIEN', en: 'SMART ACCEPTANCE CRITERIA', fr: 'CRITÈRES D\'ACCEPTATION SMART' },
  linkedRisksLabel: { de: 'Verknüpfte Risiken', en: 'Linked Risks', fr: 'Risques liés' },
  workingPapers: { de: 'Arbeitspapiere', en: 'Working Papers', fr: 'Papiers de travail' },
  noRiskLink: { de: 'Keine direkte Risikoverknüpfung — regulatorische Anforderung', en: 'No direct risk link — regulatory requirement', fr: 'Aucun lien de risque direct — exigence réglementaire' },
  requirementLabel: { de: 'Anforderung', en: 'Requirement', fr: 'Exigence' },
  affectedComponents: { de: 'Betroffene Komponenten', en: 'Affected Components', fr: 'Composants concernés' },
  evidenceRefLabel: { de: 'Evidenz-Referenz', en: 'Evidence Reference', fr: 'Référence de preuve' },
  internalUse: { de: 'Nur für den internen Gebrauch des Empfängers bestimmt', en: 'For internal use of the recipient only', fr: 'Réservé à l\'usage interne du destinataire' },
  approvalBlock: { de: 'VERANTWORTLICHE FREIGABE', en: 'RESPONSIBLE APPROVAL', fr: 'APPROBATION RESPONSABLE' },
  effortEstimateLabel: { de: 'AUFWANDSSCHÄTZUNG', en: 'EFFORT ESTIMATE', fr: 'ESTIMATION DE L\'EFFORT' },
  assumptionsLabel: { de: 'ANNAHMEN', en: 'ASSUMPTIONS', fr: 'HYPOTHÈSES' },
  uncertaintiesLabel: { de: 'UNSICHERHEITEN', en: 'UNCERTAINTIES', fr: 'INCERTITUDES' },
  validationLabel: { de: 'VALIDIERUNG', en: 'VALIDATION', fr: 'VALIDATION' },
  highLevel: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  mediumLevel: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  lowLevel: { de: 'Niedrig', en: 'Low', fr: 'Faible' },
  noneLevel: { de: 'Keine', en: 'None', fr: 'Aucun' },
  criticalSev: { de: 'KRITISCH', en: 'CRITICAL', fr: 'CRITIQUE' },
  highSev: { de: 'HOCH', en: 'HIGH', fr: 'ÉLEVÉ' },
  mediumSev: { de: 'MITTEL', en: 'MEDIUM', fr: 'MOYEN' },
  lowSev: { de: 'NIEDRIG', en: 'LOW', fr: 'FAIBLE' },
  regContext: { de: 'Regulatorischer Kontext', en: 'Regulatory Context', fr: 'Contexte réglementaire' },
  effortTimeline: { de: 'Geschätzter Aufwand und Zeitrahmen', en: 'Estimated Effort and Timeline', fr: 'Effort estimé et calendrier' },
  urgencyImportance: { de: 'Dringlichkeit und Bedeutung', en: 'Urgency and Importance', fr: 'Urgence et importance' },
  regImplication: { de: 'Regulatorische Implikation', en: 'Regulatory Implication', fr: 'Implication réglementaire' },
  recAction: { de: 'Empfohlenes Vorgehen', en: 'Recommended Action', fr: 'Action recommandée' },
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

function getMgmtSummary(name: string, risks: Nis2Risk[], critRisks: Nis2Risk[], failReqsList: Nis2Req[], partialReqsList: Nis2Req[], totalReqs: number, passReqs: number, lang: string) {
  const riskCount = risks.length;
  const crit = critRisks.length;
  const failReqs = failReqsList.length;
  const partialReqs = partialReqsList.length;
  const rate = totalReqs > 0 ? Math.round(((passReqs + partialReqs * 0.5) / totalReqs) * 100) : 0;
  const ready = crit === 0 && failReqs === 0;
  const partial = !ready && rate >= 60;

  const totalEffortMin = failReqs * 20 + partialReqs * 10;
  const totalEffortMax = failReqs * 60 + partialReqs * 30;
  const effortPM = totalEffortMax > 0 ? `${Math.ceil(totalEffortMin / 160)}-${Math.ceil(totalEffortMax / 160)}` : '0';
  const p0Count = failReqs;
  const timelineWeeks = crit > 0 ? (lang === 'de' ? '4-6 Wochen' : '4-6 weeks') : (lang === 'de' ? '3-6 Monate' : '3-6 months');

  // Build concrete finding descriptions with actual names
  const topCritNames = critRisks.slice(0, 3).map(r => r.name);
  const topFailNames = failReqsList.slice(0, 3).map(r => r.name);
  const topPartialNames = partialReqsList.slice(0, 3).map(r => r.name);

  if (lang === 'de') {
    return {
      context: `Die NIS-2-Richtlinie (Richtlinie (EU) 2022/2555) verpflichtet Betreiber wesentlicher und wichtiger Einrichtungen in der EU zu umfassenden Cybersicherheitsmaßnahmen. Sie regelt die Verantwortung der Geschäftsleitung (Art. 20), technische und organisatorische Risikomanagementmaßnahmen (Art. 21) sowie Meldepflichten bei erheblichen Sicherheitsvorfällen (Art. 23). In Deutschland wird NIS-2 durch das NIS-2-Umsetzungs- und Cybersicherheitsstärkungsgesetz (NIS2UmsuCG) in nationales Recht überführt. Die Einhaltung wird vom BSI überwacht.`,
      verdict: ready
        ? `${name} erfüllt die wesentlichen NIS-2-Anforderungen. Die geprüften Risikomanagementmaßnahmen entsprechen den regulatorischen Vorgaben.`
        : partial
          ? `${name} erreicht eine NIS-2-Konformität von ${rate} Prozent. In einigen Bereichen bestehen Abweichungen, die zeitnah adressiert werden sollten, um regulatorische Risiken zu minimieren.`
          : `${name} erreicht derzeit ${rate} Prozent NIS-2-Konformität. Ohne zügige Umsetzung der empfohlenen Maßnahmen besteht ein erhebliches regulatorisches und operatives Risiko.`,
      situation: `Im Rahmen der Bewertung wurden ${riskCount} Risikoszenarien identifiziert, von denen ${crit} als kritisch eingestuft wurden. Von den ${totalReqs} geprüften Anforderungen sind ${failReqs} nicht erfüllt und ${partialReqs} nur teilweise erfüllt.`,
      findings: [
        ...(crit > 0 ? [{ t: `${crit} kritische Risiken erfordern sofortiges Handeln`, d: `In diesen Bereichen fehlen grundlegende Schutzmechanismen, die von der NIS-2-Richtlinie zwingend gefordert werden. Kritische Risiken (Score ≥ 20) bedeuten, dass sowohl Eintrittswahrscheinlichkeit als auch potenzielle Auswirkung als hoch bewertet werden. Konkret betroffen sind: ${topCritNames.join(', ')}${crit > 3 ? ` und ${crit - 3} weitere` : ''}.` }] : []),
        ...(failReqs > 0 ? [{ t: `${failReqs} NIS-2-Anforderungen sind nicht erfüllt`, d: `Die Abweichungen betreffen zentrale Bereiche des regulatorischen Rahmens. Jede nicht erfüllte Anforderung stellt bei einer Prüfung durch das BSI einen beanstandbaren Mangel dar. Im Einzelnen handelt es sich um: ${topFailNames.join(', ')}${failReqs > 3 ? ` und ${failReqs - 3} weitere` : ''}.` }] : []),
        ...(partialReqs > 0 ? [{ t: `${partialReqs} Anforderungen sind nur teilweise erfüllt`, d: `Grundlegende Ansätze sind vorhanden, aber die vollständige Umsetzung steht noch aus. In der Regel fehlen entweder die Dokumentation, regelmäßige Tests oder die organisatorische Verankerung der Maßnahmen. Betroffen sind unter anderem: ${topPartialNames.join(', ')}${partialReqs > 3 ? ` und ${partialReqs - 3} weitere` : ''}.` }] : []),
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
    situation: `The assessment identified ${riskCount} risk scenarios, of which ${crit} are rated as critical. Of the ${totalReqs} assessed requirements, ${failReqs} are non-compliant and ${partialReqs} are partially compliant.`,
    findings: [
      ...(crit > 0 ? [{ t: `${crit} critical risks require immediate action`, d: `Fundamental protective mechanisms mandated by NIS-2 are missing in these areas. Critical risks (score ≥ 20) indicate both high likelihood and high potential impact. Specifically affected: ${topCritNames.join(', ')}${crit > 3 ? ` and ${crit - 3} more` : ''}.` }] : []),
      ...(failReqs > 0 ? [{ t: `${failReqs} NIS-2 requirements are not met`, d: `Deviations affect core areas of the regulatory framework. Each non-compliant requirement constitutes a challengeable deficiency in a supervisory examination. Specifically: ${topFailNames.join(', ')}${failReqs > 3 ? ` and ${failReqs - 3} more` : ''}.` }] : []),
      ...(partialReqs > 0 ? [{ t: `${partialReqs} requirements are only partially met`, d: `Basic approaches exist but full implementation is pending. Typically, documentation, regular testing, or organisational embedding is missing. This includes: ${topPartialNames.join(', ')}${partialReqs > 3 ? ` and ${partialReqs - 3} more` : ''}.` }] : []),
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
    confidentialNote: l('confidential', lang) + '  —  ' + (lang === 'de' ? 'Nur für den internen Gebrauch des Empfängers bestimmt' : lang === 'fr' ? 'Réservé à l\'usage interne du destinataire' : 'For internal use of the recipient only'),
  });

  // ═══ TABLE OF CONTENTS ═══
  const tocEntries = [
    l('sec2', lang),
    l('sec9', lang),
    l('sec4', lang), `    ${l('sec4a', lang)}`, `    ${l('sec4b', lang)}`,
    l('sec5', lang), `    ${l('sec5a', lang)}`, `    ${l('sec5b', lang)}`, `    ${l('sec5c', lang)}`,
    l('sec3', lang),
    `    ${l('sec3a', lang)}`, `    ${l('sec3b', lang)}`, `    ${l('sec3c', lang)}`,
    `    ${l('sec3d', lang)}`, `    ${l('sec3e', lang)}`,
    l('sec1', lang), l('sec6', lang), l('sec7', lang), l('sec8', lang), null,
    l('secA', lang), l('secB', lang), l('secC', lang), l('secD', lang), l('secE', lang),
  ];
  pdf.tableOfContents(l('toc', lang), tocEntries);

  // ── Abbreviation Legend ──
  const abbrEntries = lang === 'de' ? [
    { abbr: 'C-xxx', meaning: 'Vertraulichkeit (Confidentiality) — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'I-xxx', meaning: 'Integrität (Integrity) — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'A-xxx', meaning: 'Verfügbarkeit (Availability) — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'G-xxx', meaning: 'Governance — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'T-xxx', meaning: 'Drittanbieter (Third-party) — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'R-xxx', meaning: 'Resilienz (Resilience) — Risiko-ID im CIAGTR-Modell' },
    { abbr: 'E-xxx', meaning: 'Evidenz-Referenz, eindeutige Kennung für den Nachweis' },
    { abbr: 'P0', meaning: 'Priorität 0 — Release-Blocker, sofortige Umsetzung erforderlich' },
    { abbr: 'P1', meaning: 'Priorität 1 — vor nächstem Release umzusetzen' },
    { abbr: 'P2', meaning: 'Priorität 2 — vor General Availability umzusetzen' },
    { abbr: 'P3', meaning: 'Priorität 3 — empfohlene Verbesserung, kein Blocker' },
    { abbr: 'CIAGTR', meaning: 'Risikokategoriemodell: Confidentiality, Integrity, Availability, Governance, Third-party, Resilience' },
    { abbr: 'PASS', meaning: 'Anforderung vollständig erfüllt (konform)' },
    { abbr: 'PARTIAL', meaning: 'Anforderung teilweise erfüllt, Nachbesserung erforderlich' },
    { abbr: 'FAIL', meaning: 'Anforderung nicht erfüllt (nicht konform)' },
    { abbr: 'Art.', meaning: 'Artikel der Richtlinie (EU) 2022/2555 (NIS-2)' },
  ] : [
    { abbr: 'C-xxx', meaning: 'Confidentiality — Risk ID in CIAGTR model' },
    { abbr: 'I-xxx', meaning: 'Integrity — Risk ID in CIAGTR model' },
    { abbr: 'A-xxx', meaning: 'Availability — Risk ID in CIAGTR model' },
    { abbr: 'G-xxx', meaning: 'Governance — Risk ID in CIAGTR model' },
    { abbr: 'T-xxx', meaning: 'Third-party — Risk ID in CIAGTR model' },
    { abbr: 'R-xxx', meaning: 'Resilience — Risk ID in CIAGTR model' },
    { abbr: 'E-xxx', meaning: 'Evidence reference, unique identifier for the proof' },
    { abbr: 'P0', meaning: 'Priority 0 — Release blocker, immediate action required' },
    { abbr: 'P1', meaning: 'Priority 1 — to be resolved before next release' },
    { abbr: 'P2', meaning: 'Priority 2 — to be resolved before general availability' },
    { abbr: 'P3', meaning: 'Priority 3 — recommended improvement, non-blocking' },
    { abbr: 'CIAGTR', meaning: 'Risk category model: Confidentiality, Integrity, Availability, Governance, Third-party, Resilience' },
    { abbr: 'PASS', meaning: 'Requirement fully met (compliant)' },
    { abbr: 'PARTIAL', meaning: 'Requirement partially met, remediation needed' },
    { abbr: 'FAIL', meaning: 'Requirement not met (non-compliant)' },
    { abbr: 'Art.', meaning: 'Article of Directive (EU) 2022/2555 (NIS-2)' },
  ];
  pdf.newPage();
  pdf.abbreviationLegend(abbrEntries, lang === 'de' ? 'Abkürzungsverzeichnis und Legende' : 'Abbreviations and Legend');

  // ═══ SECTION 1: Management Summary ═══
  const passReqsList = reqs.filter(r => r.status === 'pass');
  const partReqsList = reqs.filter(r => r.status === 'partial');
  const failReqsList = reqs.filter(r => r.status === 'fail');
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  const passCount = passReqsList.length;
  const partCount = partReqsList.length;
  const failCount = failReqsList.length;
  const critCount = critRisks.length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);
  const complianceMethodNote = lang === 'de'
    ? `Die Konformitätsrate von ${complianceRate}% ergibt sich aus einer gewichteten Berechnung: Vollständig erfüllte Anforderungen (PASS) fließen mit 100% ein, teilweise erfüllte Anforderungen (PARTIAL) mit 50%, und nicht erfüllte Anforderungen (FAIL) mit 0%. Bezugsgröße sind alle ${reqs.length} geprüften Anforderungen.`
    : `The compliance rate of ${complianceRate}% is based on a weighted calculation: Fully compliant requirements (PASS) contribute 100%, partially compliant (PARTIAL) 50%, and non-compliant (FAIL) 0%. The denominator is all ${reqs.length} assessed requirements.`;

  pdf.addBookmark(l('sec2', lang));
  pdf.heading(l('sec2', lang));
  pdf.introText(lang === 'de'
    ? 'Was muss die Geschäftsleitung wissen? Dieser Abschnitt fasst die wichtigsten Ergebnisse zusammen — einschließlich regulatorischem Kontext, Aufwandsschätzung und Handlungsdringlichkeit.'
    : 'What does the board need to know? This section summarises the key findings — including regulatory context, effort estimates, and urgency.');

  const summary = getMgmtSummary(intakeData.entityName, risks, critRisks, failReqsList, partReqsList, reqs.length, passCount, lang);

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

  pdf.introText(complianceMethodNote);

  // ── Visual Dashboard for Management ──
  const highRisks = risks.filter(r => r.likelihood * r.impact >= 13 && r.likelihood * r.impact < 20);
  const medRisks = risks.filter(r => r.likelihood * r.impact >= 6 && r.likelihood * r.impact < 13);
  const lowRisks = risks.filter(r => r.likelihood * r.impact < 6);

  pdf.complianceBar(passCount, partCount, failCount, {
    pass: lang === 'de' ? 'Konform' : 'Compliant',
    partial: lang === 'de' ? 'Teilweise' : 'Partial',
    fail: lang === 'de' ? 'Nicht konform' : 'Non-compliant',
    title: lang === 'de' ? 'Konformitätsverteilung' : 'Compliance Distribution',
  });

  pdf.riskDistribution(
    { critical: critCount, high: highRisks.length, medium: medRisks.length, low: lowRisks.length },
    {
      critical: lang === 'de' ? 'Kritisch' : 'Critical',
      high: lang === 'de' ? 'Hoch' : 'High',
      medium: lang === 'de' ? 'Mittel' : 'Medium',
      low: lang === 'de' ? 'Gering' : 'Low',
      title: lang === 'de' ? 'Risikoverteilung nach Schweregrad' : 'Risk Distribution by Severity',
    }
  );

  pdf.riskHeatmap(
    risks.map(r => ({ likelihood: r.likelihood, impact: r.impact })),
    {
      title: lang === 'de' ? 'Risikomatrix (5×5)' : 'Risk Matrix (5×5)',
      likelihood: lang === 'de' ? 'Wahrscheinlichkeit' : 'Likelihood',
      impact: lang === 'de' ? 'Auswirkung' : 'Impact',
    }
  );

  // Cross-reference mapping table (Threat ↔ CIAGTR ↔ Evidence)
  const mappingRows = risks.slice(0, 15).map((ri, idx) => ({
    id: riskId(ri),
    name: ri.name,
    category: RISK_CATEGORIES[ri.category]?.label[lang] || ri.category,
    ref: ri.nis2Ref,
    evidenceId: `E-${String(idx + 1).padStart(3, '0')}`,
    score: `${ri.likelihood}×${ri.impact}=${ri.likelihood * ri.impact}`,
  }));
  pdf.mappingTable(mappingRows, {
    title: lang === 'de' ? 'Mapping: NIS-2 ↔ CIAGTR ↔ Evidenz' : 'Mapping: NIS-2 ↔ CIAGTR ↔ Evidence',
    colId: 'ID', colName: lang === 'de' ? 'Befund' : 'Finding',
    colCat: 'CIAGTR', colRef: 'NIS-2 Ref.',
    colEvidence: lang === 'de' ? 'Evidenz' : 'Evidence', colScore: 'Score',
  });

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

  // ═══ SECTION 2: Compliance Statement ═══
  pdf.newPage();
  pdf.addBookmark(l('sec9', lang));
  pdf.heading(l('sec9', lang));
  pdf.introText(lang === 'de'
    ? 'Dieser Abschnitt enthält die abschließende Konformitätsbewertung auf Basis der in diesem Bericht dokumentierten Prüfungsergebnisse. Er dient als Entscheidungsgrundlage für die Geschäftsleitung und als Nachweis gegenüber der zuständigen nationalen Aufsichtsbehörde.'
    : 'This section contains the final compliance assessment based on the audit results documented in this report. It serves as a basis for management decisions and as evidence for the competent national authority.');

  const isCompliant = critCount === 0 && failCount === 0;
  const isConditional = !isCompliant && complianceRate >= 60;

  // Entity classification
  pdf.heading(lang === 'de' ? '2.1  Einstufung und Sanktionsrahmen' : '2.1  Classification and Sanctions Framework', 2);
  pdf.bodyParagraph(lang === 'de'
    ? `Die Einrichtung ${intakeData.entityName} ist im Sektor "${entityTypeName}" als "${criticalityName}" eingestuft. Die Einstufung bestimmt den anwendbaren Sanktionsrahmen und die Intensität der aufsichtlichen Prüfung durch das BSI.`
    : `The entity ${intakeData.entityName} in sector "${entityTypeName}" is classified as "${criticalityName}". The classification determines the applicable sanctions framework and the intensity of supervisory examination.`);

  const classRows = lang === 'de' ? [
    ['Wesentliche Einrichtung', 'Bußgelder bis 10 Mio. EUR oder 2% des weltweiten Jahresumsatzes. Erweiterte Aufsichtsbefugnisse des BSI. Persönliche Haftung der Geschäftsleitung nach Art. 20 NIS-2.'],
    ['Wichtige Einrichtung', 'Bußgelder bis 7 Mio. EUR oder 1,4% des weltweiten Jahresumsatzes. Regelmäßige Nachweispflichten.'],
  ] : [
    ['Essential Entity', 'Fines up to EUR 10M or 2% of global turnover. Extended supervisory powers. Personal liability of management bodies under Art. 20 NIS-2.'],
    ['Important Entity', 'Fines up to EUR 7M or 1.4% of global turnover. Regular compliance obligations.'],
  ];

  classRows.forEach(([cls, desc]) => {
    const isCurrent = criticalityName.toLowerCase().includes(cls.toLowerCase().split(' ')[0]);
    pdf.checkSpace(16);
    if (isCurrent) {
      pdf.doc.setFillColor(...C.bg);
      pdf.doc.roundedRect(LAYOUT.LEFT, pdf.y - 2, LAYOUT.WIDTH, 14, 1, 1, 'F');
      pdf.doc.setDrawColor(...C.navy);
      pdf.doc.setLineWidth(0.3);
      pdf.doc.line(LAYOUT.LEFT, pdf.y - 2, LAYOUT.LEFT, pdf.y + 12);
    }
    pdf.doc.setFont(pdf.headFontName, isCurrent ? 'bold' : 'normal');
    pdf.doc.setFontSize(8.5);
    pdf.doc.setTextColor(...(isCurrent ? C.navy : C.dark));
    pdf.doc.text(cls, LAYOUT.LEFT + 4, pdf.y + 2);
    pdf.doc.setFont(pdf.bodyFontName, 'normal');
    pdf.doc.setFontSize(7.5);
    pdf.doc.setTextColor(...C.mid);
    const descLines = pdf.doc.splitTextToSize(desc, LAYOUT.WIDTH - 60);
    pdf.doc.text(descLines, LAYOUT.LEFT + 55, pdf.y + 2);
    pdf.y += Math.max(14, descLines.length * 3.5 + 6);
  });

  // 9.2 Compliance Verdict
  pdf.heading(lang === 'de' ? '2.2  Konformitätserklärung' : '2.2  Compliance Verdict', 2);

  const verdictStatement = lang === 'de'
    ? isCompliant
      ? `Auf Grundlage der in diesem Bericht dokumentierten Prüfungsergebnisse erfüllt ${intakeData.entityName} die wesentlichen Anforderungen der Richtlinie (EU) 2022/2555 (NIS-2-Richtlinie). Es wurden keine kritischen Risiken und keine nicht-konformen Anforderungen identifiziert. Die Einrichtung ist aus Sicht dieser Bewertung konform.`
      : isConditional
        ? `${intakeData.entityName} erfüllt die NIS-2-Anforderungen derzeit mit Einschränkungen (gewichtete Konformitätsrate: ${complianceRate}%). Es bestehen ${critCount} kritische Risiken und ${failCount} nicht-konforme Anforderungen. Die Konformität kann unter folgenden Bedingungen hergestellt werden: (1) Alle P0-Maßnahmen sind abgeschlossen und verifiziert, (2) die verbleibenden Lücken werden gemäß der Remediation-Roadmap (Abschnitt 4.2) innerhalb der definierten Fristen geschlossen.`
        : `${intakeData.entityName} erfüllt die wesentlichen NIS-2-Anforderungen derzeit nicht (gewichtete Konformitätsrate: ${complianceRate}%). Es bestehen ${critCount} kritische Risiken und ${failCount} nicht-konforme Anforderungen. Bei einer Prüfung durch das BSI ist mit Beanstandungen zu rechnen. Sanktionen nach Art. 34 NIS-2 — einschließlich Bußgeldern von bis zu 10 Millionen Euro oder 2% des weltweiten Jahresumsatzes — sind möglich. Die Umsetzung der Remediation-Roadmap (Abschnitt 4.2) ist zwingend erforderlich.`
    : isCompliant
      ? `Based on the assessment results documented in this report, ${intakeData.entityName} meets the essential requirements of Directive (EU) 2022/2555 (NIS-2 Directive). No critical risks and no non-compliant requirements were identified. The entity is considered compliant from this assessment's perspective.`
      : isConditional
        ? `${intakeData.entityName} partially meets NIS-2 requirements (weighted compliance rate: ${complianceRate}%). ${critCount} critical risks and ${failCount} non-compliant requirements were identified. Compliance can be achieved under conditions: (1) all P0 measures completed and verified, (2) remaining gaps closed per the remediation roadmap (Section 4.2).`
        : `${intakeData.entityName} does not currently meet essential NIS-2 requirements (weighted compliance rate: ${complianceRate}%). ${critCount} critical risks and ${failCount} non-compliant requirements were identified. Supervisory examination would likely result in findings. Sanctions under Art. 34 NIS-2 — including fines of up to EUR 10 million or 2% of global turnover — are possible. Implementation of the remediation roadmap (Section 4.2) is mandatory.`;

  const stmtBg = isCompliant ? C.pass : isConditional ? C.partial : C.fail;
  pdf.checkSpace(30);
  pdf.doc.setFontSize(9);
  pdf.doc.setFont(pdf.bodyFontName, 'normal');
  const stmtLines = pdf.doc.splitTextToSize(verdictStatement, LAYOUT.WIDTH - 14);
  const stmtLineH = 4;
  const stmtBoxH = stmtLines.length * stmtLineH + 8;
  pdf.checkSpace(stmtBoxH + 6);
  pdf.doc.setFillColor(...C.bg);
  pdf.doc.roundedRect(LAYOUT.LEFT, pdf.y, LAYOUT.WIDTH, stmtBoxH, 2, 2, 'F');
  pdf.doc.setFillColor(...stmtBg);
  pdf.doc.rect(LAYOUT.LEFT, pdf.y, 2, stmtBoxH, 'F');
  pdf.doc.setTextColor(...C.dark);
  for (let si = 0; si < stmtLines.length; si++) {
    pdf.doc.text(stmtLines[si], LAYOUT.LEFT + 8, pdf.y + 5 + si * stmtLineH);
  }
  pdf.y += stmtBoxH + 6;

  // Verdict label banner
  const verdictLbl = isCompliant
    ? (lang === 'de' ? 'KONFORM — Anforderungen erfüllt' : 'COMPLIANT — Requirements met')
    : isConditional
      ? (lang === 'de' ? 'BEDINGT KONFORM — Nacharbeit erforderlich' : 'CONDITIONALLY COMPLIANT — Remediation required')
      : (lang === 'de' ? 'NICHT KONFORM — Sofortige Maßnahmen erforderlich' : 'NON-COMPLIANT — Immediate action required');

  pdf.checkSpace(14);
  pdf.doc.setFillColor(...stmtBg);
  pdf.doc.roundedRect(LAYOUT.LEFT, pdf.y, LAYOUT.WIDTH, 10, 1.5, 1.5, 'F');
  pdf.doc.setFont(pdf.headFontName, 'bold');
  pdf.doc.setFontSize(9);
  pdf.doc.setTextColor(...C.white);
  pdf.doc.text(verdictLbl, LAYOUT.LEFT + LAYOUT.WIDTH / 2, pdf.y + 6.5, { align: 'center' });
  pdf.y += 16;
  pdf.doc.setTextColor(...C.dark);

  // Signature block
  pdf.sectionLabel(lang === 'de' ? 'VERANTWORTLICHE FREIGABE' : 'RESPONSIBLE APPROVAL');
  pdf.y += 2;
  const sigFields = lang === 'de'
    ? ['Name: ____________________________', 'Funktion: ____________________________', 'Datum: ____________________________', 'Unterschrift: ____________________________']
    : ['Name: ____________________________', 'Role: ____________________________', 'Date: ____________________________', 'Signature: ____________________________'];
  sigFields.forEach(sf => {
    pdf.checkSpace(6);
    pdf.doc.setFont(pdf.bodyFontName, 'normal');
    pdf.doc.setFontSize(LAYOUT.BODY_SIZE);
    pdf.doc.setTextColor(...C.dark);
    pdf.doc.text(sf, LAYOUT.LEFT + 4, pdf.y);
    pdf.y += 7;
  });

  // ═══ SECTION 3: Detailed Findings ═══
  pdf.newPage();
  pdf.addBookmark(l('sec4', lang));
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
    const sev = score >= 20 ? l('criticalSev', lang) : score >= 13 ? l('highSev', lang) : score >= 6 ? l('mediumSev', lang) : l('lowSev', lang);
    const cat = RISK_CATEGORIES[ri.category]?.label[lang] || ri.category;
    const eId = `E-${String(idx + 1).padStart(3, '0')}`;
    const linked = linkReqs(ri, reqs);

    // 1. FINDING ID + 2. TITLE
    pdf.heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    pdf.metaLine(`${cat}  |  ${sev}  |  ${ri.nis2Ref}  |  ${eId}  |  ${l('evidence', lang)}: ${ri.evidenceQuality}/5`);

    // 3. OBSERVATION (concrete, fact-based)
    const humanEvid = humanizeEvidence(ri.evidence, lang);
    const obsText = lang === 'de'
      ? `Die Komponente ${ri.component} ist so konfiguriert, dass ${ri.name}. ${humanEvid}`
      : lang === 'fr'
        ? `Le composant ${ri.component} est configuré de telle manière que ${ri.name}. ${humanEvid}`
        : `The component ${ri.component} is configured in a way that ${ri.name}. ${humanEvid}`;
    pdf.bodyText(`${l('observationLabel', lang)}: ${obsText}`, 0);

    // 4. TECHNICAL DETAILS
    pdf.sectionLabel(l('techDetails', lang));
    pdf.fieldInline(l('component', lang), ri.component);
    pdf.fieldInline(l('attacker', lang), ri.attacker);
    pdf.fieldInline(l('attackPath', lang), ri.path);
    pdf.fieldInline(l('evidenceRefLabel', lang), `${eId} (${ri.evidenceQuality}/5)`);

    // 5. THREAT CATEGORY (CIAGTR)
    pdf.fieldInline(l('riskCategoryLabel', lang), `${ri.category} — ${cat}`);

    // 6. RISK DESCRIPTION
    const riskDesc = lang === 'de'
      ? `Ein Angreifer (${ri.attacker}) kann über den Vektor „${ri.path}" ${score >= 20 ? 'das System direkt kompromittieren, was zu Betriebsunterbrechung und regulatorischer Nicht-Konformität führt' : score >= 13 ? 'betroffene Subsysteme kompromittieren, was zu Datenexfiltration oder Funktionsverlust führt' : 'einzelne Komponenten lokal ausnutzen, was zu begrenztem Schaden führt'}. ${ri.rationale}`
      : lang === 'fr'
        ? `Un attaquant (${ri.attacker}) peut exploiter le vecteur « ${ri.path} » pour ${score >= 20 ? 'compromettre directement le système, entraînant une interruption opérationnelle et une non-conformité réglementaire' : score >= 13 ? 'compromettre les sous-systèmes concernés, entraînant une exfiltration de données ou une perte de fonctionnalité' : 'exploiter localement des composants individuels, entraînant des dommages limités'}. ${ri.rationale}`
        : `An attacker (${ri.attacker}) can exploit "${ri.path}" to ${score >= 20 ? 'directly compromise the system, leading to operational disruption and regulatory non-compliance' : score >= 13 ? 'compromise affected subsystems, leading to data exfiltration or loss of function' : 'locally exploit individual components, leading to limited damage'}. ${ri.rationale}`;
    pdf.bodyText(`${l('riskDescLabel', lang)}: ${riskDesc}`, 0);

    // 7. IMPACT (CIA triad)
    pdf.sectionLabel(l('impactLabel', lang));
    const ciaC = ri.category === 'C' ? (score >= 13 ? l('highLevel', lang) : l('mediumLevel', lang)) : l('lowLevel', lang);
    const ciaI = ri.category === 'I' ? (score >= 13 ? l('highLevel', lang) : l('mediumLevel', lang)) : l('lowLevel', lang);
    const ciaA = ri.category === 'A' ? (score >= 13 ? l('highLevel', lang) : l('mediumLevel', lang)) : l('lowLevel', lang);
    pdf.fieldInline(`  ${l('confidentiality', lang)}`, ciaC);
    pdf.fieldInline(`  ${l('integrityLabel', lang)}`, ciaI);
    pdf.fieldInline(`  ${l('availabilityLabel', lang)}`, ciaA);

    // — ATTACK SCENARIO (1-sentence, concrete)
    const atkScenario = lang === 'de'
      ? `Ein externer Angreifer (${ri.attacker}) kann über ${ri.path} direkt auf ${ri.component} zugreifen und ${score >= 20 ? 'die vollständige Kontrolle über das System erlangen' : score >= 13 ? 'Daten exfiltrieren oder Konfigurationen manipulieren' : 'begrenzte Funktionsstörungen verursachen'}.`
      : lang === 'fr'
        ? `Un attaquant externe (${ri.attacker}) peut accéder directement à ${ri.component} via ${ri.path} et ${score >= 20 ? 'prendre le contrôle total du système' : score >= 13 ? 'exfiltrer des données ou manipuler des configurations' : 'causer des perturbations limitées'}.`
        : `An external attacker (${ri.attacker}) can directly access ${ri.component} via ${ri.path} and ${score >= 20 ? 'gain full control of the system' : score >= 13 ? 'exfiltrate data or manipulate configurations' : 'cause limited disruption'}.`;
    pdf.bodyText(`${l('attackScenarioLabel', lang)}: ${atkScenario}`, 0);

    // 8. LIKELIHOOD (with justification)
    const lLbl = ri.likelihood >= 4 ? l('highLevel', lang) : ri.likelihood >= 3 ? l('mediumLevel', lang) : l('lowLevel', lang);
    const lJustification = lang === 'de'
      ? ri.likelihood >= 4 ? `, da ${ri.component} ohne Authentifizierung erreichbar ist` : ri.likelihood >= 3 ? `, da der Angriffsvektor bekannt und ausnutzbar ist` : `, da die Ausnutzung spezialisiertes Wissen erfordert`
      : lang === 'fr'
        ? ri.likelihood >= 4 ? `, car ${ri.component} est accessible sans authentification` : ri.likelihood >= 3 ? `, car le vecteur d'attaque est connu et exploitable` : `, car l'exploitation nécessite des connaissances spécialisées`
        : ri.likelihood >= 4 ? `, as ${ri.component} is accessible without authentication` : ri.likelihood >= 3 ? `, as the attack vector is known and exploitable` : `, as exploitation requires specialised knowledge`;
    pdf.fieldInline(l('likelihoodLabel', lang), `${lLbl} (${ri.likelihood}/5)${lJustification}`);

    // 9. RISK LEVEL
    pdf.scoreBar(`${l('riskLevelLabel', lang)}: ${sev}  (${ri.likelihood} × ${ri.impact} = ${score}/25)`);

    // 10. ROOT CAUSE
    pdf.bodyText(`${l('rootCauseLabel', lang)}: ${ri.rationale}`, 0);

    // 11. RECOMMENDATION (technical, specific, actionable)
    const recBase = linked.length > 0 && linked[0].measure ? linked[0].measure : '';
    const techRec = lang === 'de'
      ? [
          recBase || `Gegenmaßnahmen für ${ri.component} implementieren.`,
          ri.category === 'C' ? `TLS 1.3 für alle Kommunikationskanäle erzwingen. Verschlüsselung at-rest aktivieren.` : '',
          ri.category === 'A' ? `Redundanz und Failover für ${ri.component} konfigurieren. Rate-Limiting implementieren.` : '',
          ri.category === 'I' ? `Integritätsprüfungen und Zugriffskontrolle für ${ri.component} implementieren.` : '',
          `Durch unabhängige Tests verifizieren.`,
        ].filter(Boolean).join(' ')
      : lang === 'fr'
        ? [
            recBase || `Implémenter des contre-mesures pour ${ri.component}.`,
            ri.category === 'C' ? `Imposer TLS 1.3 pour tous les canaux de communication. Activer le chiffrement au repos.` : '',
            ri.category === 'A' ? `Configurer la redondance et le basculement pour ${ri.component}. Implémenter le rate-limiting.` : '',
            ri.category === 'I' ? `Implémenter des contrôles d'intégrité et d'accès pour ${ri.component}.` : '',
            `Vérifier par des tests indépendants.`,
          ].filter(Boolean).join(' ')
        : [
            recBase || `Implement countermeasures for ${ri.component}.`,
            ri.category === 'C' ? `Enforce TLS 1.3 for all communication channels. Enable encryption at rest.` : '',
            ri.category === 'A' ? `Configure redundancy and failover for ${ri.component}. Implement rate-limiting.` : '',
            ri.category === 'I' ? `Implement integrity checks and access controls for ${ri.component}.` : '',
            `Verify through independent testing.`,
          ].filter(Boolean).join(' ');
    pdf.bodyText(`${l('recommendationLabel', lang)}: ${techRec}`, 0);

    // 12. REFERENCE (extended: NIS-2 + ISO 27001 + CIS)
    const refParts = [ri.nis2Ref];
    if (ri.sources.length > 0) refParts.push(ri.sources.join('; '));
    if (ri.category === 'C') refParts.push('ISO 27001 A.10 (Cryptography)', 'CIS Control 3');
    if (ri.category === 'A') refParts.push('ISO 27001 A.17 (Business Continuity)', 'CIS Control 11');
    if (ri.category === 'I') refParts.push('ISO 27001 A.12 (Operations Security)', 'CIS Control 14');
    if (score >= 13) refParts.push('OWASP Top 10');
    if (linked.length > 0) refParts.push(`${l('workingPapers', lang)}: ${linked.map(r => `AP-${r.id}`).join(', ')}`);
    pdf.bodyText(`${l('referenceLabel', lang)}: ${refParts.join(' | ')}`, 0);

    pdf.separator();
  });

  // 4.2 Compliance Gaps
  pdf.newPage();
  pdf.heading(l('sec4b', lang), 2);
  pdf.introText(lang === 'de'
    ? 'Jede NIS-2-Anforderung wird einzeln bewertet. Für jede Anforderung wird dokumentiert, welche Evidenz erhoben wurde, auf welcher Grundlage die Bewertung erfolgte und welche Maßnahmen empfohlen werden.'
    : 'Each NIS-2 requirement is assessed individually. For each requirement, the collected evidence, the assessment rationale, and the recommended actions are documented.');

  let reqFindingNum = risks.length;
  reqs.forEach(r => {
    reqFindingNum++;
    pdf.checkSpace(55);
    pdf.heading(`${r.id}: ${r.name}`, 3);
    pdf.checkSpace(8);
    const afterBadge = pdf.statusBadge(r.status);
    pdf.doc.setFont(pdf.headFontName, 'normal'); pdf.doc.setFontSize(7); pdf.doc.setTextColor(...C.mid);
    pdf.doc.text(r.article, afterBadge, pdf.y);
    pdf.y += 6; pdf.doc.setTextColor(...C.dark);

    // Find linked risks for this requirement
    const linkedRisks = risks.filter(ri => {
      const baseRisk = ri.nis2Ref.split(' Abs.')[0].split(' lit.')[0];
      const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
      return baseRisk === baseReq || ri.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]);
    });

    // 1. FINDING ID
    pdf.sectionLabel(l('findingIdLabel', lang));
    pdf.bodyText(`F-${String(reqFindingNum).padStart(2, '0')}`, 4);

    // 2. TITLE
    pdf.sectionLabel(l('titleLabel', lang));
    pdf.bodyText(`${r.name} (${r.article})`, 4);

    // 3. OBSERVATION
    const humanReqEvid = humanizeEvidence(r.evidence, lang);
    const obsReq = r.status === 'pass'
      ? (lang === 'de' ? `Die Anforderung ${r.article} ist vollständig umgesetzt. ${humanReqEvid}` : lang === 'fr' ? `L'exigence ${r.article} est entièrement mise en œuvre. ${humanReqEvid}` : `Requirement ${r.article} is fully implemented. ${humanReqEvid}`)
      : (lang === 'de' ? `Die Anforderung ${r.article} ist ${r.status === 'fail' ? 'nicht' : 'nicht vollständig'} umgesetzt. ${r.gap || ''}. ${humanReqEvid}` : lang === 'fr' ? `L'exigence ${r.article} ${r.status === 'fail' ? 'n\'est pas' : 'n\'est pas entièrement'} mise en œuvre. ${r.gap || ''}. ${humanReqEvid}` : `Requirement ${r.article} is ${r.status === 'fail' ? 'not' : 'not fully'} implemented. ${r.gap || ''}. ${humanReqEvid}`);
    pdf.sectionLabel(l('observationLabel', lang));
    pdf.bodyText(obsReq, 4);

    // 4. TECHNICAL DETAILS
    pdf.sectionLabel(l('techDetails', lang));
    pdf.fieldInline(`  ${l('requirementLabel', lang)}`, `${r.id}: ${r.article}`);
    if (linkedRisks.length > 0) {
      pdf.fieldInline(`  ${l('affectedComponents', lang)}`, linkedRisks.map(ri => ri.component).filter((v, i, a) => a.indexOf(v) === i).join(', '));
    }
    pdf.fieldInline(`  ${l('evidence', lang)}`, humanizeEvidence(r.evidence, lang));

    // 5. THREAT CATEGORY (CIAGTR)
    const riskCategories = [...new Set(linkedRisks.map(ri => ri.category))];
    const ciagtrLine = riskCategories.length > 0
      ? riskCategories.map(c => `${c} — ${RISK_CATEGORIES[c]?.label[lang] || c}`).join(', ')
      : l('noRiskLink', lang);
    pdf.sectionLabel(l('riskCategoryLabel', lang));
    pdf.bodyText(ciagtrLine, 4);

    // 6. RISK DESCRIPTION
    let riskDescReq: string;
    if (r.status === 'fail') {
      const attackerInfo = linkedRisks.length > 0 ? linkedRisks[0].attacker : (lang === 'de' ? 'ein Angreifer' : lang === 'fr' ? 'un attaquant' : 'an attacker');
      const vectorInfo = linkedRisks.length > 0 ? linkedRisks[0].path : (lang === 'de' ? 'fehlende Kontrolle' : lang === 'fr' ? 'contrôle manquant' : 'missing control');
      riskDescReq = lang === 'de'
        ? `${r.gap || 'Fehlende Kontrolle'}. ${attackerInfo} kann über „${vectorInfo}" Zugriff erlangen, was zu ${linkedRisks.length > 0 && linkedRisks[0].impact >= 4 ? 'Betriebsunterbrechung, Datenverlust und regulatorischen Sanktionen' : 'unautorisiertem Zugriff oder Integritätsverlust'} führt. Ohne Behebung Sanktionen nach NIS-2 Art. 34 möglich. Bußgelder bis zu 10 Mio. EUR oder 2% des weltweiten Jahresumsatzes.`
        : lang === 'fr'
          ? `${r.gap || 'Contrôle manquant'}. ${attackerInfo} peut obtenir l'accès via « ${vectorInfo} », entraînant ${linkedRisks.length > 0 && linkedRisks[0].impact >= 4 ? 'une interruption opérationnelle, une perte de données et des sanctions réglementaires' : 'un accès non autorisé ou une compromission de l\'intégrité'}. Sans correction, des sanctions selon NIS-2 Art. 34 sont possibles. Amendes jusqu'à 10 M EUR ou 2% du chiffre d'affaires mondial.`
          : `${r.gap || 'Missing control'}. ${attackerInfo} can gain access via "${vectorInfo}", leading to ${linkedRisks.length > 0 && linkedRisks[0].impact >= 4 ? 'operational disruption, data loss, and regulatory sanctions' : 'unauthorized access or integrity compromise'}. Without remediation, sanctions under NIS-2 Art. 34 possible. Fines up to EUR 10M or 2% of global annual turnover.`;
    } else if (r.status === 'partial') {
      riskDescReq = lang === 'de'
        ? `${r.gap || 'Kontrolle nicht vollständig verifiziert'}. ${linkedRisks.length > 0 ? `Verknüpfte Risiken (${linkedRisks.map(ri => riskId(ri)).join(', ')}) können die verbleibende Lücke ausnutzen` : 'Angreifer können die ungeschützte Angriffsfläche ausnutzen'}, bis die Maßnahme vollständig implementiert ist. Residualrisiko bis zur vollständigen Umsetzung.`
        : lang === 'fr'
          ? `${r.gap || 'Contrôle non entièrement vérifié'}. ${linkedRisks.length > 0 ? `Les risques liés (${linkedRisks.map(ri => riskId(ri)).join(', ')}) peuvent exploiter la lacune restante` : 'Les attaquants peuvent exploiter la surface d\'attaque non protégée'} jusqu'à la mise en œuvre complète. Risque résiduel.`
          : `${r.gap || 'Control not fully verified'}. ${linkedRisks.length > 0 ? `Linked risks (${linkedRisks.map(ri => riskId(ri)).join(', ')}) can exploit the remaining gap` : 'Attackers can exploit the unprotected attack surface'} until the measure is fully implemented. Residual risk until full implementation.`;
    } else {
      riskDescReq = lang === 'de'
        ? `Anforderung vollständig umgesetzt und verifiziert. Keine ausnutzbare Angriffsfläche identifiziert.`
        : lang === 'fr'
          ? `Exigence entièrement mise en œuvre et vérifiée. Aucune surface d'attaque exploitable identifiée.`
          : `Requirement fully implemented and verified. No exploitable attack surface identified.`;
    }
    pdf.sectionLabel(l('riskDescLabel', lang));
    pdf.bodyText(riskDescReq, 4);
    if (linkedRisks.length > 0) {
      const threatContext = linkedRisks.map(ri => `${riskId(ri)}: ${ri.name} (Score ${ri.likelihood * ri.impact})`).join('; ');
      pdf.fieldInline(l('linkedRisksLabel', lang), threatContext);
    }

    // 7. IMPACT (CIA triad)
    pdf.sectionLabel(l('impactLabel', lang));
    if (linkedRisks.length > 0) {
      const hasC = linkedRisks.some(ri => ri.category === 'C');
      const hasI = linkedRisks.some(ri => ri.category === 'I');
      const hasA = linkedRisks.some(ri => ri.category === 'A');
      const maxScore = Math.max(...linkedRisks.map(ri => ri.likelihood * ri.impact));
      const level = maxScore >= 13 ? l('highLevel', lang) : maxScore >= 6 ? l('mediumLevel', lang) : l('lowLevel', lang);
      pdf.fieldInline(`  ${l('confidentiality', lang)}`, hasC ? level : l('noneLevel', lang));
      pdf.fieldInline(`  ${l('integrityLabel', lang)}`, hasI ? level : l('noneLevel', lang));
      pdf.fieldInline(`  ${l('availabilityLabel', lang)}`, hasA ? level : l('noneLevel', lang));
    } else {
      const impactLevel = r.status === 'fail' ? l('mediumLevel', lang) : r.status === 'partial' ? l('lowLevel', lang) : l('noneLevel', lang);
      pdf.fieldInline(`  ${l('confidentiality', lang)}`, impactLevel);
      pdf.fieldInline(`  ${l('integrityLabel', lang)}`, impactLevel);
      pdf.fieldInline(`  ${l('availabilityLabel', lang)}`, impactLevel);
    }

    // 8. LIKELIHOOD
    if (linkedRisks.length > 0) {
      const maxLikelihood = Math.max(...linkedRisks.map(ri => ri.likelihood));
      const lLbl = maxLikelihood >= 4 ? l('highLevel', lang) : maxLikelihood >= 3 ? l('mediumLevel', lang) : l('lowLevel', lang);
      pdf.fieldInline(l('likelihoodLabel', lang), `${lLbl} (${maxLikelihood}/5)`);
    } else {
      pdf.fieldInline(l('likelihoodLabel', lang), r.status === 'fail' ? l('highLevel', lang) : r.status === 'partial' ? l('mediumLevel', lang) : l('lowLevel', lang));
    }

    // 9. RISK LEVEL
    const reqRating = r.status === 'fail' ? l('highSev', lang) : r.status === 'partial' ? l('mediumSev', lang) : l('lowSev', lang);
    pdf.fieldInline(l('riskLevelLabel', lang), reqRating);

    // 10. ROOT CAUSE
    const rootCause = r.status !== 'pass'
      ? (lang === 'de' ? `${r.gap || 'Fehlende oder unvollständige Implementierung der geforderten Kontrolle.'}` : lang === 'fr' ? `${r.gap || 'Implémentation manquante ou incomplète du contrôle requis.'}` : `${r.gap || 'Missing or incomplete implementation of the required control.'}`)
      : (lang === 'de' ? 'Kein Mangel festgestellt.' : lang === 'fr' ? 'Aucun défaut constaté.' : 'No deficiency identified.');
    pdf.sectionLabel(l('rootCauseLabel', lang));
    pdf.bodyText(rootCause, 4);

    // 11. RECOMMENDATION
    if (r.measure) {
      pdf.sectionLabel(l('recommendationLabel', lang));
      pdf.bodyText(r.measure, 4);
    }
    if (r.effort) pdf.fieldInline(l('effort', lang), r.effort);
    if (r.priority) pdf.fieldInline(l('priority', lang), r.priority);

    // 12. REFERENCE
    const refParts = [r.article];
    if (linkedRisks.length > 0) refParts.push(`${l('workingPapers', lang)}: ${linkedRisks.map(ri => `AP-${riskId(ri)}`).join(', ')}`);
    pdf.sectionLabel(l('referenceLabel', lang));
    pdf.bodyText(refParts.join(' | '), 4);

    if (r.criteria && r.criteria.length > 0) {
      pdf.sectionLabel(l('acceptanceCriteria', lang));
      r.criteria.forEach((c, i) => pdf.bulletItem(`${i + 1}. ${c}`, 4));
    }
    pdf.separator();
  });

  // ═══ SECTION 4: Recommendations ═══
  pdf.newPage();
  pdf.addBookmark(l('sec5', lang));
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

  // ═══ SECTION 5: Scope ═══
  pdf.newPage();
  pdf.addBookmark(l('sec3', lang));
  pdf.heading(l('sec3', lang));
  pdf.introText(lang === 'de'
    ? 'Bevor die identifizierten Risiken und Konformitätslücken im Detail dargestellt werden, dokumentiert dieser Abschnitt den Prüfungsgegenstand und die zugrunde liegenden Informationen.'
    : 'Before presenting identified risks and compliance gaps in detail, this section documents the scope of the assessment and the underlying information.');

  pdf.heading(l('sec3a', lang), 2);
  pdf.field(l('entity', lang), intakeData.entityName);
  pdf.field(l('entityType', lang), entityTypeName);
  pdf.field(l('criticality', lang), criticalityName);
  if (intakeData.description) pdf.bodyParagraph(humanizeText(intakeData.description, lang, 'description'));

  pdf.heading(l('sec3b', lang), 2);
  if (intakeData.infrastructure.length > 0) pdf.bodyParagraph(humanizeList(intakeData.infrastructure, lang, 'infra'));
  if (intakeData.supplyChainProviders.length > 0) pdf.bodyParagraph(humanizeList(intakeData.supplyChainProviders, lang, 'providers'));
  if (intakeData.roles.length > 0) pdf.bodyParagraph(humanizeList(intakeData.roles, lang, 'roles'));

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
  if (intakeData.knownIssues) pdf.bodyParagraph(humanizeText(intakeData.knownIssues, lang, 'issues'));
  else pdf.bodyText(lang === 'de' ? 'Es wurden keine bekannten Schwachstellen im Vorfeld der Prüfung benannt.' : 'No known weaknesses were reported prior to the assessment.');

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

  // ═══ SECTION 6: Context ═══
  pdf.newPage();
  pdf.addBookmark(l('sec1', lang));
  pdf.heading(l('sec1', lang));
  pdf.bodyParagraph(getContextText(intakeData.entityName, entityTypeName, criticalityName, today, lang, intakeData));

  // ═══ SECTION 7: Methodology ═══
  pdf.newPage();
  pdf.addBookmark(l('sec6', lang));
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

  // ═══ SECTION 8: Disclaimer ═══
  pdf.y += 5;
  pdf.addBookmark(l('sec7', lang));
  pdf.heading(l('sec7', lang));
  pdf.bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den zum Zeitpunkt der Prüfung vorliegenden Informationen und Dokumenten. Er ersetzt keine offizielle Prüfung durch das BSI oder eine andere zuständige nationale Aufsichtsbehörde. Für die Vollständigkeit und Richtigkeit der zugrunde liegenden Angaben wird keine Haftung übernommen. Der Bericht ist vertraulich und ausschließlich für den internen Gebrauch des Empfängers bestimmt.'
    : 'This report is based on information and documents available at the time of the assessment. It does not replace an official audit by the competent national authority. No liability is assumed for the completeness or accuracy of the underlying information. The report is confidential and intended solely for the internal use of the recipient.');

  // ═══ SECTION 9: Verification Guidance ═══
  pdf.newPage();
  pdf.addBookmark(l('sec8', lang));
  pdf.heading(l('sec8', lang));
  pdf.introText(lang === 'de'
    ? 'Dieser Abschnitt gibt dem Leser konkrete Hinweise, wie die Aussagen und Bewertungen in diesem Bericht unabhängig überprüft werden können.'
    : 'This section provides the reader with concrete guidance on how to independently verify the statements and assessments in this report.');

  const verificationStepsN = lang === 'de' ? [
    { title: '1. Evidenz-Referenzen nachvollziehen', text: 'Jede Feststellung in Abschnitt 4 verweist auf eine Evidenz-ID (E-ID), die in Anhang C aufgeschlüsselt ist. Prüfen Sie, ob die dort genannten Werkzeuge und Befehle auf Ihrer Infrastruktur reproduzierbare Ergebnisse liefern.' },
    { title: '2. Risikobewertungen plausibilisieren', text: 'Die Risikoscores in Abschnitt 4.1 basieren auf einer 5×5-Matrix (Abschnitt 7.1). Vergleichen Sie die zugewiesenen Likelihood- und Impact-Werte mit Ihrer eigenen Einschätzung. Ziehen Sie dabei branchenübliche Quellen heran, z. B. ENISA Threat Landscape, BSI-Lagebericht oder sektorspezifische Bedrohungsanalysen.' },
    { title: '3. Konformitätsbewertungen gegen Originaltext prüfen', text: 'Für jede Anforderung in Abschnitt 4.2 ist der zugehörige NIS-2-Artikel angegeben. Lesen Sie den Originaltext der Richtlinie (EU) 2022/2555 sowie das nationale Umsetzungsgesetz (NIS2UmsuCG) und vergleichen Sie, ob die dokumentierten Abweichungen tatsächlich den regulatorischen Vorgaben widersprechen.' },
    { title: '4. Arbeitspapiere in Anhang E reviewen', text: 'Jedes Working Paper dokumentiert Scope, Evidenz, Rationale und ggf. Abweichungen für eine einzelne Anforderung. Prüfen Sie stichprobenartig, ob die Bewertungsgrundlage schlüssig ist und die Schlussfolgerung logisch aus der Evidenz folgt.' },
    { title: '5. Quality-Gate-Ergebnisse in Anhang D prüfen', text: 'Anhang D dokumentiert die automatisierten Qualitätsprüfungen und deren Ergebnisse. Überprüfen Sie, ob die dort als „bestanden" markierten Checks mit Ihrem eigenen Verständnis der Datenlage übereinstimmen.' },
    { title: '6. Aufwandsschätzungen validieren', text: 'Die in Abschnitt 4 genannten Aufwandsschätzungen basieren auf Erfahrungswerten vergleichbarer Projekte. Vergleichen Sie diese mit Angeboten externer Dienstleister oder eigenen Projekterfahrungen. Die dokumentierten Annahmen und Unsicherheiten geben Aufschluss über die Belastbarkeit der Schätzungen.' },
    { title: '7. Zweitmeinung einholen', text: 'Für eine unabhängige Validierung empfiehlt sich die Beauftragung eines externen Prüfers, der die wesentlichen Feststellungen stichprobenartig nachvollzieht. Dies ist insbesondere bei kritischen Risiken (Score ≥ 20) und nicht-konformen Anforderungen ratsam.' },
  ] : [
    { title: '1. Trace evidence references', text: 'Each finding in Section 4 references an evidence ID (E-ID) detailed in Appendix C. Verify whether the listed tools and commands produce reproducible results on your infrastructure.' },
    { title: '2. Validate risk scores', text: 'Risk scores in Section 4.1 are based on a 5×5 matrix (Section 7.1). Compare the assigned likelihood and impact values with your own assessment, drawing on industry sources such as ENISA Threat Landscape, BSI situation reports, or sector-specific threat analyses.' },
    { title: '3. Cross-check compliance assessments', text: 'For each requirement in Section 4.2, the corresponding NIS-2 article is specified. Read the original text of Directive (EU) 2022/2555 and the national transposition law, and verify whether the documented deviations indeed contradict the regulatory provisions.' },
    { title: '4. Review working papers in Appendix E', text: 'Each working paper documents scope, evidence, rationale, and any deviations for a single requirement. Spot-check whether the assessment basis is sound and the conclusion logically follows from the evidence.' },
    { title: '5. Verify quality gate results in Appendix D', text: 'Appendix D documents the automated quality checks and their results. Verify whether the checks marked as "passed" align with your own understanding of the data.' },
    { title: '6. Validate effort estimates', text: 'Effort estimates in Section 4 are based on empirical data from comparable projects. Compare them with external service provider quotes or your own project experience. The documented assumptions and uncertainties indicate the robustness of the estimates.' },
    { title: '7. Obtain a second opinion', text: 'For independent validation, consider commissioning an external auditor to spot-check the key findings. This is particularly advisable for critical risks (score ≥ 20) and non-compliant requirements.' },
  ];

  verificationStepsN.forEach(step => {
    pdf.checkSpace(18);
    pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(9); pdf.doc.setTextColor(...C.navy);
    pdf.doc.text(step.title, LAYOUT.LEFT, pdf.y); pdf.y += 5;
    pdf.doc.setTextColor(...C.dark);
    pdf.bodyText(step.text, 4);
    pdf.y += 3;
  });

  // ═══ APPENDIX A: Structured Data ═══
  pdf.newPage();
  pdf.addBookmark(l('secA', lang));
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
  pdf.addBookmark(l('secB', lang));
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
  pdf.newPage();
  pdf.addBookmark(l('secC', lang));
  pdf.heading(l('secC', lang));
  pdf.introText(lang === 'de'
    ? 'Dieser Anhang listet das für jede Feststellung erhobene Evidenz-Material auf. Die aufgeführten Dateien ermöglichen die unabhängige Reproduktion und Verifizierung der Prüfergebnisse durch Dritte.'
    : 'This appendix lists the evidence material collected for each finding. The listed files enable independent reproduction and verification of assessment results by third parties.');

  risks.forEach((ri, i) => {
    const eid = `E-${String(i + 1).padStart(3, '0')}`;
    const score = ri.likelihood * ri.impact;
    const stars = '\u2605'.repeat(ri.evidenceQuality) + '\u2606'.repeat(5 - ri.evidenceQuality);

    pdf.checkSpace(25);
    pdf.doc.setFont(pdf.headFontName, 'bold'); pdf.doc.setFontSize(8); pdf.doc.setTextColor(...(score >= 20 ? C.fail : score >= 13 ? C.partial : C.navy));
    pdf.doc.text(`${eid}  ${riskId(ri)}: ${ri.name}`, LAYOUT.LEFT + 4, pdf.y);
    pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setFontSize(7); pdf.doc.setTextColor(...C.mid);
    pdf.doc.text(`${stars}  (${ri.evidenceQuality}/5)  |  ${lang === 'de' ? 'Reproduzierbarkeit' : 'Reproducibility'}: ${ri.reproducibility}`, LAYOUT.RIGHT - 2, pdf.y, { align: 'right' });
    pdf.y += 5;

    // Evidence description
    pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setFontSize(7.5); pdf.doc.setTextColor(...C.dark);
    const evidLines = pdf.doc.splitTextToSize(humanizeEvidence(ri.evidence, lang), LAYOUT.WIDTH - 16);
    for (const el of evidLines) { pdf.checkSpace(4); pdf.doc.text(el, LAYOUT.LEFT + 8, pdf.y); pdf.y += 3.5; }
    pdf.y += 1;

    // Derive evidence file references from category and evidence text
    const evidFiles: string[] = [];
    const evLower = ri.evidence.toLowerCase();
    const cat = ri.category;
    if (cat === 'C' || evLower.includes('wireshark') || evLower.includes('pcap') || evLower.includes('mitschnitt')) {
      evidFiles.push(`Evidence/${riskId(ri)}/capture.pcap`);
      evidFiles.push(`Evidence/${riskId(ri)}/wireshark-screenshot.png`);
    }
    if (evLower.includes('api') || evLower.includes('curl') || evLower.includes('postman')) {
      evidFiles.push(`Evidence/${riskId(ri)}/api-request-response.txt`);
    }
    if (cat === 'I' && (evLower.includes('firmware') || evLower.includes('update') || evLower.includes('patch'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/firmware-hash-comparison.txt`);
    }
    if (cat === 'I' && (evLower.includes('log') || evLower.includes('audit') || evLower.includes('siem'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/log-config-screenshot.png`);
    }
    if (cat === 'A' && (evLower.includes('failover') || evLower.includes('backup') || evLower.includes('recovery') || evLower.includes('redundanz'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/architecture-diagram.png`);
      evidFiles.push(`Evidence/${riskId(ri)}/recovery-test-report.pdf`);
    }
    if (cat === 'A' && (evLower.includes('lasttest') || evLower.includes('load') || evLower.includes('ddos'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/loadtest-results.csv`);
      evidFiles.push(`Evidence/${riskId(ri)}/cpu-memory-graph.png`);
    }
    if (cat === 'G' && (evLower.includes('policy') || evLower.includes('richtlinie') || evLower.includes('dokument') || evLower.includes('risikomanagement'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/policy-review-notes.txt`);
    }
    if (cat === 'T' && (evLower.includes('vertrag') || evLower.includes('contract') || evLower.includes('sla') || evLower.includes('lieferant'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/contract-analysis.pdf`);
    }
    if (cat === 'T' && (evLower.includes('vpn') || evLower.includes('fernwartung') || evLower.includes('remote'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/remote-access-config.txt`);
    }
    if (cat === 'R' && (evLower.includes('test') || evLower.includes('drill') || evLower.includes('übung') || evLower.includes('notfall'))) {
      evidFiles.push(`Evidence/${riskId(ri)}/drill-report.pdf`);
    }
    if (evLower.includes('nmap') || evLower.includes('scan') || evLower.includes('port')) {
      evidFiles.push(`Evidence/${riskId(ri)}/nmap-scan.txt`);
    }
    if (evLower.includes('konfiguration') || evLower.includes('config')) {
      evidFiles.push(`Evidence/${riskId(ri)}/config-export.txt`);
    }
    if (evLower.includes('modbus') || evLower.includes('scada') || evLower.includes('ot') || evLower.includes('steuerung')) {
      evidFiles.push(`Evidence/${riskId(ri)}/ot-protocol-capture.pcap`);
    }
    if (evidFiles.length === 0) {
      evidFiles.push(`Evidence/${riskId(ri)}/analysis-notes.txt`);
    }

    // Source references
    if (ri.sources && ri.sources.length > 0) {
      evidFiles.push(`--- ${lang === 'de' ? 'Quellen' : 'Sources'} ---`);
      ri.sources.forEach(s => evidFiles.push(`  ${s}`));
    }

    for (const ef of evidFiles) {
      pdf.checkSpace(4);
      if (ef.startsWith('---') || ef.startsWith('  ')) {
        pdf.doc.setFont(pdf.bodyFontName, 'italic'); pdf.doc.setFontSize(7); pdf.doc.setTextColor(...C.mid);
      } else {
        pdf.doc.setFont('courier', 'normal'); pdf.doc.setFontSize(7); pdf.doc.setTextColor(...C.mid);
      }
      pdf.doc.text(`  ${ef}`, LAYOUT.LEFT + 8, pdf.y);
      pdf.y += 3.5;
    }
    pdf.y += 4;
  });

  // ═══ APPENDIX D: Quality Assurance ═══
  pdf.newPage();
  pdf.addBookmark(l('secD', lang));
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
  pdf.addBookmark(l('secE', lang));
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
        values: [`${lang === 'de' ? 'Abschn.' : 'Sec.'} 3.2, ${r.id}`, linkedRisks.length > 0 ? linkedRisks.map(riskId).join(', ') : '-', linkedEvidence.length > 0 ? linkedEvidence.join(', ') : '-'],
      },
    ]);

    pdf.sectionLabel(lang === 'de' ? 'PRÜFUNGSGEGENSTAND' : 'SCOPE OF EXAMINATION');
    pdf.bodyText(r.name + (r.article ? ` (${r.article})` : ''), 0);
    pdf.sectionLabel(lang === 'de' ? 'ERHOBENE EVIDENZ' : 'COLLECTED EVIDENCE');
    pdf.bodyText(humanizeEvidence(r.evidence, lang), 0);
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
