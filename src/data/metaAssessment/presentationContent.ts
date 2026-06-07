// Executive Presentation content builder (Gamma Visual Executive Mode).
//
// Transforms the deterministic assessment results + AI Insight Engine output
// into slide-optimized content for the Gamma Generate API. This never exports
// raw report text — every card is rewritten as concise, executive-ready slide
// content with a clear headline and tight bullet points, plus an explicit
// visual directive so Gamma renders charts/diagrams instead of prose.
//
// Default mode is VISUAL EXECUTIVE: visual-first, text-second decks that read
// like board / audit-committee / risk-committee briefings rather than reports.
//
// Deck types:
//   - visual-executive : <=10 slides, board/management, visual-first (DEFAULT)
//   - consultant       : <=15 slides, adds root causes, hypotheses, validation,
//                        systemic weaknesses and consultant observations
//   - audit            : <=20 slides, internal-audit/compliance/risk — findings,
//                        evidence strength, working-papers & traceability summary
//   - text             : legacy text-heavy executive deck (secondary option)
//
// Framework adaptation: visual guidance is automatically tailored per standard
// (DORA, NIS2, ISO 27001, ISO 22301, IEC 62443, TISAX, CIS, NIST CSF, PCI DSS
// and any future framework) so decks are never identical across standards.
import type {
  Lang, StandardProfile, IntakeAnswers,
  AssessmentResult, ComputedAssessment, InsightResult,
  Confidence, EvidenceStrength,
} from './types';
import { tr } from './types';
import { readinessRatingLabel, attentionLabel, cmmiLabel } from './engine';
import type { ReportMeta } from './reportMeta';

export type PresentationType = 'visual-executive' | 'consultant' | 'audit' | 'text';

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

/** A single slide: concise markdown plus the preferred visual structure. */
interface Card {
  /** slide headline (without the leading '# ') used for the visual map */
  headline: string;
  /** full slide markdown */
  md: string;
  /** the visual Gamma should render for this slide */
  visual: string;
}

const CARD_BREAK = '\n\n---\n\n';

const isHighOrMedium = (c?: Confidence) => c === 'high' || c === 'medium';
const confLabel = (c?: Confidence) => (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'n/a');
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function bullets(items: (string | undefined | null)[], max = 5): string {
  const clean = items.filter((x): x is string => !!x && x.trim().length > 0).slice(0, max);
  return clean.map((x) => `- ${x.trim()}`).join('\n');
}

function gauge(pct: number): string {
  if (pct >= 80) return '🟢';
  if (pct >= 60) return '🟡';
  if (pct >= 40) return '🟠';
  return '🔴';
}

function readinessLabelText(computed: ComputedAssessment): string {
  const map: Record<string, string> = {
    'initial': 'Initial', 'developing': 'Developing', 'managed': 'Managed', 'audit-ready': 'Audit-ready',
  };
  return map[computed.score.readiness] ?? computed.score.readiness;
}

function controlCounts(input: PresentationInput) {
  const reqs = input.result.requirements;
  const pass = reqs.filter((r) => r.status === 'pass').length;
  const partial = reqs.filter((r) => r.status === 'partial').length;
  const gap = reqs.filter((r) => r.status === 'fail').length;
  return { pass, partial, gap, total: reqs.length };
}

/* ── framework-specific visualization adaptation ───────────────── */

const FRAMEWORK_VISUAL_AREAS: Record<string, string[]> = {
  dora: ['ICT Risk Management', 'Digital Operational Resilience', 'ICT Third-Party Risk', 'TLPT / resilience testing', 'Exit strategies', 'Concentration risk'],
  nis2: ['Governance & accountability', 'Incident management', 'Supply-chain security', 'MFA & access control', 'Cyber hygiene'],
  iso27001: ['ISMS domains', 'Annex A control coverage', 'Risk treatment progress', 'Statement of Applicability'],
  iso22301: ['BCMS lifecycle', 'Business impact analysis', 'Recovery strategies', 'Exercising & testing'],
  iec62443: ['Security levels (SL)', 'Zones & conduits', 'Industrial risk areas', 'OT/IT segmentation'],
  tisax: ['Information security', 'Prototype protection', 'Data protection', 'Assessment levels (AL)'],
  cis: ['CIS Control groups (IG1–IG3)', 'Safeguard coverage', 'Implementation maturity'],
  nist: ['CSF functions (Identify/Protect/Detect/Respond/Recover/Govern)', 'Category coverage', 'Profile gaps'],
  pci: ['PCI DSS requirement groups', 'CDE scope', 'SAQ coverage'],
};

function frameworkVisualGuidance(profile: StandardProfile): string {
  const key = (profile.id || '').toLowerCase();
  const match = Object.keys(FRAMEWORK_VISUAL_AREAS).find((k) => key.includes(k));
  const areas = match ? FRAMEWORK_VISUAL_AREAS[match] : null;
  if (areas) {
    return ` FRAMEWORK ADAPTATION (${profile.name}): tailor the visuals to this standard — do not reuse a generic layout. ` +
      `Build framework-specific visuals around: ${areas.join('; ')}. Reflect this standard's structure in control-coverage, maturity and risk visuals.`;
  }
  return ` FRAMEWORK ADAPTATION (${profile.name}): tailor visuals to this standard's specific domains and control structure — do not reuse a generic layout across frameworks.`;
}

/* ── visual-executive card builders (concise, visual-first) ────── */

function cardOverview(input: PresentationInput): Card {
  const { profile, lang, computed, entityName, reportMeta } = input;
  const pct = computed.score.weighted;
  const date = reportMeta ? new Date(reportMeta.generatedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  return {
    headline: 'Assessment Overview',
    visual: 'Executive scorecard with the readiness score as the hero metric',
    md: ['# Assessment Overview', bullets([
      `**Framework:** ${profile.name}`,
      `**Organization:** ${entityName}`,
      `**Assessment date:** ${date}`,
      `**Readiness score:** ${pct}% — ${readinessLabelText(computed)} ${gauge(pct)}`,
    ])].join('\n\n'),
  };
}

function cardBoardMessage(input: PresentationInput): Card {
  const { computed, result, insights } = input;
  const topRisk = [...computed.risks].sort((a, b) => b.score - a.score)[0];
  const ei = insights?.executiveInsights;
  const urgent = ei?.managementFocus?.[0]
    || computed.recommendations.find((r) => r.priority === 'critical' || r.priority === 'high')?.title
    || computed.roadmap.find((b) => b.phase === '0-3')?.items[0]?.title;
  const att = computed.attentionIndex;
  return {
    headline: 'Board Message',
    visual: 'Executive dashboard: one posture indicator plus four KPI tiles',
    md: ['# Board Message', bullets([
      `**Current posture:** ${computed.score.weighted}% (${readinessLabelText(computed)})`,
      `**Biggest risk:** ${topRisk ? `${topRisk.name} (${cap(topRisk.rating)})` : 'No critical risk identified'}`,
      `**Most urgent action:** ${urgent || 'Sustain current controls'}`,
      `**Regulatory exposure:** ${cap(attentionLabel(att.level, 'en'))} attention`,
      `**Overall:** ${result.summary ? result.summary.split('. ')[0] + '.' : `${readinessLabelText(computed)} maturity`}`,
    ])].join('\n\n'),
  };
}

function cardReadinessDashboard(input: PresentationInput): Card {
  const { computed } = input;
  const pct = computed.score.weighted;
  const att = computed.attentionIndex;
  const ar = computed.auditReadiness;
  return {
    headline: 'Readiness Dashboard',
    visual: 'Three gauge charts (Readiness, Management Attention, Audit Readiness) side by side',
    md: ['# Readiness Dashboard', bullets([
      `**Readiness:** ${pct}% ${gauge(pct)}`,
      `**Management Attention Index:** ${cap(attentionLabel(att.level, 'en'))}`,
      `**Audit Readiness:** ${readinessRatingLabel(ar.overall, 'en')} (${ar.overallPct}%)`,
      `**Attention split:** ${att.counts.critical} critical · ${att.counts.high} high · ${att.counts.medium} medium`,
    ])].join('\n\n'),
  };
}

function cardControlOverview(input: PresentationInput): Card {
  const c = controlCounts(input);
  const pctOf = (n: number) => (c.total ? Math.round((n / c.total) * 100) : 0);
  return {
    headline: 'Control Overview',
    visual: 'Control-coverage chart (stacked/donut): Pass vs Partial vs Gap',
    md: ['# Control Overview', bullets([
      `**Pass:** ${c.pass} (${pctOf(c.pass)}%) 🟢`,
      `**Partial:** ${c.partial} (${pctOf(c.partial)}%) 🟡`,
      `**Gap:** ${c.gap} (${pctOf(c.gap)}%) 🔴`,
      `**Controls assessed:** ${c.total}`,
    ])].join('\n\n'),
  };
}

function cardRiskLandscape(input: PresentationInput): Card {
  const top = [...input.computed.risks].sort((a, b) => b.score - a.score).slice(0, 5);
  const items = top.map((r) => `**${cap(r.rating)} · ${r.name}** — L${r.likelihood} × I${r.impact} (${r.score})`);
  return {
    headline: 'Risk Landscape',
    visual: '5×5 risk matrix / heatmap plotting each top risk by likelihood and impact',
    md: ['# Risk Landscape', bullets(items, 5)].join('\n\n'),
  };
}

function cardRootCauses(input: PresentationInput, max = 5): Card | null {
  const rc = (input.insights?.rootCauses ?? []).filter((r) => isHighOrMedium(r.confidence) || !r.confidence).slice(0, max);
  if (!rc.length) return null;
  const items = rc.map((r) => `**${r.symptom}** → ${r.cause}`);
  return {
    headline: 'Root Causes',
    visual: 'Cause-and-effect (fishbone) diagram linking symptoms to root causes',
    md: ['# Root Causes', bullets(items, max)].join('\n\n'),
  };
}

function cardManagementThemes(input: PresentationInput): Card | null {
  const themes = (input.insights?.managementThemes ?? []).slice(0, 5);
  if (!themes.length) return null;
  const items = themes.map((t) => `**${t.title}** — ${t.riskExposure}`);
  return {
    headline: 'Management Themes',
    visual: 'Theme / relationship map clustering controls into strategic themes',
    md: ['# Management Themes', bullets(items, 5)].join('\n\n'),
  };
}

function cardTransformationPrograms(input: PresentationInput): Card | null {
  const progs = (input.insights?.transformationPrograms ?? []).slice(0, 5);
  if (!progs.length) return null;
  const items = progs.map((p) => `**${p.title}** — value ${cap(p.businessValue)}, complexity ${cap(p.complexity)}`);
  return {
    headline: 'Transformation Programs',
    visual: 'Portfolio matrix: Business Value (y) vs Complexity (x) with each program plotted',
    md: ['# Transformation Programs', bullets(items, 5)].join('\n\n'),
  };
}

function cardRoadmap(input: PresentationInput): Card {
  const { insights, computed } = input;
  const phases: Record<string, string[]> = { '0-3': [], '3-6': [], '6-12': [] };
  if (insights?.managementRoadmap?.length) {
    insights.managementRoadmap.forEach((m) => {
      const key = m.phase === '12+' ? '6-12' : m.phase;
      if (phases[key]) phases[key].push(...m.activities);
    });
  } else {
    computed.roadmap.forEach((b) => { phases[b.phase]?.push(...b.items.map((i) => i.title)); });
  }
  const section = (label: string, key: string) =>
    `**${label}**\n${phases[key].length ? bullets(phases[key], 4) : '- No actions in this phase'}`;
  return {
    headline: 'Roadmap',
    visual: 'Horizontal timeline / Gantt across 0–3, 3–6 and 6–12 month phases',
    md: ['# Roadmap', section('0–3 Months', '0-3'), section('3–6 Months', '3-6'), section('6–12 Months', '6-12')].join('\n\n'),
  };
}

function cardManagementDecisions(input: PresentationInput): Card {
  const { insights, computed } = input;
  const ei = insights?.executiveInsights;
  const immediate = ei?.managementFocus?.length
    ? ei.managementFocus
    : computed.recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').slice(0, 4).map((r) => r.title);
  return {
    headline: 'Management Decisions Required',
    visual: 'Decision dashboard: action × owner × funding × priority',
    md: ['# Management Decisions Required',
      '**Immediate decisions**', bullets(immediate, 4),
      '**Resourcing & ownership**', bullets([
        'Fund 0–3 month remediation actions',
        'Assign accountable owners per program',
        'Confirm risk appetite for residual risks',
      ], 3),
    ].join('\n\n'),
  };
}

/* ── consultant-only cards ─────────────────────────────────────── */

function cardKeyFindings(input: PresentationInput): Card {
  const { result, profile, lang } = input;
  const gaps = result.requirements.filter((r) => r.status !== 'pass');
  const top = gaps.sort((a, b) => (a.status === 'fail' ? -1 : 1) - (b.status === 'fail' ? -1 : 1)).slice(0, 5);
  const items = top.map((r) => {
    const meta = profile.requirements.find((x) => x.id === r.id);
    const name = meta ? tr(meta.name, lang) : r.name;
    const tag = r.status === 'fail' ? 'Gap' : 'Partial';
    return `**[${tag}] ${name}**`;
  });
  return {
    headline: 'Key Findings',
    visual: 'Findings scorecard grouped by Gap vs Partial',
    md: ['# Key Findings', bullets(items, 5)].join('\n\n'),
  };
}

function cardHypotheses(input: PresentationInput): Card | null {
  const h = (input.insights?.hypotheses ?? []).slice(0, 4);
  if (!h.length) return null;
  const items = h.map((x) => `**${x.statement}** _(${confLabel(x.confidence)})_`);
  return {
    headline: 'Hypotheses & Validation',
    visual: 'Hypothesis board: each hypothesis with its validation activities',
    md: ['# Hypotheses & Validation', bullets(items, 4)].join('\n\n'),
  };
}

function cardSystemicWeaknesses(input: PresentationInput): Card | null {
  const sw = (input.insights?.systemicWeaknesses ?? []).slice(0, 4);
  if (!sw.length) return null;
  const items = sw.map((s) => `**${s.area}** — ${s.pattern}`);
  return {
    headline: 'Potential Systemic Weaknesses',
    visual: 'Relationship map showing how weaknesses propagate across controls',
    md: ['# Potential Systemic Weaknesses', bullets(items, 4)].join('\n\n'),
  };
}

function cardConsultantObservations(input: PresentationInput): Card | null {
  const obs = (input.insights?.consultantObservations ?? []).slice(0, 4);
  if (!obs.length) return null;
  const items = obs.map((o) => `**${o.observation}** → ${o.recommendation}`);
  return {
    headline: 'Consultant Observations',
    visual: 'Advisory callout layout: observation → implication → recommendation',
    md: ['# Consultant Observations', bullets(items, 4)].join('\n\n'),
  };
}

/* ── internal-audit-only cards ─────────────────────────────────── */

const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  low: 'Low', medium: 'Medium', high: 'High', very_high: 'Very high',
};

function cardEvidenceStrength(input: PresentationInput): Card {
  const ev = input.computed.evidence;
  const bs = ev.byStrength;
  return {
    headline: 'Evidence Strength',
    visual: 'Evidence-strength bar chart (Very high → Low) plus a "no evidence" tile',
    md: ['# Evidence Strength', bullets([
      `**Very high:** ${bs.very_high ?? 0}`,
      `**High:** ${bs.high ?? 0}`,
      `**Medium:** ${bs.medium ?? 0}`,
      `**Low:** ${bs.low ?? 0}`,
      `**No evidence:** ${ev.missing.length}`,
    ], 5)].join('\n\n'),
  };
}

function cardAuditReadinessDimensions(input: PresentationInput): Card {
  const ar = input.computed.auditReadiness;
  const items = ar.dimensions.map((d) => `**${d.label}:** ${readinessRatingLabel(d.rating, 'en')} (${d.pct}%)`);
  return {
    headline: 'Audit Readiness',
    visual: 'Maturity / radar diagram across the four audit-readiness dimensions',
    md: ['# Audit Readiness',
      bullets([`**Overall:** ${readinessRatingLabel(ar.overall, 'en')} (${ar.overallPct}%)`, ...items], 5),
    ].join('\n\n'),
  };
}

function cardCmmiMatching(input: PresentationInput): Card | null {
  const cmmi = input.computed.cmmi;
  if (!cmmi?.enabled) return null;
  const items = cmmi.categories
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((c) => `**${c.name}:** L${c.level} ${c.label}${c.gap > 0 ? ` (−${c.gap} to target)` : ' ✓'}`);
  return {
    headline: 'CMMI Maturity Matching',
    visual: 'Maturity ladder / radar: per-category CMMI level (1 Initial → 5 Optimizing) against target',
    md: ['# CMMI Maturity Matching',
      bullets([
        `**Overall:** L${cmmi.overall} ${cmmi.overallLabel} · Target L${cmmi.target}${cmmi.gap > 0 ? ` (−${cmmi.gap})` : ' ✓'}`,
        ...items,
      ], 6),
    ].join('\n\n'),
  };
}



function cardTraceabilitySummary(input: PresentationInput): Card {
  const c = controlCounts(input);
  const ev = input.computed.evidence;
  const documented = ev.items.length;
  return {
    headline: 'Working Papers & Traceability',
    visual: 'Traceability funnel: controls → responses → evidence → findings',
    md: ['# Working Papers & Traceability', bullets([
      `**Controls assessed:** ${c.total}`,
      `**Evidence records captured:** ${documented}`,
      `**Controls without evidence:** ${ev.missing.length}`,
      `**Findings (Partial + Gap):** ${c.partial + c.gap}`,
      'Every finding traces to a response and evidence item',
    ], 5)].join('\n\n'),
  };
}

/* ── legacy text cards (secondary "text" mode) ─────────────────── */

function textCardExecutiveSummary(input: PresentationInput): Card {
  const { result, insights } = input;
  const ei = insights?.executiveInsights;
  const lines: string[] = ['# Executive Summary'];
  const narrative = insights?.executiveNarrative || result.summary;
  if (narrative) lines.push(narrative);
  if (ei?.topStrengths?.length) { lines.push('**Major strengths**'); lines.push(bullets(ei.topStrengths, 4)); }
  if (ei?.topWeaknesses?.length) { lines.push('**Major weaknesses**'); lines.push(bullets(ei.topWeaknesses, 4)); }
  return { headline: 'Executive Summary', visual: 'Summary layout with strengths/weaknesses columns', md: lines.join('\n\n') };
}

/* ── deck assembly ─────────────────────────────────────────────── */

const VISUAL_TONE =
  'VISUAL EXECUTIVE MODE. Produce a visually compelling executive presentation — NOT a report-style or text-heavy slide deck. ' +
  'Visual first, text second: an executive must grasp each slide in seconds and the key messages in under 5 minutes without reading a report. ' +
  'For every slide, render the data as a visual structure — executive scorecards, gauge charts, KPI dashboards, control-coverage charts, risk heatmaps / 5×5 matrices, cause-and-effect (fishbone) diagrams, theme / relationship maps, portfolio (value vs complexity) matrices, roadmap timelines, maturity / radar diagrams and decision dashboards — instead of paragraphs. ' +
  'Hard limits: max 5 bullets per slide, ~10 words per bullet, NO long paragraphs, NO dense bullet lists, NO large narrative blocks. ' +
  'Style it like a deliverable from an internal-audit function, a Big-Four consulting firm, a cybersecurity advisory practice or a virtual-CISO engagement — board, audit-committee and risk-committee ready. ' +
  'Preserve every fact, figure, percentage and finding exactly as provided — never invent data, findings or risks. The deck must be presentation-ready with no manual editing.';

const STUDIO_DESIGN =
  ' CARD DESIGN MODE: STUDIO. Use Gamma\'s "Studio" card design mode for an editorial, design-led look — bold, deliberate compositions with strong visual hierarchy, generous whitespace, large expressive headlines, full-bleed accent imagery and refined typography. Every card must look like a hand-crafted studio-designed slide rather than an auto-generated template.';

const TEXT_TONE =
  'Produce a polished, management-ready deck that reads like a deliverable from an internal audit, cybersecurity consulting and virtual-CISO practice. ' +
  'Use a clean, professional corporate style with clear headlines, concise bullets and subtle data emphasis. ' +
  'Preserve all facts, figures and findings exactly as provided — do not invent data, findings or risks. ' +
  'Keep each slide focused and presentable without further editing.';

function visualMap(cards: Card[]): string {
  return ' SLIDE VISUALS (render each as the named visual): ' +
    cards.map((c) => `"${c.headline}" → ${c.visual}`).join('; ') + '.';
}

export function buildPresentationContent(type: PresentationType, input: PresentationInput): PresentationContent {
  const { entityName, profile } = input;
  let cards: (Card | null)[];
  let tone: string;
  let limitNote: string;

  if (type === 'consultant') {
    cards = [
      cardOverview(input),
      cardBoardMessage(input),
      cardReadinessDashboard(input),
      cardKeyFindings(input),
      cardControlOverview(input),
      cardCmmiMatching(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 6),
      cardHypotheses(input),
      cardSystemicWeaknesses(input),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardConsultantObservations(input),
      cardRoadmap(input),
      cardManagementDecisions(input),
    ];
    tone = VISUAL_TONE;
    limitNote = ' CONSULTANT AUDIENCE: working advisory deck. Visually distinguish deterministic facts from analytical interpretation (root causes, hypotheses, systemic weaknesses and observations are advisory). Hard limit of 15 slides.';
  } else if (type === 'audit') {
    cards = [
      cardOverview(input),
      cardReadinessDashboard(input),
      cardControlOverview(input),
      cardKeyFindings(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 6),
      cardEvidenceStrength(input),
      cardAuditReadinessDimensions(input),
      cardTraceabilitySummary(input),
      cardSystemicWeaknesses(input),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardRoadmap(input),
      cardManagementDecisions(input),
    ];
    tone = VISUAL_TONE;
    limitNote = ' INTERNAL AUDIT AUDIENCE: audit-committee / compliance / risk deck. Emphasise findings, evidence strength, audit readiness and traceability with audit-focused visuals. Every finding must trace to a response and evidence. Hard limit of 20 slides.';
  } else if (type === 'text') {
    cards = [
      cardOverview(input),
      textCardExecutiveSummary(input),
      cardReadinessDashboard(input),
      cardKeyFindings(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 5),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardRoadmap(input),
      cardManagementDecisions(input),
    ];
    tone = TEXT_TONE;
    limitNote = ' TEXT MODE: a more detailed, narrative-friendly executive deck. Hard limit of 10 slides.';
  } else {
    // visual-executive (default)
    cards = [
      cardOverview(input),
      cardBoardMessage(input),
      cardReadinessDashboard(input),
      cardControlOverview(input),
      cardRiskLandscape(input),
      cardRootCauses(input, 5),
      cardManagementThemes(input),
      cardTransformationPrograms(input),
      cardRoadmap(input),
      cardManagementDecisions(input),
    ];
    tone = VISUAL_TONE;
    limitNote = ' EXECUTIVE / BOARD AUDIENCE: minimise jargon and acronyms; frame everything as business risk, resilience, regulatory exposure and strategic decisions. Hard limit of 10 slides.';
  }

  const present = cards.filter((c): c is Card => !!c && !!c.md && c.md.trim().length > 0);

  let additionalInstructions = tone + limitNote + frameworkVisualGuidance(profile);
  if (type !== 'text') additionalInstructions += STUDIO_DESIGN + visualMap(present);

  const titleByType: Record<PresentationType, string> = {
    'visual-executive': `${profile.name} Executive Briefing — ${entityName}`,
    consultant: `${profile.name} Advisory Deck — ${entityName}`,
    audit: `${profile.name} Internal Audit Deck — ${entityName}`,
    text: `${profile.name} Executive Summary — ${entityName}`,
  };

  return {
    inputText: present.map((c) => c.md).join(CARD_BREAK),
    title: titleByType[type],
    additionalInstructions,
    numCards: present.length,
  };
}
