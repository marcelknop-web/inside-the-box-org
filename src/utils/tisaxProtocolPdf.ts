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
  subtitle: { de: 'Selbstprüfungsbericht zur unabhängigen Nachvollziehbarkeit', en: 'Self-assessment report for independent verifiability', fr: 'Rapport d\'auto-évaluation pour vérification indépendante' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  section1: { de: '1. Zusammenfassung der Einstufung', en: '1. Classification Summary', fr: '1. Résumé de la classification' },
  section2: { de: '2. Detaillierte Antworten und Gewichtung', en: '2. Detailed Answers and Weighting', fr: '2. Réponses détaillées et pondération' },
  section3: { de: '3. KI-gestützte Begründung', en: '3. AI-supported Reasoning', fr: '3. Justification assistée par IA' },
  section4: { de: '4. Klassifikationslogik', en: '4. Classification Logic', fr: '4. Logique de classification' },
  section5: { de: '5. Methodik und Referenzen', en: '5. Methodology and References', fr: '5. Méthodologie et références' },
  section6: { de: '6. Haftungsausschluss', en: '6. Disclaimer', fr: '6. Avertissement' },
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
  classLogicText: {
    de: `Die Klassifikation folgt einem regelbasierten Entscheidungsbaum:

AL3 wird zugewiesen wenn:
- Direkter Prototypenschutz (Entwicklung, Bau, Test)
- Streng vertrauliche Daten (Vorentwicklung, Fahrzeugarchitektur)
- Prototypen-Informationen verarbeitet werden
- Eine explizite OEM-Anforderung mit Assessment Level vorliegt

AL2 wird zugewiesen wenn:
- Indirekter Prototypenschutz (Transport, Lagerung)
- Vertrauliche Daten (Projektpläne, Lieferantenverträge)
- Konstruktions-/Entwicklungsdaten (CAD) verarbeitet werden
- Direkter OEM-Netzwerkzugang besteht
- Organisation ein OEM oder Tier-1 Zulieferer ist
- OEM-Anforderung ohne spezifisches Level vorliegt

AL1 wird zugewiesen wenn:
- Gesamtgewichtung aller Antworten >= 4
- Eine OEM-Anforderung erwartet wird

Kein TISAX-Bedarf wenn keines der obigen Kriterien zutrifft.`,
    en: `Classification follows a rule-based decision tree:

AL3 is assigned when:
- Direct prototype protection (development, build, test)
- Strictly confidential data (pre-development, vehicle architecture)
- Prototype information is processed
- Explicit OEM requirement with Assessment Level exists

AL2 is assigned when:
- Indirect prototype protection (transport, storage)
- Confidential data (project plans, supplier contracts)
- Design/development data (CAD) is processed
- Direct OEM network access exists
- Organization is an OEM or Tier-1 supplier
- OEM requirement without specific level exists

AL1 is assigned when:
- Total weight of all answers >= 4
- OEM requirement is expected

No TISAX need if none of the above criteria apply.`,
    fr: `La classification suit un arbre de décision basé sur des règles :

AL3 est attribué lorsque :
- Protection directe des prototypes (développement, construction, test)
- Données strictement confidentielles (pré-développement, architecture véhicule)
- Des informations sur les prototypes sont traitées
- Une exigence OEM explicite avec niveau d'évaluation existe

AL2 est attribué lorsque :
- Protection indirecte des prototypes (transport, stockage)
- Données confidentielles (plans de projet, contrats fournisseurs)
- Des données de conception/développement (CAO) sont traitées
- Un accès réseau direct OEM existe
- L'organisation est un OEM ou un fournisseur Tier-1
- Une exigence OEM sans niveau spécifique existe

AL1 est attribué lorsque :
- Le poids total de toutes les réponses >= 4
- Une exigence OEM est attendue

Aucun besoin TISAX si aucun des critères ci-dessus ne s'applique.`,
  },
  methodText: {
    de: `Dieses Protokoll wurde durch ein automatisiertes Klassifikationswerkzeug erstellt. Die Bewertung basiert auf:

• VDA ISA (Information Security Assessment) Kriterienkatalog
• ENX TISAX (Trusted Information Security Assessment Exchange) Regelwerk
• Assessment-Level-Definitionen gemäß ENX TISAX Teilnahmebedingungen

Die KI-gestützte Begründung wurde durch ein Large Language Model generiert und dient der Erläuterung des Ergebnisses. Die regelbasierte Klassifikation ist determiniert und reproduzierbar – identische Eingaben führen stets zum selben Ergebnis.

Referenzen:
- VDA ISA Katalog: https://www.vda.de/de/themen/digitalisierung/informationssicherheit
- ENX TISAX Portal: https://www.enx.com/tisax/`,
    en: `This protocol was generated by an automated classification tool. The assessment is based on:

• VDA ISA (Information Security Assessment) criteria catalog
• ENX TISAX (Trusted Information Security Assessment Exchange) framework
• Assessment level definitions per ENX TISAX participation conditions

The AI-supported reasoning was generated by a Large Language Model and serves to explain the result. The rule-based classification is deterministic and reproducible – identical inputs always produce the same result.

References:
- VDA ISA Catalog: https://www.vda.de/en/topics/digitalization/information-security
- ENX TISAX Portal: https://www.enx.com/tisax/`,
    fr: `Ce protocole a été généré par un outil de classification automatisé. L'évaluation est basée sur :

• Catalogue de critères VDA ISA (Information Security Assessment)
• Cadre ENX TISAX (Trusted Information Security Assessment Exchange)
• Définitions des niveaux d'évaluation selon les conditions de participation ENX TISAX

La justification assistée par IA a été générée par un modèle de langage et sert à expliquer le résultat. La classification basée sur des règles est déterministe et reproductible – des entrées identiques produisent toujours le même résultat.

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

  // Header
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

  // Unique protocol ID
  const protocolId = `TISAX-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  doc.text(`Protocol-ID: ${protocolId}`, margin, y);
  y += 10;

  // Section 1: Summary
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

  // Section 2: Detailed answers
  addSectionTitle(t(I18N_PDF.section2));

  // Table header
  const colX = [margin, margin + 40, margin + 40 + 70, margin + 40 + 70 + 20];
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(t(I18N_PDF.criterion), colX[0], y);
  doc.text(t(I18N_PDF.answer), colX[1], y);
  doc.text(t(I18N_PDF.weight), colX[2], y);
  doc.text(t(I18N_PDF.relevanceLabel), colX[3], y);
  y += 2;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const [key, val] of Object.entries(answers)) {
    checkPage(12);
    const label = stepLabels[key] || key;
    const relevance = getRelevanceLabel(val.weight, lang);

    doc.setTextColor(50, 50, 50);
    doc.text(label, colX[0], y, { maxWidth: 38 });
    
    const answerLines = doc.splitTextToSize(val.label, 65);
    doc.text(answerLines, colX[1], y);
    
    doc.text(String(val.weight), colX[2], y);
    doc.text(relevance, colX[3], y);
    
    const lineHeight = Math.max(answerLines.length * 4, 5);
    y += lineHeight + 3;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, y - 1, pageWidth - margin, y - 1);
    y += 2;
  }

  // Add detailed questions
  y += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  checkPage(8);
  const detailTitle = lang === 'de' ? 'Gestellte Fragen im Detail:' : lang === 'fr' ? 'Questions posées en détail :' : 'Questions asked in detail:';
  doc.text(detailTitle, margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  for (const [key, val] of Object.entries(answers)) {
    checkPage(16);
    const q = stepQuestions[key] || key;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const qLines = doc.splitTextToSize(`${stepLabels[key] || key}: ${q}`, contentWidth);
    doc.text(qLines, margin, y);
    y += qLines.length * 4 + 1;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text(`→ ${val.label}  (${t(I18N_PDF.weight)}: ${val.weight}, ${t(I18N_PDF.relevanceLabel)}: ${getRelevanceLabel(val.weight, lang)})`, margin + 3, y);
    y += 7;
  }
  y += 4;

  // Section 3: AI Reasoning
  addSectionTitle(t(I18N_PDF.section3));
  addBody(reasoning);

  // Section 4: Classification Logic
  addSectionTitle(t(I18N_PDF.section4));
  addBody(t(I18N_PDF.classLogicText));

  // Section 5: Methodology
  addSectionTitle(t(I18N_PDF.section5));
  addBody(t(I18N_PDF.methodText));

  // Section 6: Disclaimer
  addSectionTitle(t(I18N_PDF.section6));
  addBody(t(I18N_PDF.disclaimerText));

  // Footer on all pages
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
