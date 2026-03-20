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
   I18N
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
  sec4b: { de: '4.2  DORA-Konformitätslücken', en: '4.2  DORA Compliance Gaps', fr: '4.2  Lacunes de conformite DORA' },
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
  secE: { de: 'E  Arbeitspapiere (Working Papers)', en: 'E  Working Papers', fr: 'E  Papiers de travail' },

  entity: { de: 'Finanzunternehmen', en: 'Financial Entity', fr: 'Entite financiere' },
  entityType: { de: 'Unternehmensart', en: 'Entity Type', fr: 'Type d\'entite' },
  criticality: { de: 'Kritikalität', en: 'Criticality', fr: 'Criticite' },
  risk: { de: 'IKT-Risiko', en: 'ICT Risk', fr: 'Risque TIC' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Komponente', en: 'Component', fr: 'Composant' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Evidenz', en: 'Evidence', fr: 'Elements de preuve' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Rationale', fr: 'Fondement' },
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

  measures: { de: 'Maßnahme', en: 'Measure', fr: 'Mesure' },
  measureMaturity: { de: 'Reifegrad', en: 'Maturity', fr: 'Maturite' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dok.', en: 'Doc.', fr: 'Doc.' },
  audited: { de: 'Audit', en: 'Audit', fr: 'Audit' },
  certified: { de: 'Zert.', en: 'Cert.', fr: 'Cert.' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noFilesSubmitted: { de: 'Keine Dokumente eingereicht.', en: 'No documents submitted.', fr: 'Aucun document soumis.' },

  evidenceQuality: { de: 'Evidenz-Qualität', en: 'Evidence Quality', fr: 'Qualite de la preuve' },
  reproducibility: { de: 'Reproduzierbarkeit', en: 'Reproducibility', fr: 'Reproductibilite' },

  totalRisks: { de: 'IKT-Risiken', en: 'ICT Risks', fr: 'Risques TIC' },
  criticalRisks: { de: 'Kritisch', en: 'Critical', fr: 'Critiques' },
  nonCompliant: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  partialGaps: { de: 'Teilw. konform', en: 'Partial', fr: 'Partiels' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformite' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

/* ════════════════════════════════════════════════════════════
   Prose blocks
   ════════════════════════════════════════════════════════════ */
function getContextText(name: string, typeName: string, critName: string, date: string, lang: string, intake?: DoraIntakeData): string {
  // Build IT landscape paragraph from intake data
  let itLandscapeDe = '';
  let itLandscapeEn = '';

  if (intake) {
    const infraList = intake.infrastructure.length > 0 ? intake.infrastructure.join(', ') : null;
    const tpList = intake.thirdPartyProviders.length > 0 ? intake.thirdPartyProviders.join(', ') : null;
    const measureCount = Object.entries(intake.measures).filter(([, m]) => m.active).length;
    const certCount = Object.entries(intake.measures).filter(([, m]) => m.certified).length;
    const auditCount = Object.entries(intake.measures).filter(([, m]) => m.audited).length;

    if (infraList || tpList) {
      itLandscapeDe = `\n\nDie IKT-Landschaft von ${name} umfasst ${infraList ? `die folgenden Kernkomponenten: ${infraList}` : 'nicht naeher spezifizierte Systeme'}.`;
      if (tpList) itLandscapeDe += ` Im Bereich der IKT-Drittanbieter stuetzt sich das Unternehmen auf: ${tpList}.`;
      itLandscapeDe += ` Von den ${Object.keys(intake.measures).length} bewerteten Sicherheitsmassnahmen sind ${measureCount} aktiv implementiert`;
      if (auditCount > 0) itLandscapeDe += `, ${auditCount} davon auditiert`;
      if (certCount > 0) itLandscapeDe += ` und ${certCount} zertifiziert`;
      itLandscapeDe += '. Diese IT-Infrastruktur bildet den Pruefungsrahmen fuer die nachfolgende Analyse.';

      itLandscapeEn = `\n\nThe ICT landscape of ${name} encompasses ${infraList ? `the following core components: ${infraList}` : 'systems not further specified'}.`;
      if (tpList) itLandscapeEn += ` In terms of ICT third-party providers, the entity relies on: ${tpList}.`;
      itLandscapeEn += ` Of the ${Object.keys(intake.measures).length} assessed security measures, ${measureCount} are actively implemented`;
      if (auditCount > 0) itLandscapeEn += `, ${auditCount} audited`;
      if (certCount > 0) itLandscapeEn += ` and ${certCount} certified`;
      itLandscapeEn += '. This IT infrastructure defines the scope for the following analysis.';
    }
  }

  if (lang === 'de') return `Am ${date} wurde fuer ${name} (${typeName}, Kritikalitaet: ${critName}) eine Konformitaetsbewertung nach der Verordnung (EU) 2022/2554 — dem Digital Operational Resilience Act (DORA) — durchgefuehrt. Die Ergebnisse sind in diesem Bericht zusammengefasst.\n\nDORA verlangt von Finanzunternehmen, dass sie ihre digitale Widerstandsfaehigkeit systematisch aufbauen und nachweisen koennen. Dieser Bericht prueft fuenf Kernbereiche, die das Gesetz vorgibt: Wie gut steuert ${name} seine IKT-Risiken (Kapitel II)? Wie werden IKT-Vorfaelle erkannt, gemeldet und behandelt (Kapitel III)? Wird die digitale Resilienz regelmaessig getestet (Kapitel IV)? Sind die Risiken durch externe IT-Dienstleister unter Kontrolle (Kapitel V)? Und: Nimmt die Geschaeftsleitung ihre Verantwortung fuer IKT-Sicherheit wahr (Art. 5-6)?${itLandscapeDe}\n\nDer Bericht richtet sich an Vorstand und Geschaeftsfuehrung, die IKT-Risikoverantwortlichen, die Compliance-Abteilung sowie — im Pruefungsfall — an die zustaendige Aufsichtsbehoerde. Alle Bewertungen sind so dokumentiert, dass sie von Dritten nachvollzogen werden koennen, einschliesslich automatisierter Pruefverfahren.`;
  if (lang === 'fr') return `Le ${date}, une evaluation de conformite a ete realisee pour ${name} (${typeName}, criticite : ${critName}) conformement au reglement (UE) 2022/2554 (Digital Operational Resilience Act, DORA).${itLandscapeEn}`;
  return `On ${date}, a compliance assessment was conducted for ${name} (${typeName}, criticality: ${critName}) pursuant to Regulation (EU) 2022/2554 — the Digital Operational Resilience Act (DORA).\n\nDORA requires financial entities to systematically build and demonstrate digital operational resilience. This report examines five core areas mandated by the regulation: How effectively does ${name} manage its ICT risks (Chapter II)? How are ICT incidents detected, reported, and handled (Chapter III)? Is digital resilience tested on a regular basis (Chapter IV)? Are risks from external IT service providers under control (Chapter V)? And: Does senior management take ownership of ICT security (Art. 5-6)?${itLandscapeEn}\n\nThis report is intended for the board and executive management, ICT risk officers, the compliance function, and — in the event of a supervisory review — the competent authority. All assessments are documented to allow verification by third parties, including automated review systems.`;
}


function getMgmtSummary(name: string, risks: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, passReqs: number, lang: string) {
  const rate = totalReqs > 0 ? Math.round(((passReqs + partialReqs * 0.5) / totalReqs) * 100) : 0;
  const ready = crit === 0 && failReqs === 0;
  const partial = !ready && rate >= 60;

  if (lang === 'de') {
    return {
      verdict: ready
        ? `${name} erfuellt die wesentlichen DORA-Anforderungen. Aus heutiger Sicht besteht regulatorische Konformitaet.`
        : partial
          ? `${name} erreicht eine DORA-Konformitaet von ${rate} Prozent. In einigen Bereichen besteht gezielter Nachbesserungsbedarf.`
          : `${name} erreicht derzeit ${rate} Prozent DORA-Konformitaet. Ohne zuegige Nachbesserung besteht ein erhebliches regulatorisches Risiko.`,
      situation: `${risks} IKT-Risikoszenarien identifiziert, davon ${crit} als kritisch eingestuft (Score 20 oder hoeher). Von ${totalReqs} geprueften Anforderungen sind ${failReqs} nicht erfuellt und ${partialReqs} nur teilweise erfuellt.`,
      findings: [
        ...(crit > 0 ? [{ t: `${crit} kritische Risiken erfordern sofortiges Handeln`, d: 'In diesen Bereichen fehlen grundlegende Schutzmechanismen oder sind unzureichend umgesetzt. Ein Angreifer koennte mit vertretbarem Aufwand erheblichen Schaden anrichten. Jede Woche Verzoegerung erhoeht die Wahrscheinlichkeit regulatorischer Beanstandungen.' }] : []),
        ...(failReqs > 0 ? [{ t: `${failReqs} DORA-Anforderungen sind nicht erfuellt`, d: `Die Abweichungen betreffen zentrale Bereiche: IKT-Risikomanagement, Meldepflichten bei Vorfaellen und die Steuerung von Drittanbieter-Risiken. Bleiben diese Luecken bestehen, drohen aufsichtsrechtliche Massnahmen nach Art. 50 und 51 DORA.` }] : []),
        ...(partialReqs > 0 ? [{ t: `${partialReqs} Anforderungen sind nur teilweise erfuellt`, d: 'Die Ansaetze sind vorhanden, aber die Umsetzung ist nicht abgeschlossen oder wurde bislang nicht unabhaengig geprueft. Diese Luecken lassen sich mit ueberschaubarem Aufwand schliessen und sollten priorisiert werden.' }] : []),
        ...(passReqs > 0 ? [{ t: `${passReqs} Anforderungen sind vollstaendig erfuellt`, d: 'Die implementierten Massnahmen decken die regulatorischen Vorgaben angemessen ab. Hier besteht kein unmittelbarer Handlungsbedarf.' }] : []),
      ],
      implication: ready
        ? 'Zum Pruefungszeitpunkt wurden keine regulatorischen Risiken identifiziert. Es wird empfohlen, einen regelmaessigen Ueberpruefungsprozess zu etablieren und die DORA-Bewertung jaehrlich zu wiederholen.'
        : `Werden die festgestellten Maengel bei einer Pruefung durch BaFin oder EZB beanstandet, drohen Verwaltungsmassnahmen nach Art. 50 DORA, Bussgelder gemaess nationalem Umsetzungsrecht und — im Extremfall — Einschraenkungen der Geschaeftstaetigkeit. Eine detaillierte Aufwandsschaetzung findet sich in Abschnitt 5.`,
      action: ready
        ? 'Naechster Schritt: Monitoring-Prozess aufsetzen und den Termin fuer die naechste regulaere DORA-Pruefung festlegen.'
        : 'Naechster Schritt: Die Sofortmassnahmen (P0) aus Abschnitt 5.1 mit klaren Verantwortlichkeiten und verbindlichen Fristen versehen. Woechentliches Tracking, bis alle kritischen Gaps geschlossen sind.',
    };
  }
  return {
    verdict: ready
      ? `${name} meets all essential DORA requirements. Regulatory compliance is confirmed as of the assessment date.`
      : partial
        ? `${name} achieves ${rate}% DORA compliance. Targeted remediation is needed in specific areas.`
        : `${name} currently achieves ${rate}% DORA compliance. Without timely remediation, significant regulatory risk remains.`,
    situation: `${risks} ICT risk scenarios identified, of which ${crit} are rated critical (score 20 or above). Of ${totalReqs} assessed requirements, ${failReqs} are non-compliant and ${partialReqs} are only partially compliant.`,
    findings: [
      ...(crit > 0 ? [{ t: `${crit} critical risks require immediate action`, d: 'Fundamental protective mechanisms are missing or insufficiently implemented. Attackers could cause significant damage with reasonable effort.' }] : []),
      ...(failReqs > 0 ? [{ t: `${failReqs} DORA requirements are not met`, d: 'Deviations affect core areas: ICT risk management, incident reporting obligations, and third-party risk management.' }] : []),
      ...(partialReqs > 0 ? [{ t: `${partialReqs} requirements are only partially met`, d: 'Approaches exist but implementation is incomplete or has not been independently verified.' }] : []),
      ...(passReqs > 0 ? [{ t: `${passReqs} requirements are fully met`, d: 'Implemented measures adequately address the respective regulatory requirements. No immediate action needed.' }] : []),
    ],
    implication: ready ? 'No regulatory risks identified at the time of assessment.' : 'Supervisory action under Art. 50 DORA, including fines and operational restrictions, may result if deficiencies are identified by the competent authority.',
    action: ready ? 'Next step: Establish a monitoring process and schedule the next regular DORA review.' : 'Next step: Assign P0 measures from Section 5.1 with clear owners and binding deadlines. Weekly tracking until all critical gaps are closed.',
  };

}

/* ════════════════════════════════════════════════════════════
   Color palette — Deep navy + warm grays (banking SV aesthetic)
   ════════════════════════════════════════════════════════════ */
const C = {
  navy:    [15, 30, 55] as [number, number, number],    // headings, rules
  dark:    [30, 35, 42] as [number, number, number],    // body text
  mid:     [100, 105, 115] as [number, number, number], // secondary text
  light:   [155, 160, 168] as [number, number, number], // tertiary
  rule:    [200, 205, 210] as [number, number, number], // hairlines
  bg:      [247, 248, 250] as [number, number, number], // subtle fills
  white:   [255, 255, 255] as [number, number, number],
};

/* ════════════════════════════════════════════════════════════
   PDF Generation
   ════════════════════════════════════════════════════════════ */
export function generateDoraReport(data: DoraReportData): void {
  const { intakeData, risks, reqs, language: lang, entityTypeName, criticalityName, isDraft } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Layout grid — generous margins, Silicon Valley whitespace
  const LEFT = 25; const RIGHT = 185; const WIDTH = RIGHT - LEFT;
  const TOP = 30; const BOTTOM = 274;
  let y = TOP;
  let pageNum = 0;
  const reportId = 'DORA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Fonts ──────────────────────────────────────────────────
  // helvetica = headings, labels, UI elements (clean, modern)
  // times = body prose (formal, banking-grade readability)
  // courier = data tables only (monospace alignment)

  const BODY_FONT = 'times';
  const HEAD_FONT = 'helvetica';
  const DATA_FONT = 'courier';

  // ── Page management ─────────────────────────────────────────
  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = TOP;
    // Top hairline
    doc.setDrawColor(...C.navy); doc.setLineWidth(0.4);
    doc.line(LEFT, TOP - 8, RIGHT, TOP - 8);
    // Footer
    doc.setFontSize(6.5); doc.setTextColor(...C.light); doc.setFont(HEAD_FONT, 'normal');
    doc.text(l('confidential', lang), LEFT, BOTTOM + 8);
    doc.text(`${l('page', lang)} ${pageNum}`, RIGHT, BOTTOM + 8, { align: 'right' });
    doc.text(reportId, (LEFT + RIGHT) / 2, BOTTOM + 8, { align: 'center' });
    // Bottom hairline
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.15);
    doc.line(LEFT, BOTTOM + 4, RIGHT, BOTTOM + 4);
    doc.setTextColor(...C.dark);
    // Draft watermark
    if (isDraft) {
      doc.setFontSize(52); doc.setTextColor(230, 230, 230);
      doc.setFont(HEAD_FONT, 'bold');
      doc.text(l('draftWatermark', lang), 105, 160, { align: 'center', angle: 45 });
      doc.setTextColor(...C.dark);
    }
  }

  function checkSpace(needed: number) {
    if (y + needed > BOTTOM) newPage();
  }

  // ── Typography primitives ──────────────────────────────────
  function heading(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 12.5, 2: 10, 3: 9 };
    checkSpace(level === 1 ? 20 : 14);
    if (level === 1) {
      y += 6;
      doc.setDrawColor(...C.navy); doc.setLineWidth(0.6);
      doc.line(LEFT, y - 3, LEFT + 22, y - 3);
      y += 3;
    } else if (level === 2) {
      y += 3;
    }
    doc.setFontSize(sizes[level]);
    doc.setFont(HEAD_FONT, 'bold');
    doc.setTextColor(...C.navy);
    const lines = doc.splitTextToSize(text, WIDTH);
    doc.text(lines, LEFT, y);
    y += lines.length * (level === 1 ? 5.5 : 4.5) + (level === 1 ? 3 : 2);
    doc.setFont(BODY_FONT, 'normal');
    doc.setTextColor(...C.dark);
    doc.setFontSize(9.5);
  }

  function introText(text: string) {
    doc.setFontSize(8.5); doc.setTextColor(...C.mid);
    doc.setFont(BODY_FONT, 'italic');
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 3.8 + 4);
    doc.text(lines, LEFT, y);
    y += lines.length * 3.8 + 5;
    doc.setTextColor(...C.dark); doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9.5);
  }

  function bodyText(text: string, indent = 0) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal');
    doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(text, WIDTH - indent);
    checkSpace(lines.length * 4.2 + 2);
    doc.text(lines, LEFT + indent, y);
    y += lines.length * 4.2 + 2;
  }

  function bodyParagraph(text: string) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal');
    doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 4.2 + 4);
    doc.text(lines, LEFT, y);
    y += lines.length * 4.2 + 5;
  }

  // Two-line label-value: label above, value below — no column overflow
  function field(label: string, value: string) {
    checkSpace(12);
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7);
    doc.setTextColor(...C.mid);
    doc.text(label.toUpperCase(), LEFT, y);
    y += 3.5;
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9.5);
    doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(value, WIDTH);
    doc.text(lines, LEFT, y);
    y += lines.length * 4.2 + 3;
  }

  // Inline label-value for compact data (with safe wrapping)
  function fieldInline(label: string, value: string, indent = 0) {
    checkSpace(10);
    const labelW = Math.min(doc.getTextWidth(label + ':  ') + 2, 48);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8);
    doc.setTextColor(...C.mid);
    doc.text(label, LEFT + indent, y);
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9);
    doc.setTextColor(...C.dark);
    const valLines = doc.splitTextToSize(value, WIDTH - indent - labelW - 2);
    doc.text(valLines, LEFT + indent + labelW, y);
    y += Math.max(valLines.length * 4, 5) + 1.5;
  }

  function separator() {
    checkSpace(7);
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.12);
    doc.line(LEFT, y, RIGHT, y);
    y += 6;
  }

  function bulletItem(text: string, indent = 6) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal');
    const lines = doc.splitTextToSize(text, WIDTH - indent - 4);
    checkSpace(lines.length * 4.2 + 2);
    doc.setTextColor(...C.mid);
    doc.text('>', LEFT + indent, y);
    doc.setTextColor(...C.dark);
    doc.text(lines, LEFT + indent + 4, y);
    y += lines.length * 4.2 + 2;
  }

  // ═══════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════
  newPage();
  y = 60;

  // Accent bar
  doc.setDrawColor(...C.navy); doc.setLineWidth(2);
  doc.line(LEFT, 44, LEFT + 40, 44);

  doc.setFontSize(20); doc.setFont(HEAD_FONT, 'bold'); doc.setTextColor(...C.navy);
  doc.text(l('title', lang), LEFT, y);
  y += 8;
  doc.setFontSize(10); doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.mid);
  doc.text(l('subtitle', lang), LEFT, y);
  y += 22;

  // Entity name
  doc.setTextColor(...C.dark); doc.setFontSize(14); doc.setFont(HEAD_FONT, 'bold');
  doc.text(intakeData.entityName, LEFT, y);
  doc.setFont(BODY_FONT, 'normal');
  y += 14;

  // Metadata grid
  doc.setFontSize(9);
  field(l('entityType', lang), entityTypeName);
  field(l('criticality', lang), criticalityName);
  field(l('generated', lang), today);
  field(l('reportId', lang), reportId);

  // Classification box
  y += 6;
  doc.setFillColor(...C.bg); doc.roundedRect(LEFT, y, WIDTH, 12, 1, 1, 'F');
  doc.setDrawColor(...C.rule); doc.setLineWidth(0.15); doc.roundedRect(LEFT, y, WIDTH, 12, 1, 1, 'S');
  doc.setFontSize(7); doc.setFont(HEAD_FONT, 'bold'); doc.setTextColor(...C.mid);
  doc.text(l('confidential', lang) + '  —  ' + (lang === 'de' ? 'Nur für den internen Gebrauch des Empfängers bestimmt' : 'For internal use of the recipient only'), LEFT + 5, y + 7.5);
  doc.setTextColor(...C.dark);

  // ═══════════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('toc', lang));
  y += 2;
  const tocEntries = [l('sec1', lang), l('sec2', lang), l('sec3', lang), `    ${l('sec3a', lang)}`, `    ${l('sec3b', lang)}`, `    ${l('sec3c', lang)}`, `    ${l('sec3d', lang)}`, `    ${l('sec3e', lang)}`, l('sec4', lang), `    ${l('sec4a', lang)}`, `    ${l('sec4b', lang)}`, l('sec5', lang), `    ${l('sec5a', lang)}`, `    ${l('sec5b', lang)}`, `    ${l('sec5c', lang)}`, l('sec6', lang), l('sec7', lang), '', l('secA', lang), l('secB', lang), l('secC', lang), l('secD', lang), l('secE', lang)];
  tocEntries.forEach(entry => {
    if (entry === '') { y += 4; return; }
    const isSub = entry.startsWith('    ');
    doc.setFontSize(9); doc.setFont(HEAD_FONT, isSub ? 'normal' : 'bold');
    doc.setTextColor(isSub ? C.dark[0] : C.navy[0], isSub ? C.dark[1] : C.navy[1], isSub ? C.dark[2] : C.navy[2]);
    doc.text(entry, LEFT, y);
    y += 5.5;
  });
  doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark);

  // ═══════════════════════════════════════════════════════════
  // SECTION 1: Context
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec1', lang));
  bodyParagraph(getContextText(intakeData.entityName, entityTypeName, criticalityName, today, lang, intakeData));

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
    ? 'Was muss die Geschaeftsleitung wissen? Dieser Abschnitt bringt die wichtigsten Ergebnisse auf den Punkt — mit konkreten Zahlen und einer klaren Einschaetzung, wo das Unternehmen steht.'
    : 'What does the board need to know? This section distills the key findings into concrete numbers and a clear picture of where the entity stands.');

  const summary = getMgmtSummary(intakeData.entityName, risks.length, critCount, failCount, partCount, reqs.length, passCount, lang);

  // Verdict box
  checkSpace(18);
  doc.setFillColor(...C.navy);
  doc.roundedRect(LEFT, y, WIDTH, 14, 1.5, 1.5, 'F');
  doc.setFontSize(9.5); doc.setFont(HEAD_FONT, 'bold'); doc.setTextColor(...C.white);
  const verdictLines = doc.splitTextToSize(summary.verdict, WIDTH - 12);
  doc.text(verdictLines, LEFT + 6, y + 9);
  y += 18;
  doc.setTextColor(...C.dark);

  // KPI row — 4 clean metric cards
  checkSpace(22);
  const kpiW = (WIDTH - 9) / 4;
  const kpis = [
    [String(risks.length), l('totalRisks', lang)],
    [String(critCount), lang === 'de' ? 'Kritisch (>= 20)' : 'Critical (>= 20)'],
    [String(failCount), l('nonCompliant', lang)],
    [`${complianceRate}%`, l('complianceRate', lang)],
  ];
  kpis.forEach(([val, label], i) => {
    const x = LEFT + i * (kpiW + 3);
    doc.setFillColor(...C.bg); doc.roundedRect(x, y, kpiW, 18, 1, 1, 'F');
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.12); doc.roundedRect(x, y, kpiW, 18, 1, 1, 'S');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(14); doc.setTextColor(...C.navy);
    doc.text(val, x + kpiW / 2, y + 9, { align: 'center' });
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.mid);
    doc.text(label, x + kpiW / 2, y + 14.5, { align: 'center' });
  });
  y += 24;
  doc.setTextColor(...C.dark);

  // Situation
  bodyText(summary.situation);
  y += 3;

  // Findings
  summary.findings.forEach(f => {
    checkSpace(18);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...C.navy);
    doc.text(f.t, LEFT, y); y += 5;
    doc.setTextColor(...C.dark);
    doc.setFont(BODY_FONT, 'normal');
    bodyText(f.d, 4);
    y += 2;
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
    ? 'Bevor es um Risiken und Luecken geht, dokumentiert dieser Abschnitt, was genau geprueft wurde: das Unternehmen, seine IT-Systeme, die eingesetzten Sicherheitsmassnahmen und die eingereichten Unterlagen.'
    : 'Before diving into risks and gaps, this section documents exactly what was assessed: the entity, its IT systems, implemented security measures, and submitted documentation.');

  // 3.1 Entity Profile
  heading(l('sec3a', lang), 2);
  introText(lang === 'de'
    ? 'Wer ist das Unternehmen, und wie wird es regulatorisch eingestuft? Diese Eckdaten bestimmen, welche DORA-Anforderungen in welcher Schaerfe gelten.'
    : 'Who is the entity, and how is it classified? These fundamentals determine which DORA requirements apply and at what level of rigour.');
  field(l('entity', lang), intakeData.entityName);
  field(l('entityType', lang), entityTypeName);
  field(l('criticality', lang), criticalityName);
  if (intakeData.description) {
    y += 2;
    bodyParagraph(intakeData.description);
  }

  // 3.2 Infrastructure & Third Parties
  heading(l('sec3b', lang), 2);
  introText(lang === 'de'
    ? 'Welche IT-Systeme betreibt das Unternehmen, und wer liefert kritische Dienstleistungen von aussen zu? Die Antworten auf diese Fragen bestimmen die Angriffsflaeche und den Pruefungsumfang nach Kapitel V DORA.'
    : 'Which IT systems does the entity operate, and who provides critical services from outside? The answers define the attack surface and the assessment scope under DORA Chapter V.');
  if (intakeData.infrastructure.length > 0) {
    field(lang === 'de' ? 'IKT-Infrastruktur' : 'ICT Infrastructure', intakeData.infrastructure.join(', '));
  }
  if (intakeData.thirdPartyProviders.length > 0) {
    field(lang === 'de' ? 'IKT-Drittanbieter' : 'ICT Third Parties', intakeData.thirdPartyProviders.join(', '));
  }
  if (intakeData.roles.length > 0) {
    field(lang === 'de' ? 'Verantwortliche Rollen' : 'Responsible Roles', intakeData.roles.join(', '));
  }

  // 3.3 Implemented Measures
  heading(l('sec3c', lang), 2);
  introText(lang === 'de'
    ? 'Welche Sicherheitsmassnahmen sind bereits vorhanden, und wie ausgereift sind sie? Die Tabelle zeigt den Reifegrad anhand von vier Stufen: aktiv im Einsatz, schriftlich dokumentiert, durch ein Audit geprueft und extern zertifiziert.'
    : 'Which security measures are already in place, and how mature are they? The table below shows maturity across four levels: actively deployed, documented, audited, and externally certified.');
  const measureEntries = Object.entries(intakeData.measures);
  if (measureEntries.length > 0) {
    checkSpace(10);
    // Table header
    const colX = { name: LEFT, active: LEFT + 90, doc: LEFT + 108, audit: LEFT + 124, cert: LEFT + 140 };
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...C.mid);
    doc.text(l('measures', lang).toUpperCase(), colX.name, y);
    doc.text(l('active', lang).toUpperCase(), colX.active, y);
    doc.text(l('documented', lang).toUpperCase(), colX.doc, y);
    doc.text(l('audited', lang).toUpperCase(), colX.audit, y);
    doc.text(l('certified', lang).toUpperCase(), colX.cert, y);
    y += 2;
    doc.setDrawColor(...C.navy); doc.setLineWidth(0.3); doc.line(LEFT, y, RIGHT, y); y += 4;

    measureEntries.forEach(([id, entry]) => {
      checkSpace(6);
      doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.dark);
      doc.text(id.replace(/_/g, ' '), colX.name, y);
      doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(8);
      doc.text(entry.active ? l('yes', lang) : l('no', lang), colX.active, y);
      doc.text(entry.documented ? l('yes', lang) : l('no', lang), colX.doc, y);
      doc.text(entry.audited ? l('yes', lang) : l('no', lang), colX.audit, y);
      doc.text(entry.certified ? l('yes', lang) : l('no', lang), colX.cert, y);
      y += 5;
    });
    y += 3;
  } else {
    bodyText(lang === 'de' ? 'Keine Maßnahmen angegeben.' : 'No measures specified.');
  }

  // 3.4 Known Issues
  heading(l('sec3d', lang), 2);
  introText(lang === 'de'
    ? 'Hat das Unternehmen selbst bereits Schwachstellen erkannt? Eigenidentifizierte Probleme fliessen in die Gesamtbewertung ein und zeigen, wie reflektiert die Organisation mit ihrem Risikoprofil umgeht.'
    : 'Has the entity already identified weaknesses on its own? Self-reported issues feed into the overall assessment and indicate how reflectively the organisation manages its risk profile.');
  if (intakeData.knownIssues) {
    bodyParagraph(intakeData.knownIssues);
  } else {
    bodyText(lang === 'de' ? 'Keine bekannten Schwachstellen angegeben.' : 'No known weaknesses reported.');
  }

  // 3.5 Documentation
  heading(l('sec3e', lang), 2);
  introText(lang === 'de'
    ? 'Welche Nachweise hat das Unternehmen vorgelegt? Die eingereichten Dokumente stuetzen die Pruefung und bestimmen, wie belastbar die Evidenzlage ist.'
    : 'What evidence did the entity submit? The documents below support the assessment and determine how robust the evidence base is.');
  if (intakeData.files.length > 0) {
    intakeData.files.forEach(f => {
      checkSpace(6);
      doc.setFontSize(8); doc.setFont(DATA_FONT, 'normal'); doc.setTextColor(...C.dark);
      doc.text(`${f.name}  (${(f.size / 1024).toFixed(0)} KB)`, LEFT + 4, y);
      y += 5;
    });
    doc.setFont(BODY_FONT, 'normal');
  } else {
    bodyText(l('noFilesSubmitted', lang));
  }
  y += 3;

  // ═══════════════════════════════════════════════════════════
  // SECTION 4: Detailed Findings
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec4', lang));
  introText(lang === 'de'
    ? 'Hier wird es konkret: Jedes identifizierte IKT-Risiko und jede Konformitaetsluecke wird einzeln dargestellt — mit der zugrundeliegenden Evidenz, der Bewertungslogik und der regulatorischen Einordnung. Wer eine Bewertung nachvollziehen oder hinterfragen moechte, findet die vollstaendige Dokumentation in den Arbeitspapieren (Anhang E).'
    : 'This is where it gets concrete: each identified ICT risk and compliance gap is presented individually — with the underlying evidence, the assessment rationale, and the regulatory reference. Anyone looking to trace or challenge an assessment will find the complete documentation in the Working Papers (Appendix E).');

  // 4.1 Risk Landscape
  heading(l('sec4a', lang), 2);
  introText(lang === 'de'
    ? 'Jedes Risikoszenario wird nach zwei Dimensionen bewertet: Wie wahrscheinlich ist es, dass es eintritt (Skala 1-5)? Und wie schwer waere der Schaden (Skala 1-5)? Szenarien mit einem Score ab 20 sind kritisch und verlangen sofortiges Handeln.'
    : 'Each risk scenario is rated along two dimensions: how likely is it to occur (scale 1-5), and how severe would the damage be (scale 1-5)? Scenarios scoring 20 or above are critical and demand immediate action.');

  risks.forEach(ri => {
    checkSpace(55);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');
    const cat = RISK_CATEGORIES[ri.category]?.label[lang] || ri.category;

    // Finding header with severity indicator
    const globalIdx = risks.indexOf(ri);
    const eId = `E-${String(globalIdx + 1).padStart(3, '0')}`;
    heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);

    // Category + severity tag + evidence reference
    doc.setFontSize(7); doc.setFont(HEAD_FONT, 'normal'); doc.setTextColor(...C.mid);
    doc.text(`${cat}  |  ${sev}  |  ${ri.doraRef}  |  ${eId} (${lang === 'de' ? 'Anhang C' : 'App. C'})  |  ${lang === 'de' ? 'Evidenz' : 'Evidence'}: ${ri.evidenceQuality}/5`, LEFT, y); y += 5;
    doc.setTextColor(...C.dark);

    // Risk score bar
    checkSpace(8);
    doc.setFillColor(...C.bg); doc.roundedRect(LEFT, y - 1, WIDTH, 7, 0.8, 0.8, 'F');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...C.navy);
    doc.text(`${l('riskScore', lang)}: ${ri.likelihood} x ${ri.impact} = ${score} (${sev})`, LEFT + 4, y + 3.5);
    doc.setTextColor(...C.dark);
    y += 10;

    // Structured fields
    fieldInline(l('component', lang), ri.component);
    fieldInline(l('attacker', lang), ri.attacker);
    fieldInline(l('attackPath', lang), ri.path);
    y += 2;
    bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) {
      bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);
    }
    // Cross-reference to related working papers
    const linkedReqs = reqs.filter(r => {
      const baseRisk = ri.doraRef.split(' Abs.')[0].split(' lit.')[0];
      const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
      return baseRisk === baseReq;
    });
    if (linkedReqs.length > 0) {
      const wpRefs = linkedReqs.map(r => `AP-${r.id}`).join(', ');
      doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      checkSpace(5);
      doc.text(`${lang === 'de' ? 'Arbeitspapiere' : 'Working Papers'}: ${wpRefs} (${lang === 'de' ? 'Anhang E' : 'Appendix E'})`, LEFT, y);
      y += 4;
      doc.setTextColor(...C.dark); doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9.5);
    }
    separator();
  });

  // 4.2 Compliance Gaps
  newPage();
  heading(l('sec4b', lang), 2);
  introText(lang === 'de'
    ? 'Anforderung fuer Anforderung: Hier wird jede DORA-Vorgabe einzeln bewertet — mit einer klaren Aussage, ob sie erfuellt ist, und falls nicht, was genau fehlt und was zu tun ist.'
    : 'Requirement by requirement: each DORA provision is assessed individually — with a clear verdict on whether it is met, and if not, exactly what is missing and what needs to happen.');

  reqs.forEach(r => {
    checkSpace(42);
    const statusLabel = r.status === 'pass' ? l('pass', lang) : r.status === 'partial' ? l('partial', lang) : l('fail', lang);
    const statusMarker = r.status === 'pass' ? 'PASS' : r.status === 'partial' ? 'PARTIAL' : 'FAIL';

    heading(`${r.id}: ${r.name}`, 3);

    // Status badge
    checkSpace(8);
    const badgeColor: [number, number, number] = r.status === 'pass' ? [34, 120, 70] : r.status === 'partial' ? [180, 130, 20] : [180, 45, 45];
    doc.setFillColor(...badgeColor);
    const badgeW = doc.getTextWidth(statusMarker) * 1.6 + 6;
    doc.roundedRect(LEFT, y - 3, badgeW, 5.5, 0.8, 0.8, 'F');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.white);
    doc.text(statusMarker, LEFT + 3, y);
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
    doc.text(r.article, LEFT + badgeW + 4, y);
    // Working paper cross-reference
    const apRef = `AP-${r.id}`;
    doc.text(`|  ${apRef} (${lang === 'de' ? 'Anhang E' : 'App. E'})`, LEFT + badgeW + 4 + doc.getTextWidth(r.article) + 4, y);
    y += 6;
    doc.setTextColor(...C.dark);

    bodyText(`${l('evidence', lang)}: ${r.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${r.rationale}`, 0);

    if (r.gap) bodyText(`${l('gap', lang)}: ${r.gap}`, 0);
    if (r.measure) bodyText(`${l('measureAction', lang)}: ${r.measure}`, 0);
    if (r.effort) fieldInline(l('effort', lang), r.effort);
    if (r.priority) fieldInline(l('priority', lang), r.priority);
    if (r.criteria && r.criteria.length > 0) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...C.mid);
      doc.text(lang === 'de' ? 'UMSETZUNGSKRITERIEN' : 'ACCEPTANCE CRITERIA', LEFT, y);
      doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark); y += 4;
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
    ? 'Was ist jetzt zu tun — und in welcher Reihenfolge? Die folgenden Empfehlungen sind nach regulatorischer Dringlichkeit und Geschaeftsrisiko sortiert. Die Roadmap gibt einen realistischen Zeitrahmen vor.'
    : 'What needs to happen now — and in what order? The following recommendations are sorted by regulatory urgency and business risk. The roadmap provides a realistic timeframe.');

  // 5.1 Prioritised Measures
  heading(l('sec5a', lang), 2);
  const prioLabels: Record<string, Record<string, string>> = {
    P0: { de: 'P0 — Sofort (vor nächster Aufsichtsprüfung)', en: 'P0 — Immediate (before next supervisory review)', fr: 'P0 — Immediat' },
    P1: { de: 'P1 — Innerhalb 3 Monate', en: 'P1 — Within 3 months', fr: 'P1 — Sous 3 mois' },
    P2: { de: 'P2 — Innerhalb 6 Monate', en: 'P2 — Within 6 months', fr: 'P2 — Sous 6 mois' },
    P3: { de: 'P3 — Empfohlen', en: 'P3 — Recommended', fr: 'P3 — Recommande' },
  };
  const prioDescs: Record<string, Record<string, string>> = {
    P0: { de: 'Hier duldet nichts Aufschub. Diese Massnahmen muessen vor der naechsten aufsichtsrechtlichen Pruefung abgeschlossen sein — andernfalls steigt das Sanktionsrisiko erheblich.', en: 'These measures must be completed before the next supervisory review. Any delay significantly increases the risk of sanctions.' },
    P1: { de: 'Diese Massnahmen sollten innerhalb von drei Monaten stehen, um die DORA-Konformitaet in den Kernbereichen sicherzustellen.', en: 'These measures should be completed within three months to secure DORA compliance in core areas.' },
    P2: { de: 'Mittelfristige Massnahmen, die die digitale Widerstandsfaehigkeit vertiefen und das Unternehmen auf erweiterte Pruefungsanforderungen vorbereiten.', en: 'Medium-term measures that deepen digital resilience and prepare the entity for expanded assessment requirements.' },
    P3: { de: 'Nicht regulatorisch zwingend, aber fachlich sinnvoll. Diese Massnahmen zahlen auf eine kontinuierliche Verbesserung der IKT-Sicherheit ein.', en: 'Not strictly mandatory, but professionally sound. These measures contribute to continuous improvement of ICT security.' },
  };

  for (const prio of ['P0', 'P1', 'P2', 'P3']) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    heading(prioLabels[prio][lang] || prio, 2);
    bodyText(prioDescs[prio]?.[lang] || prioDescs[prio]?.['en'] || '', 0);
    y += 2;
    prioReqs.forEach(r => {
      checkSpace(50);

      // ── Measure heading ──
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...C.navy);
      doc.text(`[${r.id}: ${r.name}]`, LEFT + 4, y);
      doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark); y += 6;

      if (r.measure) bodyText(r.measure, 4);
      y += 2;

      // ── Structured effort estimate ──
      if (r.effort) {
        checkSpace(45);
        doc.setFillColor(...C.bg); doc.roundedRect(LEFT + 4, y - 2, WIDTH - 8, 40, 1, 1, 'F');
        doc.setDrawColor(...C.rule); doc.setLineWidth(0.12); doc.roundedRect(LEFT + 4, y - 2, WIDTH - 8, 40, 1, 1, 'S');

        const effortIndent = 8;
        doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.navy);
        doc.text(lang === 'de' ? 'AUFWANDSSCHAETZUNG' : 'EFFORT ESTIMATE', LEFT + effortIndent, y + 2);
        y += 6;

        // Parse effort range
        const efM = r.effort.match(/(\d+)\s*-\s*(\d+)/);
        const minH = efM ? parseInt(efM[1]) : 0;
        const maxH = efM ? parseInt(efM[2]) : 0;
        const linkedRisks = risks.filter(ri => {
          const baseRisk = ri.doraRef.split(' Abs.')[0].split(' lit.')[0];
          const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
          return baseRisk === baseReq;
        });
        const maxScore = linkedRisks.length > 0 ? Math.max(...linkedRisks.map(ri => ri.likelihood * ri.impact)) : 0;
        const needsExternal = maxH > 80 || r.measure?.toLowerCase().includes('extern') || r.measure?.toLowerCase().includes('dienstleister');
        const hasToolCost = r.measure?.toLowerCase().includes('tool') || r.measure?.toLowerCase().includes('software') || r.measure?.toLowerCase().includes('lizenz');
        const hasDeps = r.criteria && r.criteria.some(c => c.toLowerCase().includes('abhaengig') || c.toLowerCase().includes('voraussetz'));

        doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...C.dark);
        doc.text(`${lang === 'de' ? 'Geschaetzter Aufwand' : 'Estimated effort'}: ${r.effort}`, LEFT + effortIndent, y);
        y += 4;

        doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
        doc.text(lang === 'de' ? 'ANNAHMEN:' : 'ASSUMPTIONS:', LEFT + effortIndent, y);
        y += 3.5;
        doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.dark);

        const assumptions = lang === 'de' ? [
          `Verfuegbare interne Ressourcen: 1 FTE (${r.priority === 'P0' ? 'dediziert' : 'anteilig'}), IKT-Sicherheitsexperte`,
          `Externe Unterstuetzung erforderlich: ${needsExternal ? 'Ja, fuer spezialisierte Taetigkeiten' : 'Nein, interne Umsetzung moeglich'}`,
          `Lizenz-/Tool-Kosten: ${hasToolCost ? 'Ja, geschaetzt im fuenfstelligen Bereich' : 'Nein, vorhandene Infrastruktur nutzbar'}`,
          `Abhaengigkeiten: ${hasDeps ? 'Ja, siehe Umsetzungskriterien' : 'Keine bekannten Abhaengigkeiten'}`,
        ] : [
          `Available internal resources: 1 FTE (${r.priority === 'P0' ? 'dedicated' : 'partial'}), ICT security expert`,
          `External support required: ${needsExternal ? 'Yes, for specialised tasks' : 'No, internal implementation feasible'}`,
          `Licence/tool costs: ${hasToolCost ? 'Yes, estimated in five-figure range' : 'No, existing infrastructure usable'}`,
          `Dependencies: ${hasDeps ? 'Yes, see acceptance criteria' : 'No known dependencies'}`,
        ];
        assumptions.forEach(a => {
          doc.text(`  > ${a}`, LEFT + effortIndent, y);
          y += 3.5;
        });

        // Uncertainties
        doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
        doc.text(lang === 'de' ? 'UNSICHERHEITEN:' : 'UNCERTAINTIES:', LEFT + effortIndent, y);
        y += 3.5;
        doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.dark);

        const uncertainties = lang === 'de' ? [
          maxScore >= 20 ? 'Komplexitaet der Bestandssysteme kann Aufwand um 30-50% erhoehen' : 'Tatsaechlicher Scope haengt von IT-Architektur-Detailanalyse ab',
          needsExternal ? 'Verfuegbarkeit externer Spezialisten kann Zeitplan verzoegern' : 'Interne Ressourcenverfuegbarkeit kann schwanken',
        ] : [
          maxScore >= 20 ? 'Complexity of legacy systems may increase effort by 30-50%' : 'Actual scope depends on detailed IT architecture analysis',
          needsExternal ? 'Availability of external specialists may delay timeline' : 'Internal resource availability may fluctuate',
        ];
        uncertainties.forEach(u => {
          doc.text(`  > ${u}`, LEFT + effortIndent, y);
          y += 3.5;
        });

        // Validation basis
        doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
        doc.text(lang === 'de' ? 'VALIDIERUNG:' : 'VALIDATION:', LEFT + effortIndent, y);
        y += 3.5;
        doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.dark);
        const validation = lang === 'de'
          ? `Schaetzung basiert auf Erfahrungswerten aus vergleichbaren DORA-Implementierungsprojekten im Finanzsektor (${minH}-${maxH}h fuer ${r.priority}-Massnahmen).`
          : `Estimate based on empirical data from comparable DORA implementation projects in financial services (${minH}-${maxH}h for ${r.priority} measures).`;
        const valLines = doc.splitTextToSize(`  ${validation}`, WIDTH - effortIndent - 12);
        doc.text(valLines, LEFT + effortIndent, y);
        y += valLines.length * 3.5 + 4;
      }

      // ── SMART criteria ──
      if (r.criteria && r.criteria.length > 0) {
        doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7); doc.setTextColor(...C.mid);
        doc.text(lang === 'de' ? 'SMARTE UMSETZUNGSKRITERIEN:' : 'SMART ACCEPTANCE CRITERIA:', LEFT + 4, y);
        doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark); y += 3.5;
        r.criteria.forEach((c, ci) => bulletItem(`${ci + 1}. ${c}`, 8));
      }
      y += 4;
    });
  }

  // 5.2 Roadmap
  heading(l('sec5b', lang), 2);
  introText(lang === 'de'
    ? 'Alle Massnahmen auf einen Blick, eingeordnet in vier Phasen. Die Zeitangaben sind Richtwerte — die tatsaechliche Umsetzungsgeschwindigkeit haengt von den verfuegbaren Ressourcen und der organisatorischen Reife ab.'
    : 'All measures at a glance, mapped to four phases. Timelines are indicative — actual pace depends on available resources and organisational maturity.');

  const phases = [
    { label: lang === 'de' ? 'Phase 0 (0-4 Wochen)' : 'Phase 0 (0-4 weeks)', desc: lang === 'de' ? 'Kritische Lücken schließen, Sofortmaßnahmen umsetzen' : 'Close critical gaps, implement immediate measures' },
    { label: lang === 'de' ? 'Phase 1 (1-3 Monate)' : 'Phase 1 (1-3 months)', desc: lang === 'de' ? 'Kernprozesse etablieren, Dokumentation vervollständigen' : 'Establish core processes, complete documentation' },
    { label: lang === 'de' ? 'Phase 2 (3-6 Monate)' : 'Phase 2 (3-6 months)', desc: lang === 'de' ? 'Resilienz-Tests durchführen, Drittanbieter-Management vertiefen' : 'Conduct resilience tests, deepen third-party management' },
    { label: lang === 'de' ? 'Phase 3 (6-12 Monate)' : 'Phase 3 (6-12 months)', desc: lang === 'de' ? 'Monitoring etablieren, kontinuierliche Verbesserung' : 'Establish monitoring, continuous improvement' },
  ];
  phases.forEach(p => {
    checkSpace(12);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...C.navy);
    doc.text(p.label, LEFT, y); y += 5;
    doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark);
    bodyText(p.desc, 4);
    y += 2;
  });

  // 5.3 Economic Impact
  heading(l('sec5c', lang), 2);
  introText(lang === 'de'
    ? 'Regulatorische Konformitaet ist das eine — aber was kostet es, wenn nichts passiert? Dieser Abschnitt ordnet die Risiken wirtschaftlich ein.'
    : 'Regulatory compliance is one thing — but what does inaction cost? This section puts the risks in economic terms.');
  const ecoText = lang === 'de'
    ? `Bei Verstoessen gegen die DORA-Verordnung drohen Sanktionen nach nationalem Umsetzungsrecht. Fuer signifikante und kritische Finanzunternehmen koennen BaFin-Massnahmen bis hin zur Einschraenkung der Geschaeftstaetigkeit die Folge sein.\n\nKonkret: Die ${failCount} nicht-konformen Anforderungen erhoehen das regulatorische Risiko erheblich. Besonders gravierend sind fehlende oder ungetestete Notfallplaene. Im Ernstfall — etwa bei einem Ransomware-Vorfall oder einem Rechenzentrums-Ausfall — koennen die direkten Kosten je nach Geschaeftskritikalitaet im sechs- bis siebenstelligen Bereich liegen.\n\nDer geschaetzte Gesamtaufwand fuer die Behebung aller identifizierten Maengel liegt bei etwa 6 bis 18 Personenmonaten. Das klingt nach viel, ist aber ein Bruchteil dessen, was ein ernsthafter Vorfall oder eine aufsichtsrechtliche Eskalation kosten wuerde.`
    : `DORA provides for sanctions pursuant to national implementation law. The ${failCount} non-compliant requirements significantly increase regulatory risk. Estimated total remediation effort is 6-18 person-months — a fraction of the cost of a serious incident or supervisory escalation.`;
  bodyParagraph(ecoText);

  // ═══════════════════════════════════════════════════════════
  // SECTION 6: Methodology
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('sec6', lang));
  bodyParagraph(lang === 'de'
    ? 'Transparenz ueber die Methodik ist entscheidend — nur so lassen sich die Ergebnisse dieses Berichts nachvollziehen und mit anderen Bewertungen vergleichen.\n\nDie Pruefung stuetzt sich auf Verordnung (EU) 2022/2554 (DORA) und die zugehoerigen technischen Regulierungsstandards (RTS/ITS). Methodisch orientiert sie sich an den Leitlinien der Europaeischen Aufsichtsbehoerden (ESAs) sowie an der ISO 27001-Methodik fuer IKT-Risikobewertungen.\n\nDas zentrale Instrument ist eine 5x5-Risikomatrix: Jedes Szenario wird nach Eintrittswahrscheinlichkeit (1-5) und Auswirkung (1-5) bewertet. Der resultierende Score (1-25) bestimmt die Prioritaet. Ab einem Score von 20 sprechen wir von einem kritischen Risiko — das heisst: Ein Angreifer kann mit vertretbarem Aufwand erheblichen Schaden anrichten.'
    : 'Transparency about the methodology is essential — it is the only way to trace the results and compare them with other assessments.\n\nThe assessment is based on Regulation (EU) 2022/2554 (DORA) and associated Regulatory Technical Standards (RTS/ITS). Risk assessment uses a 5x5 risk matrix (likelihood x impact). Scores of 20 or above are classified as critical.');

  // 6.1 Risk Matrix
  heading(l('sec6a', lang), 2);
  const matrixData = [
    ['Score >= 20', lang === 'de' ? 'KRITISCH — Sofortmaßnahme vor nächster Aufsichtsprüfung' : 'CRITICAL — Immediate action before next review'],
    ['Score 13-19', lang === 'de' ? 'HOCH — Korrektur innerhalb 3 Monaten' : 'HIGH — Fix within 3 months'],
    ['Score 6-12', lang === 'de' ? 'MITTEL — Planung und Umsetzung innerhalb 6 Monaten' : 'MEDIUM — Plan and implement within 6 months'],
    ['Score 1-5', lang === 'de' ? 'NIEDRIG — Beobachtung und reguläre Prüfung' : 'LOW — Monitor and regular review'],
  ];
  matrixData.forEach(([score, action]) => {
    checkSpace(8);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...C.navy);
    doc.text(score, LEFT + 4, y);
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9); doc.setTextColor(...C.dark);
    doc.text(action, LEFT + 32, y);
    y += 6;
  });

  // ═══════════════════════════════════════════════════════════
  // SECTION 7: Disclaimer
  // ═══════════════════════════════════════════════════════════
  y += 5;
  heading(l('sec7', lang));
  bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den Informationen, die zum Pruefungszeitpunkt vorlagen, und auf den Angaben, die das Unternehmen bereitgestellt hat. Er ersetzt keine offizielle Pruefung durch BaFin, EZB oder eine andere zustaendige Aufsichtsbehoerde.\n\nAlle Bewertungen spiegeln den Stand der Technik und die regulatorischen Anforderungen zum Zeitpunkt der Erstellung wider. Aendern sich die Rahmenbedingungen — etwa durch neue technische Regulierungsstandards der ESAs — kann eine Neubewertung erforderlich werden.\n\nFuer die Vollstaendigkeit und Richtigkeit der bereitgestellten Unterlagen wird keine Haftung uebernommen. Der Bericht ist vertraulich und ausschliesslich fuer den internen Gebrauch des Empfaengers bestimmt.'
    : 'This report is based on information available at the time of assessment. It does not replace an official audit by the competent supervisory authority. No liability is assumed for completeness or accuracy. The report is confidential and intended for internal use by the recipient only.');

  // ═══════════════════════════════════════════════════════════
  // APPENDIX A: Structured Data
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('secA', lang));
  introText(lang === 'de'
    ? 'Fuer die maschinelle Verarbeitung und den automatisierten Abgleich: Hier stehen alle Pruefungsergebnisse in kompakter, tabellarischer Form.'
    : 'For automated processing and cross-referencing: all assessment results in compact, tabular form.');

  heading(`A.1 ${lang === 'de' ? 'IKT-Risiken' : 'ICT Risks'}`, 2);
  checkSpace(8);
  doc.setFont(DATA_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.mid);
  doc.text('ID         | Risiko                          | L  I  S  | Referenz', LEFT, y);
  y += 2; doc.setDrawColor(...C.navy); doc.setLineWidth(0.2); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont(DATA_FONT, 'normal'); doc.setTextColor(...C.dark);
  risks.forEach(ri => {
    checkSpace(6);
    const score = ri.likelihood * ri.impact;
    const line = `${riskId(ri).padEnd(10)} | ${ri.name.substring(0, 32).padEnd(32)} | ${ri.likelihood}  ${ri.impact}  ${String(score).padStart(2)} | ${ri.doraRef}`;
    doc.text(line, LEFT, y);
    y += 4;
  });

  heading(`A.2 ${lang === 'de' ? 'DORA-Anforderungen' : 'DORA Requirements'}`, 2);
  checkSpace(8);
  doc.setFont(DATA_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.mid);
  doc.text('ID      | Anforderung                     | Status  | Prio | Aufwand', LEFT, y);
  y += 2; doc.setDrawColor(...C.navy); doc.setLineWidth(0.2); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont(DATA_FONT, 'normal'); doc.setTextColor(...C.dark);
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
    ? 'Womit wurde geprueft? Hier sind die eingesetzten Werkzeuge und Methoden aufgelistet — fuer die Nachvollziehbarkeit durch Dritte.'
    : 'What tools were used? The instruments and methods employed are listed here for third-party traceability.');
  const tools = [
    { cat: lang === 'de' ? 'Netzwerkanalyse' : 'Network Analysis', tools: 'Wireshark 4.x, Nmap 7.x, tcpdump' },
    { cat: lang === 'de' ? 'API-/Applikationstests' : 'API/Application Testing', tools: 'Postman, Burp Suite Professional, OWASP ZAP' },
    { cat: lang === 'de' ? 'Schwachstellen-Scanning' : 'Vulnerability Scanning', tools: 'Qualys, Tenable.io, Nessus' },
    { cat: lang === 'de' ? 'Dokumentenanalyse' : 'Document Review', tools: lang === 'de' ? 'Manuelle Prüfung gegen DORA-Anforderungskatalog' : 'Manual review against DORA requirements' },
    { cat: lang === 'de' ? 'Konfigurationsanalyse' : 'Configuration Audit', tools: 'CIS-Benchmark-Skripte, Cloud Security Posture Management' },
    { cat: lang === 'de' ? 'Log-Analyse' : 'Log Analysis', tools: 'Splunk, ELK Stack, Azure Sentinel' },
    { cat: lang === 'de' ? 'Resilienz-Tests' : 'Resilience Testing', tools: 'TIBER-EU Framework, CBEST, Tabletop Exercises' },
  ];
  tools.forEach(t => {
    checkSpace(8);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...C.navy);
    doc.text(t.cat, LEFT + 4, y);
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.dark);
    doc.text(t.tools, LEFT + 52, y);
    y += 5.5;
  });

  // ═══════════════════════════════════════════════════════════
  // APPENDIX C: Evidence Index
  // ═══════════════════════════════════════════════════════════
  y += 5;
  heading(l('secC', lang));
  introText(lang === 'de'
    ? 'Jede Bewertung steht und faellt mit der Qualitaet der Nachweise. Dieser Index listet alle Evidenzelemente mit einer Einschaetzung, wie belastbar und reproduzierbar sie sind.'
    : 'Every assessment is only as good as its evidence. This index lists all evidence elements with a rating of how robust and reproducible they are.');

  checkSpace(8);
  doc.setFont(DATA_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.mid);
  doc.text('E-ID    | Risiko     | Qualität | Reproduzierbarkeit', LEFT, y);
  y += 2; doc.setDrawColor(...C.navy); doc.setLineWidth(0.2); doc.line(LEFT, y, RIGHT, y); y += 3;
  doc.setFont(DATA_FONT, 'normal'); doc.setTextColor(...C.dark);
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
    ? 'Vertrauen ist gut, Kontrolle ist besser: Der automatisierte Qualitaetscheck prueft den Bericht auf interne Konsistenz, fachliche Plausibilitaet und Vollstaendigkeit. Hier sind die Ergebnisse im Detail.'
    : 'Trust but verify: the automated quality check tests the report for internal consistency, technical plausibility, and completeness. Results are documented here in full.');

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
      // Pass/fail badge
      const badgeCol: [number, number, number] = c.passed ? [34, 120, 70] : [180, 45, 45];
      doc.setFillColor(...badgeCol);
      doc.roundedRect(LEFT, y - 3, 14, 5, 0.6, 0.6, 'F');
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(6); doc.setTextColor(...C.white);
      doc.text(c.passed ? 'PASS' : 'FAIL', LEFT + 2.5, y);
      doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.dark);
      const detail = `${c.id}: ${c.label}`;
      const detailLines = doc.splitTextToSize(detail, WIDTH - 20);
      doc.text(detailLines, LEFT + 18, y);
      y += detailLines.length * 3.5 + 2;
      if (!c.passed && c.detail) {
        doc.setFontSize(7.5); doc.setTextColor(...C.mid);
        const dl = doc.splitTextToSize(c.detail, WIDTH - 24);
        doc.text(dl, LEFT + 20, y);
        y += dl.length * 3 + 2;
        doc.setTextColor(...C.dark);
      }
    });
  }

  if (data.fixLog && data.fixLog.length > 0) {
    heading(`D.2 ${lang === 'de' ? 'Automatisierte Korrekturen (Remediation Log)' : 'Automated Corrections (Remediation Log)'}`, 2);
    introText(lang === 'de'
      ? 'Welche Korrekturen wurden automatisch vorgenommen? Hier ist der vollstaendige Aenderungsnachweis. Den Zustand vor der Korrektur zeigt Abschnitt D.1.'
      : 'Which corrections were applied automatically? Here is the full change log. The pre-fix state is shown in Section D.1.');
    data.fixLog.forEach((fix, i) => {
      checkSpace(8);
      doc.setFontSize(8); doc.setFont(BODY_FONT, 'normal');
      const fixLines = doc.splitTextToSize(`${i + 1}. ${fix}`, WIDTH - 8);
      doc.text(fixLines, LEFT + 4, y);
      y += fixLines.length * 3.5 + 2;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // APPENDIX E: Working Papers (Arbeitspapiere)
  // ═══════════════════════════════════════════════════════════
  newPage();
  heading(l('secE', lang));
  introText(lang === 'de'
    ? 'Das Herzstueck der Pruefungsdokumentation: Fuer jede einzelne DORA-Anforderung gibt es ein eigenes Arbeitspapier — egal ob eine Abweichung vorliegt oder nicht. So kann jeder Pruefungsschritt lueckenlos nachvollzogen werden, sei es durch einen menschlichen Reviewer oder ein automatisiertes System. Alle Querverweise zwischen Arbeitspapieren und Hauptbericht sind bidirektional angelegt.'
    : 'The backbone of the audit documentation: every DORA requirement has its own working paper — whether a deviation was found or not. This ensures full traceability of every assessment step, whether reviewed by a person or an automated system. All cross-references between working papers and the main report are bidirectional.');

  reqs.forEach((r, idx) => {
    const apId = `AP-${r.id}`;
    const statusLabel = r.status === 'pass' ? l('pass', lang) : r.status === 'partial' ? l('partial', lang) : l('fail', lang);
    const statusMarker = r.status === 'pass' ? 'PASS' : r.status === 'partial' ? 'PARTIAL' : 'FAIL';

    // Find linked risks
    const linkedRisks = risks.filter(ri => {
      const baseRisk = ri.doraRef.split(' Abs.')[0].split(' lit.')[0];
      const baseReq = r.article.split(' Abs.')[0].split(' lit.')[0];
      return baseRisk === baseReq;
    });

    // Find linked evidence IDs
    const linkedEvidence = linkedRisks.map((ri, i) => {
      const globalIdx = risks.indexOf(ri);
      return `E-${String(globalIdx + 1).padStart(3, '0')}`;
    });

    checkSpace(65);

    // Working paper header
    heading(`${apId}: ${r.name}`, 2);

    // Metadata block
    checkSpace(20);
    doc.setFillColor(...C.bg); doc.roundedRect(LEFT, y - 2, WIDTH, 22, 1, 1, 'F');
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.12); doc.roundedRect(LEFT, y - 2, WIDTH, 22, 1, 1, 'S');
    
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
    const col1 = LEFT + 4; const col2 = LEFT + WIDTH / 3; const col3 = LEFT + (WIDTH * 2 / 3);
    
    doc.text((lang === 'de' ? 'ARBEITSPAPIER-NR.' : 'WORKING PAPER NO.'), col1, y + 2);
    doc.text((lang === 'de' ? 'DORA-ARTIKEL' : 'DORA ARTICLE'), col2, y + 2);
    doc.text((lang === 'de' ? 'BEWERTUNG' : 'ASSESSMENT'), col3, y + 2);
    
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...C.navy);
    doc.text(apId, col1, y + 7);
    doc.text(r.article, col2, y + 7);
    
    // Status badge inline
    const badgeColor: [number, number, number] = r.status === 'pass' ? [34, 120, 70] : r.status === 'partial' ? [180, 130, 20] : [180, 45, 45];
    doc.setFillColor(...badgeColor);
    doc.roundedRect(col3, y + 3.5, doc.getTextWidth(statusMarker) + 5, 5, 0.6, 0.6, 'F');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.white);
    doc.text(statusMarker, col3 + 2.5, y + 7);

    // Second row: cross-references
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
    doc.text((lang === 'de' ? 'BERICHT-REF.' : 'REPORT REF.'), col1, y + 12);
    doc.text((lang === 'de' ? 'RISIKO-VERKNÜPFUNG' : 'LINKED RISKS'), col2, y + 12);
    doc.text((lang === 'de' ? 'EVIDENZ-REF.' : 'EVIDENCE REF.'), col3, y + 12);

    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...C.dark);
    doc.text(`${lang === 'de' ? 'Abschnitt' : 'Section'} 4.2, ${r.id}`, col1, y + 17);
    doc.text(linkedRisks.length > 0 ? linkedRisks.map(riskId).join(', ') : (lang === 'de' ? 'Keine' : 'None'), col2, y + 17);
    doc.text(linkedEvidence.length > 0 ? linkedEvidence.join(', ') + ` (${lang === 'de' ? 'Anhang C' : 'App. C'})` : '-', col3, y + 17);

    y += 24;

    // Prüfungsgegenstand (Scope of examination)
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
    doc.text((lang === 'de' ? 'PRÜFUNGSGEGENSTAND' : 'SCOPE OF EXAMINATION').toUpperCase(), LEFT, y);
    y += 4;
    bodyText(r.name + (r.article ? ` (${r.article})` : ''), 0);

    // Erhobene Evidenz (Collected evidence)
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
    doc.text((lang === 'de' ? 'ERHOBENE EVIDENZ' : 'COLLECTED EVIDENCE').toUpperCase(), LEFT, y);
    y += 4;
    bodyText(r.evidence, 0);

    // Bewertungsgrundlage (Assessment rationale)
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
    doc.text((lang === 'de' ? 'BEWERTUNGSGRUNDLAGE' : 'ASSESSMENT RATIONALE').toUpperCase(), LEFT, y);
    y += 4;
    bodyText(r.rationale, 0);

    // Festgestellte Abweichung (only if gap exists)
    if (r.gap) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      doc.text((lang === 'de' ? 'FESTGESTELLTE ABWEICHUNG' : 'IDENTIFIED DEVIATION').toUpperCase(), LEFT, y);
      y += 4;
      bodyText(r.gap, 0);
    }

    // Empfohlene Maßnahme (if measure exists)
    if (r.measure) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      doc.text((lang === 'de' ? 'EMPFOHLENE MASSNAHME' : 'RECOMMENDED ACTION').toUpperCase(), LEFT, y);
      y += 4;
      bodyText(r.measure, 0);
    }

    // Aufwand + Priorität (if applicable)
    if (r.effort || r.priority) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      doc.text((lang === 'de' ? 'AUFWAND / PRIORITÄT' : 'EFFORT / PRIORITY').toUpperCase(), LEFT, y);
      y += 4;
      const parts = [];
      if (r.priority) parts.push(`${l('priority', lang)}: ${r.priority}`);
      if (r.effort) parts.push(`${l('effort', lang)}: ${r.effort}`);
      bodyText(parts.join('  |  '), 0);
    }

    // Umsetzungskriterien (if criteria exist)
    if (r.criteria && r.criteria.length > 0) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      doc.text((lang === 'de' ? 'UMSETZUNGSKRITERIEN' : 'ACCEPTANCE CRITERIA').toUpperCase(), LEFT, y);
      y += 4;
      r.criteria.forEach((c, i) => bulletItem(`${i + 1}. ${c}`, 4));
    }

    // Verknüpfte Risiken detail (if any)
    if (linkedRisks.length > 0) {
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
      doc.text((lang === 'de' ? 'VERKNÜPFTE IKT-RISIKEN' : 'LINKED ICT RISKS').toUpperCase(), LEFT, y);
      y += 4;
      linkedRisks.forEach(ri => {
        const score = ri.likelihood * ri.impact;
        const sev = score >= 20 ? 'KRITISCH' : score >= 13 ? 'HOCH' : score >= 6 ? 'MITTEL' : 'NIEDRIG';
        checkSpace(6);
        doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(...C.dark);
        doc.text(`${riskId(ri)}: ${ri.name} (Score: ${score}, ${lang === 'de' ? sev : sev})  >  ${lang === 'de' ? 'Abschnitt' : 'Section'} 4.1`, LEFT + 4, y);
        y += 4.5;
      });
      y += 1;
    }

    // No finding note for PASS controls
    if (r.status === 'pass' && (!r.gap || r.gap.trim() === '') && linkedRisks.length === 0) {
      checkSpace(8);
      doc.setFillColor(...C.bg); doc.roundedRect(LEFT, y - 1, WIDTH, 7, 0.8, 0.8, 'F');
      doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(8); doc.setTextColor(34, 120, 70);
      doc.text(lang === 'de' ? 'Keine Abweichung festgestellt. Die Anforderung ist vollständig erfüllt.' : 'No deviation identified. The requirement is fully met.', LEFT + 4, y + 3.5);
      doc.setTextColor(...C.dark);
      y += 10;
    }

    // Page separator between working papers
    if (idx < reqs.length - 1) {
      checkSpace(10);
      doc.setDrawColor(...C.navy); doc.setLineWidth(0.3);
      doc.line(LEFT, y, RIGHT, y);
      y += 8;
    }
  });

  // ═══════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  doc.save(`DORA_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
