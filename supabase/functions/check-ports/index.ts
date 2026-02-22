import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    // "Connection refused" means the TCP packet reached the server — network is OPEN.
    // Only a timeout indicates a firewall blocking the port.
    const isRefused = msg.toLowerCase().includes("connection refused");
    return {
      port,
      reachable: isRefused ? true : false,
      latencyMs,
      error: isRefused ? undefined : msg,
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, ports, timeout = 5000 } = (await req.json()) as PortCheckRequest;

    if (!host || !ports?.length) {
      return new Response(
        JSON.stringify({ error: "host and ports[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
