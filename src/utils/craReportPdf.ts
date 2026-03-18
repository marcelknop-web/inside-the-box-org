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
  title: { de: 'Cyber Risk Assessment', en: 'Cyber Risk Assessment', fr: 'Évaluation des cyber-risques' },
  subtitle: { de: 'Prüfbericht nach EU Cyber Resilience Act', en: 'Assessment Report per EU Cyber Resilience Act', fr: 'Rapport d\'évaluation selon le Cyber Resilience Act' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },

  sec1: { de: '1  Ausgangslage und Zielsetzung', en: '1  Context and Objectives', fr: '1  Contexte et objectifs' },
  sec2: { de: '2  Zusammenfassung für die Geschäftsleitung', en: '2  Management Summary', fr: '2  Synthèse pour la direction' },
  sec3: { de: '3  Gegenstand der Prüfung', en: '3  Scope of Assessment', fr: '3  Périmètre de l\'évaluation' },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Detailed Findings', fr: '4  Constatations détaillées' },
  sec4a: { de: '4.1  Bedrohungslandschaft (STRIDE-Analyse)', en: '4.1  Threat Landscape (STRIDE Analysis)', fr: '4.1  Paysage des menaces (analyse STRIDE)' },
  sec4b: { de: '4.2  CRA-Konformitätslücken', en: '4.2  CRA Compliance Gaps', fr: '4.2  Lacunes de conformité CRA' },
  sec5: { de: '5  Handlungsempfehlungen', en: '5  Recommendations', fr: '5  Recommandations' },
  sec6: { de: '6  Methodik und Prüfungsgrundlagen', en: '6  Methodology and Audit Standards', fr: '6  Méthodologie et normes d\'audit' },
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limitations et avertissement' },

  product: { de: 'Produkt', en: 'Product', fr: 'Produit' },
  version: { de: 'Version', en: 'Version', fr: 'Version' },
  type: { de: 'Produkttyp', en: 'Product Type', fr: 'Type de produit' },
  craClass: { de: 'CRA-Klasse', en: 'CRA Class', fr: 'Classe CRA' },
  deployment: { de: 'Betriebsmodell', en: 'Deployment Model', fr: 'Modèle de déploiement' },
  interfaces: { de: 'Kommunikationsschnittstellen', en: 'Communication Interfaces', fr: 'Interfaces de communication' },
  components: { de: 'Systemkomponenten', en: 'System Components', fr: 'Composants du système' },
  roles: { de: 'Benutzerrollen', en: 'User Roles', fr: 'Rôles utilisateur' },
  measures: { de: 'Implementierte Maßnahmen', en: 'Implemented Measures', fr: 'Mesures implémentées' },
  knownIssues: { de: 'Vom Hersteller benannte Probleme', en: 'Manufacturer-Reported Issues', fr: 'Problèmes signalés par le fabricant' },

  threat: { de: 'Bedrohung', en: 'Threat', fr: 'Menace' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerné' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil de l\'attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Preuves collectées' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Base d\'évaluation' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Évaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Évaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart constaté' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Action recommandée' },
  dod: { de: 'Nachweisbare Umsetzungskriterien', en: 'Verifiable Acceptance Criteria', fr: 'Critères de vérification' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Références' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevée' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyenne' },

  totalThreats: { de: 'Bedrohungen', en: 'Threats', fr: 'Menaces' },
  criticalRisks: { de: 'Kritisch (≥ 20)', en: 'Critical (≥ 20)', fr: 'Critiques (≥ 20)' },
  craGaps: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conformes' },
  partialGaps: { de: 'Teilw. konform', en: 'Partial', fr: 'Partiels' },
};

/* ────── Prose blocks ────── */
function getContextText(p: string, v: string, typeName: string, cls: string, date: string, lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Cyber-Risikobewertung für das Produkt ${p} ${v} (${typeName}, CRA-Klasse: ${cls}). Die Prüfung wurde am ${date} durchgeführt.

Zielsetzung war die systematische Identifikation von Bedrohungen nach dem STRIDE-Modell sowie die Bewertung der Konformität mit den wesentlichen Anforderungen des EU Cyber Resilience Act (Verordnung (EU) 2024/2847). Der Bericht richtet sich an die Geschäftsleitung, das Produktmanagement und die für Informationssicherheit verantwortlichen Stellen.

Die Bewertung umfasst sowohl eine technische Bedrohungsanalyse als auch eine regulatorische Konformitätsprüfung gegen die Anforderungen aus Annex I (Sicherheitseigenschaften), Annex II (Schwachstellenbehandlung) sowie den Artikeln 13 und 14 des CRA.`;
  if (lang === 'fr') return `Le présent rapport documente les résultats d'une évaluation structurée des cyber-risques pour le produit ${p} ${v} (${typeName}, classe CRA : ${cls}). L'évaluation a été réalisée le ${date}.

L'objectif était l'identification systématique des menaces selon le modèle STRIDE ainsi que l'évaluation de la conformité aux exigences essentielles du Cyber Resilience Act européen (Règlement (UE) 2024/2847). Ce rapport s'adresse à la direction, au management produit et aux responsables de la sécurité de l'information.

L'évaluation couvre à la fois une analyse technique des menaces et une vérification de conformité réglementaire contre les exigences de l'Annexe I, l'Annexe II ainsi que les Articles 13 et 14 du CRA.`;
  return `This report documents the results of a structured cyber risk assessment for the product ${p} ${v} (${typeName}, CRA class: ${cls}). The assessment was conducted on ${date}.

The objective was the systematic identification of threats using the STRIDE model and the evaluation of compliance with the essential requirements of the EU Cyber Resilience Act (Regulation (EU) 2024/2847). This report is intended for executive management, product management, and information security stakeholders.

The assessment covers both a technical threat analysis and a regulatory compliance review against the requirements of Annex I (security properties), Annex II (vulnerability handling), and Articles 13 and 14 of the CRA.`;
}

function getMgmtSummary(
  p: string, threats: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, lang: string
): string {
  if (lang === 'de') return `Die Prüfung hat ${threats} Bedrohungsszenarien identifiziert und bewertet. Davon weisen ${crit} einen kritischen Risikoscore auf (Eintrittswahrscheinlichkeit × Auswirkung ≥ 20) und erfordern unmittelbares Handeln.

Von ${totalReqs} geprüften CRA-Anforderungen sind ${failReqs} als nicht konform eingestuft. Diese Abweichungen betreffen grundlegende Sicherheitseigenschaften, die vor einer Markteinführung zwingend adressiert werden müssen. Weitere ${partialReqs} Anforderungen sind nur teilweise erfüllt und bedürfen der Nachbesserung.

${crit > 0 ? 'Die identifizierten kritischen Risiken betreffen insbesondere Bereiche, in denen Angreifer mit vertretbarem Aufwand erheblichen Schaden anrichten können. Eine verzögerte Behebung erhöht das Risiko regulatorischer Beanstandungen und potenzieller Haftungsansprüche.' : 'Es wurden keine Bedrohungen mit kritischem Risikoscore identifiziert. Die vorhandenen Maßnahmen adressieren die wesentlichen Angriffsvektoren angemessen.'}

${failReqs > 0 ? 'Handlungsbedarf besteht vor allem bei den in Abschnitt 5 aufgeführten Sofortmaßnahmen. Diese sollten priorisiert und mit klaren Verantwortlichkeiten und Zeitplänen versehen werden.' : 'Die CRA-Anforderungen werden weitgehend erfüllt. Die verbleibenden Teilerfüllungen sollten im Rahmen des regulären Entwicklungsprozesses adressiert werden.'}`;
  if (lang === 'fr') return `L'évaluation a identifié et évalué ${threats} scénarios de menaces. Parmi ceux-ci, ${crit} présentent un score de risque critique (probabilité × impact ≥ 20) et nécessitent une action immédiate.

Sur ${totalReqs} exigences CRA examinées, ${failReqs} sont classées comme non conformes. Ces écarts concernent des propriétés de sécurité fondamentales qui doivent impérativement être corrigées avant la mise sur le marché. ${partialReqs} exigences supplémentaires ne sont que partiellement satisfaites.

${crit > 0 ? 'Les risques critiques identifiés concernent notamment des domaines où un attaquant peut causer des dommages significatifs avec un effort raisonnable.' : 'Aucune menace avec un score de risque critique n\'a été identifiée.'}

${failReqs > 0 ? 'Les actions immédiates détaillées dans la section 5 doivent être priorisées avec des responsabilités et des délais clairs.' : 'Les exigences CRA sont largement satisfaites. Les conformités partielles restantes peuvent être traitées dans le cadre du processus de développement régulier.'}`;
  return `The assessment identified and evaluated ${threats} threat scenarios. Of these, ${crit} carry a critical risk score (likelihood × impact ≥ 20) and require immediate action.

Of ${totalReqs} CRA requirements reviewed, ${failReqs} are rated as non-compliant. These deviations affect fundamental security properties that must be addressed before market entry. An additional ${partialReqs} requirements are only partially fulfilled and require remediation.

${crit > 0 ? 'The identified critical risks particularly affect areas where attackers can cause significant damage with reasonable effort. Delayed remediation increases the risk of regulatory objections and potential liability claims.' : 'No threats with critical risk scores were identified. The existing measures adequately address the primary attack vectors.'}

${failReqs > 0 ? 'Priority action is required on the immediate measures listed in Section 5. These should be assigned clear ownership and timelines.' : 'CRA requirements are largely met. The remaining partial fulfillments should be addressed through the regular development process.'}`;
}

function getMethodology(lang: string): string {
  if (lang === 'de') return `Die Prüfung folgt einem zweistufigen Ansatz:

1. Bedrohungsanalyse nach STRIDE
Systematische Identifikation von Bedrohungsszenarien in den Kategorien Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service und Elevation of Privilege. Jede Bedrohung wird anhand einer 5-stufigen Skala für Eintrittswahrscheinlichkeit und Auswirkung bewertet. Der Risikoscore ergibt sich als Produkt beider Werte; Scores ab 20 gelten als kritisch.

2. Konformitätsprüfung gegen CRA-Anforderungen
Abgleich der implementierten Sicherheitsmaßnahmen mit den Anforderungen aus Annex I (Sicherheitseigenschaften digitaler Produkte), Annex II (Schwachstellenbehandlung) sowie den Meldepflichten nach Art. 14 und der Dokumentationspflicht nach Art. 13 der Verordnung (EU) 2024/2847.

Prüfungsgrundlagen:
  - EU Cyber Resilience Act (CRA) — Verordnung (EU) 2024/2847
  - STRIDE Threat Model — Microsoft Security Development Lifecycle
  - OWASP IoT Top 10 / OWASP API Security Top 10
  - ETSI EN 303 645 — Cyber Security for Consumer IoT
  - NIST SP 800-82r3 — Guide to OT Security
  - ISO/IEC 27001:2022 (als Referenzrahmen)`;
  if (lang === 'fr') return `L'évaluation suit une approche en deux étapes :

1. Analyse des menaces selon STRIDE
Identification systématique des scénarios de menaces dans les catégories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service et Elevation of Privilege. Chaque menace est évaluée sur une échelle de 1 à 5 pour la probabilité et l'impact. Le score de risque est le produit des deux valeurs ; les scores de 20 et plus sont considérés comme critiques.

2. Vérification de conformité CRA
Comparaison des mesures de sécurité implémentées avec les exigences de l'Annexe I, l'Annexe II ainsi que les obligations de notification (Art. 14) et de documentation (Art. 13) du Règlement (UE) 2024/2847.

Normes de référence :
  - EU Cyber Resilience Act (CRA) — Règlement (UE) 2024/2847
  - STRIDE Threat Model — Microsoft Security Development Lifecycle
  - OWASP IoT Top 10 / OWASP API Security Top 10
  - ETSI EN 303 645 — Cyber Security for Consumer IoT
  - NIST SP 800-82r3 — Guide to OT Security`;
  return `The assessment follows a two-stage approach:

1. STRIDE Threat Analysis
Systematic identification of threat scenarios across the categories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Each threat is rated on a 5-point scale for both likelihood and impact. The risk score is calculated as the product of both values; scores of 20 or above are classified as critical.

2. CRA Compliance Review
Comparison of implemented security measures against the requirements of Annex I (security properties of digital products), Annex II (vulnerability handling), as well as the reporting obligations under Art. 14 and documentation requirements under Art. 13 of Regulation (EU) 2024/2847.

Audit Standards:
  - EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847
  - STRIDE Threat Model — Microsoft Security Development Lifecycle
  - OWASP IoT Top 10 / OWASP API Security Top 10
  - ETSI EN 303 645 — Cyber Security for Consumer IoT
  - NIST SP 800-82r3 — Guide to OT Security
  - ISO/IEC 27001:2022 (reference framework)`;
}

function getDisclaimer(lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht wurde werkzeuggestützt erstellt und gibt den Erkenntnisstand zum Zeitpunkt der Prüfung wieder. Er ersetzt weder eine akkreditierte Konformitätsbewertung nach Art. 24 ff. CRA noch eine individuelle rechtliche Beratung.

Die Bewertung basiert auf den vom Anwender bereitgestellten Angaben zum Produkt sowie auf den zum Erstellungszeitpunkt gültigen Anforderungen der Verordnung (EU) 2024/2847. Für die Richtigkeit und Vollständigkeit der Eingabedaten ist der Anwender verantwortlich.

Für verbindliche Auskünfte zur CRA-Konformität wird die Einbindung einer benannten Stelle oder eines akkreditierten Prüfdienstleisters empfohlen.`;
  if (lang === 'fr') return `Le présent rapport a été produit avec l'aide d'outils automatisés et reflète l'état des connaissances au moment de l'évaluation. Il ne remplace ni une évaluation de conformité accréditée selon les Art. 24 et suivants du CRA, ni un conseil juridique individuel.

L'évaluation est basée sur les informations fournies par l'utilisateur concernant le produit ainsi que sur les exigences du Règlement (UE) 2024/2847 valides au moment de la génération. L'utilisateur est responsable de l'exactitude et de l'exhaustivité des données saisies.

Pour des informations contraignantes sur la conformité CRA, il est recommandé de faire appel à un organisme notifié ou à un prestataire d'audit accrédité.`;
  return `This report was produced with the assistance of automated tools and reflects the state of knowledge at the time of assessment. It does not replace an accredited conformity assessment pursuant to Art. 24 ff. CRA, nor does it constitute individual legal advice.

The assessment is based on product information provided by the user and the requirements of Regulation (EU) 2024/2847 valid at the time of generation. The user is responsible for the accuracy and completeness of the input data.

For binding information on CRA compliance, engagement of a notified body or accredited audit service provider is recommended.`;
}

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
  const highRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 13 && s < 20; });
  const failReqs = reqs.filter(r => r.status === 'fail');
  const partialReqs = reqs.filter(r => r.status === 'partial');
  const passReqs = reqs.filter(r => r.status === 'pass');

  const locale = lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const reportId = `CRA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  let y = 0;
  let pageNum = 0;
  let findingNum = 0;

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

  function newSection() {
    addFooter();
    doc.addPage();
    y = 25;
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
    doc.setFontSize(11);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 8;
  }

  function writeBody(text: string, indent: number = 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.bodyText);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, ML + indent, y);
      y += 4.5;
    }
  }

  function writeLabel(label: string, indent: number = 0) {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkNavy);
    doc.text(label, ML + indent, y);
    y += 4;
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

  function writeFieldBlock(label: string, value: string, indent: number = 4) {
    writeLabel(label, indent);
    writeBody(value, indent + 2);
    y += 1;
  }

  // Risk level label
  function riskLabel(score: number): string {
    if (score >= 20) return lang === 'de' ? 'Kritisch' : lang === 'fr' ? 'Critique' : 'Critical';
    if (score >= 13) return lang === 'de' ? 'Hoch' : lang === 'fr' ? 'Élevé' : 'High';
    if (score >= 6) return lang === 'de' ? 'Mittel' : lang === 'fr' ? 'Moyen' : 'Medium';
    return lang === 'de' ? 'Gering' : lang === 'fr' ? 'Faible' : 'Low';
  }

  // ══════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════
  doc.setFillColor(...C.darkNavy);
  doc.rect(0, 0, W, 85, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(0, 85, W, 3, 'F');

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

  // Cover metadata
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
    doc.text(v, mx + 55, y);
    y += 8;
  }

  // Summary boxes
  y = 180;
  const statW = CW / 4;
  const stats: [string, number, [number, number, number], [number, number, number]][] = [
    [t(I18N.totalThreats), threats.length, C.bgLight, C.darkNavy],
    [t(I18N.criticalRisks), critRisks.length, C.bgRed, C.redText],
    [t(I18N.craGaps), failReqs.length, C.bgRed, C.redText],
    [t(I18N.partialGaps), partialReqs.length, C.bgYellow, C.orangeText],
  ];
  for (let i = 0; i < stats.length; i++) {
    const sx = ML + i * statW;
    doc.setFillColor(...stats[i][2]);
    doc.roundedRect(sx + 1.5, y, statW - 3, 28, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...stats[i][3]);
    doc.text(String(stats[i][1]), sx + statW / 2, y + 13, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(...C.bodyText);
    const lbl = doc.splitTextToSize(stats[i][0], statW - 6);
    doc.text(lbl, sx + statW / 2, y + 21, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.lightGray);
  doc.text(t(I18N.confidential), W - MR, H - 15, { align: 'right' });
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

  const tocItems = [I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4, I18N.sec5, I18N.sec6, I18N.sec7];
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
  // SECTION 1: Ausgangslage und Zielsetzung
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec1));
  writeBody(getContextText(intakeData.productName, intakeData.version, productTypeName, craClassName, dateStr, lang));
  y += 5;

  // ══════════════════════════════════════
  // SECTION 2: Management Summary
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec2));
  writeBody(getMgmtSummary(intakeData.productName, threats.length, critRisks.length, failReqs.length, partialReqs.length, reqs.length, lang));
  y += 8;

  // Stats boxes in summary
  const bw = (CW - 12) / 4;
  const allStats: [string, number, [number, number, number], [number, number, number]][] = [
    [t(I18N.totalThreats), threats.length, C.bgLight, C.darkNavy],
    [t(I18N.criticalRisks), critRisks.length, C.bgRed, C.redText],
    [t(I18N.craGaps), failReqs.length, C.bgRed, C.redText],
    [t(I18N.partialGaps), partialReqs.length, C.bgYellow, C.orangeText],
  ];
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
  // SECTION 3: Gegenstand der Prüfung
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec3));

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

  const measureKeys = Object.keys(intakeData.measures);
  if (measureKeys.length > 0) {
    y += 3;
    writeSubHeading(t(I18N.measures));
    for (const key of measureKeys) {
      const m = intakeData.measures[key];
      const parts: string[] = [];
      if (m.active) parts.push(lang === 'de' ? 'Aktiv' : lang === 'fr' ? 'Actif' : 'Active');
      if (m.documented) parts.push(lang === 'de' ? 'Dokumentiert' : lang === 'fr' ? 'Documenté' : 'Documented');
      if (m.audited) parts.push(lang === 'de' ? 'Auditiert' : lang === 'fr' ? 'Audité' : 'Audited');
      writeKV(key.toUpperCase(), parts.join(' / ') || '—', 4);
    }
  }

  // ══════════════════════════════════════
  // SECTION 4: Feststellungen im Einzelnen
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec4));

  // 4.1 Threat Landscape
  writeSubHeading(t(I18N.sec4a));
  y += 2;

  // Sorted by risk score descending
  const sortedThreats = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  for (const th of sortedThreats) {
    findingNum++;
    checkPage(55);
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const isCrit = score >= 20;
    const isHigh = score >= 13;

    // Finding header
    const headerBg = isCrit ? C.bgRed : isHigh ? C.bgYellow : C.bgLight;
    const headerText = isCrit ? C.redText : isHigh ? C.orangeText : C.darkNavy;
    doc.setFillColor(...headerBg);
    doc.roundedRect(ML, y, CW, 10, 1.5, 1.5, 'F');
    if (isCrit) {
      doc.setDrawColor(...C.redText);
      doc.setLineWidth(0.4);
      doc.roundedRect(ML, y, CW, 10, 1.5, 1.5, 'S');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...headerText);
    const findingLabel = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    doc.text(`${findingLabel}  |  ${tid}  ${th.name}`, ML + 4, y + 6.5);

    const rl = riskLabel(score);
    const scoreStr = `${rl} (${th.likelihood}×${th.impact}=${score})`;
    doc.setFontSize(8);
    doc.text(scoreStr, W - MR - 4, y + 6.5, { align: 'right' });
    y += 14;

    writeFieldBlock(t(I18N.component), th.component);
    writeFieldBlock(t(I18N.attacker), th.attacker);
    writeFieldBlock(t(I18N.attackPath), th.path);
    writeFieldBlock(t(I18N.evidence), th.evidence);
    writeFieldBlock(t(I18N.rationale), th.rationale);

    // Sources
    if (th.sources.length > 0) {
      writeLabel(t(I18N.sources), 4);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.lightGray);
      for (const src of th.sources) {
        checkPage(5);
        doc.text(`  - ${src}`, ML + 6, y);
        y += 3.8;
      }
    }
    y += 3;

    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 6;
  }

  // 4.2 CRA Compliance Gaps
  newSection();
  writeSubHeading(t(I18N.sec4b));
  y += 2;

  // Sort: fail first, then partial, then pass
  const sortedReqs = [...reqs].sort((a, b) => {
    const order = { fail: 0, partial: 1, pass: 2 };
    return order[a.status] - order[b.status];
  });

  for (const req of sortedReqs) {
    findingNum++;
    checkPage(50);

    const statusColor = req.status === 'pass' ? C.greenText : req.status === 'partial' ? C.orangeText : C.redText;
    const statusBg = req.status === 'pass' ? C.bgGreen : req.status === 'partial' ? C.bgYellow : C.bgRed;
    const statusLabel = req.status === 'pass' ? t(I18N.pass) : req.status === 'partial' ? t(I18N.partial) : t(I18N.fail);

    // Requirement header
    doc.setFillColor(...statusBg);
    doc.roundedRect(ML, y, CW, 10, 1.5, 1.5, 'F');
    if (req.status === 'fail') {
      doc.setDrawColor(...C.redText);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, CW, 10, 1.5, 1.5, 'S');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...statusColor);
    const reqFinding = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    doc.text(`${reqFinding}  |  ${req.id}  ${req.name}`, ML + 4, y + 6.5);
    doc.setFontSize(8);
    doc.text(statusLabel, W - MR - 4, y + 6.5, { align: 'right' });
    y += 14;

    // Article reference
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.lightGray);
    doc.text(req.article, ML + 4, y);
    y += 5;

    writeFieldBlock(t(I18N.gap), req.gap);
    writeFieldBlock(t(I18N.evidence), req.evidence);
    writeFieldBlock(t(I18N.rationale), req.rationale);
    writeFieldBlock(t(I18N.measureAction), req.measure);

    // Definition of Done
    if (req.criteria.length > 0) {
      checkPage(10);
      writeLabel(t(I18N.dod), 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.bodyText);
      for (const c of req.criteria) {
        checkPage(6);
        const cLines = doc.splitTextToSize(`\u2610  ${c}`, CW - 14);
        doc.text(cLines, ML + 8, y);
        y += cLines.length * 3.8;
      }
    }

    y += 3;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 6;
  }

  // ══════════════════════════════════════
  // SECTION 5: Handlungsempfehlungen
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec5));

  if (failReqs.length === 0 && critRisks.length === 0) {
    writeBody(lang === 'de'
      ? 'Auf Basis der durchgeführten Prüfung ergeben sich keine Sofortmaßnahmen. Die bestehenden Maßnahmen adressieren die identifizierten Risiken angemessen.'
      : lang === 'fr'
      ? 'Sur la base de l\'évaluation réalisée, aucune action immédiate n\'est nécessaire. Les mesures existantes répondent de manière adéquate aux risques identifiés.'
      : 'Based on the assessment conducted, no immediate actions are required. The existing measures adequately address the identified risks.');
  } else {
    // Prio 1: Critical risks
    if (critRisks.length > 0) {
      checkPage(15);
      writeSubHeading(`${t(I18N.priority)}: ${t(I18N.high)}`);

      for (const th of critRisks) {
        checkPage(12);
        const tid = threatId(th);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.redText);
        doc.text(`${tid}`, ML + 4, y);
        doc.setTextColor(...C.darkNavy);
        doc.text(th.name, ML + 18, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.bodyText);
        const desc = lang === 'de'
          ? `Risikoscore ${th.likelihood}×${th.impact}=${th.likelihood * th.impact}. ${th.component} — Unmittelbare technische Gegenmaßnahmen erforderlich.`
          : lang === 'fr'
          ? `Score de risque ${th.likelihood}×${th.impact}=${th.likelihood * th.impact}. ${th.component} — Contre-mesures techniques immédiates nécessaires.`
          : `Risk score ${th.likelihood}×${th.impact}=${th.likelihood * th.impact}. ${th.component} — Immediate technical countermeasures required.`;
        const dLines = doc.splitTextToSize(desc, CW - 22);
        doc.text(dLines, ML + 18, y);
        y += dLines.length * 4.5 + 4;
      }
      y += 3;
    }

    // Prio 2: CRA gaps
    if (failReqs.length > 0) {
      checkPage(15);
      const gapPrio = critRisks.length > 0
        ? `${t(I18N.priority)}: ${t(I18N.medium)}`
        : `${t(I18N.priority)}: ${t(I18N.high)}`;
      writeSubHeading(gapPrio);

      for (let i = 0; i < failReqs.length; i++) {
        checkPage(12);
        const r = failReqs[i];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.redText);
        doc.text(`${i + 1}.`, ML + 4, y);
        doc.setTextColor(...C.darkNavy);
        doc.text(`${r.name} (${r.id})`, ML + 12, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.bodyText);
        const mLines = doc.splitTextToSize(r.measure, CW - 16);
        doc.text(mLines, ML + 12, y);
        y += mLines.length * 4.5 + 4;
      }
    }
  }

  // ══════════════════════════════════════
  // SECTION 6: Methodik
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec6));
  writeBody(getMethodology(lang));
  y += 8;

  // ══════════════════════════════════════
  // SECTION 7: Disclaimer
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec7));
  writeBody(getDisclaimer(lang));

  addFooter();

  doc.save(`CRA-Pruefbericht_${intakeData.productName.replace(/\s+/g, '-')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
