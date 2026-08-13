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
  /** Auditor free-text evidence notes per obligation (requirement id → note). */
  auditorNotes?: Record<string, string>;
  /** Executive Brief — when true, produce a concise ~2-page management summary only. */
  executiveBrief?: boolean;
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

  partA: { de: 'TEIL A — MANAGEMENT-BERICHT', en: 'PART A — EXECUTIVE REPORT', fr: 'PARTIE A — RAPPORT DE DIRECTION' },
  partB: { de: 'TEIL B — NACHWEISPAKET', en: 'PART B — EVIDENCE PACK', fr: 'PARTIE B — DOSSIER DE PREUVES' },
  partAIntro: {
    de: 'Teil A richtet sich an Leitung und Entscheider: Readiness, Geltungsbereich, Risiken, Maßnahmenplan und Fazit. Belege je Anforderung stehen in Teil B.',
    en: 'Part A is written for management and decision-makers: readiness, scope, risks, action plan and conclusion. Requirement-level evidence sits in Part B.',
    fr: "La partie A s'adresse à la direction : préparation, périmètre, risques, plan d'action et conclusion. Les preuves par exigence figurent en partie B.",
  },
  partBIntro: {
    de: 'Teil B ist das Nachweispaket für Prüfer: Anforderung für Anforderung mit Antwort, Nachweis, Prüfstufe und Regel-Logik.',
    en: 'Part B is the evidence pack for verifiers: requirement by requirement with answer, evidence, verification level and rule logic.',
    fr: 'La partie B est le dossier de preuves pour les vérificateurs : exigence par exigence avec réponse, preuve, niveau de vérification et logique de règle.',
  },

  sec1: { de: '1  Zusammenfassung und Gesamturteil', en: '1  Executive Summary and Overall Opinion', fr: '1  Synthèse et opinion générale' },
  sec2: { de: '2  Auftrag, Geltungsbereich und Aussagegrenzen', en: '2  Engagement, Scope and Claims', fr: '2  Mission, périmètre et portée' },
  sec3: { de: '3  Vorgehen und Bewertungsgrundlage', en: '3  Approach and Basis of Assessment', fr: "3  Approche et base d'évaluation" },
  sec4: { de: '4  Feststellungen', en: '4  Findings', fr: '4  Constatations' },
  sec5: { de: '5  Ursachenanalyse', en: '5  Root Cause Analysis', fr: '5  Analyse des causes' },
  sec6: { de: '6  Risikolandschaft', en: '6  Risk Landscape', fr: '6  Paysage des risques' },
  sec7: { de: '7  Maßnahmenplan und Roadmap', en: '7  Action Plan and Roadmap', fr: "7  Plan d'action et feuille de route" },
  sec8: { de: '8  Fazit und Empfehlung', en: '8  Conclusion and Recommendation', fr: '8  Conclusion et recommandation' },
  sec9: { de: '9  Nachweise und Verifikation je Anforderung', en: '9  Requirement-level Evidence and Verification', fr: '9  Preuves et vérification par exigence' },
  sec10: { de: '10  AI Insights & Advisory', en: '10  AI Insights & Advisory', fr: '10  AI Insights & Advisory' },
  overallOpinion: { de: 'Gesamturteil', en: 'Overall Opinion', fr: 'Opinion générale' },
  secWP: { de: 'Anhang A  Arbeitspapiere & Nachvollziehbarkeit', en: 'Appendix A  Working Papers & Traceability', fr: 'Annexe A  Documents de travail & traçabilité' },


  scopeVerdict: { de: 'Anwendbarkeit', en: 'Applicability', fr: 'Applicabilité' },
  scopeSubject: { de: 'Geltungsbereich im Detail', en: 'Scope in detail', fr: 'Périmètre en détail' },
  scopeClaims: { de: 'Was dieser Bericht aussagt', en: 'What this report claims', fr: 'Ce que ce rapport affirme' },
  scopeLimits: { de: 'Was dieser Bericht nicht aussagt', en: 'What this report does not claim', fr: "Ce que ce rapport n'affirme pas" },
  intakeRecord: { de: 'Erfasste Angaben', en: 'Recorded intake data', fr: "Données d'admission" },
  actionPlan: { de: 'Maßnahmen', en: 'Actions', fr: 'Actions' },
  deliverable: { de: 'Ergebnis', en: 'Deliverable', fr: 'Livrable' },
  acceptance: { de: 'Abnahmekriterium', en: 'Acceptance criterion', fr: 'Critère de réception' },
  verificationMethod: { de: 'Verifikation', en: 'Verification', fr: 'Vérification' },
  dependsOn: { de: 'Voraussetzung', en: 'Prerequisite', fr: 'Prérequis' },
  owner: { de: 'Verantwortlich', en: 'Owner', fr: 'Responsable' },
  verificationLevel: { de: 'Prüfstufe', en: 'Verification level', fr: 'Niveau de vérification' },
  verificationNeed: { de: 'Erforderlich zur Verifikation', en: 'Needed to verify', fr: 'Nécessaire pour vérifier' },
  colCat: { de: 'Bereich', en: 'Area', fr: 'Domaine' },
  colEvidence: { de: 'Nachweis', en: 'Evidence', fr: 'Preuve' },
  colAction: { de: 'Maßnahme', en: 'Action', fr: 'Action' },
  detFindings: { de: 'Deterministische Grundursachen', en: 'Deterministic Root Causes', fr: 'Causes profondes déterministes' },
  aiHypotheses: { de: 'KI-Hypothesen (zu validieren)', en: 'AI Hypotheses (to be validated)', fr: 'Hypothèses IA (à valider)' },


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
  distribution: { de: 'Readiness-Verteilung', en: 'Readiness Distribution', fr: 'Répartition de la préparation' },
  scopeIntro: {
    de: 'Dieser Abschnitt legt fest, was bewertet wurde, ob der Standard anwendbar ist, welche Aussagen der Bericht traegt und welche ausdruecklich nicht. Grundlage sind die erfassten Angaben.',
    en: 'This section defines what was assessed, whether the standard applies, what the report legitimately claims and what it explicitly does not. It is based on the recorded intake data.',
    fr: "Cette section definit ce qui a ete evalue, si la norme s'applique, ce que le rapport affirme et ce qu'il n'affirme pas. Elle repose sur les donnees saisies.",
  },
  principlesIntro: {
    de: 'Die Bewertung folgt einem revisionssicheren, dreistufigen Modell: Die Konformitätsentscheidung (erfüllt / teilweise / Lücke) wird ausschließlich regelbasiert aus den Intake-Antworten abgeleitet. Keine Feststellung wird von der KI erfunden. Risiken werden deterministisch aus den Lücken abgeleitet. Die KI wird ausschließlich für die erklärende Analyseebene eingesetzt.',
    en: 'The assessment follows an audit-safe, three-layer model: the requirement verdict (pass / partial / gap) is derived strictly from the intake answers by deterministic rules. No finding is invented by the AI. Risks are derived deterministically from the gaps. The AI is used solely for the explanatory analysis layer.',
    fr: "L'évaluation suit un modèle vérifiable à trois niveaux : la décision de conformité (conforme / partiel / lacune) est dérivée strictement des réponses par des règles déterministes. Aucune constatation n'est inventée par l'IA. Les risques sont dérivés des lacunes. L'IA sert uniquement à la couche d'analyse explicative.",
  },
  findingsIntro: {
    de: 'Pro Anforderung: Antwort, Nachweis, Verifikationsgrad, Regel-Logik und deterministisches Ergebnis. Diese Aufstellung ist der Prueffpad fuer Auditoren.',
    en: 'Per requirement: answer, evidence, verification level, rule logic and deterministic result. This is the audit trail for a verifier.',
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
    de: 'Eine Zeile pro Anforderung: Verdikt, Verifikationsgrad des Nachweises und die zugehoerige Massnahme. Details zu Nachweisen stehen in Teil B.',
    en: 'One line per requirement: verdict, evidence verification level and the owning action. Evidence detail sits in Part B.',
    fr: "Une ligne par exigence : verdict, niveau de verification de la preuve et action associee. Le detail des preuves figure en partie B.",
  },
  riskIntro: {
    de: 'Die folgenden Risiken wurden deterministisch aus den festgestellten Lücken abgeleitet (Eintrittswahrscheinlichkeit x Auswirkung).',
    en: 'The following risks were derived deterministically from the identified gaps (likelihood x impact).',
    fr: 'Les risques suivants ont été dérivés des lacunes identifiées (probabilité x impact).',
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
    de: 'Dieser Bericht ist eine Readiness-Bewertung, keine Zertifizierung und keine Klassenentscheidung. Er ersetzt nicht die Bewertung durch eine anerkannte Prüfstelle. Grundlage sind die im Intake gemachten Angaben; Nachweise gelten als Selbstauskunft, sofern nicht ausdrücklich als verifiziert gekennzeichnet.',
    en: 'This report is a readiness assessment, not a certification and not a class decision. It does not replace assessment by a recognised authority. It is based on the information provided during intake; evidence is treated as self-declared unless explicitly marked as verified.',
    fr: "Ce rapport est une évaluation de préparation, ni une certification ni une décision de classification. Il ne remplace pas l'évaluation par un organisme reconnu. Il repose sur les informations fournies ; les preuves sont considérées comme déclaratives sauf mention explicite de vérification.",
  },

  rootCauseSummary: { de: 'Executive Root Causes', en: 'Executive Root Causes', fr: 'Executive Root Causes' },
  affectedControls: { de: 'Affected Controls', en: 'Affected Controls', fr: 'Affected Controls' },
  businessImpactCol: { de: 'Business Impact', en: 'Business Impact', fr: 'Business Impact' },
  belowConformity: { de: 'Below Conformity', en: 'Below Conformity', fr: 'Below Conformity' },
  secMethod: { de: 'Anhang B  Scoring-Methodik', en: 'Appendix B  Scoring Methodology', fr: 'Annexe B  Méthodologie de notation' },
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

// ── Remediation timeline (Gantt) ────────────────────────────────
// Sequences the recommended workstreams across a 12-month horizon,
// phased by priority bucket. Drawn deterministically from computed.roadmap.
function drawGanttChart(pdf: any, computed: ComputedAssessment, lang: Lang): void {
  const PHASE_SPAN: Record<string, [number, number]> = { '0-3': [0, 3], '3-6': [3, 6], '6-12': [6, 12] };
  const COLOR: Record<string, [number, number, number]> = {
    critical: C.fail, high: [205, 120, 40], medium: C.partial, low: C.accent,
  };
  type Lane = { title: string; start: number; end: number; priority: string };
  const lanes: Lane[] = [];
  computed.roadmap.forEach((bucket) => {
    const [start, end] = PHASE_SPAN[bucket.phase] ?? [0, 12];
    bucket.items.forEach((it) => lanes.push({ title: it.title, start, end, priority: it.priority }));
  });
  if (lanes.length === 0) return;

  const TOTAL = 12;
  const LABEL_W = 58;            // label column width (mm)
  const chartX = LAYOUT.LEFT + LABEL_W;
  const chartW = LAYOUT.RIGHT - chartX;
  const rowH = 6;
  const barH = 4;
  const ticks = [0, 3, 6, 9, 12];
  const mx = (m: number) => chartX + (m / TOTAL) * chartW;

  pdf.heading(t('remediationTimeline', lang), 2);
  pdf.checkSpace(14 + lanes.length * rowH);

  const d = pdf.doc;
  // Month axis labels
  d.setFontSize(6.5);
  d.setTextColor(...C.mid);
  ticks.forEach((m) => {
    const label = m === 0 ? '0' : `${m}`;
    d.text(label, mx(m), pdf.y, { align: 'center' });
  });
  // Axis unit label sits above the tick row so it can never collide with the
  // right-most month tick.
  d.setFontSize(5.5);
  d.text(t('months', lang).toUpperCase(), LAYOUT.RIGHT, pdf.y - 4, { align: 'right' });
  pdf.y += 2;


  const gridTop = pdf.y;
  const gridBottom = pdf.y + lanes.length * rowH;

  // Vertical gridlines
  d.setDrawColor(...C.rule);
  d.setLineWidth(0.15);
  ticks.forEach((m) => d.line(mx(m), gridTop, mx(m), gridBottom));

  // Lanes
  lanes.forEach((lane, i) => {
    const rowY = gridTop + i * rowH;
    const barY = rowY + (rowH - barH) / 2;
    const x0 = mx(lane.start);
    const w = mx(lane.end) - x0;
    const col = COLOR[lane.priority] ?? C.accent;

    // Label (truncated to fit)
    d.setFontSize(6.8);
    d.setTextColor(...C.dark);
    const label = d.splitTextToSize(lane.title, LABEL_W - 4)[0];
    d.text(label, LAYOUT.LEFT, barY + barH - 1);

    // Bar
    d.setFillColor(...col);
    d.roundedRect(x0, barY, w, barH, 0.6, 0.6, 'F');
  });

  pdf.y = gridBottom + 3;

  // Legend
  d.setFontSize(6);
  let lx = LAYOUT.LEFT;
  (['critical', 'high', 'medium', 'low'] as const).forEach((p) => {
    d.setFillColor(...(COLOR[p]));
    d.roundedRect(lx, pdf.y - 2, 2.5, 2.5, 0.4, 0.4, 'F');
    d.setTextColor(...C.mid);
    d.text(PRIORITY_LABEL[p][lang], lx + 3.5, pdf.y);
    lx += 3.5 + d.getTextWidth(PRIORITY_LABEL[p][lang]) + 6;
  });
  pdf.y += 5;
  d.setTextColor(...C.dark);
}

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

// ── Executive Root Cause clustering (deterministic) ─────────────
// Reduces the individual gaps/partials to a small number of management
// themes by grouping non-passing controls by their assessment category,
// then attaches a plain-language business consequence per theme.
type RootCauseCluster = {
  rootCause: string;
  controlIds: string[];
  fail: number;
  partial: number;
  businessImpact: string;
};

// Maps a category name/id to a concise, plain-language business consequence.
function businessImpactFor(key: string): string {
  const k = key.toLowerCase();
  if (/govern|leitung|polic|richtlin|politiq|aufsicht|oversight|account|management|organis/.test(k))
    return 'Management blind spots and unclear accountability for compliance outcomes.';
  if (/document|dokument|procedure|verfahren|record|nachweis/.test(k))
    return 'Operational inconsistency and a weak audit trail under examination.';
  if (/monitor|measur|metric|kpi|improv|verbesser|review|evidence|preuve/.test(k))
    return 'No reliable evidence of performance or continual improvement.';
  if (/train|awareness|schulung|competen|skill|personal/.test(k))
    return 'Elevated human-error and capability risk across the workforce.';
  if (/incident|response|continuit|notfall|recover|resilien|crisis/.test(k))
    return 'Slower detection of and recovery from disruptions and incidents.';
  if (/access|identit|zugang|berecht|authentic|privile/.test(k))
    return 'Increased likelihood of unauthorised access to critical systems.';
  if (/supplier|vendor|third|lieferant|procure|beschaff|outsourc/.test(k))
    return 'Unmanaged third-party and supply-chain exposure.';
  if (/asset|inventory|configur|patch|vulnerab|technical|netz|network/.test(k))
    return 'Technical debt and exploitable weaknesses in the environment.';
  return 'Increased likelihood of non-conformities and findings in this domain.';
}

function buildRootCauseClusters(
  profile: StandardProfile,
  merged: { id: string; status: string }[],
  lang: Lang,
): RootCauseCluster[] {
  const metaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const catName = new Map((profile.categories ?? []).map((c) => [c.id, tr(c.name, lang)]));
  const groups = new Map<string, RootCauseCluster>();

  merged.forEach((r) => {
    if (r.status === 'pass') return;
    const meta = metaById.get(r.id);
    const catId = meta?.categoryId ?? 'general';
    const label = catName.get(catId) ?? (catId === 'general' ? 'General' : catId);
    const cur = groups.get(catId) ?? {
      rootCause: `Insufficient ${label}`,
      controlIds: [],
      fail: 0,
      partial: 0,
      businessImpact: businessImpactFor(`${label} ${catId}`),
    };
    cur.controlIds.push(r.id);
    if (r.status === 'fail') cur.fail++;
    else cur.partial++;
    groups.set(catId, cur);
  });

  return [...groups.values()].sort(
    (a, b) => (b.controlIds.length - a.controlIds.length) || (b.fail - a.fail),
  );
}


/** Truncate to a fixed column width with an ellipsis so mono tables stay aligned. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetaAssessmentPdf(data: MetaReportData): Promise<void> {
  const { profile, result, computed, answers, entityName, insights, reportMeta, includeWorkingPapers, workingPapers, auditorNotes, executiveBrief } = data;
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

  // ── TOC (skipped in Executive Brief mode) ───────────────────
  if (!executiveBrief) {
    pdf.tableOfContents(t('toc', lang), [
      t('partA', lang),
      t('sec1', lang), t('sec2', lang), t('sec3', lang), t('sec4', lang),
      t('sec5', lang), t('sec6', lang), t('sec7', lang), t('sec8', lang),
      t('partB', lang),
      t('sec9', lang),
      ...(insights ? [t('sec10', lang)] : []),
      ...(includeWorkingPapers ? [t('secWP', lang)] : []),
      t('secMethod', lang),
    ]);


  }

  const merged = result.requirements.map((r) => {
    const meta = profile.requirements.find((x) => x.id === r.id);
    return { ...r, article: meta?.article ?? r.article ?? '', name: meta ? tr(meta.name, lang) : r.name };
  });
  // Single source of truth: counts come from the deterministic computed model.
  const pass = computed.score.counts.pass;
  const partial = computed.score.counts.partial;
  const fail = computed.score.counts.fail;
  const pct = computed.score.weighted;

  // ── Executive Brief — concise ~2-page management summary ─────
  if (executiveBrief) {
    pdf.newPage();
    pdf.heading(t('sec1', lang), 1);
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

    // Executive Root Causes — the heart of the brief.
    const briefClusters = buildRootCauseClusters(profile, merged, lang);
    if (briefClusters.length) {
      const open = fail + partial;
      pdf.heading(t('rootCauseSummary', lang), 2);
      pdf.introText(
        `The ${open} open finding${open === 1 ? '' : 's'} concentrate in ${briefClusters.length} root-cause theme${briefClusters.length === 1 ? '' : 's'}. Resolving these themes addresses the majority of individual gaps.`,
      );
      briefClusters.slice(0, 5).forEach((c, i) => {
        pdf.checkSpace(20);
        pdf.heading(`RC${i + 1}  ${c.rootCause}`, 3);
        pdf.fieldInline(t('affectedControls', lang), c.controlIds.join(', '));
        pdf.fieldInline(t('belowConformity', lang), `${c.controlIds.length}  (${c.fail} gap${c.fail === 1 ? '' : 's'}, ${c.partial} partial)`);
        pdf.bodyText(c.businessImpact);
      });
    }

    // Top priority actions (first roadmap items).
    const topActions: string[] = [];
    computed.roadmap.forEach((bucket) => bucket.items.forEach((it) => topActions.push(`${PRIORITY_LABEL[it.priority][lang]} — ${it.title}`)));
    if (topActions.length) {
      pdf.heading('Top Priorities', 2);
      topActions.slice(0, 6).forEach((a) => pdf.bulletItem(a));
    }

    pdf.bodyParagraph(t('disclaimer', lang));
    pdf.save(`${profile.id}-executive-brief-${entityName.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.pdf`);
    return;
  }



  // ════════════════════════════════════════════════════════════
  // PART A — EXECUTIVE REPORT (management view, no evidence detail)
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.heading(t('partA', lang), 1);
  pdf.addBookmark(t('partA', lang), 1);
  pdf.introText(t('partAIntro', lang));

  // ── 1 Executive Summary ─────────────────────────────────────
  pdf.heading(t('sec1', lang), 1);
  pdf.addBookmark(t('sec1', lang), 1);
  if (result.summary) pdf.bodyParagraph(result.summary);

  pdf.kpiRow([
    [`${pct}%`, t('readiness', lang)],
    [String(pass), t('passed', lang)],
    [String(partial), t('partial', lang)],
    [String(fail), t('gaps', lang)],
  ]);
  pdf.metaLine('Readiness is a preparedness indicator derived from the recorded answers. It is not a conformity statement, certification or class decision.');

  pdf.sectionLabel(t('distribution', lang));
  pdf.complianceBar(pass, partial, fail, {
    pass: t('passed', lang), partial: t('partial', lang), fail: t('gaps', lang),
    title: t('verdictOverview', lang),
  });

  // Canonical deterministic inputs — rendered once, each in its own chapter.
  const scope = computed.scope;
  const att = computed.attentionIndex;
  const ar = computed.auditReadiness;
  const clusters = buildRootCauseClusters(profile, merged, lang);
  // Requirement id -> root-cause theme id (RC1, RC2 …), used to make the
  // finding -> cause -> action chain visible in chapters 5 and 7.
  const rcIdByControl = new Map<string, string>();
  clusters.forEach((c, i) => c.controlIds.forEach((id) => rcIdByControl.set(id, `RC${i + 1}`)));

  // ── Overall opinion — the single management statement of this report ──
  const openTotal = fail + partial;
  pdf.heading(t('overallOpinion', lang), 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.bodyParagraph(
    `On the basis of the recorded answers and the evidence referenced in them, ${entityName} reaches a readiness level of ${pct}% against ${profile.name} within the scope set out in chapter 2. ${pass} of ${merged.length} requirements are met, ${partial} are partially met and ${fail} show a gap. Management attention is rated ${attentionLabel(att.level, lang)}; audit readiness stands at ${ar.overallPct}% (${readinessRatingLabel(ar.overall, lang)}).`
    + (openTotal
      ? ` The ${openTotal} open position${openTotal === 1 ? '' : 's'} concentrate${openTotal === 1 ? 's' : ''} in ${clusters.length} root cause${clusters.length === 1 ? '' : 's'}; addressing those causes closes the majority of the individual findings.`
      : ' No open positions remain within this scope.'),
  );
  pdf.metaLine('How to read this report: chapter 2 fixes the scope, chapter 3 the method, chapter 4 states the findings, chapter 5 their causes, chapter 6 the resulting risk, chapter 7 the actions and chapter 8 the conclusion. Part B holds the requirement-level evidence for each statement made here.');


  // ── 2 Scope, Applicability and Claims ───────────────────────
  pdf.newPage();
  pdf.heading(t('sec2', lang), 1);
  pdf.addBookmark(t('sec2', lang), 1);
  pdf.introText(t('scopeIntro', lang));

  pdf.heading(t('scopeVerdict', lang), 2);
  pdf.fieldInline(t('scopeVerdict', lang), scope.verdictLabel);
  pdf.bodyText(scope.rationale);

  if (scope.statements.length) {
    pdf.heading(t('scopeSubject', lang), 2);
    scope.statements.forEach((s) => {
      pdf.fieldInline(s.label, s.value);
      if (s.note) { pdf.y += 1; pdf.metaLine(s.note); pdf.y += 1.5; }
    });
  }

  pdf.heading(t('scopeClaims', lang), 2);
  scope.claims.forEach((c) => pdf.bulletItem(c));

  pdf.heading(t('scopeLimits', lang), 2);
  scope.limitations.forEach((c) => pdf.bulletItem(c));

  pdf.heading(t('intakeRecord', lang), 2);
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
  pdf.bulletItem('Each requirement verdict (pass / partial / gap) was determined by deterministic rules over those answers.');
  pdf.bulletItem('Readiness percentages, risks, actions and the roadmap were computed from those verdicts.');
  pdf.bulletItem('Evidence was classified by type and verification level; unverified statements are marked as self-declared.');
  pdf.bulletItem('AI generated explanatory insights and hypotheses only; it never created, modified or overrode a verdict, risk or evidence record.');

  // ── 4 Findings ──────────────────────────────────────────────
  // The findings chapter carries the full position: the requirement matrix,
  // the positions requiring attention and the two deterministic indices that
  // characterise them (management attention, audit readiness).
  pdf.newPage();
  pdf.heading(t('sec4', lang), 1);
  pdf.addBookmark(t('sec4', lang), 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText(t('matrixIntro', lang));

  const catNameById = new Map((profile.categories ?? []).map((c) => [c.id, tr(c.name, lang)]));
  const reqMetaById = new Map(profile.requirements.map((r) => [r.id, r]));
  const evByControl = new Map(computed.evidence.items.map((e) => [e.controlId, e]));
  const actionByControl = new Map(computed.recommendations.map((rec) => [rec.relatedControl, rec]));
  const VERIF_SHORT: Record<string, string> = { declared: 'Declared', documented: 'Documented', verified: 'Verified' };

  pdf.heading('4.1  Readiness matrix', 2);
  pdf.dataTableHeader(
    `${t('colId', lang).padEnd(9)}${t('colRef', lang).padEnd(12)}${t('colTopic', lang).padEnd(34)}${t('colCat', lang).padEnd(13)}${t('colVerdict', lang).padEnd(9)}${t('colEvidence', lang).padEnd(11)}${t('colAction', lang)}`
  );
  merged.forEach((r) => {
    const meta = reqMetaById.get(r.id);
    const cat = catNameById.get(meta?.categoryId ?? '') ?? '—';
    const evi = evByControl.get(r.id);
    const act = actionByControl.get(r.id);
    pdf.dataTableRow(
      `${r.id.slice(0, 8).padEnd(9)}${(r.article || '—').slice(0, 10).padEnd(12)}${clip(r.name || '', 32).padEnd(34)}${clip(cat, 11).padEnd(13)}${VERDICT_LABEL[r.status][lang].padEnd(9)}${(evi ? VERIF_SHORT[evi.verification] : 'None').padEnd(11)}${act ? act.id : '—'}`
    );
  });
  pdf.y += 2;
  pdf.metaLine('Evidence column shows the verification level of the supporting evidence, not its quantity. Action column references the action in chapter 7.');

  // ── Requirement positions that need attention (gap / partial) ──
  const open = merged.filter((r) => r.status !== 'pass');
  if (open.length) {
    pdf.heading('4.2  Positions requiring attention', 2);
    pdf.introText('Each non-passing requirement is stated as observation, assessment and consequence: what was found, how it was rated, which cause it belongs to and which action closes it. Full evidence detail is in Part B.');
    open.forEach((r) => {
      pdf.checkSpace(16);
      pdf.statusBadge(r.status);
      pdf.y += 5;
      pdf.metaLine(`${r.id}${r.article ? ` · ${r.article}` : ''} — ${r.name}`);
      if (r.gap) pdf.bodyText(`${t('gap', lang)}: ${r.gap}`);
      const rc = rcIdByControl.get(r.id);
      const act = actionByControl.get(r.id);
      const trail = [
        rc ? `Cause: ${rc} (chapter 5)` : null,
        act ? `${t('colAction', lang)}: ${act.id} · ${PRIORITY_LABEL[act.priority][lang]} · ${act.dueWindow ?? act.duration}` : null,
      ].filter(Boolean).join('  ·  ');
      if (trail) pdf.metaLine(trail);
    });
  }

  // ── Deterministic indices characterising the findings ────────
  pdf.heading(`4.3  ${t('attentionIndex', lang)}`, 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.fieldInline(t('attentionIndex', lang), `${attentionLabel(att.level, lang)}  (Critical ${att.counts.critical} · High ${att.counts.high} · Medium ${att.counts.medium} · Low ${att.counts.low})`);
  if (att.drivers.length) {
    pdf.sectionLabel(t('attentionDrivers', lang));
    att.drivers.forEach((d) => pdf.bulletItem(d));
  }

  pdf.heading(`4.4  ${t('auditReadiness', lang)}`, 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.fieldInline(`${t('readiness', lang)} (overall)`, `${readinessRatingLabel(ar.overall, lang)} · ${ar.overallPct}%`);
  ar.dimensions.forEach((d) => {
    pdf.fieldInline(d.label, `${readinessRatingLabel(d.rating, lang)} · ${d.pct}%`);
    pdf.y += 1;
    pdf.metaLine(d.basis);
    pdf.y += 1.5;
  });

  // ── 5 Root Cause Analysis ───────────────────────────────────
  // Deterministic causes first, AI hypotheses clearly separated afterwards.
  pdf.newPage();
  pdf.heading(t('sec5', lang), 1);
  pdf.addBookmark(t('sec5', lang), 1);
  pdf.introText('This chapter explains why the findings in chapter 4 occur. The causes are derived from the findings themselves; any AI-inferred hypothesis is marked as such and carries no assurance weight.');

  if (clusters.length) {
    pdf.heading(`5.1  ${t('detFindings', lang)}`, 2);
    pdf.metaLine(`${ORIGIN.assessment} — derived from the findings, not AI-generated`);
    pdf.introText(
      `The ${openTotal} open finding${openTotal === 1 ? '' : 's'} concentrate in ${clusters.length} root-cause theme${clusters.length === 1 ? '' : 's'}. Resolving these themes addresses the majority of individual gaps.`,
    );
    // Cause concentration at a glance: bar length = affected requirements,
    // dark share = outright gaps, light share = partially met.
    pdf.rootCauseBars(
      clusters.slice(0, 6).map((c, i) => ({
        label: c.rootCause,
        ids: c.controlIds,
        fail: c.fail,
        partial: c.partial,
      })),
      { title: 'Cause concentration', affected: t('affectedControls', lang) },
    );
    pdf.metaLine('Bar length shows how many requirements a cause affects; the darker share are gaps, the lighter share partially met requirements.');
    clusters.slice(0, 6).forEach((c, i) => {
      pdf.checkSpace(20);
      pdf.heading(`RC${i + 1}  ${c.rootCause}`, 3);
      pdf.fieldInline(t('affectedControls', lang), c.controlIds.join(', '));
      pdf.fieldInline(t('belowConformity', lang), `${c.controlIds.length}  (${c.fail} gap${c.fail === 1 ? '' : 's'}, ${c.partial} partial)`);
      const rcActions = [...new Set(c.controlIds.map((id) => actionByControl.get(id)?.id).filter(Boolean))];
      if (rcActions.length) pdf.fieldInline(t('actionPlan', lang), `${rcActions.join(', ')}  (chapter 7)`);
      pdf.sectionLabel(t('businessImpactCol', lang));
      pdf.bodyText(c.businessImpact);
    });

  } else {
    pdf.bodyParagraph('No open findings were recorded, so no root cause analysis is required.');
  }

  if (insights?.rootCauses?.length) {
    pdf.heading(`5.2  ${t('aiHypotheses', lang)}`, 2);
    pdf.metaLine(`${ORIGIN.insight} · Confidence: ${confLabel(insights.confidence?.rootCauses)}`);
    pdf.introText('These are AI-inferred cause hypotheses. The deterministic themes above remain the authoritative reading of the findings; the hypotheses require validation before being treated as fact.');
    insights.rootCauses.forEach((rc) => {
      pdf.bulletItem(`${rc.symptom} -> ${rc.cause} [Confidence: ${confLabel(rc.confidence)}]`);
      if (rc.validationActivities?.length) pdf.metaLine(`Recommended validation: ${rc.validationActivities.join('; ')}`);
    });
  }

  // ── 6 Risk Landscape ────────────────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec6', lang), 1);
  pdf.addBookmark(t('sec6', lang), 1);
  pdf.metaLine(ORIGIN.risk);
  pdf.introText(`${t('riskIntro', lang)} Each risk traces back to a non-passing requirement in chapter 4 and to the cause theme it belongs to in chapter 5.`);

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
      pdf.checkSpace(16);
      pdf.statusBadge(r.rating === 'low' ? 'pass' : r.rating === 'medium' ? 'partial' : 'fail');
      pdf.y += 5;
      pdf.metaLine(`${r.id} · ${r.name}  (${t('impact', lang)} ${r.impact} x ${t('likelihood', lang)} ${r.likelihood} = ${r.score})`);
      pdf.bodyText(`Business consequence: ${businessImpactFor(`${r.category} ${r.name}`)}`);
    });
  }

  // ── 7 Action Plan and Roadmap ───────────────────────────────
  pdf.newPage();
  pdf.heading(t('sec7', lang), 1);
  pdf.addBookmark(t('sec7', lang), 1);
  pdf.introText(`${t('recsIntro', lang)} Every action names the requirement it closes and the cause theme it belongs to, so the chain finding -> cause -> action can be followed end to end.`);

  if (computed.recommendations.length === 0) {
    pdf.bodyParagraph(t('noRecs', lang));
  } else {
    pdf.metaLine('Each action states the deliverable, the acceptance criterion and how completion is verified, so it can be assigned and closed out.');

    // Effort x impact placement — shows where quick wins sit before the
    // action detail is read line by line.
    const effortIdx = (e: string): 1 | 2 | 3 => (e === 'low' ? 1 : e === 'high' ? 3 : 2);
    const impactIdx = (p: string): 1 | 2 | 3 => (p === 'critical' || p === 'high' ? 3 : p === 'medium' ? 2 : 1);
    pdf.effortImpactMatrix(
      computed.recommendations.map((rec) => ({
        id: rec.id.replace(/[^0-9]/g, '') || rec.id.slice(-2),
        effort: effortIdx(rec.effort),
        impact: impactIdx(rec.priority),
      })),
      {
        title: 'Action placement — effort versus effect',
        effort: 'Implementation effort',
        impact: 'Effect on readiness',
        low: 'low',
        high: 'high',
      },
    );
    pdf.metaLine('Numbers refer to the action ids listed below. Actions in the upper-left field deliver the largest readiness effect for the lowest effort.');

    computed.recommendations.forEach((rec) => {
      pdf.checkSpace(30);
      pdf.heading(`${rec.id}  ${rec.title}`, 3);
      const rc = rcIdByControl.get(rec.relatedControl);
      pdf.metaLine(`${PRIORITY_LABEL[rec.priority][lang]} · ${rec.dueWindow ?? rec.duration} · ${rec.relatedControl}${rc ? ` · ${rc}` : ''}`);
      if (rec.deliverable) pdf.fieldInline(t('deliverable', lang), rec.deliverable);
      if (rec.acceptanceCriteria) pdf.fieldInline(t('acceptance', lang), rec.acceptanceCriteria);
      if (rec.verificationMethod) pdf.fieldInline(t('verificationMethod', lang), rec.verificationMethod);
      pdf.fieldInline(t('owner', lang), rec.owner);
      if (rec.dependsOn?.length) pdf.fieldInline(t('dependsOn', lang), rec.dependsOn.join(', '));
      if (rec.businessImpact) pdf.bodyText(rec.businessImpact);
    });

    pdf.heading(t('roadmap', lang), 2);
    pdf.distributionBar(
      computed.roadmap
        .filter((b) => b.items.length > 0)
        .map((b) => ({ label: `${b.phase} ${t('months', lang)} (${b.items.length})`.replace(/\(\d+\)$/, ''), value: b.items.length })),
      'Action load per phase',
    );
    computed.roadmap.forEach((bucket) => {
      if (bucket.items.length === 0) return;
      pdf.sectionLabel(`${t('phase', lang)} ${bucket.phase} ${t('months', lang)}`);
      bucket.items.forEach((it) => pdf.bulletItem(`${it.id} · ${PRIORITY_LABEL[it.priority][lang]} — ${it.title}`));
    });

    drawGanttChart(pdf, computed, lang);
  }



  // ── 8 Conclusion and Recommendation (closes Part A) ──────────
  pdf.newPage();
  pdf.heading(t('sec8', lang), 1);
  pdf.addBookmark(t('sec8', lang), 1);
  pdf.verdictBox(result.summary || `${entityName}: ${pct}% readiness — ${pass} ${t('passed', lang)}, ${partial} ${t('partial', lang)}, ${fail} ${t('gaps', lang)}.`);
  pdf.bodyParagraph(
    openTotal
      ? `Within the scope described in chapter 2 (${scope.verdictLabel}), readiness is assessed at ${pct}%. Reaching the next maturity level requires the ${computed.recommendations.length} action${computed.recommendations.length === 1 ? '' : 's'} in chapter 7 to be assigned to a named owner, completed within the stated window and evidenced in a form that a verifier can review — in particular the ${fail} requirement${fail === 1 ? '' : 's'} currently without any implementation.`
      : `Within the scope described in chapter 2 (${scope.verdictLabel}), all assessed requirements are met. Maintaining this position requires the evidence base to be kept current and re-verified at defined intervals.`,
  );
  pdf.bodyParagraph(t('disclaimer', lang));
  pdf.sectionLabel(t('scopeLimits', lang));
  scope.limitations.forEach((c) => pdf.bulletItem(c));

  // ════════════════════════════════════════════════════════════
  // PART B — EVIDENCE PACK (verifier view)
  // ════════════════════════════════════════════════════════════
  pdf.newPage();
  pdf.heading(t('partB', lang), 1);
  pdf.addBookmark(t('partB', lang), 1);
  pdf.introText(t('partBIntro', lang));

  // ── 9 Requirement-level Evidence and Verification ───────────
  pdf.heading(t('sec9', lang), 1);
  pdf.addBookmark(t('sec9', lang), 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText(t('findingsIntro', lang));


  // Single source of truth for the per-requirement structure: reuse the
  // working-paper records so every PDF type renders the same
  // Answer → Evidence → Verification → Rule logic → Result layout.
  const wpSource = workingPapers ?? buildWorkingPapers(profile, answers, result, computed, insights ?? null, reportMeta, lang);
  const wpById = new Map(wpSource.records.map((rec) => [rec.requirementId, rec]));

  merged.forEach((r, i) => {
    pdf.checkSpace(40);
    const wpRec = wpById.get(r.id);
    // The heading already carries requirement id, article and title, so the
    // former "Control Objective" block (which repeated exactly that) is gone.
    pdf.heading(`9.${i + 1}  ${r.id} — ${r.name}${r.article ? `  (${r.article})` : ''}`, 3);
    pdf.statusBadge(r.status);
    pdf.y += 6;

    const question = wpRec?.assessmentQuestion?.trim();
    // Only print the assessment question when it adds information beyond
    // the requirement title (avoids the near-duplicate paragraph).
    if (question && question.toLowerCase().replace(/[^a-z0-9]/g, '') !== r.name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      pdf.sectionLabel('Assessment question');
      pdf.bodyText(question);
    }

    pdf.sectionLabel('Answer');
    if (wpRec && wpRec.inputs.length) {
      wpRec.inputs.forEach((inp, k) => {
        pdf.fieldInline(inp.question, inp.answer);
        if (k < wpRec.inputs.length - 1) pdf.y += 2;
      });
    } else {
      pdf.bodyText('No rule-linked intake inputs recorded.');
    }

    pdf.sectionLabel(t('colEvidence', lang));
    pdf.bodyText(wpRec?.evidenceSubmitted || r.evidence || 'None recorded');
    const evi = evByControl.get(r.id);
    if (evi) {
      pdf.fieldInline(t('verificationLevel', lang), VERIF_SHORT[evi.verification]);
      if (evi.verificationNeed) { pdf.y += 1; pdf.metaLine(`${t('verificationNeed', lang)}: ${evi.verificationNeed}`); pdf.y += 1.5; }
    } else {
      pdf.fieldInline(t('verificationLevel', lang), 'None — no evidence recorded');
    }

    pdf.sectionLabel('Rule logic and result');
    if (wpRec && wpRec.ruleLogic.length) {
      wpRec.ruleLogic.forEach((line) => pdf.bulletItem(line));
    } else if (r.rationale) {
      pdf.bodyText(r.rationale);
    }
    if (r.gap) pdf.bodyText(`${t('gap', lang)}: ${r.gap}`);
    pdf.fieldInline('Deterministic result', wpRec?.resultLabel || VERDICT_LABEL[r.status][lang]);
    const act = actionByControl.get(r.id);
    if (act) pdf.fieldInline(t('colAction', lang), `${act.id} — ${act.title}`);
    const note = auditorNotes?.[r.id]?.trim();
    if (note) { pdf.sectionLabel('Auditor evidence note'); pdf.bodyText(note); }
    pdf.separator();
  });

  // ── Evidence & verification overview (deterministic) ────────
  const ev = computed.evidence;
  const evTotal = merged.length || 1;
  pdf.checkSpace(60);
  pdf.heading(t('evidenceStrength', lang), 2);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText('Informational overview of how far the evidence base has been substantiated. It does not affect the readiness score.');
  pdf.sectionLabel(t('verificationLevel', lang));
  ([
    [VERIF_SHORT.verified, ev.byVerification.verified],
    [VERIF_SHORT.documented, ev.byVerification.documented],
    [VERIF_SHORT.declared, ev.byVerification.declared],
    ['No evidence', ev.missing.length],
  ] as [string, number][]).forEach(([label, count]) => {
    pdf.fieldInline(label, `${count}  (${Math.round((count / evTotal) * 100)}%)`);
  });
  pdf.sectionLabel('Evidence strength');
  ([
    ['Very high', ev.byStrength.very_high],
    ['High', ev.byStrength.high],
    ['Medium', ev.byStrength.medium],
    ['Low', ev.byStrength.low],
  ] as [string, number][]).forEach(([label, count]) => {
    pdf.fieldInline(label, `${count}  (${Math.round((count / evTotal) * 100)}%)`);
  });
  if (ev.missing.length) {
    pdf.sectionLabel('Requirements without recorded evidence');
    pdf.bodyText(ev.missing.join(', '));
  }

  // ── 10 AI Analysis (explanatory, not assurance-relevant) ─────
  if (insights) {
    pdf.newPage();
    pdf.heading(t('sec10', lang), 1);
    pdf.addBookmark(t('sec10', lang), 1);

    pdf.metaLine(ORIGIN.insight);
    pdf.introText(t('aiNote', lang));
    pdf.bodyParagraph(t('labelLegend', lang));
    pdf.metaLine('The AI cause hypotheses are presented alongside the deterministic causes in chapter 5 and are not repeated here.');

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

  // Conclusion lives at the end of Part A — it is a management statement,
  // not part of the evidence pack, so it is not repeated here.



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

  // ── Appendix B  Scoring Methodology (transparency / defensibility) ──
  pdf.newPage();
  pdf.heading(t('secMethod', lang), 1);
  pdf.addBookmark(t('secMethod', lang), 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText('This appendix documents exactly how every score and readiness percentage in this report is calculated, so each figure is fully reproducible from the recorded answers.');

  pdf.heading('Control scoring', 2);
  pdf.bulletItem('Each control is scored deterministically: Pass = 100, Partial = 50, Gap = 0.');
  pdf.bulletItem('A control is Pass only when all required evidence tokens are present, Partial when some are present, Gap when none are.');

  pdf.heading('Readiness score', 2);
  pdf.bulletItem('Readiness % = weighted average of control scores, where each control carries its defined weight (default 1).');
  pdf.bulletItem('Formula: sum(controlScore x weight) / sum(weight), rounded to the nearest integer.');
  pdf.bulletItem('Bands: Strong >= 80%, Substantial >= 60%, Developing >= 35%, Limited < 35%.');

  pdf.heading('Audit readiness dimensions', 2);
  pdf.fieldInline('Documentation', 'Controls backed by documented evidence (policy/procedure/document/audit report) / total controls.');
  pdf.fieldInline('Operational', 'The weighted compliance score — effectiveness of implemented controls.');
  pdf.fieldInline('Governance', 'Average score of governance-related categories; overall score when no such category exists.');
  pdf.fieldInline('Evidence', 'Coverage weighted by evidence strength (Low 25, Medium 50, High 75, Very high 100) / total controls.');
  pdf.metaLine('Overall audit readiness = mean of the four dimension percentages.');

  pdf.heading('Risk scoring', 2);
  pdf.bulletItem('One risk is derived per non-passing control. Risk score = Likelihood x Impact (1–5 scale).');
  pdf.bulletItem('Default likelihood: 4 for a Gap, 3 for a Partial; impact defaults to 3 and can be tuned per control.');
  pdf.bulletItem('Ratings: Critical >= 20, High >= 13, Medium >= 6, Low < 6.');


  pdf.save(`${profile.id}-assessment-${entityName.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.pdf`);
}
