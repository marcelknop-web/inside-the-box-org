import { classify } from '@/data/riskLife';
import { cn } from '@/lib/utils';
export const classStyles = ['bg-success/20 text-success','bg-highlight/20 text-highlight','bg-warning/20 text-warning','bg-destructive/20 text-destructive'];
export function RiskMatrix({s,w}: {s:number;w:number}) {
 return <figure className="space-y-2"><figcaption className="font-mono text-sm">Schaden × Wahrscheinlichkeit</figcaption><div className="grid grid-cols-[20px_repeat(5,minmax(0,1fr))] gap-1" role="img" aria-label={`Risikomatrix: Schaden ${s}, Wahrscheinlichkeit ${w}`}>
 {[5,4,3,2,1].map(y=><div key={y} className="contents"><span className="text-xs self-center font-mono">{y}</span>{[1,2,3,4,5].map(x=><div key={x} className={cn('aspect-square max-h-12 flex items-center justify-center text-xs font-mono rounded-sm',classStyles[classify(x,y).level], x===s&&y===w&&'ring-2 ring-foreground font-bold')}>{x*y}{x===s&&y===w?' ●':''}</div>)}</div>)}
 <span/>{[1,2,3,4,5].map(x=><span key={x} className="text-center text-xs font-mono">{x}</span>)}</div><p className="text-xs text-muted-foreground">↑ Wahrscheinlichkeit · Schaden →</p></figure>;
}