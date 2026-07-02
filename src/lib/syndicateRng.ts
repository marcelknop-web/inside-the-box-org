// Seeded RNG for Syndicate — powers Daily Challenge & shareable Seeded Games.
// When no seed is active, falls back to Math.random() (normal free play).

let state = 0;
let seeded = false;

export function setSeed(seed: number): void {
  state = seed >>> 0;
  seeded = true;
}

export function clearSeed(): void {
  seeded = false;
}

export function isSeeded(): boolean {
  return seeded;
}

/** Drop-in replacement for Math.random() that is deterministic while seeded. */
export function rand(): number {
  if (!seeded) return Math.random();
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** FNV-1a hash → 32-bit unsigned seed from any string. */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic per-day seed string, e.g. "DAILY-2026-7-2". */
export function dailySeedString(d: Date = new Date()): string {
  return `DAILY-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-friendly shareable code like "X7K2-91". */
export function makeSeedCode(): string {
  let s = "";
  for (let i = 0; i < 4; i++)
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  s += "-";
  for (let i = 0; i < 2; i++)
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

/** Normalise a user-entered seed code (strip spaces/#, uppercase). */
export function normalizeSeedCode(raw: string): string {
  return raw.trim().replace(/^#/, "").toUpperCase().slice(0, 12);
}
