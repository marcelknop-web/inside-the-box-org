/**
 * IACS UR E26 PDF Report — Audit-grade report for Maritime Cyber Resilience
 * Uses PdfDoc from pdfCore.ts for consistent, premium layout
 */
import type { IecThreat, IecReq, IecIntakeData } from '@/data/iec62443Ur26Data';
import { threatId, FR_CATEGORIES, computeCbsScores, controlAppliesToCbs, computeConformance } from '@/data/iec62443Ur26Data';
import type { ReviewSummary } from '@/data/iec62443Data';
import type { QaCheck } from '@/utils/iec62443Ur26QualityCheck';
import { createPdfDoc, LAYOUT, C, humanizeEvidence, evidenceProcedure } from '@/utils/pdfCore';

export interface Iec62443ReportData {
  intakeData: IecIntakeData;
  threats: IecThreat[];
  reqs: IecReq[];
  language: 'de' | 'en' | 'fr';
  isDraft?: boolean;
  qaChecks?: QaCheck[];
  fixLog?: string[];
  qaIterations?: number;
  reviewSummary?: ReviewSummary;
}

const I18N = {
  title: { de: 'IACS UR E26 Cyber Resilience Assessment', en: 'IACS UR E26 Cyber Resilience Assessment', fr: 'Évaluation IACS UR E26 Cyber Résilience' },
  subtitle: { de: 'Prüfbericht nach IACS UR E26 — Cyber-Resilienz von Bordsystemen', en: 'Assessment Report pursuant to IACS UR E26 — Cyber Resilience of On-Board Systems', fr: 'Rapport d\'évaluation selon IACS UR E26 — Cyber résilience des systèmes embarqués' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  reportId: { de: 'Bericht-Nr.', en: 'Report No.', fr: 'N° de rapport' },
  generated: { de: 'Erstellt am', en: 'Generated on', fr: 'Généré le' },
  facility: { de: 'Schiff/System', en: 'Vessel/System', fr: 'Navire/Système' },
  securityLevel: { de: 'Ziel-Security-Level', en: 'Target Security Level', fr: 'Niveau de sécurité cible' },
  sec1: { de: '1  Zusammenfassung für die Geschäftsleitung', en: '1  Management Summary', fr: '1  Synthèse pour la direction' },
  sec2: { de: '2  Anwendbarkeitserklärung', en: '2  Applicability Statement', fr: '2  Déclaration d\'applicabilité' },
  sec3: { de: '3  Feststellungen im Einzelnen', en: '3  Detailed Findings', fr: '3  Constatations détaillées' },
  sec3a: { de: '3.1  Bedrohungslandschaft', en: '3.1  Threat Landscape', fr: '3.1  Paysage des menaces' },
  sec3b: { de: '3.2  Anwendbare und teilweise anwendbare Controls', en: '3.2  Applicable & Partially Applicable Controls', fr: '3.2  Contrôles applicables et partiellement applicables' },
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
  pass: { de: 'Nicht anwendbar', en: 'Not applicable', fr: 'Non applicable' },
  partial: { de: 'Teilweise anwendbar', en: 'Partially applicable', fr: 'Partiellement applicable' },
  fail: { de: 'Anwendbar', en: 'Applicable', fr: 'Applicable' },
  sources: { de: 'Quellenverweise', en: 'Source References', fr: 'Sources' },
  priority: { de: 'Priorität', en: 'Priority', fr: 'Priorité' },
  effort: { de: 'Geschätzter Aufwand', en: 'Estimated Effort', fr: 'Effort estimé' },
  iecRef: { de: 'E26-Referenz', en: 'E26 Reference', fr: 'Référence E26' },
  fr: { de: 'Anforderungskategorie', en: 'Requirement Category', fr: 'Catégorie d\'exigence' },
  reproducibility: { de: 'Reproduzierbarkeit', en: 'Reproducibility', fr: 'Reproductibilité' },
  evidenceQuality: { de: 'Evidenz-Qualität', en: 'Evidence Quality', fr: 'Qualité de la preuve' },
  // ── Conformance (kept strictly separate from the risk rating) ──
  conformanceScore: { de: 'Konformitätsgrad', en: 'Conformance Score', fr: 'Taux de conformité' },
  met: { de: 'Erfüllt', en: 'Met', fr: 'Satisfait' },
  partiallyMet: { de: 'Teilweise erfüllt', en: 'Partially met', fr: 'Partiellement satisfait' },
  notMet: { de: 'Nicht erfüllt', en: 'Not met', fr: 'Non satisfait' },
  conformanceTitle: { de: 'Konformität (Anforderungserfüllung)', en: 'Conformance (Requirement Compliance)', fr: 'Conformité (respect des exigences)' },
  riskTitle: { de: 'Risikolage (getrennt von der Konformität)', en: 'Risk Landscape (separate from compliance)', fr: 'Situation de risque (distincte de la conformité)' },
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

export async function generateIec62443Ur26Report(data: Iec62443ReportData): Promise<void> {
  const { intakeData, threats, reqs, language: lang, isDraft, qaChecks, fixLog, reviewSummary } = data;
  const dateStr = new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB');

  const passReqs = reqs.filter(r => r.status === 'pass');
  const partialReqs = reqs.filter(r => r.status === 'partial');
  const failReqs = reqs.filter(r => r.status === 'fail');
  const critRisks = threats.filter(th => th.likelihood * th.impact >= 20);
  const highRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 13 && s < 20; });
  const medRisks = threats.filter(th => { const s = th.likelihood * th.impact; return s >= 6 && s < 13; });
  const lowRisks = threats.filter(th => th.likelihood * th.impact < 6);
  const complianceRate = reqs.length > 0 ? Math.round(((passReqs.length + partialReqs.length * 0.5) / reqs.length) * 100) : 0;
  // Conventional conformance KPI (Pass=100 · Partial=50 · Fail=0) reported with
  // an explicit met / partially met / not-met breakdown so it can never be read
  // as "only X % of E26 is in scope".
  const conf = computeConformance(reqs);

  const pdf = await createPdfDoc({
    lang,
    isDraft,
    reportPrefix: 'E26',
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

  const noResidualScope = critRisks.length === 0 && failReqs.length === 0;

  // Contextual lead-in paragraph
  const contextLead = lang === 'de'
    ? `Der vorliegende Bericht dokumentiert die Ergebnisse der Anwendbarkeitsprüfung des Schiffs bzw. Systems ${intakeData.facilityName} gemäß IACS UR E26. Die Bewertung wurde anhand der Anforderungen aus Kapitel 4–16 der IACS UR E26 durchgeführt, wobei insgesamt ${threats.length} Bedrohungsszenarien analysiert und ${reqs.length} Anforderungen auf ihre Anwendbarkeit hin geprüft wurden.`
    : lang === 'fr'
    ? `Le présent rapport documente les résultats de l'évaluation d'applicabilité du navire/système ${intakeData.facilityName} conformément à l'IACS UR E26. L'évaluation a porté sur les exigences des chapitres 4 à 16 de l'IACS UR E26, couvrant ${threats.length} scénarios de menaces et l'applicabilité de ${reqs.length} exigences.`
    : `This report documents the results of the applicability review of vessel/system ${intakeData.facilityName} in accordance with IACS UR E26. The review assessed the requirements of Chapters 4–16 of IACS UR E26, covering ${threats.length} threat scenarios and the applicability of ${reqs.length} requirements.`;
  pdf.introText(contextLead);

  // Verdict — prefer AI-generated core finding when available
  const verdictText = reviewSummary?.coreFinding
    ? reviewSummary.coreFinding
    : lang === 'de'
    ? noResidualScope
      ? `Im Rahmen der durchgeführten Anwendbarkeitsprüfung konnte festgestellt werden, dass für das Schiff bzw. System ${intakeData.facilityName} keine offenen Anforderungen im Restumfang (residual scope) der IACS UR E26 verbleiben.`
      : `Die Prüfung des Schiffs bzw. Systems ${intakeData.facilityName} ergibt einen Konformitätsgrad von ${conf.score} % gegenüber den Anforderungen der IACS UR E26 (${conf.pass} erfüllt, ${conf.partial} teilweise erfüllt, ${conf.fail} nicht erfüllt). Getrennt davon wurden ${critRisks.length} kritische Risiken festgestellt, die vorrangige Behandlung erfordern.`
    : lang === 'fr'
    ? noResidualScope
      ? `L'évaluation d'applicabilité a permis de constater qu'aucune exigence de l'IACS UR E26 ne subsiste dans le périmètre résiduel du navire/système ${intakeData.facilityName}.`
      : `L'évaluation du navire/système ${intakeData.facilityName} aboutit à un taux de conformité de ${conf.score} % par rapport aux exigences de l'IACS UR E26 (${conf.pass} satisfaites, ${conf.partial} partiellement satisfaites, ${conf.fail} non satisfaites). Séparément, ${critRisks.length} risques critiques nécessitant un traitement prioritaire ont été identifiés.`
    : noResidualScope
    ? `The applicability review has determined that no IACS UR E26 requirements remain within the residual scope of vessel/system ${intakeData.facilityName}.`
    : `The review of vessel/system ${intakeData.facilityName} yields a conformance score of ${conf.score}% against the requirements of IACS UR E26 (${conf.pass} met, ${conf.partial} partially met, ${conf.fail} not met). Separately, ${critRisks.length} critical risks were identified that require priority treatment.`;

  pdf.verdictBox(verdictText);

  // ── Conformance (requirement compliance) — kept strictly separate from risk ──
  pdf.heading(t(I18N.conformanceTitle, lang), 2);
  pdf.kpiRow([
    [`${conf.score} %`, t(I18N.conformanceScore, lang)],
    [String(conf.pass), t(I18N.met, lang)],
    [String(conf.partial), t(I18N.partiallyMet, lang)],
    [String(conf.fail), t(I18N.notMet, lang)],
  ]);
  pdf.complianceBar(passReqs.length, partialReqs.length, failReqs.length, {
    pass: t(I18N.met, lang), partial: t(I18N.partiallyMet, lang), fail: t(I18N.notMet, lang),
    title: lang === 'de' ? 'IACS UR E26 Konformitätsverteilung' : lang === 'fr' ? 'Répartition de la conformité IACS UR E26' : 'IACS UR E26 Conformance Distribution',
  });

  // ── Risk landscape — a separate dimension from requirement conformance ──
  pdf.heading(t(I18N.riskTitle, lang), 2);
  pdf.kpiRow([
    [String(threats.length), lang === 'de' ? 'Bedrohungen' : lang === 'fr' ? 'Menaces' : 'Threats'],
    [String(critRisks.length), lang === 'de' ? 'Kritisch (≥ 20)' : lang === 'fr' ? 'Critique (≥ 20)' : 'Critical (≥ 20)'],
    [String(highRisks.length), lang === 'de' ? 'Hoch (13–19)' : lang === 'fr' ? 'Élevé (13–19)' : 'High (13–19)'],
    [String(medRisks.length + lowRisks.length), lang === 'de' ? 'Mittel/Gering' : lang === 'fr' ? 'Moyen/Faible' : 'Medium/Low'],
  ]);
  pdf.riskDistribution(
    { critical: critRisks.length, high: highRisks.length, medium: medRisks.length, low: lowRisks.length },
    { critical: lang === 'de' ? 'Kritisch' : lang === 'fr' ? 'Critique' : 'Critical', high: lang === 'de' ? 'Hoch' : lang === 'fr' ? 'Élevé' : 'High', medium: lang === 'de' ? 'Mittel' : lang === 'fr' ? 'Moyen' : 'Medium', low: lang === 'de' ? 'Niedrig' : lang === 'fr' ? 'Faible' : 'Low', title: lang === 'de' ? 'Risikoverteilung' : lang === 'fr' ? 'Répartition des risques' : 'Risk Severity Distribution' },
  );

  // Risk Heatmap
  pdf.heading(lang === 'de' ? 'Risikomatrix (5 × 5)' : lang === 'fr' ? 'Matrice de risque (5 × 5)' : 'Risk Matrix (5 × 5)', 2);
  pdf.riskHeatmap(threats, {
    title: lang === 'de' ? '5×5 Risikomatrix' : lang === 'fr' ? 'Matrice de risque 5×5' : '5×5 Risk Matrix',
    likelihood: t(I18N.likelihood, lang),
    impact: t(I18N.impact, lang),
  });

  // Top Findings
  if (critRisks.length > 0) {
    pdf.heading(lang === 'de' ? 'Kritische Befunde (Top-Findings)' : lang === 'fr' ? 'Constatations critiques' : 'Critical Findings (Top Findings)', 2);
    const topFindingsIntro = lang === 'de'
      ? `Die folgenden Bedrohungen weisen den höchsten Risiko-Score auf und erfordern vorrangige Behandlung:`
      : lang === 'fr'
      ? `Les menaces suivantes présentent le score de risque le plus élevé et nécessitent un traitement prioritaire :`
      : `The following threats carry the highest risk scores and require priority remediation:`;
    pdf.introText(topFindingsIntro);
    critRisks.slice(0, 5).forEach(th => {
      const tid = threatId(th);
      const score = th.likelihood * th.impact;
      pdf.field(tid, `${th.name} — Score: ${score} (${riskLabel(score, lang)})`);
    });
  }

  // Recommended Actions
  pdf.heading(lang === 'de' ? 'Handlungsempfehlung' : lang === 'fr' ? 'Recommandation' : 'Recommended Action', 2);
  const actionText = reviewSummary?.recommendation
    ? reviewSummary.recommendation
    : lang === 'de'
    ? noResidualScope
      ? 'Es wird empfohlen, die Anwendbarkeitsbewertung zu dokumentieren und eine jährliche Neubewertung im Rahmen des kontinuierlichen Verbesserungsprozesses einzuplanen.'
      : `Es wird dringend empfohlen, die im Restumfang verbleibenden Anforderungen mit klaren Verantwortlichkeiten und verbindlichen Fristen zu versehen. Bis zur vollständigen Behandlung aller kritischen Punkte sollte ein wöchentliches Tracking-Verfahren etabliert werden.`
    : lang === 'fr'
    ? noResidualScope
      ? 'Il est recommandé de documenter l\'évaluation d\'applicabilité et de planifier une réévaluation annuelle dans le cadre du processus d\'amélioration continue.'
      : `Il est fortement recommandé d'attribuer aux exigences du périmètre résiduel des responsabilités claires et des échéances contraignantes. Un suivi hebdomadaire devrait être mis en place jusqu'au traitement complet de tous les points critiques.`
    : noResidualScope
    ? 'It is recommended to document the applicability assessment and schedule an annual reassessment as part of the continuous improvement process.'
    : `It is strongly recommended that the requirements remaining in residual scope be assigned clear ownership and binding deadlines. A weekly tracking process should be established until all critical items have been fully addressed.`;
  pdf.bodyParagraph(actionText);

  /* 2. APPLICABILITY STATEMENT */
  pdf.newPage();
  pdf.heading(t(I18N.sec2, lang));
  pdf.addBookmark(t(I18N.sec2, lang));

  const applicabilityVerdict = lang === 'de'
    ? noResidualScope
      ? `Auf Grundlage der durchgeführten Anwendbarkeitsprüfung wird festgestellt, dass für das Schiff bzw. System ${intakeData.facilityName} keine offenen Anforderungen der IACS UR E26 im Restumfang verbleiben.`
      : complianceRate >= 60
      ? `Für das Schiff bzw. System ${intakeData.facilityName} verbleibt ein überschaubarer Restumfang nicht bzw. teilweise erfüllter Anforderungen der IACS UR E26. Der Konformitätsgrad beträgt ${conf.score} %. Die verbleibenden Anforderungen sind innerhalb der im Maßnahmenplan definierten Fristen zu behandeln.`
      : `Für das Schiff bzw. System ${intakeData.facilityName} verbleibt ein wesentlicher Restumfang nicht erfüllter Anforderungen der IACS UR E26. Der Konformitätsgrad von ${conf.score} % liegt unterhalb des angestrebten Schwellenwerts. Eine umfassende Überarbeitung der CBS-Sicherheitsarchitektur ist vor dem nächsten Klasseerneuerungsbesuch zwingend erforderlich.`
    : lang === 'fr'
    ? noResidualScope
      ? `Sur la base de l'évaluation d'applicabilité réalisée, il est constaté qu'aucune exigence de l'IACS UR E26 ne subsiste dans le périmètre résiduel du navire/système ${intakeData.facilityName}.`
      : complianceRate >= 60
      ? `Un périmètre résiduel limité d'exigences non ou partiellement satisfaites de l'IACS UR E26 subsiste pour le navire/système ${intakeData.facilityName}. Le taux de conformité est de ${conf.score} %. Les exigences restantes doivent être traitées dans les délais définis dans le plan d'action.`
      : `Un périmètre résiduel important d'exigences non satisfaites de l'IACS UR E26 subsiste pour le navire/système ${intakeData.facilityName}. Le taux de conformité de ${conf.score} % est inférieur au seuil visé. Une refonte complète de l'architecture de sécurité CBS est requise avant la prochaine visite de renouvellement de classe.`
    : noResidualScope
    ? `Based on the applicability review conducted, it is determined that no IACS UR E26 requirements remain within the residual scope of vessel/system ${intakeData.facilityName}.`
    : complianceRate >= 60
    ? `A limited residual scope of unmet or partially met IACS UR E26 requirements remains for vessel/system ${intakeData.facilityName}. The conformance score is ${conf.score}%. The remaining requirements must be addressed within the timeframes defined in the remediation plan.`
    : `A substantial residual scope of unmet IACS UR E26 requirements remains for vessel/system ${intakeData.facilityName}. The conformance score of ${conf.score}% falls below the targeted threshold. A comprehensive overhaul of the CBS security architecture is required prior to the next class renewal survey.`;

  pdf.verdictBox(applicabilityVerdict);

  const methodNote = lang === 'de'
    ? `Der Konformitätsgrad wird als gewichteter Mittelwert berechnet: erfüllte Anforderungen mit 100 %, teilweise erfüllte mit 50 % und nicht erfüllte mit 0 %. Aus der Verteilung von ${conf.pass} erfüllten, ${conf.partial} teilweise erfüllten und ${conf.fail} nicht erfüllten Anforderungen bei insgesamt ${conf.total} geprüften Anforderungen ergibt sich ein Konformitätsgrad von ${conf.score} %. Der Konformitätsgrad bewertet ausschließlich die Anforderungserfüllung und ist von der Risikobewertung (Eintrittswahrscheinlichkeit × Auswirkung) getrennt zu betrachten.`
    : lang === 'fr'
    ? `Le taux de conformité est calculé comme une moyenne pondérée : exigences satisfaites à 100 %, partiellement satisfaites à 50 % et non satisfaites à 0 %. À partir de la répartition de ${conf.pass} satisfaites, ${conf.partial} partiellement satisfaites et ${conf.fail} non satisfaites sur ${conf.total} exigences évaluées, un taux de conformité de ${conf.score} % est obtenu. Le taux de conformité évalue uniquement le respect des exigences et doit être considéré séparément de l'évaluation du risque (probabilité × impact).`
    : `The conformance score is calculated as a weighted average: requirements met at 100%, partially met at 50%, and not met at 0%. From the distribution of ${conf.pass} met, ${conf.partial} partially met, and ${conf.fail} not met out of ${conf.total} reviewed requirements, a conformance score of ${conf.score}% is derived. The conformance score measures requirement compliance only and is to be considered separately from the risk rating (likelihood × impact).`;
  pdf.bodyText(methodNote);

  /* 3. DETAILED FINDINGS */
  pdf.newPage();
  pdf.heading(t(I18N.sec3, lang));
  pdf.addBookmark(t(I18N.sec3, lang));
  pdf.heading(t(I18N.sec3a, lang), 2);
  pdf.addBookmark(t(I18N.sec3a, lang), 2);

  const introThreats = lang === 'de'
    ? `Die nachfolgende Bedrohungsanalyse orientiert sich an den Anforderungskategorien der IACS UR E26. Jedes identifizierte Szenario wurde systematisch nach Eintrittswahrscheinlichkeit und potenzieller Auswirkung auf die Schiffssicherheit bewertet. Bedrohungen mit einem Risiko-Score von 20 oder höher werden als kritisch eingestuft und erfordern unverzügliche Gegenmaßnahmen.`
    : `The following threat analysis is structured according to the requirement categories of IACS UR E26. Each identified scenario has been systematically assessed by likelihood and potential impact on vessel safety. Threats with a risk score of 20 or above are classified as critical and require immediate countermeasures.`;
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
    ? `Die nachfolgende Übersicht dokumentiert die Einzelbewertung der Anwendbarkeit jeder geprüften IACS-UR-E26-Anforderung. Für anwendbare und teilweise anwendbare Anforderungen werden konkrete Maßnahmen sowie nachweisbare Umsetzungskriterien (Definition of Done) angegeben, um eine strukturierte Nachverfolgung des Restumfangs zu ermöglichen.`
    : `The following overview documents the individual applicability assessment of each reviewed IACS UR E26 requirement. For applicable and partially applicable requirements, concrete measures and verifiable acceptance criteria (Definition of Done) are provided to enable structured follow-up of the residual scope.`;
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

  /* 3b. CBS DEEP DIVE — per-system readiness matrix */
  if (intakeData.assessmentType === 'deepdive' && intakeData.systemTypes.length > 0) {
    const cbsScores = computeCbsScores(reqs, intakeData.systemTypes);
    if (cbsScores.length > 0) {
      pdf.newPage();
      const ddTitle = lang === 'de' ? 'CBS Deep Dive — Bewertung je System' : lang === 'fr' ? 'CBS Deep Dive — évaluation par système' : 'CBS Deep Dive — System-by-System Readiness';
      pdf.heading(ddTitle);
      pdf.addBookmark(ddTitle);
      pdf.introText(lang === 'de'
        ? 'Die Bewertung je CBS leitet sich ausschließlich aus dem bewerteten Status der für das jeweilige System relevanten Controls ab (Erfüllt 100 · Teilweise 50 · Nicht erfüllt 0). Es werden keine Werte erfunden.'
        : lang === 'fr'
          ? 'Le score par CBS découle uniquement du statut évalué des contrôles pertinents pour chaque système (Conforme 100 · Partiel 50 · Non conforme 0). Aucune valeur n\'est inventée.'
          : 'Each CBS score is derived solely from the assessed status of the controls relevant to that system (Pass 100 · Partial 50 · Fail 0). No values are invented.');
      const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
      pdf.dataTableHeader(`${pad('CBS', 30)}${pad('Score', 8)}${pad('Ctrls', 7)}${pad('Pass', 6)}${pad('Part', 6)}${pad('Fail', 6)}`);
      cbsScores.forEach(c => {
        const plain = c.label.replace(/[^\x20-\x7E]/g, '').trim();
        pdf.dataTableRow(`${pad(plain, 30)}${pad(c.score + '%', 8)}${pad(String(c.applicable), 7)}${pad(String(c.pass), 6)}${pad(String(c.partial), 6)}${pad(String(c.fail), 6)}`);
      });

      /* CBS Risk Ranking — Highest / Lowest Risk Systems */
      if (cbsScores.length >= 2) {
        const byScore = [...cbsScores].sort((a, b) => a.score - b.score);
        const n = Math.min(3, Math.floor(byScore.length / 2) || 1);
        const highest = byScore.slice(0, n);
        const lowest = [...byScore].reverse().slice(0, n);
        const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim();

        pdf.heading(lang === 'de' ? 'Systeme mit höchstem Risiko' : lang === 'fr' ? 'Systèmes à risque le plus élevé' : 'Highest Risk Systems', 2);
        pdf.introText(lang === 'de'
          ? 'Systeme mit der geringsten Reife — vorrangiger Handlungsbedarf vor dem Klassebesuch.'
          : lang === 'fr'
            ? 'Systèmes à la plus faible maturité — action prioritaire avant la visite de classe.'
            : 'Systems with the lowest readiness — priority action required before class survey.');
        highest.forEach((c, i) => pdf.bodyText(`${i + 1}. ${clean(c.label)} — ${c.score}% (${c.fail} fail, ${c.partial} partial)`, 4));

        pdf.heading(lang === 'de' ? 'Systeme mit niedrigstem Risiko' : lang === 'fr' ? 'Systèmes à risque le plus faible' : 'Lowest Risk Systems', 2);
        pdf.introText(lang === 'de'
          ? 'Systeme mit der höchsten Reife — am besten auf den Klassebesuch vorbereitet.'
          : lang === 'fr'
            ? 'Systèmes à la plus haute maturité — les mieux préparés à la visite de classe.'
            : 'Systems with the highest readiness — best positioned for class survey.');
        lowest.forEach((c, i) => pdf.bodyText(`${i + 1}. ${clean(c.label)} — ${c.score}% (${c.pass} pass)`, 4));
      }

      /* CBS-grouped findings — system-specific recommendations */
      const cbsFindings = cbsScores
        .map(c => ({ ...c, controls: reqs.filter(r => r.status !== 'pass' && controlAppliesToCbs(r.id, c.id)) }))
        .filter(c => c.controls.length > 0);
      if (cbsFindings.length > 0) {
        pdf.heading(lang === 'de' ? 'CBS-spezifische Befunde & Empfehlungen' : lang === 'fr' ? 'Constatations & recommandations par CBS' : 'CBS-Specific Findings & Recommendations', 2);
        pdf.introText(lang === 'de'
          ? 'Offene Befunde je System mit der jeweiligen systemspezifischen Empfehlung.'
          : lang === 'fr'
            ? 'Constatations ouvertes par système avec la recommandation spécifique correspondante.'
            : 'Open findings grouped per system, with the system-specific recommendation for each relevant control.');
        cbsFindings.forEach(c => {
          pdf.checkSpace(30);
          pdf.heading(`${c.label.replace(/[^\x20-\x7E]/g, '').trim()} — ${c.score}% (${c.controls.length} open)`, 3);
          c.controls.forEach(r => {
            pdf.checkSpace(16);
            pdf.field(r.id, r.name);
            if (r.measure) pdf.fieldInline(lang === 'de' ? 'Empfehlung' : lang === 'fr' ? 'Recommandation' : 'Recommendation', r.measure, 4);
          });
        });
      }
    }
  }



  /* 4. RECOMMENDATIONS & ROADMAP */
  pdf.newPage();
  pdf.heading(t(I18N.sec4, lang));
  pdf.addBookmark(t(I18N.sec4, lang));

  const introRoadmap = lang === 'de'
    ? 'Die nachfolgenden Handlungsempfehlungen sind nach Dringlichkeit und Risikokritikalität priorisiert. Maßnahmen der Prioritätsstufe P0 sind als Sofortmaßnahmen einzustufen und müssen zwingend vor dem nächsten Klasseerneuerungsbesuch abgeschlossen werden. Die übrigen Maßnahmen sind gemäß der angegebenen Zeitrahmen umzusetzen.'
    : 'The following recommendations are prioritised by urgency and risk criticality. Measures classified as P0 are to be treated as immediate actions and must be completed prior to the next class renewal survey. Remaining measures are to be implemented within the specified timeframes.';
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
    ? `Der vorliegende Bericht dokumentiert die Ergebnisse einer strukturierten Anwendbarkeitsprüfung des Schiffs bzw. Systems ${intakeData.facilityName} gemäß den Anforderungen der IACS UR E26 (Cyber Resilience of Ships). Die Prüfung wurde am ${dateStr} durchgeführt.\n\nZielsetzung der Bewertung war die systematische Identifikation und Bewertung von Bedrohungen für die an Bord installierten rechnergestützten Systeme (Computer Based Systems, CBS) sowie die Feststellung der Anwendbarkeit der Anforderungen der IACS UR E26 (Kapitel 4–16) und des daraus resultierenden Restumfangs.\n\nDer Bericht richtet sich an Reeder, Schiffsführung, den Electro-Technical Officer (ETO) bzw. IT-Verantwortlichen an Bord sowie an die zuständige Klassifikationsgesellschaft.`
    : `This report documents the results of a structured applicability review of vessel/system ${intakeData.facilityName} pursuant to the requirements of IACS UR E26 (Cyber Resilience of Ships). The review was conducted on ${dateStr}.\n\nThe objective was the systematic identification and assessment of threats to Computer Based Systems (CBS) installed on board, as well as the determination of the applicability of the requirements set out in IACS UR E26 (Chapters 4–16) and the resulting residual scope.\n\nThis report is intended for ship owners, vessel management, the Electro-Technical Officer (ETO) or IT responsible on board, and the relevant classification society.`;
  pdf.bodyParagraph(contextText);

  /* 7. METHODOLOGY */
  pdf.newPage();
  pdf.heading(t(I18N.sec7, lang));
  pdf.addBookmark(t(I18N.sec7, lang));
  const methodText = lang === 'de'
    ? `Die Bewertung folgt einem strukturierten, sechsstufigen Prüfprozess:\n\n1. Scope-Definition: Identifikation der zu prüfenden rechnergestützten Bordsysteme (CBS) gemäß IACS UR E26. Der Prüfungsumfang wird gemeinsam mit dem Auftraggeber festgelegt.\n\n2. Bedrohungsanalyse: Systematische Identifikation und Dokumentation von Bedrohungsszenarien, die für die an Bord installierten CBS relevant sind.\n\n3. Risikobewertung: Bewertung jedes Bedrohungsszenarios anhand einer 5×5-Matrix nach Eintrittswahrscheinlichkeit und Auswirkungsschwere.\n\n4. E26-Anwendbarkeitsabgleich: Abgleich der identifizierten Bedrohungen mit den Anforderungen der IACS UR E26 (Kapitel 4–16) zur Feststellung der Anwendbarkeit und des Restumfangs.\n\n5. Maßnahmenableitung: Ableitung priorisierter Handlungsempfehlungen (P0 bis P3) mit konkreten Umsetzungskriterien und Aufwandsschätzungen.\n\n6. Qualitätssicherung: Automatisierte Validierung der Berichtskonsistenz, Evidenzqualität und fachlichen Korrektheit mittels regelbasierter Prüflogik.`
    : `The review follows a structured, six-step process:\n\n1. Scope Definition: Identification of Computer Based Systems (CBS) on board to be assessed per IACS UR E26. The scope is jointly defined with the commissioning party.\n\n2. Threat Analysis: Systematic identification and documentation of threat scenarios relevant to the CBS installed on board.\n\n3. Risk Assessment: Evaluation of each threat scenario using a 5×5 matrix by likelihood and impact severity.\n\n4. E26 Applicability Mapping: Alignment of identified threats with the requirements of IACS UR E26 (Chapters 4–16) to determine applicability and residual scope.\n\n5. Remediation Planning: Derivation of prioritised recommendations (P0 through P3) with concrete acceptance criteria and effort estimates.\n\n6. Quality Assurance: Automated validation of report consistency, evidence quality, and technical correctness using rule-based verification logic.`;
  pdf.bodyParagraph(methodText);

  /* 8. DISCLAIMER */
  pdf.newPage();
  pdf.heading(t(I18N.sec8, lang));
  pdf.addBookmark(t(I18N.sec8, lang));
  const disclaimer = lang === 'de'
    ? `Der vorliegende Bericht wurde auf Grundlage der zum Prüfzeitpunkt (${dateStr}) verfügbaren Informationen und Dokumentationen erstellt. Eine Gewährleistung für Vollständigkeit und Richtigkeit der vom Auftraggeber bereitgestellten Daten kann nicht übernommen werden.\n\nDer Bericht stellt keine formale Klasse-Zertifizierung nach IACS UR E26 dar und ersetzt nicht die Prüfung durch eine anerkannte Klassifikationsgesellschaft. Für eine offizielle Zertifizierung ist die Beauftragung einer solchen zwingend erforderlich.\n\nDie im Bericht enthaltenen Aufwandsschätzungen dienen als Orientierungswerte und können je nach Schiffstyp, CBS-Ausstattung, Hersteller-Support und betrieblichen Rahmenbedingungen variieren.`
    : `This report was prepared based on the information and documentation available at the time of the assessment (${dateStr}). No guarantee can be given for the completeness and accuracy of the data provided by the commissioning party.\n\nThis report does not constitute formal class certification under IACS UR E26 and does not replace assessment by a recognised classification society. Official certification requires the engagement of such a body.\n\nThe effort estimates contained in this report serve as indicative values and may vary depending on vessel type, CBS equipment, vendor support, and operational conditions.`;
  pdf.bodyParagraph(disclaimer);

  /* APPENDIX A */
  pdf.newPage();
  pdf.heading(t(I18N.secA, lang));
  pdf.addBookmark(t(I18N.secA, lang));
  pdf.introText(lang === 'de' ? 'Vollständige Prüfdaten in strukturierter Form.' : 'Complete audit data in structured form.');

  pdf.mappingTable(
    threats.map(th => ({ id: threatId(th), name: th.name, category: th.fr, ref: th.iecRef, evidenceId: `E-${String(th.id).padStart(3, '0')}`, score: `${th.likelihood * th.impact}` })),
    { title: lang === 'de' ? 'Bedrohungs-Mapping' : 'Threat Mapping', colId: 'ID', colName: lang === 'de' ? 'Bezeichnung' : 'Name', colCat: 'Kat.', colRef: 'E26-Ref', colEvidence: lang === 'de' ? 'Evidenz' : 'Evidence', colScore: 'Score' }
  );

  pdf.mappingTable(
    reqs.map(r => ({ id: r.id, name: r.name, category: r.status.toUpperCase(), ref: r.article, evidenceId: r.priority || '—' })),
    { title: lang === 'de' ? 'Anforderungs-Mapping' : 'Requirement Mapping', colId: 'ID', colName: lang === 'de' ? 'Bezeichnung' : 'Name', colCat: 'Status', colRef: 'E26-Ref', colEvidence: lang === 'de' ? 'Priorität' : 'Priority' }
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
  threats.forEach(th => {
    pdf.checkSpace(25);
    pdf.field(`E-${String(th.id).padStart(3, '0')} (${threatId(th)})`, th.evidence);
    pdf.metaLine(`${t(I18N.evidenceQuality, lang)}: ${th.evidenceQuality}/5 | ${t(I18N.reproducibility, lang)}: ${th.reproducibility}`);
    // Audit procedure
    const proc = evidenceProcedure(th.evidence.toLowerCase().includes('scan') ? 'nmap-scan.txt'
      : th.evidence.toLowerCase().includes('config') ? 'config-export.txt'
      : th.evidence.toLowerCase().includes('log') ? 'log-config-screenshot.png'
      : th.evidence.toLowerCase().includes('pcap') || th.evidence.toLowerCase().includes('wireshark') ? 'capture.pcap'
      : 'analysis-notes.txt', lang);
    pdf.doc.setFont(pdf.bodyFontName, 'italic'); pdf.doc.setFontSize(6.5); pdf.doc.setTextColor(...C.light);
    pdf.doc.text(`  → ${proc}`, LAYOUT.LEFT + 4, pdf.y); pdf.y += 4;
    pdf.doc.setFont(pdf.bodyFontName, 'normal'); pdf.doc.setFontSize(LAYOUT.BODY_SIZE); pdf.doc.setTextColor(...C.dark);
  });

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
    { abbr: 'UR E26', meaning: 'Unified Requirement E26 — Cyber Resilience of Ships' },
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
    { abbr: 'UR E26', meaning: 'Unified Requirement E26 — Cyber Resilience of Ships' },
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
  const filename = `IACS_UR_E26_Assessment_${intakeData.facilityName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  pdf.save(filename);
}
