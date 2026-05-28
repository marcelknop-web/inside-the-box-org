import { supabase } from '@/integrations/supabase/client';

export interface ReqForAssessment {
  id: string;
  article: string;
  name: string;
  criteria: string[];
}

export interface DocForAssessment {
  name: string;
  type: string;
  text: string;
}

/**
 * Context derived from the user's intake answers. Passed to the AI so it can
 * judge document relevance and completeness against the actual system scope
 * (ship/system types, target security level, zones, protocols, declared
 * measures). The AI must still only use document content as evidence — context
 * never substitutes for documented evidence (Data Integrity Policy).
 */
export interface AssessmentContext {
  facilityName?: string;
  systemTypes?: string[];
  securityLevel?: string;
  description?: string;
  zones?: string[];
  protocols?: string[];
  measures?: string[];
  knownIssues?: string;
}

export interface ReqAssessment {
  id: string;
  status: 'pass' | 'partial' | 'fail';
  evidence: string; // concrete quote / reference found in the documents, or empty
  rationale: string;
  sourceDoc: string; // document name the evidence came from, or ''
  confidence: 'high' | 'medium' | 'low';
}

export interface DocAssessmentResult {
  assessments: ReqAssessment[];
  documentsAnalyzed: string[];
}

// Keep each AI call comfortably under the edge function / model limits so an
// arbitrary number of uploaded documents can be processed across batches.
const MAX_DOCS_PER_BATCH = 8;
const MAX_TEXT_PER_BATCH = 180000;

const STATUS_RANK: Record<ReqAssessment['status'], number> = { fail: 0, partial: 1, pass: 2 };
const CONF_RANK: Record<ReqAssessment['confidence'], number> = { low: 0, medium: 1, high: 2 };

function splitIntoBatches(docs: DocForAssessment[]): DocForAssessment[][] {
  const batches: DocForAssessment[][] = [];
  let current: DocForAssessment[] = [];
  let chars = 0;
  for (const doc of docs) {
    const len = (doc.text || '').length;
    if (current.length > 0 && (current.length >= MAX_DOCS_PER_BATCH || chars + len > MAX_TEXT_PER_BATCH)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(doc);
    chars += len;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

async function assessBatch(
  standard: 'E26' | 'E27',
  reqs: ReqForAssessment[],
  docs: DocForAssessment[],
  language: 'de' | 'en' | 'fr',
  context?: AssessmentContext,
): Promise<DocAssessmentResult> {
  const { data, error } = await supabase.functions.invoke('iec-document-assessment', {
    body: { standard, reqs, docs, language, context },
  });
  if (error) throw error;
  if (!data || !Array.isArray(data.assessments)) {
    throw new Error('Invalid assessment response');
  }
  return data as DocAssessmentResult;
}

/**
 * Sends extracted document text + the requirement catalogue to the AI edge
 * function, which searches each document for concrete evidence per requirement
 * and returns a content-based compliance verdict. The AI is instructed to never
 * invent evidence (Data Integrity Policy) — missing evidence => fail.
 *
 * The optional intake `context` (system scope, target SL, zones, protocols,
 * declared measures) is forwarded so the AI can judge relevance and
 * completeness more accurately — yielding the best possible assessment without
 * weakening the evidence rules.
 *
 * To support an arbitrary number of uploaded documents, documents are split into
 * batches that each fit within the AI payload budget. Per requirement, the
 * strongest verdict across all batches wins (pass > partial > fail, then higher
 * confidence), so evidence found in any document is never lost.
 */
export async function assessDocuments(
  standard: 'E26' | 'E27',
  reqs: ReqForAssessment[],
  docs: DocForAssessment[],
  language: 'de' | 'en' | 'fr',
  context?: AssessmentContext,
): Promise<DocAssessmentResult> {
  const usable = docs.filter((d) => (d.text || '').trim().length > 0);
  const batches = splitIntoBatches(usable);
  if (batches.length <= 1) {
    return assessBatch(standard, reqs, usable, language, context);
  }


  const best = new Map<string, ReqAssessment>();
  const analyzed = new Set<string>();

  // Sequential to avoid hitting AI rate limits with many documents.
  for (const batch of batches) {
    const result = await assessBatch(standard, reqs, batch, language, context);
    result.documentsAnalyzed.forEach((n) => analyzed.add(n));
    for (const a of result.assessments) {
      const prev = best.get(a.id);
      if (!prev) {
        best.set(a.id, a);
        continue;
      }
      const better =
        STATUS_RANK[a.status] > STATUS_RANK[prev.status] ||
        (STATUS_RANK[a.status] === STATUS_RANK[prev.status] &&
          CONF_RANK[a.confidence] > CONF_RANK[prev.confidence]);
      if (better) best.set(a.id, a);
    }
  }

  const assessments = reqs.map(
    (r) =>
      best.get(r.id) ?? {
        id: r.id,
        status: 'fail' as const,
        evidence: '',
        rationale: 'No documented evidence found in the uploaded documents.',
        sourceDoc: '',
        confidence: 'low' as const,
      },
  );

  return { assessments, documentsAnalyzed: Array.from(analyzed) };
}
