import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── RATE LIMITING ───────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_DAILY_REQUESTS = 200;

interface RateEntry { count: number; resetAt: number; }
const ipRateMap = new Map<string, RateEntry>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function getRateLimitResult(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) return { allowed: false, retryAfter: 3600 };
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  dailyCount++;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateMap) {
    if (now > entry.resetAt) ipRateMap.delete(ip);
  }
}, 300_000);

// ─── PASSWORD / TOKEN HELPERS ────────────────────────────────────
const TOKEN_TTL_MS = 30 * 60_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getResourcePassword(resource: string): string | undefined {
  const key = `RESOURCE_PASSWORD_${resource.toUpperCase()}`;
  return Deno.env.get(key);
}

function normalizeResource(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,50}$/.test(value)) return null;
  return value;
}

function base64UrlEncode(input: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const max = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < max; i++) {
    const av = i < aBytes.length ? aBytes[i] : 0;
    const bv = i < bBytes.length ? bBytes[i] : 0;
    diff |= av ^ bv;
  }

  return diff === 0;
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signatureBuffer));
}

async function issueAccessToken(resource: string, secret: string): Promise<string> {
  const payload = JSON.stringify({
    resource,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: crypto.randomUUID(),
  });

  const payloadEncoded = base64UrlEncode(encoder.encode(payload));
  const signature = await signPayload(payloadEncoded, secret);
  return `${payloadEncoded}.${signature}`;
}

async function verifyAccessToken(token: string, resource: string, secret: string): Promise<boolean> {
  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return false;

  const expectedSignature = await signPayload(payloadEncoded, secret);
  if (!constantTimeEquals(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(decoder.decode(base64UrlDecode(payloadEncoded))) as { resource?: string; exp?: number };
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;
    if (payload.resource !== resource) return false;
    return true;
  } catch {
    return false;
  }
}

type Submission = {
  vorname?: string;
  nachname?: string;
  email: string;
  geburtsdatum?: string | null;
  falscheErklaerungen: 'nein' | 'ja';
  notorisch: 'nein' | 'ja';
  erlaeuterung?: string;
  initialen: string;
  bestaetigung: boolean;
};

function validateSubmission(input: unknown): Submission | null {
  if (!input || typeof input !== 'object') return null;

  const obj = input as Record<string, unknown>;
  const email = typeof obj.email === 'string' ? obj.email.trim() : '';
  const initialen = typeof obj.initialen === 'string' ? obj.initialen.trim() : '';

  if (!email || email.length > 255 || !/^\S+@\S+\.\S+$/.test(email)) return null;
  if (!initialen || initialen.length > 10) return null;
  if (obj.falscheErklaerungen !== 'ja' && obj.falscheErklaerungen !== 'nein') return null;
  if (obj.notorisch !== 'ja' && obj.notorisch !== 'nein') return null;
  if (obj.bestaetigung !== true) return null;

  const vorname = typeof obj.vorname === 'string' ? obj.vorname.trim().slice(0, 100) : undefined;
  const nachname = typeof obj.nachname === 'string' ? obj.nachname.trim().slice(0, 100) : undefined;
  const erlaeuterung = typeof obj.erlaeuterung === 'string' ? obj.erlaeuterung.trim().slice(0, 2000) : undefined;
  const geburtsdatum = typeof obj.geburtsdatum === 'string' && obj.geburtsdatum.length <= 40 ? obj.geburtsdatum : null;

  return {
    vorname,
    nachname,
    email,
    geburtsdatum,
    falscheErklaerungen: obj.falscheErklaerungen,
    notorisch: obj.notorisch,
    erlaeuterung,
    initialen,
    bestaetigung: true,
  };
}

// ─── HANDLER ─────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';
  const rl = getRateLimitResult(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: 'Zu viele Versuche, bitte warte einen Moment.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter ?? 60) } },
    );
  }

  try {
    const body = await req.json();
    const action = typeof body?.action === 'string' ? body.action : 'authenticate';
    const resource = normalizeResource(body?.resource);

    if (!resource) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const expected = getResourcePassword(resource);
    if (!expected) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'authenticate') {
      const password = typeof body?.password === 'string' ? body.password : '';
      if (!password || password.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Invalid input' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const authenticated = constantTimeEquals(password, expected);
      if (!authenticated) {
        return new Response(
          JSON.stringify({ authenticated: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const accessToken = await issueAccessToken(resource, expected);
      return new Response(
        JSON.stringify({ authenticated: true, accessToken, expiresInSeconds: TOKEN_TTL_MS / 1000 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'validate_token') {
      const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
      const authenticated = accessToken
        ? await verifyAccessToken(accessToken, resource, expected)
        : false;

      return new Response(
        JSON.stringify({ authenticated }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'submit') {
      const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
      const tokenValid = accessToken
        ? await verifyAccessToken(accessToken, resource, expected)
        : false;

      if (!tokenValid) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const submission = validateSubmission(body?.submission);
      if (!submission) {
        return new Response(
          JSON.stringify({ error: 'Invalid submission' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Only server-side logging of minimal metadata; no client-side trust.
      console.log('ehrenerklaerung submission accepted', {
        resource,
        timestamp: new Date().toISOString(),
        hasExplanation: Boolean(submission.erlaeuterung),
      });

      return new Response(
        JSON.stringify({ submitted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('verify-access error:', e);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
