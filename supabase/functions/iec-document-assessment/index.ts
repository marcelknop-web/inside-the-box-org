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
interface AssessmentContext {
  facilityName?: string;
  systemTypes?: string[];
  securityLevel?: string;
  description?: string;
  zones?: string[];
  protocols?: string[];
  measures?: string[];
  knownIssues?: string;
}

const MAX_DOCS = 15;
const MAX_REQS = 60;
const MAX_TEXT = 60000;
const MAX_TOTAL_TEXT = 220000;

const arr = (v: unknown, max: number, itemLen: number): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).slice(0, itemLen)).filter(Boolean).slice(0, max) : [];

function buildContext(raw: unknown): AssessmentContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const ctx: AssessmentContext = {
    facilityName: String(c.facilityName || '').slice(0, 200) || undefined,
    systemTypes: arr(c.systemTypes, 30, 120),
    securityLevel: String(c.securityLevel || '').slice(0, 60) || undefined,
    description: String(c.description || '').slice(0, 2000) || undefined,
    zones: arr(c.zones, 30, 120),
    protocols: arr(c.protocols, 40, 120),
    measures: arr(c.measures, 60, 200),
    knownIssues: String(c.knownIssues || '').slice(0, 2000) || undefined,
  };
  const hasAny =
    ctx.facilityName || ctx.securityLevel || ctx.description || ctx.knownIssues ||
    (ctx.systemTypes && ctx.systemTypes.length) || (ctx.zones && ctx.zones.length) ||
    (ctx.protocols && ctx.protocols.length) || (ctx.measures && ctx.measures.length);
  return hasAny ? ctx : null;
}

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

    const ctx = buildContext(body.context);

    const docBlock = docs
      .map((d, i) => `=== DOCUMENT ${i + 1}: "${d.name}" (${d.type}) ===\n${d.text}`)
      .join('\n\n');

    const reqBlock = reqs
      .map((r) => `- id: ${r.id} | ${r.article} — ${r.name}\n  Acceptance criteria: ${r.criteria.join(' | ') || '(none listed)'}`)
      .join('\n');

    let contextBlock = '';
    if (ctx) {
      const lines: string[] = [];
      if (ctx.facilityName) lines.push(`Vessel / facility: ${ctx.facilityName}`);
      if (ctx.systemTypes?.length) lines.push(`System types in scope: ${ctx.systemTypes.join(', ')}`);
      if (ctx.securityLevel) lines.push(`Target security level: ${ctx.securityLevel}`);
      if (ctx.zones?.length) lines.push(`Zones / conduits: ${ctx.zones.join(', ')}`);
      if (ctx.protocols?.length) lines.push(`Protocols in use: ${ctx.protocols.join(', ')}`);
      if (ctx.measures?.length) lines.push(`Measures declared in intake: ${ctx.measures.join(', ')}`);
      if (ctx.description) lines.push(`System description: ${ctx.description}`);
      if (ctx.knownIssues) lines.push(`Known issues stated by the operator: ${ctx.knownIssues}`);
      contextBlock = `=== SYSTEM CONTEXT (intake answers) ===\n${lines.join('\n')}\n\n`;
    }

    const systemPrompt = `You are a maritime cyber security assessor evaluating compliance with IACS UR ${standard} (IEC 62443 based) for on-board Computer Based Systems (CBS).
This is a self-assessment: the operator's intake answers are TRUSTED self-declarations and form the BASIS of the evaluation. The uploaded documents COMPLEMENT and verify those declarations — they do not have to prove every single intake statement.

HOW TO DETERMINE "status" for each requirement:
1. Start from the SYSTEM CONTEXT / intake declarations. Map the declared measures, systems, zones and protocols to the requirement. A relevant measure declared as in place / documented counts as a self-declared control.
   - "pass": the declaration (optionally reinforced by documents) indicates the control is fully in place for all acceptance criteria.
   - "partial": the declaration indicates the control is only partially in place, or only some criteria are covered.
   - "fail": nothing in the intake or documents indicates the control exists.
2. Documents COMPLEMENT the declaration:
   - If a document confirms a declared control, keep/raise the status and provide a verbatim quote as evidence.
   - If a document reveals ADDITIONAL controls not declared, you may raise the status based on the document.
   - If a document clearly CONTRADICTS a declaration (explicitly states the control is absent), do NOT silently override it — keep the self-declared status but note the discrepancy in "rationale" and lower "confidence".

"basis" — how the verdict is grounded (REQUIRED):
   - "declared": based on intake self-declaration only, no document evidence.
   - "document": based on document evidence only (not declared in intake).
   - "declared_document": declared in intake AND confirmed by a document.
   - "none": neither declared nor documented (status must be "fail").

"evidence": a short verbatim quote/reference from a document if one exists, otherwise an empty string. NEVER invent document quotes.
"sourceDoc": exact document name the evidence came from, or "" if none.
"confidence": "high" = declared and document-confirmed; "medium" = clearly declared OR solid document evidence; "low" = weak/indirect or contradicted.

APPLICABILITY REVIEW NARRATIVE (REQUIRED for every requirement) — this report is framed as an Applicability Review. In addition to the status, provide:
   - "generalisedFinding": one neutral sentence describing the underlying control/finding in general terms (what the requirement protects against), independent of this specific system.
   - "clientResponse": one sentence summarising the operator's declared position for this control, grounded in the intake declarations / documents (e.g. what they stated is in place or out of scope). If nothing was declared, state that plainly.
   - "residualScopeNote": for "partial" and "fail" controls, one sentence describing what residual scope or gap remains and must still be addressed. For "pass" controls, briefly state why no residual scope remains (e.g. not applicable to this architecture / fully addressed).
Map the status to the applicability verdict shown to the reader: pass = "Not applicable", partial = "Partially applicable", fail = "Applicable" (full residual scope). Judge applicability from the actual system context — a control may legitimately be "Not applicable" even if its generic risk rating is high, when the architecture or scope rules it out.

OVERALL SUMMARY (REQUIRED, in the "summary" object):
   - "coreFinding": 2-3 sentences summarising the overall applicability outcome for this system.
   - "recommendation": 1-2 sentences with the headline recommendation.
   - "residualScopeItems": up to 5 of the most important residual scope items, each { "title", "detail" }.

Write all narrative ("rationale", "generalisedFinding", "clientResponse", "residualScopeNote", "coreFinding", "recommendation", residual scope items) in ${langName}; keep evidence quotes in their original document language. Return a verdict for EVERY requirement id.`;

    const userPrompt = `${contextBlock}EVIDENCE DOCUMENTS:\n${docBlock}\n\n=== REQUIREMENTS TO ASSESS ===\n${reqBlock}`;


    const tool = {
      type: 'function',
      function: {
        name: 'submit_assessment',
        description: 'Submit the combined (self-declaration + document) compliance assessment for every requirement.',
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
                  basis: { type: 'string', enum: ['declared', 'document', 'declared_document', 'none'] },
                  evidence: { type: 'string' },
                  rationale: { type: 'string' },
                  sourceDoc: { type: 'string' },
                  confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                  generalisedFinding: { type: 'string' },
                  clientResponse: { type: 'string' },
                  residualScopeNote: { type: 'string' },
                },
                required: ['id', 'status', 'basis', 'evidence', 'rationale', 'sourceDoc', 'confidence', 'generalisedFinding', 'clientResponse', 'residualScopeNote'],
                additionalProperties: false,
              },
            },
            summary: {
              type: 'object',
              properties: {
                coreFinding: { type: 'string' },
                recommendation: { type: 'string' },
                residualScopeItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      detail: { type: 'string' },
                    },
                    required: ['title', 'detail'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['coreFinding', 'recommendation', 'residualScopeItems'],
              additionalProperties: false,
            },
          },
          required: ['assessments', 'summary'],
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
    let parsed: { assessments?: unknown; summary?: unknown } = {};
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
      const basis = a && ['declared', 'document', 'declared_document', 'none'].includes(String(a.basis))
        ? String(a.basis)
        : 'none';
      return {
        id: r.id,
        status,
        basis,
        evidence: a ? String(a.evidence || '').slice(0, 1000) : '',
        rationale: a ? String(a.rationale || '').slice(0, 1500) : 'Not declared in the intake and no documented evidence found.',
        sourceDoc: a ? String(a.sourceDoc || '').slice(0, 200) : '',
        confidence: a && ['high', 'medium', 'low'].includes(String(a.confidence)) ? String(a.confidence) : 'low',
        generalisedFinding: a ? String(a.generalisedFinding || '').slice(0, 600) : '',
        clientResponse: a ? String(a.clientResponse || '').slice(0, 600) : '',
        residualScopeNote: a ? String(a.residualScopeNote || '').slice(0, 600) : '',
      };
    });

    const rawSummary = (parsed.summary && typeof parsed.summary === 'object') ? parsed.summary as Record<string, unknown> : {};
    const summary = {
      coreFinding: String(rawSummary.coreFinding || '').slice(0, 2000),
      recommendation: String(rawSummary.recommendation || '').slice(0, 1200),
      residualScopeItems: Array.isArray(rawSummary.residualScopeItems)
        ? (rawSummary.residualScopeItems as Record<string, unknown>[]).slice(0, 6).map((s) => ({
            title: String(s.title || '').slice(0, 200),
            detail: String(s.detail || '').slice(0, 600),
          })).filter((s) => s.title)
        : [],
    };

    return json({ assessments, summary, documentsAnalyzed: docs.map((d) => d.name) }, 200);
  } catch (err) {
    console.error('iec-document-assessment error', err);
    return json({ error: 'internal_error', message: 'Internal server error' }, 500);
  }
});

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
