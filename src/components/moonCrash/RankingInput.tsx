import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Check, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moonCrashItems } from "@/data/moonCrashItems";
import { MissionBriefing } from "./MissionBriefing";
import { ItemIcon } from "./ItemIcon";

export function RankingInput({ order, onChange, disabled = false }: { order: number[]; onChange: (order: number[]) => void; disabled?: boolean }) {
  const [started, setStarted] = useState(order.length > 0);
  function move(index: number, target: number) {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }
  const remaining = moonCrashItems.map((_, i) => i).filter(i => !order.includes(i));
  if (!started && order.length === 0) return <div className="space-y-6"><MissionBriefing /><Button size="lg" disabled={disabled} onClick={() => setStarted(true)}>Los geht’s<ArrowRight /></Button></div>;
  const done = order.length === 15;
  return <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${(order.length / 15) * 100}%` }} /></div>
      <span className="font-mono text-sm text-highlight">{order.length}/15</span>
      <Button size="icon" variant="ghost" title="Zurück" aria-label="Letzte Auswahl zurücknehmen" disabled={disabled || !order.length} onClick={() => onChange(order.slice(0, -1))}><Undo2 /></Button>
      <Button size="icon" variant="ghost" title="Neu beginnen" aria-label="Rangfolge zurücksetzen" disabled={disabled || !order.length} onClick={() => { if (window.confirm("Neu beginnen?")) onChange([]); }}><RotateCcw /></Button>
    </div>
    {!done && <div>
      <h3 className="text-2xl font-semibold mb-5">{order.length === 0 ? "Was ist am wichtigsten?" : `Platz ${order.length + 1}: Was kommt als Nächstes?`}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{remaining.map(item => <Button key={item} variant="secondary" disabled={disabled} onClick={() => onChange([...order, item])} className="h-auto min-h-28 flex-col gap-2 whitespace-normal text-center p-3 border border-border hover:border-primary"><ItemIcon item={item} className="size-8 text-primary" /><span className="text-sm break-words">{moonCrashItems[item]}</span></Button>)}</div>
    </div>}
    {done && <div className="space-y-4"><h3 className="text-2xl font-semibold flex items-center gap-3"><Check className="size-6 text-highlight" />Fertig – Reihenfolge prüfen</h3>
      <div className="divide-y divide-border">{order.map((item, i) => <div key={item} className="flex items-center gap-3 py-2"><span className="font-mono text-primary w-7 shrink-0">{i + 1}</span><ItemIcon item={item} className="size-5 text-highlight shrink-0" /><span className="flex-1 min-w-0 text-sm break-words">{moonCrashItems[item]}</span><Button size="icon" variant="ghost" aria-label={`${moonCrashItems[item]} nach oben`} disabled={disabled || i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button><Button size="icon" variant="ghost" aria-label={`${moonCrashItems[item]} nach unten`} disabled={disabled || i === 14} onClick={() => move(i, i + 1)}><ArrowDown /></Button></div>)}</div></div>}
  </div>;
}
