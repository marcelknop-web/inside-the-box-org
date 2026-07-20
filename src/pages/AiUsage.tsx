import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Totals {
  calls: number; ok: number; err: number;
  prompt_tokens: number; completion_tokens: number; total_tokens: number;
  cost_usd: number;
}
interface ByDay { day: string; calls: number; total_tokens: number; cost_usd: number }
interface ByModel { model: string; calls: number; total_tokens: number; cost_usd: number }
interface ByDayModel {
  day: string; model: string; calls: number; ok: number; err: number;
  prompt_tokens: number; completion_tokens: number; total_tokens: number;
  cost_usd: number; duration_ms_sum: number;
}
interface RecentRow {
  created_at: string; model: string; status: number;
  prompt_tokens: number; completion_tokens: number; total_tokens: number;
  cost_usd: number; duration_ms: number; meta: Record<string, unknown> | null;
}
interface Stats {
  function_name: string; days: number; since: string;
  totals: Totals; byDay: ByDay[]; byModel: ByModel[];
  byDayModel: ByDayModel[]; recent: RecentRow[];
}

const FUNCTIONS = ["ernstfall-generate"];
const DAY_OPTIONS = [7, 14, 30, 60, 90];

const fmtInt = (n: number) => n.toLocaleString("de-DE");
const fmtUsd = (n: number) => `$${n.toFixed(4)}`;
const fmtMs = (n: number) => `${(n / 1000).toFixed(1)}s`;

const AiUsage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = searchParams.get("token");
  const fn = searchParams.get("function") || "ernstfall-generate";
  const days = parseInt(searchParams.get("days") || "30", 10);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Kein Zugangstoken angegeben."); setLoading(false); return; }
    setLoading(true);
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(
      `https://${projectId}.supabase.co/functions/v1/ai-usage-stats?function=${encodeURIComponent(fn)}&days=${days}`,
      { headers: { "x-admin-token": token } },
    )
      .then((res) => { if (!res.ok) throw new Error("Zugriff verweigert"); return res.json(); })
      .then((data) => { setStats(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [token, fn, days]);

  const maxDayCost = useMemo(
    () => Math.max(0.0001, ...(stats?.byDay ?? []).map((d) => d.cost_usd)),
    [stats],
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground font-mono text-sm">Lade Statistiken…</p></div>;
  }
  if (error) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive font-mono text-sm">{error}</p></div>;
  }
  if (!stats) return null;

  const avgCost = stats.totals.calls ? stats.totals.cost_usd / stats.totals.calls : 0;
  const avgTokens = stats.totals.calls ? stats.totals.total_tokens / stats.totals.calls : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-mono">AI Usage · {stats.function_name}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            seit {new Date(stats.since).toLocaleString("de-DE")} · {stats.days} Tage
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            className="bg-background border border-border rounded px-2 py-1 text-sm font-mono"
            value={fn}
            onChange={(e) => updateParam("function", e.target.value)}
          >
            {FUNCTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            className="bg-background border border-border rounded px-2 py-1 text-sm font-mono"
            value={days}
            onChange={(e) => updateParam("days", String(e.target.value))}
          >
            {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d} Tage</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Aufrufe" value={fmtInt(stats.totals.calls)} sub={`${stats.totals.ok} ok · ${stats.totals.err} err`} />
        <Kpi label="Kosten gesamt" value={fmtUsd(stats.totals.cost_usd)} sub={`Ø ${fmtUsd(avgCost)}/Call`} />
        <Kpi label="Tokens gesamt" value={fmtInt(stats.totals.total_tokens)} sub={`Ø ${fmtInt(Math.round(avgTokens))}/Call`} />
        <Kpi label="Prompt / Completion" value={`${fmtInt(stats.totals.prompt_tokens)} / ${fmtInt(stats.totals.completion_tokens)}`} sub="in / out" />
      </div>

      {/* Chart Kosten pro Tag */}
      <section className="border border-border rounded-lg p-4 bg-background/40">
        <h2 className="text-sm font-mono text-muted-foreground mb-3">Kosten pro Tag (USD)</h2>
        {stats.byDay.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono">Keine Daten im Zeitraum.</p>
        ) : (
          <div className="space-y-1">
            {stats.byDay.map((d) => {
              const pct = (d.cost_usd / maxDayCost) * 100;
              return (
                <div key={d.day} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-20 text-muted-foreground">{d.day}</span>
                  <div className="flex-1 h-4 bg-muted/40 rounded relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-20 text-right">{fmtUsd(d.cost_usd)}</span>
                  <span className="w-24 text-right text-muted-foreground">{fmtInt(d.total_tokens)} tok</span>
                  <span className="w-14 text-right text-muted-foreground">{d.calls}×</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modell-Aggregation */}
      <section className="border border-border rounded-lg p-4 bg-background/40">
        <h2 className="text-sm font-mono text-muted-foreground mb-3">Nach Modell</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Modell</th>
                <th className="p-2 text-right">Calls</th>
                <th className="p-2 text-right">Tokens</th>
                <th className="p-2 text-right">Kosten</th>
                <th className="p-2 text-right">Ø/Call</th>
              </tr>
            </thead>
            <tbody>
              {stats.byModel.map((m) => (
                <tr key={m.model} className="border-t border-border">
                  <td className="p-2">{m.model}</td>
                  <td className="p-2 text-right">{fmtInt(m.calls)}</td>
                  <td className="p-2 text-right">{fmtInt(m.total_tokens)}</td>
                  <td className="p-2 text-right">{fmtUsd(m.cost_usd)}</td>
                  <td className="p-2 text-right">{fmtUsd(m.calls ? m.cost_usd / m.calls : 0)}</td>
                </tr>
              ))}
              {stats.byModel.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Keine Daten.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tag × Modell */}
      <section className="border border-border rounded-lg p-4 bg-background/40">
        <h2 className="text-sm font-mono text-muted-foreground mb-3">Tag × Modell</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Tag</th>
                <th className="p-2 text-left">Modell</th>
                <th className="p-2 text-right">Calls</th>
                <th className="p-2 text-right">ok/err</th>
                <th className="p-2 text-right">In</th>
                <th className="p-2 text-right">Out</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-right">Kosten</th>
                <th className="p-2 text-right">Ø Dauer</th>
              </tr>
            </thead>
            <tbody>
              {stats.byDayModel.map((r) => (
                <tr key={`${r.day}|${r.model}`} className="border-t border-border">
                  <td className="p-2">{r.day}</td>
                  <td className="p-2">{r.model}</td>
                  <td className="p-2 text-right">{r.calls}</td>
                  <td className="p-2 text-right">{r.ok}/{r.err}</td>
                  <td className="p-2 text-right">{fmtInt(r.prompt_tokens)}</td>
                  <td className="p-2 text-right">{fmtInt(r.completion_tokens)}</td>
                  <td className="p-2 text-right">{fmtInt(r.total_tokens)}</td>
                  <td className="p-2 text-right">{fmtUsd(r.cost_usd)}</td>
                  <td className="p-2 text-right">{r.calls ? fmtMs(r.duration_ms_sum / r.calls) : "–"}</td>
                </tr>
              ))}
              {stats.byDayModel.length === 0 && (
                <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">Keine Daten.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Letzte Aufrufe */}
      <section className="border border-border rounded-lg p-4 bg-background/40">
        <h2 className="text-sm font-mono text-muted-foreground mb-3">Letzte 50 Aufrufe</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-2 text-left">Zeit</th>
                <th className="p-2 text-left">Modell</th>
                <th className="p-2 text-right">Status</th>
                <th className="p-2 text-right">Tokens (in/out)</th>
                <th className="p-2 text-right">Kosten</th>
                <th className="p-2 text-right">Dauer</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-2">{new Date(r.created_at).toLocaleString("de-DE")}</td>
                  <td className="p-2">{r.model}</td>
                  <td className={`p-2 text-right ${r.status >= 400 ? "text-destructive" : ""}`}>{r.status}</td>
                  <td className="p-2 text-right">{fmtInt(r.prompt_tokens)} / {fmtInt(r.completion_tokens)}</td>
                  <td className="p-2 text-right">{fmtUsd(Number(r.cost_usd))}</td>
                  <td className="p-2 text-right">{fmtMs(r.duration_ms)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const Kpi = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="border border-border rounded-lg p-3 bg-background/40">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
    <div className="text-xl font-mono mt-1">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground font-mono mt-1">{sub}</div>}
  </div>
);

export default AiUsage;
