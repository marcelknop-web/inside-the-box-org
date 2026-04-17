// Day/night mode for SOC Life. Players can choose between:
//   - "cycle"   : Original 6 min day / 4 min night gameplay cycle (default).
//   - "realtime": Bound to the player's local clock — night 20:00–06:00.
//   - "day"     : Always day (no tint).
//   - "night"   : Always night (cool-blue tint).
// The choice is persisted per browser so returning players don't have to
// reconfigure their preference each shift.

export type DayNightMode = "cycle" | "realtime" | "day" | "night";

const KEY = "socLife.dayNightMode.v1";
const NIGHT_START_HOUR = 20; // 20:00 inclusive
const NIGHT_END_HOUR = 6;    // 06:00 exclusive

export function loadDayNightMode(): DayNightMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "cycle" || v === "realtime" || v === "day" || v === "night") return v;
  } catch { /* ignore */ }
  return "cycle";
}

export function saveDayNightMode(mode: DayNightMode): void {
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
}

/** Resolve whether the world should currently render as night. */
export function resolveIsNight(mode: DayNightMode, shiftSec: number, now: Date = new Date()): boolean {
  switch (mode) {
    case "day": return false;
    case "night": return true;
    case "realtime": {
      const h = now.getHours();
      return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
    }
    case "cycle":
    default: {
      // 6 min day / 4 min night cycle for variety
      const cycle = shiftSec % 600;
      return cycle >= 360;
    }
  }
}
