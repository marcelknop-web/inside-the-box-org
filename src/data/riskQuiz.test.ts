import { describe, it, expect } from 'vitest';
import { RISK_QUESTION_BANK } from './riskQuiz';
describe('risk quiz bank', () => {
  it('every question has 4 unique options and a valid answer', () => {
    for (let d = 1; d <= 10; d++) for (const gen of RISK_QUESTION_BANK[d]) for (let i = 0; i < 20; i++) {
      const q = gen();
      expect(new Set(q.options).size).toBe(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
    }
  });
});
