// Executive Presentation content builder.
//
// Transforms the deterministic assessment results + AI Insight Engine output
// into slide-optimized content for the Gamma Generate API. This never exports
// raw report text — every card is rewritten as concise, executive-ready slide
// content with a clear headline and tight bullet points.
//
// Three deck types are supported:
//   - executive : 10-slide management summary deck (default)
//   - board     : <=10 slides, risk / resilience / regulatory / strategy focus
//   - consultant: <=15 slides, adds root causes, hypotheses, validation,
//                 systemic weaknesses and consultant observations
import type {
  Lang, StandardProfile, IntakeAnswers,
  AssessmentResult, ComputedAssessment, InsightResult,
  Confidence,
} from './types';
import { tr } from './types';
import { readinessRatingLabel, attentionLabel } from './engine';
import type { ReportMeta } from './reportMeta';

export type PresentationType = 'executive' | 'board' | 'consultant';

export interface PresentationInput {
  profile: StandardProfile;
  lang: Lang;
  result: AssessmentResult;
  computed: ComputedAssessment;
  answers: IntakeAnswers;
  entityName: string;
  insights: InsightResult | null;
  reportMeta?: ReportMeta;
}

export interface PresentationContent {
  /** Card-separated markdown using \n---\n breaks (cardSplit=inputTextBreaks). */
  inputText: string;
  /** Suggested title for the deck. */
  title: string;
  /** Tone / styling guidance forwarded to Gamma. */
  additionalInstructions: string;
  /** Number of cards produced (informational; inputTextBreaks drives the split). */
  numCards: number;
}

const CARD_BREAK = '\n\n---\n\n';

const isHighOrMedium = (c?: Confidence) => c === 'high' || c === 'medium';
const confLabel = (c?: Confidence) => (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'n/a');
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function bullets(items: (string | undefined | null)[], max = 6): string {
  const clean = items.filter((x): x is string => !!x && x.trim().length > 0).slice(0, max);
  return clean.map((x) => `- ${x.trim()}`).join('\n');
}

/* ── individual card builders ──────────────────────────────────── */

function cardOverview(input: PresentationInput): string {
  const { profile, lang, computed, entityName, reportMeta } = input;
  const pct = computed.score.weighted;
  const date = reportMeta ? new Date(reportMeta.generatedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  return [
    `# Assessment Overview`,
    bullets([
      `**Standard:** ${profile.name} — ${tr(profile.regulation, lang)}`,
      `**Organization:** ${entityName}`,
      `**Assessment ID:** ${reportMeta?.assessmentId ?? `${profile.id.toUpperCase()}-LIVE`}`,
      `**Date:** ${date}`,
      `**Readiness Score:** ${pct}% (${readinessLabelText(computed)})`,
    ]),
  ].join('\n\n');
}

function readinessLabelText(computed: ComputedAssessment): string {
  const map: Record<string, string> = {
    'initial': 'Initial', 'developing': 'Developing', 'managed': 'Managed', 'audit-ready': 'Audit-ready',
  };
  return map[computed.score.readiness] ?? computed.score.readiness;
}

function cardExecutiveSummary(input: PresentationInput): string {
  const { result, insights } = input;
  const ei = insights?.executiveInsights;
  const lines: string[] = ['# Executive Summary'];
  const narrative = insights?.executiveNarrative || result.summary;
  if (narrative) lines.push(narrative);
  if (ei?.topStrengths?.length) {
    lines.push('**Major strengths**');
    lines.push(bullets(ei.topStrengths, 4));
  }
  if (ei?.topWeaknesses?.length) {
    lines.push('**Major weaknesses**');
    lines.push(bullets(ei.topWeaknesses, 4));
  }
  return lines.join('\n\n');
}

function cardReadiness(input: PresentationInput): string {
  const { computed } = input;
  const pct = computed.score.weighted;
  const att = computed.attentionIndex;
  const ar = computed.auditReadiness;
  return [
    '# Readiness Overview',
    bullets([
      `**Readiness Score:** ${pct}%  ${gauge(pct)}`,
      `**Management Attention Index:** ${cap(attentionLabel(att.level, 'en'))} (Critical ${att.counts.critical} · High ${att.counts.high} · Medium ${att.counts.medium} · Low ${att.counts.low})`,
      `**Audit Readiness:** ${readinessRatingLabel(ar.overall, 'en')} · ${ar.overallPct}%`,
    ]),
    ar.dimensions.length
      ? '**By dimension**\n' + bullets(ar.dimensions.map((d) => `${d.label}: ${readinessRatingLabel(d.rating, 'en')} (${d.pct}%)`), 4)
      : '',
  ].filter(Boolean).join('\n\n');
}

function gauge(pct: number): string {
  if (pct >= 80) return '🟢';
  if (pct >= 60) return '🟡';
  if (pct >= 40) return '🟠';
  return '🔴';
}

function cardKeyFindings(input: PresentationInput): string {
  const { result, profile, lang } = input;
  const gaps = result.requirements.filter((r) => r.status !== 'pass');
  const top = gaps
    .sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1))
    .slice(0, 6);
  const items = top.map((r) => {
    const meta = profile.requirements.find((x) => x.id === r.id);
    const name = meta ? tr(meta.name, lang) : r.name;
    const tag = r.status === 'fail' ? 'Gap' : 'Partial';
    return `**[${tag}] ${name}** — ${r.gap || 'Control not fully evidenced.'}`;
  });
  return ['# Key Findings', bullets(items, 6)].join('\n\n');
}

function cardRiskLandscape(input: PresentationInput): string {
  const { computed } = input;
  const top = [...computed.risks]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const items = top.map((r) => `**${cap(r.rating)} · ${r.name}** — likelihood ${r.likelihood}, impact ${r.impact} (score ${r.score})`);
  return ['# Risk Landscape', 'Top risks by severity and business impact:', bullets(items, 5)].join('\n\n');
}

function cardRootCauses(input: PresentationInput, max = 5): string {
  const { insights } = input;
  const rc = (insights?.rootCauses ?? []).filter((r) => isHighOrMedium(r.confidence) || !r.confidence).slice(0, max);
  if (!rc.length) return '';
  const items = rc.map((r) => `**${r.symptom}** → ${r.cause} _(confidence: ${confLabel(r.confidence)})_`);
  return ['# Root Causes', 'Underlying drivers behind the observed gaps (High/Medium confidence):', bullets(items, max)].join('\n\n');
}

function cardManagementThemes(input: PresentationInput): string {
  const { insights } = input;
  const themes = (insights?.managementThemes ?? []).slice(0, 5);
  if (!themes.length) return '';
  const items = themes.map((t) => `**${t.title}** — ${t.riskExposure} Opportunity: ${t.improvementOpportunity}`);
  return ['# Management Themes', bullets(items, 5)].join('\n\n');
}

function cardTransformationPrograms(input: PresentationInput): string {
  const { insights } = input;
  const progs = (insights?.transformationPrograms ?? []).slice(0, 4);
  if (!progs.length) return '';
  const blocks = progs.map((p) =>
    `**${p.title}**\n` +
    `- Objective: ${p.objectives}\n` +
    `- Business value: ${cap(p.businessValue)}\n` +
    `- Complexity: ${cap(p.complexity)}\n` +
    `- Priority: ${p.businessValue === 'high' && p.complexity !== 'high' ? 'High' : p.businessValue === 'high' ? 'Medium-High' : 'Medium'}`,
  );
  return ['# Transformation Programs', blocks.join('\n\n')].join('\n\n');
}

function cardRoadmap(input: PresentationInput): string {
  const { insights, computed } = input;
  const phases: Record<string, string[]> = { '0-3': [], '3-6': [], '6-12': [] };
  // Prefer AI management roadmap; fall back to the deterministic roadmap.
  if (insights?.managementRoadmap?.length) {
    insights.managementRoadmap.forEach((m) => {
      const key = m.phase === '12+' ? '6-12' : m.phase;
      if (phases[key]) phases[key].push(...m.activities);
    });
  } else {
    computed.roadmap.forEach((b) => {
      phases[b.phase]?.push(...b.items.map((i) => i.title));
    });
  }
  const section = (label: string, key: string) =>
    `**${label}**\n${phases[key].length ? bullets(phases[key], 4) : '- No actions scheduled in this phase'}`;
  return [
    '# Management Roadmap',
    section('0–3 Months', '0-3'),
    section('3–6 Months', '3-6'),
    section('6–12 Months', '6-12'),
  ].join('\n\n');
}

function cardNextSteps(input: PresentationInput): string {
  const { insights, computed } = input;
  const ei = insights?.executiveInsights;
  const immediate = ei?.managementFocus?.length
    ? ei.managementFocus
    : computed.recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').slice(0, 5).map((r) => r.title);
  const decisions = [
    'Approve and resource the 0–3 month remediation actions.',
    'Assign accountable owners for each transformation program.',
    'Confirm risk appetite for the residual high/critical risks.',
  ];
  return [
    '# Recommended Next Steps',
    '**Immediate actions**',
    bullets(immediate, 5),
    '**Management decisions required**',
    bullets(decisions, 3),
  ].join('\n\n');
}

/* ── consultant-only cards ─────────────────────────────────────── */

function cardHypotheses(input: PresentationInput): string {
  const { insights } = input;
  const h = (insights?.hypotheses ?? []).slice(0, 4);
  if (!h.length) return '';
  const blocks = h.map((x) =>
    `**${x.statement}** _(confidence: ${confLabel(x.confidence)})_\n` +
    (x.validationActivities?.length ? bullets(x.validationActivities.map((v) => `Validate: ${v}`), 3) : ''),
  );
  return ['# Hypotheses & Validation', 'Explicit assumptions requiring validation before being treated as fact:', blocks.join('\n\n')].join('\n\n');
}

function cardSystemicWeaknesses(input: PresentationInput): string {
  const { insights } = input;
  const sw = (insights?.systemicWeaknesses ?? []).slice(0, 4);
  if (!sw.length) return '';
  const items = sw.map((s) => `**${s.area}** — ${s.pattern} _(confidence: ${confLabel(s.confidence)})_`);
  return ['# Potential Systemic Weaknesses', bullets(items, 4)].join('\n\n');
}

function cardConsultantObservations(input: PresentationInput): string {
  const { insights } = input;
  const obs = (insights?.consultantObservations ?? []).slice(0, 4);
  if (!obs.length) return '';
  const blocks = obs.map((o) =>
    `**${o.observation}**\n` +
    `- Implication: ${o.implication}\n` +
    `- Recommendation: ${o.recommendation}`,
  );
  return ['# Consultant Observations', blocks.join('\n\n')].join('\n\n');
}

/* ── deck assembly ─────────────────────────────────────────────── */

const BASE_TONE =
  'Produce a polished, management-ready deck that reads like a deliverable from an internal audit, cybersecurity consulting and virtual-CISO practice. ' +
  'Use a clean, professional corporate style with clear headlines, concise bullets and subtle data emphasis. ' +
  'Preserve all facts, figures and findings exactly as provided — do not invent data, findings or risks. ' +
  'Keep each slide focused and presentable without further editing.';

export function buildPresentationContent(type: PresentationType, input: PresentationInput): PresentationContent {
  const { entityName, profile } = input;
  let cards: string[];
  let additionalInstructions = BASE_TONE;

  if (type === 'board') {
    cards = [
      cardOverview(input),
      cardExecutiveSummary(input),
      cardReadiness(input),
      cardRiskLandscape(input),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardRoadmap(input),
      cardNextSteps(input),
    ];
    additionalInstructions = BASE_TONE +
      ' BOARD AUDIENCE: minimise technical jargon and acronyms. Frame everything in terms of business risk, organisational resilience, regulatory exposure and the strategic decisions the board must make. Hard limit of 10 slides.';
  } else if (type === 'consultant') {
    cards = [
      cardOverview(input),
      cardExecutiveSummary(input),
      cardReadiness(input),
      cardKeyFindings(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 6),
      cardHypotheses(input),
      cardSystemicWeaknesses(input),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardConsultantObservations(input),
      cardRoadmap(input),
      cardNextSteps(input),
    ];
    additionalInstructions = BASE_TONE +
      ' CONSULTANT AUDIENCE: this is a working advisory deck. Clearly distinguish deterministic facts from analytical interpretation (root causes, hypotheses, systemic weaknesses and observations are advisory). Hard limit of 15 slides.';
  } else {
    // executive (default)
    cards = [
      cardOverview(input),
      cardExecutiveSummary(input),
      cardReadiness(input),
      cardKeyFindings(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 5),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardRoadmap(input),
      cardNextSteps(input),
    ];
  }

  const filtered = cards.filter((c) => c && c.trim().length > 0);
  const titleByType: Record<PresentationType, string> = {
    executive: `${profile.name} Executive Summary — ${entityName}`,
    board: `${profile.name} Board Briefing — ${entityName}`,
    consultant: `${profile.name} Advisory Deck — ${entityName}`,
  };

  return {
    inputText: filtered.join(CARD_BREAK),
    title: titleByType[type],
    additionalInstructions,
    numCards: filtered.length,
  };
}
