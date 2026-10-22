import { moonCrashItems } from "@/data/moonCrashItems";
import { ItemIcon } from "@/components/moonCrash/ItemIcon";

type Props = { label: string; ranking: number[]; reference: number[]; crewScores: number[]; groupScore: number | null };

export function analyse(ranking: number[], reference: number[]) {
  const diffs = reference.map((r, i) => ranking[i] - r);
  const abs = diffs.map(Math.abs);
  const score = abs.reduce((a, b) => a + b, 0);
  const n = reference.length;
  const rho = 1 - (6 * diffs.reduce((s, d) => s + d * d, 0)) / (n * (n * n - 1));
  return { diffs, abs, score, rho, exact: abs.filter(d => d === 0).length, near: abs.filter(d => d <= 2).length, mean: score / n };
}

const rhoText = (r: number) => r >= 0.8 ? "sehr starke Übereinstimmung" : r >= 0.6 ? "starke Übereinstimmung" : r >= 0.4 ? "mittlere Übereinstimmung" : r >= 0.2 ? "schwache Übereinstimmung" : "kaum Übereinstimmung";
const grade = (s: number) => s <= 25 ? "Ausgezeichnet" : s <= 32 ? "Gut" : s <= 45 ? "Durchschnitt" : s <= 55 ? "Ausbaufähig" : "Schwach";

export function PersonalAnalysis({ label, ranking, reference, crewScores, groupScore }: Props) {
  const a = analyse(ranking, reference);
  const sorted = [...crewScores].sort((x, y) => x - y);
  const place = sorted.findIndex(s => s >= a.score) + 1 || sorted.length;
  const better = sorted.filter(s => s > a.score).length;
  const pct = sorted.length > 1 ? Math.round((better / (sorted.length - 1)) * 100) : 100;
  const top = a.abs.map((d, i) => ({ d, i, raw: a.diffs[i] })).sort((x, y) => y.d - x.d).slice(0, 3).filter(x => x.d > 0);
  const hist = Array.from({ length: 8 }, (_, k) => a.abs.filter(d => (k < 7 ? d === k : d >= 7)).length);
  const histMax = Math.max(1, ...hist);
  const P = 22, S = 236, step = (S - 2 * P) / 14, pos = (r: number) => P + (r - 1) * step;
  const scaleMax = 112, at = (s: number) => 8 + (Math.min(s, scaleMax) / scaleMax) * 464;

  return <section className="py-8 border-b border-border">
    <p className="font-mono text-xs text-highlight mb-2">PERSÖNLICHE ANALYSE</p>
    <h2 className="text-2xl md:text-3xl font-semibold break-words">{label} vs. NASA</h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
      {[
        ["ABWEICHUNG", String(a.score), grade(a.score)],
        ["KORRELATION ρ", a.rho.toFixed(2), rhoText(a.rho)],
        ["TREFFER", `${a.exact}/15`, `${a.near} Gegenstände ±2 Ränge`],
        ["PLATZ", sorted.length ? `${place}/${sorted.length}` : "—", sorted.length > 1 ? `besser als ${pct} % der Crew` : "einzige Abgabe"],
      ].map(([k, v, s]) => <div key={k} className="rounded-lg border border-border bg-background/40 p-4"><p className="font-mono text-[10px] tracking-wider text-muted-foreground">{k}</p><p className="font-mono text-3xl text-primary mt-1">{v}</p><p className="text-xs text-muted-foreground mt-1">{s}</p></div>)}
    </div>

    <div className="mt-6 rounded-lg border border-border bg-background/40 p-4">
      <p className="font-mono text-[10px] tracking-wider text-muted-foreground mb-2">EINORDNUNG · GESAMTABWEICHUNG (0 = identisch mit NASA)</p>
      <svg viewBox="0 0 480 58" className="w-full h-16" role="img" aria-label={`Abweichung ${a.score} Punkte`}>
        {[[0, 25, "fill-highlight/40"], [25, 32, "fill-highlight/25"], [32, 45, "fill-muted"], [45, 55, "fill-primary/20"], [55, scaleMax, "fill-primary/35"]].map(([f, t, c]) => <rect key={String(f)} x={at(f as number)} width={at(t as number) - at(f as number)} y="20" height="12" className={c as string} />)}
        {sorted.map((s, i) => <circle key={i} cx={at(s)} cy="26" r="3" className="fill-foreground/50" />)}
        {groupScore !== null && <g><line x1={at(groupScore)} x2={at(groupScore)} y1="14" y2="38" className="stroke-highlight" strokeWidth="2" /><text x={at(groupScore)} y="50" textAnchor="middle" className="fill-highlight font-mono" fontSize="9">Gruppe {groupScore}</text></g>}
        <polygon points={`${at(a.score) - 6},4 ${at(a.score) + 6},4 ${at(a.score)},16`} className="fill-primary" />
        <text x={at(a.score)} y="11" dx="10" className="fill-primary font-mono" fontSize="10">{label.slice(0, 18)} {a.score}</text>
        {[0, 25, 32, 45, 55, 112].map(t => <text key={t} x={at(t)} y="50" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="8">{groupScore !== null && Math.abs(at(t) - at(groupScore)) < 26 ? "" : t}</text>)}
      </svg>
      <p className="text-xs text-muted-foreground">Punkte = Crew · Linie = Gruppenlösung · Bänder nach NASA-Bewertung (0–25 ausgezeichnet … über 55 schwach)</p>
    </div>

    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <div className="rounded-lg border border-border bg-background/40 p-4">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground mb-2">STREUDIAGRAMM · DEIN RANG vs. NASA-RANG</p>
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-sm mx-auto" role="img" aria-label="Streudiagramm">
          <polygon points={`${pos(1)},${pos(1) - 2 * step} ${pos(15) + 2 * step},${pos(15)} ${pos(15)},${pos(15) + 2 * step} ${pos(1) - 2 * step},${pos(1)}`} className="fill-highlight/10" />
          <rect x={P - 6} y={P - 6} width={S - 2 * P + 12} height={S - 2 * P + 12} fill="none" className="stroke-border" />
          <line x1={pos(1)} y1={pos(1)} x2={pos(15)} y2={pos(15)} className="stroke-highlight" strokeDasharray="3 3" />
          {reference.map((r, i) => <circle key={i} cx={pos(r)} cy={pos(ranking[i])} r="5" className={a.abs[i] === 0 ? "fill-highlight" : a.abs[i] <= 2 ? "fill-primary" : "fill-destructive"}><title>{`${moonCrashItems[i]}: NASA ${r}, ${label} ${ranking[i]}`}</title></circle>)}
          <text x={S / 2} y={S - 4} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="8">NASA-Rang →</text>
          <text x="8" y={S / 2} textAnchor="middle" transform={`rotate(-90 8 ${S / 2})`} className="fill-muted-foreground font-mono" fontSize="8">Dein Rang →</text>
        </svg>
        <p className="text-xs text-muted-foreground mt-2">Punkte auf der Diagonale = exakt wie NASA. Gelb = Treffer, Gold = ±2, Rot = deutliche Abweichung.</p>
      </div>
      <div className="rounded-lg border border-border bg-background/40 p-4">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground mb-2">VERTEILUNG DER ABWEICHUNGEN</p>
        <svg viewBox="0 0 240 140" className="w-full" role="img" aria-label="Histogramm">
          {hist.map((h, k) => <g key={k}><rect x={8 + k * 28} y={118 - (h / histMax) * 100} width="22" height={(h / histMax) * 100} rx="2" className={k === 0 ? "fill-highlight" : k <= 2 ? "fill-primary" : "fill-destructive/70"} /><text x={19 + k * 28} y={114 - (h / histMax) * 100} textAnchor="middle" className="fill-foreground font-mono" fontSize="9">{h || ""}</text><text x={19 + k * 28} y="132" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="9">{k < 7 ? k : "7+"}</text></g>)}
        </svg>
        <p className="text-xs text-muted-foreground">Anzahl Gegenstände je Rangabweichung · Ø {a.mean.toFixed(1)} Ränge pro Gegenstand</p>
        {top.length > 0 && <div className="mt-4"><p className="font-mono text-[10px] tracking-wider text-muted-foreground mb-2">GRÖSSTE ABWEICHUNGEN</p>
          {top.map(t => <div key={t.i} className="flex items-center gap-3 py-2 border-t border-border text-sm"><ItemIcon item={t.i} className="size-5 text-primary shrink-0" /><span className="flex-1 min-w-0 break-words">{moonCrashItems[t.i]}</span><span className="font-mono text-xs text-muted-foreground shrink-0">{t.raw > 0 ? "unterschätzt" : "überschätzt"} · Δ{t.d}</span></div>)}
        </div>}
      </div>
    </div>
  </section>;
}
