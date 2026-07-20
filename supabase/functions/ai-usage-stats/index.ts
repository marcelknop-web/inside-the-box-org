import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

const ADMIN_SECRET = Deno.env.get("TTX_ADMIN_SECRET");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = req.headers.get("x-admin-token");
  if (!ADMIN_SECRET || !token || token !== ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const fn = url.searchParams.get("function") || "ernstfall-generate";
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") || "30", 10)));
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("created_at, model, status, prompt_tokens, completion_tokens, total_tokens, cost_usd, duration_ms, meta")
    .eq("function_name", fn)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = data ?? [];

  // Aggregation nach Tag+Modell
  const byDayModel = new Map<string, {
    day: string; model: string;
    calls: number; ok: number; err: number;
    prompt_tokens: number; completion_tokens: number; total_tokens: number;
    cost_usd: number; duration_ms_sum: number;
  }>();
  const byDay = new Map<string, { day: string; calls: number; total_tokens: number; cost_usd: number }>();
  const byModel = new Map<string, { model: string; calls: number; total_tokens: number; cost_usd: number }>();

  for (const r of rows) {
    const day = (r.created_at as string).slice(0, 10);
    const model = r.model as string;
    const key = `${day}|${model}`;
    const isOk = (r.status ?? 200) < 400;
    const bucket = byDayModel.get(key) ?? {
      day, model, calls: 0, ok: 0, err: 0,
      prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
      cost_usd: 0, duration_ms_sum: 0,
    };
    bucket.calls++;
    if (isOk) bucket.ok++; else bucket.err++;
    bucket.prompt_tokens += r.prompt_tokens ?? 0;
    bucket.completion_tokens += r.completion_tokens ?? 0;
    bucket.total_tokens += r.total_tokens ?? 0;
    bucket.cost_usd += Number(r.cost_usd ?? 0);
    bucket.duration_ms_sum += r.duration_ms ?? 0;
    byDayModel.set(key, bucket);

    const d = byDay.get(day) ?? { day, calls: 0, total_tokens: 0, cost_usd: 0 };
    d.calls++; d.total_tokens += r.total_tokens ?? 0; d.cost_usd += Number(r.cost_usd ?? 0);
    byDay.set(day, d);

    const m = byModel.get(model) ?? { model, calls: 0, total_tokens: 0, cost_usd: 0 };
    m.calls++; m.total_tokens += r.total_tokens ?? 0; m.cost_usd += Number(r.cost_usd ?? 0);
    byModel.set(model, m);
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.calls++;
      if ((r.status ?? 200) < 400) acc.ok++; else acc.err++;
      acc.prompt_tokens += r.prompt_tokens ?? 0;
      acc.completion_tokens += r.completion_tokens ?? 0;
      acc.total_tokens += r.total_tokens ?? 0;
      acc.cost_usd += Number(r.cost_usd ?? 0);
      return acc;
    },
    { calls: 0, ok: 0, err: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_usd: 0 },
  );

  const body = {
    function_name: fn,
    days,
    since,
    totals,
    byDay: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    byModel: Array.from(byModel.values()).sort((a, b) => b.cost_usd - a.cost_usd),
    byDayModel: Array.from(byDayModel.values()).sort((a, b) => a.day.localeCompare(b.day) || a.model.localeCompare(b.model)),
    recent: rows.slice(0, 50),
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
