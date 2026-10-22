import { ArrowDown, ArrowUp, Check, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moonCrashItems } from "@/data/moonCrashItems";

export function RankingInput({ order, onChange, disabled = false }: { order: number[]; onChange: (order: number[]) => void; disabled?: boolean }) {
  function move(index: number, target: number) {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }
  const remaining = moonCrashItems.map((_, i) => i).filter(i => !order.includes(i));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-mono text-sm text-highlight">{order.length} / 15 priorisiert · Rang 1 ist am wichtigsten</p>
      <div className="flex gap-1"><Button size="icon" variant="ghost" title="Letzte Auswahl zurücknehmen" aria-label="Letzte Auswahl zurücknehmen" disabled={disabled || !order.length} onClick={() => onChange(order.slice(0, -1))}><Undo2 /></Button><Button size="icon" variant="ghost" title="Rangfolge zurücksetzen" aria-label="Rangfolge zurücksetzen" disabled={disabled || !order.length} onClick={() => { if (window.confirm("Rangfolge zurücksetzen?")) onChange([]); }}><RotateCcw /></Button></div>
    </div>
    {remaining.length > 0 && <div><h3 className="text-xl font-semibold mb-4">{order.length ? `Nächster Gegenstand · Rang ${order.length + 1}` : "Wichtigsten Gegenstand auswählen"}</h3><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{remaining.map(item => <Button key={item} variant="secondary" disabled={disabled} onClick={() => onChange([...order, item])} className="justify-start h-auto min-h-14 whitespace-normal text-left px-4 py-3">{moonCrashItems[item]}</Button>)}</div></div>}
    {order.length > 0 && <div className="border-y border-border divide-y divide-border">{order.map((item, i) => <div key={item} className="flex items-center gap-3 py-2"><span className="font-mono text-primary w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span><span className="flex-1 min-w-0 text-sm">{moonCrashItems[item]}</span><select aria-label={`Rang für ${moonCrashItems[item]}`} disabled={disabled} value={i + 1} onChange={e => move(i, Number(e.target.value) - 1)} className="h-10 w-16 rounded-md border border-input bg-card px-2 font-mono shrink-0">{order.map((_, rank) => <option key={rank} value={rank + 1}>{rank + 1}</option>)}</select><div className="flex shrink-0"><Button size="icon" variant="ghost" title="Nach oben" aria-label={`${moonCrashItems[item]} nach oben`} disabled={disabled || i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button><Button size="icon" variant="ghost" title="Nach unten" aria-label={`${moonCrashItems[item]} nach unten`} disabled={disabled || i === order.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button></div></div>)}</div>}
    {order.length === 15 && <p className="flex gap-2 text-highlight text-sm"><Check className="size-4" />Alle Gegenstände eingeordnet</p>}
  </div>;
}