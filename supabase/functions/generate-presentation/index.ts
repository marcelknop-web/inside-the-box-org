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
  themeName?: string;
  language?: string;
  // status
  generationId?: string;
}

// Fixed Gamma theme for every GapZero deck. Can be overridden per request, but
// defaults to "Pearl" for a consistent, board-ready look across all decks.
const DEFAULT_THEME = 'Pearl';

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
      textMode: 'preserve',
      format: 'presentation',
      themeName: (body.themeName ?? DEFAULT_THEME).toString().slice(0, 60),
      cardSplit: 'inputTextBreaks',
      exportAs: 'pdf',
      additionalInstructions: (body.additionalInstructions ?? '').toString().slice(0, 2000),
      // ── Optimal generation parameters for board-ready visual decks ──
      textOptions: {
        amount: 'detailed',
        tone: 'professional, executive, audit-grade',
        audience: 'board members, executives, auditors and risk committees',
        language: (body.language ?? 'en').toString().slice(0, 10),
      },
      imageOptions: {
        source: 'aiGenerated',
        model: 'imagen-4-pro',
        style: 'clean, corporate, professional, minimal infographic style',
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
