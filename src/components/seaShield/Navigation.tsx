import { NavLink, useNavigate } from 'react-router-dom';
import { Anchor, CalendarDays, CheckCheck, FileCheck2, GanttChart, LayoutDashboard, Layers, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workspaceText, type WorkspaceView } from '@/data/seaShieldNavigation';
export function Navigation({ language, view }: {language:'de'|'en'|'fr';view:WorkspaceView}) {
 const t=workspaceText[language];
 const navigate=useNavigate();
 const groups = [ {name:t.project,items:[{view:'dashboard',icon:LayoutDashboard,label:t.dashboard}]}, {name:t.planning,items:[{view:'gantt',icon:GanttChart,label:t.gantt},{view:'phases',icon:Layers,label:t.phases}]}, {name:t.delivery,items:[{view:'deliverables',icon:FileCheck2,label:t.deliverables},{view:'approvals',icon:CheckCheck,label:t.approvals},{view:'workshops',icon:CalendarDays,label:t.workshops}]}, {name:t.management,items:[{view:'settings',icon:Settings2,label:t.settings}]} ];
 return <><div className="shrink-0 border-b border-border bg-card px-4 py-2 sm:hidden"><Select value={view} onValueChange={v=>navigate(v==='dashboard'?'/sea-shield':`/sea-shield?view=${v}`)}><SelectTrigger aria-label={t.title} className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{groups.flatMap(g=>g.items.map(i=><SelectItem key={i.view} value={i.view}>{g.name} / {i.label}</SelectItem>))}</SelectContent></Select></div><nav aria-label={t.title} className="hidden w-[165px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-3 sm:flex">
  <div className="hidden items-center gap-2 border-b border-border pb-4 text-primary sm:flex"><Anchor className="h-5 w-5" /><span className="text-sm font-bold">SEA-SHIELD</span></div>
  {groups.map(g=><div key={g.name} className="flex shrink-0 gap-1 sm:block"><p className="mb-1 hidden text-[10px] font-bold uppercase text-muted-foreground sm:block">{g.name}</p>{g.items.map(i=><Button key={i.view} asChild variant="ghost" className={`h-auto min-h-9 justify-start whitespace-normal rounded-sm px-2 py-2 text-left text-xs sm:w-full ${view===i.view?'bg-primary/10 text-primary':'text-muted-foreground'}`}><NavLink to={i.view==='dashboard'?'/sea-shield':`/sea-shield?view=${i.view}`} aria-current={view===i.view?'page':undefined}><i.icon className="h-4 w-4" />{i.label}</NavLink></Button>)}</div>)}
  <div className="mt-auto hidden border-t border-border pt-4 text-[11px] text-muted-foreground sm:block"><p className="font-bold text-foreground">Marcel Knop</p><p>{t.lead}</p><p className="mt-2">DRYNET · Hapag-Lloyd AG</p></div>
 </nav></>;
}
