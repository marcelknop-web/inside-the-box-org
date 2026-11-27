import { Button } from '@/components/ui/button';
import { phases, PROJECT, progress, type TrackerState } from '@/data/seaShield';
import type { TrackerText } from '@/data/seaShieldI18n';
import { Status } from './Status';
const ms = 86400000;
const offset = (date: string) => (Date.parse(date) - Date.parse(PROJECT.start)) / ms;
const dayCount = 189;
const position = (start: string, end: string) => ({ left: `${offset(start) / dayCount * 100}%`, width: `${(offset(end) - offset(start) + 1) / dayCount * 100}%` });
export function Gantt({ state, selected, onSelect, language, text, zoom, filter }: { state: TrackerState; selected: number; onSelect: (id: number) => void; language: 'de'|'en'|'fr'; text: TrackerText; zoom: boolean; filter: string }) {
 const months = [{ month: 1, days: 28 }, { month: 2, days: 31 }, { month: 3, days: 30 }, { month: 4, days: 31 }, { month: 5, days: 30 }, { month: 6, days: 31 }, { month: 7, days: 8 }];
 return <div className="overflow-x-auto rounded-md border border-border" tabIndex={0} aria-label={text.schedule}>
  <div className={zoom ? 'min-w-[1400px]' : 'min-w-[880px]'}>
   <div className="flex border-b border-border bg-secondary/60">
    <div className="sticky left-0 z-20 flex w-[210px] shrink-0 items-center border-r border-border bg-card px-4 font-mono text-xs text-muted-foreground">2027 / {text.weeks.toUpperCase()}</div>
    <div className="min-w-0 flex-1">
     <div className="flex border-b border-border">{months.map(m => <div key={m.month} className="min-w-0 border-r border-border px-2 py-3 font-mono text-xs" style={{ width: `${m.days / dayCount * 100}%` }}>{new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2027,m.month,1)))}</div>)}</div>
     <div className="grid grid-cols-[repeat(27,minmax(0,1fr))]">{Array.from({length:27},(_,i) => <div key={i} className="border-r border-border/60 py-2 text-center font-mono text-[10px] text-muted-foreground" title={new Intl.DateTimeFormat(language,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(Date.parse(PROJECT.start)+i*7*ms))}>{String(i+1).padStart(2,'0')}</div>)}</div>
    </div>
   </div>
   {phases.filter(p => filter === 'all' || state[p.id].status === filter).map(p => {
    const s = state[p.id], value = progress(p,s), changed = p.start !== s.start || p.end !== s.end;
    return <div key={p.id} className={`phase-row flex border-b border-border/60 last:border-b-0 ${selected === p.id ? 'bg-secondary/50' : ''}`}>
     <Button variant="ghost" onClick={() => onSelect(p.id)} aria-pressed={selected === p.id} aria-label={`${text.select}: ${p.id} ${p.title[language]}`} className="sticky left-0 z-10 h-[62px] w-[210px] shrink-0 justify-start gap-3 rounded-none border-r border-border bg-card px-4 hover:bg-secondary hover:text-foreground">
      <span className="font-mono text-lg text-muted-foreground">{String(p.id).padStart(2,'0')}</span><span className="min-w-0 text-left"><span className="block truncate text-xs font-medium">{p.title[language]}</span><Status status={s.status} text={text} /></span>
     </Button>
     <div className="gantt-grid relative min-w-0 flex-1">
      <div className="baseline-bar absolute bottom-2" style={position(p.start,p.end)} title={text.baseline} />
      <Button variant="ghost" data-group={p.group} data-status={s.status} aria-pressed={selected === p.id} onClick={() => onSelect(p.id)} aria-label={`${text.phase} ${p.id}: ${p.title[language]}`} title={`${p.title[language]} · ${s.start} → ${s.end}${changed ? ` · ${text.changed}` : ''}`} className="phase-bar absolute top-3 h-8 justify-between overflow-hidden rounded-sm px-2 font-mono text-[10px] hover:text-foreground" style={position(s.start,s.end)}>
       <span>{p.days} {text.daysShort}</span><span>{value}%</span>
      </Button>
     </div>
    </div>;
   })}
  </div>
 </div>;
}
