import { describe, expect, it } from 'vitest';
import { isPastDate, TRAINING_END_DATES } from './trainingDates';

describe('past training dates', () => {
  const today = new Date('2026-11-13T15:42:00Z');
  it('greys out past sessions independently of a future session', () => {
    expect(TRAINING_END_DATES.ttx.map(date => isPastDate(date, today))).toEqual([true, false]);
  });
  it('keeps both supplied CSE 2027 sessions current', () => {
    expect(TRAINING_END_DATES.isaca.map(date => isPastDate(date, today))).toEqual([false, false]);
  });
  it('expires only after the last day in Germany, including summer time', () => {
    expect(isPastDate('2027-03-19', new Date('2027-03-19T22:59:59Z'))).toBe(false);
    expect(isPastDate('2027-03-19', new Date('2027-03-19T23:00:00Z'))).toBe(true);
    expect(isPastDate('2026-09-18', new Date('2026-09-18T21:59:59Z'))).toBe(false);
    expect(isPastDate('2026-09-18', new Date('2026-09-18T22:00:00Z'))).toBe(true);
  });
});