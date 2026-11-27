export type PhaseStatus = 'planned' | 'active' | 'review' | 'blocked' | 'signed';
export interface Phase {
  id: number; start: string; end: string; days: number; price: number;
  title: Record<'de' | 'en' | 'fr', string>; group: number; approvers: string[];
  deliverables: { name: string; format: string }[];
}
const sponsor = 'CISO Platform Security Lead Maritime';
const results = (items: [string, string][]) => items.map(([name, format]) => ({ name, format }));
export const PROJECT = { name: 'Sea-Shield', start: '2027-02-01', end: '2027-08-06', weeks: 27, source: 'DRYNET Proposal · November 2026 · v0.142' };
export const phases: Phase[] = [
  { id: 1, start: '2027-02-01', end: '2027-03-12', days: 40, price: 73420, group: 0,
    title: { de: 'Systeme entdecken', en: 'Vessel discovery', fr: 'Découverte des systèmes' }, approvers: ['Fleet IT', 'Fleet Management', sponsor],
    deliverables: results([['Comprehensive IT/OT/IoT network discovery report', 'Word · PDF'], ['Discovery logs (passive and approved active methods)', 'Raw data · Excel'], ['Standalone and air-gapped systems inventory', 'Excel'], ['Network pathway mapping', 'Visio · PDF'], ['Communication protocol mapping', 'Excel'], ['Preliminary observations and gap summary', 'Word · PDF']]) },
  { id: 2, start: '2027-03-01', end: '2027-03-26', days: 25, price: 30270, group: 0,
    title: { de: 'As-Is-Architektur', en: 'As-Is architecture', fr: 'Architecture As-Is' }, approvers: [sponsor],
    deliverables: results([['As-Is integrated vessel network diagram', 'Visio · PDF'], ['Data-flow diagrams', 'Visio · PDF'], ['Connectivity and access-path maps', 'Visio · PDF'], ['System dependency matrix', 'Excel']]) },
  { id: 3, start: '2027-03-08', end: '2027-04-09', days: 25, price: 28670, group: 0,
    title: { de: 'Asset-Register', en: 'Asset register', fr: 'Registre des actifs' }, approvers: ['Fleet IT', 'Fleet Management', 'Vessel Representative'],
    deliverables: results([['Unified Vessel Asset Register (100% coverage)', 'Excel · version-controlled'], ['Asset coverage validation report', 'Word · PDF'], ['Stakeholder sign-off sheet', 'Word · PDF']]) },
  { id: 4, start: '2027-03-29', end: '2027-05-07', days: 34, price: 47970, group: 1,
    title: { de: 'Risiken bewerten', en: 'Risk registers', fr: 'Évaluation des risques' }, approvers: [sponsor, 'Fleet IT', 'Fleet Management'],
    deliverables: results([['Asset-based risk register', 'Excel'], ['Network risk register', 'Excel'], ['Maritime threat landscape analysis', 'Word · PDF'], ['Standards-aligned risk categorisation', 'Excel'], ['Top 3 high-severity risks for IT, OT and IoT', 'Word · PDF']]) },
  { id: 5, start: '2027-04-26', end: '2027-05-28', days: 35, price: 47470, group: 1,
    title: { de: 'To-Be-Architektur', en: 'To-Be architecture', fr: 'Architecture To-Be' }, approvers: [sponsor],
    deliverables: results([['To-Be network architecture diagram', 'Visio · PDF'], ['Architecture decision log', 'Excel'], ['Workshop materials', 'PowerPoint · PDF'], ['Final To-Be architecture report', 'Word · PDF']]) },
  { id: 6, start: '2027-05-24', end: '2027-07-02', days: 33, price: 44620, group: 1,
    title: { de: 'Maßnahmen planen', en: 'Mitigation plan', fr: 'Plan de traitement' }, approvers: [sponsor, 'Fleet IT (Network Team)'],
    deliverables: results([['Comprehensive technical mitigation plan', 'Word · Excel'], ['Updated To-Be architecture diagram', 'Visio · PDF'], ['Configuration-level recommendations', 'Excel · Word'], ['Workshop facilitation materials', 'PowerPoint · Excel']]) },
  { id: 7, start: '2027-05-10', end: '2027-07-09', days: 43, price: 68030, group: 2,
    title: { de: 'Angriffe simulieren', en: 'Cyber simulation', fr: 'Simulation cyber' }, approvers: [sponsor, 'Fleet IT', 'Fleet Management'],
    deliverables: results([['Vendor-hosted isolated cyber simulation environment', 'DRYNET range'], ['Live exploitation demonstration scenarios', 'Live · recorded'], ['Zero-impact safety certification', 'PDF · signed'], ['Workshop delivery for up to 15 participants', 'On site Hamburg'], ['Attack path and impact explanation report', 'Word · PDF']]) },
  { id: 8, start: '2027-05-03', end: '2027-07-16', days: 36, price: 48120, group: 2,
    title: { de: 'Forensik & Incident Response', en: 'Forensics & IR', fr: 'Forensique & réponse' }, approvers: [sponsor, 'CISO Security Operations'],
    deliverables: results([['Asset-category-based remote forensics workflow', 'Word · PDF'], ['Maritime evidence handling and chain-of-custody guide', 'Word · PDF'], ['Satellite-adjusted IR procedures', 'Word · PDF'], ['Cyber incident response SOPs', 'Word · PDF'], ['Recovery and restoration procedures', 'Word · PDF'], ['IR training material and tactical battle cards', 'PDF · PowerPoint']]) },
  { id: 9, start: '2027-07-19', end: '2027-08-06', days: 17, price: 19870, group: 2,
    title: { de: 'Governance & Abschluss', en: 'Governance & closure', fr: 'Gouvernance & clôture' }, approvers: [sponsor],
    deliverables: results([['Consolidated documentation set', 'All formats'], ['Governance approval package', 'Word · PowerPoint · PDF'], ['IP assignment confirmation', 'PDF · signed'], ['Project closure report and lessons learned', 'Word · PDF']]) },
];
export interface PhaseState { start: string; end: string; status: PhaseStatus; completed: number[]; approvals: string[]; note: string; }
export type TrackerState = Record<number, PhaseState>;
export const initialState = (): TrackerState => Object.fromEntries(phases.map(p => [p.id, { start: p.start, end: p.end, status: 'planned', completed: [], approvals: [], note: '' }]));
export function canSignOff(phase: Phase, state: PhaseState) {
  return phase.deliverables.every((_, i) => state.completed.includes(i)) && phase.approvers.every(a => state.approvals.includes(a));
}
export function progress(phase: Phase, state: PhaseState) {
  return Math.round(100 * phase.deliverables.filter((_, i) => state.completed.includes(i)).length / phase.deliverables.length);
}
export function validPeriod(start: string, end: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && start >= PROJECT.start && end <= PROJECT.end && start <= end;
}
export function readState(raw: string | null): TrackerState {
  const fresh = initialState();
  if (!raw) return fresh;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !parsed.phases) return fresh;
    for (const p of phases) {
      const item = parsed.phases[p.id];
      if (!item || !validPeriod(item.start, item.end)) continue;
      const state: PhaseState = { start: item.start, end: item.end, status: ['planned','active','review','blocked','signed'].includes(item.status) ? item.status : 'planned', completed: Array.isArray(item.completed) ? item.completed.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 0 && Number(n) < p.deliverables.length) : [], approvals: Array.isArray(item.approvals) ? item.approvals.filter((a: string) => p.approvers.includes(a)) : [], note: typeof item.note === 'string' ? item.note.slice(0, 5000) : '' };
      if (state.status === 'signed' && !canSignOff(p, state)) state.status = 'review';
      fresh[p.id] = state;
    }
  } catch { return fresh; }
  return fresh;
}
export const STORAGE_KEY = 'sea-shield-demo-v1';
export const workshops = [
  { phase: 1, period: 'Feb', name: 'Kick-off', location: 'Hamburg' },
  { phase: 1, period: 'Feb / Mar', name: 'IT & OT vessel visits', location: 'On board · 2 × ≤5 days' },
  { phase: 2, period: 'Mar', name: 'As-Is validation', location: 'Hamburg / remote' },
  { phase: 3, period: 'Mar', name: 'Asset register review', location: 'Remote' },
  { phase: 4, period: 'May', name: 'Risk validation', location: 'Remote' },
  { phase: 5, period: 'May', name: '2 design workshops', location: 'Hamburg' },
  { phase: 6, period: 'Jun', name: '2 mitigation workshops', location: 'Hamburg' },
  { phase: 7, period: 'Jun / Jul', name: 'Simulation · 3 days', location: 'Hamburg · ≤15 participants' },
  { phase: 8, period: 'Jul', name: 'IR training · 1 day', location: 'Hamburg' },
  { phase: 9, period: 'Aug', name: 'Closure', location: 'Hamburg' },
];
