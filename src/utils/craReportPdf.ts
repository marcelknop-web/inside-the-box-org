import jsPDF from 'jspdf';
import type { IntakeData, Threat, CraReq } from '@/data/craData';
import { threatId } from '@/data/craData';

export interface CraReportData {
  intakeData: IntakeData;
  threats: Threat[];
  reqs: CraReq[];
  language: 'de' | 'en' | 'fr';
  productTypeName: string;
  craClassName: string;
}

/* ────── I18N ────── */
const I18N = {
  title: { de: 'Cyber Risk Assessment Report', en: 'Cyber Risk Assessment Report', fr: 'Rapport d\'évaluation des cyber-risques' },
  subtitle: { de: 'CRA-Konformitätsbewertung', en: 'CRA Compliance Assessment', fr: 'Évaluation de conformité CRA' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  reportId: { de: 'Report-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  of: { de: 'von', en: 'of', fr: 'de' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  sec1: { de: '1  Executive Summary', en: '1  Executive Summary', fr: '1  Résumé exécutif' },
  sec2: { de: '2  Produktinformationen', en: '2  Product Information', fr: '2  Informations produit' },
  sec3: { de: '3  Bedrohungsanalyse (STRIDE)', en: '3  Threat Analysis (STRIDE)', fr: '3  Analyse des menaces (STRIDE)' },
  sec4: { de: '4  Kritische Risiken', en: '4  Critical Risks', fr: '4  Risques critiques' },
  sec5: { de: '5  CRA-Anforderungen', en: '5  CRA Requirements', fr: '5  Exigences CRA' },
  sec6: { de: '6  Sofortmaßnahmen', en: '6  Immediate Actions', fr: '6  Actions immédiates' },
  sec7: { de: '7  Methodik & Referenzen', en: '7  Methodology & References', fr: '7  Méthodologie & références' },
  sec8: { de: '8  Haftungsausschluss', en: '8  Disclaimer', fr: '8  Avertissement' },
  product: { de: 'Produkt', en: 'Product', fr: 'Produit' },
  version: { de: 'Version', en: 'Version', fr: 'Version' },
  type: { de: 'Typ', en: 'Type', fr: 'Type' },
  craClass: { de: 'CRA-Klasse', en: 'CRA Class', fr: 'Classe CRA' },
  deployment: { de: 'Deployment', en: 'Deployment', fr: 'Déploiement' },
  interfaces: { de: 'Schnittstellen', en: 'Interfaces', fr: 'Interfaces' },
  components: { de: 'Komponenten', en: 'Components', fr: 'Composants' },
  roles: { de: 'Rollen', en: 'Roles', fr: 'Rôles' },
  measures: { de: 'Sicherheitsmaßnahmen', en: 'Security Measures', fr: 'Mesures de sécurité' },
  knownIssues: { de: 'Bekannte Probleme', en: 'Known Issues', fr: 'Problèmes connus' },
  threat: { de: 'Bedrohung', en: 'Threat', fr: 'Menace' },
  component: { de: 'Komponente', en: 'Component', fr: 'Composant' },
  attacker: { de: 'Angreifer', en: 'Attacker', fr: 'Attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Path', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Evidenz', en: 'Evidence', fr: 'Preuves' },
  rationale: { de: 'Begründung', en: 'Rationale', fr: 'Justification' },
  riskScore: { de: 'Risikoscore', en: 'Risk Score', fr: 'Score de risque' },
  likelihood: { de: 'Eintrittswahrscheinlichkeit', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Status', en: 'Status', fr: 'Statut' },
  gap: { de: 'Lücke', en: 'Gap', fr: 'Lacune' },
  measure: { de: 'Maßnahme', en: 'Measure', fr: 'Mesure' },
  dod: { de: 'Definition of Done', en: 'Definition of Done', fr: 'Critères d\'acceptation' },
  pass: { de: 'Erfüllt', en: 'Pass', fr: 'Conforme' },
  partial: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' },
  fail: { de: 'Nicht erfüllt', en: 'Fail', fr: 'Non conforme' },
  totalThreats: { de: 'Bedrohungen gesamt', en: 'Total Threats', fr: 'Menaces totales' },
  criticalRisks: { de: 'Kritische Risiken (≥ 20)', en: 'Critical Risks (≥ 20)', fr: 'Risques critiques (≥ 20)' },
  craGaps: { de: 'CRA-Lücken (Fail)', en: 'CRA Gaps (Fail)', fr: 'Lacunes CRA (Échec)' },
  partialGaps: { de: 'Teilerfüllung', en: 'Partial', fr: 'Partiel' },
  methodology: {
    de: `Dieses Assessment basiert auf dem STRIDE-Bedrohungsmodell (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) und den Anforderungen des EU Cyber Resilience Act (CRA).

Risikobewertung: Jede Bedrohung wird mit Eintrittswahrscheinlichkeit (1–5) × Auswirkung (1–5) bewertet. Scores ≥ 20 gelten als kritisch.

Konformitätsprüfung: CRA-Anforderungen aus Annex I (Sicherheitseigenschaften) und Annex II (Schwachstellenbehandlung) sowie Art. 13/14 werden gegen die vorhandenen Maßnahmen geprüft.

Referenzen:
  • EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847
  • STRIDE Threat Model — Microsoft Security Development Lifecycle
  • OWASP IoT Top 10 / OWASP API Security Top 10
  • ETSI EN 303 645 — Cyber Security for Consumer IoT
  • NIST SP 800-82r3 — Guide to OT Security`,
    en: `This assessment is based on the STRIDE threat model (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) and the requirements of the EU Cyber Resilience Act (CRA).

Risk Assessment: Each threat is scored as Likelihood (1–5) × Impact (1–5). Scores ≥ 20 are classified as critical.

Compliance Review: CRA requirements from Annex I (security properties) and Annex II (vulnerability handling) as well as Art. 13/14 are evaluated against implemented measures.

References:
  • EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847
  • STRIDE Threat Model — Microsoft Security Development Lifecycle
  • OWASP IoT Top 10 / OWASP API Security Top 10
  • ETSI EN 303 645 — Cyber Security for Consumer IoT
  • NIST SP 800-82r3 — Guide to OT Security`,
    fr: `Cette évaluation est basée sur le modèle de menaces STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) et les exigences du Cyber Resilience Act (CRA) européen.

Évaluation des risques : Chaque menace est notée Probabilité (1–5) × Impact (1–5). Les scores ≥ 20 sont classés comme critiques.

Revue de conformité : Les exigences CRA de l'Annexe I (propriétés de sécurité) et de l'Annexe II (gestion des vulnérabilités) ainsi que les Art. 13/14 sont évaluées par rapport aux mesures implémentées.

Références :
  • EU Cyber Resilience Act (CRA) — Règlement (UE) 2024/2847
  • STRIDE Threat Model — Microsoft Security Development Lifecycle
  • OWASP IoT Top 10 / OWASP API Security Top 10
  • ETSI EN 303 645 — Cyber Security for Consumer IoT
  • NIST SP 800-82r3 — Guide to OT Security`,
  },
  disclaimer: {
    de: 'Dieses Dokument wurde automatisch generiert und ersetzt keine offizielle Sicherheitsberatung oder ein akkreditiertes Audit. Die Bewertung basiert auf den zum Zeitpunkt der Erstellung gültigen Anforderungen des EU Cyber Resilience Act. Für verbindliche Auskünfte wenden Sie sich bitte an einen qualifizierten Cybersecurity-Berater.',
    en: 'This document was automatically generated and does not replace official security consulting or an accredited audit. The assessment is based on the EU Cyber Resilience Act requirements valid at the time of generation. For binding information, please consult a qualified cybersecurity advisor.',
    fr: 'Ce document a été généré automatiquement et ne remplace pas un conseil de sécurité officiel ou un audit accrédité. L\'évaluation est basée sur les exigences du Cyber Resilience Act européen valides au moment de la génération. Pour des informations contraignantes, veuillez consulter un conseiller en cybersécurité qualifié.',
  },
};

/* ────── Colors ────── */
const C = {
  darkNavy: [15, 23, 42] as [number, number, number],
  accent: [0, 188, 212] as [number, number, number],
  bodyText: [71, 85, 105] as [number, number, number],
  lightGray: [148, 163, 184] as [number, number, number],
  ruleStroke: [203, 213, 225] as [number, number, number],
  bgLight: [241, 245, 249] as [number, number, number],
  bgRed: [254, 226, 226] as [number, number, number],
  bgYellow: [254, 249, 195] as [number, number, number],
  bgGreen: [220, 252, 231] as [number, number, number],
  redText: [185, 28, 28] as [number, number, number],
  orangeText: [194, 65, 12] as [number, number, number],
  greenText: [21, 128, 61] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ────── Generator ────── */

export function generateCraReport(data: CraReportData): void {
  const { intakeData, threats, reqs, language, productTypeName, craClassName } = data;
  const lang = language;
  const t = (o: Record<string, string>) => o[lang] || o.en;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 20, MR = 20, CW = W - ML - MR;

  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const failReqs = reqs.filter(r => r.status === 'fail');
  const partialReqs = reqs.filter(r => r.status === 'partial');

  const locale = lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const reportId = `CRA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  let y = 0;
  let pageNum = 0;

  function addFooter() {
    pageNum++;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text(`${t(I18N.page)} ${pageNum}`, W / 2, H - 8, { align: 'center' });
    doc.text(t(I18N.confidential), W - MR, H - 8, { align: 'right' });
    doc.text(reportId, ML, H - 8);
  }

  function checkPage(need: number = 20) {
    if (y > H - 25 - need) {
      addFooter();
      doc.addPage();
      y = 25;
    }
  }

  function writeSectionHeading(text: string) {
    checkPage(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 3;
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.8);
    doc.line(ML, y, ML + 45, y);
    y += 10;
  }

  function writeSubHeading(text: string) {
    checkPage(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 7;
  }

  function writeBody(text: string, maxW: number = CW) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.bodyText);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, ML, y);
      y += 4.5;
    }
  }

  function writeKV(label: string, value: string, indent: number = 0) {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.darkNavy);
    doc.text(label + ':', ML + indent, y);
    const labelW = doc.getTextWidth(label + ': ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.bodyText);
    const valLines = doc.splitTextToSize(value, CW - labelW - indent - 5);
    doc.text(valLines, ML + indent + labelW, y);
    y += Math.max(valLines.length * 4.5, 5);
  }

  // ══════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════
  doc.setFillColor(...C.darkNavy);
  doc.rect(0, 0, W, 85, 'F');

  // Accent bar
  doc.setFillColor(...C.accent);
  doc.rect(0, 85, W, 3, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.text(t(I18N.title), ML, 40);

  doc.setFontSize(12);
  doc.setTextColor(...C.accent);
  doc.text(t(I18N.subtitle), ML, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(200, 210, 220);
  doc.text(`${intakeData.productName} ${intakeData.version}`, ML, 68);

  // Cover info box
  y = 105;
  doc.setFillColor(...C.bgLight);
  doc.roundedRect(ML, y, CW, 55, 2, 2, 'F');
  doc.setDrawColor(...C.ruleStroke);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 55, 2, 2, 'S');

  const mx = ML + 8;
  y += 10;
  const kvPairs: [string, string][] = [
    [t(I18N.reportId), reportId],
    [t(I18N.generated), dateStr],
    [t(I18N.product), `${intakeData.productName} ${intakeData.version}`],
    [t(I18N.type), productTypeName],
    [t(I18N.craClass), craClassName],
  ];
  for (const [k, v] of kvPairs) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.darkNavy);
    doc.text(k, mx, y);
    doc.setFont('helvetica', 'normal');
    doc.text(v, mx + 50, y);
    y += 8;
  }

  // Summary stats
  y = 180;
  const statW = CW / 3;
  const stats: [string, number, [number, number, number]][] = [
    [t(I18N.totalThreats), threats.length, C.darkNavy],
    [t(I18N.criticalRisks), critRisks.length, C.redText],
    [t(I18N.craGaps), failReqs.length, C.redText],
  ];
  for (let i = 0; i < stats.length; i++) {
    const sx = ML + i * statW;
    const fillC = i === 0 ? C.bgLight : C.bgRed;
    doc.setFillColor(...fillC);
    doc.roundedRect(sx + 2, y, statW - 4, 28, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...stats[i][2]);
    doc.text(String(stats[i][1]), sx + statW / 2, y + 14, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...C.bodyText);
    doc.text(stats[i][0], sx + statW / 2, y + 22, { align: 'center' });
  }

  // Confidential
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.lightGray);
  doc.text(t(I18N.confidential), W - MR, H - 15, { align: 'right' });

  // Bottom bar
  doc.setFillColor(...C.darkNavy);
  doc.rect(0, H - 6, W, 6, 'F');

  // ══════════════════════════════════════
  // TOC
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...C.darkNavy);
  doc.text(t(I18N.toc), ML, y);
  y += 4;
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + 50, y);
  y += 12;

  const tocItems = [I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4, I18N.sec5, I18N.sec6, I18N.sec7, I18N.sec8];
  for (const item of tocItems) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.bodyText);
    doc.text(t(item), ML + 4, y);
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineDashPattern([0.5, 1.5], 0);
    doc.setLineWidth(0.15);
    const tw = doc.getTextWidth(t(item));
    doc.line(ML + 8 + tw, y - 0.5, W - MR, y - 0.5);
    doc.setLineDashPattern([], 0);
    y += 8;
  }

  // ══════════════════════════════════════
  // SECTION 1: Executive Summary
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 25;

  writeSectionHeading(t(I18N.sec1));

  const summaryText = lang === 'de'
    ? `Das Cyber Risk Assessment für ${intakeData.productName} ${intakeData.version} (${productTypeName}, CRA-Klasse: ${craClassName}) wurde am ${dateStr} durchgeführt. Es wurden ${threats.length} Bedrohungen nach dem STRIDE-Modell identifiziert, davon ${critRisks.length} mit kritischem Risikoscore (≥ 20). Von ${reqs.length} geprüften CRA-Anforderungen bestehen ${failReqs.length} vollständige Lücken und ${partialReqs.length} teilweise Erfüllungen.`
    : lang === 'fr'
    ? `L'évaluation des cyber-risques pour ${intakeData.productName} ${intakeData.version} (${productTypeName}, classe CRA : ${craClassName}) a été réalisée le ${dateStr}. ${threats.length} menaces ont été identifiées selon le modèle STRIDE, dont ${critRisks.length} avec un score de risque critique (≥ 20). Sur ${reqs.length} exigences CRA examinées, ${failReqs.length} lacunes complètes et ${partialReqs.length} conformités partielles ont été constatées.`
    : `The Cyber Risk Assessment for ${intakeData.productName} ${intakeData.version} (${productTypeName}, CRA class: ${craClassName}) was conducted on ${dateStr}. ${threats.length} threats were identified using the STRIDE model, of which ${critRisks.length} have a critical risk score (≥ 20). Of ${reqs.length} CRA requirements reviewed, ${failReqs.length} full gaps and ${partialReqs.length} partial fulfillments were found.`;

  writeBody(summaryText);
  y += 5;

  // Stats boxes
  const allStats: [string, number, [number, number, number], [number, number, number]][] = [
    [t(I18N.totalThreats), threats.length, C.bgLight, C.darkNavy],
    [t(I18N.criticalRisks), critRisks.length, C.bgRed, C.redText],
    [t(I18N.craGaps), failReqs.length, C.bgRed, C.redText],
    [t(I18N.partialGaps), partialReqs.length, C.bgYellow, C.orangeText],
  ];

  const bw = (CW - 12) / 4;
  for (let i = 0; i < allStats.length; i++) {
    const bx = ML + i * (bw + 4);
    doc.setFillColor(...allStats[i][2]);
    doc.roundedRect(bx, y, bw, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...allStats[i][3]);
    doc.text(String(allStats[i][1]), bx + bw / 2, y + 11, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(...C.bodyText);
    const lbl = doc.splitTextToSize(allStats[i][0], bw - 4);
    doc.text(lbl, bx + bw / 2, y + 17, { align: 'center' });
  }
  y += 30;

  // ══════════════════════════════════════
  // SECTION 2: Product Information
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec2));

  writeKV(t(I18N.product), `${intakeData.productName} ${intakeData.version}`);
  writeKV(t(I18N.type), productTypeName);
  writeKV(t(I18N.craClass), craClassName);
  writeKV(t(I18N.deployment), intakeData.deployment || '—');
  writeKV(t(I18N.interfaces), intakeData.interfaces.join(', ') || '—');
  writeKV(t(I18N.components), intakeData.components.join(', ') || '—');
  writeKV(t(I18N.roles), intakeData.roles.join(', ') || '—');

  if (intakeData.knownIssues) {
    y += 3;
    writeKV(t(I18N.knownIssues), intakeData.knownIssues);
  }

  // Measures summary
  const measureKeys = Object.keys(intakeData.measures);
  if (measureKeys.length > 0) {
    y += 3;
    writeSubHeading(t(I18N.measures));
    for (const key of measureKeys) {
      const m = intakeData.measures[key];
      const statusParts: string[] = [];
      if (m.active) statusParts.push('Active');
      if (m.documented) statusParts.push('Documented');
      if (m.audited) statusParts.push('Audited');
      writeKV(key.toUpperCase(), statusParts.join(' / ') || '—', 4);
    }
  }

  y += 5;

  // ══════════════════════════════════════
  // SECTION 3: Threat Analysis
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 25;
  writeSectionHeading(t(I18N.sec3));

  for (const th of threats) {
    checkPage(50);
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const isCrit = score >= 20;

    // Threat header
    const threatBg = isCrit ? C.bgRed : C.bgLight;
    doc.setFillColor(...threatBg);
    doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
    if (isCrit) {
      doc.setDrawColor(...C.redText);
      doc.setLineWidth(0.4);
      doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'S');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const threatTextC = isCrit ? C.redText : C.darkNavy;
    doc.setTextColor(...threatTextC);
    doc.text(`${tid}  ${th.name}`, ML + 4, y + 5.5);

    const scoreText = `${th.likelihood}×${th.impact}=${score}`;
    doc.text(scoreText, W - MR - 4, y + 5.5, { align: 'right' });
    y += 12;

    writeKV(t(I18N.component), th.component, 4);
    writeKV(t(I18N.attacker), th.attacker, 4);
    writeKV(t(I18N.attackPath), th.path, 4);
    writeKV(t(I18N.evidence), th.evidence, 4);
    writeKV(t(I18N.rationale), th.rationale, 4);

    // Sources
    if (th.sources.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.lightGray);
      for (const src of th.sources) {
        checkPage(5);
        doc.text(`  • ${src}`, ML + 4, y);
        y += 4;
      }
    }
    y += 5;

    // Rule after each threat
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML, y, W - MR, y);
    y += 5;
  }

  // ══════════════════════════════════════
  // SECTION 4: Critical Risks
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 25;
  writeSectionHeading(t(I18N.sec4));

  if (critRisks.length === 0) {
    writeBody(lang === 'de' ? 'Keine kritischen Risiken identifiziert.' : lang === 'fr' ? 'Aucun risque critique identifié.' : 'No critical risks identified.');
  } else {
    // Table header
    const cols = [15, 80, 25, 25, 25];
    const cx = [ML, ML + cols[0], ML + cols[0] + cols[1], ML + cols[0] + cols[1] + cols[2], ML + cols[0] + cols[1] + cols[2] + cols[3]];
    doc.setFillColor(...C.darkNavy);
    doc.rect(ML, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.text('ID', cx[0] + 2, y + 5);
    doc.text(t(I18N.threat), cx[1] + 2, y + 5);
    doc.text(t(I18N.likelihood), cx[2] + 2, y + 5);
    doc.text(t(I18N.impact), cx[3] + 2, y + 5);
    doc.text(t(I18N.riskScore), cx[4] + 2, y + 5);
    y += 9;

    for (const th of critRisks) {
      checkPage(8);
      doc.setFillColor(...C.bgRed);
      doc.rect(ML, y - 3, CW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.redText);
      doc.text(threatId(th), cx[0] + 2, y + 1.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.darkNavy);
      const nameLines = doc.splitTextToSize(th.name, cols[1] - 4);
      doc.text(nameLines[0], cx[1] + 2, y + 1.5);
      doc.text(String(th.likelihood), cx[2] + 2, y + 1.5);
      doc.text(String(th.impact), cx[3] + 2, y + 1.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.redText);
      doc.text(String(th.likelihood * th.impact), cx[4] + 2, y + 1.5);
      y += 8;
    }
  }
  y += 5;

  // ══════════════════════════════════════
  // SECTION 5: CRA Requirements
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 25;
  writeSectionHeading(t(I18N.sec5));

  for (const req of reqs) {
    checkPage(45);
    const statusColor = req.status === 'pass' ? C.greenText : req.status === 'partial' ? C.orangeText : C.redText;
    const statusBg = req.status === 'pass' ? C.bgGreen : req.status === 'partial' ? C.bgYellow : C.bgRed;
    const statusLabel = req.status === 'pass' ? t(I18N.pass) : req.status === 'partial' ? t(I18N.partial) : t(I18N.fail);

    // Req header
    doc.setFillColor(...statusBg);
    doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...statusColor);
    doc.text(`${req.id}  ${req.name}`, ML + 4, y + 5.5);
    doc.text(statusLabel, W - MR - 4, y + 5.5, { align: 'right' });
    y += 12;

    doc.setFontSize(7.5);
    doc.setTextColor(...C.lightGray);
    doc.text(req.article, ML + 4, y);
    y += 5;

    writeKV(t(I18N.gap), req.gap, 4);
    writeKV(t(I18N.evidence), req.evidence, 4);
    writeKV(t(I18N.rationale), req.rationale, 4);
    writeKV(t(I18N.measure), req.measure, 4);

    // Definition of Done
    if (req.criteria.length > 0) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.accent);
      doc.text(t(I18N.dod), ML + 4, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.bodyText);
      for (const c of req.criteria) {
        checkPage(6);
        const cLines = doc.splitTextToSize(`☐  ${c}`, CW - 12);
        doc.text(cLines, ML + 8, y);
        y += cLines.length * 3.8;
      }
    }

    y += 4;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML, y, W - MR, y);
    y += 5;
  }

  // ══════════════════════════════════════
  // SECTION 6: Immediate Actions
  // ══════════════════════════════════════
  addFooter();
  doc.addPage();
  y = 25;
  writeSectionHeading(t(I18N.sec6));

  if (failReqs.length === 0) {
    writeBody(lang === 'de' ? 'Keine sofortigen Maßnahmen erforderlich.' : lang === 'fr' ? 'Aucune action immédiate requise.' : 'No immediate actions required.');
  } else {
    for (let i = 0; i < failReqs.length; i++) {
      checkPage(20);
      const r = failReqs[i];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...C.redText);
      doc.text(`${i + 1}.`, ML, y);
      doc.setTextColor(...C.darkNavy);
      doc.text(r.name, ML + 8, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.bodyText);
      const mLines = doc.splitTextToSize(r.measure, CW - 12);
      doc.text(mLines, ML + 8, y);
      y += mLines.length * 4.5 + 4;
    }
  }

  // ══════════════════════════════════════
  // SECTION 7: Methodology & References
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec7));
  writeBody(t(I18N.methodology));
  y += 8;

  // ══════════════════════════════════════
  // SECTION 8: Disclaimer
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec8));
  writeBody(t(I18N.disclaimer));

  // Final footer
  addFooter();

  // Save
  doc.save(`CRA-Report_${intakeData.productName.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
