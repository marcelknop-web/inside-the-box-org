// Generate an executive presentation via the Gamma Generate API.
//
// Two-phase (avoids long-running requests, since Gamma generations take 1-3 min):
//   action "start"  → starts an async generation, returns { generationId }
//   action "status" → checks one generation, returns status + gammaUrl when done
//
// Receives slide-optimized content (already transformed from the deterministic
// assessment + AI insight engine on the client). Never exports raw report text.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GAMMA_BASE = 'https://public-api.gamma.app/v1.0';

interface RequestBody {
  action?: 'start' | 'status';
  // start
  inputText?: string;
  title?: string;
  additionalInstructions?: string;
  numCards?: number;
  themeId?: string;
  language?: string;
  // status
  generationId?: string;
}

// Fixed Gamma theme for every GapZero deck. Built-in Gamma themes use their
// lowercase name as the theme ID. "oasis" is a clean, minimal, light theme with
// generous white space and a restrained corporate palette — the closest built-in
// match to a McKinsey / BCG / Bain consulting deck. Can be overridden per request.
const DEFAULT_THEME_ID = 'oasis';

// McKinsey-style layout & design directive applied to every deck.
const MCKINSEY_LAYOUT_INSTRUCTIONS =
  'LAYOUT & DESIGN — STRATEGY-CONSULTING STANDARD (McKinsey / BCG / Bain): ' +
  'Design every slide like a top-tier management-consulting deck. ' +
  'ACTION TITLES: each slide headline must be a full-sentence "so-what" takeaway that states the insight (e.g. "Governance gaps drive 60% of residual risk"), not a generic topic label. ' +
  'STRUCTURE: one core message per slide, supported by a clean horizontal layout — 2 to 4 balanced columns, a left-to-right logical flow, or a clearly labelled framework/matrix. Use MECE groupings. ' +
  'VISUAL SYSTEM: extremely restrained and corporate. Generous white space, strong alignment to a grid, consistent margins, a single accent colour used sparingly for emphasis, and a muted neutral palette (navy, grey, white). No gradients, no shadows, no rounded "playful" shapes. ' +
  'DATA VISUALS: prefer crisp bar charts, stacked bars, Harvey balls, 2x2 matrices, waterfalls, simple tables and process arrows built from the actual numbers — clean axes, direct data labels, no chartjunk, no 3D, no legends when labels suffice. ' +
  'TYPOGRAPHY: a clear hierarchy — bold concise titles, tight sub-points, no walls of text. Use short parallel bullet phrases, never paragraphs. ' +
  'SOURCE NOTES: add a small, muted "Source:" / footnote line at the bottom of data slides where relevant. ' +
  'Overall impression must read as boardroom-grade, sober, precise and authoritative.';

// Quality bar applied to every deck — enforces precision and a premium finish.
const QUALITY_INSTRUCTIONS =
  'QUALITY BAR — NON-NEGOTIABLE: The deck must look and read like a finished, paid-for engagement deliverable from a tier-1 consultancy. Reject anything that feels generic, templated, vague or "AI-generated". ' +
  'PRECISION: Be concrete and specific on every slide. Always use the exact figures, percentages, ratings, control IDs, article references, category names and CMMI levels provided in the content — never round them away, never replace them with vague qualifiers like "several", "many" or "some". Every claim must be traceable to a number or finding in the source content. ' +
  'NO FLUFF: Cut filler words, hedging and throat-clearing. Each bullet is one crisp, parallel, information-dense phrase. No empty intros, no "in conclusion", no restating the title. If a slide does not earn its place with a distinct insight, merge it. ' +
  'CONSISTENCY: Identical terminology, capitalisation, number formatting (e.g. 1 decimal for CMMI levels, % with no space), date format and label style across all slides. The same concept always uses the same word. ' +
  'HIERARCHY: A single dominant message per slide, with supporting evidence visibly subordinate. The reader must grasp the "so-what" in under three seconds. ' +
  'SELF-CHECK BEFORE FINISHING: re-read every slide and remove any vagueness, any unsupported claim, any decorative filler, any duplicated point, and any text that overflows or crowds the layout. The final deck must be tight, accurate, scannable and visually pristine.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });

  try {
    const apiKey = Deno.env.get('GAMMA_API_KEY');
    if (!apiKey) return json({ error: 'Gamma API key is not configured.' }, 500);

    let body: RequestBody;
    try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }

    const action = body.action ?? 'start';

    // ── STATUS ──────────────────────────────────────────────────
    if (action === 'status') {
      const id = (body.generationId ?? '').toString();
      if (!id) return json({ error: 'Missing generationId.' }, 400);

      const res = await fetch(`${GAMMA_BASE}/generations/${encodeURIComponent(id)}`, {
        headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('Gamma poll failed', res.status, text);
        return json({ error: `Gamma status check failed (${res.status}).` }, 502);
      }
      let poll: { status?: string; gammaUrl?: string; exportUrl?: string; gammaId?: string; error?: unknown };
      try { poll = JSON.parse(text); } catch { poll = {}; }

      if (poll.status === 'completed') {
        return json({
          status: 'completed',
          gammaUrl: poll.gammaUrl ?? null,
          exportUrl: poll.exportUrl ?? null,
          gammaId: poll.gammaId ?? null,
          generationId: id,
        });
      }
      if (poll.status === 'failed') {
        console.error('Gamma generation failed', text);
        return json({ status: 'failed', error: 'Gamma reported the generation failed.', detail: poll.error ?? null }, 200);
      }
      return json({ status: 'pending', generationId: id });
    }

    // ── START ───────────────────────────────────────────────────
    const inputText = (body.inputText ?? '').toString();
    if (inputText.trim().length < 20) {
      return json({ error: 'Presentation content is empty or too short.' }, 400);
    }

    const payload: Record<string, unknown> = {
      inputText,
      textMode: 'condense',
      format: 'presentation',
      themeId: (body.themeId ?? DEFAULT_THEME_ID).toString().slice(0, 60),
      cardSplit: 'inputTextBreaks',
      exportAs: 'pdf',
      additionalInstructions: [
        (body.additionalInstructions ?? '').toString().slice(0, 1000),
        MCKINSEY_LAYOUT_INSTRUCTIONS,
        QUALITY_INSTRUCTIONS,
        // Hard rule: every graphic must carry meaning — no filler.
        'TEXT EDITING RULE: You MAY rephrase, tighten and clarify the slide text so it reads well and makes sense on a slide — fix awkward phrasing, shorten run-ons, improve flow. ' +
        'But NEVER change the meaning, the facts, the numbers, the findings, the ratings or the conclusions. No new claims, no invented data, no altered results — wording only. ' +
        'CRITICAL GRAPHICS RULE: Every image, chart, diagram or icon must directly illustrate the specific content of its slide and add real informational value. ' +
        'Prefer data-driven visuals — charts, tables, diagrams, process flows, matrices, comparisons — built from the actual numbers and findings on the slide. ' +
        'Absolutely NO decorative, generic, abstract or "filler" stock-style imagery, no random people, handshakes, glowing shields, abstract tech swirls or unrelated metaphors. ' +
        'If a slide has no data that a visual can meaningfully represent, use a clean diagram of its concept or no image at all rather than a decorative one.',
      ].join('\n\n').slice(0, 4000),
      // ── Optimal generation parameters for board-ready visual decks ──
      textOptions: {
        amount: 'detailed',
        tone: 'professional, executive, audit-grade, sober, precise, McKinsey-style strategy consulting; zero fluff, evidence-led',
        audience: 'board members, executives, auditors and risk committees',
        language: (body.language ?? 'en').toString().slice(0, 10),
      },
      imageOptions: {
        source: 'aiGenerated',
        model: 'imagen-4-pro',
        style: 'minimal management-consulting (McKinsey/BCG/Bain) visuals: precise data-driven charts, 2x2 matrices, Harvey balls, process arrows and diagrams that depict the slide content exactly; restrained navy/grey/white corporate palette, generous white space, flat clean lines, no gradients, no shadows, no decorative or generic filler imagery',
      },

      cardOptions: {
        dimensions: '16x9',
      },
      sharingOptions: {
        workspaceAccess: 'view',
        externalAccess: 'view',
      },
    };
    if (body.title) payload.title = body.title.toString().slice(0, 200);
    if (body.numCards) payload.numCards = Math.min(60, Math.max(1, Number(body.numCards)));


    const startRes = await fetch(`${GAMMA_BASE}/generations`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const startText = await startRes.text();
    if (!startRes.ok) {
      console.error('Gamma start failed', startRes.status, startText);
      return json({ error: `Gamma generation could not be started (${startRes.status}).`, detail: startText.slice(0, 500) }, 502);
    }
    let startData: { generationId?: string };
    try { startData = JSON.parse(startText); } catch { startData = {}; }
    if (!startData.generationId) {
      console.error('Gamma start returned no generationId', startText);
      return json({ error: 'Gamma did not return a generation id.' }, 502);
    }
    return json({ status: 'pending', generationId: startData.generationId });
  } catch (e) {
    console.error('generate-presentation error', e);
    return json({ error: 'Unexpected error while generating the presentation.' }, 500);
  }
});
