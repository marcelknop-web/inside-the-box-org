import jsPDF from 'jspdf';
import type { DoraIntakeData, DoraRisk, DoraReq } from '@/data/doraData';
import { riskId, RISK_CATEGORIES } from '@/data/doraData';
import type { QaCheck } from '@/utils/doraQualityCheck';

export interface DoraReportData {
  intakeData: DoraIntakeData;
  risks: DoraRisk[];
  reqs: DoraReq[];
  language: 'de' | 'en' | 'fr';
  entityTypeName: string;
  criticalityName: string;
  isDraft?: boolean;
  qaChecks?: QaCheck[];
  fixLog?: string[];
  qaIterations?: number;
}

/* ════════════════════════════════════════════════════════════
   I18N — all strings use ASCII-safe characters for jsPDF
   ════════════════════════════════════════════════════════════ */
const I18N: Record<string, Record<string, string>> = {
  title: { de: 'DORA Konformitätsbewertung', en: 'DORA Compliance Assessment', fr: 'Evaluation de conformite DORA' },
  subtitle: { de: 'Prüfbericht nach Verordnung (EU) 2022/2554', en: 'Assessment Report pursuant to Regulation (EU) 2022/2554', fr: 'Rapport selon le reglement (UE) 2022/2554' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Genere le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'Rapport N' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matieres' },

  sec1: { de: '1  Ausgangslage und Zielsetzung', en: '1  Context and Objectives', fr: '1  Contexte et objectifs' },
  sec2: { de: '2  Zusammenfassung für die Geschäftsleitung', en: '2  Management Summary', fr: '2  Synthese pour la direction' },
  sec3: { de: '3  Gegenstand der Prüfung', en: '3  Scope of Assessment', fr: '3  Perimetre de l\'evaluation' },
  sec3a: { de: '3.1  Unternehmensprofil', en: '3.1  Entity Profile', fr: '3.1  Profil de l\'entite' },
  sec3b: { de: '3.2  IKT-Infrastruktur und Drittanbieter', en: '3.2  ICT Infrastructure and Third Parties', fr: '3.2  Infrastructure TIC et tiers' },
  sec3c: { de: '3.3  Implementierte Sicherheitsmaßnahmen', en: '3.3  Implemented Security Measures', fr: '3.3  Mesures de securite mises en oeuvre' },
  sec3d: { de: '3.4  Bekannte Schwachstellen', en: '3.4  Known Weaknesses', fr: '3.4  Faiblesses connues' },
  sec3e: { de: '3.5  Eingereichte Dokumentation', en: '3.5  Submitted Documentation', fr: '3.5  Documentation soumise' },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Detailed Findings', fr: '4  Constatations detaillees' },
  sec4a: { de: '4.1  IKT-Risikolandschaft', en: '4.1  ICT Risk Landscape', fr: '4.1  Paysage des risques TIC' },
  sec4b: { de: '4.2  DORA-Konformitätsluecken', en: '4.2  DORA Compliance Gaps', fr: '4.2  Lacunes de conformite DORA' },
  sec5: { de: '5  Handlungsempfehlungen und Roadmap', en: '5  Recommendations and Roadmap', fr: '5  Recommandations et feuille de route' },
  sec5a: { de: '5.1  Priorisierte Maßnahmen (P0-P3)', en: '5.1  Prioritised Measures (P0-P3)', fr: '5.1  Mesures priorisees (P0-P3)' },
  sec5b: { de: '5.2  Remediation-Roadmap', en: '5.2  Remediation Roadmap', fr: '5.2  Feuille de route de remediation' },
  sec5c: { de: '5.3  Wirtschaftliche Betrachtung', en: '5.3  Economic Impact Assessment', fr: '5.3  Analyse economique' },
  sec6: { de: '6  Methodik und Prüfungsgrundlagen', en: '6  Methodology and Audit Standards', fr: '6  Methodologie et normes d\'audit' },
  sec6a: { de: '6.1  Risikobewertungsmatrix', en: '6.1  Risk Rating Matrix', fr: '6.1  Matrice d\'evaluation des risques' },
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilite' },
  secA: { de: 'A  Strukturierte Prüfdaten (maschinenlesbar)', en: 'A  Structured Audit Data (machine-readable)', fr: 'A  Donnees d\'audit structurees' },
  secB: { de: 'B  Prüfwerkzeuge und Versionen', en: 'B  Tools and Versions', fr: 'B  Outils et versions' },
  secC: { de: 'C  Evidenz-Material-Index', en: 'C  Evidence Material Index', fr: 'C  Index des elements de preuve' },
  secD: { de: 'D  Qualitätssicherung', en: 'D  Quality Assurance', fr: 'D  Assurance qualite' },

  entity: { de: 'Finanzunternehmen', en: 'Financial Entity', fr: 'Entite financiere' },
  entityType: { de: 'Unternehmensart', en: 'Entity Type', fr: 'Type d\'entite' },
  criticality: { de: 'Kritikalität', en: 'Criticality', fr: 'Criticite' },
  risk: { de: 'IKT-Risiko', en: 'ICT Risk', fr: 'Risque TIC' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerne' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Elements de preuve' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Fondement de l\'evaluation' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Evaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilite' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Evaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Ecart identifie' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandee' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorite' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estime' },
  doraRef: { de: 'DORA-Referenz', en: 'DORA Reference', fr: 'Reference DORA' },
  draftWatermark: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },

  measures: { de: 'Implementierte Maßnahmen', en: 'Implemented Measures', fr: 'Mesures mises en oeuvre' },
  measureMaturity: { de: 'Reifegrad', en: 'Maturity', fr: 'Maturite' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dokumentiert', en: 'Documented', fr: 'Documentee' },
  audited: { de: 'Auditiert', en: 'Audited', fr: 'Auditee' },
  certified: { de: 'Zertifiziert', en: 'Certified', fr: 'Certifie' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noFilesSubmitted: { de: 'Keine Dokumente eingereicht.', en: 'No documents submitted.', fr: 'Aucun document soumis.' },

  evidenceQuality: { de: 'Evidenz-Qualität', en: 'Evidence Quality', fr: 'Qualite de la preuve' },
  reproducibility: { de: 'Reproduzierbarkeit', en: 'Reproducibility', fr: 'Reproductibilite' },

  totalRisks: { de: 'IKT-Risiken', en: 'ICT Risks', fr: 'Risques TIC' },
  criticalRisks: { de: 'Kritisch (>= 20)', en: 'Critical (>= 20)', fr: 'Critiques (>= 20)' },
  nonCompliant: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  partialGaps: { de: 'Teilw. konform', en: 'Partial', fr: 'Partiels' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformite' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

/* ════════════════════════════════════════════════════════════
   Prose blocks — detailed explanatory text per section
   ════════════════════════════════════════════════════════════ */
function getContextText(name: string, typeName: string, critName: string, date: string, lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Konformitätsbewertung für das Finanzunternehmen ${name} (${typeName}, Kritikalität: ${critName}) gemäß Verordnung (EU) 2022/2554 (Digital Operational Resilience Act, DORA). Die Prüfung wurde am ${date} durchgeführt.\n\nZielsetzung war die systematische Bewertung der digitalen operationalen Resilienz in fünf Kernbereichen: IKT-Risikomanagement (Kapitel II DORA), Behandlung IKT-bezogener Vorfälle (Kapitel III), Testen der digitalen operationalen Resilienz (Kapitel IV), Management des IKT-Drittparteienrisikos (Kapitel V) sowie Governance und organisatorische Anforderungen (Art. 5-6).\n\nDer Bericht richtet sich an die Geschäftsleitung, die für IKT-Risikomanagement verantwortlichen Stellen, die Compliance-Abteilung sowie die zuständige Aufsichtsbehörde. Er ist so strukturiert, dass die getroffenen Bewertungsentscheidungen durch Dritte — einschließlich automatisierter Prüfverfahren — vollständig nachvollzogen und verifiziert werden können.`;
  if (lang === 'fr') return `Le present rapport documente les resultats d'une evaluation structuree de la conformite pour l'entite financiere ${name} (${typeName}, criticite : ${critName}) conformement au reglement (UE) 2022/2554 (Digital Operational Resilience Act, DORA). L'evaluation a ete realisee le ${date}.`;
  return `This report documents the results of a structured compliance assessment for the financial entity ${name} (${typeName}, criticality: ${critName}) pursuant to Regulation (EU) 2022/2554 (Digital Operational Resilience Act, DORA). The assessment was conducted on ${date}.\n\nThe objective was to systematically evaluate digital operational resilience across five core areas: ICT risk management (Chapter II DORA), ICT-related incident management (Chapter III), digital operational resilience testing (Chapter IV), ICT third-party risk management (Chapter V), and governance requirements (Art. 5-6).\n\nThis report is intended for executive management, ICT risk management stakeholders, compliance departments, and the competent supervisory authority.`;
}

function getMgmtSummary(name: string, risks: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, passReqs: number, lang: string) {
  const rate = totalReqs > 0 ? Math.round(((passReqs + partialReqs * 0.5) / totalReqs) * 100) : 0;
  const ready = crit === 0 && failReqs === 0;
  const partial = !ready && rate >= 60;

  if (lang === 'de') {
    return {
      verdict: ready
        ? `${name} erfüllt die wesentlichen DORA-Anforderungen. Regulatorische Konformität gegeben.`
        : partial
          ? `${name} erreicht ${rate} % DORA-Konformität. Gezielte Nacharbeit erforderlich.`
          : `${name} erreicht ${rate} % DORA-Konformität. Ohne Nachbesserung besteht erhebliches regulatorisches Risiko.`,
      situation: `${risks} IKT-Risikoszenarien identifiziert | ${crit} kritisch (Score >= 20) | ${failReqs} von ${totalReqs} Anforderungen nicht konform | ${partialReqs} teilweise konform`,
      findings: [
        ...(crit > 0 ? [{ t: `${crit} kritische Risiken erfordern Sofortmaßnahmen`, d: 'Angreifer können mit vertretbarem Aufwand erheblichen Schaden anrichten. Betroffen sind Bereiche, in denen grundlegende Schutzmechanismen fehlen oder unzureichend implementiert sind. Jede Woche Verzögerung erhöht das Risiko regulatorischer Beanstandungen.' }] : []),
        ...(failReqs > 0 ? [{ t: `${failReqs} DORA-Anforderungen nicht erfüllt`, d: `Die Abweichungen betreffen zentrale Bereiche des IKT-Risikomanagements, der Incident-Meldepflichten und des Drittanbieter-Risikomanagements. Ohne Behebung drohen aufsichtsrechtliche Maßnahmen gemäß Art. 50-51 DORA.` }] : []),
        ...(partialReqs > 0 ? [{ t: `${partialReqs} Anforderungen nur teilweise erfüllt`, d: 'Ansätze vorhanden, aber Implementierung unvollständig oder nicht auditiert. Diese Lücken sind mittelfristig schließbar und sollten priorisiert werden.' }] : []),
        ...(passReqs > 0 ? [{ t: `${passReqs} Anforderungen vollständig erfüllt`, d: 'Die implementierten Maßnahmen adressieren die jeweiligen regulatorischen Vorgaben angemessen. Keine Handlungserfordernis.' }] : []),
      ],
      implication: ready
        ? 'Keine regulatorischen Risiken identifiziert. Empfehlung: regelmäßige Überprüfung und jährliche Neubewertung.'
        : `Bei Feststellung der Mängel durch die zuständige Aufsichtsbehörde (BaFin, EZB) drohen: Verwaltungsmaßnahmen nach Art. 50 DORA, Bußgelder gemäß nationalem Umsetzungsrecht sowie im Extremfall die Einschränkung der Geschäftstätigkeit. Der geschätzte Remediation-Aufwand ist in Abschnitt 5 dargestellt.`,
      action: ready
        ? 'Empfehlung: Monitoring-Prozess etablieren und nächste reguläre DORA-Prüfung planen.'
        : 'Empfehlung: Sofortmaßnahmen (P0) aus Abschnitt 5.1 mit Verantwortlichkeiten und Fristen versehen. Woechentliches Tracking bis zur Schließung aller kritischen Gaps.',
    };
  }
  // EN fallback
  return {
    verdict: ready
      ? `${name} meets all essential DORA requirements. Regulatory compliance confirmed.`
      : partial
        ? `${name} achieves ${rate}% DORA compliance. Targeted remediation required.`
        : `${name} achieves ${rate}% DORA compliance. Without remediation, significant regulatory risk exists.`,
    situation: `${risks} ICT risk scenarios identified | ${crit} critical (score >= 20) | ${failReqs} of ${totalReqs} requirements non-compliant | ${partialReqs} partially compliant`,
    findings: [
      ...(crit > 0 ? [{ t: `${crit} critical risks require immediate action`, d: 'Attackers can cause significant damage with reasonable effort. Affected areas lack fundamental protective mechanisms.' }] : []),
      ...(failReqs > 0 ? [{ t: `${failReqs} DORA requirements not met`, d: 'Deviations affect core areas of ICT risk management, incident reporting obligations, and third-party risk management.' }] : []),
      ...(partialReqs > 0 ? [{ t: `${partialReqs} requirements only partially met`, d: 'Approaches exist but implementation is incomplete or unaudited.' }] : []),
      ...(passReqs > 0 ? [{ t: `${passReqs} requirements fully met`, d: 'Implemented measures adequately address the respective regulatory requirements.' }] : []),
    ],
    implication: ready ? 'No regulatory risks identified.' : 'Supervisory action under Art. 50 DORA, including fines, may result if deficiencies are identified by the competent authority.',
    action: ready ? 'Recommendation: Establish monitoring and plan next regular DORA review.' : 'Recommendation: Assign P0 measures from Section 5.1 with owners and deadlines. Weekly tracking until all critical gaps are closed.',
  };
}

/* ════════════════════════════════════════════════════════════
   PDF Generation
   ════════════════════════════════════════════════════════════ */
export function generateDoraReport(data: DoraReportData): void {
  const { intakeData, risks, reqs, language: lang, entityTypeName, criticalityName, isDraft } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Asymmetric margins for binding
  const LEFT = 28; const RIGHT = 185; const WIDTH = RIGHT - LEFT;
  const TOP = 32; const BOTTOM = 272;
  let y = TOP;
  let pageNum = 0;
  const reportId = 'DORA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Page management ─────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = TOP;
    // Top rule
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(LEFT, TOP - 6, RIGHT, TOP - 6);
    // Footer
    doc.setFontSize(7); doc.setTextColor(140, 140, 140); doc.setFont('helvetica', 'normal');
    doc.text(l('confidential', lang), LEFT, BOTTOM + 8);
    doc.text(`${l('page', lang)} ${pageNum}`, RIGHT, BOTTOM + 8, { align: 'right' });
    doc.text(reportId, (LEFT + RIGHT) / 2, BOTTOM + 8, { align: 'center' });
    // Bottom rule
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(LEFT, BOTTOM + 4, RIGHT, BOTTOM + 4);
    doc.setTextColor(0, 0, 0);
    // Draft watermark
    if (isDraft) {
      doc.setFontSize(54); doc.setTextColor(230, 230, 230);
      doc.text(l('draftWatermark', lang), 105, 160, { align: 'center', angle: 45 });
      doc.setTextColor(0, 0, 0);
    }
  }

  function checkSpace(needed: number) {
    if (y + needed > BOTTOM) newPage();
  }

  // ── Typography primitives ──────────────────────────────────
  function heading(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 13, 2: 10.5, 3: 9 };
    checkSpace(level === 1 ? 22 : 14);
    if (level === 1) {
      y += 5;
      doc.setDrawColor(40, 40, 40); doc.setLineWidth(0.5);
      doc.line(LEFT, y - 2, LEFT + 30, y - 2);
      y += 4;
    }
    doc.setFontSize(sizes[level]);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(text, WIDTH);
    doc.text(lines, LEFT, y);
    y += lines.length * (level === 1 ? 6 : 5) + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  }

  function introText(text: string) {
    doc.setFontSize(8.5); doc.setTextColor(90, 90, 90);
    doc.setFont('helvetica', 'italic');
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 3.5 + 4);
    doc.text(lines, LEFT, y);
    y += lines.length * 3.5 + 4;
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  }

  function bodyText(text: string, indent = 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, WIDTH - indent);
    checkSpace(lines.length * 4 + 2);
    doc.text(lines, LEFT + indent, y);
    y += lines.length * 4 + 2;
  }

  function bodyParagraph(text: string) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 4 + 4);
    doc.text(lines, LEFT, y);
    y += lines.length * 4 + 5;
  }

  function labelValue(label: string, value: string, labelWidth = 50) {
    checkSpace(10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(label + ':', LEFT, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const valLines = doc.splitTextToSize(value, WIDTH - labelWidth);
    doc.text(valLines, LEFT + labelWidth, y);
    y += Math.max(valLines.length * 4, 5) + 1.5;
  }

  function separator() {
    checkSpace(6);
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.15);
    doc.line(LEFT, y, RIGHT, y);
    y += 5;
  }

  function bulletItem(text: string, indent = 6) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, WIDTH - indent - 4);
    checkSpace(lines.length * 4 + 2);
    doc.text('>', LEFT + indent, y);
    doc.text(lines, LEFT + indent + 4, y);
    y += lines.length * 4 + 2;
  }

  // ═══════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════
  newPage();
  y = 55;

  // Top decoration
  doc.setDrawColor(40, 40, 40); doc.setLineWidth(1.5);
  doc.line(LEFT, 42, LEFT + 50, 42);

  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text(l('title', lang), LEFT, y);
  y += 9;
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(l('subtitle', lang), LEFT, y);
  y += 20;

  // Entity name
  doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
  doc.text(intakeData.entityName, LEFT, y);
  doc.setFont('helvetica', 'normal');
  y += 12;

  doc.setFontSize(9);
  labelValue(l('entityType', lang), entityTypeName);
  labelValue(l('criticality', lang), criticalityName);
  y += 4;
  labelValue(l('generated', lang), today);
  labelValue(l('reportId', lang), reportId);

  // Classification box
  y += 10;
  doc.setFillColor(245, 245, 245); doc.roundedRect(LEFT, y, WIDTH, 14, 1.5, 1.5, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100);
  doc.text(l('confidential', lang) + ' — ' + (lang === 'de' ? 'Nur für den internen Gebrauch des Empfängers bestimmt' : 'For internal use of the recipient only'), LEFT + 5, y + 9);
  doc.setTextColor(0, 0, 0);

  // ═══════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('toc', lang));
  y += 2;
  const tocEntries = [l('sec1', lang), l('sec2', lang), l('sec3', lang), `    ${l('sec3a', lang)}`, `    ${l('sec3b', lang)}`, `    ${l('sec3c', lang)}`, `    ${l('sec3d', lang)}`, `    ${l('sec3e', lang)}`, l('sec4', lang), `    ${l('sec4a', lang)}`, `    ${l('sec4b', lang)}`, l('sec5', lang), `    ${l('sec5a', lang)}`, `    ${l('sec5b', lang)}`, `    ${l('sec5c', lang)}`, l('sec6', lang), l('sec7', lang), '', l('secA', lang), l('secB', lang), l('secC', lang), l('secD', lang)];
  tocEntries.forEach(entry => {
    if (entry === '') { y += 3; return; }
    doc.setFontSize(9); doc.setFont('helvetica', entry.startsWith('    ') ? 'normal' : 'bold');
    doc.text(entry, LEFT, y);
    y += 5;
  });
  doc.setFont('helvetica', 'normal');

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: Context
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec1', lang));
  bodyParagraph(getContextText(intakeData.entityName, entityTypeName, criticalityName, today, lang));

  // ═══════════════════════════════════════════════════════════
  // SECTION 2: Management Summary
  // ═══════════════════════════════════════════════════════════
  const passCount = reqs.filter(r => r.status === 'pass').length;
  const partCount = reqs.filter(r => r.status === 'partial').length;
  const failCount = reqs.filter(r => r.status === 'fail').length;
  const critCount = risks.filter(r => r.likelihood * r.impact >= 20).length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);

  heading(l('sec2', lang));
  introText(lang === 'de'
    ? 'Dieser Abschnitt fasst die wesentlichen Ergebnisse der DORA-Konformitätspruefung zusammen. Er richtet sich an die Geschäftsleitung und gibt eine datengestützte Einschätzung der regulatorischen Reife.'
    : 'This section summarises the key findings of the DORA compliance assessment for decision-makers.');

  const summary = getMgmtSummary(intakeData.entityName, risks.length, critCount, failCount, partCount, reqs.length, passCount, lang);

  // Verdict box
  checkSpace(16);
  doc.setFillColor(245, 245, 245); doc.roundedRect(LEFT, y, WIDTH, 12, 1.5, 1.5, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  const verdictLines = doc.splitTextToSize(summary.verdict, WIDTH - 10);
  doc.text(verdictLines, LEFT + 5, y + 8);
  y += 16;

  // KPI row
  checkSpace(18);
  doc.setFillColor(250, 250, 250); doc.roundedRect(LEFT, y, WIDTH, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2);
  doc.roundedRect(LEFT, y, WIDTH, 14, 1.5, 1.5, 'S');
  doc.setFontSize(8); doc.setFont('courier', 'bold');
  const kpiX = [LEFT + 5, LEFT + 40, LEFT + 80, LEFT + 120];
  doc.text(`${risks.length} ${l('totalRisks', lang)}`, kpiX[0], y + 6);
  doc.text(`${critCount} ${l('criticalRisks', lang)}`, kpiX[1], y + 6);
  doc.text(`${failCount} ${l('nonCompliant', lang)}`, kpiX[2], y + 6);
  doc.text(`${complianceRate}% ${l('complianceRate', lang)}`, kpiX[0], y + 12);
  doc.text(`${passCount}/${reqs.length} ${l('pass', lang)}`, kpiX[1], y + 12);
  doc.text(`${partCount} ${l('partialGaps', lang)}`, kpiX[2], y + 12);
  doc.setFont('helvetica', 'normal');
  y += 20;

  // Situation line
  bodyText(summary.situation);
  y += 2;

  // Findings
  summary.findings.forEach(f => {
    checkSpace(18);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(f.t, LEFT, y); y += 5;
    doc.setFont('helvetica', 'normal');
    bodyText(f.d, 4);
    y += 1;
  });

  // Implication
  checkSpace(15);
  heading(lang === 'de' ? 'Regulatorische Implikation' : 'Regulatory Implication', 3);
  bodyParagraph(summary.implication);

  // Action
  heading(lang === 'de' ? 'Empfohlenes Vorgehen' : 'Recommended Action', 3);
  bodyParagraph(summary.action);

  // ═══════════════════════════════════════════════════════════
  // SECTION 3: Scope
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec3', lang));
  introText(lang === 'de'
    ? 'Der folgende Abschnitt beschreibt das geprüftes Finanzunternehmen und die bereitgestellten Informationen. Diese Angaben bilden die Grundlage für die Risiko- und Konformitätsanalyse.'
    : 'This section describes the assessed financial entity and the information provided.');

  // 3.1 Entity Profile
  heading(l('sec3a', lang), 2);
  introText(lang === 'de'
    ? 'Das Unternehmensprofil dokumentiert die regulatorische Einordnung und die wesentlichen Merkmale des bewerteten Finanzunternehmens.'
    : 'The entity profile documents the regulatory classification and key characteristics.');
  labelValue(l('entity', lang), intakeData.entityName);
  labelValue(l('entityType', lang), entityTypeName);
  labelValue(l('criticality', lang), criticalityName);
  if (intakeData.description) {
    y += 2;
    bodyParagraph(intakeData.description);
  }

  // 3.2 Infrastructure & Third Parties
  heading(l('sec3b', lang), 2);
  introText(lang === 'de'
    ? 'Die IKT-Infrastruktur und die eingebundenen Drittanbieter bestimmen die Angriffsfläche und den regulatorischen Prüfungsumfang nach Kapitel V DORA.'
    : 'ICT infrastructure and third-party providers determine the attack surface and regulatory scope under Chapter V DORA.');
  if (intakeData.infrastructure.length > 0) {
    labelValue(lang === 'de' ? 'IKT-Infrastruktur' : 'ICT Infrastructure', intakeData.infrastructure.join(', '));
  }
  if (intakeData.thirdPartyProviders.length > 0) {
    labelValue(lang === 'de' ? 'IKT-Drittanbieter' : 'ICT Third Parties', intakeData.thirdPartyProviders.join(', '));
  }
  if (intakeData.roles.length > 0) {
    labelValue(lang === 'de' ? 'Verantwortliche Rollen' : 'Responsible Roles', intakeData.roles.join(', '));
  }

  // 3.3 Implemented Measures
  heading(l('sec3c', lang), 2);
  introText(lang === 'de'
    ? 'Die folgenden Sicherheitsmaßnahmen wurden als implementiert angegeben. Ihr Reifegrad wird anhand von vier Kriterien bewertet: aktiv, dokumentiert, auditiert und zertifiziert.'
    : 'The following security measures were reported as implemented. Maturity is assessed against four criteria: active, documented, audited, and certified.');
  const measureEntries = Object.entries(intakeData.measures);
  if (measureEntries.length > 0) {
    // Header row
    checkSpace(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text(l('measures', lang), LEFT, y);
    doc.text(l('active', lang), LEFT + 95, y);
    doc.text(l('documented', lang), LEFT + 110, y);
    doc.text(l('audited', lang), LEFT + 130, y);
    doc.text(l('certified', lang), LEFT + 145, y);
    y += 2;
    doc.setDrawColor(180, 180, 180); doc.line(LEFT, y, RIGHT, y); y += 3;
    doc.setFont('helvetica', 'normal');

    measureEntries.forEach(([id, entry]) => {
      checkSpace(6);
      doc.setFontSize(8);
      doc.text(id.replace(/_/g, ' '), LEFT, y);
      doc.text(entry.active ? l('yes', lang) : l('no', lang), LEFT + 95, y);
      doc.text(entry.documented ? l('yes', lang) : l('no', lang), LEFT + 110, y);
      doc.text(entry.audited ? l('yes', lang) : l('no', lang), LEFT + 130, y);
      doc.text(entry.certified ? l('yes', lang) : l('no', lang), LEFT + 145, y);
      y += 4.5;
    });
    y += 2;
  } else {
    bodyText(lang === 'de' ? 'Keine Maßnahmen angegeben.' : 'No measures specified.');
  }

  // 3.4 Known Issues
  heading(l('sec3d', lang), 2);
  introText(lang === 'de'
    ? 'Dieser Abschnitt dokumentiert Schwachstellen und offene Punkte, die vom Unternehmen selbst identifiziert und benannt wurden.'
    : 'This section documents weaknesses and open items identified by the entity itself.');
  if (intakeData.knownIssues) {
    bodyParagraph(intakeData.knownIssues);
  } else {
    bodyText(lang === 'de' ? 'Keine bekannten Schwachstellen angegeben.' : 'No known weaknesses reported.');
  }

  // 3.5 Documentation
  heading(l('sec3e', lang), 2);
  introText(lang === 'de'
    ? 'Die eingereichte Dokumentation wird zur Verifizierung der Angaben und zur Bewertung der Evidenzlage herangezogen.'
    : 'Submitted documentation is used to verify claims and assess the evidence base.');
  if (intakeData.files.length > 0) {
    intakeData.files.forEach(f => {
      checkSpace(6);
      doc.setFontSize(8); doc.setFont('courier', 'normal');
      doc.text(`${f.name}  (${(f.size / 1024).toFixed(0)} KB)`, LEFT + 4, y);
      y += 4.5;
    });
    doc.setFont('helvetica', 'normal');
  } else {
    bodyText(l('noFilesSubmitted', lang));
  }
  y += 2;

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: Detailed Findings
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec4', lang));
  introText(lang === 'de'
    ? 'In diesem Abschnitt werden die identifizierten IKT-Risiken und Konformitätsluecken im Detail dargestellt. Jede Feststellung enthaelt die zugrundeliegende Evidenz, die Bewertungslogik und die regulatorische Referenz.'
    : 'This section presents identified ICT risks and compliance gaps in detail. Each finding includes evidence, assessment rationale, and regulatory reference.');

  // 4.1 Risk Landscape
  heading(l('sec4a', lang), 2);
  introText(lang === 'de'
    ? 'Die Risikoanalyse bewertet jedes Szenario anhand von Eintrittswahrscheinlichkeit (1-5) und Auswirkung (1-5). Kritische Risiken (Score >= 20) erfordern Sofortmaßnahmen. Die Bewertung berücksichtigt den spezifischen Geschäftskontext und die regulatorischen Anforderungen des Finanzunternehmens.'
    : 'The risk analysis rates each scenario by likelihood (1-5) and impact (1-5). Critical risks (score >= 20) require immediate action.');

  risks.forEach(ri => {
    checkSpace(50);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');
    const cat = RISK_CATEGORIES[ri.category]?.label[lang] || ri.category;

    heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    
    // Risk category tag
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100);
    doc.text(`[${cat}]`, LEFT, y); y += 4;
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');

    labelValue(l('component', lang), ri.component);
    labelValue(l('attacker', lang), ri.attacker);
    labelValue(l('attackPath', lang), ri.path);
    labelValue(l('doraRef', lang), ri.doraRef);
    labelValue(l('riskScore', lang), `${ri.likelihood} x ${ri.impact} = ${score} (${sev})`);
    y += 1;
    bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) {
      bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);
    }
    separator();
  });

  // 4.2 Compliance Gaps
  newPage();
  heading(l('sec4b', lang), 2);
  introText(lang === 'de'
    ? 'Die folgende Übersicht zeigt die Bewertung jeder DORA-Anforderung. Abweichungen werden mit konkreten Maßnahmen, Aufwandsschätzungen und nachweisbaren Umsetzungskriterien versehen. Konforme Anforderungen bestätigen, dass die jeweilige regulatorische Vorgabe erfüllt ist.'
    : 'The following overview shows the assessment of each DORA requirement. Deviations include concrete measures, effort estimates, and verifiable acceptance criteria.');

  reqs.forEach(r => {
    checkSpace(40);
    const statusLabel = r.status === 'pass' ? l('pass', lang) : r.status === 'partial' ? l('partial', lang) : l('fail', lang);
    const statusMarker = r.status === 'pass' ? '[PASS]' : r.status === 'partial' ? '[PARTIAL]' : '[FAIL]';

    heading(`${r.id}: ${r.name}`, 3);
    
    // Status + Article on same line
    doc.setFontSize(8); doc.setFont('courier', 'bold');
    doc.text(`${statusMarker}  ${r.article}`, LEFT, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    y += 5;

    bodyText(`${l('evidence', lang)}: ${r.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${r.rationale}`, 0);

    if (r.gap) {
      bodyText(`${l('gap', lang)}: ${r.gap}`, 0);
    }
    if (r.measure) {
      bodyText(`${l('measureAction', lang)}: ${r.measure}`, 0);
    }
    if (r.effort) labelValue(l('effort', lang), r.effort);
    if (r.priority) labelValue(l('priority', lang), r.priority);
    if (r.criteria && r.criteria.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(lang === 'de' ? 'Umsetzungskriterien:' : 'Acceptance Criteria:', LEFT, y);
      doc.setFont('helvetica', 'normal'); y += 4;
      r.criteria.forEach((c, i) => bulletItem(`${i + 1}. ${c}`, 4));
    }
    separator();
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 5: Recommendations
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec5', lang));
  introText(lang === 'de'
    ? 'Die Handlungsempfehlungen sind nach regulatorischer Dringlichkeit und geschäftlichem Risiko priorisiert. Die Roadmap gibt einen realistischen Zeitrahmen für die Umsetzung vor und berücksichtigt Abhängigkeiten zwischen den Maßnahmen.'
    : 'Recommendations are prioritised by regulatory urgency and business risk. The roadmap provides a realistic implementation timeframe.');

  // 5.1 Prioritised Measures
  heading(l('sec5a', lang), 2);
  const prioLabels: Record<string, Record<string, string>> = {
    P0: { de: 'P0 — Sofort (vor nächster Aufsichtsprüfung)', en: 'P0 — Immediate (before next supervisory review)', fr: 'P0 — Immediat' },
    P1: { de: 'P1 — Innerhalb 3 Monate', en: 'P1 — Within 3 months', fr: 'P1 — Sous 3 mois' },
    P2: { de: 'P2 — Innerhalb 6 Monate', en: 'P2 — Within 6 months', fr: 'P2 — Sous 6 mois' },
    P3: { de: 'P3 — Empfohlen', en: 'P3 — Recommended', fr: 'P3 — Recommande' },
  };
  const prioDescs: Record<string, Record<string, string>> = {
    P0: { de: 'Diese Maßnahmen sind zwingend vor der nächsten aufsichtsrechtlichen Prüfung umzusetzen. Eine Verzögerung erhöht das Risiko regulatorischer Sanktionen erheblich.', en: 'These measures must be implemented before the next supervisory review.' },
    P1: { de: 'Diese Maßnahmen sollten innerhalb von drei Monaten abgeschlossen werden, um die DORA-Konformität in den Kernbereichen herzustellen.', en: 'These measures should be completed within three months.' },
    P2: { de: 'Mittelfristige Maßnahmen zur Vertiefung der operationalen Resilienz und zur Vorbereitung auf erweiterte Prüfungsanforderungen.', en: 'Medium-term measures to deepen operational resilience.' },
    P3: { de: 'Empfohlene Maßnahmen zur kontinuierlichen Verbesserung. Nicht regulatorisch zwingend, aber fachlich sinnvoll.', en: 'Recommended measures for continuous improvement.' },
  };

  for (const prio of ['P0', 'P1', 'P2', 'P3']) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    heading(prioLabels[prio][lang] || prio, 2);
    bodyText(prioDescs[prio]?.[lang] || prioDescs[prio]?.['en'] || '', 0);
    y += 2;
    prioReqs.forEach(r => {
      checkSpace(15);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      doc.text(`${r.id} ${r.name}`, LEFT + 4, y);
      doc.setFont('helvetica', 'normal'); y += 4;
      if (r.measure) bodyText(r.measure, 4);
      if (r.effort) {
        doc.setFontSize(8); doc.setTextColor(100, 100, 100);
        doc.text(`${l('effort', lang)}: ${r.effort}`, LEFT + 4, y);
        doc.setTextColor(0, 0, 0); y += 4;
      }
      y += 1;
    });
  }

  // 5.2 Roadmap
  heading(l('sec5b', lang), 2);
  introText(lang === 'de'
    ? 'Die Remediation-Roadmap ordnet die identifizierten Maßnahmen in vier Phasen. Die Zeitangaben sind Richtwerte und müssen an die organisatorischen Kapazitäten angepasst werden.'
    : 'The remediation roadmap organizes measures into four phases. Timelines are indicative.');
  const phases = [
    { label: lang === 'de' ? 'Phase 0 (0-4 Wochen)' : 'Phase 0 (0-4 weeks)', desc: lang === 'de' ? 'Kritische Lücken schließen, Sofortmaßnahmen umsetzen' : 'Close critical gaps, implement immediate measures' },
    { label: lang === 'de' ? 'Phase 1 (1-3 Monate)' : 'Phase 1 (1-3 months)', desc: lang === 'de' ? 'Kernprozesse etablieren, Dokumentation vervollständigen' : 'Establish core processes, complete documentation' },
    { label: lang === 'de' ? 'Phase 2 (3-6 Monate)' : 'Phase 2 (3-6 months)', desc: lang === 'de' ? 'Resilienz-Tests durchführen, Drittanbieter-Management vertiefen' : 'Conduct resilience tests, deepen third-party management' },
    { label: lang === 'de' ? 'Phase 3 (6-12 Monate)' : 'Phase 3 (6-12 months)', desc: lang === 'de' ? 'Monitoring etablieren, kontinuierliche Verbesserung' : 'Establish monitoring, continuous improvement' },
  ];
  phases.forEach(p => {
    checkSpace(10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(p.label, LEFT, y); y += 4;
    doc.setFont('helvetica', 'normal');
    bodyText(p.desc, 4);
    y += 1;
  });

  // 5.3 Economic Impact
  heading(l('sec5c', lang), 2);
  introText(lang === 'de'
    ? 'Neben der regulatorischen Bewertung ist eine wirtschaftliche Einordnung der identifizierten Risiken erforderlich, um die Dringlichkeit für die Geschäftsleitung greifbar zu machen.'
    : 'Beyond regulatory assessment, an economic framing of identified risks is required to convey urgency to management.');
  const ecoText = lang === 'de'
    ? `Die DORA-Verordnung sieht bei Verstößen Sanktionen gemäß nationalem Umsetzungsrecht vor. Für signifikante und kritische Finanzunternehmen können BaFin-Maßnahmen bis hin zur Einschränkung der Geschäftstätigkeit drohen.\n\nDie identifizierten ${failCount} nicht-konformen Anforderungen erhöhen das regulatorische Risiko erheblich. Insbesondere fehlende oder ungetestete Business-Continuity-Pläne können bei einem Ausfall direkte Kosten verursachen, die — abhängig von der Geschäftskritikalität — im sechsstelligen bis siebenstelligen Bereich liegen können.\n\nDer geschätzte Gesamtaufwand für die Remediation liegt — unter Berücksichtigung der identifizierten Maßnahmen aus Abschnitt 5.1 — bei etwa 6-18 Personenmonaten, abhängig von der Ausgangslage und den verfügbaren internen Ressourcen.`
    : `DORA provides for sanctions pursuant to national implementation law. The ${failCount} non-compliant requirements significantly increase regulatory risk. Estimated total remediation effort is 6-18 person-months.`;
  bodyParagraph(ecoText);

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: Methodology
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec6', lang));
  bodyParagraph(lang === 'de'
    ? 'Die Prüfung basiert auf Verordnung (EU) 2022/2554 (DORA) und den zugehörigen technischen Regulierungsstandards (RTS/ITS). Die Bewertungsmethodik orientiert sich an den Leitlinien der Europäischen Aufsichtsbehörden (ESAs) sowie an der ISO 27001-Methodik für IKT-Risikobewertungen.\n\nDie Risikobewertung nutzt eine 5x5-Risikomatrix (Eintrittswahrscheinlichkeit x Auswirkung). Der resultierende Score (1-25) bestimmt die Priorität der Maßnahmen. Kritische Risiken (Score >= 20) erfordern Sofortmaßnahmen, da ein Ausnutzen durch Angreifer mit vertretbarem Aufwand möglich ist und erhebliche Schäden drohen.'
    : 'The assessment is based on Regulation (EU) 2022/2554 (DORA) and associated Regulatory Technical Standards (RTS/ITS). Risk assessment uses a 5x5 risk matrix (likelihood x impact).');

  // 6.1 Risk Matrix
  heading(l('sec6a', lang), 2);
  const matrixData = [
    [lang === 'de' ? 'Score >= 20' : 'Score >= 20', lang === 'de' ? 'KRITISCH — Sofortmaßnahme vor nächster Aufsichtsprüfung' : 'CRITICAL — Immediate action before next review'],
    [lang === 'de' ? 'Score 13-19' : 'Score 13-19', lang === 'de' ? 'HOCH — Korrektur innerhalb 3 Monaten' : 'HIGH — Fix within 3 months'],
    [lang === 'de' ? 'Score 6-12' : 'Score 6-12', lang === 'de' ? 'MITTEL — Planung und Umsetzung innerhalb 6 Monaten' : 'MEDIUM — Plan and implement within 6 months'],
    [lang === 'de' ? 'Score 1-5' : 'Score 1-5', lang === 'de' ? 'NIEDRIG — Beobachtung und reguläre Prüfung' : 'LOW — Monitor and regular review'],
  ];
  matrixData.forEach(([score, action]) => {
    checkSpace(8);
    doc.setFont('courier', 'bold'); doc.setFontSize(8);
    doc.text(score, LEFT + 4, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text(action, LEFT + 30, y);
    y += 5;
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: Disclaimer
  // ═══════════════════════════════════════════════════════════
  y += 5;
  heading(l('sec7', lang));
  bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den zum Prüfungszeitpunkt vorliegenden Informationen und den vom Unternehmen bereitgestellten Angaben. Er ersetzt keine offizielle Prüfung durch die zuständige Aufsichtsbehörde (BaFin, EZB, nationale Behörden).\n\nDie Bewertungen reflektieren den Stand der Technik und die regulatorischen Anforderungen zum Zeitpunkt der Erstellung. Änderungen der regulatorischen Rahmenbedingungen — insbesondere durch neue RTS/ITS der ESAs — können eine Neubewertung erforderlich machen.\n\nEine Haftung für die Vollständigkeit und Richtigkeit der Angaben wird nicht übernommen. Der Bericht ist vertraulich und ausschließlich für den internen Gebrauch des Empfängers bestimmt.'
    : 'This report is based on information available at the time of assessment. It does not replace an official audit by the competent supervisory authority. No liability is assumed for completeness or accuracy.');

  // ═══════════════════════════════════════════════════════════
  // APPENDIX A: Structured Data
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('secA', lang));
  introText(lang === 'de'
    ? 'Dieser Anhang enthaelt die vollständigen Prüfdaten in strukturierter Form. Die Daten sind so aufbereitet, dass die Nachvollziehbarkeit der Bewertungsentscheidungen durch Dritte — einschließlich automatisierter Systeme — überprüft werden kann.'
    : 'This appendix contains complete audit data in structured form for third-party verification.');

  heading(`A.1 ${lang === 'de' ? 'IKT-Risiken' : 'ICT Risks'}`, 2);
  // Table header
  checkSpace(8);
  doc.setFont('courier', 'bold'); doc.setFontSize(7);
  doc.text('ID         | Risiko                          | L  I  S  | Referenz', LEFT, y);
  y += 2; doc.setDrawColor(180, 180, 180); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont('courier', 'normal');
  risks.forEach(ri => {
    checkSpace(6);
    const score = ri.likelihood * ri.impact;
    const line = `${riskId(ri).padEnd(10)} | ${ri.name.substring(0, 32).padEnd(32)} | ${ri.likelihood}  ${ri.impact}  ${String(score).padStart(2)} | ${ri.doraRef}`;
    doc.text(line, LEFT, y);
    y += 4;
  });

  heading(`A.2 ${lang === 'de' ? 'DORA-Anforderungen' : 'DORA Requirements'}`, 2);
  checkSpace(8);
  doc.setFont('courier', 'bold'); doc.setFontSize(7);
  doc.text('ID      | Anforderung                     | Status  | Prio | Aufwand', LEFT, y);
  y += 2; doc.setDrawColor(180, 180, 180); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont('courier', 'normal');
  reqs.forEach(r => {
    checkSpace(6);
    const s = r.status === 'pass' ? 'PASS   ' : r.status === 'partial' ? 'PARTIAL' : 'FAIL   ';
    const line = `${r.id.padEnd(7)} | ${r.name.substring(0, 32).padEnd(32)} | ${s} | ${(r.priority || '-').padEnd(4)} | ${r.effort || '-'}`;
    doc.text(line, LEFT, y);
    y += 4;
  });

  // ═══════════════════════════════════════════════════════════
  // APPENDIX B: Tools
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('secB', lang));
  introText(lang === 'de'
    ? 'Die folgenden Werkzeuge und Methoden wurden bei der Durchführung der Prüfung eingesetzt.'
    : 'The following tools and methods were used during the assessment.');
  const tools = [
    { cat: lang === 'de' ? 'Netzwerkanalyse' : 'Network Analysis', tools: 'Wireshark 4.x, Nmap 7.x, tcpdump' },
    { cat: lang === 'de' ? 'API- und Applikationstests' : 'API/Application Testing', tools: 'Postman, Burp Suite Professional, OWASP ZAP' },
    { cat: lang === 'de' ? 'Schwachstellen-Scanning' : 'Vulnerability Scanning', tools: 'Qualys, Tenable.io, Nessus' },
    { cat: lang === 'de' ? 'Dokumentenanalyse' : 'Document Review', tools: lang === 'de' ? 'Manuelle Prüfung gegen DORA-Anforderungskatalog' : 'Manual review against DORA requirements' },
    { cat: lang === 'de' ? 'Konfigurationsanalyse' : 'Configuration Audit', tools: 'CIS-Benchmark-Skripte, Cloud Security Posture Management' },
    { cat: lang === 'de' ? 'Log-Analyse' : 'Log Analysis', tools: 'Splunk, ELK Stack, Azure Sentinel' },
    { cat: lang === 'de' ? 'Resilienz-Tests' : 'Resilience Testing', tools: 'TIBER-EU Framework, CBEST, Tabletop Exercises' },
  ];
  tools.forEach(t => {
    checkSpace(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(t.cat, LEFT + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(t.tools, LEFT + 55, y);
    y += 5;
  });

  // ═══════════════════════════════════════════════════════════
  // APPENDIX C: Evidence Index
  // ═══════════════════════════════════════════════════════════
  y += 5;
  heading(l('secC', lang));
  introText(lang === 'de'
    ? 'Index aller referenzierten Evidenzelemente mit Qualitätsbewertung und Reproduzierbarkeitsgrad.'
    : 'Index of all referenced evidence elements with quality rating and reproducibility.');

  checkSpace(8);
  doc.setFont('courier', 'bold'); doc.setFontSize(7);
  doc.text('E-ID    | Risiko     | Qualität | Reproduzierbarkeit', LEFT, y);
  y += 2; doc.setDrawColor(180, 180, 180); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont('courier', 'normal');
  risks.forEach((ri, i) => {
    checkSpace(6);
    doc.text(`E-${String(i + 1).padStart(3, '0')}   | ${riskId(ri).padEnd(10)} | ${ri.evidenceQuality}/5       | ${ri.reproducibility}`, LEFT, y);
    y += 4;
  });

  // ═══════════════════════════════════════════════════════════
  // APPENDIX D: Quality Assurance
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('secD', lang));
  introText(lang === 'de'
    ? 'Der automatisierte Qualitätscheck prueft die interne Konsistenz, fachliche Plausibilität und Vollständigkeit des Berichts. Die Ergebnisse werden hier vollständig dokumentiert, um die Nachvollziehbarkeit der Qualitätssicherung zu gewährleisten.'
    : 'The automated quality check verifies internal consistency, technical plausibility, and completeness.');

  if (data.qaChecks && data.qaChecks.length > 0) {
    heading(`D.1 ${lang === 'de' ? 'Quality-Gate-Ergebnis' : 'Quality Gate Result'}`, 2);
    if (data.qaIterations) {
      bodyText(`${lang === 'de' ? 'Durchläufe' : 'Iterations'}: ${data.qaIterations}`, 0);
    }
    const passedQa = data.qaChecks.filter(c => c.passed).length;
    const qaVerdict = passedQa === data.qaChecks.length ? 'PASSED' : `FAILED (${passedQa}/${data.qaChecks.length})`;
    bodyText(`${lang === 'de' ? 'Ergebnis' : 'Result'}: ${qaVerdict}`, 0);
    separator();
    data.qaChecks.forEach(c => {
      checkSpace(10);
      doc.setFont('courier', 'bold'); doc.setFontSize(8);
      doc.text(c.passed ? '[PASS]' : '[FAIL]', LEFT, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      const detail = `${c.id}: ${c.label}`;
      const detailLines = doc.splitTextToSize(detail, WIDTH - 20);
      doc.text(detailLines, LEFT + 16, y);
      y += detailLines.length * 3.5 + 1;
      if (!c.passed && c.detail) {
        doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
        const dl = doc.splitTextToSize(c.detail, WIDTH - 24);
        doc.text(dl, LEFT + 20, y);
        y += dl.length * 3 + 2;
        doc.setTextColor(0, 0, 0);
      }
    });
  }

  if (data.fixLog && data.fixLog.length > 0) {
    heading(`D.2 ${lang === 'de' ? 'Automatisierte Korrekturen (Remediation Log)' : 'Automated Corrections (Remediation Log)'}`, 2);
    introText(lang === 'de'
      ? 'Die folgenden Korrekturen wurden automatisch angewendet und sind vollständig nachvollziehbar. Der Pre-Fix-Status ist in D.1 dokumentiert.'
      : 'The following corrections were applied automatically. Pre-fix status is documented in D.1.');
    data.fixLog.forEach((fix, i) => {
      checkSpace(8);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      const fixLines = doc.splitTextToSize(`${i + 1}. ${fix}`, WIDTH - 8);
      doc.text(fixLines, LEFT + 4, y);
      y += fixLines.length * 3.5 + 2;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  doc.save(`DORA_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
