import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const encoder = new TextEncoder();
const HMAC_SECRET = Deno.env.get("RESOURCE_PASSWORD_EHRENERKLAERUNG") ?? "";

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  return expected === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, password, token } = await req.json();

    // Action: verify password and issue token
    if (action === "login") {
      if (!password || password !== HMAC_SECRET) {
        return new Response(
          JSON.stringify({ error: "Invalid password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 min
      const payload = `ehrenerklaerung:${expiresAt}`;
      const signature = await hmacSign(payload);

      return new Response(
        JSON.stringify({ token: `${payload}:${signature}`, expiresAt }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: verify token
    if (action === "verify") {
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parts = token.split(":");
      if (parts.length !== 3) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [prefix, expiresAtStr, signature] = parts;
      const payload = `${prefix}:${expiresAtStr}`;
      const valid = await hmacVerify(payload, signature);
      const expired = Date.now() > parseInt(expiresAtStr, 10);

      return new Response(
        JSON.stringify({ valid: valid && !expired }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-access error:", e);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
