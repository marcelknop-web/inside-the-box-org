import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── RATE LIMITING (in-memory, resets on cold start) ─────────────
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_DAILY_REQUESTS = 300;

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

// ─── SSRF PROTECTION ─────────────────────────────────────────────

const ALLOWED_HOST = "portquiz.net";

function isAllowedHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === ALLOWED_HOST;
}

// ─── PORT CHECK LOGIC ────────────────────────────────────────────

interface PortCheckRequest {
  host: string;
  ports: number[];
  timeout?: number;
}

interface PortResult {
  port: number;
  reachable: boolean;
  latencyMs?: number;
  error?: string;
}

async function checkPort(host: string, port: number, timeoutMs: number): Promise<PortResult> {
  const start = Date.now();
  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: host, port }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      ),
    ]);
    const latencyMs = Date.now() - start;
    (conn as Deno.Conn).close();
    return { port, reachable: true, latencyMs };
  } catch (e) {
    const latencyMs = Date.now() - start;
    const msg = e instanceof Error ? e.message : "unknown error";
    const isRefused = msg.toLowerCase().includes("connection refused");
    return {
      port,
      reachable: isRefused ? true : false,
      latencyMs,
      error: isRefused ? undefined : msg,
    };
  }
}

// ─── HANDLER ─────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";
  const rl = getRateLimitResult(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests, please wait." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  try {
    const { host, ports, timeout = 5000 } = (await req.json()) as PortCheckRequest;

    if (!host || !ports?.length) {
      return new Response(
        JSON.stringify({ error: "host and ports[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isAllowedHost(host)) {
      return new Response(
        JSON.stringify({ error: "Host not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to max 25 ports per request
    const portsToCheck = ports.slice(0, 25);
    const results = await Promise.all(
      portsToCheck.map((p) => checkPort(host, p, Math.min(timeout, 10000)))
    );

    return new Response(JSON.stringify({ host, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("check-ports error:", e);
    return new Response(JSON.stringify({ error: "Service error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
