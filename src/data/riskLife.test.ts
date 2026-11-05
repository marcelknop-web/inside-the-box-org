import { describe, it, expect } from 'vitest';
import { classify, addMonths, dueBucket, decisionReady, referenceRisks, referenceMeasures } from './riskLife';
describe('uploaded risk process rules', () => {
 it('classifies products through 4 as acceptable', () => { expect(classify(2,2).level).toBe(0); });
 it('classifies products 5–9 as significant', () => { expect(classify(3,3).level).toBe(1); });
 it('classifies products 10–15 as very high', () => { expect(classify(3,5).level).toBe(2); });
 it('classifies products from 16 as extreme', () => { expect(classify(4,4).level).toBe(3); });
 it('protects existential damage even with likelihood 1', () => { expect(classify(5,1)).toMatchObject({level:2,protected:true,decider:'IT-Leitung'}); });
 it('routes lower classes to the owner', () => { expect(classify(3,3).decider).toBe('Risiko-Eigentümer'); });
 it('routes extreme risks to management', () => { expect(classify(4,4).decider).toBe('Geschäftsführung'); });
 it('uses annual review for lower classes', () => { expect(classify(2,2).months).toBe(12); expect(classify(3,3).months).toBe(12); });
 it('uses half-year review for very high risks', () => { expect(classify(4,3).months).toBe(6); });
 it('uses quarterly review for extreme risks', () => { expect(classify(4,4).months).toBe(3); });
 it('blocks submission until every measure is complete', () => { expect(decisionReady([{done:true},{done:false}])).toBe(false); expect(decisionReady([{done:true}])).toBe(true); });
 it('keeps month-end valid for acceptance dates', () => { expect(addMonths('2027-08-31',6)).toBe('2028-02-29'); });
 it('retains the 22 example risks and 27 open measures', () => { expect(referenceRisks.length).toBe(22); expect(referenceMeasures.filter(m=>!m.done).length).toBe(27); });
 it('uses exact overdue and 30/90-day buckets from demo clock', () => { expect(dueBucket('2027-06-14')).toBe(0); expect(dueBucket('2027-07-15')).toBe(1); expect(dueBucket('2027-09-13')).toBe(2); expect(dueBucket('2027-09-14')).toBe(3); });
});