import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, CheckCheck, Download, FileCheck2, Flag, RotateCcw, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { phases, PROJECT, STORAGE_KEY, canSignOff, initialState, progress, readState, workshops, type PhaseState } from '@/data/seaShield';
import { trackerText } from '@/data/seaShieldI18n';
import { workspaceText, workspaceViews, phaseTabs, type WorkspaceView, type PhaseTab } from '@/data/seaShieldNavigation';
import { Navigation } from '@/components/seaShield/Navigation';
import { Gantt } from '@/components/seaShield/Gantt';
import { PhaseDetail } from '@/components/seaShield/PhaseDetail';
import { Status } from '@/components/seaShield/Status';
import '@/styles/sea-shield.css';

export default function SeaShieldTracker() {
 const {language,setLanguage}=useLanguage(), text=trackerText[language], t=workspaceText[language];
 const [params,setParams]=useSearchParams();
 const rawView=params.get('view');
 const view:WorkspaceView=workspaceViews.find(v=>v===rawView)??'dashboard';
 const selected=Number(params.get('phase'));
 const phase=phases.find(p=>p.id===selected);
 const tab:PhaseTab=phaseTabs.find(v=>v===params.get('tab'))??'overview';
 const [state,setState]=useState(()=>{try{return readState(localStorage.getItem(STORAGE_KEY));}catch{return initialState();}});
 const [storageError,setStorageError]=useState(false), [resetting,setResetting]=useState(false), [filter,setFilter]=useState('all'), [zoom,setZoom]=useState(false);
 useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,phases:state}));setStorageError(false);}catch{setStorageError(true);}},[state]);
 function update(id:number,patch:Partial<PhaseState>){setState(current=>{const p=phases.find(p=>p.id===id);if(!p)return current;const next={...current[id],...patch};if(next.status==='signed'&&!canSignOff(p,next))next.status='review';return {...current,[id]:next};});}
 function openPhase(id:number,tab:PhaseTab='overview'){setParams({view:'phases',phase:String(id),tab});}
 function download(){const blob=new Blob([JSON.stringify({version:1,project:PROJECT,baseline:phases,phases:state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Sea-Shield-Project.json';a.click();URL.revokeObjectURL(url);}
 const total=phases.reduce((n,p)=>n+p.deliverables.length,0),done=phases.reduce((n,p)=>n+state[p.id].completed.length,0),signed=phases.filter(p=>state[p.id].status==='signed').length;
 const attention=phases.filter(p=>['blocked','review'].includes(state[p.id].status));
 const visible=phases.filter(p=>filter==='all'||state[p.id].status===filter);
 const date=(s:string)=>new Intl.DateTimeFormat(language,{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(s));
 const title=view==='dashboard'?t.dashboard:view==='gantt'?t.gantt:view==='phases'?t.phases:view==='deliverables'?t.deliverables:view==='approvals'?t.approvals:view==='workshops'?t.workshops:t.settings;
 const tableClass='w-full border-collapse text-left text-xs';
 return <main className="sea-shield">
  <Helmet><title>Sea-Shield | {t.title}</title><meta name="description" content="Sea-Shield Projektmanagement: Cockpit, Zeitplan, Phasen und Lieferergebnisse." /><meta name="robots" content="noindex, nofollow" /></Helmet>
  <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 sm:px-5">
   <div className="flex min-w-0 items-center gap-3"><span className="text-lg font-bold text-primary">DRYNET<span className="text-highlight">.</span></span><span className="hidden border-l border-border pl-3 text-xs text-muted-foreground sm:block">Hapag-Lloyd AG / Sea-Shield</span></div>
   <div className="flex shrink-0 items-center gap-1"><span className="mr-3 hidden items-center gap-1 text-[11px] text-muted-foreground lg:flex"><ShieldCheck className="h-3 w-3" />{storageError?text.unsaved:text.local}</span>{(['de','en','fr'] as const).map(lang=><Button key={lang} size="sm" variant="ghost" onClick={()=>setLanguage(lang)} aria-pressed={language===lang} className={`h-7 px-2 text-[11px] ${language===lang?'bg-primary/10 text-primary':'text-muted-foreground'}`}>{lang.toUpperCase()}</Button>)}<Button asChild size="icon" variant="ghost" title={t.home} aria-label={t.home} className="h-8 w-8"><Link to="/"><ArrowLeft /></Link></Button></div>
  </header>
  <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
   <Navigation language={language} view={view} />
   <div className="flex min-h-0 min-w-0 flex-1 flex-col">
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
     <div className="min-w-0"><p className="mb-1 text-[10px] font-bold uppercase text-highlight">Sea-Shield / {t.title}</p><h1 className="truncate text-xl font-bold text-primary">{phase&&view==='phases'?`${text.phase} ${String(phase.id).padStart(2,'0')} · ${phase.title[language]}`:title}</h1></div><span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{text.period} <span className="ml-2 text-highlight">DEMO</span></span>
    </div>
    {storageError&&<p role="alert" className="px-4 py-2 text-xs text-destructive">{text.storageError}</p>}
    <div className={`min-h-0 flex-1 px-4 py-3 sm:px-6 ${view==='dashboard'?'flex flex-col overflow-hidden':'overflow-y-auto'}`}>
     {view==='dashboard'&&<>
      <section aria-label={text.overview} className="mb-3 grid shrink-0 grid-cols-4 divide-x divide-border border-b border-border pb-3">
       {[{value:`${Math.round(done/total*100)}%`,label:t.progress,target:'deliverables',icon:FileCheck2},{value:`${done} / ${total}`,label:text.results,target:'deliverables',icon:FileCheck2},{value:`${signed} / 9`,label:text.approved,target:'approvals',icon:CheckCheck},{value:String(attention.length),label:t.attention,target:'phases',icon:Flag}].map(s=><Button key={s.label} asChild variant="ghost" className="h-auto flex-col items-start gap-1 whitespace-normal rounded-none px-2 py-1 sm:px-4"><Link to={`/sea-shield?view=${s.target}`}><span className="text-[10px] text-muted-foreground sm:text-xs">{s.label}</span><span className="text-lg font-bold text-primary sm:text-2xl">{s.value}</span></Link></Button>)}
      </section>
      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
       <section className="flex min-h-0 min-w-0 flex-col"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-primary">{text.schedule}</h2><Button asChild variant="link" size="sm" className="h-6 px-0 text-xs"><Link to="/sea-shield?view=gantt">{t.gantt}<ArrowRight /></Link></Button></div><div className="min-h-0 overflow-auto"><Gantt state={state} selected={0} onSelect={openPhase} language={language} text={text} zoom={false} filter="all" compact /></div><div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>{t.baseline} · 27 {text.weeks} · 288 {text.daysShort}</span><span>{text.group.join(' → ')}</span></div></section>
       <aside className="hidden min-h-0 overflow-auto border-l border-border pl-5 xl:block"><h2 className="mb-3 text-sm font-bold text-primary">{t.attention}</h2>{attention.length?attention.map(p=><Button key={p.id} variant="ghost" onClick={()=>openPhase(p.id)} className="mb-2 h-auto w-full flex-col items-start gap-1 whitespace-normal border-b border-border px-0 py-2 text-left"><span className="text-xs">{p.title[language]}</span><Status status={state[p.id].status} text={text} /></Button>):<p className="text-xs leading-relaxed text-muted-foreground">{t.noAttention}</p>}<h2 className="mb-2 mt-6 text-sm font-bold text-primary">{t.next}</h2>{workshops.slice(0,3).map(w=><Button key={w.name} variant="ghost" onClick={()=>openPhase(w.phase)} className="h-auto w-full flex-col items-start gap-1 border-b border-border px-0 py-2 text-left"><span className="text-[10px] text-highlight">{w.period}</span><span className="text-xs">{w.name}</span></Button>)}<Button asChild variant="link" className="px-0 text-xs"><Link to="/sea-shield?view=workshops">{t.all}<ArrowRight /></Link></Button></aside>
      </div>
     </>}
     {view==='gantt'&&<><div className="mb-3 flex items-center justify-between"><Select value={filter} onValueChange={setFilter}><SelectTrigger className="h-8 w-[170px] text-xs" aria-label={text.status}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{text.all}</SelectItem>{(['planned','active','review','blocked','signed'] as const).map(s=><SelectItem key={s} value={s}>{text[s]}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="ghost" onClick={()=>setZoom(v=>!v)} title={zoom?text.unzoom:text.zoom} aria-label={zoom?text.unzoom:text.zoom}>{zoom?<ZoomOut />:<ZoomIn />}</Button></div><Gantt state={state} selected={0} onSelect={openPhase} language={language} text={text} zoom={zoom} filter={filter} /></>}
     {view==='phases'&&phase&&<><div className="mb-4 flex flex-wrap items-center gap-1 border-b border-border pb-2"><Button asChild variant="ghost" size="sm" className="mr-2 text-xs"><Link to="/sea-shield?view=phases"><ArrowLeft />{text.phases}</Link></Button>{phaseTabs.map(v=><Button key={v} asChild variant="ghost" size="sm" className={`text-xs ${tab===v?'bg-primary/10 text-primary':''}`}><Link to={`/sea-shield?view=phases&phase=${phase.id}&tab=${v}`} aria-current={tab===v?'page':undefined}>{v==='overview'?t.overview:v==='deliverables'?t.deliverables:v==='approvals'?t.approvals:t.notes}</Link></Button>)}</div><PhaseDetail key={phase.id} phase={phase} state={state[phase.id]} update={patch=>update(phase.id,patch)} language={language} text={text} tab={tab} /></>}
     {view==='phases'&&!phase&&<div className="overflow-x-auto"><table className={tableClass}><thead className="bg-primary text-primary-foreground"><tr>{[t.phase,t.period,t.state,t.progress].map(h=><th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{visible.map(p=><tr key={p.id} className="border-b border-border hover:bg-secondary"><td className="p-2"><Button asChild variant="link" className="h-auto justify-start whitespace-normal px-0 text-left text-xs"><Link to={`/sea-shield?view=phases&phase=${p.id}&tab=overview`}><span className="mr-2 text-highlight">{String(p.id).padStart(2,'0')}</span>{p.title[language]}</Link></Button></td><td className="whitespace-nowrap p-3">{date(state[p.id].start)} – {date(state[p.id].end)}</td><td className="p-3"><Status status={state[p.id].status} text={text} /></td><td className="p-3">{progress(p,state[p.id])}%</td></tr>)}</tbody></table></div>}
     {view==='deliverables'&&<div className="overflow-x-auto"><table className={tableClass}><thead className="bg-primary text-primary-foreground"><tr><th className="w-10 p-3" /><th className="p-3">{t.deliverables}</th><th className="p-3">{t.phase}</th></tr></thead><tbody>{phases.flatMap(p=>p.deliverables.map((d,i)=><tr key={`${p.id}-${i}`} className="border-b border-border"><td className="p-3"><Checkbox checked={state[p.id].completed.includes(i)} aria-label={d.name} onCheckedChange={checked=>update(p.id,{completed:checked===true?[...state[p.id].completed,i]:state[p.id].completed.filter(n=>n!==i)})} /></td><td className="p-3"><p>{d.name}</p><p className="mt-1 text-[10px] text-muted-foreground">A{p.id}.{i+1} · {d.format}</p></td><td className="p-3"><Button asChild variant="link" className="h-auto px-0 text-xs"><Link to={`/sea-shield?view=phases&phase=${p.id}&tab=deliverables`}>{String(p.id).padStart(2,'0')}<ArrowRight /></Link></Button></td></tr>))}</tbody></table></div>}
     {view==='approvals'&&<div className="divide-y divide-border">{phases.map(p=><Button key={p.id} asChild variant="ghost" className="h-auto w-full justify-between gap-3 whitespace-normal rounded-none px-2 py-4 text-left"><Link to={`/sea-shield?view=phases&phase=${p.id}&tab=approvals`}><span className="flex-1"><span className="block text-sm font-bold text-primary">{String(p.id).padStart(2,'0')} · {p.title[language]}</span><span className="mt-1 block text-[11px] text-muted-foreground">{state[p.id].approvals.length} / {p.approvers.length} · {state[p.id].completed.length} / {p.deliverables.length} {text.results}</span></span><Status status={state[p.id].status} text={text} /><ArrowRight /></Link></Button>)}</div>}
     {view==='workshops'&&<><p className="mb-4 text-xs text-muted-foreground">{text.windows}</p><div className="divide-y divide-border">{workshops.map(w=><Button key={w.name} asChild variant="ghost" className="h-auto w-full justify-start gap-4 whitespace-normal rounded-none px-2 py-3 text-left"><Link to={`/sea-shield?view=phases&phase=${w.phase}&tab=overview`}><span className="w-16 shrink-0 text-xs text-highlight">{w.period}</span><span className="flex-1"><span className="block text-sm">{w.name}</span><span className="text-[11px] text-muted-foreground">{w.location}</span></span><span className="text-xs">{text.phase} {w.phase}</span><ArrowRight /></Link></Button>)}</div></>}
     {view==='settings'&&<section className="max-w-xl space-y-5"><h2 className="text-sm font-bold text-primary">{t.settings}</h2><p className="text-sm text-muted-foreground">{text.privacy}</p><Button onClick={download}><Download />{text.backup}</Button><div className="border-t border-border pt-5"><p className="mb-3 text-xs text-muted-foreground">{text.baselineNote}</p><Button variant="outline" onClick={()=>setResetting(true)}><RotateCcw />{text.reset}</Button>{resetting&&<div role="alert" className="mt-3 border-l-2 border-highlight bg-secondary p-3"><p className="mb-3 text-sm">{text.resetAsk}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>setResetting(false)}>{text.cancel}</Button><Button size="sm" onClick={()=>{setState(initialState());setResetting(false);}}>{text.confirmReset}</Button></div></div>}</div></section>}
    </div>
    <footer className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border px-4 text-[10px] text-muted-foreground sm:px-6"><span>{text.source}</span><span className="hidden sm:block">{text.demo}</span></footer>
   </div>
  </div>
 </main>;
}
