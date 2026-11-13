// Calendar-day comparison in the providers' German time zone, inclusive of the last course day.
export function isPastDate(endDate: string, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return endDate < `${part('year')}-${part('month')}-${part('day')}`;
}

export const TRAINING_END_DATES = {
  isaca: ['2027-03-19', '2027-10-22'],
  ttx: ['2026-09-18', '2026-12-04'],
} as const;