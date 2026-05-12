// EU AI Act Readiness Report — typeset with shared pdfCore engine.
// Mirrors the print-grade structure of the NIS-2 report: cover, TOC, KPIs,
// charts, structured findings, roadmap and methodology.
import type { AiActIntakeData, AiActRisk, AiActReq, AiRiskClass } from '@/data/aiActData';
import { riskId, RISK_CATEGORIES, CLASS_META } from '@/data/aiActData';
import { createPdfDoc, C, LAYOUT, humanizeText, humanizeEvidence } from '@/utils/pdfCore';

export interface AiActReportData {
  intakeData: AiActIntakeData;
  risks: AiActRisk[];
  reqs: AiActReq[];
  language: 'de' | 'en' | 'fr';
  classification: AiRiskClass;
  isDraft?: boolean;
}

const I = (de: string, en: string, fr: string, lang: string) =>
  lang === 'de' ? de : lang === 'fr' ? fr : en;

const sevLabel = (score: number, lang: string) => {
  if (score >= 20) return I('KRITISCH', 'CRITICAL', 'CRITIQUE', lang);
  if (score >= 13) return I('HOCH', 'HIGH', 'ÉLEVÉ', lang);
  if (score >= 6)  return I('MITTEL', 'MEDIUM', 'MOYEN', lang);
  return I('NIEDRIG', 'LOW', 'FAIBLE', lang);
};

export async function generateAiActReport(data: AiActReportData): Promise<void> {
  const { intakeData, risks, reqs, language: lang, classification, isDraft } = data;
  const today = new Date().toLocaleDateString(
    lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-US',
    { day: '2-digit', month: 'long', year: 'numeric' },
  );
  const classLabel = CLASS_META[classification][lang as 'de'|'en'|'fr'];

  const pdf = await createPdfDoc({
    lang, isDraft,
    reportPrefix: 'AI-ACT',
    confidentialLabel: I('VERTRAULICH', 'CONFIDENTIAL', 'CONFIDENTIEL', lang),
    pageLabel: I('Seite', 'Page', 'Page', lang),
    draftWatermark: I('ENTWURF', 'DRAFT', 'BROUILLON', lang),
  });

  // ── Aggregates ──
  const critRisks = risks.filter(r => r.likelihood * r.impact >= 20);
  const highRisks = risks.filter(r => { const s = r.likelihood * r.impact; return s >= 13 && s < 20; });
  const medRisks  = risks.filter(r => { const s = r.likelihood * r.impact; return s >= 6 && s < 13; });
  const lowRisks  = risks.filter(r => r.likelihood * r.impact < 6);
  const passReqs    = reqs.filter(r => r.status === 'pass');
  const partialReqs = reqs.filter(r => r.status === 'partial');
  const failReqs    = reqs.filter(r => r.status === 'fail');
  const totalReqs   = reqs.length || 1;
  const complianceRate = Math.round(((passReqs.length + partialReqs.length * 0.5) / totalReqs) * 100);
  const isProhibited = classification === 'prohibited';
  const isCompliant  = !isProhibited && critRisks.length === 0 && failReqs.length === 0;
  const isConditional = !isCompliant && !isProhibited && complianceRate >= 60;

  // ════════════════════════════════════════════════════════════
  //  COVER
  // ════════════════════════════════════════════════════════════
  pdf.coverPage({
    title: I('EU-AI-Act-Readiness', 'EU AI Act Readiness', 'Préparation EU AI Act', lang),
    subtitle: I(
      'Konformitätsbewertung nach Verordnung (EU) 2024/1689',
      'Compliance assessment per Regulation (EU) 2024/1689',
      'Évaluation de conformité selon le règlement (UE) 2024/1689',
      lang,
    ),
    entityName: intakeData.entityName || '—',
    fields: [
      [I('System', 'System', 'Système', lang), intakeData.systemName || '—'],
      [I('Klassifizierung', 'Classification', 'Classification', lang), classLabel],
      [I('Erstellt am', 'Generated on', 'Généré le', lang), today],
      [I('Bericht-Nr.', 'Report No.', 'Rapport N°', lang), pdf.reportId],
    ],
    confidentialNote:
      I('VERTRAULICH', 'CONFIDENTIAL', 'CONFIDENTIEL', lang) + '  —  ' +
      I('Nur für den internen Gebrauch des Empfängers bestimmt',
        'For internal use of the recipient only',
        'Réservé à l\'usage interne du destinataire', lang),
  });

  // ════════════════════════════════════════════════════════════
  //  TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════
  const TOC = {
    sec1: I('1  Zusammenfassung für die Geschäftsleitung', '1  Management Summary', '1  Synthèse pour la direction', lang),
    sec2: I('2  Konformitätserklärung', '2  Compliance Statement', '2  Déclaration de conformité', lang),
    sec3: I('3  Gegenstand der Prüfung', '3  Scope of Assessment', '3  Périmètre de l\'évaluation', lang),
    sec3a: I('3.1  Einrichtung und Rolle', '3.1  Entity and Role', '3.1  Entité et rôle', lang),
    sec3b: I('3.2  KI-System', '3.2  AI System', '3.2  Système IA', lang),
    sec3c: I('3.3  Implementierte Maßnahmen', '3.3  Implemented Measures', '3.3  Mesures mises en œuvre', lang),
    sec4: I('4  Feststellungen', '4  Findings', '4  Constatations', lang),
    sec4a: I('4.1  Risikolandschaft', '4.1  Risk Landscape', '4.1  Paysage des risques', lang),
    sec4b: I('4.2  AI-Act-Konformitätslücken', '4.2  AI Act Compliance Gaps', '4.2  Lacunes de conformité AI Act', lang),
    sec5: I('5  Handlungsempfehlungen und Roadmap', '5  Recommendations and Roadmap', '5  Recommandations et feuille de route', lang),
    sec6: I('6  Methodik', '6  Methodology', '6  Méthodologie', lang),
  };
  pdf.tableOfContents(
    I('Inhaltsverzeichnis', 'Table of Contents', 'Table des matières', lang),
    [TOC.sec1, TOC.sec2, TOC.sec3, '    ' + TOC.sec3a, '    ' + TOC.sec3b, '    ' + TOC.sec3c,
     TOC.sec4, '    ' + TOC.sec4a, '    ' + TOC.sec4b, TOC.sec5, TOC.sec6],
  );

  // ════════════════════════════════════════════════════════════
  //  1  MANAGEMENT SUMMARY
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec1);
  pdf.heading(TOC.sec1, 1);

  pdf.introText(I(
    'Die EU-Verordnung 2024/1689 (AI Act) verpflichtet Anbieter und Betreiber von KI-Systemen zu risikobasierten Pflichten — von Verbotstatbeständen (Art. 5) über Hochrisiko-Anforderungen (Art. 9-15) bis zu GPAI-Modellpflichten (Art. 53, 55) und Transparenzregeln (Art. 50).',
    'Regulation (EU) 2024/1689 (AI Act) imposes risk-based duties on providers and deployers of AI systems — from prohibited practices (Art. 5) to high-risk requirements (Art. 9-15), GPAI obligations (Art. 53, 55) and transparency rules (Art. 50).',
    'Le règlement (UE) 2024/1689 (AI Act) impose des obligations fondées sur le risque — pratiques interdites (Art. 5), exigences à haut risque (Art. 9-15), obligations GPAI (Art. 53, 55) et transparence (Art. 50).',
    lang,
  ));

  pdf.kpiRow([
    [String(risks.length),       I('Risiken', 'Risks', 'Risques', lang)],
    [String(critRisks.length),   I('Kritisch', 'Critical', 'Critiques', lang)],
    [String(failReqs.length),    I('Lücken', 'Gaps', 'Lacunes', lang)],
    [`${complianceRate}%`,       I('Konformität', 'Compliance', 'Conformité', lang)],
  ]);

  // Verdict box
  const verdictText = isProhibited
    ? I(
        `Das KI-System "${intakeData.systemName || '—'}" weist Indikatoren einer nach Art. 5 verbotenen Praxis auf. Eine Inverkehrbringung oder Inbetriebnahme im Geltungsbereich der Verordnung ist unzulässig.`,
        `The AI system "${intakeData.systemName || '—'}" exhibits indicators of a prohibited practice under Art. 5. Placement on the market or putting into service within the scope of the Regulation is not permitted.`,
        `Le système IA "${intakeData.systemName || '—'}" présente des indicateurs d'une pratique interdite (Art. 5). Sa mise sur le marché est illicite.`,
        lang)
    : isCompliant
    ? I(
        `${intakeData.entityName || '—'} erfüllt für das System "${intakeData.systemName || '—'}" (${classLabel}) die geprüften Anforderungen des AI Act ohne kritische Befunde.`,
        `${intakeData.entityName || '—'} meets the assessed AI Act requirements for "${intakeData.systemName || '—'}" (${classLabel}) without critical findings.`,
        `${intakeData.entityName || '—'} satisfait les exigences évaluées pour "${intakeData.systemName || '—'}" (${classLabel}) sans constatations critiques.`,
        lang)
    : isConditional
    ? I(
        `${intakeData.entityName || '—'} erreicht eine gewichtete AI-Act-Konformität von ${complianceRate} %. ${critRisks.length} kritische Risiken und ${failReqs.length} Konformitätslücken erfordern adressierte Nachbesserung gemäß Roadmap.`,
        `${intakeData.entityName || '—'} reaches ${complianceRate}% weighted AI Act compliance. ${critRisks.length} critical risks and ${failReqs.length} gaps require remediation per the roadmap.`,
        `${intakeData.entityName || '—'} atteint ${complianceRate} % de conformité pondérée. ${critRisks.length} risques critiques et ${failReqs.length} lacunes requièrent une remédiation.`,
        lang)
    : I(
        `${intakeData.entityName || '—'} erfüllt die geprüften AI-Act-Anforderungen derzeit nicht hinreichend (${complianceRate} %). Bei einer Marktüberwachung sind Sanktionen nach Art. 99 (bis zu 35 Mio. EUR oder 7 % Jahresumsatz) möglich.`,
        `${intakeData.entityName || '—'} does not currently meet the assessed AI Act requirements adequately (${complianceRate}%). Market surveillance may result in sanctions under Art. 99 (up to EUR 35M or 7% turnover).`,
        `${intakeData.entityName || '—'} ne satisfait pas suffisamment aux exigences (${complianceRate} %). Sanctions possibles selon Art. 99.`,
        lang);
  pdf.verdictBox(verdictText);

  // Charts
  pdf.complianceBar(passReqs.length, partialReqs.length, failReqs.length, {
    pass: I('Konform', 'Compliant', 'Conforme', lang),
    partial: I('Teilweise', 'Partial', 'Partiel', lang),
    fail: I('Nicht konform', 'Non-compliant', 'Non conforme', lang),
    title: I('Konformitätsverteilung', 'Compliance Distribution', 'Répartition de conformité', lang),
  });
  pdf.riskDistribution(
    { critical: critRisks.length, high: highRisks.length, medium: medRisks.length, low: lowRisks.length },
    {
      critical: I('Kritisch', 'Critical', 'Critique', lang),
      high:     I('Hoch', 'High', 'Élevé', lang),
      medium:   I('Mittel', 'Medium', 'Moyen', lang),
      low:      I('Niedrig', 'Low', 'Faible', lang),
      title:    I('Risikoverteilung', 'Risk Distribution', 'Répartition des risques', lang),
    },
  );

  // Narrative
  pdf.heading(I('Lage', 'Situation', 'Situation', lang), 2);
  pdf.bodyParagraph(I(
    `Die Bewertung des KI-Systems "${intakeData.systemName || '—'}" wurde im Kontext der Klassifizierung "${classLabel}" durchgeführt. Es wurden ${risks.length} Risiken in den Dimensionen Bias, Robustheit, Transparenz, Datenschutz, Sicherheit, Governance und Umweltauswirkung identifiziert; davon ${critRisks.length} mit kritischem Score (≥ 20). Von ${reqs.length} geprüften AI-Act-Anforderungen sind ${failReqs.length} nicht erfüllt und ${partialReqs.length} nur teilweise erfüllt.`,
    `The assessment of "${intakeData.systemName || '—'}" was conducted under the classification "${classLabel}". ${risks.length} risks were identified across bias, robustness, transparency, privacy, security, governance and environmental dimensions; ${critRisks.length} with critical score (≥ 20). Of ${reqs.length} requirements assessed, ${failReqs.length} are non-compliant and ${partialReqs.length} are partially compliant.`,
    `L'évaluation de "${intakeData.systemName || '—'}" a été menée sous "${classLabel}". ${risks.length} risques identifiés ; ${critRisks.length} critiques. Sur ${reqs.length} exigences, ${failReqs.length} non conformes et ${partialReqs.length} partielles.`,
    lang,
  ));

  pdf.heading(I('Wirtschaftliche Implikation', 'Economic Implication', 'Implication économique', lang), 2);
  pdf.bodyParagraph(I(
    'Verstöße gegen Art. 5 sind mit Bußgeldern bis 35 Mio. EUR oder 7 % des weltweiten Jahresumsatzes belegt; Verstöße gegen Hochrisiko-Pflichten (Art. 9-15, 16, 26) bis 15 Mio. EUR oder 3 % Umsatz; sonstige Verstöße bis 7,5 Mio. EUR oder 1 % Umsatz. Hinzu treten zivilrechtliche Haftung sowie Reputations- und Marktzugangsrisiken im EU-Binnenmarkt.',
    'Breaches of Art. 5 carry fines up to EUR 35M or 7% global turnover; breaches of high-risk duties (Art. 9-15, 16, 26) up to EUR 15M or 3%; other breaches up to EUR 7.5M or 1%. Civil liability, reputational damage and EU market access risk add to this.',
    'Les violations de l\'Art. 5 sont passibles d\'amendes jusqu\'à 35 M EUR ou 7 % du CA ; violations Art. 9-15 jusqu\'à 15 M EUR ou 3 % ; autres jusqu\'à 7,5 M EUR ou 1 %.',
    lang,
  ));

  // ════════════════════════════════════════════════════════════
  //  2  COMPLIANCE STATEMENT
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec2);
  pdf.heading(TOC.sec2, 1);

  const stmtColor = isCompliant ? C.pass : isConditional ? C.partial : C.fail;
  const stmtLabel = isProhibited
    ? I('UNZULÄSSIG — Verbotstatbestand', 'PROHIBITED — Banned practice', 'INTERDIT — Pratique bannie', lang)
    : isCompliant
    ? I('KONFORM — Anforderungen erfüllt', 'COMPLIANT — Requirements met', 'CONFORME — Exigences satisfaites', lang)
    : isConditional
    ? I('BEDINGT KONFORM — Nacharbeit erforderlich', 'CONDITIONALLY COMPLIANT — Remediation required', 'CONFORMITÉ CONDITIONNELLE', lang)
    : I('NICHT KONFORM — Sofortige Maßnahmen erforderlich', 'NON-COMPLIANT — Immediate action required', 'NON CONFORME', lang);

  pdf.bodyParagraph(verdictText);

  // Coloured banner
  pdf.checkSpace(16);
  pdf.doc.setFillColor(...stmtColor);
  pdf.doc.roundedRect(LAYOUT.LEFT, pdf.y, LAYOUT.WIDTH, 11, 1.5, 1.5, 'F');
  pdf.doc.setFont(pdf.headFontName, 'bold');
  pdf.doc.setFontSize(9.5);
  pdf.doc.setTextColor(...C.white);
  pdf.doc.text(stmtLabel, LAYOUT.LEFT + LAYOUT.WIDTH / 2, pdf.y + 7.2, { align: 'center' });
  pdf.y += 18;
  pdf.doc.setTextColor(...C.dark);

  pdf.sectionLabel(I('VERANTWORTLICHE FREIGABE', 'RESPONSIBLE APPROVAL', 'APPROBATION RESPONSABLE', lang));
  pdf.y += 2;
  const sigFields = lang === 'de'
    ? ['Name: ____________________________', 'Funktion: ____________________________', 'Datum: ____________________________', 'Unterschrift: ____________________________']
    : lang === 'fr'
    ? ['Nom : ____________________________', 'Fonction : ____________________________', 'Date : ____________________________', 'Signature : ____________________________']
    : ['Name: ____________________________', 'Role: ____________________________', 'Date: ____________________________', 'Signature: ____________________________'];
  sigFields.forEach(s => {
    pdf.checkSpace(7);
    pdf.doc.setFont(pdf.bodyFontName, 'normal');
    pdf.doc.setFontSize(LAYOUT.BODY_SIZE);
    pdf.doc.text(s, LAYOUT.LEFT + 4, pdf.y);
    pdf.y += 7;
  });

  // ════════════════════════════════════════════════════════════
  //  3  SCOPE
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec3);
  pdf.heading(TOC.sec3, 1);
  pdf.introText(I(
    'Dieser Abschnitt dokumentiert das geprüfte KI-System, die Rolle der Einrichtung und die zum Bewertungszeitpunkt vorhandenen Maßnahmen.',
    'This section documents the assessed AI system, the entity\'s role, and the measures in place at the time of assessment.',
    'Cette section documente le système IA évalué, le rôle de l\'entité et les mesures en place.',
    lang,
  ));

  pdf.heading(TOC.sec3a, 2);
  pdf.field(I('Einrichtung', 'Entity', 'Entité', lang), intakeData.entityName || '—');
  pdf.field(I('Rolle nach AI Act', 'Role under AI Act', 'Rôle AI Act', lang), intakeData.role.join(', ') || '—');

  pdf.heading(TOC.sec3b, 2);
  pdf.field(I('System / Modell', 'System / Model', 'Système / Modèle', lang), intakeData.systemName || '—');
  pdf.field(I('Zweckbestimmung', 'Intended purpose', 'Finalité prévue', lang), intakeData.systemPurpose || '—');
  pdf.field(I('Domäne', 'Domain', 'Domaine', lang), intakeData.domain || '—');
  pdf.field(I('Klassifizierung', 'Classification', 'Classification', lang), classLabel);
  if (intakeData.annexIII.length > 0) {
    pdf.field(I('Anhang-III-Bereiche', 'Annex III domains', 'Domaines Annexe III', lang), intakeData.annexIII.join(', '));
  }
  if (intakeData.isGpai) {
    pdf.field(
      I('GPAI-Modell', 'GPAI model', 'Modèle GPAI', lang),
      intakeData.flopsThreshold
        ? I('Ja — mit systemischem Risiko (≥ 10²⁵ FLOPS)', 'Yes — with systemic risk (≥ 10^25 FLOPS)', 'Oui — risque systémique', lang)
        : I('Ja — Art. 53', 'Yes — Art. 53', 'Oui — Art. 53', lang),
    );
  }
  if (intakeData.knownIssues) {
    pdf.bodyParagraph(humanizeText(intakeData.knownIssues, lang, 'issues'));
  }

  pdf.heading(TOC.sec3c, 2);
  const measureEntries = Object.entries(intakeData.measures || {});
  if (measureEntries.length === 0) {
    pdf.bodyParagraph(I(
      'Es wurden keine Maßnahmen im Intake erfasst.',
      'No measures were captured during intake.',
      'Aucune mesure n\'a été saisie.', lang,
    ));
  } else {
    pdf.measuresTable(measureEntries, {
      measure: I('Maßnahme', 'Measure', 'Mesure', lang),
      active:  I('Aktiv', 'Active', 'Active', lang),
      doc:     I('Dok.', 'Doc.', 'Doc.', lang),
      audit:   I('Audit', 'Audit', 'Audit', lang),
      cert:    I('Zert.', 'Cert.', 'Cert.', lang),
      yes:     I('Ja', 'Yes', 'Oui', lang),
      no:      I('Nein', 'No', 'Non', lang),
    });
  }

  // ════════════════════════════════════════════════════════════
  //  4  FINDINGS
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec4);
  pdf.heading(TOC.sec4, 1);
  pdf.introText(I(
    'Identifizierte Risiken und Konformitätslücken werden einzeln dargestellt und nach AI-Act-Artikeln referenziert.',
    'Identified risks and compliance gaps are presented individually and referenced to AI Act articles.',
    'Les risques et lacunes sont présentés individuellement avec références aux articles.',
    lang,
  ));

  // 4.1 Risk Landscape
  pdf.heading(TOC.sec4a, 2);
  pdf.introText(I(
    'Bewertung nach Eintrittswahrscheinlichkeit (1-5) × Auswirkung (1-5). Score ≥ 20 gilt als kritisch.',
    'Scored by likelihood (1-5) × impact (1-5). Score ≥ 20 is critical.',
    'Évalué par probabilité × impact. Score ≥ 20 critique.',
    lang,
  ));

  risks.forEach(r => {
    const score = r.likelihood * r.impact;
    const cat = RISK_CATEGORIES[r.category]?.label[lang] || r.category;
    pdf.checkSpace(50);
    pdf.heading(`${riskId(r)}  ${r.name}`, 3);
    pdf.metaLine(`${cat}  |  ${sevLabel(score, lang)}  |  ${r.aiActRef}  |  ${I('Evidenz','Evidence','Preuve',lang)}: ${r.evidenceQuality}/5`);

    pdf.bodyText(`${I('Beobachtung','Observation','Observation',lang)}: ${humanizeEvidence(r.evidence, lang)}`);

    pdf.sectionLabel(I('TECHNISCHE DETAILS', 'TECHNICAL DETAILS', 'DÉTAILS TECHNIQUES', lang));
    pdf.fieldInline(I('Komponente','Component','Composant',lang), r.component);
    pdf.fieldInline(I('Akteur','Actor','Acteur',lang), r.attacker);
    pdf.fieldInline(I('Vektor','Path','Chemin',lang), r.path);
    pdf.fieldInline(I('Reproduzierbarkeit','Reproducibility','Reproductibilité',lang), r.reproducibility);

    pdf.scoreBar(`${I('RISIKOSTUFE','RISK LEVEL','NIVEAU',lang)}: ${sevLabel(score, lang)}  (${r.likelihood} × ${r.impact} = ${score}/25)`);

    pdf.bodyText(`${I('Bewertungsgrundlage','Rationale','Fondement',lang)}: ${r.rationale}`);
    if (r.sources.length > 0) {
      pdf.metaLine(`${I('Quellen','Sources','Sources',lang)}: ${r.sources.join(' · ')}`);
    }
    pdf.separator();
  });

  // 4.2 Compliance Gaps
  pdf.newPage();
  pdf.heading(TOC.sec4b, 2);
  pdf.introText(I(
    'Bewertung jeder Anforderung in pass / partial / fail mit Lücke, empfohlener Maßnahme und Akzeptanzkriterien.',
    'Each requirement assessed pass / partial / fail with gap, recommended action and acceptance criteria.',
    'Chaque exigence évaluée avec lacune, mesure recommandée et critères.',
    lang,
  ));

  reqs.forEach(r => {
    pdf.checkSpace(45);
    pdf.heading(`${r.id}  ${r.name}`, 3);

    // Status badge + article on same baseline
    pdf.checkSpace(8);
    const afterBadge = pdf.statusBadge(r.status);
    pdf.doc.setFont(pdf.headFontName, 'normal');
    pdf.doc.setFontSize(7);
    pdf.doc.setTextColor(...C.mid);
    pdf.doc.text(r.article, afterBadge, pdf.y);
    pdf.y += 6;
    pdf.doc.setTextColor(...C.dark);

    if (r.evidence)  pdf.fieldInline(I('Evidenz','Evidence','Preuve',lang), humanizeEvidence(r.evidence, lang));
    if (r.gap)       pdf.fieldInline(I('Lücke','Gap','Lacune',lang), r.gap);
    if (r.rationale) pdf.fieldInline(I('Begründung','Rationale','Fondement',lang), r.rationale);
    if (r.measure)   pdf.fieldInline(I('Maßnahme','Measure','Mesure',lang), r.measure);
    if (r.criteria.length > 0) {
      pdf.sectionLabel(I('AKZEPTANZKRITERIEN', 'ACCEPTANCE CRITERIA', 'CRITÈRES D\'ACCEPTATION', lang));
      r.criteria.forEach(c => pdf.bulletItem(c));
    }
    if (r.effort || r.priority) {
      pdf.fieldInline(
        I('Aufwand / Priorität', 'Effort / Priority', 'Effort / Priorité', lang),
        `${r.effort || '—'}  ·  ${r.priority || '—'}`,
      );
    }
    pdf.separator();
  });

  // ════════════════════════════════════════════════════════════
  //  5  ROADMAP
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec5);
  pdf.heading(TOC.sec5, 1);
  pdf.introText(I(
    'Priorisierung nach P0 (sofort, 0-4 Wochen), P1 (1-3 Monate), P2 (3-6 Monate), P3 (6-12 Monate). Erfasst werden alle nicht vollständig konformen Anforderungen.',
    'Prioritised P0 (immediate, 0-4 weeks), P1 (1-3 months), P2 (3-6 months), P3 (6-12 months). Includes all not fully compliant requirements.',
    'Priorité P0 (0-4 sem.), P1 (1-3 mois), P2 (3-6 mois), P3 (6-12 mois).',
    lang,
  ));

  const PRIO_TITLES: Record<string, string> = {
    P0: I('P0 — Sofort (0-4 Wochen)', 'P0 — Immediate (0-4 weeks)', 'P0 — Immédiat (0-4 sem.)', lang),
    P1: I('P1 — Kurzfristig (1-3 Monate)', 'P1 — Short-term (1-3 months)', 'P1 — Court terme (1-3 mois)', lang),
    P2: I('P2 — Mittelfristig (3-6 Monate)', 'P2 — Medium-term (3-6 months)', 'P2 — Moyen terme (3-6 mois)', lang),
    P3: I('P3 — Langfristig (6-12 Monate)', 'P3 — Long-term (6-12 months)', 'P3 — Long terme (6-12 mois)', lang),
  };
  ['P0', 'P1', 'P2', 'P3'].forEach(p => {
    const items = reqs.filter(r => r.priority === p && r.status !== 'pass');
    if (items.length === 0) return;
    pdf.heading(`${PRIO_TITLES[p]}  (${items.length})`, 2);
    items.forEach(r => {
      pdf.bulletItem(`${r.id} — ${r.name}  ·  ${r.article}  ·  ${r.effort || '—'}`);
    });
  });

  // ════════════════════════════════════════════════════════════
  //  6  METHODOLOGY
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.addBookmark(TOC.sec6);
  pdf.heading(TOC.sec6, 1);
  pdf.bodyParagraph(I(
    'Risiken werden auf einer 5×5-Matrix (Eintrittswahrscheinlichkeit × Auswirkung) bewertet. Anforderungen werden in pass, partial oder fail klassifiziert. Die Konformitätsrate ist gewichtet (pass = 100 %, partial = 50 %, fail = 0 %). Bidirektionale Traceability zwischen Risiken und Anforderungen wird automatisch geprüft. Verbotene Praktiken nach Art. 5 führen zu sofortigem Quality-Gate-Ausschluss; GPAI-Modelle ab 10²⁵ FLOPS werden zwangsweise als systemisches Risiko eingestuft (Art. 51).',
    'Risks are scored on a 5×5 likelihood × impact matrix. Requirements are classified pass, partial or fail. Compliance rate is weighted (pass = 100%, partial = 50%, fail = 0%). Bidirectional traceability between risks and requirements is checked automatically. Prohibited practices under Art. 5 trigger immediate quality-gate failure; GPAI models at or above 10^25 FLOPS are automatically classified as systemic risk (Art. 51).',
    'Les risques sont évalués sur une matrice 5×5. Les exigences sont classées pass / partial / fail. Le taux est pondéré. Les pratiques interdites Art. 5 entraînent un échec immédiat ; les GPAI ≥ 10^25 FLOPS sont classés à risque systémique.',
    lang,
  ));
  pdf.bodyParagraph(I(
    'Grundlage der Bewertung sind die Verordnung (EU) 2024/1689, die delegierten Rechtsakte sowie die ergänzenden Leitlinien des Europäischen AI Office. Ergänzend werden die Standards ISO/IEC 42001:2023 (AI Management System), NIST AI Risk Management Framework 1.0 und der OWASP LLM Top 10 herangezogen.',
    'The assessment is based on Regulation (EU) 2024/1689, delegated acts and guidance of the European AI Office. Additional standards: ISO/IEC 42001:2023, NIST AI RMF 1.0, OWASP LLM Top 10.',
    'Base : règlement (UE) 2024/1689, actes délégués, lignes directrices du Bureau européen de l\'IA, ISO/IEC 42001, NIST AI RMF, OWASP LLM Top 10.',
    lang,
  ));

  // ── Save ──
  const safeName = (intakeData.entityName || 'Report').replace(/[^0-9A-Za-z]/g, '_');
  pdf.doc.save(`AI-Act-Readiness_${safeName}_${today.replace(/[^0-9A-Za-z]/g, '-')}.pdf`);
}
