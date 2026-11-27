import { useEffect, useState } from 'react';
import { CheckCheck, FileText, LockKeyhole, CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { canSignOff, progress, PROJECT, validPeriod, type Phase, type PhaseState, type PhaseStatus } from '@/data/seaShield';
import type { TrackerText } from '@/data/seaShieldI18n';
import { Status } from './Status';
export function PhaseDetail({ phase, state, update, language, text }: { phase: Phase; state: PhaseState; update: (patch: Partial<PhaseState>) => void; language: 'de'|'en'|'fr'; text: TrackerText }) {
 const [dates, setDates] = useState({start:state.start,end:state.end});
 const [error, setError] = useState(false);
 useEffect(() => { setDates({start:state.start,end:state.end}); setError(false); }, [state.start,state.end]);
 const value = progress(phase,state);
 function editDate(key: 'start'|'end', value: string) {
  const next = {...dates,[key]:value}; setDates(next);
  const valid = validPeriod(next.start,next.end); setError(!valid); if (valid) update(next);
 }
 const toggleResult = (index: number, checked: boolean) => update({completed: checked ? [...state.completed,index] : state.completed.filter(i => i !== index)});
 const toggleApproval = (name: string, checked: boolean) => update({approvals: checked ? [...state.approvals,name] : state.approvals.filter(a => a !== name)});
 return <section id="phase-detail" aria-label={text.details} className="min-w-0 border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
  <div className="mb-5 flex items-center justify-between"><span className="font-mono text-xs uppercase text-highlight">{text.phase} {String(phase.id).padStart(2,'0')} / 09</span><Status status={state.status} text={text} /></div>
  <h2 className="mb-4 font-mono text-xl font-medium leading-snug">{phase.title[language]}</h2>
  <div className="flex items-center justify-between font-mono text-xs text-muted-foreground"><span>{state.completed.length} / {phase.deliverables.length} {text.complete}</span><span className="text-highlight">{value}%</span></div>
  <div className="mt-2 h-1.5 overflow-hidden rounded-sm bg-secondary"><div className="progress-fill h-full transition-[width] motion-reduce:transition-none" style={{width:`${value}%`}} /></div>
  <div className="my-5 grid grid-cols-2 gap-4 border-y border-border py-4"><div><p className="text-xs text-muted-foreground">{text.effort}</p><p className="mt-1 font-mono text-lg">{phase.days} {text.daysShort}</p></div><div><p className="text-xs text-muted-foreground">{text.budget}</p><p className="mt-1 font-mono text-lg">{new Intl.NumberFormat(language,{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(phase.price)}</p></div></div>
  <div className="mb-5 space-y-3">
   <div className="grid grid-cols-2 gap-3">{(['start','end'] as const).map(key => <div key={key}><label htmlFor={`phase-${key}`} className="mb-1.5 block text-xs text-muted-foreground">{text[key]}</label><Input id={`phase-${key}`} type="date" min={PROJECT.start} max={PROJECT.end} value={dates[key]} onChange={e => editDate(key,e.target.value)} aria-invalid={error} className="min-w-0 px-2 font-mono text-xs" /></div>)}</div>
   {error && <p role="alert" className="text-xs text-destructive">{text.datesError}</p>}
   {(state.start !== phase.start || state.end !== phase.end) && <p className="flex items-center gap-2 text-xs text-primary"><CalendarDays className="h-3 w-3" />{text.changed}</p>}
   <label className="block text-xs text-muted-foreground" htmlFor="phase-status">{text.status}</label>
   <Select value={state.status} onValueChange={value => update({status:value as PhaseStatus})}><SelectTrigger id="phase-status"><SelectValue /></SelectTrigger><SelectContent>{(['planned','active','review','blocked','signed'] as const).map(status => <SelectItem key={status} value={status} disabled={status === 'signed' && !canSignOff(phase,state)}>{text[status]}</SelectItem>)}</SelectContent></Select>
  </div>
  <h3 className="flex items-center gap-2 font-mono text-sm"><FileText className="h-4 w-4 text-highlight" />{text.results}</h3>
  <p className="mt-1 text-[11px] text-muted-foreground">{text.sourceResults}</p>
  <div className="mt-3 divide-y divide-border">{phase.deliverables.map((d,i) => <label key={d.name} className="flex cursor-pointer items-start gap-3 py-3"><Checkbox className="mt-0.5" checked={state.completed.includes(i)} onCheckedChange={checked => toggleResult(i,checked === true)} aria-label={d.name} /><span className="min-w-0"><span className={`block text-sm leading-snug ${state.completed.includes(i) ? 'text-muted-foreground' : ''}`}>{d.name}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">A{phase.id}.{i+1} · {d.format}</span></span></label>)}</div>
  <div className="mt-5 border-t border-border pt-5"><h3 className="flex items-center gap-2 font-mono text-sm"><CheckCheck className="h-4 w-4 text-primary" />{text.signoff}</h3><p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><LockKeyhole className="mt-0.5 h-3 w-3 shrink-0" />{text.signoffHint}</p><div className="mt-3 space-y-3">{phase.approvers.map(a => <label key={a} className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed"><Checkbox className="mt-0.5" checked={state.approvals.includes(a)} onCheckedChange={checked => toggleApproval(a,checked === true)} aria-label={a} /><span>{a}</span></label>)}</div></div>
  <div className="mt-6"><label htmlFor="phase-notes" className="mb-2 block font-mono text-sm">{text.note}</label><Textarea id="phase-notes" value={state.note} maxLength={5000} onChange={e => update({note:e.target.value})} placeholder={text.notePlaceholder} className="min-h-[110px]" /></div>
 </section>;
}
