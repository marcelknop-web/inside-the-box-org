// Working Papers PDF — dedicated audit working-papers export.
//
// Renders the Working Papers & Assessment Traceability section and the
// Evidence Register appendix. The same renderer is reused by the main
// report (Internal Audit Mode) so the working papers can never diverge
// between the management report and the standalone export.
import { createPdfDoc, type PdfDoc } from '@/utils/pdfCore';
import type {
  Lang, StandardProfile, AssessmentResult, ComputedAssessment, InsightResult, IntakeAnswers,
} from '@/data/metaAssessment/types';
import { tr } from '@/data/metaAssessment/types';
import { buildWorkingPapers, type WorkingPapers } from '@/data/metaAssessment/workingPapers';
import { ORIGIN, REPORT_TITLE, type ReportMeta } from '@/data/metaAssessment/reportMeta';

const VERDICT: Record<string, string> = { pass: 'Pass', partial: 'Partial', fail: 'Gap' };

/**
 * Render the Working Papers section + Evidence Register into an existing
 * PDF document. Used by both the standalone export and the main report.
 */
export function renderWorkingPapers(pdf: PdfDoc, wp: WorkingPapers, opts?: { sectionPrefix?: string }) {
  const sp = opts?.sectionPrefix ?? '';

  pdf.heading(`${sp}Working Papers & Assessment Traceability`, 1);
  pdf.addBookmark(`${sp}Working Papers & Assessment Traceability`, 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText(
    'For every requirement this working paper records exactly why it was assessed as Pass, Partial or Gap: the original user inputs, the deterministic rule applied, the generated risk and the AI sections that referenced the requirement. No assessment result is a black box.',
  );

  wp.records.forEach((r, i) => {
    pdf.checkSpace(60);
    pdf.heading(`${sp ? sp : ''}${i + 1}.  ${r.requirementId} — ${r.name}`, 3);
    pdf.metaLine(`Article: ${r.article || '—'}  ·  Rule ID: ${r.ruleId}`);
    pdf.statusBadge(r.deterministicResult);
    pdf.y += 4;

    pdf.sectionLabel('Assessment Question');
    pdf.bodyText(r.assessmentQuestion);

    pdf.sectionLabel('Assessment Questions & Responses');
    if (r.inputs.length) {
      r.inputs.forEach((inp, k) => {
        pdf.fieldInline('Question', inp.question);
        pdf.fieldInline('Answer', inp.answer);
        if (k < r.inputs.length - 1) pdf.y += 2;
      });
    } else {
      pdf.bodyText('No rule-linked intake inputs recorded.');
    }
    pdf.fieldInline('Comment', r.supportingComments || '—');

    pdf.sectionLabel('Evidence Management');
    pdf.fieldInline('Evidence Type', r.evidenceTypeLabel);
    pdf.fieldInline('Evidence Name', r.evidenceName);
    pdf.fieldInline('Evidence Source', r.evidenceSource);
    pdf.fieldInline('Evidence Strength', r.evidenceStrengthLabel);
    pdf.sectionLabel('Evidence Description');
    pdf.bodyText(r.evidenceSubmitted || 'None');

    pdf.sectionLabel('Assessment Rule (deterministic)');
    r.ruleLogic.forEach((line) => pdf.bulletItem(line));
    pdf.fieldInline('Deterministic Result', r.resultLabel);

    pdf.sectionLabel('Risk Traceability');
    if (r.generatedRiskId) {
      pdf.fieldInline('Generated Risk', r.generatedRiskId);
      pdf.fieldInline('Risk Formula', `${r.riskFormula} = ${r.riskScore}  (${r.riskRatingLabel})`);
    } else {
      pdf.bodyText('No risk generated (requirement passed).');
    }

    pdf.sectionLabel('AI Traceability');
    pdf.fieldInline('Referenced by AI', r.referencedByAI ? 'Yes' : 'No');
    if (r.aiSections.length) pdf.fieldInline('AI Sections', r.aiSections.join(', '));

    pdf.sectionLabel('Audit Trail Metadata');
    pdf.fieldInline('Assessment ID', r.assessmentId);
    pdf.fieldInline('Assessment Version', r.assessmentVersion);
    pdf.fieldInline('Requirement ID', r.requirementId);
    pdf.fieldInline('Rule ID', r.ruleId);
    pdf.fieldInline('Assessor', r.assessor);
    pdf.fieldInline('Source System', r.sourceSystem);
    pdf.fieldInline('Timestamp', new Date(r.timestamp).toLocaleString('en-GB'));
    pdf.separator();
  });

  // ── Evidence Register appendix ──────────────────────────────
  pdf.newPage();
  pdf.heading(`${sp}Evidence Register (Appendix)`, 1);
  pdf.addBookmark(`${sp}Evidence Register`, 1);
  pdf.metaLine(ORIGIN.assessment);
  pdf.introText('Every evidence item mapped to its requirement, type, strength and assessment contribution.');
  if (wp.evidenceRegister.length === 0) {
    pdf.bodyParagraph('No evidence items were captured for this assessment.');
  } else {
    pdf.dataTableHeader(`${'ID'.padEnd(8)}${'Req.'.padEnd(10)}${'Type'.padEnd(14)}${'Strength'.padEnd(12)}${'Result'}`);
    wp.evidenceRegister.forEach((e) => {
      pdf.dataTableRow(`${e.evidenceId.padEnd(8)}${e.requirementId.slice(0, 8).padEnd(10)}${e.typeLabel.slice(0, 12).padEnd(14)}${e.strengthLabel.slice(0, 10).padEnd(12)}${VERDICT[e.resultContribution]}`);
    });
    pdf.y += 4;
    wp.evidenceRegister.forEach((e) => {
      pdf.checkSpace(20);
      pdf.heading(`${e.evidenceId} — ${e.requirementId}`, 3);
      pdf.fieldInline('Requirement', e.requirementName);
      pdf.fieldInline('Type', e.typeLabel);
      pdf.fieldInline('Strength', e.strengthLabel);
      pdf.fieldInline('Used For', e.usedFor);
      pdf.fieldInline('Result Contribution', e.resultContributionLabel);
      if (e.description) { pdf.sectionLabel('Description'); pdf.bodyText(e.description); }
    });
  }
}

export interface WorkingPapersPdfData {
  profile: StandardProfile;
  lang: Lang;
  result: AssessmentResult;
  computed: ComputedAssessment;
  answers: IntakeAnswers;
  entityName: string;
  insights?: InsightResult | null;
  reportMeta?: ReportMeta;
}

export async function generateWorkingPapersPdf(data: WorkingPapersPdfData): Promise<void> {
  const { profile, result, computed, answers, entityName, insights, reportMeta } = data;
  const lang: Lang = 'en';
  const wp = buildWorkingPapers(profile, answers, result, computed, insights, reportMeta, lang);

  const pdf = await createPdfDoc({
    lang,
    reportPrefix: `${(profile.name.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5) || 'ASMT')}WP`,
    confidentialLabel: `CONFIDENTIAL — Working Papers — ${profile.name}`,
    pageLabel: 'Page',
    draftWatermark: 'DRAFT',
  });

  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  pdf.coverPage({
    title: 'Working Papers & Assessment Traceability',
    subtitle: `${tr(profile.fullName, lang) || profile.name} — ${tr(profile.regulation, lang)}`,
    entityName,
    fields: [
      ['Entity', entityName],
      ['Standard', profile.name],
      ['Report Type', `${REPORT_TITLE} — Working Papers`],
      ['Date', dateStr],
      ['Prepared by', 'Inside the Box'],
      ['Status', 'CONFIDENTIAL'],
    ],
    confidentialNote: 'CONFIDENTIAL',
  });

  pdf.tableOfContents('Table of Contents', [
    'Working Papers & Assessment Traceability',
    'Evidence Register (Appendix)',
  ]);

  pdf.newPage();
  renderWorkingPapers(pdf, wp);

  if (reportMeta) {
    pdf.separator();
    pdf.sectionLabel('Report Metadata');
    pdf.fieldInline('Assessment ID', reportMeta.assessmentId);
    pdf.fieldInline('Assessment Engine', reportMeta.assessmentEngineVersion);
    pdf.fieldInline('Generated', new Date(reportMeta.generatedAt).toLocaleString('en-GB'));
  }

  pdf.save(`${profile.id}-working-papers-${entityName.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.pdf`);
}
