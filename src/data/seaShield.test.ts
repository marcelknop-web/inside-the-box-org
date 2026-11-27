import { describe, it, expect } from 'vitest';
import { phases, PROJECT, initialState, progress, canSignOff, validPeriod, readState } from './seaShield';
describe('Sea-Shield proposal baseline', () => {
 it('retains nine stages and 27 weeks from 1 February to 6 August 2027', () => {
  expect(phases).toHaveLength(9); expect(PROJECT.weeks).toBe(27);
  expect(PROJECT.start).toBe('2027-02-01'); expect(PROJECT.end).toBe('2027-08-06');
  expect(phases[6].start).toBe('2027-05-10'); expect(phases[7].start).toBe('2027-05-03');
 });
 it('matches 288 person-days in the commercial table', () => expect(phases.reduce((n,p) => n+p.days,0)).toBe(288));
 it('matches the 408440 EUR fixed price in the original offer', () => expect(phases.reduce((n,p) => n+p.price,0)).toBe(408440));
 it('preserves all 41 deliverables from slides 8–16', () => expect(phases.reduce((n,p) => n+p.deliverables.length,0)).toBe(41));
 it('starts without invented progress or sign-offs', () => {
  const state = initialState(); expect(phases.every(p => progress(p,state[p.id]) === 0 && state[p.id].status === 'planned')).toBe(true);
 });
 it('requires every deliverable AND the listed authorities before sign-off', () => {
  const phase = phases[0], state = initialState()[1];
  expect(canSignOff(phase,state)).toBe(false);
  state.completed = phase.deliverables.map((_,i) => i); expect(canSignOff(phase,state)).toBe(false);
  state.approvals = [...phase.approvers]; expect(canSignOff(phase,state)).toBe(true);
  state.completed.pop(); expect(canSignOff(phase,state)).toBe(false);
 });
 it('rejects reversed dates and edits outside the project window', () => {
  expect(validPeriod('2027-03-01','2027-02-01')).toBe(false);
  expect(validPeriod('2027-01-31','2027-02-01')).toBe(false);
  expect(validPeriod('2027-08-06','2027-08-07')).toBe(false);
  expect(validPeriod(PROJECT.start, PROJECT.end)).toBe(true);
 });
 it('restores edits but rejects incomplete stored sign-off and corrupt storage', () => {
  const state = initialState(); state[1].note = 'Next: review'; state[1].completed = [0]; state[1].status = 'signed';
  const restored = readState(JSON.stringify({ version:1, phases:state }));
  expect(restored[1].note).toBe('Next: review'); expect(restored[1].completed).toEqual([0]); expect(restored[1].status).toBe('review');
  expect(readState('broken')).toEqual(initialState());
 });
});
