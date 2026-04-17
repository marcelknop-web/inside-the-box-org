// Day/night is bound to the player's local clock — no UI toggle.
// Night runs 20:00 (inclusive) to 06:00 (exclusive). The `shiftSec` argument
// only exists so React memos depending on it re-evaluate this helper each tick.

const NIGHT_START_HOUR = 20;
const NIGHT_END_HOUR = 6;

export function resolveIsNight(_shiftSec: number, now: Date = new Date()): boolean {
  const h = now.getHours();
  return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
}
