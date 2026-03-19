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
  subtitle: { de: 'Prüfbericht nach EU Cyber Resilience Act', en: 'Assessment Report pursuant to EU Cyber Resilience Act', fr: 'Rapport d\'évaluation selon le Cyber Resilience Act de l\'UE' },
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
  sec7: { de: '7  Einschränkungen und Haftungsausschluss', en: '7  Limitations and Disclaimer', fr: '7  Limites et clause de non-responsabilité' },

  product: { de: 'Produkt', en: 'Product', fr: 'Produit' },
  version: { de: 'Version', en: 'Version', fr: 'Version' },
  type: { de: 'Produkttyp', en: 'Product Type', fr: 'Type de produit' },
  craClass: { de: 'CRA-Klasse', en: 'CRA Class', fr: 'Classe CRA' },
  deployment: { de: 'Betriebsmodell', en: 'Deployment Model', fr: 'Modèle de déploiement' },
  interfaces: { de: 'Kommunikationsschnittstellen', en: 'Communication Interfaces', fr: 'Interfaces de communication' },
  components: { de: 'Systemkomponenten', en: 'System Components', fr: 'Composants du système' },
  roles: { de: 'Benutzerrollen', en: 'User Roles', fr: 'Rôles utilisateur' },
  measures: { de: 'Implementierte Maßnahmen', en: 'Implemented Measures', fr: 'Mesures mises en œuvre' },
  knownIssues: { de: 'Vom Hersteller benannte Probleme', en: 'Manufacturer-Reported Issues', fr: 'Problèmes signalés par le fabricant' },

  threat: { de: 'Bedrohung', en: 'Threat', fr: 'Menace' },
  finding: { de: 'Feststellung', en: 'Finding', fr: 'Constatation' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerné' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil de l\'attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Éléments de preuve recueillis' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Fondement de l\'évaluation' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Évaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Évaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart identifié' },
  measureAction: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandée' },
  dod: { de: 'Nachweisbare Umsetzungskriterien', en: 'Verifiable Acceptance Criteria', fr: 'Critères d\'acceptation vérifiables' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise konform', en: 'Partially Compliant', fr: 'Partiellement conforme' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources et références' },
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
  if (lang === 'de') return `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Cyber-Risikobewertung für das Produkt ${p} ${v} (${typeName}, CRA-Klasse: ${cls}). Die Prüfung wurde am ${date} durchgeführt.\n\nZielsetzung war die systematische Identifikation von Bedrohungen nach dem STRIDE-Modell sowie die Bewertung der Konformität mit den wesentlichen Anforderungen des EU Cyber Resilience Act (Verordnung (EU) 2024/2847). Der Bericht richtet sich an die Geschäftsleitung, das Produktmanagement und die für Informationssicherheit verantwortlichen Stellen.\n\nDie Bewertung umfasst sowohl eine technische Bedrohungsanalyse als auch eine regulatorische Konformitätsprüfung gegen die Anforderungen aus Annex I (Sicherheitseigenschaften), Annex II (Schwachstellenbehandlung) sowie den Artikeln 13 und 14 des CRA.`;
  if (lang === 'fr') return `Le présent rapport documente les résultats d'une évaluation structurée des cyber-risques pour le produit ${p} ${v} (${typeName}, classe CRA : ${cls}). L'évaluation a été réalisée le ${date}.\n\nL'objectif était l'identification systématique des menaces selon le modèle STRIDE ainsi que l'évaluation de la conformité aux exigences essentielles du Cyber Resilience Act européen (Règlement (UE) 2024/2847). Ce rapport s'adresse à la direction, au management produit et aux responsables de la sécurité de l'information.\n\nL'évaluation couvre à la fois une analyse technique des menaces et une vérification de conformité réglementaire contre les exigences de l'Annexe I, l'Annexe II ainsi que les Articles 13 et 14 du CRA.`;
  return `This report documents the results of a structured cyber risk assessment for the product ${p} ${v} (${typeName}, CRA class: ${cls}). The assessment was conducted on ${date}.\n\nThe objective was the systematic identification of threats using the STRIDE model and the evaluation of compliance with the essential requirements of the EU Cyber Resilience Act (Regulation (EU) 2024/2847). This report is intended for executive management, product management, and information security stakeholders.\n\nThe assessment covers both a technical threat analysis and a regulatory compliance review against the requirements of Annex I (security properties), Annex II (vulnerability handling), and Articles 13 and 14 of the CRA.`;
}

function getMgmtSummary(
  p: string, threats: number, crit: number, failReqs: number, partialReqs: number, totalReqs: number, lang: string
): string {
  if (lang === 'de') return `Die Prüfung hat ${threats} Bedrohungsszenarien identifiziert und bewertet. Davon weisen ${crit} einen kritischen Risikoscore auf (Eintrittswahrscheinlichkeit × Auswirkung ≥ 20) und erfordern unmittelbares Handeln.\n\nVon ${totalReqs} geprüften CRA-Anforderungen sind ${failReqs} als nicht konform eingestuft. Diese Abweichungen betreffen grundlegende Sicherheitseigenschaften, die vor einer Markteinführung zwingend adressiert werden müssen. Weitere ${partialReqs} Anforderungen sind nur teilweise erfüllt und bedürfen der Nachbesserung.\n\n${crit > 0 ? 'Die identifizierten kritischen Risiken betreffen insbesondere Bereiche, in denen Angreifer mit vertretbarem Aufwand erheblichen Schaden anrichten können. Eine verzögerte Behebung erhöht das Risiko regulatorischer Beanstandungen und potenzieller Haftungsansprüche.' : 'Es wurden keine Bedrohungen mit kritischem Risikoscore identifiziert. Die vorhandenen Maßnahmen adressieren die wesentlichen Angriffsvektoren angemessen.'}\n\n${failReqs > 0 ? 'Handlungsbedarf besteht vor allem bei den in Abschnitt 5 aufgeführten Sofortmaßnahmen. Diese sollten priorisiert und mit klaren Verantwortlichkeiten und Zeitplänen versehen werden.' : 'Die CRA-Anforderungen werden weitgehend erfüllt. Die verbleibenden Teilerfüllungen sollten im Rahmen des regulären Entwicklungsprozesses adressiert werden.'}`;
  if (lang === 'fr') return `L'évaluation a identifié et évalué ${threats} scénarios de menaces. Parmi ceux-ci, ${crit} présentent un score de risque critique (probabilité × impact ≥ 20) et nécessitent une action immédiate.\n\nSur ${totalReqs} exigences CRA examinées, ${failReqs} sont classées comme non conformes. Ces écarts concernent des propriétés de sécurité fondamentales qui doivent impérativement être corrigées avant la mise sur le marché. ${partialReqs} exigences supplémentaires ne sont que partiellement satisfaites.\n\n${crit > 0 ? 'Les risques critiques identifiés concernent notamment des domaines où un attaquant peut causer des dommages significatifs avec un effort raisonnable.' : 'Aucune menace avec un score de risque critique n\'a été identifiée.'}\n\n${failReqs > 0 ? 'Les actions immédiates détaillées dans la section 5 doivent être priorisées avec des responsabilités et des délais clairs.' : 'Les exigences CRA sont largement satisfaites. Les conformités partielles restantes peuvent être traitées dans le cadre du processus de développement régulier.'}`;
  return `The assessment identified and evaluated ${threats} threat scenarios. Of these, ${crit} carry a critical risk score (likelihood × impact ≥ 20) and require immediate action.\n\nOf ${totalReqs} CRA requirements reviewed, ${failReqs} are rated as non-compliant. These deviations affect fundamental security properties that must be addressed before market entry. An additional ${partialReqs} requirements are only partially fulfilled and require remediation.\n\n${crit > 0 ? 'The identified critical risks particularly affect areas where attackers can cause significant damage with reasonable effort. Delayed remediation increases the risk of regulatory objections and potential liability claims.' : 'No threats with critical risk scores were identified. The existing measures adequately address the primary attack vectors.'}\n\n${failReqs > 0 ? 'Priority action is required on the immediate measures listed in Section 5. These should be assigned clear ownership and timelines.' : 'CRA requirements are largely met. The remaining partial fulfillments should be addressed through the regular development process.'}`;
}

function getMethodology(lang: string): string {
  if (lang === 'de') return `Die Prüfung folgt einem zweistufigen Ansatz:\n\n1. Bedrohungsanalyse nach STRIDE\nSystematische Identifikation von Bedrohungsszenarien in den Kategorien Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service und Elevation of Privilege. Jede Bedrohung wird anhand einer 5-stufigen Skala für Eintrittswahrscheinlichkeit und Auswirkung bewertet. Der Risikoscore ergibt sich als Produkt beider Werte; Scores ab 20 gelten als kritisch.\n\n2. Konformitätsprüfung gegen CRA-Anforderungen\nAbgleich der implementierten Sicherheitsmaßnahmen mit den Anforderungen aus Annex I (Sicherheitseigenschaften digitaler Produkte), Annex II (Schwachstellenbehandlung) sowie den Meldepflichten nach Art. 14 und der Dokumentationspflicht nach Art. 13 der Verordnung (EU) 2024/2847.\n\nPrüfungsgrundlagen:\n  - EU Cyber Resilience Act (CRA) — Verordnung (EU) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (als Referenzrahmen)`;
  if (lang === 'fr') return `L'évaluation suit une approche en deux étapes :\n\n1. Analyse des menaces selon STRIDE\nIdentification systématique des scénarios de menaces dans les catégories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service et Elevation of Privilege. Chaque menace est évaluée sur une échelle de 1 à 5 pour la probabilité et l'impact. Le score de risque est le produit des deux valeurs ; les scores de 20 et plus sont considérés comme critiques.\n\n2. Vérification de conformité CRA\nComparaison des mesures de sécurité mises en œuvre avec les exigences de l'Annexe I (propriétés de sécurité des produits numériques), l'Annexe II (traitement des vulnérabilités) ainsi que les obligations de notification (Art. 14) et de documentation (Art. 13) du Règlement (UE) 2024/2847.\n\nNormes de référence :\n  - EU Cyber Resilience Act (CRA) — Règlement (UE) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (cadre de référence)`;
  return `The assessment follows a two-stage approach:\n\n1. STRIDE Threat Analysis\nSystematic identification of threat scenarios across the categories Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Each threat is rated on a 5-point scale for both likelihood and impact. The risk score is calculated as the product of both values; scores of 20 or above are classified as critical.\n\n2. CRA Compliance Review\nComparison of implemented security measures against the requirements of Annex I (security properties of digital products), Annex II (vulnerability handling), as well as the reporting obligations under Art. 14 and documentation requirements under Art. 13 of Regulation (EU) 2024/2847.\n\nAudit Standards:\n  - EU Cyber Resilience Act (CRA) — Regulation (EU) 2024/2847\n  - STRIDE Threat Model — Microsoft Security Development Lifecycle\n  - OWASP IoT Top 10 / OWASP API Security Top 10\n  - ETSI EN 303 645 — Cyber Security for Consumer IoT\n  - NIST SP 800-82r3 — Guide to OT Security\n  - ISO/IEC 27001:2022 (reference framework)`;
}

function getDisclaimer(lang: string): string {
  if (lang === 'de') return `Der vorliegende Bericht wurde werkzeuggestützt erstellt und gibt den Erkenntnisstand zum Zeitpunkt der Prüfung wieder. Er ersetzt weder eine akkreditierte Konformitätsbewertung nach Art. 24 ff. CRA noch eine individuelle rechtliche Beratung.\n\nDie Bewertung basiert auf den vom Anwender bereitgestellten Angaben zum Produkt sowie auf den zum Erstellungszeitpunkt gültigen Anforderungen der Verordnung (EU) 2024/2847. Für die Richtigkeit und Vollständigkeit der Eingabedaten ist der Anwender verantwortlich.\n\nFür verbindliche Auskünfte zur CRA-Konformität wird die Einbindung einer benannten Stelle oder eines akkreditierten Prüfdienstleisters empfohlen.`;
  if (lang === 'fr') return `Le présent rapport a été produit avec l'aide d'outils automatisés et reflète l'état des connaissances au moment de l'évaluation. Il ne remplace ni une évaluation de conformité accréditée selon les Art. 24 et suivants du CRA, ni un conseil juridique individuel.\n\nL'évaluation est basée sur les informations fournies par l'utilisateur concernant le produit ainsi que sur les exigences du Règlement (UE) 2024/2847 en vigueur au moment de la génération. L'utilisateur est responsable de l'exactitude et de l'exhaustivité des données saisies.\n\nPour des informations contraignantes sur la conformité CRA, il est recommandé de faire appel à un organisme notifié ou à un prestataire d'audit accrédité.`;
  return `This report was produced with the assistance of automated tools and reflects the state of knowledge at the time of assessment. It does not replace an accredited conformity assessment pursuant to Art. 24 ff. CRA, nor does it constitute individual legal advice.\n\nThe assessment is based on product information provided by the user and the requirements of Regulation (EU) 2024/2847 valid at the time of generation. The user is responsible for the accuracy and completeness of the input data.\n\nFor binding information on CRA compliance, engagement of a notified body or accredited audit service provider is recommended.`;
}

/* ────── Colors ────── */
const C = {
  navy: [8, 11, 16] as [number, number, number],
  darkNavy: [15, 23, 42] as [number, number, number],
  accent: [0, 188, 212] as [number, number, number],
  gold: [245, 184, 0] as [number, number, number],
  bodyText: [55, 65, 81] as [number, number, number],
  lightGray: [148, 163, 184] as [number, number, number],
  ruleStroke: [203, 213, 225] as [number, number, number],
  bgLight: [248, 250, 252] as [number, number, number],
  bgRed: [254, 226, 226] as [number, number, number],
  bgYellow: [254, 249, 195] as [number, number, number],
  bgGreen: [220, 252, 231] as [number, number, number],
  redText: [185, 28, 28] as [number, number, number],
  orangeText: [194, 65, 12] as [number, number, number],
  greenText: [21, 128, 61] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ────── Watermark: Geometric Symbol (precise replica of GeometricSymbol.tsx) ────── */
function drawWatermark(doc: jsPDF, cx: number, cy: number, size: number) {
  // size = half-dimension of the bounding box (equivalent to w-48 h-48 → S=24 CSS units)
  // All proportions derived from the CSS component's 48-unit coordinate system
  const S = size;
  const SQRT2_HALF = Math.SQRT2 / 2;

  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.055 }));

  const gold: [number, number, number] = [245, 184, 0]; // --primary #f5b800

  // Helper: draw a diamond (45° rotated square) given center and half-diagonal
  const diamond = (x: number, y: number, hd: number, style: 'S' | 'F' = 'S') => {
    doc.lines(
      [[hd, hd], [hd, -hd], [-hd, -hd], [-hd, hd]],
      x, y - hd, [1, 1], style, true
    );
  };

  // ── Layer 1: Cross bars (border-primary/60 → lighter stroke) ──
  // Vertical bar: w-6 on w-48 container = 6/48 = 1/8 of full width
  const barHalfW = S * (6 / 48);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  // Vertical bar (left + right edges)
  doc.line(cx - barHalfW, cy - S, cx - barHalfW, cy + S);
  doc.line(cx + barHalfW, cy - S, cx + barHalfW, cy + S);
  // Horizontal bar (top + bottom edges)
  doc.line(cx - S, cy - barHalfW, cx + S, cy - barHalfW);
  doc.line(cx - S, cy + barHalfW, cx + S, cy + barHalfW);

  // ── Layer 2: 4 offset diamonds (w-16 h-16 rotated 45°, border-primary/80) ──
  // Side = 16/48 of container = S×16/24. Half-diagonal = side × √2/2
  const dSide = S * (16 / 24);
  const dHalfDiag = dSide * SQRT2_HALF;
  // Offset: top-2 on 48-unit = 2/48. Center of 16-high div = 2 + 8 = 10 from edge.
  // Distance from center = 24 - 10 = 14. In S: 14/24
  const dOffset = S * (14 / 24);

  doc.setLineWidth(0.35);
  diamond(cx, cy - dOffset, dHalfDiag); // top
  diamond(cx, cy + dOffset, dHalfDiag); // bottom
  diamond(cx - dOffset, cy, dHalfDiag); // left
  diamond(cx + dOffset, cy, dHalfDiag); // right

  // ── Layer 3: Inner diamond large (inset-1/4, border-primary → full opacity) ──
  // inset 25% → side = 50% of container = 24 units. Half-diag = 24×√2/2
  const d1Side = S * (24 / 24);
  const d1HD = d1Side * SQRT2_HALF;
  doc.setLineWidth(0.4);
  diamond(cx, cy, d1HD);

  // ── Layer 4: Inner diamond medium (inset-1/3, border-primary/60) ──
  // inset 33.3% → side = 33.3% of container = 16 units. Half-diag = 16×√2/2
  const d2Side = S * (16 / 24);
  const d2HD = d2Side * SQRT2_HALF;
  doc.setLineWidth(0.3);
  diamond(cx, cy, d2HD);

  // ── Layer 5: Innermost filled diamond (inset-2/5, bg-primary/10) ──
  // inset 40% → side = 20% of container = 9.6 units. Half-diag = 9.6×√2/2
  const d3Side = S * (9.6 / 24);
  const d3HD = d3Side * SQRT2_HALF;
  doc.setFillColor(...gold);
  diamond(cx, cy, d3HD, 'F');

  doc.restoreGraphicsState();
}

/* ────── Generator ────── */

export function generateCraReport(data: CraReportData): void {
  const { intakeData, threats, reqs, language, productTypeName, craClassName } = data;
  const lang = language;
  const t = (o: Record<string, string>) => o[lang] || o.en;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const ML = 22, MR = 22, CW = W - ML - MR;

  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const failReqs = reqs.filter(r => r.status === 'fail');
  const partialReqs = reqs.filter(r => r.status === 'partial');

  const locale = lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const reportId = `CRA-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  let y = 0;
  let pageNum = 0;
  let findingNum = 0;

  // ── Typography helpers ──

  const BODY_SIZE = 9.5;
  const BODY_LEADING = 4.8;
  const LABEL_SIZE = 8;
  const SECTION_SIZE = 13;
  const SUBSECTION_SIZE = 10.5;

  function addFooter() {
    pageNum++;
    // Thin top line
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.2);
    doc.line(ML, H - 14, W - MR, H - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text(`${t(I18N.page)} ${pageNum}`, W / 2, H - 9, { align: 'center' });
    doc.text(t(I18N.confidential), W - MR, H - 9, { align: 'right' });
    doc.text(reportId, ML, H - 9);

    // Gold bottom accent bar
    doc.setFillColor(...C.gold);
    doc.rect(0, H - 3, W, 3, 'F');
  }

  function preparePage() {
    drawWatermark(doc, W / 2, H / 2, 55);
  }

  function checkPage(need: number = 20) {
    if (y > H - 28 - need) {
      addFooter();
      doc.addPage();
      preparePage();
      y = 28;
    }
  }

  function newSection() {
    addFooter();
    doc.addPage();
    preparePage();
    y = 28;
  }

  function writeSectionHeading(text: string) {
    checkPage(30);
    // Gold accent line before heading
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(1.2);
    doc.line(ML, y, ML + 35, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SECTION_SIZE);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 10;
  }

  function writeSubHeading(text: string) {
    checkPage(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(SUBSECTION_SIZE);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 8;
  }

  function writeBody(text: string, indent: number = 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);

    // Support paragraph breaks
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') { y += 3; continue; }
      const lines = doc.splitTextToSize(para, CW - indent);
      for (const line of lines) {
        checkPage(6);
        doc.text(line, ML + indent, y);
        y += BODY_LEADING;
      }
      y += 1.5;
    }
  }

  function writeLabel(label: string, indent: number = 0) {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(LABEL_SIZE);
    doc.setTextColor(...C.accent);
    doc.text(label.toUpperCase(), ML + indent, y);
    y += 4.5;
  }

  function writeKV(label: string, value: string, indent: number = 0) {
    checkPage(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.darkNavy);
    const labelStr = label + ':';
    doc.text(labelStr, ML + indent, y);
    const labelW = doc.getTextWidth(labelStr + ' ');
    const maxLabelW = 45; // cap label width to prevent squeeze
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.bodyText);
    if (labelW > maxLabelW) {
      // Label too long — put value on next line
      y += BODY_LEADING;
      const valLines = doc.splitTextToSize(value, CW - indent - 4);
      for (const line of valLines) {
        checkPage(6);
        doc.text(line, ML + indent + 4, y);
        y += BODY_LEADING;
      }
      y += 1;
    } else {
      const availW = CW - labelW - indent - 2;
      const valLines = doc.splitTextToSize(value, availW);
      doc.text(valLines[0], ML + indent + labelW, y);
      y += BODY_LEADING;
      for (let i = 1; i < valLines.length; i++) {
        checkPage(6);
        doc.text(valLines[i], ML + indent + labelW, y);
        y += BODY_LEADING;
      }
      y += 1;
    }
  }

  function writeFieldBlock(label: string, value: string, indent: number = 4) {
    writeLabel(label, indent);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...C.bodyText);
    const lines = doc.splitTextToSize(value, CW - indent - 2);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, ML + indent + 2, y);
      y += BODY_LEADING;
    }
    y += 2;
  }

  function riskLabel(score: number): string {
    if (score >= 20) return lang === 'de' ? 'Kritisch' : lang === 'fr' ? 'Critique' : 'Critical';
    if (score >= 13) return lang === 'de' ? 'Hoch' : lang === 'fr' ? 'Élevé' : 'High';
    if (score >= 6) return lang === 'de' ? 'Mittel' : lang === 'fr' ? 'Moyen' : 'Medium';
    return lang === 'de' ? 'Gering' : lang === 'fr' ? 'Faible' : 'Low';
  }

  // ══════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════
  // Full dark cover
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, H, 'F');


  // Draw large watermark centered
  drawWatermark(doc, W / 2, 105, 70);

  // Gold accent bar
  doc.setFillColor(...C.gold);
  doc.rect(ML, 42, 40, 2, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...C.white);
  doc.text(t(I18N.title), ML, 58);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...C.accent);
  doc.text(t(I18N.subtitle), ML, 68);

  // Product name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(180, 195, 210);
  doc.text(`${intakeData.productName} ${intakeData.version}`, ML, 82);

  // Bottom metadata block
  const metaY = H - 80;
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.4);
  doc.line(ML, metaY, W - MR, metaY);

  doc.setFontSize(9);
  const metaLines: [string, string][] = [
    [t(I18N.reportId), reportId],
    [t(I18N.generated), dateStr],
    [t(I18N.type), productTypeName],
    [t(I18N.craClass), craClassName],
  ];
  let my = metaY + 8;
  for (const [k, v] of metaLines) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.gold);
    doc.text(k, ML, my);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 195, 210);
    doc.text(v, ML + 50, my);
    my += 7;
  }

  // Confidential
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.gold);
  doc.text(t(I18N.confidential), W - MR, H - 15, { align: 'right' });

  // inside-the-box.org branding
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 160);
  doc.text('inside-the-box.org', ML, H - 15);

  // ══════════════════════════════════════
  // TOC
  // ══════════════════════════════════════
  doc.addPage();
  preparePage();
  pageNum++;
  y = 35;

  doc.setDrawColor(...C.gold);
  doc.setLineWidth(1.2);
  doc.line(ML, y, ML + 35, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...C.darkNavy);
  doc.text(t(I18N.toc), ML, y);
  y += 14;

  const tocItems = [I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4, I18N.sec5, I18N.sec6, I18N.sec7];
  for (const item of tocItems) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.bodyText);
    doc.text(t(item), ML + 4, y);
    // Dotted leader
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineDashPattern([0.5, 1.5], 0);
    doc.setLineWidth(0.15);
    const tw = doc.getTextWidth(t(item));
    doc.line(ML + 8 + tw, y - 0.5, W - MR, y - 0.5);
    doc.setLineDashPattern([], 0);
    y += 9;
  }

  addFooter();

  // ══════════════════════════════════════
  // SECTION 1
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

  // Stats boxes
  checkPage(35);
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
    doc.roundedRect(bx, y, bw, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...allStats[i][3]);
    doc.text(String(allStats[i][1]), bx + bw / 2, y + 12, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(...C.bodyText);
    const lbl = doc.splitTextToSize(allStats[i][0], bw - 4);
    doc.text(lbl, bx + bw / 2, y + 19, { align: 'center' });
  }
  y += 32;

  // ══════════════════════════════════════
  // SECTION 3: Scope
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
      if (m.active) parts.push(lang === 'de' ? 'Aktiv' : lang === 'fr' ? 'Active' : 'Active');
      if (m.documented) parts.push(lang === 'de' ? 'Dokumentiert' : lang === 'fr' ? 'Documentée' : 'Documented');
      if (m.audited) parts.push(lang === 'de' ? 'Auditiert' : lang === 'fr' ? 'Auditée' : 'Audited');
      writeKV(key.toUpperCase(), parts.join(' / ') || '—', 4);
    }
  }

  // ══════════════════════════════════════
  // SECTION 4: Detailed Findings
  // ══════════════════════════════════════
  newSection();
  writeSectionHeading(t(I18N.sec4));

  // 4.1 Threat Landscape
  writeSubHeading(t(I18N.sec4a));
  y += 2;

  const sortedThreats = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  for (const th of sortedThreats) {
    findingNum++;
    checkPage(55);
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const isCrit = score >= 20;
    const isHigh = score >= 13;

    // Finding header bar
    const headerBg = isCrit ? C.bgRed : isHigh ? C.bgYellow : C.bgLight;
    const headerText = isCrit ? C.redText : isHigh ? C.orangeText : C.darkNavy;
    doc.setFillColor(...headerBg);
    doc.roundedRect(ML, y, CW, 11, 1.5, 1.5, 'F');

    // Left accent
    const accentBarColor = isCrit ? C.redText : isHigh ? C.orangeText : C.accent;
    doc.setFillColor(...accentBarColor);
    doc.roundedRect(ML, y, 2.5, 11, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...headerText);
    const findingLabel = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    doc.text(`${findingLabel}  |  ${tid}  ${th.name}`, ML + 5, y + 7);

    const rl = riskLabel(score);
    const scoreStr = `${rl} (${th.likelihood} × ${th.impact} = ${score})`;
    doc.setFontSize(8);
    doc.text(scoreStr, W - MR - 4, y + 7, { align: 'right' });
    y += 15;

    writeFieldBlock(t(I18N.component), th.component);
    writeFieldBlock(t(I18N.attacker), th.attacker);
    writeFieldBlock(t(I18N.attackPath), th.path);
    writeFieldBlock(t(I18N.evidence), th.evidence);
    writeFieldBlock(t(I18N.rationale), th.rationale);

    if (th.sources.length > 0) {
      writeLabel(t(I18N.sources), 4);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.lightGray);
      for (const src of th.sources) {
        checkPage(5);
        doc.text(`  - ${src}`, ML + 6, y);
        y += 4;
      }
    }
    y += 4;

    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 8;
  }

  // 4.2 CRA Compliance Gaps
  newSection();
  writeSubHeading(t(I18N.sec4b));
  y += 2;

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

    doc.setFillColor(...statusBg);
    doc.roundedRect(ML, y, CW, 11, 1.5, 1.5, 'F');

    // Left accent
    doc.setFillColor(...statusColor);
    doc.roundedRect(ML, y, 2.5, 11, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...statusColor);
    const reqFinding = `${t(I18N.finding)} F-${String(findingNum).padStart(2, '0')}`;
    doc.text(`${reqFinding}  |  ${req.id}  ${req.name}`, ML + 5, y + 7);
    doc.setFontSize(8);
    doc.text(statusLabel, W - MR - 4, y + 7, { align: 'right' });
    y += 15;

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

    if (req.criteria.length > 0) {
      checkPage(10);
      writeLabel(t(I18N.dod), 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.bodyText);
      for (const c of req.criteria) {
        checkPage(6);
        const cLines = doc.splitTextToSize(`\u2610  ${c}`, CW - 14);
        doc.text(cLines, ML + 8, y);
        y += cLines.length * 4;
      }
    }

    y += 4;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.15);
    doc.line(ML + 10, y, W - MR - 10, y);
    y += 8;
  }

  // ══════════════════════════════════════
  // SECTION 5: Recommendations
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
        y += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.bodyText);
        const desc = lang === 'de'
          ? `Risikoscore ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Unmittelbare technische Gegenmaßnahmen erforderlich.`
          : lang === 'fr'
          ? `Score de risque ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Contre-mesures techniques immédiates nécessaires.`
          : `Risk score ${th.likelihood} × ${th.impact} = ${th.likelihood * th.impact}. ${th.component} — Immediate technical countermeasures required.`;
        const dLines = doc.splitTextToSize(desc, CW - 22);
        doc.text(dLines, ML + 18, y);
        y += dLines.length * BODY_LEADING + 5;
      }
      y += 3;
    }

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
        y += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(...C.bodyText);
        const mLines = doc.splitTextToSize(r.measure, CW - 16);
        doc.text(mLines, ML + 12, y);
        y += mLines.length * BODY_LEADING + 5;
      }
    }
  }

  // ══════════════════════════════════════
  // SECTION 6: Methodology
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
