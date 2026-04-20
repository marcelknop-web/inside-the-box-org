/**
 * Historically accurate Enigma I (Wehrmacht) simulator.
 * Wirings sourced from public references (Crypto Museum, Wikipedia).
 *
 * Letters are indexed A=0 ... Z=25.
 */

export const A = "A".charCodeAt(0);
export const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type RotorName = "I" | "II" | "III" | "IV" | "V";
export type ReflectorName = "B" | "C";

interface RotorSpec {
  wiring: string;   // mapping of A..Z (right -> left contact letter)
  notch: string;    // letter at which the next rotor steps when this rotor advances
}

export const ROTORS: Record<RotorName, RotorSpec> = {
  I:   { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: "Q" },
  II:  { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: "E" },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: "V" },
  IV:  { wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", notch: "J" },
  V:   { wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", notch: "Z" },
};

export const REFLECTORS: Record<ReflectorName, string> = {
  B: "YRUHQSLDPXNGOKMIEBFZCWVJAT",
  C: "FVPJIAOYEDRZXWGCTKUQSBNMHL",
};

export interface RotorState {
  name: RotorName;
  position: number; // 0..25 (visible letter = ALPHA[(position) % 26])
  ring: number;     // 0..25 (Ringstellung, 0 = "A")
}

export interface EnigmaConfig {
  rotors: [RotorState, RotorState, RotorState]; // [left, middle, right]
  reflector: ReflectorName;
  /** Plugboard pairs e.g. "AB CD EF" — case-insensitive, single letters allowed but ignored */
  plugboard: string;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/* --------------------------------- Plugboard ------------------------------- */

export function parsePlugboard(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  const seen = new Set<string>();
  const tokens = raw.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok.length !== 2) continue;
    const [a, b] = [tok[0], tok[1]];
    if (a === b) continue;
    if (seen.has(a) || seen.has(b)) continue;
    map[a] = b;
    map[b] = a;
    seen.add(a);
    seen.add(b);
  }
  return map;
}

const swap = (c: number, plug: Record<string, string>): number => {
  const ch = String.fromCharCode(A + c);
  const m = plug[ch];
  return m ? m.charCodeAt(0) - A : c;
};

/* ---------------------------------- Stepping ------------------------------ */

const isAtNotch = (r: RotorState): boolean =>
  ALPHA[r.position] === ROTORS[r.name].notch;

/**
 * Wehrmacht stepping with the famous "double-step" of the middle rotor.
 * - Right rotor always steps.
 * - If middle rotor is at its notch, BOTH middle and left rotors step.
 * - Else if right rotor is at its notch, middle rotor steps.
 */
export function step(rotors: [RotorState, RotorState, RotorState]): [RotorState, RotorState, RotorState] {
  const [l, m, r] = rotors;
  let nl = l.position, nm = m.position, nr = r.position;
  const middleAtNotch = isAtNotch(m);
  const rightAtNotch = isAtNotch(r);
  if (middleAtNotch) {
    nl = mod(nl + 1, 26);
    nm = mod(nm + 1, 26);
  } else if (rightAtNotch) {
    nm = mod(nm + 1, 26);
  }
  nr = mod(nr + 1, 26);
  return [
    { ...l, position: nl },
    { ...m, position: nm },
    { ...r, position: nr },
  ];
}

/* ------------------------- Single rotor pass ------------------------------ */

/** Pass a contact through a rotor in the right→left direction (input side). */
function rotorForward(c: number, rotor: RotorState): number {
  const offset = mod(rotor.position - rotor.ring, 26);
  const entered = mod(c + offset, 26);
  const wired = ROTORS[rotor.name].wiring.charCodeAt(entered) - A;
  return mod(wired - offset, 26);
}

/** Pass a contact through a rotor in the left→right direction (return side). */
function rotorBackward(c: number, rotor: RotorState): number {
  const offset = mod(rotor.position - rotor.ring, 26);
  const entered = mod(c + offset, 26);
  // inverse wiring lookup
  const wiring = ROTORS[rotor.name].wiring;
  const wired = wiring.indexOf(String.fromCharCode(A + entered));
  return mod(wired - offset, 26);
}

function reflect(c: number, name: ReflectorName): number {
  return REFLECTORS[name].charCodeAt(c) - A;
}

/* ----------------------------- Public API --------------------------------- */

export interface TraceStep {
  label: string;
  from: string;
  to: string;
}

export interface EncryptResult {
  output: string;            // resulting letter (or "" if input wasn't A-Z)
  rotors: [RotorState, RotorState, RotorState]; // rotor state AFTER the keypress
  trace: TraceStep[];
}

/**
 * Encrypt a single letter. Stepping happens BEFORE the signal flows
 * (correct Enigma behaviour). Non-letters return passthrough with no stepping.
 */
export function encryptLetter(letter: string, cfg: EnigmaConfig): EncryptResult {
  const ch = letter.toUpperCase();
  if (!/^[A-Z]$/.test(ch)) {
    return { output: ch, rotors: cfg.rotors, trace: [] };
  }

  const stepped = step(cfg.rotors);
  const plug = parsePlugboard(cfg.plugboard);
  const trace: TraceStep[] = [];

  let c = ch.charCodeAt(0) - A;
  const inLetter = ch;

  // 1. Plugboard in
  const afterPlugIn = swap(c, plug);
  trace.push({ label: "Plugboard", from: inLetter, to: String.fromCharCode(A + afterPlugIn) });
  c = afterPlugIn;

  // 2. Right → Left through rotors (rotor index 2,1,0)
  for (let i = 2; i >= 0; i--) {
    const before = String.fromCharCode(A + c);
    c = rotorForward(c, stepped[i]);
    trace.push({
      label: `Rotor ${["I","II","III"][2 - i]} (${stepped[i].name}) →`,
      from: before,
      to: String.fromCharCode(A + c),
    });
  }

  // 3. Reflector
  const beforeRefl = String.fromCharCode(A + c);
  c = reflect(c, cfg.reflector);
  trace.push({ label: `Reflector ${cfg.reflector}`, from: beforeRefl, to: String.fromCharCode(A + c) });

  // 4. Left → Right through rotors (rotor index 0,1,2)
  for (let i = 0; i < 3; i++) {
    const before = String.fromCharCode(A + c);
    c = rotorBackward(c, stepped[i]);
    trace.push({
      label: `Rotor ${["III","II","I"][i]} (${stepped[i].name}) ←`,
      from: before,
      to: String.fromCharCode(A + c),
    });
  }

  // 5. Plugboard out
  const beforeOut = String.fromCharCode(A + c);
  c = swap(c, plug);
  trace.push({ label: "Plugboard", from: beforeOut, to: String.fromCharCode(A + c) });

  return {
    output: String.fromCharCode(A + c),
    rotors: stepped,
    trace,
  };
}
