/**
 * IEC 62443 PDF Report — Audit-grade report for Industrial Automation Security
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

/* ════════════════════════════════════════════════════════════
   I18N
   ════════════════════════════════════════════════════════════ */
const I18N = {
  title: { de: 'IEC 62443 Security Assessment', en: 'IEC 62443 Security Assessment', fr: 'Évaluation de sécurité IEC 62443' },
  subtitle: { de: 'Prüfbericht nach IEC 62443 — Industrielle Automatisierungssysteme', en: 'Assessment Report pursuant to IEC 62443 — Industrial Automation', fr: 'Rapport d\'évaluation selon IEC 62443 — Automatisation industrielle' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  facility: { de: 'Anlage', en: 'Facility', fr: 'Installation' },
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
  iecRef: { de: 'IEC 62443-Referenz', en: 'IEC 62443 Reference', fr: 'Référence IEC 62443' },
  fr: { de: 'Foundational Requirement', en: 'Foundational Requirement', fr: 'Exigence fondamentale' },
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

/* ════════════════════════════════════════════════════════════
   Main Export
   ════════════════════════════════════════════════════════════ */
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
    reportPrefix: 'IEC62443',
    confidentialLabel: t(I18N.confidential, lang),
    pageLabel: t(I18N.page, lang),
    draftWatermark: lang === 'de' ? 'ENTWURF' : lang === 'fr' ? 'BROUILLON' : 'DRAFT',
  });

  /* ══════════════ COVER PAGE ══════════════ */
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

  /* ══════════════ TABLE OF CONTENTS ══════════════ */
  const tocEntries = [
    t(I18N.sec1, lang), t(I18N.sec2, lang), null,
    t(I18N.sec3, lang), `    ${t(I18N.sec3a, lang)}`, `    ${t(I18N.sec3b, lang)}`, null,
    t(I18N.sec4, lang), null,
    t(I18N.sec5, lang), t(I18N.sec6, lang), t(I18N.sec7, lang), t(I18N.sec8, lang), null,
    t(I18N.secA, lang), t(I18N.secB, lang), t(I18N.secC, lang), t(I18N.secD, lang),
  ];
  pdf.tableOfContents(t(I18N.toc, lang), tocEntries);

  /* ══════════════ 1. MANAGEMENT SUMMARY ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec1, lang));
  pdf.addBookmark(t(I18N.sec1, lang));

  const isCompliant = critRisks.length === 0 && failReqs.length === 0;
  const verdictText = lang === 'de'
    ? isCompliant
      ? `Die Anlage ${intakeData.facilityName} erfüllt die Anforderungen nach IEC 62443-3-3 auf dem Ziel-Security-Level ${intakeData.securityLevel.toUpperCase()}. Keine kritischen Abweichungen festgestellt.`
      : `Die Anlage ${intakeData.facilityName} erreicht ${complianceRate}% Konformität mit IEC 62443-3-3. ${critRisks.length} kritische Risiken und ${failReqs.length} nicht konforme Anforderungen erfordern Sofortmaßnahmen.`
    : lang === 'fr'
    ? isCompliant
      ? `L'installation ${intakeData.facilityName} satisfait les exigences IEC 62443-3-3 au niveau de sécurité cible ${intakeData.securityLevel.toUpperCase()}.`
      : `L'installation ${intakeData.facilityName} atteint ${complianceRate}% de conformité IEC 62443-3-3. ${critRisks.length} risques critiques et ${failReqs.length} exigences non conformes nécessitent une action immédiate.`
    : isCompliant
    ? `Facility ${intakeData.facilityName} meets IEC 62443-3-3 requirements at target security level ${intakeData.securityLevel.toUpperCase()}.`
    : `Facility ${intakeData.facilityName} achieves ${complianceRate}% compliance with IEC 62443-3-3. ${critRisks.length} critical risks and ${failReqs.length} non-compliant requirements demand immediate action.`;

  pdf.verdictBox(verdictText);

  pdf.kpiRow([
    [String(threats.length), lang === 'de' ? 'Bedrohungen' : 'Threats'],
    [String(critRisks.length), lang === 'de' ? 'Kritisch (>=20)' : 'Critical (>=20)'],
    [String(failReqs.length), lang === 'de' ? 'Nicht konform' : 'Non-Compliant'],
    [`${complianceRate}%`, lang === 'de' ? 'Konformitätsrate' : 'Compliance Rate'],
  ]);

  // Compliance bar
  pdf.complianceBar(passReqs.length, partialReqs.length, failReqs.length, {
    pass: t(I18N.pass, lang), partial: t(I18N.partial, lang), fail: t(I18N.fail, lang),
    title: lang === 'de' ? 'IEC 62443 Konformitätsverteilung' : 'IEC 62443 Compliance Distribution',
  });

  // Risk distribution
  pdf.riskDistribution(
    { critical: critRisks.length, high: highRisks.length, medium: medRisks.length, low: lowRisks.length },
    { critical: lang === 'de' ? 'Kritisch' : 'Critical', high: lang === 'de' ? 'Hoch' : 'High', medium: lang === 'de' ? 'Mittel' : 'Medium', low: lang === 'de' ? 'Niedrig' : 'Low', title: lang === 'de' ? 'Risikoverteilung' : 'Risk Severity Distribution' },
  );

  // Risk heatmap
  pdf.riskHeatmap(threats, {
    title: lang === 'de' ? '5×5 Risikomatrix' : '5×5 Risk Matrix',
    likelihood: t(I18N.likelihood, lang),
    impact: t(I18N.impact, lang),
  });

  // Top findings
  if (critRisks.length > 0) {
    pdf.heading(lang === 'de' ? 'Top-Findings' : 'Top Findings', 2);
    critRisks.slice(0, 5).forEach(th => {
      const tid = threatId(th);
      const score = th.likelihood * th.impact;
      pdf.field(tid, `${th.name} — Score: ${score} (${riskLabel(score, lang)})`);
    });
  }

  // Management action
  const actionText = lang === 'de'
    ? isCompliant
      ? 'Empfehlung: Konformitätsnachweis dokumentieren und jährliche Neubewertung planen.'
      : `Empfehlung: Sofortmaßnahmen (P0) aus Abschnitt 4 mit Verantwortlichkeiten und Fristen versehen. Wöchentliches Tracking bis zur Schließung aller kritischen Gaps. Geschätzte Remediation: siehe Abschnitt 4.`
    : isCompliant
    ? 'Recommendation: Document compliance evidence and schedule annual reassessment.'
    : `Recommendation: Assign owners and deadlines to P0 measures from Section 4. Weekly tracking until all critical gaps are closed.`;
  pdf.bodyParagraph(actionText);

  /* ══════════════ 2. COMPLIANCE STATEMENT ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec2, lang));
  pdf.addBookmark(t(I18N.sec2, lang));

  const complianceVerdict = lang === 'de'
    ? isCompliant
      ? `Die Anlage ${intakeData.facilityName} ist konform mit den Anforderungen der IEC 62443-3-3 auf Security Level ${intakeData.securityLevel.toUpperCase()}.`
      : complianceRate >= 60
      ? `Die Anlage ${intakeData.facilityName} ist bedingt konform mit IEC 62443-3-3. Die Konformitätsrate beträgt ${complianceRate}%. Gezielte Nachbesserungen sind erforderlich.`
      : `Die Anlage ${intakeData.facilityName} ist nicht konform mit IEC 62443-3-3. Die Konformitätsrate beträgt ${complianceRate}%. Eine umfassende Überarbeitung der OT-Sicherheitsarchitektur ist erforderlich.`
    : isCompliant
    ? `Facility ${intakeData.facilityName} is compliant with IEC 62443-3-3 at Security Level ${intakeData.securityLevel.toUpperCase()}.`
    : complianceRate >= 60
    ? `Facility ${intakeData.facilityName} is conditionally compliant with IEC 62443-3-3. Compliance rate: ${complianceRate}%. Targeted remediation required.`
    : `Facility ${intakeData.facilityName} is non-compliant with IEC 62443-3-3. Compliance rate: ${complianceRate}%. Comprehensive OT security architecture overhaul required.`;

  pdf.verdictBox(complianceVerdict);

  const methodNote = lang === 'de'
    ? `Methodik: PASS = 100%, PARTIAL = 50%, FAIL = 0%. Die gewichtete Konformitätsrate von ${complianceRate}% ergibt sich aus ${passReqs.length} konformen, ${partialReqs.length} teilweise konformen und ${failReqs.length} nicht konformen Anforderungen von insgesamt ${reqs.length}.`
    : `Methodology: PASS = 100%, PARTIAL = 50%, FAIL = 0%. The weighted compliance rate of ${complianceRate}% results from ${passReqs.length} compliant, ${partialReqs.length} partially compliant, and ${failReqs.length} non-compliant requirements out of ${reqs.length} total.`;
  pdf.bodyText(methodNote);

  /* ══════════════ 3. DETAILED FINDINGS ══════════════ */

  // 3.1 Threats
  pdf.newPage();
  pdf.heading(t(I18N.sec3, lang));
  pdf.addBookmark(t(I18N.sec3, lang));
  pdf.heading(t(I18N.sec3a, lang), 2);
  pdf.addBookmark(t(I18N.sec3a, lang), 2);

  const introThreats = lang === 'de'
    ? `Die Bedrohungsanalyse basiert auf dem IEC 62443 Foundational Requirements Framework (FR1-FR7) und bewertet jedes Szenario anhand von Eintrittswahrscheinlichkeit und Auswirkung. Kritische Risiken (Score >= 20) erfordern Sofortmaßnahmen.`
    : `The threat analysis is based on the IEC 62443 Foundational Requirements framework (FR1-FR7) and rates each scenario by likelihood and impact. Critical risks (score >= 20) require immediate action.`;
  pdf.introText(introThreats);

  // Threats sorted by risk score descending
  const sortedThreats = [...threats].sort((a, b) => (b.likelihood * b.impact) - (a.likelihood * a.impact));

  sortedThreats.forEach((th, idx) => {
    const tid = threatId(th);
    const score = th.likelihood * th.impact;
    const frLabel = FR_CATEGORIES[th.fr]?.label[lang] || th.fr;

    pdf.checkSpace(60);
    if (idx > 0) pdf.separator();

    // Finding header with status badge
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
    ? `Die folgende Übersicht zeigt die Bewertung jeder IEC 62443 System Requirement. Abweichungen werden mit konkreten Maßnahmen und nachweisbaren Umsetzungskriterien versehen.`
    : `The following overview shows the assessment of each IEC 62443 System Requirement. Deviations are accompanied by concrete measures and verifiable acceptance criteria.`;
  pdf.introText(introReqs);

  // Group by FR
  const frGroups = Object.keys(FR_CATEGORIES);
  frGroups.forEach(fr => {
    const frReqs = reqs.filter(r => r.id.startsWith(fr) || r.id.startsWith('CC'));
    if (fr !== 'FR1' && frReqs.length === 0) return;
    // Only show CC reqs in the last FR group
    const actualReqs = fr === 'FR7'
      ? reqs.filter(r => r.id.startsWith(fr) || r.id.startsWith('CC'))
      : reqs.filter(r => r.id.startsWith(fr));
    if (actualReqs.length === 0) return;

    const frLabel = FR_CATEGORIES[fr]?.label[lang] || fr;
    pdf.heading(`${fr} — ${frLabel}`, 2);

    actualReqs.forEach(r => {
      pdf.checkSpace(40);

      // Status badge + title
      const afterBadge = pdf.statusBadge(r.status);
      pdf.doc.setFont(pdf.headFontName, 'bold');
      pdf.doc.setFontSize(9);
      pdf.doc.setTextColor(...C.navy);
      pdf.doc.text(`${r.id}: ${r.name}`, afterBadge + 2, pdf.y);
      pdf.y += 6;

      pdf.metaLine(`${r.article}`);

      if (r.evidence) {
        pdf.sectionLabel(t(I18N.evidence, lang));
        pdf.bodyText(humanizeEvidence(r.evidence, lang), 4);
      }

      if (r.rationale) {
        pdf.sectionLabel(t(I18N.rationale, lang));
        pdf.bodyText(r.rationale, 4);
      }

      if (r.status !== 'pass') {
        if (r.gap) {
          pdf.sectionLabel(t(I18N.gap, lang));
          pdf.bodyText(r.gap, 4);
        }
        if (r.measure) {
          pdf.sectionLabel(t(I18N.measure, lang));
          pdf.bodyText(r.measure, 4);
        }
        if (r.criteria.length > 0) {
          pdf.sectionLabel(t(I18N.dod, lang));
          r.criteria.forEach(c => pdf.bulletItem(c, 4));
        }
        if (r.effort) {
          pdf.fieldInline(t(I18N.effort, lang), r.effort, 4);
        }
        if (r.priority) {
          pdf.fieldInline(t(I18N.priority, lang), r.priority, 4);
        }
      }

      pdf.y += 3;
    });
  });

  /* ══════════════ 4. RECOMMENDATIONS & ROADMAP ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec4, lang));
  pdf.addBookmark(t(I18N.sec4, lang));

  const introRoadmap = lang === 'de'
    ? 'Die Handlungsempfehlungen sind nach regulatorischer Dringlichkeit und Risikokritikalität priorisiert. P0-Maßnahmen sind Sofortmaßnahmen und müssen vor Wiederinbetriebnahme abgeschlossen sein.'
    : 'Recommendations are prioritised by regulatory urgency and risk criticality. P0 measures are immediate actions and must be completed before recommissioning.';
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

  // Effort summary
  pdf.heading(lang === 'de' ? '4.2  Wirtschaftliche Betrachtung' : '4.2  Economic Impact', 2);
  const totalEffortMin = reqs.filter(r => r.status !== 'pass' && r.effort).reduce((sum, r) => {
    const match = r.effort.match(/(\d+)/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);
  const totalEffortMax = reqs.filter(r => r.status !== 'pass' && r.effort).reduce((sum, r) => {
    const parts = r.effort.match(/(\d+)-(\d+)/);
    return sum + (parts ? parseInt(parts[2]) : 0);
  }, 0);

  pdf.effortBox({
    header: lang === 'de' ? 'AUFWANDSSCHÄTZUNG GESAMT' : 'TOTAL EFFORT ESTIMATE',
    rangeText: `${totalEffortMin}–${totalEffortMax}h (${Math.round(totalEffortMin / 8)}–${Math.round(totalEffortMax / 8)} ${lang === 'de' ? 'Personentage' : 'person-days'})`,
    assumptions: lang === 'de'
      ? ['Team: 2 OT-Security-Ingenieure, 1 Netzwerk-Ingenieur, 1 Projektleiter', 'Parallele Umsetzung mehrerer Maßnahmen möglich', 'Hersteller-Support für Firmware-Updates verfügbar']
      : ['Team: 2 OT security engineers, 1 network engineer, 1 project lead', 'Parallel implementation of multiple measures possible', 'Vendor support for firmware updates available'],
    uncertainties: lang === 'de'
      ? ['Legacy-Systeme ohne Hersteller-Support können Aufwand erhöhen', 'Produktionsstillstand für Netzwerksegmentierung einplanen']
      : ['Legacy systems without vendor support may increase effort', 'Production downtime for network segmentation must be planned'],
    validation: lang === 'de'
      ? 'Diese Schätzung basiert auf vergleichbaren OT-Security-Projekten. Tatsächliche Aufwände hängen von Anlagenspezifika ab.'
      : 'This estimate is based on comparable OT security projects. Actual effort depends on facility specifics.',
    assumptionsLabel: lang === 'de' ? 'Annahmen' : 'Assumptions',
    uncertaintiesLabel: lang === 'de' ? 'Unsicherheiten' : 'Uncertainties',
    validationLabel: lang === 'de' ? 'Validierung' : 'Validation',
  });

  /* ══════════════ 5. SCOPE ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec5, lang));
  pdf.addBookmark(t(I18N.sec5, lang));

  pdf.field(t(I18N.facility, lang), intakeData.facilityName);
  pdf.field(t(I18N.securityLevel, lang), intakeData.securityLevel.toUpperCase());
  if (intakeData.description) pdf.field(lang === 'de' ? 'Systembeschreibung' : 'System Description', intakeData.description);
  if (intakeData.systemTypes.length > 0) pdf.field(lang === 'de' ? 'Systemtypen' : 'System Types', intakeData.systemTypes.join(', '));
  if (intakeData.zones.length > 0) pdf.field(lang === 'de' ? 'Netzwerkzonen' : 'Network Zones', intakeData.zones.join(', '));
  if (intakeData.protocols.length > 0) pdf.field(lang === 'de' ? 'Protokolle' : 'Protocols', intakeData.protocols.join(', '));
  if (intakeData.roles.length > 0) pdf.field(lang === 'de' ? 'Beteiligte Rollen' : 'Involved Roles', intakeData.roles.join(', '));

  // Measures maturity table
  if (Object.keys(intakeData.measures).length > 0) {
    pdf.heading(lang === 'de' ? '5.1  Implementierte Sicherheitsmaßnahmen' : '5.1  Implemented Security Measures', 2);
    const measureEntries: [string, { active: boolean; documented: boolean; audited: boolean; certified: boolean }][] =
      Object.entries(intakeData.measures).map(([id, m]) => [id, { ...m, certified: false }]);
    pdf.measuresTable(measureEntries, {
      measure: lang === 'de' ? 'Maßnahme' : 'Measure',
      active: lang === 'de' ? 'Aktiv' : 'Active',
      doc: lang === 'de' ? 'Dokumentiert' : 'Documented',
      audit: lang === 'de' ? 'Auditiert' : 'Audited',
      cert: lang === 'de' ? 'Zertifiziert' : 'Certified',
      yes: lang === 'de' ? 'Ja' : 'Yes',
      no: lang === 'de' ? 'Nein' : 'No',
    });
  }

  if (intakeData.knownIssues) {
    pdf.heading(lang === 'de' ? '5.2  Bekannte Schwachstellen' : '5.2  Known Issues', 2);
    pdf.bodyParagraph(intakeData.knownIssues);
  }

  if (intakeData.files.length > 0) {
    pdf.heading(lang === 'de' ? '5.3  Eingereichte Dokumentation' : '5.3  Submitted Documentation', 2);
    intakeData.files.forEach(f => {
      pdf.bulletItem(`${f.name} (${(f.size / 1_000_000).toFixed(1)} MB) — ${f.type}`);
    });
  }

  /* ══════════════ 6. CONTEXT & OBJECTIVES ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec6, lang));
  pdf.addBookmark(t(I18N.sec6, lang));

  const contextText = lang === 'de'
    ? `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Sicherheitsbewertung der Anlage ${intakeData.facilityName} nach IEC 62443-3-3. Die Prüfung wurde am ${dateStr} durchgeführt.\n\nZielsetzung war die systematische Identifikation von Bedrohungen für industrielle Automatisierungssysteme (IACS) sowie die Bewertung der Konformität mit den Foundational Requirements (FR1-FR7) auf dem Ziel-Security-Level ${intakeData.securityLevel.toUpperCase()}.\n\nDer Bericht richtet sich an die Anlagenleitung, OT-Security-Verantwortliche und externe Auditoren. Er ist so strukturiert, dass die getroffenen Bewertungsentscheidungen durch Dritte vollständig nachvollzogen und verifiziert werden können.`
    : `This report documents the results of a structured security assessment of facility ${intakeData.facilityName} pursuant to IEC 62443-3-3. The assessment was conducted on ${dateStr}.\n\nThe objective was the systematic identification of threats to industrial automation and control systems (IACS) and the evaluation of compliance with Foundational Requirements (FR1-FR7) at target Security Level ${intakeData.securityLevel.toUpperCase()}.\n\nThe report is intended for plant management, OT security officers, and external auditors. It is structured to enable full traceability and verification of assessment decisions by third parties.`;
  pdf.bodyParagraph(contextText);

  /* ══════════════ 7. METHODOLOGY ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec7, lang));
  pdf.addBookmark(t(I18N.sec7, lang));

  const methodText = lang === 'de'
    ? `Die Bewertung folgt einem 6-stufigen Audit-Prozess:\n\n1. Scope-Definition: Identifikation der zu prüfenden Anlage, Zonen und Conduits nach IEC 62443-3-2.\n2. Bedrohungsanalyse: Systematische Identifikation von Bedrohungsszenarien basierend auf den 7 Foundational Requirements (FR1-FR7).\n3. Risikobewertung: Bewertung jedes Szenarios anhand einer 5×5-Matrix (Eintrittswahrscheinlichkeit × Auswirkung).\n4. Konformitäts-Mapping: Abgleich der identifizierten Bedrohungen mit den System Requirements (SR) nach IEC 62443-3-3.\n5. Maßnahmenableitung: Priorisierte Handlungsempfehlungen (P0-P3) mit Aufwandsschätzungen.\n6. Qualitätssicherung: Automatisierte Validierung der Berichtskonsistenz und -vollständigkeit.`
    : `The assessment follows a 6-step audit process:\n\n1. Scope Definition: Identification of the facility, zones, and conduits per IEC 62443-3-2.\n2. Threat Analysis: Systematic identification of threat scenarios based on 7 Foundational Requirements (FR1-FR7).\n3. Risk Assessment: Rating of each scenario using a 5×5 matrix (likelihood × impact).\n4. Compliance Mapping: Alignment of identified threats with System Requirements (SR) per IEC 62443-3-3.\n5. Remediation Planning: Prioritised recommendations (P0-P3) with effort estimates.\n6. Quality Assurance: Automated validation of report consistency and completeness.`;
  pdf.bodyParagraph(methodText);

  // Risk matrix explanation
  pdf.heading(lang === 'de' ? '7.1  Risikobewertungsmatrix' : '7.1  Risk Rating Matrix', 2);
  const riskMatrixText = lang === 'de'
    ? 'Die Risikobewertung verwendet eine 5×5-Matrix mit den Stufen: Kritisch (Score >= 20), Hoch (13-19), Mittel (6-12), Niedrig (1-5). Likelihood-Bewertung: 1 = Theoretisch, 2 = Unwahrscheinlich, 3 = Möglich, 4 = Wahrscheinlich, 5 = Fast sicher. Impact-Bewertung: 1 = Vernachlässigbar, 2 = Gering, 3 = Moderat, 4 = Schwerwiegend, 5 = Katastrophal (Safety-relevant).'
    : 'Risk rating uses a 5×5 matrix with levels: Critical (score >= 20), High (13-19), Medium (6-12), Low (1-5). Likelihood: 1=Theoretical, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost certain. Impact: 1=Negligible, 2=Minor, 3=Moderate, 4=Severe, 5=Catastrophic (safety-relevant).';
  pdf.bodyText(riskMatrixText);

  /* ══════════════ 8. DISCLAIMER ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.sec8, lang));
  pdf.addBookmark(t(I18N.sec8, lang));

  const disclaimer = lang === 'de'
    ? `Dieser Bericht wurde auf Grundlage der zum Prüfzeitpunkt (${dateStr}) verfügbaren Informationen erstellt. Die Bewertung basiert auf den vom Anlagenbetreiber bereitgestellten Daten sowie auf Ergebnissen technischer Prüfungen.\n\nDer Bericht stellt keine Zertifizierung nach IEC 62443 dar. Eine formale Zertifizierung erfordert die Beauftragung einer akkreditierten Zertifizierungsstelle.\n\nDie enthaltenen Risikobewertungen basieren auf zum Prüfzeitpunkt bekannten Bedrohungen und Schwachstellen. Neue Angriffstechniken oder Zero-Day-Schwachstellen können die Risikolandschaft verändern.\n\nDie Aufwandsschätzungen dienen als Orientierung und können je nach Anlagenspezifika, Legacy-Systemen und Hersteller-Support variieren.`
    : `This report was prepared based on information available at the time of assessment (${dateStr}). The evaluation is based on data provided by the facility operator and results of technical examinations.\n\nThis report does not constitute IEC 62443 certification. Formal certification requires engagement of an accredited certification body.\n\nRisk assessments are based on threats and vulnerabilities known at the time of assessment. New attack techniques or zero-day vulnerabilities may alter the risk landscape.\n\nEffort estimates serve as guidance and may vary depending on facility specifics, legacy systems, and vendor support.`;
  pdf.bodyParagraph(disclaimer);

  /* ══════════════ APPENDIX A — STRUCTURED DATA ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.secA, lang));
  pdf.addBookmark(t(I18N.secA, lang));

  const appendixIntro = lang === 'de'
    ? 'Dieser Anhang enthält die vollständigen Prüfdaten in strukturierter Form zur Nachvollziehbarkeit durch Dritte.'
    : 'This appendix contains complete audit data in structured form for third-party traceability.';
  pdf.introText(appendixIntro);

  // Threat mapping table
  pdf.mappingTable(
    threats.map(th => ({
      id: threatId(th),
      name: th.name,
      category: th.fr,
      ref: th.iecRef,
      evidenceId: `E-${String(th.id).padStart(3, '0')}`,
      score: `${th.likelihood * th.impact}`,
    })),
    {
      title: lang === 'de' ? 'Bedrohungs-Mapping' : 'Threat Mapping',
      colId: 'ID',
      colName: lang === 'de' ? 'Bezeichnung' : 'Name',
      colCat: 'FR',
      colRef: 'SR',
      colEvidence: lang === 'de' ? 'Evidenz' : 'Evidence',
      colScore: 'Score',
    }
  );

  // Requirement mapping table
  pdf.mappingTable(
    reqs.map(r => ({
      id: r.id,
      name: r.name,
      category: r.status.toUpperCase(),
      ref: r.article,
      evidenceId: r.priority || '—',
    })),
    {
      title: lang === 'de' ? 'Anforderungs-Mapping' : 'Requirement Mapping',
      colId: 'ID',
      colName: lang === 'de' ? 'Bezeichnung' : 'Name',
      colCat: 'Status',
      colRef: 'SR',
      colEvidence: lang === 'de' ? 'Priorität' : 'Priority',
    }
  );

  /* ══════════════ APPENDIX B — QA CHECKLIST ══════════════ */
  if (qaChecks && qaChecks.length > 0) {
    pdf.newPage();
    pdf.heading(t(I18N.secB, lang));
    pdf.addBookmark(t(I18N.secB, lang));

    const catLabels: Record<string, string> = lang === 'de'
      ? { consistency: 'A. Konsistenzprüfung', technical: 'B. Fachliche Korrektheit', evidence: 'C. Evidenzprüfung', editorial: 'D. Redaktionelle Prüfung', ot: 'E. OT-spezifische Prüfung' }
      : { consistency: 'A. Consistency Check', technical: 'B. Technical Correctness', evidence: 'C. Evidence Check', editorial: 'D. Editorial Check', ot: 'E. OT-specific Check' };

    pdf.qaChecks(
      qaChecks.map(c => ({ id: c.id, label: c.label, passed: c.passed, category: c.category, detail: c.detail, severity: c.severity })),
      ['consistency', 'technical', 'evidence', 'editorial', 'ot'],
      catLabels,
      lang === 'de' ? 'QA-Iterationen' : 'QA Iterations',
      data.qaIterations
    );

    if (fixLog && fixLog.length > 0) {
      pdf.heading(lang === 'de' ? 'Automatische Korrekturen' : 'Automated Corrections', 2);
      pdf.fixLog(fixLog);
    }
  }

  /* ══════════════ APPENDIX C — EVIDENCE INDEX ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.secC, lang));
  pdf.addBookmark(t(I18N.secC, lang));

  threats.forEach(th => {
    pdf.checkSpace(25);
    const tid = threatId(th);
    pdf.field(`E-${String(th.id).padStart(3, '0')} (${tid})`, th.evidence);
    pdf.metaLine(`${t(I18N.evidenceQuality, lang)}: ${th.evidenceQuality}/5 | ${t(I18N.reproducibility, lang)}: ${th.reproducibility}`);
  });

  /* ══════════════ APPENDIX D — WORKING PAPERS ══════════════ */
  pdf.newPage();
  pdf.heading(t(I18N.secD, lang));
  pdf.addBookmark(t(I18N.secD, lang));

  const wpIntro = lang === 'de'
    ? 'Die folgenden Arbeitspapiere dokumentieren die Prüfentscheidung für jede Anforderung. Sie dienen der lückenlosen Nachvollziehbarkeit des Audit-Prozesses.'
    : 'The following working papers document the assessment decision for each requirement, providing full audit trail traceability.';
  pdf.introText(wpIntro);

  reqs.forEach(r => {
    pdf.checkSpace(35);
    pdf.separator();

    pdf.metaBox([{
      labels: [lang === 'de' ? 'ANFORDERUNG' : 'REQUIREMENT', lang === 'de' ? 'ARTIKEL' : 'ARTICLE', 'STATUS'],
      values: [r.id, r.article, ''],
      badge: { status: r.status, col: 2 },
    }]);

    pdf.sectionLabel(r.name);
    if (r.evidence) pdf.bodyText(humanizeEvidence(r.evidence, lang), 4);
    if (r.rationale) pdf.bodyText(r.rationale, 4);
    if (r.status !== 'pass' && r.measure) {
      pdf.sectionLabel(t(I18N.measure, lang));
      pdf.bodyText(r.measure, 4);
    }
  });

  /* ══════════════ ABBREVIATION LEGEND ══════════════ */
  pdf.newPage();
  const abbrEntries = lang === 'de' ? [
    { abbr: 'FR1-FR7', meaning: 'Foundational Requirements 1-7 nach IEC 62443-3-3' },
    { abbr: 'SR x.x', meaning: 'System Requirement — spezifische Anforderung innerhalb eines FR' },
    { abbr: 'SL 1-4', meaning: 'Security Level 1-4 (Schutzstufen gegen unterschiedliche Angreifertypen)' },
    { abbr: 'IACS', meaning: 'Industrial Automation and Control Systems' },
    { abbr: 'OT', meaning: 'Operational Technology — Betriebstechnologie' },
    { abbr: 'DCS', meaning: 'Distributed Control System — Verteiltes Leitsystem' },
    { abbr: 'SPS/PLC', meaning: 'Speicherprogrammierbare Steuerung / Programmable Logic Controller' },
    { abbr: 'SCADA', meaning: 'Supervisory Control and Data Acquisition' },
    { abbr: 'DMZ', meaning: 'Demilitarisierte Zone — Netzwerkpufferzone zwischen IT und OT' },
    { abbr: 'P0-P3', meaning: 'Prioritätsstufen: P0=Sofort, P1=Kurzfristig, P2=Mittelfristig, P3=Empfohlen' },
    { abbr: 'PASS', meaning: 'Anforderung vollständig erfüllt (konform)' },
    { abbr: 'PARTIAL', meaning: 'Anforderung teilweise erfüllt' },
    { abbr: 'FAIL', meaning: 'Anforderung nicht erfüllt (nicht konform)' },
  ] : [
    { abbr: 'FR1-FR7', meaning: 'Foundational Requirements 1-7 per IEC 62443-3-3' },
    { abbr: 'SR x.x', meaning: 'System Requirement — specific requirement within a FR' },
    { abbr: 'SL 1-4', meaning: 'Security Level 1-4 (protection levels against different attacker types)' },
    { abbr: 'IACS', meaning: 'Industrial Automation and Control Systems' },
    { abbr: 'OT', meaning: 'Operational Technology' },
    { abbr: 'DCS', meaning: 'Distributed Control System' },
    { abbr: 'PLC', meaning: 'Programmable Logic Controller' },
    { abbr: 'SCADA', meaning: 'Supervisory Control and Data Acquisition' },
    { abbr: 'DMZ', meaning: 'Demilitarised Zone — Network buffer between IT and OT' },
    { abbr: 'P0-P3', meaning: 'Priority levels: P0=Immediate, P1=Short-term, P2=Medium-term, P3=Recommended' },
    { abbr: 'PASS', meaning: 'Requirement fully met (compliant)' },
    { abbr: 'PARTIAL', meaning: 'Requirement partially met' },
    { abbr: 'FAIL', meaning: 'Requirement not met (non-compliant)' },
  ];
  pdf.abbreviationLegend(abbrEntries, lang === 'de' ? 'Abkürzungsverzeichnis' : 'Abbreviations');

  /* ══════════════ SAVE ══════════════ */
  const filename = `IEC62443_Assessment_${intakeData.facilityName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  pdf.save(filename);
}
