import jsPDF from 'jspdf';

interface ProtocolAnswer {
  value: string;
  weight: number;
  label: string;
}

interface ProtocolData {
  answers: Record<string, ProtocolAnswer>;
  verdict: string;
  verdictLabel: string;
  reasoning: string;
  language: 'de' | 'en' | 'fr';
  stepLabels: Record<string, string>;
  stepQuestions: Record<string, string>;
}

/* ────── I18N ────── */

const I18N = {
  title: { de: 'TISAX Einstufungsprüfung', en: 'TISAX Assessment Check', fr: 'TISAX Classification Check' },
  subtitle: { de: 'Bewertungsprotokoll und Arbeitspapiere', en: 'Evaluation Protocol and Working Papers', fr: 'Protocole d\'évaluation et papiers de travail' },
  coverSub: { de: 'Arbeitspapiere zur unabhängigen Nachvollziehbarkeit\naller Einzelfallentscheidungen', en: 'Working papers for independent traceability\nof all individual decisions', fr: 'Papiers de travail pour la traçabilité\nindépendante de toutes les décisions' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  protocolId: { de: 'Protokoll-Nr.', en: 'Protocol No.', fr: 'N° de protocole' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  of: { de: 'von', en: 'of', fr: 'de' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  sec1: { de: '1  Zusammenfassung der Einstufung', en: '1  Classification Summary', fr: '1  Résumé de la classification' },
  sec2: { de: '2  Erhobene Sachverhalte (Evidenz)', en: '2  Collected Facts (Evidence)', fr: '2  Faits collectés (Preuves)' },
  sec3: { de: '3  Prüfung aller Entscheidungsregeln', en: '3  Evaluation of All Decision Rules', fr: '3  Évaluation de toutes les règles de décision' },
  sec3sub: { de: 'Audit Trail', en: 'Audit Trail', fr: 'Piste d\'audit' },
  sec4: { de: '4  Plausibilitätsprüfung', en: '4  Plausibility Check', fr: '4  Contrôle de plausibilité' },
  sec5: { de: '5  KI-gestützte Begründung', en: '5  AI-Supported Reasoning', fr: '5  Justification assistée par IA' },
  sec6: { de: '6  Klassifikationslogik', en: '6  Classification Logic', fr: '6  Logique de classification' },
  sec7: { de: '7  Methodik und Referenzen', en: '7  Methodology and References', fr: '7  Méthodologie et références' },
  sec8: { de: '8  Haftungsausschluss', en: '8  Disclaimer', fr: '8  Avertissement' },
  result: { de: 'Ergebnis', en: 'Result', fr: 'Résultat' },
  criterion: { de: 'Kriterium', en: 'Criterion', fr: 'Critère' },
  answer: { de: 'Antwort', en: 'Answer', fr: 'Réponse' },
  relevance: { de: 'Relevanz', en: 'Relevance', fr: 'Pertinence' },
  weight: { de: 'Gewicht', en: 'Weight', fr: 'Poids' },
  question: { de: 'Prüfungsfrage', en: 'Assessment Question', fr: 'Question d\'évaluation' },
  totalWeight: { de: 'Gesamtgewichtung', en: 'Total Weight', fr: 'Poids total' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  low: { de: 'Gering', en: 'Low', fr: 'Faible' },
  notRelevant: { de: 'Nicht relevant', en: 'Not relevant', fr: 'Non pertinent' },
  rule: { de: 'Regel', en: 'Rule', fr: 'Règle' },
  condition: { de: 'Bedingung', en: 'Condition', fr: 'Condition' },
  actualValue: { de: 'Ist-Wert', en: 'Actual Value', fr: 'Valeur réelle' },
  triggered: { de: 'Ausgelöst', en: 'Triggered', fr: 'Déclenché' },
  decisive: { de: 'Entscheidend', en: 'Decisive', fr: 'Décisif' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noWarnings: { de: 'Keine Plausibilitätshinweise — alle Angaben sind widerspruchsfrei.', en: 'No plausibility warnings — all inputs are consistent.', fr: 'Aucun avis de plausibilité — toutes les données sont cohérentes.' },
  status: { de: 'Status', en: 'Status', fr: 'Statut' },
  level: { de: 'Stufe', en: 'Level', fr: 'Niveau' },
  classLogicText: {
    de: `Die Klassifikation folgt einem regelbasierten Entscheidungsbaum mit strenger Prüfreihenfolge (AL3 → AL2 → AL1 → kein Bedarf). Die erste zutreffende Regel bestimmt das Ergebnis. Alle Regeln werden in Abschnitt 3 einzeln ausgewertet.

AL3-Regeln (R-01 bis R-04): Prototypenschutz, streng vertrauliche Daten, Prototypen-Informationen, explizite OEM-AL3-Anforderung.

AL2-Regeln (R-05 bis R-11): OEM-AL2-Anforderung, indirekter Prototypenschutz, vertrauliche Daten, CAD-Daten mit Automotive-Kontext, direkter OEM-Netzwerkzugang, OEM-Anforderung ohne Level, OEM/Tier-1-Rolle mit unterstützenden Indikatoren.

AL1-Regeln (R-12 bis R-13): Gewichtungsschwelle ≥ 5, erwartete OEM-Anforderung mit Gewicht ≥ 3.

Kein TISAX-Bedarf: Wenn keine der obigen Regeln zutrifft.`,
    en: `Classification follows a rule-based decision tree with strict evaluation order (AL3 → AL2 → AL1 → no need). The first matching rule determines the result. All rules are individually evaluated in Section 3.

AL3 rules (R-01 to R-04): Prototype protection, strictly confidential data, prototype information, explicit OEM AL3 requirement.

AL2 rules (R-05 to R-11): OEM AL2 requirement, indirect prototype protection, confidential data, CAD data with automotive context, direct OEM network access, OEM requirement without level, OEM/Tier-1 role with supporting indicators.

AL1 rules (R-12 to R-13): Weight threshold ≥ 5, expected OEM requirement with weight ≥ 3.

No TISAX need: When none of the above rules apply.`,
    fr: `La classification suit un arbre de décision basé sur des règles avec un ordre d'évaluation strict (AL3 → AL2 → AL1 → aucun besoin). La première règle applicable détermine le résultat. Toutes les règles sont évaluées individuellement dans la Section 3.

Règles AL3 (R-01 à R-04) : Protection des prototypes, données strictement confidentielles, informations prototypes, exigence OEM AL3 explicite.

Règles AL2 (R-05 à R-11) : Exigence OEM AL2, protection indirecte des prototypes, données confidentielles, données CAO avec contexte automobile, accès réseau OEM direct, exigence OEM sans niveau, rôle OEM/Tier-1 avec indicateurs complémentaires.

Règles AL1 (R-12 à R-13) : Seuil de pondération ≥ 5, exigence OEM attendue avec poids ≥ 3.

Aucun besoin TISAX : Si aucune des règles ci-dessus ne s'applique.`,
  },
  methodText: {
    de: `Dieses Protokoll wurde durch ein automatisiertes Klassifikationswerkzeug erstellt und dokumentiert alle Einzelfallentscheidungen gemäß dem Grundsatz der Nachvollziehbarkeit (vgl. IDW PS 460).

Grundlagen:
  • VDA ISA (Information Security Assessment) Kriterienkatalog
  • ENX TISAX (Trusted Information Security Assessment Exchange) Regelwerk
  • Assessment-Level-Definitionen gemäß ENX TISAX Teilnahmebedingungen

Die regelbasierte Klassifikation ist determiniert und reproduzierbar — identische Eingaben führen stets zum selben Ergebnis. Die KI-gestützte Begründung dient der Erläuterung und ist nicht Teil der Entscheidungslogik.

Referenzen:
  • VDA ISA Katalog: https://www.vda.de/de/themen/digitalisierung/informationssicherheit
  • ENX TISAX Portal: https://www.enx.com/tisax/`,
    en: `This protocol was generated by an automated classification tool and documents all individual decisions according to the principle of traceability (cf. ISA 230 Audit Documentation).

Basis:
  • VDA ISA (Information Security Assessment) criteria catalog
  • ENX TISAX (Trusted Information Security Assessment Exchange) framework
  • Assessment level definitions per ENX TISAX participation conditions

The rule-based classification is deterministic and reproducible — identical inputs always produce the same result. The AI-supported reasoning serves as explanation and is not part of the decision logic.

References:
  • VDA ISA Catalog: https://www.vda.de/en/topics/digitalization/information-security
  • ENX TISAX Portal: https://www.enx.com/tisax/`,
    fr: `Ce protocole a été généré par un outil de classification automatisé et documente toutes les décisions individuelles selon le principe de traçabilité (cf. ISA 230 Documentation d'audit).

Base :
  • Catalogue de critères VDA ISA (Information Security Assessment)
  • Cadre ENX TISAX (Trusted Information Security Assessment Exchange)
  • Définitions des niveaux d'évaluation selon les conditions de participation ENX TISAX

La classification basée sur des règles est déterministe et reproductible — des entrées identiques produisent toujours le même résultat. La justification assistée par IA sert d'explication et ne fait pas partie de la logique de décision.

Références :
  • Catalogue VDA ISA : https://www.vda.de/en/topics/digitalization/information-security
  • Portail ENX TISAX : https://www.enx.com/tisax/`,
  },
  disclaimerText: {
    de: 'Dieses Dokument wurde automatisch generiert und ersetzt keine offizielle TISAX-Beratung oder ein akkreditiertes Assessment. Die Einschätzung basiert auf den zum Zeitpunkt der Erstellung gültigen VDA ISA Kriterien und dem ENX TISAX-Regelwerk. Für verbindliche Auskünfte wenden Sie sich bitte an einen akkreditierten TISAX-Prüfdienstleister.',
    en: 'This document was automatically generated and does not replace official TISAX consulting or an accredited assessment. The assessment is based on VDA ISA criteria and ENX TISAX framework valid at the time of generation. For binding information, please contact an accredited TISAX audit provider.',
    fr: 'Ce document a été généré automatiquement et ne remplace pas un conseil TISAX officiel ou une évaluation accréditée. L\'évaluation est basée sur les critères VDA ISA et le cadre ENX TISAX valides au moment de la génération. Pour des informations contraignantes, veuillez contacter un prestataire d\'audit TISAX accrédité.',
  },
};

/* ────── Helpers ────── */

function getRelevanceLabel(weight: number, lang: 'de' | 'en' | 'fr'): string {
  const t = (o: Record<string, string>) => o[lang] || o.en;
  if (weight >= 3) return t(I18N.high);
  if (weight >= 2) return t(I18N.medium);
  if (weight >= 1) return t(I18N.low);
  return t(I18N.notRelevant);
}

/* ────── Rule evaluation ────── */

interface RuleEval {
  id: string;
  level: string;
  condition: string;
  actualValues: string;
  triggered: boolean;
  decisive: boolean;
}

function evaluateAllRules(
  answers: Record<string, ProtocolAnswer>,
  verdict: string,
  lang: 'de' | 'en' | 'fr',
): RuleEval[] {
  const role = answers.role?.value;
  const info = answers.information?.value;
  const proto = answers.prototype?.value;
  const net = answers.network?.value;
  const data = answers.dataclass?.value;
  const oem = answers.oemrequest?.value;
  const hasAuto = role !== 'other' && role !== undefined;
  const totalWeight = Object.values(answers).reduce((s, a) => s + a.weight, 0);
  const t = (o: Record<string, string>) => o[lang] || o.en;
  const val = (key: string) => answers[key]?.label || answers[key]?.value || '–';
  const yn = (b: boolean) => b ? '✓' : '✗';

  let firstTriggered = false;
  const markDecisive = (triggered: boolean): boolean => {
    if (triggered && !firstTriggered) { firstTriggered = true; return true; }
    return false;
  };

  const rules: RuleEval[] = [];
  const push = (id: string, level: string, cond: Record<string, string>, actual: string, trig: boolean) => {
    rules.push({ id, level, condition: t(cond), actualValues: actual, triggered: trig, decisive: markDecisive(trig) });
  };

  push('R-01', 'AL3', { de: 'OEM fordert explizit AL3', en: 'OEM explicitly requires AL3', fr: 'OEM exige explicitement AL3' }, `oemrequest = ${val('oemrequest')}`, oem === 'yes-al3');
  push('R-02', 'AL3', { de: 'Direkter Prototypenschutz UND Automotive-Kontext', en: 'Direct prototype protection AND automotive context', fr: 'Protection directe prototypes ET contexte automobile' }, `prototype = ${val('prototype')}, auto = ${yn(hasAuto)}`, proto === 'direct' && hasAuto);
  push('R-03', 'AL3', { de: 'Streng vertrauliche Daten UND Automotive-Kontext', en: 'Strictly confidential data AND automotive context', fr: 'Données strictement confidentielles ET contexte automobile' }, `dataclass = ${val('dataclass')}, auto = ${yn(hasAuto)}`, data === 'strictly-confidential' && hasAuto);
  push('R-04', 'AL3', { de: 'Prototypen-Informationen UND Automotive-Kontext', en: 'Prototype information AND automotive context', fr: 'Informations prototypes ET contexte automobile' }, `information = ${val('information')}, auto = ${yn(hasAuto)}`, info === 'prototype' && hasAuto);
  push('R-05', 'AL2', { de: 'OEM fordert explizit AL2', en: 'OEM explicitly requires AL2', fr: 'OEM exige explicitement AL2' }, `oemrequest = ${val('oemrequest')}`, oem === 'yes-al2');
  push('R-06', 'AL2', { de: 'Indirekter Prototypenschutz', en: 'Indirect prototype protection', fr: 'Protection indirecte prototypes' }, `prototype = ${val('prototype')}`, proto === 'indirect');
  push('R-07', 'AL2', { de: 'Vertrauliche Daten', en: 'Confidential data', fr: 'Données confidentielles' }, `dataclass = ${val('dataclass')}`, data === 'confidential');
  push('R-08', 'AL2', { de: 'CAD-Daten UND Automotive-Kontext', en: 'CAD data AND automotive context', fr: 'Données CAO ET contexte automobile' }, `information = ${val('information')}, auto = ${yn(hasAuto)}`, info === 'cad' && hasAuto);
  push('R-09', 'AL2', { de: 'Direkter OEM-Netzwerkzugang UND Automotive-Kontext', en: 'Direct OEM network access AND automotive context', fr: 'Accès réseau OEM direct ET contexte automobile' }, `network = ${val('network')}, auto = ${yn(hasAuto)}`, net === 'direct' && hasAuto);
  push('R-10', 'AL2', { de: 'OEM-Anforderung ohne Level', en: 'OEM requirement without level', fr: 'Exigence OEM sans niveau' }, `oemrequest = ${val('oemrequest')}`, oem === 'yes-nolevel');

  const hasSup = info !== 'none' || data !== 'public' || net !== 'no' || proto !== 'no';
  push('R-11', 'AL2', { de: 'OEM/Tier-1-Rolle MIT mind. 1 Indikator', en: 'OEM/Tier-1 role WITH ≥1 indicator', fr: 'Rôle OEM/Tier-1 AVEC ≥1 indicateur' }, `role = ${val('role')}, supporting = ${yn(hasSup)}`, (role === 'oem' || role === 'tier1') && hasSup);
  push('R-12', 'AL1', { de: 'Gesamtgewichtung ≥ 5', en: 'Total weight ≥ 5', fr: 'Poids total ≥ 5' }, `totalWeight = ${totalWeight}`, totalWeight >= 5);
  push('R-13', 'AL1', { de: 'OEM-Anforderung erwartet UND Gewicht ≥ 3', en: 'OEM requirement expected AND weight ≥ 3', fr: 'Exigence OEM attendue ET poids ≥ 3' }, `oemrequest = ${val('oemrequest')}, totalWeight = ${totalWeight}`, oem === 'expected' && totalWeight >= 3);

  return rules;
}

/* ────── Plausibility ────── */

function getPlausibilityWarnings(answers: Record<string, ProtocolAnswer>, lang: 'de' | 'en' | 'fr'): string[] {
  const warnings: string[] = [];
  const t = (o: Record<string, string>) => o[lang] || o.en;
  if (answers.role?.value === 'other') {
    if (answers.prototype?.value === 'direct') warnings.push(t({ de: 'Rolle „Sonstige" steht im Widerspruch zu direktem Prototypen-Kontakt.', en: 'Role "Other" contradicts direct prototype involvement.', fr: 'Rôle « Autre » en contradiction avec l\'implication directe dans les prototypes.' }));
    if (answers.dataclass?.value === 'strictly-confidential') warnings.push(t({ de: 'Rolle „Sonstige" steht im Widerspruch zu streng vertraulichen Daten.', en: 'Role "Other" contradicts strictly confidential data.', fr: 'Rôle « Autre » en contradiction avec des données strictement confidentielles.' }));
  }
  if (answers.information?.value === 'none' && answers.dataclass?.value === 'public') {
    if (answers.oemrequest?.value === 'yes-al3' || answers.oemrequest?.value === 'yes-al2') {
      warnings.push(t({ de: 'OEM-Anforderung vorhanden, aber keine sensiblen Daten angegeben.', en: 'OEM requirement present but no sensitive data indicated.', fr: 'Exigence OEM présente mais aucune donnée sensible indiquée.' }));
    }
  }
  return warnings;
}

/* ══════════════════════════════════════════════════════════════
   PDF Generation — Professional Auditor Report Style
   ══════════════════════════════════════════════════════════════ */

// Colors
const C = {
  darkNavy: [20, 30, 48] as [number, number, number],
  navy: [30, 45, 70] as [number, number, number],
  accent: [0, 90, 140] as [number, number, number],
  bodyText: [50, 50, 55] as [number, number, number],
  lightGray: [120, 120, 125] as [number, number, number],
  ruleStroke: [180, 185, 190] as [number, number, number],
  bgLight: [245, 247, 250] as [number, number, number],
  bgGreen: [235, 248, 235] as [number, number, number],
  bgYellow: [255, 250, 230] as [number, number, number],
  bgRed: [255, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  greenText: [30, 110, 50] as [number, number, number],
  redText: [180, 40, 40] as [number, number, number],
  orangeText: [180, 100, 20] as [number, number, number],
};

export function generateTisaxProtocol(data: ProtocolData): void {
  const { answers, verdict, verdictLabel, reasoning, language: lang, stepLabels, stepQuestions } = data;
  const t = (o: Record<string, string>) => o[lang] || o.en;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const ML = 25; // left margin
  const MR = 20; // right margin
  const CW = W - ML - MR; // content width
  let y = 0;

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const protocolId = `TISAX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // ─── Utility ───
  const ensureSpace = (need: number) => {
    if (y + need > H - 22) {
      doc.addPage();
      y = 30;
    }
  };

  const drawHRule = (thick = false) => {
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(thick ? 0.6 : 0.2);
    doc.line(ML, y, W - MR, y);
    y += thick ? 5 : 3;
  };

  const writeBody = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.bodyText);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, ML + indent, y);
      y += 4.2;
    }
    y += 2;
  };

  const writeSectionHeading = (text: string) => {
    ensureSpace(18);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C.darkNavy);
    doc.text(text, ML, y);
    y += 2;
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.8);
    doc.line(ML, y, ML + 50, y);
    y += 7;
  };

  // ══════════════════════════════════════
  // PAGE 1: COVER
  // ══════════════════════════════════════

  // Top accent bar
  doc.setFillColor(...C.darkNavy);
  doc.rect(0, 0, W, 6, 'F');

  // Thin accent line
  doc.setFillColor(...C.accent);
  doc.rect(0, 6, W, 1.5, 'F');

  // Main title block
  y = 65;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...C.darkNavy);
  doc.text(t(I18N.title), ML, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(15);
  doc.setTextColor(...C.navy);
  doc.text(t(I18N.subtitle), ML, y);
  y += 20;

  // Thin separator
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.4);
  doc.line(ML, y, ML + 80, y);
  y += 15;

  // Cover subtitle
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...C.lightGray);
  const coverLines = t(I18N.coverSub).split('\n');
  for (const cl of coverLines) {
    doc.text(cl, ML, y);
    y += 6;
  }

  // Cover metadata box
  y = 180;
  doc.setFillColor(...C.bgLight);
  doc.roundedRect(ML, y, CW, 42, 2, 2, 'F');
  doc.setDrawColor(...C.ruleStroke);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 42, 2, 2, 'S');

  const metaX = ML + 8;
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.darkNavy);
  doc.text(t(I18N.protocolId), metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(protocolId, metaX + 45, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(t(I18N.generated), metaX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, metaX + 45, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(t(I18N.result), metaX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(verdict === 'AL3' ? C.redText : verdict === 'AL2' ? C.orangeText : verdict === 'AL1' ? C.greenText : C.lightGray));
  doc.text(verdict, metaX + 45, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.bodyText);
  const vLines = doc.splitTextToSize(verdictLabel, CW - 55);
  doc.text(vLines, metaX + 45, y);

  // Confidential stamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.lightGray);
  doc.text(t(I18N.confidential), W - MR, H - 15, { align: 'right' });

  // Bottom accent bar
  doc.setFillColor(...C.darkNavy);
  doc.rect(0, H - 6, W, 6, 'F');

  // ══════════════════════════════════════
  // PAGE 2: TABLE OF CONTENTS
  // ══════════════════════════════════════
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

  const tocItems = [
    I18N.sec1, I18N.sec2, I18N.sec3, I18N.sec4,
    I18N.sec5, I18N.sec6, I18N.sec7, I18N.sec8,
  ];

  for (const item of tocItems) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...C.bodyText);
    doc.text(t(item), ML + 4, y);
    // Dotted leader
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineDashPattern([0.5, 1.5], 0);
    doc.setLineWidth(0.15);
    const textW = doc.getTextWidth(t(item));
    doc.line(ML + 8 + textW, y - 0.5, W - MR, y - 0.5);
    doc.setLineDashPattern([], 0);
    y += 8;
  }

  // ══════════════════════════════════════
  // SECTION 1: Classification Summary
  // ══════════════════════════════════════
  doc.addPage();
  y = 30;

  writeSectionHeading(t(I18N.sec1));

  // Result box
  const resultBg = verdict === 'AL3' ? C.bgRed : verdict === 'AL2' ? C.bgYellow : verdict === 'AL1' ? C.bgGreen : C.bgLight;
  const resultTextColor = verdict === 'AL3' ? C.redText : verdict === 'AL2' ? C.orangeText : verdict === 'AL1' ? C.greenText : C.lightGray;

  doc.setFillColor(...resultBg);
  doc.roundedRect(ML, y, CW, 18, 2, 2, 'F');
  doc.setDrawColor(...resultTextColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, 18, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...resultTextColor);
  doc.text(`${t(I18N.result)}: ${verdict}`, ML + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.bodyText);
  const resultDescLines = doc.splitTextToSize(verdictLabel, CW - 14);
  doc.text(resultDescLines, ML + 6, y + 12.5);
  y += 24;

  const totalWeight = Object.values(answers).reduce((s, a) => s + a.weight, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.bodyText);
  doc.text(`${t(I18N.totalWeight)}: ${totalWeight}`, ML, y);
  y += 10;

  // ══════════════════════════════════════
  // SECTION 2: Evidence Table
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec2));

  // Table header
  const colX = [ML, ML + 42, ML + CW - 45, ML + CW - 14];
  const colW = [42, CW - 87, 31, 14];

  ensureSpace(10);
  doc.setFillColor(...C.darkNavy);
  doc.rect(ML, y - 1, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(t(I18N.criterion), colX[0] + 2, y + 3.5);
  doc.text(t(I18N.answer), colX[1] + 2, y + 3.5);
  doc.text(t(I18N.relevance), colX[2] + 2, y + 3.5);
  doc.text(t(I18N.weight), colX[3] + 1, y + 3.5);
  y += 9;

  let rowIdx = 0;
  for (const [key, val] of Object.entries(answers)) {
    const label = stepLabels[key] || key;
    const relevance = getRelevanceLabel(val.weight, lang);
    
    // Calculate row height dynamically
    const answerLines = doc.splitTextToSize(val.label, colW[1] - 4);
    const rowH = Math.max(10, answerLines.length * 4 + 4);
    
    ensureSpace(rowH + 2);

    // Alternating row background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...C.bgLight);
      doc.rect(ML, y - 1, CW, rowH, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.darkNavy);
    doc.text(label, colX[0] + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.bodyText);
    doc.text(answerLines, colX[1] + 2, y + 3.5);

    // Relevance with color
    const relColor = val.weight >= 3 ? C.redText : val.weight >= 2 ? C.orangeText : val.weight >= 1 ? [140, 120, 20] as [number, number, number] : C.greenText;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...relColor);
    doc.text(relevance, colX[2] + 2, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.bodyText);
    doc.text(String(val.weight), colX[3] + 4, y + 3.5);

    y += rowH;
    
    // Row border
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.1);
    doc.line(ML, y - 1, W - MR, y - 1);
    
    rowIdx++;
  }

  // Sub-question detail for each criterion
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...C.lightGray);
  for (const [key] of Object.entries(answers)) {
    const q = stepQuestions[key] || '';
    if (q) {
      ensureSpace(8);
      const qLines = doc.splitTextToSize(`${stepLabels[key]}: ${q}`, CW - 4);
      doc.text(qLines, ML + 2, y);
      y += qLines.length * 3.5 + 1;
    }
  }
  y += 6;

  // ══════════════════════════════════════
  // SECTION 3: AUDIT TRAIL
  // ══════════════════════════════════════
  writeSectionHeading(`${t(I18N.sec3)} (${t(I18N.sec3sub)})`);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...C.lightGray);
  const introText = t({
    de: 'Nachfolgend werden alle 13 Entscheidungsregeln in der Reihenfolge ihrer Prüfung dokumentiert. Die erste zutreffende Regel bestimmt das Ergebnis.',
    en: 'Below, all 13 decision rules are documented in evaluation order. The first matching rule determines the result.',
    fr: 'Ci-dessous, les 13 règles de décision sont documentées dans l\'ordre d\'évaluation. La première règle applicable détermine le résultat.',
  });
  const introLines = doc.splitTextToSize(introText, CW);
  doc.text(introLines, ML, y);
  y += introLines.length * 4 + 6;

  const rules = evaluateAllRules(answers, verdict, lang);

  // Audit trail table header
  ensureSpace(10);
  doc.setFillColor(...C.darkNavy);
  doc.rect(ML, y - 1, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.white);
  doc.text(t(I18N.rule), ML + 2, y + 3.5);
  doc.text(t(I18N.level), ML + 16, y + 3.5);
  doc.text(t(I18N.condition), ML + 30, y + 3.5);
  doc.text(t(I18N.actualValue), ML + CW - 62, y + 3.5);
  doc.text(t(I18N.status), ML + CW - 18, y + 3.5);
  y += 9;

  let currentLevel = '';
  for (const rule of rules) {
    // Level group header
    if (rule.level !== currentLevel) {
      currentLevel = rule.level;
      ensureSpace(8);
      doc.setFillColor(230, 235, 242);
      doc.rect(ML, y - 1.5, CW, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.navy);
      doc.text(`${currentLevel} ${t({ de: 'Regeln', en: 'Rules', fr: 'Règles' })}`, ML + 2, y + 2);
      y += 7;
    }

    // Calculate row content
    const condLines = doc.splitTextToSize(rule.condition, 55);
    const avLines = doc.splitTextToSize(rule.actualValues, 42);
    const rowH = Math.max(8, Math.max(condLines.length, avLines.length) * 3.5 + 3);

    ensureSpace(rowH + 2);

    // Background for decisive/triggered
    if (rule.decisive) {
      doc.setFillColor(...C.bgGreen);
      doc.rect(ML, y - 1.5, CW, rowH, 'F');
      doc.setDrawColor(...C.greenText);
      doc.setLineWidth(0.4);
      doc.line(ML, y - 1.5, ML, y - 1.5 + rowH); // left accent bar
    } else if (rule.triggered) {
      doc.setFillColor(...C.bgYellow);
      doc.rect(ML, y - 1.5, CW, rowH, 'F');
    }

    // Rule ID
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkNavy);
    doc.text(rule.id, ML + 2, y + 2);

    // Level
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.lightGray);
    doc.text(rule.level, ML + 16, y + 2);

    // Condition
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.bodyText);
    doc.text(condLines, ML + 30, y + 2);

    // Actual values
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text(avLines, ML + CW - 62, y + 2);

    // Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (rule.decisive) {
      doc.setTextColor(...C.greenText);
      doc.text('DECISIVE', ML + CW - 18, y + 2);
    } else if (rule.triggered) {
      doc.setTextColor(...C.orangeText);
      doc.text(t(I18N.yes), ML + CW - 18, y + 2);
    } else {
      doc.setTextColor(...C.ruleStroke);
      doc.text('—', ML + CW - 18, y + 2);
    }

    y += rowH;
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.1);
    doc.line(ML, y - 1, W - MR, y - 1);
  }
  y += 8;

  // ══════════════════════════════════════
  // SECTION 4: Plausibility
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec4));
  const warnings = getPlausibilityWarnings(answers, lang);
  if (warnings.length === 0) {
    // Green box
    ensureSpace(12);
    doc.setFillColor(...C.bgGreen);
    doc.roundedRect(ML, y - 1, CW, 10, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.greenText);
    doc.text('✓  ' + t(I18N.noWarnings), ML + 4, y + 5);
    y += 14;
  } else {
    for (const w of warnings) {
      ensureSpace(12);
      doc.setFillColor(...C.bgYellow);
      doc.roundedRect(ML, y - 1, CW, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...C.orangeText);
      const wLines = doc.splitTextToSize('⚠  ' + w, CW - 8);
      doc.text(wLines, ML + 4, y + 4);
      y += Math.max(12, wLines.length * 4 + 6);
    }
  }
  y += 4;

  // ══════════════════════════════════════
  // SECTION 5: AI Reasoning
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec5));
  writeBody(reasoning);

  // ══════════════════════════════════════
  // SECTION 6: Classification Logic
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec6));
  writeBody(t(I18N.classLogicText));

  // ══════════════════════════════════════
  // SECTION 7: Methodology
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec7));
  writeBody(t(I18N.methodText));

  // ══════════════════════════════════════
  // SECTION 8: Disclaimer
  // ══════════════════════════════════════
  writeSectionHeading(t(I18N.sec8));
  ensureSpace(16);
  doc.setFillColor(...C.bgLight);
  doc.roundedRect(ML, y - 1, CW, 4, 1.5, 1.5, 'F'); // placeholder height, we'll adjust
  const disclaimerLines = doc.splitTextToSize(t(I18N.disclaimerText), CW - 8);
  const disclaimerH = disclaimerLines.length * 4 + 6;
  doc.setFillColor(...C.bgLight);
  doc.roundedRect(ML, y - 1, CW, disclaimerH, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.lightGray);
  doc.text(disclaimerLines, ML + 4, y + 4);
  y += disclaimerH + 4;

  // ══════════════════════════════════════
  // HEADERS & FOOTERS on all pages
  // ══════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    if (i > 1) {
      // Header bar
      doc.setFillColor(...C.darkNavy);
      doc.rect(0, 0, W, 3, 'F');
      doc.setFillColor(...C.accent);
      doc.rect(0, 3, W, 0.5, 'F');

      // Header text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.lightGray);
      doc.text(t(I18N.title), ML, 10);
      doc.text(protocolId, W - MR, 10, { align: 'right' });

      // Header line
      doc.setDrawColor(...C.ruleStroke);
      doc.setLineWidth(0.2);
      doc.line(ML, 13, W - MR, 13);
    }

    // Footer
    doc.setDrawColor(...C.ruleStroke);
    doc.setLineWidth(0.2);
    doc.line(ML, H - 14, W - MR, H - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...C.lightGray);
    doc.text(t(I18N.confidential), ML, H - 9);
    doc.text(`${t(I18N.page)} ${i} ${t(I18N.of)} ${totalPages}`, W - MR, H - 9, { align: 'right' });
  }

  doc.save(`TISAX-Protocol-${verdict}-${now.toISOString().slice(0, 10)}.pdf`);
}
