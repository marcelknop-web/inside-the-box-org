import { Circle, CircleCheck, CircleDashed, CirclePause, Clock3 } from 'lucide-react';
import type { PhaseStatus } from '@/data/seaShield';
import type { TrackerText } from '@/data/seaShieldI18n';
const icons = { planned: CircleDashed, active: Circle, review: Clock3, blocked: CirclePause, signed: CircleCheck };
const colors = { planned: 'text-muted-foreground', active: 'text-highlight', review: 'text-primary', blocked: 'text-destructive', signed: 'text-success' };
export function Status({ status, text }: { status: PhaseStatus; text: TrackerText }) {
 const Icon = icons[status];
 return <span className={`inline-flex items-center gap-1.5 text-xs ${colors[status]}`}><Icon className="h-3.5 w-3.5 shrink-0" />{text[status]}</span>;
}
