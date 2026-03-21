// NIS-2 Report PDF — mirrors DORA report structure for NIS-2 Directive (EU) 2022/2555
import jsPDF from 'jspdf';
import type { Nis2IntakeData, Nis2Risk, Nis2Req } from '@/data/nis2ComplianceData';
import { riskId, RISK_CATEGORIES } from '@/data/nis2ComplianceData';
import type { QaCheck } from '@/utils/nis2QualityCheck';

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
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Évaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart identifié' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandée' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estimé' },
  nis2Ref: { de: 'NIS-2-Referenz', en: 'NIS-2 Reference', fr: 'Référence NIS-2' },
  draftWatermark: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },
  active: { de: 'Aktiv', en: 'Active', fr: 'Active' },
  documented: { de: 'Dok.', en: 'Doc.', fr: 'Doc.' },
  audited: { de: 'Audit', en: 'Audit', fr: 'Audit' },
  certified: { de: 'Zert.', en: 'Cert.', fr: 'Cert.' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  measures: { de: 'Maßnahme', en: 'Measure', fr: 'Mesure' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  totalRisks: { de: 'Risiken', en: 'Risks', fr: 'Risques' },
  criticalRisks: { de: 'Kritisch', en: 'Critical', fr: 'Critiques' },
  nonCompliant: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  complianceRate: { de: 'Konformitätsrate', en: 'Compliance Rate', fr: 'Taux de conformité' },
};

function l(key: string, lang: string): string {
  return I18N[key]?.[lang] || I18N[key]?.['en'] || key;
}

const C = {
  navy: [15, 30, 55] as [number, number, number],
  dark: [30, 35, 42] as [number, number, number],
  mid: [100, 105, 115] as [number, number, number],
  light: [155, 160, 168] as [number, number, number],
  rule: [200, 205, 210] as [number, number, number],
  bg: [247, 248, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export function generateNis2Report(data: Nis2ReportData): void {
  const { intakeData, risks, reqs, language: lang, entityTypeName, criticalityName, isDraft } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const LEFT = 25; const RIGHT = 185; const WIDTH = RIGHT - LEFT;
  const TOP = 30; const BOTTOM = 274;
  let y = TOP;
  let pageNum = 0;
  const reportId = 'NIS2-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' });
  const BODY_FONT = 'times';
  const HEAD_FONT = 'helvetica';
  const DATA_FONT = 'courier';

  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++; y = TOP;
    doc.setDrawColor(...C.navy); doc.setLineWidth(0.4); doc.line(LEFT, TOP - 8, RIGHT, TOP - 8);
    doc.setFontSize(6.5); doc.setTextColor(...C.light); doc.setFont(HEAD_FONT, 'normal');
    doc.text(l('confidential', lang), LEFT, BOTTOM + 8);
    doc.text(`${l('page', lang)} ${pageNum}`, RIGHT, BOTTOM + 8, { align: 'right' });
    doc.text(reportId, (LEFT + RIGHT) / 2, BOTTOM + 8, { align: 'center' });
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.15); doc.line(LEFT, BOTTOM + 4, RIGHT, BOTTOM + 4);
    doc.setTextColor(...C.dark);
    if (isDraft) {
      doc.setFontSize(52); doc.setTextColor(230, 230, 230); doc.setFont(HEAD_FONT, 'bold');
      doc.text(l('draftWatermark', lang), 105, 160, { align: 'center', angle: 45 });
      doc.setTextColor(...C.dark);
    }
  }

  function checkSpace(needed: number) { if (y + needed > BOTTOM) newPage(); }

  function heading(text: string, level: 1 | 2 | 3 = 1) {
    const sizes = { 1: 12.5, 2: 10, 3: 9 };
    checkSpace(level === 1 ? 20 : 14);
    if (level === 1) { y += 6; doc.setDrawColor(...C.navy); doc.setLineWidth(0.6); doc.line(LEFT, y - 3, LEFT + 22, y - 3); y += 3; }
    else if (level === 2) { y += 3; }
    doc.setFontSize(sizes[level]); doc.setFont(HEAD_FONT, 'bold'); doc.setTextColor(...C.navy);
    const lines = doc.splitTextToSize(text, WIDTH);
    doc.text(lines, LEFT, y);
    y += lines.length * (level === 1 ? 5.5 : 4.5) + (level === 1 ? 3 : 2);
    doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark); doc.setFontSize(9.5);
  }

  function bodyText(text: string, indent = 0) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(text, WIDTH - indent);
    checkSpace(lines.length * 4.2 + 2);
    doc.text(lines, LEFT + indent, y); y += lines.length * 4.2 + 2;
  }

  function bodyParagraph(text: string) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(text, WIDTH);
    checkSpace(lines.length * 4.2 + 4);
    doc.text(lines, LEFT, y); y += lines.length * 4.2 + 5;
  }

  function field(label: string, value: string) {
    checkSpace(12);
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7); doc.setTextColor(...C.mid);
    doc.text(label.toUpperCase(), LEFT, y); y += 3.5;
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...C.dark);
    const lines = doc.splitTextToSize(value, WIDTH);
    doc.text(lines, LEFT, y); y += lines.length * 4.2 + 3;
  }

  function fieldInline(label: string, value: string, indent = 0) {
    checkSpace(10);
    const labelW = Math.min(doc.getTextWidth(label + ':  ') + 2, 48);
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8); doc.setTextColor(...C.mid);
    doc.text(label, LEFT + indent, y);
    doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(9); doc.setTextColor(...C.dark);
    const valLines = doc.splitTextToSize(value, WIDTH - indent - labelW - 2);
    doc.text(valLines, LEFT + indent + labelW, y);
    y += Math.max(valLines.length * 4, 5) + 1.5;
  }

  function separator() {
    checkSpace(7); doc.setDrawColor(...C.rule); doc.setLineWidth(0.12);
    doc.line(LEFT, y, RIGHT, y); y += 6;
  }

  function bulletItem(text: string, indent = 6) {
    doc.setFontSize(9.5); doc.setFont(BODY_FONT, 'normal');
    const lines = doc.splitTextToSize(text, WIDTH - indent - 4);
    checkSpace(lines.length * 4.2 + 2);
    doc.setTextColor(...C.mid); doc.text('>', LEFT + indent, y);
    doc.setTextColor(...C.dark); doc.text(lines, LEFT + indent + 4, y);
    y += lines.length * 4.2 + 2;
  }

  // ═══ COVER PAGE ═══
  newPage(); y = 60;
  doc.setDrawColor(...C.navy); doc.setLineWidth(2); doc.line(LEFT, 44, LEFT + 40, 44);
  doc.setFontSize(20); doc.setFont(HEAD_FONT, 'bold'); doc.setTextColor(...C.navy);
  doc.text(l('title', lang), LEFT, y); y += 8;
  doc.setFontSize(10); doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.mid);
  doc.text(l('subtitle', lang), LEFT, y); y += 22;
  doc.setTextColor(...C.dark); doc.setFontSize(14); doc.setFont(HEAD_FONT, 'bold');
  doc.text(intakeData.entityName, LEFT, y); doc.setFont(BODY_FONT, 'normal'); y += 14;
  doc.setFontSize(9);
  field(l('entityType', lang), entityTypeName);
  field(l('criticality', lang), criticalityName);
  field(l('generated', lang), today);
  field(l('reportId', lang), reportId);

  // ═══ MANAGEMENT SUMMARY ═══
  const passCount = reqs.filter(r => r.status === 'pass').length;
  const partCount = reqs.filter(r => r.status === 'partial').length;
  const failCount = reqs.filter(r => r.status === 'fail').length;
  const critCount = risks.filter(r => r.likelihood * r.impact >= 20).length;
  const complianceRate = Math.round((passCount * 100 + partCount * 50) / reqs.length);

  newPage();
  heading(lang === 'de' ? '1  Zusammenfassung für die Geschäftsleitung' : '1  Management Summary');
  const verdictText = lang === 'de'
    ? `${intakeData.entityName} erreicht derzeit ${complianceRate}% NIS-2-Konformität. ${risks.length} Risikoszenarien wurden identifiziert, davon ${critCount} mit kritischem Score (>= 20). Von ${reqs.length} geprüften Anforderungen bestehen ${failCount} Lücken.`
    : `${intakeData.entityName} currently achieves ${complianceRate}% NIS-2 compliance. ${risks.length} risk scenarios identified, ${critCount} critical. Of ${reqs.length} requirements, ${failCount} gaps remain.`;

  doc.setFontSize(9.5); doc.setFont(HEAD_FONT, 'bold');
  const vLines = doc.splitTextToSize(verdictText, WIDTH - 12);
  const vBoxH = Math.max(14, vLines.length * 4.5 + 8);
  checkSpace(vBoxH + 4);
  doc.setFillColor(...C.navy); doc.roundedRect(LEFT, y, WIDTH, vBoxH, 1.5, 1.5, 'F');
  doc.setTextColor(...C.white); doc.text(vLines, LEFT + 6, y + 6);
  y += vBoxH + 4; doc.setTextColor(...C.dark);

  // KPI row
  checkSpace(22);
  const kpiW = (WIDTH - 9) / 4;
  const kpis = [[String(risks.length), l('totalRisks', lang)], [String(critCount), l('criticalRisks', lang)], [String(failCount), l('nonCompliant', lang)], [`${complianceRate}%`, l('complianceRate', lang)]];
  kpis.forEach(([val, label], i) => {
    const x = LEFT + i * (kpiW + 3);
    doc.setFillColor(...C.bg); doc.roundedRect(x, y, kpiW, 18, 1, 1, 'F');
    doc.setDrawColor(...C.rule); doc.setLineWidth(0.12); doc.roundedRect(x, y, kpiW, 18, 1, 1, 'S');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(14); doc.setTextColor(...C.navy);
    doc.text(val, x + kpiW / 2, y + 9, { align: 'center' });
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(6.5); doc.setTextColor(...C.mid);
    doc.text(label, x + kpiW / 2, y + 14.5, { align: 'center' });
  });
  y += 24; doc.setTextColor(...C.dark);

  // ═══ SECTION: Scope ═══
  newPage();
  heading(lang === 'de' ? '2  Gegenstand der Prüfung' : '2  Scope of Assessment');
  field(l('entity', lang), intakeData.entityName);
  field(l('entityType', lang), entityTypeName);
  field(l('criticality', lang), criticalityName);
  if (intakeData.description) bodyParagraph(intakeData.description);
  if (intakeData.infrastructure.length > 0) field(lang === 'de' ? 'Infrastruktur' : 'Infrastructure', intakeData.infrastructure.join(', '));
  if (intakeData.supplyChainProviders.length > 0) field(lang === 'de' ? 'Lieferanten' : 'Suppliers', intakeData.supplyChainProviders.join(', '));
  if (intakeData.roles.length > 0) field(lang === 'de' ? 'Rollen' : 'Roles', intakeData.roles.join(', '));
  if (intakeData.knownIssues) { heading(lang === 'de' ? '2.1  Bekannte Schwachstellen' : '2.1  Known Weaknesses', 2); bodyParagraph(intakeData.knownIssues); }

  // ═══ SECTION: Risks ═══
  newPage();
  heading(lang === 'de' ? '3  Feststellungen — Risikolandschaft' : '3  Findings — Risk Landscape');
  risks.forEach(ri => {
    checkSpace(50);
    const score = ri.likelihood * ri.impact;
    const sev = score >= 20 ? (lang === 'de' ? 'KRITISCH' : 'CRITICAL') : score >= 13 ? (lang === 'de' ? 'HOCH' : 'HIGH') : score >= 6 ? (lang === 'de' ? 'MITTEL' : 'MEDIUM') : (lang === 'de' ? 'NIEDRIG' : 'LOW');
    heading(`${l('finding', lang)} ${riskId(ri)}: ${ri.name}`, 3);
    doc.setFontSize(7); doc.setFont(HEAD_FONT, 'normal'); doc.setTextColor(...C.mid);
    const meta = `${RISK_CATEGORIES[ri.category]?.label[lang] || ri.category}  |  ${sev}  |  ${ri.nis2Ref}  |  ${lang === 'de' ? 'Evidenz' : 'Evidence'}: ${ri.evidenceQuality}/5`;
    const metaLines = doc.splitTextToSize(meta, WIDTH); doc.text(metaLines, LEFT, y); y += metaLines.length * 3.2 + 2; doc.setTextColor(...C.dark);

    const scoreText = `${l('riskScore', lang)}: ${ri.likelihood} × ${ri.impact} = ${score} (${sev})`;
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8);
    const sLines = doc.splitTextToSize(scoreText, WIDTH - 8);
    const sBarH = Math.max(7, sLines.length * 4 + 3);
    checkSpace(sBarH + 3);
    doc.setFillColor(...C.bg); doc.roundedRect(LEFT, y - 1, WIDTH, sBarH, 0.8, 0.8, 'F');
    doc.setTextColor(...C.navy); doc.text(sLines, LEFT + 4, y + 3); doc.setTextColor(...C.dark);
    y += sBarH + 3;

    fieldInline(l('component', lang), ri.component);
    fieldInline(l('attacker', lang), ri.attacker);
    fieldInline(l('attackPath', lang), ri.path);
    y += 2;
    bodyText(`${l('evidence', lang)}: ${ri.evidence}`, 0);
    bodyText(`${l('rationale', lang)}: ${ri.rationale}`, 0);
    if (ri.sources.length > 0) bodyText(`${l('sources', lang)}: ${ri.sources.join('; ')}`, 0);
    separator();
  });

  // ═══ SECTION: Requirements ═══
  newPage();
  heading(lang === 'de' ? '4  NIS-2-Konformitätslücken' : '4  NIS-2 Compliance Gaps');
  reqs.forEach(r => {
    checkSpace(42);
    const statusMarker = r.status === 'pass' ? 'PASS' : r.status === 'partial' ? 'PARTIAL' : 'FAIL';
    heading(`${r.id}: ${r.name}`, 3);
    checkSpace(8);
    const badgeColor: [number, number, number] = r.status === 'pass' ? [34, 120, 70] : r.status === 'partial' ? [180, 130, 20] : [180, 45, 45];
    doc.setFillColor(...badgeColor);
    const badgeW = doc.getTextWidth(statusMarker) * 1.6 + 6;
    doc.roundedRect(LEFT, y - 3, badgeW, 5.5, 0.8, 0.8, 'F');
    doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(6.5); doc.setTextColor(...C.white);
    doc.text(statusMarker, LEFT + 3, y);
    doc.setFont(HEAD_FONT, 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.mid);
    doc.text(r.article, LEFT + badgeW + 4, y); y += 6; doc.setTextColor(...C.dark);

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

  // ═══ SECTION: Recommendations ═══
  newPage();
  heading(lang === 'de' ? '5  Handlungsempfehlungen' : '5  Recommendations');
  for (const prio of ['P0', 'P1', 'P2', 'P3']) {
    const prioReqs = reqs.filter(r => r.priority === prio);
    if (prioReqs.length === 0) continue;
    const prioLabel: Record<string, string> = { P0: lang === 'de' ? 'P0 — Sofort' : 'P0 — Immediate', P1: lang === 'de' ? 'P1 — 3 Monate' : 'P1 — 3 months', P2: lang === 'de' ? 'P2 — 6 Monate' : 'P2 — 6 months', P3: lang === 'de' ? 'P3 — Empfohlen' : 'P3 — Recommended' };
    heading(prioLabel[prio] || prio, 2);
    prioReqs.forEach(r => {
      checkSpace(20);
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(9); doc.setTextColor(...C.navy);
      doc.text(`[${r.id}: ${r.name}]`, LEFT + 4, y); doc.setFont(BODY_FONT, 'normal'); doc.setTextColor(...C.dark); y += 6;
      if (r.measure) bodyText(r.measure, 4);
      if (r.effort) fieldInline(l('effort', lang), r.effort, 4);
      y += 3;
    });
  }

  // ═══ SECTION: QA ═══
  if (data.qaChecks && data.qaChecks.length > 0) {
    newPage();
    heading(lang === 'de' ? '6  Qualitätssicherung' : '6  Quality Assurance');
    const passedQa = data.qaChecks.filter(c => c.passed).length;
    bodyText(`${lang === 'de' ? 'Ergebnis' : 'Result'}: ${passedQa === data.qaChecks.length ? 'PASSED' : `${passedQa}/${data.qaChecks.length}`}`, 0);
    if (data.qaIterations) bodyText(`${lang === 'de' ? 'Durchläufe' : 'Iterations'}: ${data.qaIterations}`, 0);
    separator();

    const categories = ['consistency', 'technical', 'evidence', 'editorial', 'regulatory', 'golden-rule'];
    const catLabels: Record<string, Record<string, string>> = {
      consistency: { de: 'Konsistenzprüfung', en: 'Consistency' }, technical: { de: 'Fachliche Korrektheit', en: 'Technical' },
      evidence: { de: 'Evidenzprüfung', en: 'Evidence' }, editorial: { de: 'Redaktionell', en: 'Editorial' },
      regulatory: { de: 'Regulatorisch', en: 'Regulatory' }, 'golden-rule': { de: 'Goldene Regeln', en: 'Golden Rules' },
    };
    categories.forEach(cat => {
      const catChecks = data.qaChecks!.filter(c => c.category === cat);
      if (catChecks.length === 0) return;
      checkSpace(15);
      doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(8.5); doc.setTextColor(...C.navy);
      doc.text(catLabels[cat]?.[lang] || cat, LEFT, y); y += 5;
      catChecks.forEach(c => {
        checkSpace(10);
        const badgeCol: [number, number, number] = c.passed ? [34, 120, 70] : [180, 45, 45];
        doc.setFillColor(...badgeCol); doc.roundedRect(LEFT, y - 3, 14, 5, 0.6, 0.6, 'F');
        doc.setFont(HEAD_FONT, 'bold'); doc.setFontSize(6); doc.setTextColor(...C.white);
        doc.text(c.passed ? 'PASS' : 'FAIL', LEFT + 2.5, y);
        doc.setFont(BODY_FONT, 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.dark);
        const detail = `${c.id}: ${c.label}`;
        const dLines = doc.splitTextToSize(detail, WIDTH - 20);
        doc.text(dLines, LEFT + 18, y); y += dLines.length * 3.5 + 2;
      });
      y += 3;
    });
  }

  if (data.fixLog && data.fixLog.length > 0) {
    heading(lang === 'de' ? '6.1  Automatisierte Korrekturen' : '6.1  Automated Corrections', 2);
    data.fixLog.forEach((fix, i) => {
      checkSpace(8);
      doc.setFontSize(8); doc.setFont(BODY_FONT, 'normal');
      const fLines = doc.splitTextToSize(`${i + 1}. ${fix}`, WIDTH - 8);
      doc.text(fLines, LEFT + 4, y); y += fLines.length * 3.5 + 2;
    });
  }

  // ═══ DISCLAIMER ═══
  y += 5;
  heading(lang === 'de' ? '7  Einschränkungen und Haftungsausschluss' : '7  Limitations and Disclaimer');
  bodyParagraph(lang === 'de'
    ? 'Dieser Bericht basiert auf den Informationen zum Prüfungszeitpunkt. Er ersetzt keine offizielle Prüfung durch BSI oder eine andere zuständige Behörde. Für Vollständigkeit und Richtigkeit wird keine Haftung übernommen. Der Bericht ist vertraulich.'
    : 'This report is based on information available at the time of assessment. It does not replace an official audit by the competent authority. No liability is assumed. The report is confidential.');

  // ═══ SAVE ═══
  const suffix = isDraft ? 'DRAFT' : 'FINAL';
  doc.save(`NIS2_Assessment_${intakeData.entityName.replace(/\s+/g, '_')}_${suffix}.pdf`);
}
