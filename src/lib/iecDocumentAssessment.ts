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

/**
 * Sends extracted document text + the requirement catalogue to the AI edge
 * function, which searches each document for concrete evidence per requirement
 * and returns a content-based compliance verdict. The AI is instructed to never
 * invent evidence (Data Integrity Policy) — missing evidence => fail.
 */
export async function assessDocuments(
  standard: 'E26' | 'E27',
  reqs: ReqForAssessment[],
  docs: DocForAssessment[],
  language: 'de' | 'en' | 'fr',
): Promise<DocAssessmentResult> {
  const { data, error } = await supabase.functions.invoke('iec-document-assessment', {
    body: { standard, reqs, docs, language },
  });
  if (error) throw error;
  if (!data || !Array.isArray(data.assessments)) {
    throw new Error('Invalid assessment response');
  }
  return data as DocAssessmentResult;
}
