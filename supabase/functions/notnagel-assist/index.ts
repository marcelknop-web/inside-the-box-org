import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function logAiUsage(row: Record<string, unknown>) {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    await createClient(url, key).from("ai_usage_logs").insert(row);
  } catch (e) {
    console.error("ai_usage_logs insert failed", e);
  }
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_DAILY_REQUESTS = 400;
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
let dailyCount = 0;
let dailyResetAt = Date.now() + 86_400_000;

function rateCheck(ip: string) {
  const now = Date.now();
  if (now > dailyResetAt) { dailyCount = 0; dailyResetAt = now + 86_400_000; }
  if (dailyCount >= MAX_DAILY_REQUESTS) return { allowed: false, retryAfter: 3600 };
  const e = ipRateMap.get(ip);
  if (!e || now > e.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    dailyCount++;
    return { allowed: true };
  }
  if (e.count >= MAX_REQUESTS_PER_WINDOW) return { allowed: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  e.count++; dailyCount++;
  return { allowed: true };
}

const MODEL = "google/gemini-2.5-flash";
const PRICE_IN_PER_M = 0.30;
const PRICE_OUT_PER_M = 2.50;

const SYSTEM = `Du bist BCM-Berater und hilfst einem Fachbereichsverantwortlichen ohne BCM-Vorkenntnisse beim Ausfüllen eines Formulars (Business Impact Analyse, Notfallplan, Tabletop-Übung; Referenzen ISO 22301, BSI-Standard 200-4).

AUFGABE: Du lieferst konkrete, direkt einsetzbare Formulierungsvorschläge für genau EIN Eingabefeld.

REGELN:
- Deutsch, sachlich, unpersönlich, Aktiv. Keine Anrede, keine Werbesprache.
- Jeder Vorschlag ist ein fertiger Feldinhalt, kein Ratschlag über das Feld. Keine Einleitung wie "Hier könnten Sie ...".
- Nutze den mitgelieferten Kontext (Branche, Bereich, Prozesse, Ressourcen). Erfinde keine Systemnamen, Personen oder Dienstleister, die nicht im Kontext stehen; formuliere solche Stellen generisch (z. B. "das führende Fachverfahren").
- Keine Kennzahlen erfinden: nenne keine MTPD-, RTO- oder RPO-Werte, die nicht im Kontext stehen.
- Vorschläge unterscheiden sich klar voneinander (verschiedene Blickwinkel, nicht Umformulierungen).
- Feld für kurze Eingaben: max. 2 Sätze. Freitextfeld: max. 4 Sätze.
- "warum" erklärt in einem Halbsatz, warum der Vorschlag fachlich trägt.

Antworte AUSSCHLIESSLICH mit JSON: {"suggestions":[{"text":"","warum":""}]} – genau 3 Vorschläge, kein Markdown.`;

const s = (v: unknown, max = 600) => (typeof v === "string" ? v.slice(0, max) : "");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateCheck(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte kurz warten." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.retryAfter ?? 60) },
    });
  }

  try {
    const body = await req.json();
    const field = s(body?.field, 160);
    const help = s(body?.help, 600);
    const current = s(body?.current, 800);
    const context = s(body?.context, 6000);

    if (!field) {
      return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service nicht konfiguriert" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `## Feld
${field}

## Was in das Feld gehört
${help || "keine weitere Vorgabe"}

## Bisheriger Inhalt des Feldes
${current || "leer"}

## Kontext der Erfassung
${context || "noch keine Angaben"}

Liefere genau 3 Vorschläge für dieses Feld.`;

    const t0 = Date.now();
    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 1400,
        }),
      });
    } catch (e) {
      console.error("gateway fetch failed", e);
      return new Response(JSON.stringify({ error: "KI-Gateway nicht erreichbar" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const durationMs = Date.now() - t0;

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(JSON.stringify({ evt: "notnagel_assist_error", status: response.status, err: errText.slice(0, 400) }));
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Bitte kurz warten." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "KI-Kontingent erschöpft." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Vorschläge konnten nicht erzeugt werden" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const usage = data?.usage ?? {};
    const content: string = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    const suggestions = Array.isArray(parsed?.suggestions)
      ? parsed.suggestions.slice(0, 4).map((x: any) => ({ text: s(x?.text, 900), warum: s(x?.warum, 300) })).filter((x: any) => x.text)
      : [];

    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    await logAiUsage({
      function_name: "notnagel-assist",
      model: MODEL,
      status: 200,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      cost_usd: Number(((promptTokens / 1_000_000) * PRICE_IN_PER_M + (completionTokens / 1_000_000) * PRICE_OUT_PER_M).toFixed(6)),
      duration_ms: durationMs,
      meta: { field, suggestions: suggestions.length },
    });

    if (!suggestions.length) {
      return new Response(JSON.stringify({ error: "Keine verwertbaren Vorschläge. Bitte erneut versuchen." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notnagel-assist error", e);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
