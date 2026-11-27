import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Anchor, ArrowLeft, ArrowUpRight, CalendarDays, CheckCheck, Download, FileCheck2, GanttChart, LayoutGrid, MapPin, RotateCcw, Ship, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { phases, PROJECT, STORAGE_KEY, canSignOff, initialState, progress, readState, workshops, type PhaseState } from '@/data/seaShield';
import { trackerText } from '@/data/seaShieldI18n';
import { Gantt } from '@/components/seaShield/Gantt';
import { PhaseDetail } from '@/components/seaShield/PhaseDetail';
import { Status } from '@/components/seaShield/Status';
import '@/styles/sea-shield.css';

export default function SeaShieldTracker() {
 const { language, setLanguage } = useLanguage();
 const text = trackerText[language];
 const [state, setState] = useState(() => { try { return readState(localStorage.getItem(STORAGE_KEY)); } catch { return initialState(); } });
 const [storageError, setStorageError] = useState(false);
 const [selected, setSelected] = useState(1);
 const [filter, setFilter] = useState('all');
 const [zoom, setZoom] = useState(false);
 const [resetting, setResetting] = useState(false);
 useEffect(() => { try { localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,phases:state})); setStorageError(false); } catch { setStorageError(true); } },[state]);
 const phase = phases.find(p => p.id === selected) ?? phases[0];
 const signed = phases.filter(p => state[p.id].status === 'signed');
 const totalResults = phases.reduce((n,p) => n+p.deliverables.length,0);
 const completed = phases.reduce((n,p) => n+state[p.id].completed.length,0);
 const percentage = Math.round(completed/totalResults*100);
 const money = (value: number) => new Intl.NumberFormat(language,{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
 const date = (value: string) => new Intl.DateTimeFormat(language,{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(value));
 function update(patch: Partial<PhaseState>) {
  setState(current => {
   const next = {...current[phase.id],...patch};
   if (next.status === 'signed' && !canSignOff(phase,next)) next.status = 'review';
   return {...current,[phase.id]:next};
  });
 }
 function download() {
  const blob = new Blob([JSON.stringify({version:1,project:PROJECT,baseline:phases,phases:state},null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href=url; a.download='Sea-Shield-Demo.json'; a.click(); URL.revokeObjectURL(url);
 }
 const visible = phases.filter(p => filter === 'all' || state[p.id].status === filter);
 return <main className="sea-shield min-h-dvh text-foreground">
  <Helmet><title>Sea-Shield | Projekt-Cockpit</title><meta name="description" content="Sea-Shield Projekttracker: neun Phasen, interaktiver Gantt-Plan und Lieferergebnisse als lokale Single-User-Demo." /><meta name="robots" content="noindex, nofollow" /></Helmet>
  <header className="border-b border-border">
   <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
    <div className="flex items-center gap-3"><Button asChild variant="ghost" size="icon" title={text.overview} aria-label={text.overview} className="text-muted-foreground"><Link to="/"><ArrowLeft /></Link></Button><span className="flex h-9 w-9 items-center justify-center rounded-md border border-highlight/40 text-highlight"><Anchor className="h-5 w-5" /></span><span className="font-mono text-xs uppercase text-muted-foreground">DRYNET <span className="mx-1 text-border">/</span> {text.cockpit}</span></div>
    <div className="flex items-center gap-2"><span className="mr-2 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><ShieldCheck className="h-3.5 w-3.5 text-success" />{storageError ? text.unsaved : text.local}</span>{(['de','en','fr'] as const).map(lang => <Button key={lang} variant="ghost" size="sm" aria-pressed={language===lang} onClick={() => setLanguage(lang)} className={`h-8 px-2 font-mono text-xs ${language===lang ? 'bg-highlight/10 text-highlight' : 'text-muted-foreground'}`}>{lang.toUpperCase()}</Button>)}<span className="mx-1 h-5 border-l border-border" /><Button variant="ghost" size="icon" title={text.backup} aria-label={text.backup} onClick={download}><Download /></Button><Button variant="ghost" size="icon" title={text.reset} aria-label={text.reset} onClick={() => setResetting(true)}><RotateCcw /></Button></div>
   </div>
  </header>
  <div className="mx-auto max-w-[1600px] px-4 pb-10 pt-6 sm:px-8 sm:pt-8">
   {storageError && <p role="alert" className="mb-4 border-l-2 border-destructive pl-3 text-sm text-destructive">{text.storageError}</p>}
   {resetting && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-primary/40 bg-primary/10 p-3"><span className="text-sm">{text.resetAsk}</span><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setResetting(false)}>{text.cancel}</Button><Button size="sm" onClick={() => {setState(initialState());setResetting(false);}}>{text.confirmReset}</Button></div></div>}
   <section className="mb-6 flex flex-wrap items-end justify-between gap-5 sm:mb-8">
    <div><p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase text-highlight"><Ship className="h-4 w-4" />{text.demo}</p><h1 className="font-mono text-3xl font-medium leading-tight text-primary sm:text-4xl">Sea-Shield</h1><p className="mt-2 text-sm text-muted-foreground">Hapag-Lloyd AG <span className="px-1 text-border">/</span> 24,000 TEU vessel category</p></div>
    <div className="text-left sm:text-right"><p className="flex items-center gap-2 font-mono text-xs"><CalendarDays className="h-4 w-4 text-muted-foreground" />{text.period}</p><p className="mt-2 font-mono text-[11px] text-muted-foreground">27 {text.weeks} · 9 {text.phases}</p></div>
   </section>
   <section aria-label={text.overview} className="mb-7 grid grid-cols-2 gap-y-5 border-y border-border py-5 lg:grid-cols-4">
    {[{icon:CheckCheck,value:`${signed.length} / 9`,label:text.approved,sub:`${Math.round(signed.length/9*100)}%`}, {icon:FileCheck2,value:`${completed} / ${totalResults}`,label:text.results,sub:`${percentage}% ${text.complete}`}, {icon:CalendarDays,value:'288',label:text.effort,sub:`27 ${text.weeks}`}, {icon:ShieldCheck,value:money(408440),label:text.budget,sub:`${money(signed.reduce((n,p) => n+p.price,0))} · ${text.invoice}`}].map((stat,i) => <div key={stat.label} className={`min-w-0 px-3 sm:px-5 ${i%2===1 ? 'border-l border-border' : ''} ${i===2 ? 'lg:border-l' : ''}`}><p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><stat.icon className="h-4 w-4 shrink-0" />{stat.label}</p><p className={`font-mono ${i===3 ? 'text-xl sm:text-2xl' : 'text-2xl'} ${i===0 ? 'text-primary' : ''}`}>{stat.value}</p><p className="mt-1 break-words font-mono text-[10px] text-muted-foreground">{stat.sub}</p></div>)}
   </section>
   <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
    <div className="min-w-0">
     <Tabs defaultValue="gantt">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><TabsList className="bg-secondary"><TabsTrigger value="gantt" className="gap-2"><GanttChart className="h-4 w-4" />{text.gantt}</TabsTrigger><TabsTrigger value="phases" className="gap-2"><LayoutGrid className="h-4 w-4" />{text.phaseView}</TabsTrigger></TabsList><div className="flex items-center gap-2"><Select value={filter} onValueChange={setFilter}><SelectTrigger className="h-9 w-[165px] text-xs" aria-label={text.status}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{text.all}</SelectItem>{(['planned','active','review','blocked','signed'] as const).map(status => <SelectItem key={status} value={status}>{text[status]}</SelectItem>)}</SelectContent></Select><Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setZoom(v => !v)} title={zoom?text.unzoom:text.zoom} aria-label={zoom?text.unzoom:text.zoom}>{zoom?<ZoomOut />:<ZoomIn />}</Button></div></div>
      <TabsContent value="gantt">
       <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-mono text-sm">{text.schedule}</h2><div className="flex flex-wrap gap-3">{text.group.map((g,i) => <span key={g} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className={`h-1.5 w-1.5 ${['bg-highlight','bg-primary','bg-success'][i]}`} />{g}</span>)}</div></div>
       {visible.length ? <Gantt state={state} selected={selected} onSelect={setSelected} language={language} text={text} zoom={zoom} filter={filter} /> : <p className="py-10 text-center text-sm text-muted-foreground">{text.noPhases}</p>}
       <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="flex items-center gap-2"><span className="h-[3px] w-6 bg-muted-foreground/50" />{text.baseline}</span><a href="#phase-detail" className="flex items-center gap-1 text-highlight xl:hidden">{text.details}<ArrowUpRight className="h-3 w-3" /></a></div>
      </TabsContent>
      <TabsContent value="phases">
       <div className="grid gap-3 sm:grid-cols-2">{visible.map(p => <Button key={p.id} variant="ghost" aria-pressed={selected===p.id} onClick={() => setSelected(p.id)} className={`h-auto min-h-[145px] flex-col items-stretch justify-start gap-3 whitespace-normal rounded-md border p-4 text-left hover:bg-secondary hover:text-foreground ${selected===p.id?'border-highlight bg-highlight/5':'border-border bg-card'}`}><div className="flex justify-between gap-2"><span className="font-mono text-xs text-highlight">{text.phase} {String(p.id).padStart(2,'0')}</span><Status status={state[p.id].status} text={text} /></div><span className="font-mono text-sm">{p.title[language]}</span><span className="font-mono text-[10px] text-muted-foreground">{date(state[p.id].start)} → {date(state[p.id].end)} · {p.days} {text.daysShort}</span><span className="h-1 w-full bg-secondary"><span className="block h-full bg-highlight" style={{width:`${progress(p,state[p.id])}%`}} /></span><span className="font-mono text-[10px] text-muted-foreground">{state[p.id].completed.length} / {p.deliverables.length} {text.results}</span></Button>)}</div>{!visible.length && <p className="py-10 text-center text-sm text-muted-foreground">{text.noPhases}</p>}
      </TabsContent>
     </Tabs>
     <section className="mt-8 border-t border-border pt-6"><div className="mb-4"><h2 className="flex items-center gap-2 font-mono text-sm"><MapPin className="h-4 w-4 text-primary" />{text.appointments}</h2><p className="mt-1 text-xs text-muted-foreground">{text.windows}</p></div><div className="divide-y divide-border">{workshops.map(w => <Button key={w.name} variant="ghost" onClick={() => setSelected(w.phase)} className="h-auto w-full justify-start gap-4 whitespace-normal rounded-none px-1 py-3 text-left hover:bg-secondary hover:text-foreground"><span className="w-20 shrink-0 font-mono text-[11px] text-highlight">{w.period}</span><span className="min-w-0 flex-1"><span className="block text-xs">{w.name}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{w.location}</span></span><span className="shrink-0 font-mono text-[10px] text-muted-foreground">S{w.phase}</span><ArrowUpRight className="text-muted-foreground" /></Button>)}</div></section>
    </div>
    <PhaseDetail key={phase.id} phase={phase} state={state[phase.id]} update={update} language={language} text={text} />
   </div>
   <footer className="mt-10 space-y-2 border-t border-border pt-5 text-[11px] leading-relaxed text-muted-foreground"><p>{text.source}</p><p>{text.privacy}</p><p>{text.baselineNote}</p></footer>
  </div>
 </main>;
}
