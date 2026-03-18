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

const I18N_PDF = {
  title: { de: 'TISAX Einstufungsprüfung – Bewertungsprotokoll', en: 'TISAX Assessment Check – Evaluation Protocol', fr: 'TISAX Classification Check – Protocole d\'évaluation' },
  subtitle: { de: 'Arbeitspapiere zur unabhängigen Nachvollziehbarkeit aller Einzelfallentscheidungen', en: 'Working papers for independent traceability of all individual decisions', fr: 'Papiers de travail pour la traçabilité indépendante de toutes les décisions' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  section1: { de: '1. Zusammenfassung der Einstufung', en: '1. Classification Summary', fr: '1. Résumé de la classification' },
  section2: { de: '2. Erhobene Sachverhalte (Evidenz)', en: '2. Collected Facts (Evidence)', fr: '2. Faits collectés (Preuves)' },
  section3: { de: '3. Prüfung aller Entscheidungsregeln (Audit Trail)', en: '3. Evaluation of All Decision Rules (Audit Trail)', fr: '3. Évaluation de toutes les règles de décision (Piste d\'audit)' },
  section4: { de: '4. Plausibilitätsprüfung', en: '4. Plausibility Check', fr: '4. Contrôle de plausibilité' },
  section5: { de: '5. KI-gestützte Begründung', en: '5. AI-supported Reasoning', fr: '5. Justification assistée par IA' },
  section6: { de: '6. Klassifikationslogik (Referenz)', en: '6. Classification Logic (Reference)', fr: '6. Logique de classification (Référence)' },
  section7: { de: '7. Methodik und Referenzen', en: '7. Methodology and References', fr: '7. Méthodologie et références' },
  section8: { de: '8. Haftungsausschluss', en: '8. Disclaimer', fr: '8. Avertissement' },
  result: { de: 'Ergebnis', en: 'Result', fr: 'Résultat' },
  criterion: { de: 'Kriterium', en: 'Criterion', fr: 'Critère' },
  answer: { de: 'Antwort', en: 'Answer', fr: 'Réponse' },
  relevanceLabel: { de: 'Relevanz', en: 'Relevance', fr: 'Pertinence' },
  weight: { de: 'Gewicht', en: 'Weight', fr: 'Poids' },
  question: { de: 'Frage', en: 'Question', fr: 'Question' },
  totalWeight: { de: 'Gesamtgewichtung', en: 'Total Weight', fr: 'Poids total' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  low: { de: 'Gering', en: 'Low', fr: 'Faible' },
  notRelevant: { de: 'Nicht relevant', en: 'Not relevant', fr: 'Non pertinent' },
  ruleLabel: { de: 'Regel', en: 'Rule', fr: 'Règle' },
  condition: { de: 'Bedingung', en: 'Condition', fr: 'Condition' },
  actualValue: { de: 'Ist-Wert', en: 'Actual Value', fr: 'Valeur réelle' },
  triggered: { de: 'Ausgelöst', en: 'Triggered', fr: 'Déclenché' },
  decisive: { de: 'Entscheidend', en: 'Decisive', fr: 'Décisif' },
  yes: { de: 'Ja', en: 'Yes', fr: 'Oui' },
  no: { de: 'Nein', en: 'No', fr: 'Non' },
  noWarnings: { de: 'Keine Plausibilitätshinweise – alle Angaben sind widerspruchsfrei.', en: 'No plausibility warnings – all inputs are consistent.', fr: 'Aucun avis de plausibilité – toutes les données sont cohérentes.' },
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

Die regelbasierte Klassifikation ist determiniert und reproduzierbar – identische Eingaben führen stets zum selben Ergebnis. Die KI-gestützte Begründung dient der Erläuterung und ist nicht Teil der Entscheidungslogik.

Referenzen:
- VDA ISA Katalog: https://www.vda.de/de/themen/digitalisierung/informationssicherheit
- ENX TISAX Portal: https://www.enx.com/tisax/`,
    en: `This protocol was generated by an automated classification tool and documents all individual decisions according to the principle of traceability (cf. ISA 230 Audit Documentation).

Basis:
• VDA ISA (Information Security Assessment) criteria catalog
• ENX TISAX (Trusted Information Security Assessment Exchange) framework
• Assessment level definitions per ENX TISAX participation conditions

The rule-based classification is deterministic and reproducible – identical inputs always produce the same result. The AI-supported reasoning serves as explanation and is not part of the decision logic.

References:
- VDA ISA Catalog: https://www.vda.de/en/topics/digitalization/information-security
- ENX TISAX Portal: https://www.enx.com/tisax/`,
    fr: `Ce protocole a été généré par un outil de classification automatisé et documente toutes les décisions individuelles selon le principe de traçabilité (cf. ISA 230 Documentation d'audit).

Base :
• Catalogue de critères VDA ISA (Information Security Assessment)
• Cadre ENX TISAX (Trusted Information Security Assessment Exchange)
• Définitions des niveaux d'évaluation selon les conditions de participation ENX TISAX

La classification basée sur des règles est déterministe et reproductible – des entrées identiques produisent toujours le même résultat. La justification assistée par IA sert d'explication et ne fait pas partie de la logique de décision.

Références :
- Catalogue VDA ISA : https://www.vda.de/en/topics/digitalization/information-security
- Portail ENX TISAX : https://www.enx.com/tisax/`,
  },
  disclaimerText: {
    de: 'Dieses Dokument wurde automatisch generiert und ersetzt keine offizielle TISAX-Beratung oder ein akkreditiertes Assessment. Die Einschätzung basiert auf den zum Zeitpunkt der Erstellung gültigen VDA ISA Kriterien und dem ENX TISAX-Regelwerk. Für verbindliche Auskünfte wenden Sie sich bitte an einen akkreditierten TISAX-Prüfdienstleister.',
    en: 'This document was automatically generated and does not replace official TISAX consulting or an accredited assessment. The assessment is based on VDA ISA criteria and ENX TISAX framework valid at the time of generation. For binding information, please contact an accredited TISAX audit provider.',
    fr: 'Ce document a été généré automatiquement et ne remplace pas un conseil TISAX officiel ou une évaluation accréditée. L\'évaluation est basée sur les critères VDA ISA et le cadre ENX TISAX valides au moment de la génération. Pour des informations contraignantes, veuillez contacter un prestataire d\'audit TISAX accrédité.',
  },
};

function getRelevanceLabel(weight: number, lang: 'de' | 'en' | 'fr'): string {
  if (weight >= 3) return I18N_PDF.high[lang];
  if (weight >= 2) return I18N_PDF.medium[lang];
  if (weight >= 1) return I18N_PDF.low[lang];
  return I18N_PDF.notRelevant[lang];
}

/* ────── Audit Trail: evaluate every rule individually ────── */

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
  const hasAutomotiveContext = role !== 'other' && role !== undefined;
  const totalWeight = Object.values(answers).reduce((s, a) => s + a.weight, 0);

  const t = (obj: Record<string, string>) => obj[lang] || obj.en;
  const val = (key: string) => answers[key]?.label || answers[key]?.value || '–';
  const yesNo = (b: boolean) => b ? '✓' : '✗';

  let firstTriggered = false;
  const markDecisive = (triggered: boolean): boolean => {
    if (triggered && !firstTriggered) { firstTriggered = true; return true; }
    return false;
  };

  const rules: RuleEval[] = [];

  // AL3 rules
  const r01 = oem === 'yes-al3';
  rules.push({ id: 'R-01', level: 'AL3', condition: t({ de: 'OEM fordert explizit AL3', en: 'OEM explicitly requires AL3', fr: 'OEM exige explicitement AL3' }), actualValues: `oemrequest = ${val('oemrequest')}`, triggered: r01, decisive: markDecisive(r01) });

  const r02 = proto === 'direct' && hasAutomotiveContext;
  rules.push({ id: 'R-02', level: 'AL3', condition: t({ de: 'Direkter Prototypenschutz UND Automotive-Kontext', en: 'Direct prototype protection AND automotive context', fr: 'Protection directe des prototypes ET contexte automobile' }), actualValues: `prototype = ${val('prototype')}, automotive = ${yesNo(hasAutomotiveContext)}`, triggered: r02, decisive: markDecisive(r02) });

  const r03 = data === 'strictly-confidential' && hasAutomotiveContext;
  rules.push({ id: 'R-03', level: 'AL3', condition: t({ de: 'Streng vertrauliche Daten UND Automotive-Kontext', en: 'Strictly confidential data AND automotive context', fr: 'Données strictement confidentielles ET contexte automobile' }), actualValues: `dataclass = ${val('dataclass')}, automotive = ${yesNo(hasAutomotiveContext)}`, triggered: r03, decisive: markDecisive(r03) });

  const r04 = info === 'prototype' && hasAutomotiveContext;
  rules.push({ id: 'R-04', level: 'AL3', condition: t({ de: 'Prototypen-Informationen verarbeitet UND Automotive-Kontext', en: 'Prototype information processed AND automotive context', fr: 'Informations prototypes traitées ET contexte automobile' }), actualValues: `information = ${val('information')}, automotive = ${yesNo(hasAutomotiveContext)}`, triggered: r04, decisive: markDecisive(r04) });

  // AL2 rules
  const r05 = oem === 'yes-al2';
  rules.push({ id: 'R-05', level: 'AL2', condition: t({ de: 'OEM fordert explizit AL2', en: 'OEM explicitly requires AL2', fr: 'OEM exige explicitement AL2' }), actualValues: `oemrequest = ${val('oemrequest')}`, triggered: r05, decisive: markDecisive(r05) });

  const r06 = proto === 'indirect';
  rules.push({ id: 'R-06', level: 'AL2', condition: t({ de: 'Indirekter Prototypenschutz (Transport, Lagerung)', en: 'Indirect prototype protection (transport, storage)', fr: 'Protection indirecte des prototypes (transport, stockage)' }), actualValues: `prototype = ${val('prototype')}`, triggered: r06, decisive: markDecisive(r06) });

  const r07 = data === 'confidential';
  rules.push({ id: 'R-07', level: 'AL2', condition: t({ de: 'Vertrauliche Daten (Projektpläne, Verträge)', en: 'Confidential data (project plans, contracts)', fr: 'Données confidentielles (plans de projet, contrats)' }), actualValues: `dataclass = ${val('dataclass')}`, triggered: r07, decisive: markDecisive(r07) });

  const r08 = info === 'cad' && hasAutomotiveContext;
  rules.push({ id: 'R-08', level: 'AL2', condition: t({ de: 'CAD-/Konstruktionsdaten UND Automotive-Kontext', en: 'CAD/design data AND automotive context', fr: 'Données CAO/conception ET contexte automobile' }), actualValues: `information = ${val('information')}, automotive = ${yesNo(hasAutomotiveContext)}`, triggered: r08, decisive: markDecisive(r08) });

  const r09 = net === 'direct' && hasAutomotiveContext;
  rules.push({ id: 'R-09', level: 'AL2', condition: t({ de: 'Direkter OEM-Netzwerkzugang UND Automotive-Kontext', en: 'Direct OEM network access AND automotive context', fr: 'Accès réseau OEM direct ET contexte automobile' }), actualValues: `network = ${val('network')}, automotive = ${yesNo(hasAutomotiveContext)}`, triggered: r09, decisive: markDecisive(r09) });

  const r10 = oem === 'yes-nolevel';
  rules.push({ id: 'R-10', level: 'AL2', condition: t({ de: 'OEM-Anforderung ohne spezifisches Level', en: 'OEM requirement without specific level', fr: 'Exigence OEM sans niveau spécifique' }), actualValues: `oemrequest = ${val('oemrequest')}`, triggered: r10, decisive: markDecisive(r10) });

  const hasSupporting = info !== 'none' || data !== 'public' || net !== 'no' || proto !== 'no';
  const r11 = (role === 'oem' || role === 'tier1') && hasSupporting;
  rules.push({ id: 'R-11', level: 'AL2', condition: t({ de: 'OEM/Tier-1-Rolle MIT mind. 1 unterstützendem Indikator', en: 'OEM/Tier-1 role WITH at least 1 supporting indicator', fr: 'Rôle OEM/Tier-1 AVEC au moins 1 indicateur complémentaire' }), actualValues: `role = ${val('role')}, supporting = ${yesNo(hasSupporting)} (info≠none: ${yesNo(info !== 'none')}, data≠public: ${yesNo(data !== 'public')}, net≠no: ${yesNo(net !== 'no')}, proto≠no: ${yesNo(proto !== 'no')})`, triggered: r11, decisive: markDecisive(r11) });

  // AL1 rules
  const r12 = totalWeight >= 5;
  rules.push({ id: 'R-12', level: 'AL1', condition: t({ de: 'Gesamtgewichtung ≥ 5', en: 'Total weight ≥ 5', fr: 'Poids total ≥ 5' }), actualValues: `totalWeight = ${totalWeight}`, triggered: r12, decisive: markDecisive(r12) });

  const r13 = oem === 'expected' && totalWeight >= 3;
  rules.push({ id: 'R-13', level: 'AL1', condition: t({ de: 'OEM-Anforderung erwartet UND Gewichtung ≥ 3', en: 'OEM requirement expected AND weight ≥ 3', fr: 'Exigence OEM attendue ET poids ≥ 3' }), actualValues: `oemrequest = ${val('oemrequest')}, totalWeight = ${totalWeight}`, triggered: r13, decisive: markDecisive(r13) });

  return rules;
}

/* ────── Plausibility warnings (mirrored from component) ────── */

function getPlausibilityWarnings(answers: Record<string, ProtocolAnswer>, lang: 'de' | 'en' | 'fr'): string[] {
  const warnings: string[] = [];
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  if (answers.role?.value === 'other') {
    if (answers.prototype?.value === 'direct') {
      warnings.push(t({ de: 'Rolle „Sonstige" steht im Widerspruch zu direktem Prototypen-Kontakt.', en: 'Role "Other" contradicts direct prototype involvement.', fr: 'Rôle « Autre » en contradiction avec l\'implication directe dans les prototypes.' }));
    }
    if (answers.dataclass?.value === 'strictly-confidential') {
      warnings.push(t({ de: 'Rolle „Sonstige" steht im Widerspruch zu streng vertraulichen Daten.', en: 'Role "Other" contradicts strictly confidential data.', fr: 'Rôle « Autre » en contradiction avec des données strictement confidentielles.' }));
    }
  }
  if (answers.information?.value === 'none' && answers.dataclass?.value === 'public') {
    if (answers.oemrequest?.value === 'yes-al3' || answers.oemrequest?.value === 'yes-al2') {
      warnings.push(t({ de: 'OEM-Anforderung vorhanden, aber keine sensiblen Daten angegeben.', en: 'OEM requirement present but no sensitive data indicated.', fr: 'Exigence OEM présente mais aucune donnée sensible indiquée.' }));
    }
  }
  return warnings;
}

/* ────── PDF Generation ────── */

export function generateTisaxProtocol(data: ProtocolData): void {
  const { answers, verdict, verdictLabel, reasoning, language: lang, stepLabels, stepQuestions } = data;
  const t = (obj: Record<string, string>) => obj[lang] || obj.en;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  const addSectionTitle = (text: string) => {
    checkPage(15);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(text, margin, y);
    y += 3;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  const addBody = (text: string) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      checkPage(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  };

  // ═══════════ HEADER ═══════════
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(t(I18N_PDF.title), margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(t(I18N_PDF.subtitle), margin, y);
  y += 6;

  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  doc.text(`${t(I18N_PDF.generated)}: ${dateStr}`, margin, y);
  y += 4;

  const protocolId = `TISAX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  doc.text(`Protocol-ID: ${protocolId}`, margin, y);
  y += 10;

  // ═══════════ SECTION 1: Summary ═══════════
  addSectionTitle(t(I18N_PDF.section1));
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${t(I18N_PDF.result)}: ${verdictLabel}`, margin, y);
  y += 6;

  const totalWeight = Object.values(answers).reduce((s, a) => s + a.weight, 0);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`${t(I18N_PDF.totalWeight)}: ${totalWeight}`, margin, y);
  y += 10;

  // ═══════════ SECTION 2: Evidence table ═══════════
  addSectionTitle(t(I18N_PDF.section2));

  // Compact evidence table
  for (const [key, val] of Object.entries(answers)) {
    checkPage(18);
    const label = stepLabels[key] || key;
    const q = stepQuestions[key] || key;
    const relevance = getRelevanceLabel(val.weight, lang);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(`${label}`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    const qLines = doc.splitTextToSize(q, contentWidth - 2);
    doc.text(qLines, margin + 1, y + 4);
    y += 4 + qLines.length * 3.5;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const aLines = doc.splitTextToSize(`-> ${val.label}`, contentWidth - 6);
    doc.text(aLines, margin + 3, y);
    y += aLines.length * 4;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`[${t(I18N_PDF.weight)}: ${val.weight} | ${t(I18N_PDF.relevanceLabel)}: ${relevance}]`, margin + 3, y);
    y += 6;

    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 2;
  }
  y += 4;

  // ═══════════ SECTION 3: AUDIT TRAIL ═══════════
  addSectionTitle(t(I18N_PDF.section3));

  const rules = evaluateAllRules(answers, verdict, lang);

  // Intro text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  const introText = t({
    de: 'Nachfolgend werden alle 13 Entscheidungsregeln in der Reihenfolge ihrer Prüfung dokumentiert. Die Regeln werden sequentiell von AL3 nach AL1 ausgewertet. Die erste zutreffende Regel (markiert als „Entscheidend") bestimmt das Ergebnis.',
    en: 'Below, all 13 decision rules are documented in evaluation order. Rules are evaluated sequentially from AL3 to AL1. The first matching rule (marked as "Decisive") determines the result.',
    fr: 'Ci-dessous, les 13 règles de décision sont documentées dans l\'ordre d\'évaluation. Les règles sont évaluées séquentiellement de AL3 à AL1. La première règle applicable (marquée « Décisif ») détermine le résultat.',
  });
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 4 + 6;

  // Rule-by-rule evaluation
  let currentLevel = '';
  for (const rule of rules) {
    checkPage(28);

    // Level header
    if (rule.level !== currentLevel) {
      currentLevel = rule.level;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      const levelHeader = `── ${currentLevel} ${t({ de: 'Regeln', en: 'Rules', fr: 'Règles' })} ──`;
      doc.text(levelHeader, margin, y);
      y += 6;
    }

    // Rule box
    const boxY = y - 2;
    const triggered = rule.triggered;
    const decisive = rule.decisive;

    // Background shading for triggered/decisive rules
    if (decisive) {
      doc.setFillColor(220, 240, 220);
      doc.rect(margin, boxY, contentWidth, 20, 'F');
    } else if (triggered) {
      doc.setFillColor(240, 240, 220);
      doc.rect(margin, boxY, contentWidth, 20, 'F');
    }

    // Rule ID + status
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    const statusIcon = decisive ? '[ENTSCHEIDEND]' : triggered ? '[+]' : '[-]';
    doc.text(`${rule.id} ${statusIcon}`, margin + 2, y + 1);

    // Level badge
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(rule.level, margin + contentWidth - 10, y + 1);

    // Condition
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const condLines = doc.splitTextToSize(`${t(I18N_PDF.condition)}: ${rule.condition}`, contentWidth - 6);
    doc.text(condLines, margin + 3, y);
    y += condLines.length * 3.5;

    // Actual values
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const avLines = doc.splitTextToSize(`${t(I18N_PDF.actualValue)}: ${rule.actualValues}`, contentWidth - 6);
    doc.text(avLines, margin + 3, y);
    y += avLines.length * 3.5;

    // Result
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(triggered ? 34 : 150, triggered ? 120 : 150, triggered ? 34 : 150);
    const resultText = `${t(I18N_PDF.triggered)}: ${triggered ? t(I18N_PDF.yes) : t(I18N_PDF.no)}${decisive ? ` | ${t(I18N_PDF.decisive)}: ${t(I18N_PDF.yes)}` : ''}`;
    doc.text(resultText, margin + 3, y);
    y += 7;

    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 3;
  }
  y += 4;

  // ═══════════ SECTION 4: Plausibility ═══════════
  addSectionTitle(t(I18N_PDF.section4));
  const warnings = getPlausibilityWarnings(answers, lang);
  if (warnings.length === 0) {
    addBody(t(I18N_PDF.noWarnings));
  } else {
    for (const w of warnings) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 120, 0);
      checkPage(6);
      const wLines = doc.splitTextToSize(`! ${w}`, contentWidth - 4);
      doc.text(wLines, margin + 2, y);
      y += wLines.length * 4 + 3;
    }
  }
  y += 4;

  // ═══════════ SECTION 5: AI Reasoning ═══════════
  addSectionTitle(t(I18N_PDF.section5));
  addBody(reasoning);

  // ═══════════ SECTION 6: Classification Logic ═══════════
  addSectionTitle(t(I18N_PDF.section6));
  addBody(t(I18N_PDF.classLogicText));

  // ═══════════ SECTION 7: Methodology ═══════════
  addSectionTitle(t(I18N_PDF.section7));
  addBody(t(I18N_PDF.methodText));

  // ═══════════ SECTION 8: Disclaimer ═══════════
  addSectionTitle(t(I18N_PDF.section8));
  addBody(t(I18N_PDF.disclaimerText));

  // ═══════════ FOOTER ═══════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`${protocolId}  |  ${t(I18N_PDF.title)}  |  ${i}/${totalPages}`, margin, pageHeight - 8);
  }

  doc.save(`TISAX-Protocol-${verdict}-${now.toISOString().slice(0, 10)}.pdf`);
}
