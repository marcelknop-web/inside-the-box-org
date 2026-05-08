import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const agentId: string = typeof body?.agentId === "string" ? body.agentId.trim() : "";
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(agentId)) {
      return new Response(JSON.stringify({ error: "invalid agentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ELEVEN = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVEN) return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY missing" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": ELEVEN } }
    );
    if (!r.ok) {
      const t = await r.text();
      console.error("convai token error", r.status, t);
      return new Response(JSON.stringify({ error: "token failed", detail: t.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    return new Response(JSON.stringify({ token: data.token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("baerbock-realtime-token", e);
    return new Response(JSON.stringify({ error: "internal" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
