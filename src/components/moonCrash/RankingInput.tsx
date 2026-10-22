import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Check, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moonCrashItems } from "@/data/moonCrashItems";
import { MissionBriefing } from "./MissionBriefing";

export function RankingInput({ order, onChange, disabled = false }: { order: number[]; onChange: (order: number[]) => void; disabled?: boolean }) {
  const [started, setStarted] = useState(order.length > 0);
  function move(index: number, target: number) {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }
  const remaining = moonCrashItems.map((_, i) => i).filter(i => !order.includes(i));
  if (!started && order.length === 0) return <div className="space-y-6"><MissionBriefing /><Button size="lg" disabled={disabled} onClick={() => setStarted(true)}>Überlebensentscheidungen starten<ArrowRight /></Button></div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-sm text-highlight">{order.length} / 15 Entscheidungen getroffen</p>
      <div className="flex gap-1"><Button size="icon" variant="ghost" title="Letzte Auswahl zurücknehmen" aria-label="Letzte Auswahl zurücknehmen" disabled={disabled || !order.length} onClick={() => onChange(order.slice(0, -1))}><Undo2 /></Button><Button size="icon" variant="ghost" title="Rangfolge zurücksetzen" aria-label="Rangfolge zurücksetzen" disabled={disabled || !order.length} onClick={() => { if (window.confirm("Rangfolge zurücksetzen?")) onChange([]); }}><RotateCcw /></Button></div>
    </div>
    {remaining.length > 0 && <div>
      <p className="text-xs font-mono text-primary mb-2">ENTSCHEIDUNG {String(order.length + 1).padStart(2, "0")} / 15</p>
      <h3 className="text-2xl font-semibold mb-3">{order.length === 0 ? "Was sichert das Überleben am meisten?" : remaining.length === 1 ? "Welcher Gegenstand bleibt zuletzt?" : "Was ist jetzt am wichtigsten?"}</h3>
      <p className="text-sm text-muted-foreground mb-5">{order.length === 0 ? "320 Kilometer auf der Mondoberfläche: Welcher Gegenstand hat oberste Priorität?" : "Unter der verbleibenden Ausrüstung zählt der nächste Beitrag zum Überleben auf dem Weg zum Mutterschiff."}</p>
      {order.length > 0 && <p className="mb-5 text-sm border-l-2 border-border pl-3 text-muted-foreground">Zuletzt gewählt: <span className="text-foreground">{moonCrashItems[order[order.length - 1]]}</span></p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{remaining.map(item => <Button key={item} variant="secondary" disabled={disabled} onClick={() => onChange([...order, item])} className="justify-between gap-3 h-auto min-h-20 whitespace-normal text-left px-4 py-4 border border-border"><span className="min-w-0 break-words">{moonCrashItems[item]}</span><ArrowRight className="size-4 shrink-0 text-highlight" /></Button>)}</div>
    </div>}
    {order.length === 15 && <div className="space-y-2"><h3 className="text-2xl font-semibold flex items-center gap-3"><Check className="size-6 shrink-0 text-highlight" />Ausrüstung vollständig geordnet</h3><p className="text-sm text-muted-foreground">Die persönliche Überlebensentscheidung steht. Die NASA-Auswertung folgt nach Freigabe durch die Übungsleitung.</p></div>}
    {order.length > 0 && <details key={order.length === 15 ? "complete" : "progress"} open={order.length === 15 ? true : undefined} className="border-y border-border py-4"><summary className="cursor-pointer text-sm font-semibold">{order.length === 15 ? "Rangfolge prüfen" : "Bisherige Auswahl"} · {order.length} Gegenstände</summary><div className="divide-y divide-border mt-3">{order.map((item, i) => <div key={item} className="flex items-center gap-3 py-2"><span className="font-mono text-primary w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 min-w-0 text-sm break-words">{moonCrashItems[item]}</span><div className="flex shrink-0"><Button size="icon" variant="ghost" title="Nach oben" aria-label={`${moonCrashItems[item]} nach oben`} disabled={disabled || i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button><Button size="icon" variant="ghost" title="Nach unten" aria-label={`${moonCrashItems[item]} nach unten`} disabled={disabled || i === order.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button></div></div>)}</div></details>}
  </div>;
}