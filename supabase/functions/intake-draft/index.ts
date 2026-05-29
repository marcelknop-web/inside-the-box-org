import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Human-friendly, unguessable code e.g. "E26-7F3K-9QX2".
// No ambiguous characters (0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomBlock(len: number): string {
  let out = '';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

const MAX_BYTES = 5_000_000; // ~5 MB guard against oversized payloads

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'save') {
      const tool = typeof body.tool === 'string' ? body.tool.slice(0, 16) : 'IEC';
      const data = body.data;
      if (data === undefined || data === null) {
        return json({ error: 'No data provided.' }, 400);
      }
      const serialized = JSON.stringify(data);
      if (serialized.length > MAX_BYTES) {
        return json({ error: 'Draft too large to store.' }, 413);
      }

      // Generate a unique code (retry a few times on the rare collision).
      let code = '';
      for (let attempt = 0; attempt < 6; attempt++) {
        code = `${tool}-${randomBlock(4)}-${randomBlock(4)}`;
        const { error } = await supabase
          .from('compliance_intake_drafts')
          .insert({ code, tool, data });
        if (!error) {
          return json({ code });
        }
        // 23505 = unique_violation → try a new code
        if (error.code !== '23505') {
          console.error('save error', error);
          return json({ error: 'Could not save draft.' }, 500);
        }
      }
      return json({ error: 'Could not generate a unique code, please retry.' }, 500);
    }

    if (action === 'load') {
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      if (!code) return json({ error: 'No code provided.' }, 400);

      const { data: row, error } = await supabase
        .from('compliance_intake_drafts')
        .select('tool, data')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        console.error('load error', error);
        return json({ error: 'Could not load draft.' }, 500);
      }
      if (!row) return json({ error: 'Draft not found.' }, 404);

      return json({ tool: row.tool, data: row.data });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error('intake-draft fatal', e);
    return json({ error: 'Unexpected error.' }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
