import { describe, it, expect } from 'vitest';
import { assess, emptyIntake, CONTROLS, type Intake } from './cyberInsurance';

const base = (answer: 'yes' | 'partial' | 'no'): Intake => ({
  ...emptyIntake(), company: 'X', industry: 'services', revenue: 'lt10', records: 'lt10k',
  downtime: 'gt3d', incidents: '0', limit: '1',
  controls: Object.fromEntries(CONTROLS.map((c) => [c.id, answer])),
});

describe('cyber insurance assessment', () => {
  it('all controls in place and low exposure is insurable', () => {
    const r = assess(base('yes'));
    expect(r.maturity).toBe(100);
    expect(r.verdict).toBe('pass');
    expect(r.conditions).toHaveLength(0);
  });

  it('two missing mandatory controls make the prospect hard to insure', () => {
    const i = base('yes');
    i.controls.mfa_remote = 'no';
    i.controls.backup = 'no';
    expect(assess(i).verdict).toBe('fail');
  });

  it('one missing mandatory control yields conditions due before binding', () => {
    const i = base('yes');
    i.controls.edr = 'no';
    const r = assess(i);
    expect(r.verdict).toBe('partial');
    expect(r.conditions[0]).toMatchObject({ controlId: 'edr', timing: 'binding' });
    expect(r.recommended).toBeUndefined();
  });

  it('excludes segments whose appetite excludes the industry', () => {
    const i = { ...base('yes'), industry: 'finance' };
    const mga = assess(i).segments.find((s) => s.segment.id === 'mga')!;
    expect(mga.eligible).toBe(false);
  });
});
