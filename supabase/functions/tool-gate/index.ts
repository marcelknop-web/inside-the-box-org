import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Same SHA-256 as the previous client-side hash — no new secret required to know
// what the password is. The security improvement is that unlock tokens are
// signed with a server-only HMAC secret, so a browser-side attacker can no
// longer forge an unlock state.
const PASSWORD_HASH = '673a6941fb53d0f9005625d2816b3a8186fbb694255acb630a99b35982c1f94f';
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const enc = new TextEncoder();

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSign(secret: string, msg: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function issueToken(secret: string, scope: string) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${scope}.${exp}`;
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

async function verifyToken(secret: string, scope: string, token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [tokScope, expStr, sig] = parts;
  if (tokScope !== scope) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacSign(secret, `${tokScope}.${expStr}`);
  return timingSafeEqual(expected, sig);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  const secret = Deno.env.get('TTX_ADMIN_SECRET');
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: jsonHeaders });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const action = body?.action;
  const scope = typeof body?.scope === 'string' ? body.scope.slice(0, 128) : '';
  if (!scope) return new Response(JSON.stringify({ error: 'scope required' }), { status: 400, headers: jsonHeaders });

  if (action === 'verify') {
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password || password.length > 512) {
      return new Response(JSON.stringify({ error: 'invalid password' }), { status: 400, headers: jsonHeaders });
    }
    const h = await sha256Hex(password);
    if (!timingSafeEqual(h, PASSWORD_HASH)) {
      return new Response(JSON.stringify({ ok: false }), { status: 401, headers: jsonHeaders });
    }
    const token = await issueToken(secret, scope);
    return new Response(JSON.stringify({ ok: true, token }), { status: 200, headers: jsonHeaders });
  }

  if (action === 'check') {
    const token = typeof body?.token === 'string' ? body.token : '';
    const ok = token ? await verifyToken(secret, scope, token) : false;
    return new Response(JSON.stringify({ ok }), { status: 200, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: jsonHeaders });
});
