import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { page = "site", increment = true } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let count: number | null = null;
    if (increment) {
      const { data, error } = await supabase.rpc("increment_page_visit", { p_page: String(page) });
      if (error) throw error;
      count = data as number;
    } else {
      const { data, error } = await supabase.from("page_visits").select("count").eq("page", String(page)).maybeSingle();
      if (error) throw error;
      count = (data?.count as number | undefined) ?? 0;
    }

    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
