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

const I18N: Record<string, Record<string, string>> = {
  title: { de: 'DORA Konformitaetsbewertung', en: 'DORA Compliance Assessment', fr: 'Evaluation de conformite DORA' },
  subtitle: { de: 'Pruefbericht nach Verordnung (EU) 2022/2554', en: 'Assessment Report pursuant to Regulation (EU) 2022/2554', fr: 'Rapport selon le reglement (UE) 2022/2554' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Genere le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matieres' },
  sec1: { de: '1  Ausgangslage und Zielsetzung', en: '1  Context and Objectives', fr: '1  Contexte et objectifs' },
  sec2: { de: '2  Zusammenfassung fuer die Geschaeftsleitung', en: '2  Management Summary', fr: '2  Synthese pour la direction' },
  sec3: { de: '3  Gegenstand der Pruefung', en: '3  Scope of Assessment', fr: '3  Perimetre de l\'evaluation' },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Detailed Findings', fr: '4  Constatations detaillees' },
  sec5: { de: '5  Handlungsempfehlungen und Roadmap', en: '5  Recommendations and Roadmap', fr: '5  Recommandations et feuille de route' },
  sec6: { de: '6  Methodik und Pruefungsgrundlagen', en: '6  Methodology', fr: '6  Methodologie' },
  sec7: { de: '7  Einschraenkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilite' },
  secA: { de: 'A  Strukturierte Pruefdaten', en: 'A  Structured Audit Data', fr: 'A  Donnees d\'audit structurees' },
  secB: { de: 'B  Pruefwerkzeuge', en: 'B  Tools', fr: 'B  Outils' },
  secC: { de: 'C  Evidenz-Index', en: 'C  Evidence Index', fr: 'C  Index des preuves' },
  secD: { de: 'D  Qualitaetssicherung', en: 'D  Quality Assurance', fr: 'D  Assurance qualite' },
  entity: { de: 'Finanzunternehmen', en: 'Financial Entity', fr: 'Entite financiere' },
  entityType: { de: 'Unternehmensart', en: 'Entity Type', fr: 'Type d\'entite' },
  criticality: { de: 'Kritikalitaet', en: 'Criticality', fr: 'Criticite' },
  risk: { de: 'IKT-Risiko', en: 'ICT Risk', fr: 'Risque TIC' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerne' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Elements de preuve' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Fondement' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Evaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilite' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Evaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Ecart identifie' },
  measureAction: { de: 'Empfohlene Massnahme', en: 'Recommended Action', fr: 'Mesure recommandee' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  priority: { de: 'Prioritaet', en: 'Priority', fr: 'Priorite' },
  effort: { de: 'Geschaetzter Aufwand', en: 'Estimated Effort', fr: 'Effort estime' },
  doraRef: { de: 'DORA-Referenz', en: 'DORA Reference', fr: 'Reference DORA' },
  draftWatermark: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },
  introSec1: { de: 'Dieser Bericht dokumentiert die Pruefung der digitalen operationalen Resilienz gemaess Verordnung (EU) 2022/2554 (DORA). Ziel ist die systematische Bewertung der IKT-Risikomanagement-Faehigkeiten, der Incident-Reporting-Prozesse, der Resilienz-Tests und des Drittanbieter-Risikomanagements.', en: 'This report documents the assessment of digital operational resilience pursuant to Regulation (EU) 2022/2554 (DORA). The objective is to systematically evaluate ICT risk management capabilities, incident reporting processes, resilience testing and third-party risk management.', fr: 'Ce rapport documente l\'evaluation de la resilience operationnelle numerique conformement au reglement (UE) 2022/2554 (DORA).' },
  introSec2: { de: 'Dieser Abschnitt fasst die wesentlichen Ergebnisse der DORA-Konformitaetspruefung zusammen. Er richtet sich an Entscheidungstraeger und gibt eine datengestuetzte Einschaetzung der regulatorischen Reife.', en: 'This section summarises the key findings of the DORA compliance assessment. It is intended for decision-makers and provides a data-driven assessment of regulatory maturity.', fr: 'Cette section resume les principales conclusions de l\'evaluation DORA.' },
  introSec3: { de: 'Der folgende Abschnitt beschreibt das geprueftes Finanzunternehmen und die bereitgestellten Informationen. Diese Angaben bilden die Grundlage fuer die Risiko- und Konformitaetsanalyse.', en: 'This section describes the assessed financial entity and the information provided.', fr: 'Cette section decrit l\'entite financiere evaluee.' },
  introSec4: { de: 'In diesem Abschnitt werden die identifizierten IKT-Risiken und Konformitaetsluecken im Detail dargestellt. Jede Feststellung enthaelt Evidenz, Bewertungslogik und regulatorische Referenz.', en: 'This section presents the identified ICT risks and compliance gaps in detail.', fr: 'Cette section presente les risques TIC identifies et les lacunes de conformite.' },
  introSec5: { de: 'Die Handlungsempfehlungen sind nach regulatorischer Dringlichkeit priorisiert. Die Roadmap gibt einen realistischen Zeitrahmen fuer die Umsetzung vor.', en: 'Recommendations are prioritised by regulatory urgency. The roadmap provides a realistic implementation timeframe.', fr: 'Les recommandations sont hierarchisees par urgence reglementaire.' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

export function generateDoraReport(data: DoraReportData): void {
  const { intakeData, risks, reqs, language: lang, entityTypeName, criticalityName, isDraft } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const LEFT = 25; const RIGHT = 185; const WIDTH = RIGHT - LEFT;
  const TOP = 30; const BOTTOM = 275;
  let y = TOP;
  let pageNum = 0;
  const reportId = 'DORA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = TOP;
    // Footer
    doc.setFontSize(7); doc.setTextColor(160, 160, 160);
    doc.text(l('confidential', lang), LEFT, BOTTOM + 8);
    doc.text(`${l('page', lang)} ${pageNum}`, RIGHT, BOTTOM + 8, { align: 'right' });
    doc.text(reportId, (LEFT + RIGHT) / 2, BOTTOM + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    // Draft watermark
    if (isDraft) {
      doc.setFontSize(60); doc.setTextColor(220, 220, 220);
      doc.text(l('draftWatermark', lang), 105, 160, { align: 'center', angle: 45 });
      doc.setTextColor(0, 0, 0);
    }
  }

  function checkSpace(needed: number) {
    if (y + needed > BOTTOM) newPage();
  }

  function heading(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 14, 2: 11, 3: 9.5 };
    checkSpace(level === 1 ? 20 : 14);
    if (level === 1) { y += 6; }
    doc.setFontSize(sizes[level]);
    doc.setFont('helvetica', 'bold');
    doc.text(text, LEFT, y);
    y += level === 1 ? 8 : 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
  }

  function introText(text: string) {
    doc.setFontSize(8.5); doc.setTextColor(100, 100, 100);
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 3.5 + 2);
    doc.text(lines, LEFT, y);
    y += lines.length * 3.5 + 3;
    doc.setTextColor(0, 0, 0); doc.setFontSize(9);
  }

  function bodyText(text: string, indent = 0) {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, WIDTH - indent);
    checkSpace(lines.length * 4 + 2);
    doc.text(lines, LEFT + indent, y);
    y += lines.length * 4 + 2;
  }

  function labelValue(label: string, value: string) {
    checkSpace(8);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(label + ':', LEFT, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const valLines = doc.splitTextToSize(value, WIDTH - 45);
    doc.text(valLines, LEFT + 45, y);
    y += Math.max(valLines.length * 4, 5) + 1;
  }

  function separator() {
    checkSpace(4);
    doc.setDrawColor(200, 200, 200);
    doc.line(LEFT, y, RIGHT, y);
    y += 4;
  }

  // ═══ COVER PAGE ═══
  newPage();
  y = 60;
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text(l('title', lang), LEFT, y);
  y += 10;
  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(l('subtitle', lang), LEFT, y);
  y += 20;
  doc.setTextColor(0, 0, 0); doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(intakeData.entityName, LEFT, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.setFontSize(9);
  labelValue(l('entityType', lang), entityTypeName);
  labelValue(l('criticality', lang), criticalityName);
  labelValue(l('generated', lang), today);
  labelValue(l('reportId', lang), reportId);

  // ═══ TOC ═══
  newPage();
  heading(l('toc', lang));
  const tocEntries = [l('sec1', lang), l('sec2', lang), l('sec3', lang), l('sec4', lang), l('sec5', lang), l('sec6', lang), l('sec7', lang), l('secA', lang), l('secB', lang), l('secC', lang), l('secD', lang)];
  tocEntries.forEach(entry => { bodyText(entry); });

  // ═══ SECTION 1: Context ═══
  newPage();
  heading(l('sec1', lang));
  introText(l('introSec1', lang));
  bodyText(intakeData.description || '-');

  // ═══ SECTION 2: Management Summary ═══
  heading(l('sec2', lang));
  introText(l('introSec2', lang));

  const passCount = reqs.filter(r => r.status === 'pass').length;
  const partCount = reqs.filter(r => r.status === 'partial').length;
  const failCount = reqs.filter(r => r.status === 'fail').length;
  const critCount = risks.filter(r => r.likelihood * r.impact >= 20).length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);

  checkSpace(30);
  doc.setFillColor(245, 245, 245); doc.roundedRect(LEFT, y, WIDTH, 24, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text(`${risks.length} ${lang === 'de' ? 'IKT-Risiken' : 'ICT Risks'}`, LEFT + 5, y + 6);
  doc.text(`${critCount} ${lang === 'de' ? 'Kritisch' : 'Critical'} (>= 20)`, LEFT + 50, y + 6);
  doc.text(`${failCount} ${lang === 'de' ? 'Nicht konform' : 'Non-Compliant'}`, LEFT + 100, y + 6);
  doc.text(`${complianceRate}% ${lang === 'de' ? 'Konformitaet' : 'Compliance'}`, LEFT + 5, y + 14);
  doc.text(`${passCount}/${reqs.length} ${lang === 'de' ? 'konform' : 'compliant'}`, LEFT + 50, y + 14);
  doc.text(`${partCount} ${lang === 'de' ? 'teilweise' : 'partial'}`, LEFT + 100, y + 14);
  doc.setFont('helvetica', 'normal');
  y += 30;

  // ═══ SECTION 3: Scope ═══
  heading(l('sec3', lang));
  introText(l('introSec3', lang));
  labelValue(l('entity', lang), intakeData.entityName);
  labelValue(l('entityType', lang), entityTypeName);
  labelValue(l('criticality', lang), criticalityName);
  if (intakeData.infrastructure.length > 0) {
    labelValue(lang === 'de' ? 'IKT-Infrastruktur' : 'ICT Infrastructure', intakeData.infrastructure.join(', '));
  }
  if (intakeData.thirdPartyProviders.length > 0) {
    labelValue(lang === 'de' ? 'IKT-Drittanbieter' : 'ICT Third-Party Providers', intakeData.thirdPartyProviders.join(', '));
  }
  if (intakeData.roles.length > 0) {
    labelValue(lang === 'de' ? 'Verantwortliche Rollen' : 'Responsible Roles', intakeData.roles.join(', '));
  }
  if (intakeData.knownIssues) {
    labelValue(lang === 'de' ? 'Bekannte Probleme' : 'Known Issues', intakeData.knownIssues);
  }

  // ═══ SECTION 4: Detailed Findings ═══
  newPage();
  heading(l('sec4', lang));
  introText(l('introSec4', lang));

  // 4.1 Risk Landscape
  heading(`4.1 ${lang === 'de' ? 'IKT-Risikolandschaft' : 'ICT Risk Landscape'}`, 2);
  risks.forEach((ri, idx) => {
    checkSpace(45);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');
    heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    labelValue(l('component', lang), ri.component);
    labelValue(l('attacker', lang), ri.attacker);
    labelValue(l('attackPath', lang), ri.path);
    labelValue(l('doraRef', lang), ri.doraRef);
    labelValue(l('riskScore', lang), `${ri.likelihood} x ${ri.impact} = ${score} (${sev})`);
    bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) {
      bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);
    }
    separator();
  });

  // 4.2 Compliance Gaps
  heading(`4.2 ${lang === 'de' ? 'DORA-Konformitaetsluecken' : 'DORA Compliance Gaps'}`, 2);
  reqs.forEach(r => {
    checkSpace(35);
    const statusLabel = r.status === 'pass' ? l('pass', lang) : r.status === 'partial' ? l('partial', lang) : l('fail', lang);
    heading(`${r.id}: ${r.name}`, 3);
    labelValue(l('status', lang), statusLabel);
    labelValue('Artikel', r.article);
    if (r.gap) bodyText(`${l('gap', lang)}: ${r.gap}`, 0);
    bodyText(`${l('evidence', lang)}: ${r.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${r.rationale}`, 0);
    if (r.measure) bodyText(`${l('measureAction', lang)}: ${r.measure}`, 0);
    if (r.effort) labelValue(l('effort', lang), r.effort);
    if (r.priority) labelValue(l('priority', lang), r.priority);
    if (r.criteria.length > 0) {
      bodyText(`${lang === 'de' ? 'Umsetzungskriterien' : 'Acceptance Criteria'}:`, 0);
      r.criteria.forEach((c, i) => bodyText(`  ${i + 1}. ${c}`, 4));
    }
    separator();
  });

  // ═══ SECTION 5: Recommendations ═══
  newPage();
  heading(l('sec5', lang));
  introText(l('introSec5', lang));

  const priorities = ['P0', 'P1', 'P2', 'P3'];
  const prioLabels: Record<string, Record<string, string>> = {
    P0: { de: 'P0 — Sofort (vor naechster Pruefung)', en: 'P0 — Immediate', fr: 'P0 — Immediat' },
    P1: { de: 'P1 — Innerhalb 3 Monate', en: 'P1 — Within 3 months', fr: 'P1 — Sous 3 mois' },
    P2: { de: 'P2 — Innerhalb 6 Monate', en: 'P2 — Within 6 months', fr: 'P2 — Sous 6 mois' },
    P3: { de: 'P3 — Empfohlen', en: 'P3 — Recommended', fr: 'P3 — Recommande' },
  };
  for (const prio of priorities) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    heading(prioLabels[prio][lang] || prio, 2);
    prioReqs.forEach(r => {
      checkSpace(15);
      bodyText(`> ${r.id} ${r.name}: ${r.measure || '-'}`, 0);
      if (r.effort) bodyText(`  ${l('effort', lang)}: ${r.effort}`, 4);
    });
  }

  // ═══ SECTION 5.3: Economic Impact ═══
  heading(`5.3 ${lang === 'de' ? 'Wirtschaftliche Betrachtung' : 'Economic Impact Assessment'}`, 2);
  const ecoText = lang === 'de'
    ? `Die DORA-Verordnung sieht bei Verstoessen Geldbussen gemaess nationalem Recht vor. Fuer signifikante und kritische Finanzunternehmen koennen BaFin-Massnahmen bis hin zum Entzug der Lizenz drohen. Die identifizierten ${failCount} nicht-konformen Anforderungen erhoehen das regulatorische Risiko erheblich. Produktionsausfaelle durch ungetestete DR-Plaene (vgl. D11-2) koennen direkte Kosten in Millionenhoehe verursachen.`
    : `DORA provides for penalties pursuant to national law. For significant and critical entities, regulatory measures up to licence revocation may apply. The ${failCount} non-compliant requirements significantly increase regulatory risk.`;
  bodyText(ecoText);

  // ═══ SECTION 6: Methodology ═══
  newPage();
  heading(l('sec6', lang));
  bodyText(lang === 'de'
    ? 'Die Pruefung basiert auf Verordnung (EU) 2022/2554 (DORA) und den zugehoerigen technischen Regulierungsstandards (RTS). Die Risikobewertung nutzt eine 5x5-Risikomatrix (Likelihood x Impact). Kritische Risiken (Score >= 20) erfordern Sofortmassnahmen.'
    : 'The assessment is based on Regulation (EU) 2022/2554 (DORA) and associated Regulatory Technical Standards (RTS). Risk assessment uses a 5x5 risk matrix (Likelihood x Impact). Critical risks (score >= 20) require immediate action.');

  // Risk matrix
  checkSpace(40);
  heading(`6.1 ${lang === 'de' ? 'Risikobewertungsmatrix' : 'Risk Rating Matrix'}`, 2);
  const matrixData = [
    [lang === 'de' ? 'Score >= 20' : 'Score >= 20', lang === 'de' ? 'KRITISCH — Sofortmassnahme' : 'CRITICAL — Immediate action'],
    [lang === 'de' ? 'Score 13-19' : 'Score 13-19', lang === 'de' ? 'HOCH — Korrektur vor Audit' : 'HIGH — Fix before audit'],
    [lang === 'de' ? 'Score 6-12' : 'Score 6-12', lang === 'de' ? 'MITTEL — Planung empfohlen' : 'MEDIUM — Planning recommended'],
    [lang === 'de' ? 'Score 1-5' : 'Score 1-5', lang === 'de' ? 'NIEDRIG — Beobachtung' : 'LOW — Monitor'],
  ];
  matrixData.forEach(([score, action]) => {
    bodyText(`${score}: ${action}`, 4);
  });

  // ═══ SECTION 7: Disclaimer ═══
  heading(l('sec7', lang));
  bodyText(lang === 'de'
    ? 'Dieser Bericht basiert auf den zum Pruefungszeitpunkt vorliegenden Informationen. Er ersetzt keine offizielle Pruefung durch die zustaendige Aufsichtsbehoerde. Die Bewertungen reflektieren den Stand der Technik und die regulatorischen Anforderungen zum Zeitpunkt der Erstellung. Eine Haftung fuer die Vollstaendigkeit und Richtigkeit wird nicht uebernommen.'
    : 'This report is based on information available at the time of assessment. It does not replace an official audit by the competent authority. Assessments reflect the state of the art and regulatory requirements at the time of preparation.');

  // ═══ APPENDIX A: Structured Data ═══
  newPage();
  heading(l('secA', lang));
  introText(lang === 'de' ? 'Maschinenlesbare Zusammenfassung aller Pruefungsergebnisse.' : 'Machine-readable summary of all audit results.');

  // Risks table
  heading(`A.1 ${lang === 'de' ? 'IKT-Risiken' : 'ICT Risks'}`, 2);
  risks.forEach(ri => {
    checkSpace(10);
    const score = ri.likelihood * ri.impact;
    bodyText(`${riskId(ri)} | ${ri.name} | ${ri.component} | L=${ri.likelihood} I=${ri.impact} S=${score} | ${ri.doraRef}`, 0);
  });

  // Reqs table
  heading(`A.2 ${lang === 'de' ? 'DORA-Anforderungen' : 'DORA Requirements'}`, 2);
  reqs.forEach(r => {
    checkSpace(10);
    const s = r.status === 'pass' ? 'PASS' : r.status === 'partial' ? 'PARTIAL' : 'FAIL';
    bodyText(`${r.id} | ${r.name} | ${r.article} | ${s} | ${r.effort || '-'} | ${r.priority || '-'}`, 0);
  });

  // ═══ APPENDIX B: Tools ═══
  newPage();
  heading(l('secB', lang));
  const tools = [
    'Netzwerkanalyse: Wireshark 4.x, Nmap 7.x',
    'API-Testing: Postman, Burp Suite Professional',
    'Vulnerability-Scanning: Qualys, Tenable.io',
    'Dokumentenanalyse: Manuelle Pruefung',
    'Konfigurationsanalyse: CIS-Benchmark-Skripte',
    'Log-Analyse: Splunk, ELK Stack',
  ];
  tools.forEach(tool => bodyText(`> ${tool}`, 4));

  // ═══ APPENDIX C: Evidence Index ═══
  heading(l('secC', lang));
  introText(lang === 'de' ? 'Index aller referenzierten Evidenzelemente mit Qualitaetsbewertung.' : 'Index of all referenced evidence elements with quality rating.');
  risks.forEach((ri, i) => {
    checkSpace(10);
    bodyText(`E-${String(i + 1).padStart(3, '0')} | ${riskId(ri)} | ${ri.name} | Qualitaet: ${ri.evidenceQuality}/5 | ${ri.reproducibility}`, 0);
  });

  // ═══ APPENDIX D: Quality Assurance ═══
  newPage();
  heading(l('secD', lang));

  if (data.qaChecks && data.qaChecks.length > 0) {
    heading(`D.1 ${lang === 'de' ? 'Quality-Gate-Ergebnis' : 'Quality Gate Result'}`, 2);
    if (data.qaIterations) {
      bodyText(`${lang === 'de' ? 'Durchlaeufe' : 'Iterations'}: ${data.qaIterations}`, 0);
    }
    const passedQa = data.qaChecks.filter(c => c.passed).length;
    bodyText(`${lang === 'de' ? 'Ergebnis' : 'Result'}: ${passedQa}/${data.qaChecks.length}`, 0);
    separator();
    data.qaChecks.forEach(c => {
      checkSpace(8);
      bodyText(`${c.passed ? '[PASS]' : '[FAIL]'} ${c.id}: ${c.label} — ${c.detail}`, 0);
    });
  }

  if (data.fixLog && data.fixLog.length > 0) {
    heading(`D.2 ${lang === 'de' ? 'Automatisierte Korrekturen (Remediation Log)' : 'Automated Corrections (Remediation Log)'}`, 2);
    introText(lang === 'de'
      ? 'Die folgenden Korrekturen wurden automatisch angewendet und sind vollstaendig nachvollziehbar.'
      : 'The following corrections were applied automatically and are fully traceable.');
    data.fixLog.forEach((fix, i) => {
      checkSpace(8);
      bodyText(`${i + 1}. ${fix}`, 4);
    });
  }

  // ═══ SAVE ═══
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  doc.save(`DORA_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
