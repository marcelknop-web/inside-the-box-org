import { DEMO_DATE, R0, M0 } from './riskLifeReference';
export type RiskClass = 0 | 1 | 2 | 3;
export const CLASS_NAMES = ['akzeptabel', 'signifikant', 'sehr hoch', 'extrem schädlich'] as const;
export const PROCESS = ['Erfasst', 'Bewertet', 'Maßnahmen in Umsetzung', 'Akzeptanz offen', 'Überwachung'] as const;
export function classify(s: number, w: number) {
  const score = s * w;
  const raw: RiskClass = score < 5 ? 0 : score < 10 ? 1 : score < 16 ? 2 : 3;
  const level: RiskClass = s === 5 && raw < 2 ? 2 : raw;
  return { score, level, protected: level !== raw, name: CLASS_NAMES[level], decider: level < 2 ? 'Risiko-Eigentümer' : level === 2 ? 'IT-Leitung' : 'Geschäftsführung', months: level < 2 ? 12 : level === 2 ? 6 : 3 };
}
export function addMonths(date: string, months: number) {
  const d = new Date(`${date}T00:00:00Z`), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d.toISOString().slice(0, 10);
}
export function addDays(days: number) { const d = new Date(`${DEMO_DATE}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
export const dueBucket = (date: string) => { const days = Math.round((Date.parse(date) - Date.parse(DEMO_DATE)) / 86400000); return days < 0 ? 0 : days <= 30 ? 1 : days <= 90 ? 2 : 3; };
export const decisionReady = (measures: { done: boolean }[]) => measures.every(m => m.done);
export const referenceRisks = R0.map(r => ({ id:r[0], title:r[1], area:r[2], s:r[3], w:r[4], status:r[5], next:r[6], accepted:r[7] }));
export const referenceMeasures = [...M0.map((m,i) => ({ id:`ISR-${23+i}`, title:m[0] as string, risk:m[1] as string, due:m[2] as string, done:false })), {id:'ISR-50', title:'Offline-Backup eingeführt', risk:'ISR-1', due:'2027-05-14', done:true}, {id:'ISR-51', title:'Freigabe für Fertigungsdaten eingeführt', risk:'ISR-3', due:'2027-05-28', done:true}];
export const RISK_ROOM_TEXT: Record<string, string> = {
 'rooms.soc_floor.name':'Risiko-Eigentümer', 'rooms.siem.name':'Risikoregister', 'rooms.forensics.name':'Bewertung', 'rooms.noc.name':'Maßnahmenplanung',
 'rooms.war_room.name':'Entscheidung', 'rooms.ciso_office.name':'CISO-Prüfung', 'rooms.server_room.name':'Umsetzung', 'rooms.kitchen.name':'Überwachung',
 'npcs.junior.name':'Risiko-Eigentümer', 'npcs.ir_lead.name':'Entscheider', 'npcs.ciso.name':'CISO', 'npcs.sysadmin.name':'IT-Verantwortlicher',
};