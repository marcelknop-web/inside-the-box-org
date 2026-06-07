// Meta-Assessment Report PDF — universal assessment report
// Structure mirrors the DRYNET E27 Applicability Review template:
//   Cover → TOC → Executive Summary + Verdict overview → Scope →
//   Assessment Principles → Individual Findings → Control Matrix →
//   Risk Landscape → Recommendations & Roadmap → Conclusion
//
// Layer 1 (deterministic) is the source of truth; the AI insight layer is
// rendered as clearly-marked explanatory commentary only.
import { createPdfDoc, C, LAYOUT } from '@/utils/pdfCore';
import type {
  Lang, StandardProfile, IntakeAnswers,
  AssessmentResult, ComputedAssessment, InsightResult,
} from '@/data/metaAssessment/types';
import { tr } from '@/data/metaAssessment/types';
import { readinessRatingLabel, attentionLabel } from '@/data/metaAssessment/engine';
import { buildWorkingPapers, type WorkingPapers } from '@/data/metaAssessment/workingPapers';
import { renderWorkingPapers } from '@/utils/workingPapersPdf';
import { ORIGIN, REPORT_TITLE, type ReportMeta } from '@/data/metaAssessment/reportMeta';

export interface MetaReportData {
  profile: StandardProfile;
  lang: Lang;
  result: AssessmentResult;
  computed: ComputedAssessment;
  answers: IntakeAnswers;
  entityName: string;
  insights?: InsightResult | null;
  reportMeta?: ReportMeta;
  /** Internal Audit Mode — when true, append the Working Papers appendix. */
  includeWorkingPapers?: boolean;
  /** Pre-built working papers (falls back to building from the canonical data). */
  workingPapers?: WorkingPapers;
}

/* ── tiny i18n ─────────────────────────────────────────────── */
const T: Record<string, Record<Lang, string>> = {
  category: { de: 'PRÜFBERICHT', en: 'ASSESSMENT REPORT', fr: "RAPPORT D'ÉVALUATION" },
  client: { de: 'Einrichtung', en: 'Entity', fr: 'Entité' },
  reportType: { de: 'Berichtstyp', en: 'Report Type', fr: 'Type de rapport' },
  reportMetaTitle: { de: 'Berichtsmetadaten', en: 'Report Metadata', fr: 'Métadonnées du rapport' },
  standard: { de: 'Standard', en: 'Standard', fr: 'Standard' },
  regulation: { de: 'Regelwerk', en: 'Regulation', fr: 'Réglementation' },
  date: { de: 'Datum', en: 'Date', fr: 'Date' },
  prepared: { de: 'Erstellt durch', en: 'Prepared by', fr: 'Préparé par' },
  status: { de: 'Status', en: 'Status', fr: 'Statut' },
  confidential: { de: 'VERTRAULICH', en: 'CONFIDENTIAL', fr: 'CONFIDENTIEL' },
  page: { de: 'Seite', en: 'Page', fr: 'Page' },
  toc: { de: 'Inhaltsverzeichnis', en: 'Table of Contents', fr: 'Table des matières' },
  draft: { de: 'ENTWURF', en: 'DRAFT', fr: 'BROUILLON' },

  sec1: { de: '1  Zusammenfassung', en: '1  Executive Summary', fr: '1  Synthèse' },
  sec2: { de: '2  Gegenstand und Geltungsbereich', en: '2  Subject and Scope', fr: '2  Objet et périmètre' },
  sec3: { de: '3  Bewertungsprinzipien', en: '3  Assessment Principles', fr: "3  Principes d'évaluation" },
  sec4: { de: '4  Feststellungen im Einzelnen', en: '4  Individual Findings', fr: '4  Constatations détaillées' },
  sec5: { de: '5  Vollständige Kontrollmatrix', en: '5  Complete Control Matrix', fr: '5  Matrice de contrôle complète' },
  sec6: { de: '6  Risikolandschaft', en: '6  Risk Landscape', fr: '6  Paysage des risques' },
  sec7: { de: '7  Maßnahmen und Roadmap', en: '7  Recommendations and Roadmap', fr: '7  Recommandations et feuille de route' },
  sec8: { de: '8  AI Insights & Advisory', en: '8  AI Insights & Advisory', fr: '8  AI Insights & Advisory' },
  sec9: { de: '9  Conclusion', en: '9  Conclusion', fr: '9  Conclusion' },
  secWP: { de: 'Anhang A  Arbeitspapiere & Nachvollziehbarkeit', en: 'Appendix A  Working Papers & Traceability', fr: 'Annexe A  Documents de travail & traçabilité' },

  howProduced: { de: 'How This Assessment Was Produced', en: 'How This Assessment Was Produced', fr: 'How This Assessment Was Produced' },
  whyMatters: { de: 'Why This Matters', en: 'Why This Matters', fr: 'Why This Matters' },

  verdictOverview: { de: 'Befundübersicht', en: 'Verdict Overview', fr: 'Aperçu des verdicts' },
  attentionIndex: { de: 'Management-Attention-Index', en: 'Management Attention Index', fr: "Indice d'attention direction" },
  attentionDrivers: { de: 'Wesentliche Treiber', en: 'Key Drivers', fr: 'Facteurs clés' },
  auditReadiness: { de: 'Audit-Bereitschaft', en: 'Audit Readiness', fr: "Préparation à l'audit" },
  readiness: { de: 'Reifegrad', en: 'Readiness', fr: 'Maturité' },
  passed: { de: 'Erfüllt', en: 'Passed', fr: 'Conformes' },
  partial: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' },
  gaps: { de: 'Lücken', en: 'Gaps', fr: 'Lacunes' },
  distribution: { de: 'Konformitätsverteilung', en: 'Compliance Distribution', fr: 'Répartition de conformité' },
  scopeIntro: {
    de: 'Der folgende Abschnitt dokumentiert die im Intake erfassten Angaben zur geprüften Einrichtung. Diese bilden die Grundlage der regelbasierten Bewertung.',
    en: 'The following section documents the intake data captured for the assessed entity. These form the basis of the rule-based assessment.',
    fr: "La section suivante documente les données d'admission de l'entité évaluée. Elles constituent la base de l'évaluation basée sur des règles.",
  },
  principlesIntro: {
    de: 'Die Bewertung folgt einem revisionssicheren, dreistufigen Modell: Die Konformitätsentscheidung (erfüllt / teilweise / Lücke) wird ausschließlich regelbasiert aus den Intake-Antworten abgeleitet. Keine Feststellung wird von der KI erfunden. Risiken werden deterministisch aus den Lücken abgeleitet. Die KI wird ausschließlich für die erklärende Analyseebene eingesetzt.',
    en: 'The assessment follows an audit-safe, three-layer model: the compliance decision (pass / partial / gap) is derived strictly from the intake answers by deterministic rules. No finding is invented by the AI. Risks are derived deterministically from the gaps. The AI is used solely for the explanatory analysis layer.',
    fr: "L'évaluation suit un modèle vérifiable à trois niveaux : la décision de conformité (conforme / partiel / lacune) est dérivée strictement des réponses par des règles déterministes. Aucune constatation n'est inventée par l'IA. Les risques sont dérivés des lacunes. L'IA sert uniquement à la couche d'analyse explicative.",
  },
  findingsIntro: {
    de: 'Jede Anforderung wurde regelbasiert gegen die erfassten Nachweise geprüft. Lücken und teilweise Erfüllungen sind mit konkreten Maßnahmenempfehlungen versehen.',
    en: 'Each requirement was assessed against the captured evidence using deterministic rules. Gaps and partial compliance are accompanied by concrete remediation recommendations.',
    fr: 'Chaque exigence a été évaluée par rapport aux preuves saisies à l\'aide de règles déterministes. Les lacunes et conformités partielles sont assorties de recommandations concrètes.',
  },
  observation: { de: 'Nachweis / Beobachtung', en: 'Evidence / Observation', fr: 'Preuve / Observation' },
  gap: { de: 'Festgestellte Lücke', en: 'Identified Gap', fr: 'Lacune identifiée' },
  rationale: { de: 'Begründung', en: 'Rationale', fr: 'Justification' },
  measure: { de: 'Empfohlene Maßnahme', en: 'Recommended Measure', fr: 'Mesure recommandée' },
  colId: { de: 'ID', en: 'ID', fr: 'ID' },
  colRef: { de: 'Artikel', en: 'Article', fr: 'Article' },
  colTopic: { de: 'Thema', en: 'Topic', fr: 'Sujet' },
  colVerdict: { de: 'Verdikt', en: 'Verdict', fr: 'Verdict' },
  matrixIntro: {
    de: 'Vollständige, nachvollziehbare Übersicht aller geprüften Anforderungen mit Verdikt.',
    en: 'Complete, traceable overview of all assessed requirements with verdict.',
    fr: 'Aperçu complet et traçable de toutes les exigences évaluées avec verdict.',
  },
  riskIntro: {
    de: 'Die folgenden Risiken wurden deterministisch aus den festgestellten Lücken abgeleitet (Eintrittswahrscheinlichkeit × Auswirkung).',
    en: 'The following risks were derived deterministically from the identified gaps (likelihood × impact).',
    fr: 'Les risques suivants ont été dérivés des lacunes identifiées (probabilité × impact).',
  },
  riskDist: { de: 'Risikoverteilung', en: 'Risk Distribution', fr: 'Répartition des risques' },
  heatmap: { de: 'Risiko-Heatmap', en: 'Risk Heatmap', fr: 'Carte thermique des risques' },
  likelihood: { de: 'Wahrscheinlichkeit', en: 'Likelihood', fr: 'Probabilité' },
  impact: { de: 'Auswirkung', en: 'Impact', fr: 'Impact' },
  critical: { de: 'Kritisch', en: 'Critical', fr: 'Critique' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  low: { de: 'Niedrig', en: 'Low', fr: 'Faible' },
  noRisks: { de: 'Es wurden keine offenen Risiken aus Lücken abgeleitet.', en: 'No open risks were derived from gaps.', fr: "Aucun risque ouvert n'a été dérivé des lacunes." },
  recsIntro: {
    de: 'Priorisierter Maßnahmenplan, abgeleitet aus den Lücken und Risiken.',
    en: 'Prioritised remediation plan, derived from the gaps and risks.',
    fr: "Plan d'action priorisé, dérivé des lacunes et des risques.",
  },
  roadmap: { de: 'Umsetzungs-Roadmap', en: 'Remediation Roadmap', fr: 'Feuille de route' },
  remediationTimeline: { de: 'Umsetzungs-Zeitplan', en: 'Remediation Timeline', fr: 'Calendrier de mise en œuvre' },
  phase: { de: 'Phase', en: 'Phase', fr: 'Phase' },
  months: { de: 'Monate', en: 'months', fr: 'mois' },
  noRecs: { de: 'Keine offenen Maßnahmen — alle Anforderungen erfüllt.', en: 'No open measures — all requirements met.', fr: 'Aucune mesure ouverte — toutes les exigences sont satisfaites.' },
  aiNote: {
    de: 'Hinweis: Dieser Abschnitt ist KI-generiert und ausschließlich erklärend. Er verändert keine Konformitätsbewertung.',
    en: 'Note: this section is AI-generated and strictly explanatory. It does not alter any compliance assessment.',
    fr: "Remarque : cette section est générée par IA et purement explicative. Elle ne modifie aucune évaluation de conformité.",
  },
  execNarrative: { de: 'Management-Lagebild', en: 'Executive Narrative', fr: 'Synthèse direction' },
  rootCauses: { de: 'Grundursachen', en: 'Root Causes', fr: 'Causes profondes' },
  gapClusters: { de: 'Kernthemen', en: 'Core Themes', fr: 'Thèmes clés' },
  crossControl: { de: 'Übergreifende Zusammenhänge', en: 'Cross-control Insights', fr: 'Liens transverses' },
  roadmapRationale: { de: 'Begründung der Roadmap', en: 'Roadmap Rationale', fr: 'Justification de la feuille de route' },
  auditorQuestions: { de: 'Vertiefende Audit-Fragen', en: 'Deepening Audit Questions', fr: "Questions d'audit" },
  execInsights: { de: 'Executive Insights', en: 'Executive Insights', fr: 'Executive Insights' },
  topWeaknesses: { de: 'Wichtigste Schwächen', en: 'Top Weaknesses', fr: 'Principales faiblesses' },
  topStrengths: { de: 'Wichtigste Stärken', en: 'Top Strengths', fr: 'Principales forces' },
  highestBusinessRisks: { de: 'Höchste Geschäftsrisiken', en: 'Highest Business Risks', fr: 'Risques métier majeurs' },
  multiRegulatory: { de: 'Mehrere Anforderungen betroffen', en: 'Multi-requirement Issues', fr: 'Plusieurs exigences' },
  managementFocus: { de: 'Management-Fokus zuerst', en: 'Management Focus First', fr: 'Priorités direction' },
  managementThemes: { de: 'Management-Themen', en: 'Management Themes', fr: 'Thèmes de direction' },
  currentState: { de: 'Ist-Zustand', en: 'Current State', fr: 'État actuel' },
  riskExposure: { de: 'Risiko-Exposition', en: 'Risk Exposure', fr: 'Exposition au risque' },
  improvementOpp: { de: 'Verbesserungspotenzial', en: 'Improvement Opportunity', fr: "Opportunité d'amélioration" },
  transformationPrograms: { de: 'Transformationsprogramme', en: 'Transformation Programs', fr: 'Programmes de transformation' },
  objectives: { de: 'Ziele', en: 'Objectives', fr: 'Objectifs' },
  expectedBenefits: { de: 'Erwarteter Nutzen', en: 'Expected Benefits', fr: 'Bénéfices attendus' },
  complexity: { de: 'Komplexität', en: 'Complexity', fr: 'Complexité' },
  businessValueLbl: { de: 'Geschäftswert', en: 'Business Value', fr: 'Valeur métier' },
  managementRoadmap: { de: 'Management-Roadmap', en: 'Management Roadmap', fr: 'Feuille de route direction' },
  maturityInsights: { de: 'Reifegrad-Analyse', en: 'Maturity Insights', fr: 'Analyse de maturité' },
  businessImpactLbl: { de: 'Business-Impact-Analyse', en: 'Business Impact Analysis', fr: 'Analyse impact métier' },
  systemicWeaknesses: { de: 'Potential Systemic Weaknesses', en: 'Potential Systemic Weaknesses', fr: 'Potential Systemic Weaknesses' },
  hypotheses: { de: 'Hypotheses', en: 'Hypotheses', fr: 'Hypotheses' },
  confidenceSummary: { de: 'Management Confidence Summary', en: 'Management Confidence Summary', fr: 'Management Confidence Summary' },
  insightLimitations: { de: 'AI Insight Limitations', en: 'AI Insight Limitations', fr: 'AI Insight Limitations' },
  assessmentFindingsLbl: { de: 'Assessment Findings', en: 'Assessment Findings', fr: 'Assessment Findings' },
  riskRatingsLbl: { de: 'Risk Ratings', en: 'Risk Ratings', fr: 'Risk Ratings' },
  evidenceStrength: { de: 'Evidence Strength Overview', en: 'Evidence Strength Overview', fr: 'Evidence Strength Overview' },
  consultantObservations: { de: 'Consultant Observations', en: 'Consultant Observations', fr: 'Consultant Observations' },
  implication: { de: 'Implication', en: 'Implication', fr: 'Implication' },
  recommendationLbl: { de: 'Recommendation', en: 'Recommendation', fr: 'Recommendation' },
  labelLegend: {
    de: 'Each item below is labelled FACT (deterministic assessment logic), INSIGHT (AI interpretation) or RECOMMENDATION (AI advisory). Confidence ratings apply only to AI interpretations, never to deterministic findings.',
    en: 'Each item below is labelled FACT (deterministic assessment logic), INSIGHT (AI interpretation) or RECOMMENDATION (AI advisory). Confidence ratings apply only to AI interpretations, never to deterministic findings.',
    fr: 'Each item below is labelled FACT (deterministic assessment logic), INSIGHT (AI interpretation) or RECOMMENDATION (AI advisory). Confidence ratings apply only to AI interpretations, never to deterministic findings.',
  },
  disclaimer: {
    de: 'Dieser Bericht stellt keine formale Zertifizierung dar und ersetzt nicht die Bewertung durch eine anerkannte Prüfstelle. Die Konformitätsbewertung beruht auf den im Intake gemachten Angaben.',
    en: 'This report does not constitute a formal certification and does not replace assessment by a recognised authority. The compliance assessment is based on the information provided during intake.',
    fr: "Ce rapport ne constitue pas une certification formelle et ne remplace pas l'évaluation par un organisme reconnu. L'évaluation de conformité repose sur les informations fournies lors de l'admission.",
  },
};

function t(key: string, _lang: Lang): string {
  return T[key]?.en ?? key;
}

function ratingLabel(r: string, _lang: Lang): string {
  if (r === 'low') return 'Low';
  if (r === 'high') return 'High';
  return 'Medium';
}

function confLabel(c?: string): string {
  const v = (c ?? '').toLowerCase();
  if (v === 'high') return 'High';
  if (v === 'low') return 'Low';
  return 'Medium';
}


const VERDICT_LABEL: Record<string, Record<Lang, string>> = {
  pass: { de: 'Erfüllt', en: 'Pass', fr: 'Conforme' },
  partial: { de: 'Teilweise', en: 'Partial', fr: 'Partiel' },
  fail: { de: 'Lücke', en: 'Gap', fr: 'Lacune' },
};

const PRIORITY_LABEL: Record<string, Record<Lang, string>> = {
  critical: { de: 'Kritisch', en: 'Critical', fr: 'Critique' },
  high: { de: 'Hoch', en: 'High', fr: 'Élevé' },
  medium: { de: 'Mittel', en: 'Medium', fr: 'Moyen' },
  low: { de: 'Niedrig', en: 'Low', fr: 'Faible' },
};

function formatAnswer(field: { type: string; options?: { id: string; label: any }[] }, val: string | string[], lang: Lang): string {
  if (val == null) return '—';
  const opts = field.options ?? [];
  const lbl = (id: string) => {
    const o = opts.find((x) => x.id === id);
    return o ? tr(o.label, lang) : id;
  };
  if (Array.isArray(val)) return val.length ? val.map(lbl).join(', ') : '—';
  if (field.type === 'single') return val ? lbl(val) : '—';
  return val || '—';
}

export async function generateMetaAssessmentPdf(data: MetaReportData): Promise<void> {
  const { profile, result, computed, answers, entityName, insights, reportMeta, includeWorkingPapers, workingPapers } = data;
  // The report is produced in English only, independent of the UI language.
  const lang: Lang = 'en';

  const pdf = await createPdfDoc({
    lang,
    reportPrefix: profile.name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'ASMT',
    confidentialLabel: `${t('confidential', lang)} — ${profile.name} ${profile.name && tr(profile.regulation, lang) ? '·' : ''} ${tr(profile.regulation, lang)}`.trim(),
    pageLabel: t('page', lang),
    draftWatermark: t('draft', lang),
    runningHeader: true,
    documentLabel: profile.name,


  });

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Cover ───────────────────────────────────────────────────
  pdf.coverPage({
    title: tr(profile.fullName, lang) || profile.name,
    subtitle: tr(profile.regulation, lang),
    entityName,
    fields: [
      [t('client', lang), entityName],
      [t('standard', lang), profile.name],
      [t('reportType', lang), REPORT_TITLE],
      [t('date', lang), dateStr],
      [t('prepared', lang), 'Inside the Box'],
      [t('status', lang), t('confidential', lang)],
    ],
    confidentialNote: t('confidential', lang),
  });

  // ── TOC ─────────────────────────────────────────────────────
  pdf.tableOfContents(t('toc', lang), [
    t('sec1', lang), t('sec2', lang), t('sec3', lang), t('sec4', lang),
    t('sec5', lang), t('sec6', lang), t('sec7', lang),
    ...(insights ? [t('sec8', lang)] : []),
    t('sec9', lang),
    ...(includeWorkingPapers ? [t('secWP', lang)] : []),
  ]);

  const merged = result.requirements.map((r) => {
    const meta = profile.requirements.find((x) => x.id === r.id);
    return { ...r, article: meta?.article ?? r.article ?? '', name: meta ? tr(meta.name, lang) : r.name };
  });
  // Single source of truth: counts come from the deterministic computed model.
  const pass = computed.score.counts.pass;
  const partial = computed.score.counts.partial;
  const fail = computed.score.counts.fail;
  const pct = computed.score.weighted;

  // ── 1 Executive Summary ─────────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec1', lang), 1);
  pdf.addBookmark(t('sec1', lang), 1);
  if (result.summary) pdf.bodyParagraph(result.summary);

  pdf.kpiRow([
    [`${pct}%`, t('readiness', lang)],
    [String(pass), t('passed', lang)],
    [String(partial), t('partial', lang)],
    [String(fail), t('gaps', lang)],
  ]);

  pdf.sectionLabel(t('distribution', lang));
  pdf.complianceBar(pass, partial, fail, {
    pass: t('passed', lang), partial: t('partial', lang), fail: t('gaps', lang),
    title: t('verdictOverview', lang),
  });

  // ── Management Attention Index (deterministic) ──────────────
  const att = computed.attentionIndex;
  pdf.heading(t('attentionIndex', lang), 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.fieldInline(t('attentionIndex', lang), `${attentionLabel(att.level, lang)}  (Critical ${att.counts.critical} · High ${att.counts.high} · Medium ${att.counts.medium} · Low ${att.counts.low})`);
  if (att.drivers.length) {
    pdf.sectionLabel(t('attentionDrivers', lang));
    att.drivers.forEach((d) => pdf.bulletItem(d));
  }

  // ── Audit Readiness dimensions (deterministic) ──────────────
  const ar = computed.auditReadiness;
  pdf.heading(t('auditReadiness', lang), 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.fieldInline(`${t('readiness', lang)} (overall)`, `${readinessRatingLabel(ar.overall, lang)} · ${ar.overallPct}%`);
  ar.dimensions.forEach((d) => {
    pdf.fieldInline(d.label, `${readinessRatingLabel(d.rating, lang)} · ${d.pct}%`);
    pdf.metaLine(d.basis);
  });

  // ── Why This Matters (translate results into business language) ──
  pdf.heading(t('whyMatters', lang), 2);
  pdf.bodyParagraph(
    'This section translates the assessment results into business language for executives, board members and management teams. It frames the findings in terms of business impact, regulatory exposure, operational consequences, financial implications and strategic priorities — not just a score.',
  );
  pdf.bulletItem('Business impact — how gaps affect day-to-day operations and service delivery.');
  pdf.bulletItem('Regulatory exposure — where the organisation falls short of mandatory obligations.');
  pdf.bulletItem('Operational consequences — the risks that materialise if gaps remain unaddressed.');
  pdf.bulletItem('Financial implications — potential cost of incidents, penalties and remediation.');
  pdf.bulletItem('Strategic priorities — what management should focus on first to reduce exposure.');

  // ── 2 Subject and Scope ─────────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec2', lang), 1);
  pdf.addBookmark(t('sec2', lang), 1);
  pdf.introText(t('scopeIntro', lang));
  pdf.field(t('client', lang), entityName);
  profile.intake.forEach((step) => {
    step.fields.forEach((f) => {
      const val = answers[f.id];
      if (val == null || (Array.isArray(val) && val.length === 0) || val === '') return;
      pdf.field(tr(f.label, lang), formatAnswer(f, val, lang));
    });
  });

  // ── 3 Assessment Principles ─────────────────────────────────
  pdf.heading(t('sec3', lang), 1);
  pdf.addBookmark(t('sec3', lang), 1);
  pdf.bodyParagraph(t('principlesIntro', lang));

  // ── How This Assessment Was Produced (trust & auditability) ──
  pdf.heading(t('howProduced', lang), 2);
  pdf.bulletItem('Assessment responses were collected through structured intake.');
  pdf.bulletItem('Compliance status was determined through deterministic assessment logic.');
  pdf.bulletItem('Risks were derived from the identified gaps.');
  pdf.bulletItem('AI generated explanatory insights, root cause analysis, clustering, management themes and roadmap recommendations.');
  pdf.bulletItem('AI did not create, modify or override findings, risks, evidence or compliance results.');

  // ── 4 Individual Findings ───────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec4', lang), 1);
  pdf.addBookmark(t('sec4', lang), 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText(t('findingsIntro', lang));

  // Single source of truth for the per-requirement structure: reuse the
  // working-paper records so every PDF type renders findings with the same
  // Control Objective → Assessment Question → Answer → Evidence → Result Logic → Result layout.
  const wpSource = workingPapers ?? buildWorkingPapers(profile, answers, result, computed, insights ?? null, reportMeta, lang);
  const wpById = new Map(wpSource.records.map((rec) => [rec.requirementId, rec]));

  merged.forEach((r, i) => {
    pdf.checkSpace(40);
    const wpRec = wpById.get(r.id);
    pdf.heading(`4.${i + 1}  ${r.id} — ${r.name}`, 3);
    pdf.metaLine(`${t('colRef', lang)}: ${r.article || '—'}`);
    pdf.statusBadge(r.status);
    pdf.y += 4;

    pdf.sectionLabel('Control Objective');
    pdf.bodyText(`${r.name}${r.article ? `  (${r.article})` : ''}`);

    pdf.sectionLabel('Assessment Question');
    pdf.bodyText(wpRec?.assessmentQuestion || `Has the organization implemented and evidenced "${r.name}" as required by ${r.article || profile.name}?`);

    pdf.sectionLabel('Answer');
    if (wpRec && wpRec.inputs.length) {
      wpRec.inputs.forEach((inp, k) => {
        pdf.fieldInline(inp.question, inp.answer);
        if (k < wpRec.inputs.length - 1) pdf.y += 2;
      });
    } else {
      pdf.bodyText('No rule-linked intake inputs recorded.');
    }

    pdf.sectionLabel('Evidence');
    pdf.bodyText(wpRec?.evidenceSubmitted || r.evidence || 'None');

    pdf.sectionLabel('Result Logic');
    if (wpRec && wpRec.ruleLogic.length) {
      wpRec.ruleLogic.forEach((line) => pdf.bulletItem(line));
    } else if (r.rationale) {
      pdf.bodyText(r.rationale);
    }
    if (r.gap) pdf.bodyText(r.gap);

    pdf.sectionLabel('Result');
    pdf.fieldInline('Deterministic Result', wpRec?.resultLabel || r.status);
    if (r.measure) { pdf.sectionLabel(t('measure', lang)); pdf.bodyText(r.measure); }
    pdf.separator();
  });

  // ── 5 Complete Control Matrix ───────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec5', lang), 1);
  pdf.addBookmark(t('sec5', lang), 1);
  pdf.introText(t('matrixIntro', lang));
  pdf.dataTableHeader(
    `${t('colId', lang).padEnd(10)}${t('colRef', lang).padEnd(14)}${t('colTopic', lang).padEnd(40)}${t('colVerdict', lang)}`
  );
  merged.forEach((r) => {
    const topic = (r.name || '').slice(0, 38);
    pdf.dataTableRow(
      `${r.id.padEnd(10)}${(r.article || '—').slice(0, 12).padEnd(14)}${topic.padEnd(40)}${VERDICT_LABEL[r.status][lang]}`
    );
  });

  // ── Evidence Strength Overview (deterministic, informational) ──
  const ev = computed.evidence;
  const evTotal = merged.length || 1;
  pdf.heading(t('evidenceStrength', lang), 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText('Informational overview of the strength of evidence supporting the assessment. It does not affect scoring or compliance status.');
  ([
    ['Very high', ev.byStrength.very_high],
    ['High', ev.byStrength.high],
    ['Medium', ev.byStrength.medium],
    ['Low', ev.byStrength.low],
    ['No evidence', ev.missing.length],
  ] as [string, number][]).forEach(([label, count]) => {
    pdf.fieldInline(label, `${count}  (${Math.round((count / evTotal) * 100)}%)`);
  });



  // ── 6 Risk Landscape ────────────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec6', lang), 1);
  pdf.addBookmark(t('sec6', lang), 1);
  pdf.metaLine(ORIGIN.risk);
  pdf.introText(t('riskIntro', lang));

  const risks = computed.risks;
  if (risks.length === 0) {
    pdf.bodyParagraph(t('noRisks', lang));
  } else {
    const counts = {
      critical: risks.filter((r) => r.rating === 'critical').length,
      high: risks.filter((r) => r.rating === 'high').length,
      medium: risks.filter((r) => r.rating === 'medium').length,
      low: risks.filter((r) => r.rating === 'low').length,
    };
    pdf.riskDistribution(counts, {
      critical: t('critical', lang), high: t('high', lang), medium: t('medium', lang), low: t('low', lang),
      title: t('riskDist', lang),
    });
    pdf.riskHeatmap(risks.map((r) => ({ likelihood: r.likelihood, impact: r.impact })), {
      title: t('heatmap', lang), likelihood: t('likelihood', lang), impact: t('impact', lang),
    });
    pdf.y += 2;
    [...risks].sort((a, b) => b.score - a.score).forEach((r) => {
      pdf.checkSpace(12);
      pdf.statusBadge(r.rating === 'low' ? 'pass' : r.rating === 'medium' ? 'partial' : 'fail');
      pdf.metaLine(`${r.id} · ${r.name}  (${t('impact', lang)} ${r.impact} × ${t('likelihood', lang)} ${r.likelihood} = ${r.score})`);
    });
  }

  // ── 7 Recommendations and Roadmap ───────────────────────────
  pdf.newPage();
  pdf.heading(t('sec7', lang), 1);
  pdf.addBookmark(t('sec7', lang), 1);
  pdf.introText(t('recsIntro', lang));

  if (computed.recommendations.length === 0) {
    pdf.bodyParagraph(t('noRecs', lang));
  } else {
    computed.recommendations.forEach((rec) => {
      pdf.checkSpace(22);
      pdf.heading(`${rec.title}`, 3);
      pdf.metaLine(`${PRIORITY_LABEL[rec.priority][lang]} · ${rec.duration} · ${rec.owner}`);
      if (rec.businessImpact) pdf.bodyText(rec.businessImpact);
    });

    pdf.heading(t('roadmap', lang), 2);
    computed.roadmap.forEach((bucket) => {
      if (bucket.items.length === 0) return;
      pdf.sectionLabel(`${t('phase', lang)} ${bucket.phase} ${t('months', lang)}`);
      bucket.items.forEach((it) => pdf.bulletItem(`${PRIORITY_LABEL[it.priority][lang]} — ${it.title}`));
    });
  }

  // ── 8 AI Analysis (explanatory) ─────────────────────────────
  if (insights) {
    pdf.newPage();
    pdf.heading(t('sec8', lang), 1);
    pdf.addBookmark(t('sec8', lang), 1);
    pdf.metaLine(ORIGIN.insight);
    pdf.introText(t('aiNote', lang));
    pdf.bodyParagraph(t('labelLegend', lang));

    if (insights.executiveNarrative) {
      pdf.sectionLabel(t('execNarrative', lang));
      pdf.metaLine('INSIGHT — AI interpretation');
      pdf.bodyParagraph(insights.executiveNarrative);
    }

    const ei = insights.executiveInsights;
    if (ei && (ei.topWeaknesses?.length || ei.topStrengths?.length || ei.managementFocus?.length)) {
      pdf.heading(t('execInsights', lang), 2);
      pdf.metaLine(`INSIGHT — AI interpretation · Confidence: ${confLabel(insights.confidence?.executiveInsights)}`);
      const list = (label: string, items?: string[]) => {
        if (!items?.length) return;
        pdf.sectionLabel(label);
        items.forEach((it) => pdf.bulletItem(it));
      };
      list(t('topWeaknesses', lang), ei.topWeaknesses);
      list(t('topStrengths', lang), ei.topStrengths);
      list(t('highestBusinessRisks', lang), ei.highestBusinessRisks);
      list(t('multiRegulatory', lang), ei.multiRegulatoryIssues);
      list(t('managementFocus', lang), ei.managementFocus);
    }

    if (insights.rootCauses?.length) {
      pdf.sectionLabel(t('rootCauses', lang));
      pdf.metaLine(`INSIGHT — AI interpretation · Confidence: ${confLabel(insights.confidence?.rootCauses)}`);
      insights.rootCauses.forEach((rc) => {
        pdf.bulletItem(`${rc.symptom} → ${rc.cause} [Confidence: ${confLabel(rc.confidence)}]`);
        if (rc.validationActivities?.length) pdf.metaLine(`Recommended validation: ${rc.validationActivities.join('; ')}`);
      });
    }
    if (insights.gapClusters?.length) {
      pdf.heading(t('gapClusters', lang), 2);
      pdf.metaLine('INSIGHT — AI interpretation');
      insights.gapClusters.forEach((gc) => {
        pdf.checkSpace(24);
        pdf.heading(gc.title, 3);
        if (gc.summary) pdf.bodyText(gc.summary);
        if (gc.businessImpact) { pdf.sectionLabel(t('businessImpactLbl', lang)); pdf.bodyText(gc.businessImpact); }
        if (gc.regulatoryImpact) { pdf.sectionLabel(t('multiRegulatory', lang)); pdf.bodyText(gc.regulatoryImpact); }
        if (gc.controlIds?.length) pdf.metaLine(gc.controlIds.join(', '));
      });
    }
    if (insights.crossControlInsights?.length) {
      pdf.sectionLabel(t('crossControl', lang));
      pdf.metaLine(`INSIGHT — AI interpretation · Confidence: ${confLabel(insights.confidence?.crossControlInsights)}`);
      insights.crossControlInsights.forEach((c) => pdf.bulletItem(c));
    }
    if (insights.systemicWeaknesses?.length) {
      pdf.heading(t('systemicWeaknesses', lang), 2);
      pdf.metaLine(`INSIGHT — AI interpretation · Confidence: ${confLabel(insights.confidence?.systemicWeaknesses)}`);
      pdf.introText('Recurring patterns identified across multiple findings, pointing to potential systemic governance or capability weaknesses.');
      insights.systemicWeaknesses.forEach((s) => {
        pdf.checkSpace(22);
        pdf.heading(s.area, 3);
        pdf.metaLine(`Confidence: ${confLabel(s.confidence)}`);
        if (s.pattern) pdf.bodyText(s.pattern);
        if (s.relatedControlIds?.length) pdf.metaLine(s.relatedControlIds.join(', '));
        if (s.validationActivities?.length) pdf.metaLine(`Recommended validation: ${s.validationActivities.join('; ')}`);
      });
    }
    if (insights.hypotheses?.length) {
      pdf.heading(t('hypotheses', lang), 2);
      pdf.metaLine('HYPOTHESIS — AI assumption requiring validation');
      pdf.introText('Explicit assumptions that are not directly evidenced by the assessment data and should be validated before being treated as fact.');
      insights.hypotheses.forEach((h) => {
        pdf.checkSpace(22);
        pdf.bulletItem(`${h.statement} [Confidence: ${confLabel(h.confidence)}]`);
        if (h.relatedControlIds?.length) pdf.metaLine(h.relatedControlIds.join(', '));
        if (h.validationActivities?.length) pdf.metaLine(`Recommended validation: ${h.validationActivities.join('; ')}`);
      });
    }
    if (insights.managementThemes?.length) {
      pdf.heading(t('managementThemes', lang), 2);
      pdf.metaLine(`INSIGHT — AI interpretation · Confidence: ${confLabel(insights.confidence?.managementThemes)}`);
      insights.managementThemes.forEach((m) => {
        pdf.checkSpace(28);
        pdf.heading(m.title, 3);
        pdf.metaLine(`Confidence: ${confLabel(m.confidence)}`);
        if (m.currentState) { pdf.sectionLabel(t('currentState', lang)); pdf.bodyText(m.currentState); }
        if (m.riskExposure) { pdf.sectionLabel(t('riskExposure', lang)); pdf.bodyText(m.riskExposure); }
        if (m.improvementOpportunity) { pdf.sectionLabel(t('improvementOpp', lang)); pdf.bodyText(m.improvementOpportunity); }
      });
    }
    if (insights.transformationPrograms?.length) {
      pdf.heading(t('transformationPrograms', lang), 2);
      pdf.metaLine(`RECOMMENDATION — AI advisory · Confidence: ${confLabel(insights.confidence?.transformationPrograms)}`);
      insights.transformationPrograms.forEach((p) => {
        pdf.checkSpace(28);
        pdf.heading(p.title, 3);
        pdf.metaLine(`${t('complexity', lang)}: ${ratingLabel(p.complexity, lang)} · ${t('businessValueLbl', lang)}: ${ratingLabel(p.businessValue, lang)} · Confidence: ${confLabel(p.confidence)}`);
        if (p.objectives) { pdf.sectionLabel(t('objectives', lang)); pdf.bodyText(p.objectives); }
        if (p.expectedBenefits) { pdf.sectionLabel(t('expectedBenefits', lang)); pdf.bodyText(p.expectedBenefits); }
        if (p.relatedRisks) { pdf.sectionLabel(t('riskExposure', lang)); pdf.bodyText(p.relatedRisks); }
        if (p.relatedControlIds?.length) pdf.metaLine(p.relatedControlIds.join(', '));
      });
    }
    if (insights.businessImpact?.length) {
      pdf.sectionLabel(t('businessImpactLbl', lang));
      pdf.metaLine('INSIGHT — AI interpretation');
      insights.businessImpact.forEach((b) => pdf.bulletItem(`${b.area}: ${b.consequence}`));
    }
    if (computed.maturity?.enabled && insights.maturityNarrative) {
      pdf.sectionLabel(t('maturityInsights', lang));
      pdf.metaLine('INSIGHT — AI interpretation');
      pdf.bodyParagraph(insights.maturityNarrative);
    }
    if (insights.managementRoadmap?.length) {
      pdf.heading(t('managementRoadmap', lang), 2);
      pdf.metaLine('RECOMMENDATION — AI advisory');
      insights.managementRoadmap.forEach((r) => {
        pdf.checkSpace(20);
        pdf.sectionLabel(`${r.phase} ${t('months', lang)}`);
        r.activities.forEach((a) => pdf.bulletItem(a));
        if (r.rationale) pdf.metaLine(r.rationale);
      });
    }
    if (insights.roadmapRationale) {
      pdf.sectionLabel(t('roadmapRationale', lang));
      pdf.metaLine('RECOMMENDATION — AI advisory');
      pdf.bodyParagraph(insights.roadmapRationale);
    }
    if (insights.auditorQuestions?.length) {
      pdf.sectionLabel(t('auditorQuestions', lang));
      pdf.metaLine('INSIGHT — AI interpretation');
      insights.auditorQuestions.forEach((q) => pdf.bulletItem(q));
    }
    if (insights.consultantObservations?.length) {
      pdf.heading(t('consultantObservations', lang), 2);
      pdf.metaLine('RECOMMENDATION — AI advisory');
      pdf.introText('Senior-consultant / virtual-CISO commentary on the overall posture.');
      insights.consultantObservations.forEach((o) => {
        pdf.checkSpace(24);
        pdf.bodyText(o.observation);
        if (o.implication) { pdf.sectionLabel(t('implication', lang)); pdf.bodyText(o.implication); }
        if (o.recommendation) { pdf.sectionLabel(t('recommendationLbl', lang)); pdf.bodyText(o.recommendation); }
        pdf.metaLine(`Confidence: ${confLabel(o.confidence)}`);
      });
    }



    // ── Management Confidence Summary (facts vs interpretation) ──
    pdf.heading(t('confidenceSummary', lang), 2);
    pdf.introText('This summary helps management distinguish objectively determined facts from analytical interpretation.');
    const confRows: [string, string, string][] = [
      [t('assessmentFindingsLbl', lang), 'High', 'FACT — deterministic'],
      [t('riskRatingsLbl', lang), 'High', 'FACT — deterministic'],
      [t('execInsights', lang), confLabel(insights.confidence?.executiveInsights), 'INSIGHT — AI interpretation'],
      [t('rootCauses', lang), confLabel(insights.confidence?.rootCauses), 'INSIGHT — AI interpretation'],
      [t('managementThemes', lang), confLabel(insights.confidence?.managementThemes), 'INSIGHT — AI interpretation'],
      [t('transformationPrograms', lang), confLabel(insights.confidence?.transformationPrograms), 'RECOMMENDATION — AI advisory'],
      [t('systemicWeaknesses', lang), confLabel(insights.confidence?.systemicWeaknesses), 'INSIGHT — AI interpretation'],
    ];
    confRows.forEach(([label, level, kind]) => {
      pdf.fieldInline(label, `Confidence: ${level}  (${kind})`);
    });

    // ── AI Insight Limitations (audit defensibility) ──
    pdf.heading(t('insightLimitations', lang), 2);
    pdf.bulletItem('AI-generated insights are analytical interpretations of assessment results.');
    pdf.bulletItem('They are intended to support internal audit, risk management and compliance improvement activities.');
    pdf.bulletItem('AI insights do not constitute audit findings, legal advice, regulatory opinions or certification decisions.');
    pdf.bulletItem('Root cause analyses and management observations should be validated through interviews, evidence review and management discussion.');
  }

  // ── 9 Conclusion ────────────────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec9', lang), 1);
  pdf.addBookmark(t('sec9', lang), 1);
  pdf.verdictBox(result.summary || `${entityName}: ${pct}% — ${pass} ${t('passed', lang)}, ${partial} ${t('partial', lang)}, ${fail} ${t('gaps', lang)}.`);
  pdf.bodyParagraph(t('disclaimer', lang));

  // ── Report Metadata (traceability / auditability) ───────────
  if (reportMeta) {
    pdf.sectionLabel(t('reportMetaTitle', lang));
    pdf.fieldInline('Assessment ID', reportMeta.assessmentId);
    pdf.fieldInline('Report Title', reportMeta.title);
    pdf.fieldInline('Report Version', reportMeta.reportVersion);
    pdf.fieldInline('Generated', new Date(reportMeta.generatedAt).toLocaleString('en-GB'));
    pdf.fieldInline('Assessment Engine', reportMeta.assessmentEngineVersion);
    pdf.fieldInline('AI Insight Engine', reportMeta.aiInsightEngineVersion);
  }

  // ── Appendix A  Working Papers & Traceability (Internal Audit Mode) ──
  if (includeWorkingPapers) {
    const wp = workingPapers
      ?? buildWorkingPapers(profile, answers, result, computed, insights, reportMeta, lang);
    pdf.newPage();
    renderWorkingPapers(pdf, wp);
  }

  pdf.save(`${profile.id}-assessment-${entityName.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.pdf`);
}
