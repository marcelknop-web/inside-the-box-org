// Generate an executive presentation via the Gamma Generate API.
//
// Receives slide-optimized content (already transformed from the deterministic
// assessment + AI insight engine on the client) and starts an async Gamma
// generation, then polls until the deck is ready and returns the gammaUrl.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GAMMA_BASE = 'https://public-api.gamma.app/v1.0';

interface RequestBody {
  inputText: string;
  title?: string;
  additionalInstructions?: string;
  numCards?: number;
  presentationType?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    if (!apiKey) {
      return json({ error: 'Gamma API key is not configured.' }, 500);
    }

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    const inputText = (body.inputText ?? '').toString();
    if (inputText.trim().length < 20) {
      return json({ error: 'Presentation content is empty or too short.' }, 400);
    }

    const payload: Record<string, unknown> = {
      inputText,
      textMode: 'preserve',
      format: 'presentation',
      cardSplit: 'inputTextBreaks',
      exportAs: 'pdf',
      additionalInstructions: (body.additionalInstructions ?? '').toString().slice(0, 2000),
    };
    if (body.title) payload.title = body.title.toString().slice(0, 200);
    if (body.numCards) payload.numCards = Math.min(60, Math.max(1, Number(body.numCards)));

    // 1) Start the async generation.
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
    const generationId = startData.generationId;
    if (!generationId) {
      console.error('Gamma start returned no generationId', startText);
      return json({ error: 'Gamma did not return a generation id.' }, 502);
    }

    // 2) Poll until completed / failed (max ~110s).
    const maxAttempts = 22;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(5000);
      const pollRes = await fetch(`${GAMMA_BASE}/generations/${generationId}`, {
        headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' },
      });
      const pollText = await pollRes.text();
      if (!pollRes.ok) {
        console.error('Gamma poll failed', pollRes.status, pollText);
        // transient — keep trying unless it's the last attempt
        if (attempt === maxAttempts - 1) {
          return json({ error: `Gamma status check failed (${pollRes.status}).` }, 502);
        }
        continue;
      }
      let poll: { status?: string; gammaUrl?: string; exportUrl?: string; gammaId?: string; error?: unknown };
      try { poll = JSON.parse(pollText); } catch { poll = {}; }

      if (poll.status === 'completed') {
        return json({
          status: 'completed',
          gammaUrl: poll.gammaUrl ?? null,
          exportUrl: poll.exportUrl ?? null,
          gammaId: poll.gammaId ?? null,
          generationId,
        });
      }
      if (poll.status === 'failed') {
        console.error('Gamma generation failed', pollText);
        return json({ error: 'Gamma reported the generation failed.', detail: poll.error ?? null }, 502);
      }
      // pending → keep polling
    }

    // Still pending after the polling window — return the id so the client can keep it.
    return json({ status: 'pending', generationId, message: 'Generation is still in progress. Please retry shortly.' }, 202);
  } catch (e) {
    console.error('generate-presentation error', e);
    return json({ error: 'Unexpected error while generating the presentation.' }, 500);
  }
});
