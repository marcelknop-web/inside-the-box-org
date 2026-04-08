/**
 * IACS UR E27 PDF Report — Audit-grade report for Maritime Cyber Resilience
 * Uses PdfDoc from pdfCore.ts for consistent, premium layout
 */
import type { IecThreat, IecReq, IecIntakeData } from '@/data/iec62443Data';
import { threatId, FR_CATEGORIES } from '@/data/iec62443Data';
import type { QaCheck } from '@/utils/iec62443QualityCheck';
import { createPdfDoc, LAYOUT, C, humanizeEvidence } from '@/utils/pdfCore';

export interface Iec62443ReportData {
  intakeData: IecIntakeData;
  threats: IecThreat[];
  reqs: IecReq[];
  language: 'de' | 'en' | 'fr';
  isDraft?: boolean;
  qaChecks?: QaCheck[];
  fixLog?: string[];
  qaIterations?: number;
}

const I18N = {
  title: { de: 'IACS UR E27 Cyber Resilience Assessment', en: 'IACS UR E27 Cyber Resilience Assessment', fr: 'Évaluation IACS UR E27 Cyber Résilience' },
  subtitle: { de: 'Prüfbericht nach IACS UR E27 — Cyber-Resilienz von Bordsystemen', en: 'Assessment Report pursuant to IACS UR E27 — Cyber Resilience of On-Board Systems', fr: 'Rapport d\'évaluation selon IACS UR E27 — Cyber résilience des systèmes embarqués' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  facility: { de: 'Schiff/System', en: 'Vessel/System', fr: 'Navire/Système' },
  securityLevel: { de: 'Ziel-Security-Level', en: 'Target Security Level', fr: 'Niveau de sécurité cible' },
  sec1: { de: '1  Zusammenfassung für die Geschäftsleitung', en: '1  Management Summary', fr: '1  Synthèse pour la direction' },
  sec2: { de: '2  Konformitätserklärung', en: '2  Compliance Statement', fr: '2  Déclaration de conformité' },
  sec3: { de: '3  Feststellungen im Einzelnen', en: '3  Detailed Findings', fr: '3  Constatations détaillées' },
  sec3a: { de: '3.1  Bedrohungslandschaft', en: '3.1  Threat Landscape', fr: '3.1  Paysage des menaces' },
  sec3b: { de: '3.2  Konformitätslücken', en: '3.2  Compliance Gaps', fr: '3.2  Lacunes de conformité' },
  sec4: { de: '4  Handlungsempfehlungen und Roadmap', en: '4  Recommendations and Roadmap', fr: '4  Recommandations et feuille de route' },
  sec5: { de: '5  Gegenstand der Prüfung', en: '5  Scope of Assessment', fr: '5  Périmètre de l\'évaluation' },
  sec6: { de: '6  Ausgangslage und Zielsetzung', en: '6  Context and Objectives', fr: '6  Contexte et objectifs' },
  sec7: { de: '7  Methodik', en: '7  Methodology', fr: '7  Méthodologie' },
  sec8: { de: '8  Einschränkungen und Haftungsausschluss', en: '8  Limitations and Disclaimer', fr: '8  Limites et clause de non-responsabilité' },
  secA: { de: 'A  Strukturierte Prüfdaten', en: 'A  Structured Audit Data', fr: 'A  Données d\'audit structurées' },
  secB: { de: 'B  Qualitätssicherungs-Checkliste', en: 'B  Quality Assurance Checklist', fr: 'B  Liste de contrôle qualité' },
  secC: { de: 'C  Evidenz-Material-Index', en: 'C  Evidence Material Index', fr: 'C  Index des éléments de preuve' },
  secD: { de: 'D  Arbeitspapiere (Working Papers)', en: 'D  Working Papers', fr: 'D  Papiers de travail' },
  threat: { de: 'Bedrohung', en: 'Threat', fr: 'Menace' },
  component: { de: 'Betroffene Komponente', en: 'Affected Component', fr: 'Composant concerné' },
  attacker: { de: 'Angreiferprofil', en: 'Attacker Profile', fr: 'Profil de l\'attaquant' },
  attackPath: { de: 'Angriffsvektor', en: 'Attack Vector', fr: 'Vecteur d\'attaque' },
  evidence: { de: 'Erhobene Evidenz', en: 'Collected Evidence', fr: 'Éléments de preuve' },
  rationale: { de: 'Bewertungsgrundlage', en: 'Assessment Rationale', fr: 'Fondement de l\'évaluation' },
  riskScore: { de: 'Risikobewertung', en: 'Risk Rating', fr: 'Évaluation du risque' },
  likelihood: { de: 'Eintrittswahrsch.', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  status: { de: 'Bewertung', en: 'Assessment', fr: 'Évaluation' },
  gap: { de: 'Festgestellte Abweichung', en: 'Identified Deviation', fr: 'Écart identifié' },
  measure: { de: 'Empfohlene Maßnahme', en: 'Recommended Action', fr: 'Mesure recommandée' },
  dod: { de: 'Umsetzungskriterien', en: 'Acceptance Criteria', fr: 'Critères d\'acceptation' },
  pass: { de: 'Konform', en: 'Compliant', fr: 'Conforme' },
  partial: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' },
  fail: { de: 'Nicht konform', en: 'Non-Compliant', fr: 'Non conforme' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estimé' },
  iecRef: { de: 'E27-Referenz', en: 'E27 Reference', fr: 'Référence E27' },
  fr: { de: 'Anforderungskategorie', en: 'Requirement Category', fr: 'Catégorie d\'exigence' },
  reproducibility: { de: 'Reproduzierbarkeit', en: 'Reproducibility', fr: 'Reproductibilité' },
  evidenceQuality: { de: 'Evidenz-Qualität', en: 'Evidence Quality', fr: 'Qualité de la preuve' },
};

type Lang = 'de' | 'en' | 'fr';

function t(map: Record<string, string>, lang: Lang): string {
  return map[lang] || map.en || '';
}

function riskLabel(score: number, lang: Lang): string {
  if (score >= 20) return lang === 'de' ? 'Kritisch' : lang === 'fr' ? 'Critique' : 'Critical';
  if (score >= 13) return lang === 'de' ? 'Hoch' : lang === 'fr' ? 'Élevé' : 'High';
  if (score >= 6) return lang === 'de' ? 'Mittel' : lang === 'fr' ? 'Moyen' : 'Medium';
  return lang === 'de' ? 'Gering' : lang === 'fr' ? 'Faible' : 'Low';
}

export async function generateIec62443Report(data: Iec62443ReportData): Promise<void> {
  const { intakeData, threats, reqs, language: lang, isDraft, qaChecks, fixLog } = data;
  const dateStr = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB');

  const passReqs = reqs.filter(r => r.status === 'pass');
  const partialReqs = reqs.filter(r => r.status === 'partial');
  const failReqs = reqs.filter(r => r.status === 'fail');
  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const highRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 13 && s < 20; });
  const medRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 6 && s < 13; });
  const lowRisks = threats.filter(th => th.likelihood * th.impact < 6);
  const complianceRate = reqs.length > 0 ? Math.round(((passReqs.length + partialReqs.length * 0.5) / reqs.length) * 100) : 0;

  const pdf = await createPdfDoc({
    lang,
    isDraft,
    reportPrefix: 'E27',
    confidentialLabel: t(I18N.confidential, lang),
    pageLabel: t(I18N.page, lang),
    draftWatermark: lang === 'de' ? 'ENTWURF' : lang === 'fr' ? 'BROUILLON' : 'DRAFT',
  });

  /* COVER PAGE */
  pdf.coverPage({
    title: t(I18N.title, lang),
    subtitle: t(I18N.subtitle, lang),
    entityName: intakeData.facilityName,
    fields: [
      [t(I18N.reportId, lang), pdf.reportId],
      [t(I18N.generated, lang), dateStr],
      [t(I18N.facility, lang), intakeData.facilityName],
      [t(I18N.securityLevel, lang), intakeData.securityLevel.toUpperCase()],
    ],
    confidentialNote: t(I18N.confidential, lang),
  });

  /* TABLE OF CONTENTS */
  const tocEntries = [
    t(I18N.sec1, lang), t(I18N.sec2, lang), null,
    t(I18N.sec3, lang), `    ${t(I18N.sec3a, lang)}`, `    ${t(I18N.sec3b, lang)}`, null,
    t(I18N.sec4, lang), null,
    t(I18N.sec5, lang), t(I18N.sec6, lang), t(I18N.sec7, lang), t(I18N.sec8, lang), null,
    t(I18N.secA, lang), t(I18N.secB, lang), t(I18N.secC, lang), t(I18N.secD, lang),
  ];
  pdf.tableOfContents(t(I18N.toc, lang), tocEntries);

  /* 1. MANAGEMENT SUMMARY */
  pdf.newPage();
  pdf.heading(t(I18N.sec1, lang));
  pdf.addBookmark(t(I18N.sec1, lang));

  const isCompliant = critRisks.length === 0 && failReqs.length === 0;
  const verdictText = lang === 'de'
    ? isCompliant
      ? `Im Rahmen der durchgeführten Prüfung konnte festgestellt werden, dass das Schiff bzw. System ${intakeData.facilityName} die Anforderungen gemäß IACS UR E27 vollständig erfüllt. Kritische Abweichungen wurden nicht identifiziert.`
      : `Die Prüfung des Schiffs bzw. Systems ${intakeData.facilityName} ergibt eine Konformitätsrate von ${complianceRate} % gegenüber den Anforderungen der IACS UR E27. Insgesamt wurden ${critRisks.length} kritische Risiken sowie ${failReqs.length} nicht konforme Anforderungen festgestellt, die unverzügliche Gegenmaßnahmen erfordern.`
    : lang === 'fr'
    ? isCompliant
      ? `L'évaluation a permis de constater que le navire/système ${intakeData.facilityName} satisfait pleinement aux exigences de l'IACS UR E27. Aucun écart critique n'a été identifié.`
      : `L'évaluation du navire/système ${intakeData.facilityName} aboutit à un taux de conformité de ${complianceRate} % par rapport aux exigences de l'IACS UR E27. Au total, ${critRisks.length} risques critiques et ${failReqs.length} exigences non conformes ont été identifiés, nécessitant des mesures correctives immédiates.`
    : isCompliant
    ? `The assessment has determined that vessel/system ${intakeData.facilityName} fully meets the requirements set out in IACS UR E27. No critical deviations were identified.`
    : `The assessment of vessel/system ${intakeData.facilityName} yields a compliance rate of ${complianceRate}% against the requirements of IACS UR E27. A total of ${critRisks.length} critical risks and ${failReqs.length} non-compliant requirements were identified, necessitating immediate remediation.`;

  pdf.verdictBox(verdictText);

  pdf.kpiRow([
    [String(threats.length), lang === 'de' ? 'Bedrohungen' : 'Threats'],
    [String(critRisks.length), lang === 'de' ? 'Kritisch (>=20)' : 'Critical (>=20)'],
    [String(failReqs.length), lang === 'de' ? 'Nicht konform' : 'Non-Compliant'],
    [`${complianceRate}%`, lang === 'de' ? 'Konformitätsrate' : 'Compliance Rate'],
  ]);

  pdf.complianceBar(passReqs.length, partialReqs.length, failReqs.length, {
    pass: t(I18N.pass, lang), partial: t(I18N.partial, lang), fail: t(I18N.fail, lang),
    title: lang === 'de' ? 'IACS UR E27 Konformitätsverteilung' : 'IACS UR E27 Compliance Distribution',
  });

  pdf.riskDistribution(
    { critical: critRisks.length, high: highRisks.length, medium: medRisks.length, low: lowRisks.length },
    { critical: lang === 'de' ? 'Kritisch' : 'Critical', high: lang === 'de' ? 'Hoch' : 'High', medium: lang === 'de' ? 'Mittel' : 'Medium', low: lang === 'de' ? 'Niedrig' : 'Low', title: lang === 'de' ? 'Risikoverteilung' : 'Risk Severity Distribution' },
  );

  pdf.riskHeatmap(threats, {
    title: lang === 'de' ? '5×5 Risikomatrix' : '5×5 Risk Matrix',
    likelihood: t(I18N.likelihood, lang),
    impact: t(I18N.impact, lang),
  });

  if (critRisks.length > 0) {
    pdf.heading(lang === 'de' ? 'Top-Findings' : 'Top Findings', 2);
    critRisks.slice(0, 5).forEach(th => {
      const tid = threatId(th);
      const score = th.likelihood * th.impact;
      pdf.field(tid, `${th.name} — Score: ${score} (${riskLabel(score, lang)})`);
    });
  }

  const actionText = lang === 'de'
    ? isCompliant
      ? 'Empfehlung: Konformitätsnachweis dokumentieren und jährliche Neubewertung planen.'
      : `Empfehlung: Sofortmaßnahmen (P0) aus Abschnitt 4 mit Verantwortlichkeiten und Fristen versehen. Wöchentliches Tracking bis zur Schließung aller kritischen Gaps.`
    : isCompliant
    ? 'Recommendation: Document compliance evidence and schedule annual reassessment.'
    : `Recommendation: Assign owners and deadlines to P0 measures from Section 4. Weekly tracking until all critical gaps are closed.`;
  pdf.bodyParagraph(actionText);

  /* 2. COMPLIANCE STATEMENT */
  pdf.newPage();
  pdf.heading(t(I18N.sec2, lang));
  pdf.addBookmark(t(I18N.sec2, lang));

  const complianceVerdict = lang === 'de'
    ? isCompliant
      ? `Das Schiff/System ${intakeData.facilityName} ist konform mit den Anforderungen der IACS UR E27.`
      : complianceRate >= 60
      ? `Das Schiff/System ${intakeData.facilityName} ist bedingt konform mit IACS UR E27. Die Konformitätsrate beträgt ${complianceRate}%.`
      : `Das Schiff/System ${intakeData.facilityName} ist nicht konform mit IACS UR E27. Die Konformitätsrate beträgt ${complianceRate}%. Eine umfassende Überarbeitung der CBS-Sicherheitsarchitektur ist erforderlich.`
    : isCompliant
    ? `Vessel/System ${intakeData.facilityName} is compliant with IACS UR E27.`
    : complianceRate >= 60
    ? `Vessel/System ${intakeData.facilityName} is conditionally compliant with IACS UR E27. Compliance rate: ${complianceRate}%.`
    : `Vessel/System ${intakeData.facilityName} is non-compliant with IACS UR E27. Compliance rate: ${complianceRate}%. Comprehensive CBS security architecture overhaul required.`;

  pdf.verdictBox(complianceVerdict);

  const methodNote = lang === 'de'
    ? `Methodik: PASS = 100%, PARTIAL = 50%, FAIL = 0%. Die gewichtete Konformitätsrate von ${complianceRate}% ergibt sich aus ${passReqs.length} konformen, ${partialReqs.length} teilweise konformen und ${failReqs.length} nicht konformen Anforderungen von insgesamt ${reqs.length}.`
    : `Methodology: PASS = 100%, PARTIAL = 50%, FAIL = 0%. The weighted compliance rate of ${complianceRate}% results from ${passReqs.length} compliant, ${partialReqs.length} partially compliant, and ${failReqs.length} non-compliant requirements out of ${reqs.length} total.`;
  pdf.bodyText(methodNote);

  /* 3. DETAILED FINDINGS */
  pdf.newPage();
  pdf.heading(t(I18N.sec3, lang));
  pdf.addBookmark(t(I18N.sec3, lang));
  pdf.heading(t(I18N.sec3a, lang), 2);
  pdf.addBookmark(t(I18N.sec3a, lang), 2);

  const introThreats = lang === 'de'
    ? `Die Bedrohungsanalyse basiert auf den Anforderungskategorien der IACS UR E27 und bewertet jedes Szenario anhand von Eintrittswahrscheinlichkeit und Auswirkung auf die Schiffssicherheit. Kritische Risiken (Score >= 20) erfordern Sofortmaßnahmen.`
    : `The threat analysis is based on the IACS UR E27 requirement categories and rates each scenario by likelihood and impact on vessel safety. Critical risks (score >= 20) require immediate action.`;
  pdf.introText(introThreats);

  const sortedThreats = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  sortedThreats.forEach((th, idx) => {
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const frLabel = FR_CATEGORIES[th.fr]?.label[lang] || th.fr;

    pdf.checkSpace(60);
    if (idx > 0) pdf.separator();

    pdf.heading(`${tid}: ${th.name}`, 3);
    pdf.sectionLabel(t(I18N.fr, lang));
    pdf.bodyText(`${th.fr} — ${frLabel}`, 4);
    pdf.sectionLabel(t(I18N.component, lang));
    pdf.bodyText(th.component, 4);
    pdf.sectionLabel(t(I18N.attacker, lang));
    pdf.bodyText(th.attacker, 4);
    pdf.sectionLabel(t(I18N.attackPath, lang));
    pdf.bodyText(th.path, 4);
    pdf.sectionLabel(t(I18N.evidence, lang));
    pdf.bodyText(humanizeEvidence(th.evidence, lang), 4);
    pdf.sectionLabel(t(I18N.rationale, lang));
    pdf.bodyText(th.rationale, 4);
    pdf.sectionLabel(t(I18N.riskScore, lang));
    pdf.scoreBar(`${t(I18N.likelihood, lang)}: ${th.likelihood}/5  ×  ${t(I18N.impact, lang)}: ${th.impact}/5  =  ${score}  (${riskLabel(score, lang)})`);
    pdf.sectionLabel(t(I18N.iecRef, lang));
    pdf.bodyText(th.iecRef, 4);

    if (th.sources.length > 0) {
      pdf.sectionLabel(t(I18N.sources, lang));
      th.sources.forEach(s => pdf.bulletItem(s, 4));
    }
    pdf.metaLine(`${t(I18N.evidenceQuality, lang)}: ${th.evidenceQuality}/5  |  ${t(I18N.reproducibility, lang)}: ${th.reproducibility}`);
  });

  // 3.2 Compliance Gaps
  pdf.newPage();
  pdf.heading(t(I18N.sec3b, lang), 2);
  pdf.addBookmark(t(I18N.sec3b, lang), 2);

  const introReqs = lang === 'de'
    ? `Die folgende Übersicht zeigt die Bewertung jeder IACS UR E27 Anforderung. Abweichungen werden mit konkreten Maßnahmen und nachweisbaren Umsetzungskriterien versehen.`
    : `The following overview shows the assessment of each IACS UR E27 requirement. Deviations are accompanied by concrete measures and verifiable acceptance criteria.`;
  pdf.introText(introReqs);

  const frGroups = Object.keys(FR_CATEGORIES);
  frGroups.forEach(fr => {
    const actualReqs = reqs.filter(r => r.id.startsWith(fr));
    if (actualReqs.length === 0) return;

    const frLabel = FR_CATEGORIES[fr]?.label[lang] || fr;
    pdf.heading(`${fr} — ${frLabel}`, 2);

    actualReqs.forEach(r => {
      pdf.checkSpace(40);
      const afterBadge = pdf.statusBadge(r.status);
      pdf.doc.setFont(pdf.headFontName, 'bold');
      pdf.doc.setFontSize(9);
      pdf.doc.setTextColor(...C.navy);
      pdf.doc.text(`${r.id}: ${r.name}`, afterBadge + 2, pdf.y);
      pdf.y += 6;
      pdf.metaLine(`${r.article}`);

      if (r.evidence) { pdf.sectionLabel(t(I18N.evidence, lang)); pdf.bodyText(humanizeEvidence(r.evidence, lang), 4); }
      if (r.rationale) { pdf.sectionLabel(t(I18N.rationale, lang)); pdf.bodyText(r.rationale, 4); }

      if (r.status !== 'pass') {
        if (r.gap) { pdf.sectionLabel(t(I18N.gap, lang)); pdf.bodyText(r.gap, 4); }
        if (r.measure) { pdf.sectionLabel(t(I18N.measure, lang)); pdf.bodyText(r.measure, 4); }
        if (r.criteria.length > 0) { pdf.sectionLabel(t(I18N.dod, lang)); r.criteria.forEach(c => pdf.bulletItem(c, 4)); }
        if (r.effort) pdf.fieldInline(t(I18N.effort, lang), r.effort, 4);
        if (r.priority) pdf.fieldInline(t(I18N.priority, lang), r.priority, 4);
      }
      pdf.y += 3;
    });
  });

  /* 4. RECOMMENDATIONS & ROADMAP */
  pdf.newPage();
  pdf.heading(t(I18N.sec4, lang));
  pdf.addBookmark(t(I18N.sec4, lang));

  const introRoadmap = lang === 'de'
    ? 'Die Handlungsempfehlungen sind nach Dringlichkeit und Risikokritikalität priorisiert. P0-Maßnahmen sind Sofortmaßnahmen und müssen vor dem nächsten Klasseerneuerungsbesuch abgeschlossen sein.'
    : 'Recommendations are prioritised by urgency and risk criticality. P0 measures are immediate actions and must be completed before the next class renewal survey.';
  pdf.introText(introRoadmap);

  const prios = ['P0', 'P1', 'P2', 'P3'];
  const prioLabels: Record<string, Record<string, string>> = {
    P0: { de: 'P0 — Sofortmaßnahme', en: 'P0 — Immediate Action', fr: 'P0 — Action immédiate' },
    P1: { de: 'P1 — Kurzfristig (< 3 Monate)', en: 'P1 — Short-term (< 3 months)', fr: 'P1 — Court terme (< 3 mois)' },
    P2: { de: 'P2 — Mittelfristig (< 6 Monate)', en: 'P2 — Medium-term (< 6 months)', fr: 'P2 — Moyen terme (< 6 mois)' },
    P3: { de: 'P3 — Empfohlen', en: 'P3 — Recommended', fr: 'P3 — Recommandé' },
  };

  prios.forEach(p => {
    const prioReqs = reqs.filter(r => r.status !== 'pass' && r.priority === p);
    if (prioReqs.length === 0) return;
    pdf.heading(t(prioLabels[p], lang), 2);
    prioReqs.forEach(r => {
      pdf.checkSpace(20);
      const linkedThreats = threats.filter(th => th.iecRef === r.article);
      const maxScore = linkedThreats.length > 0 ? Math.max(...linkedThreats.map(th => th.likelihood * th.impact)) : 0;
      pdf.field(r.id, `${r.name} — ${r.measure || ''}`);
      if (r.effort) pdf.fieldInline(t(I18N.effort, lang), r.effort, 4);
      if (linkedThreats.length > 0) {
        pdf.metaLine(`${lang === 'de' ? 'Verknüpfte Bedrohungen' : 'Linked Threats'}: ${linkedThreats.map(threatId).join(', ')} (max Score: ${maxScore})`);
      }
    });
  });

  pdf.heading(lang === 'de' ? '4.2  Wirtschaftliche Betrachtung' : '4.2  Economic Impact', 2);
  const totalEffortMin = reqs.filter(r => r.status !== 'pass' && r.effort).reduce((sum, r) => { const m = r.effort.match(/(\d+)/); return sum + (m ? parseInt(m[1]) : 0); }, 0);
  const totalEffortMax = reqs.filter(r => r.status !== 'pass' && r.effort).reduce((sum, r) => { const p = r.effort.match(/(\d+)-(\d+)/); return sum + (p ? parseInt(p[2]) : 0); }, 0);

  pdf.effortBox({
    header: lang === 'de' ? 'AUFWANDSSCHÄTZUNG GESAMT' : 'TOTAL EFFORT ESTIMATE',
    rangeText: `${totalEffortMin}–${totalEffortMax}h (${Math.round(totalEffortMin / 8)}–${Math.round(totalEffortMax / 8)} ${lang === 'de' ? 'Personentage' : 'person-days'})`,
    assumptions: lang === 'de'
      ? ['Team: 1 Maritime-Cyber-Security-Experte, 1 ETO, 1 Projektleiter', 'Umsetzung teilweise im Hafenliegezeit möglich', 'Hersteller-Support für CBS-Updates verfügbar']
      : ['Team: 1 maritime cyber security expert, 1 ETO, 1 project lead', 'Implementation partially possible during port calls', 'Vendor support for CBS updates available'],
    uncertainties: lang === 'de'
      ? ['Legacy-CBS ohne Hersteller-Support können Aufwand erhöhen', 'Werftliegezeit für Netzwerksegmentierung ggf. erforderlich']
      : ['Legacy CBS without vendor support may increase effort', 'Dry dock time for network segmentation may be required'],
    validation: lang === 'de'
      ? 'Diese Schätzung basiert auf vergleichbaren maritimen Cyber-Security-Projekten.'
      : 'This estimate is based on comparable maritime cyber security projects.',
    assumptionsLabel: lang === 'de' ? 'Annahmen' : 'Assumptions',
    uncertaintiesLabel: lang === 'de' ? 'Unsicherheiten' : 'Uncertainties',
    validationLabel: lang === 'de' ? 'Validierung' : 'Validation',
  });

  /* 5. SCOPE */
  pdf.newPage();
  pdf.heading(t(I18N.sec5, lang));
  pdf.addBookmark(t(I18N.sec5, lang));
  pdf.field(t(I18N.facility, lang), intakeData.facilityName);
  pdf.field(t(I18N.securityLevel, lang), intakeData.securityLevel.toUpperCase());
  if (intakeData.description) pdf.field(lang === 'de' ? 'Systembeschreibung' : 'System Description', intakeData.description);
  if (intakeData.systemTypes.length > 0) pdf.field(lang === 'de' ? 'CBS-Typen' : 'CBS Types', intakeData.systemTypes.join(', '));
  if (intakeData.zones.length > 0) pdf.field(lang === 'de' ? 'Netzwerkzonen' : 'Network Zones', intakeData.zones.join(', '));
  if (intakeData.protocols.length > 0) pdf.field(lang === 'de' ? 'Protokolle' : 'Protocols', intakeData.protocols.join(', '));
  if (intakeData.roles.length > 0) pdf.field(lang === 'de' ? 'Beteiligte Rollen' : 'Involved Roles', intakeData.roles.join(', '));

  if (Object.keys(intakeData.measures).length > 0) {
    pdf.heading(lang === 'de' ? '5.1  Implementierte Sicherheitsmaßnahmen' : '5.1  Implemented Security Measures', 2);
    const measureEntries: [string, { active: boolean; documented: boolean; audited: boolean; certified: boolean }][] =
      Object.entries(intakeData.measures).map(([id, m]) => [id, { ...m, certified: false }]);
    pdf.measuresTable(measureEntries, {
      measure: lang === 'de' ? 'Maßnahme' : 'Measure', active: lang === 'de' ? 'Aktiv' : 'Active',
      doc: lang === 'de' ? 'Dokumentiert' : 'Documented', audit: lang === 'de' ? 'Auditiert' : 'Audited',
      cert: lang === 'de' ? 'Zertifiziert' : 'Certified', yes: lang === 'de' ? 'Ja' : 'Yes', no: lang === 'de' ? 'Nein' : 'No',
    });
  }
  if (intakeData.knownIssues) { pdf.heading(lang === 'de' ? '5.2  Bekannte Schwachstellen' : '5.2  Known Issues', 2); pdf.bodyParagraph(intakeData.knownIssues); }
  if (intakeData.files.length > 0) { pdf.heading(lang === 'de' ? '5.3  Eingereichte Dokumentation' : '5.3  Submitted Documentation', 2); intakeData.files.forEach(f => pdf.bulletItem(`${f.name} (${(f.size / 1_000_000).toFixed(1)} MB) — ${f.type}`)); }

  /* 6. CONTEXT & OBJECTIVES */
  pdf.newPage();
  pdf.heading(t(I18N.sec6, lang));
  pdf.addBookmark(t(I18N.sec6, lang));
  const contextText = lang === 'de'
    ? `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Sicherheitsbewertung des Schiffs/Systems ${intakeData.facilityName} nach IACS UR E27. Die Prüfung wurde am ${dateStr} durchgeführt.\n\nZielsetzung war die systematische Identifikation von Bedrohungen für Computer Based Systems (CBS) an Bord sowie die Bewertung der Konformität mit den 41 Anforderungen aus IACS UR E27 (Table 1 + Table 2).\n\nDer Bericht richtet sich an Reeder, Schiffsführung, ETO/IT-Officer und Klassifikationsgesellschaften.`
    : `This report documents the results of a structured security assessment of vessel/system ${intakeData.facilityName} pursuant to IACS UR E27. The assessment was conducted on ${dateStr}.\n\nThe objective was the systematic identification of threats to Computer Based Systems (CBS) on board and the evaluation of compliance with the 41 requirements from IACS UR E27 (Table 1 + Table 2).\n\nThe report is intended for ship owners, vessel management, ETO/IT officers, and classification societies.`;
  pdf.bodyParagraph(contextText);

  /* 7. METHODOLOGY */
  pdf.newPage();
  pdf.heading(t(I18N.sec7, lang));
  pdf.addBookmark(t(I18N.sec7, lang));
  const methodText = lang === 'de'
    ? `Die Bewertung folgt einem 6-stufigen Audit-Prozess:\n\n1. Scope-Definition: Identifikation der zu prüfenden CBS an Bord gemäß IACS UR E26.\n2. Bedrohungsanalyse: Systematische Identifikation von Bedrohungsszenarien für maritime CBS.\n3. Risikobewertung: Bewertung jedes Szenarios anhand einer 5×5-Matrix.\n4. E27-Mapping: Abgleich mit den 41 Anforderungen aus IACS UR E27 Table 1 und Table 2.\n5. Maßnahmenableitung: Priorisierte Handlungsempfehlungen (P0-P3).\n6. Qualitätssicherung: Automatisierte Validierung der Berichtskonsistenz.`
    : `The assessment follows a 6-step audit process:\n\n1. Scope Definition: Identification of CBS on board per IACS UR E26.\n2. Threat Analysis: Systematic identification of threat scenarios for maritime CBS.\n3. Risk Assessment: Rating using a 5×5 matrix.\n4. E27 Mapping: Alignment with 41 requirements from IACS UR E27 Table 1 and Table 2.\n5. Remediation Planning: Prioritised recommendations (P0-P3).\n6. Quality Assurance: Automated validation of report consistency.`;
  pdf.bodyParagraph(methodText);

  /* 8. DISCLAIMER */
  pdf.newPage();
  pdf.heading(t(I18N.sec8, lang));
  pdf.addBookmark(t(I18N.sec8, lang));
  const disclaimer = lang === 'de'
    ? `Dieser Bericht wurde auf Grundlage der zum Prüfzeitpunkt (${dateStr}) verfügbaren Informationen erstellt.\n\nDer Bericht stellt keine Klasse-Zertifizierung nach IACS UR E27 dar. Eine formale Zertifizierung erfordert die Beauftragung einer anerkannten Klassifikationsgesellschaft.\n\nDie Aufwandsschätzungen dienen als Orientierung und können je nach Schiffstyp, CBS-Ausstattung und Hersteller-Support variieren.`
    : `This report was prepared based on information available at the time of assessment (${dateStr}).\n\nThis report does not constitute class certification under IACS UR E27. Formal certification requires engagement of a recognized classification society.\n\nEffort estimates serve as guidance and may vary depending on vessel type, CBS equipment, and vendor support.`;
  pdf.bodyParagraph(disclaimer);

  /* APPENDIX A */
  pdf.newPage();
  pdf.heading(t(I18N.secA, lang));
  pdf.addBookmark(t(I18N.secA, lang));
  pdf.introText(lang === 'de' ? 'Vollständige Prüfdaten in strukturierter Form.' : 'Complete audit data in structured form.');

  pdf.mappingTable(
    threats.map(th => ({ id: threatId(th), name: th.name, category: th.fr, ref: th.iecRef, evidenceId: `E-${String(th.id).padStart(3, '0')}`, score: `${th.likelihood * th.impact}` })),
    { title: lang === 'de' ? 'Bedrohungs-Mapping' : 'Threat Mapping', colId: 'ID', colName: lang === 'de' ? 'Bezeichnung' : 'Name', colCat: 'Kat.', colRef: 'E27-Ref', colEvidence: lang === 'de' ? 'Evidenz' : 'Evidence', colScore: 'Score' }
  );

  pdf.mappingTable(
    reqs.map(r => ({ id: r.id, name: r.name, category: r.status.toUpperCase(), ref: r.article, evidenceId: r.priority || '—' })),
    { title: lang === 'de' ? 'Anforderungs-Mapping' : 'Requirement Mapping', colId: 'ID', colName: lang === 'de' ? 'Bezeichnung' : 'Name', colCat: 'Status', colRef: 'E27-Ref', colEvidence: lang === 'de' ? 'Priorität' : 'Priority' }
  );

  /* APPENDIX B — QA */
  if (qaChecks && qaChecks.length > 0) {
    pdf.newPage();
    pdf.heading(t(I18N.secB, lang));
    pdf.addBookmark(t(I18N.secB, lang));
    const catLabels: Record<string, string> = lang === 'de'
      ? { consistency: 'A. Konsistenzprüfung', technical: 'B. Fachliche Korrektheit', evidence: 'C. Evidenzprüfung', editorial: 'D. Redaktionelle Prüfung', ot: 'E. Maritime Prüfung' }
      : { consistency: 'A. Consistency Check', technical: 'B. Technical Correctness', evidence: 'C. Evidence Check', editorial: 'D. Editorial Check', ot: 'E. Maritime Check' };
    pdf.qaChecks(qaChecks.map(c => ({ id: c.id, label: c.label, passed: c.passed, category: c.category, detail: c.detail, severity: c.severity })), ['consistency', 'technical', 'evidence', 'editorial', 'ot'], catLabels, lang === 'de' ? 'QA-Iterationen' : 'QA Iterations', data.qaIterations);
    if (fixLog && fixLog.length > 0) { pdf.heading(lang === 'de' ? 'Automatische Korrekturen' : 'Automated Corrections', 2); pdf.fixLog(fixLog); }
  }

  /* APPENDIX C — EVIDENCE */
  pdf.newPage();
  pdf.heading(t(I18N.secC, lang));
  pdf.addBookmark(t(I18N.secC, lang));
  threats.forEach(th => { pdf.checkSpace(25); pdf.field(`E-${String(th.id).padStart(3, '0')} (${threatId(th)})`, th.evidence); pdf.metaLine(`${t(I18N.evidenceQuality, lang)}: ${th.evidenceQuality}/5 | ${t(I18N.reproducibility, lang)}: ${th.reproducibility}`); });

  /* APPENDIX D — WORKING PAPERS */
  pdf.newPage();
  pdf.heading(t(I18N.secD, lang));
  pdf.addBookmark(t(I18N.secD, lang));
  pdf.introText(lang === 'de' ? 'Arbeitspapiere für jede Anforderung.' : 'Working papers for each requirement.');
  reqs.forEach(r => {
    pdf.checkSpace(35); pdf.separator();
    pdf.metaBox([{ labels: [lang === 'de' ? 'ANFORDERUNG' : 'REQUIREMENT', lang === 'de' ? 'ARTIKEL' : 'ARTICLE', 'STATUS'], values: [r.id, r.article, ''], badge: { status: r.status, col: 2 } }]);
    pdf.sectionLabel(r.name);
    if (r.evidence) pdf.bodyText(humanizeEvidence(r.evidence, lang), 4);
    if (r.rationale) pdf.bodyText(r.rationale, 4);
    if (r.status !== 'pass' && r.measure) { pdf.sectionLabel(t(I18N.measure, lang)); pdf.bodyText(r.measure, 4); }
  });

  /* ABBREVIATIONS */
  pdf.newPage();
  const abbrEntries = lang === 'de' ? [
    { abbr: 'IACS', meaning: 'International Association of Classification Societies' },
    { abbr: 'UR E27', meaning: 'Unified Requirement E27 — Cyber Resilience of On-Board Systems and Equipment' },
    { abbr: 'UR E26', meaning: 'Unified Requirement E26 — Cyber Resilience of Ships' },
    { abbr: 'CBS', meaning: 'Computer Based System — Rechnergestütztes Bordsystem' },
    { abbr: 'ECDIS', meaning: 'Electronic Chart Display and Information System' },
    { abbr: 'NMEA', meaning: 'National Marine Electronics Association (Kommunikationsprotokoll)' },
    { abbr: 'SOLAS', meaning: 'Safety of Life at Sea — Internationales Übereinkommen' },
    { abbr: 'OT', meaning: 'Operational Technology — Betriebstechnologie' },
    { abbr: 'VSAT', meaning: 'Very Small Aperture Terminal — Satellitenkommunikation' },
    { abbr: 'MFA', meaning: 'Multi-Faktor-Authentifizierung' },
    { abbr: 'ETO', meaning: 'Electro-Technical Officer' },
    { abbr: 'P0-P3', meaning: 'Prioritätsstufen: P0=Sofort, P1=Kurzfristig, P2=Mittelfristig, P3=Empfohlen' },
  ] : [
    { abbr: 'IACS', meaning: 'International Association of Classification Societies' },
    { abbr: 'UR E27', meaning: 'Unified Requirement E27 — Cyber Resilience of On-Board Systems and Equipment' },
    { abbr: 'UR E26', meaning: 'Unified Requirement E26 — Cyber Resilience of Ships' },
    { abbr: 'CBS', meaning: 'Computer Based System' },
    { abbr: 'ECDIS', meaning: 'Electronic Chart Display and Information System' },
    { abbr: 'NMEA', meaning: 'National Marine Electronics Association (communication protocol)' },
    { abbr: 'SOLAS', meaning: 'Safety of Life at Sea' },
    { abbr: 'OT', meaning: 'Operational Technology' },
    { abbr: 'VSAT', meaning: 'Very Small Aperture Terminal — Satellite Communications' },
    { abbr: 'MFA', meaning: 'Multi-Factor Authentication' },
    { abbr: 'ETO', meaning: 'Electro-Technical Officer' },
    { abbr: 'P0-P3', meaning: 'Priority levels: P0=Immediate, P1=Short-term, P2=Medium-term, P3=Recommended' },
  ];
  pdf.abbreviationLegend(abbrEntries, lang === 'de' ? 'Abkürzungsverzeichnis' : 'Abbreviations');

  /* SAVE */
  const filename = `IACS_UR_E27_Assessment_${intakeData.facilityName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  pdf.save(filename);
}
