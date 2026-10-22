import { describe, it, expect } from "vitest";
import { reference, scoreRanking } from "../../supabase/functions/_shared/moonCrash";
import { MAX_PARTICIPANTS, isRanking } from "../../supabase/functions/_shared/moonCrashValidation";
describe("Moon Crash rules", () => {
  it("allows at most 15 participants", () => expect(MAX_PARTICIPANTS).toBe(15));
  it("requires all 15 unique ranks", () => {
    expect(isRanking(reference)).toBe(true);
    expect(isRanking(Array(15).fill(1))).toBe(false);
    expect(isRanking(reference.slice(1))).toBe(false);
    expect(isRanking([...reference.slice(0, 14), 16])).toBe(false);
  });
  it("matches NASA ranks in the original item order", () => expect(reference).toEqual([15,4,6,8,13,11,12,1,3,9,2,10,7,14,5]));
  it("sums absolute individual deviations", () => {
    expect(scoreRanking(reference)).toBe(0);
    const changed = [...reference];
    [changed[0], changed[7]] = [changed[7], changed[0]];
    expect(scoreRanking(changed)).toBe(28);
  });
});