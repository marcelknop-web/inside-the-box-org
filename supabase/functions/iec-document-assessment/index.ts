import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface ReqForAssessment {
  id: string;
  article: string;
  name: string;
  criteria: string[];
}
interface DocForAssessment {
  name: string;
  type: string;
  text: string;
}

const MAX_DOCS = 15;
const MAX_REQS = 60;
const MAX_TEXT = 60000;
const MAX_TOTAL_TEXT = 220000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return json({ error: 'AI gateway not configured' }, 500);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid body' }, 400);

    const standard = body.standard === 'E26' ? 'E26' : 'E27';
    const language = ['de', 'en', 'fr'].includes(body.language) ? body.language : 'en';

    const reqs: ReqForAssessment[] = Array.isArray(body.reqs)
      ? body.reqs.slice(0, MAX_REQS).map((r: ReqForAssessment) => ({
          id: String(r.id || '').slice(0, 40),
          article: String(r.article || '').slice(0, 120),
          name: String(r.name || '').slice(0, 200),
          criteria: Array.isArray(r.criteria) ? r.criteria.map((c: string) => String(c).slice(0, 400)).slice(0, 12) : [],
        }))
      : [];

    let totalText = 0;
    const docs: DocForAssessment[] = Array.isArray(body.docs)
      ? body.docs.slice(0, MAX_DOCS).map((d: DocForAssessment) => {
          let text = String(d.text || '').slice(0, MAX_TEXT);
          if (totalText + text.length > MAX_TOTAL_TEXT) {
            text = text.slice(0, Math.max(0, MAX_TOTAL_TEXT - totalText));
          }
          totalText += text.length;
          return { name: String(d.name || 'document').slice(0, 200), type: String(d.type || '').slice(0, 40), text };
        }).filter((d: DocForAssessment) => d.text.trim().length > 0)
      : [];

    if (reqs.length === 0) return json({ error: 'No requirements provided' }, 400);
    if (docs.length === 0) return json({ error: 'No document content provided' }, 400);

    const langName = language === 'de' ? 'German' : language === 'fr' ? 'French' : 'English';

    const docBlock = docs
      .map((d, i) => `=== DOCUMENT ${i + 1}: "${d.name}" (${d.type}) ===\n${d.text}`)
      .join('\n\n');

    const reqBlock = reqs
      .map((r) => `- id: ${r.id} | ${r.article} — ${r.name}\n  Acceptance criteria: ${r.criteria.join(' | ') || '(none listed)'}`)
      .join('\n');

    const systemPrompt = `You are a maritime cyber security auditor assessing compliance with IACS UR ${standard} (IEC 62443 based) for on-board Computer Based Systems (CBS).
You evaluate ONLY against the actual content of the supplied evidence documents.
STRICT DATA INTEGRITY RULES — these are non-negotiable:
1. NEVER invent, assume, or extrapolate evidence. If a document does not explicitly support a requirement, it is NOT met.
2. "evidence" must be a short verbatim quote or precise reference taken from the documents. If none exists, evidence MUST be an empty string.
3. Determine "status" purely from documented evidence:
   - "pass": ALL acceptance criteria are explicitly and concretely evidenced in the documents.
   - "partial": some criteria are evidenced but not all, or evidence is vague/incomplete.
   - "fail": no relevant documented evidence found.
4. "sourceDoc" must be the exact document name the evidence came from, or "" if none.
5. "confidence" reflects how directly the document text supports your verdict.
Write "rationale" in ${langName}. Keep evidence quotes in their original document language.
Return a verdict for EVERY requirement id provided.`;

    const userPrompt = `EVIDENCE DOCUMENTS:\n${docBlock}\n\n=== REQUIREMENTS TO ASSESS ===\n${reqBlock}`;

    const tool = {
      type: 'function',
      function: {
        name: 'submit_assessment',
        description: 'Submit the content-based compliance assessment for every requirement.',
        parameters: {
          type: 'object',
          properties: {
            assessments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string', enum: ['pass', 'partial', 'fail'] },
                  evidence: { type: 'string' },
                  rationale: { type: 'string' },
                  sourceDoc: { type: 'string' },
                  confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                },
                required: ['id', 'status', 'evidence', 'rationale', 'sourceDoc', 'confidence'],
                additionalProperties: false,
              },
            },
          },
          required: ['assessments'],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'submit_assessment' } },
        temperature: 0.1,
      }),
    });

    if (aiRes.status === 429) return json({ error: 'rate_limited', message: 'AI rate limit reached. Please retry shortly.' }, 429);
    if (aiRes.status === 402) return json({ error: 'credits_exhausted', message: 'AI credits exhausted. Please add credits.' }, 402);
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error('AI gateway error', aiRes.status, txt);
      return json({ error: 'ai_error', message: `AI gateway error (${aiRes.status})` }, 502);
    }

    const aiData = await aiRes.json();
    const call = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: { assessments?: unknown } = {};
    try {
      parsed = JSON.parse(call?.function?.arguments || '{}');
    } catch (_e) {
      return json({ error: 'parse_error', message: 'Could not parse AI assessment' }, 502);
    }

    const validIds = new Set(reqs.map((r) => r.id));
    const raw = Array.isArray(parsed.assessments) ? parsed.assessments : [];
    const byId = new Map<string, Record<string, unknown>>();
    for (const a of raw as Record<string, unknown>[]) {
      const id = String(a.id || '');
      if (validIds.has(id)) byId.set(id, a);
    }

    const assessments = reqs.map((r) => {
      const a = byId.get(r.id);
      const status = a && ['pass', 'partial', 'fail'].includes(String(a.status)) ? String(a.status) : 'fail';
      return {
        id: r.id,
        status,
        evidence: a ? String(a.evidence || '').slice(0, 1000) : '',
        rationale: a ? String(a.rationale || '').slice(0, 1500) : 'No documented evidence found in the uploaded documents.',
        sourceDoc: a ? String(a.sourceDoc || '').slice(0, 200) : '',
        confidence: a && ['high', 'medium', 'low'].includes(String(a.confidence)) ? String(a.confidence) : 'low',
      };
    });

    return json({ assessments, documentsAnalyzed: docs.map((d) => d.name) }, 200);
  } catch (err) {
    console.error('iec-document-assessment error', err);
    return json({ error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
