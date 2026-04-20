import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Eye, EyeOff, Maximize2, Minimize2, Volume2, VolumeX, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ALPHA,
  ROTORS,
  REFLECTORS,
  type RotorName,
  type ReflectorName,
  type RotorState,
  type EnigmaConfig,
  type TraceStep,
  encryptLetter,
} from "@/lib/enigma";

/* --------------------------- Audio (rotor click) ------------------------- */
/**
 * Short mechanical "klack": narrow noise burst + low thump, < 60ms.
 * Lazily creates a single AudioContext on first user interaction.
 */
function useRotorClick(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    ctxRef.current = new AC();
    return ctxRef.current;
  };

  return useCallback(
    (intensity = 1) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const t0 = ctx.currentTime;

      // 1) Noise burst (the wood/plastic "tick")
      const dur = 0.045;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const env = Math.exp(-i / (ctx.sampleRate * 0.008));
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const noiseHP = ctx.createBiquadFilter();
      noiseHP.type = "highpass";
      noiseHP.frequency.value = 1800;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.18 * intensity;
      noise.connect(noiseHP).connect(noiseGain).connect(ctx.destination);
      noise.start(t0);
      noise.stop(t0 + dur);

      // 2) Low thump (the metallic body resonance)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.exponentialRampToValueAtTime(70, t0 + 0.05);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.0001, t0);
      oscGain.gain.exponentialRampToValueAtTime(0.22 * intensity, t0 + 0.004);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
      osc.connect(oscGain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.07);
    },
    [muted]
  );
}


/* ---------------------------------- i18n --------------------------------- */
const STR = {
  de: {
    title: "Enigma — die berühmte Verschlüsselungs­maschine",
    desc: "Tippe einen Buchstaben — sieh, wie die Walzen sich drehen und ein anderer Buchstabe aufleuchtet. Tippe ihn mit gleicher Startstellung nochmal — und du bekommst das Original zurück.",
    back: "Zurück",
    setup: "Einstellungen",
    rotors: "Walzen (Links · Mitte · Rechts)",
    reflector: "Umkehrwalze (Reflektor)",
    reflectorHelp: "Schickt das Signal am Ende wieder zurück durch die Walzen. Deshalb ist Verschlüsseln und Entschlüsseln dasselbe.",
    ring: "Ring-Offset (Ringstellung)",
    ringHelp: "Verschiebt die Verdrahtung innerhalb der Walze gegen die Buchstaben außen. Selten benötigt — lass es einfach auf 01.",
    pos: "Startposition (Grundstellung)",
    posHelp: "Welcher Buchstabe steht am Anfang im Walzenfenster. Sender und Empfänger müssen die gleiche Position einstellen.",
    rotorChoice: "Walzentyp",
    rotorChoiceHelp: "Drei der fünf historischen Walzen (I–V) wählen. Jede hat eine andere Verdrahtung.",
    plugboard: "Buchstaben-Tausch (Steckerbrett)",
    plugboardHelp: "Vertauscht Buchstaben paarweise vor und nach den Walzen. Beispiel „AB“ tauscht A↔B. Kannst du leer lassen.",
    plugboardHint: "Buchstabenpaare durch Leerzeichen, z.B. AV BS CG DL.",
    keyboard: "Tastatur",
    lampboard: "Lampenfeld (Ausgabe)",
    output: "Verschlüsselter Text",
    input: "Eingegebener Text",
    reset: "Zurücksetzen",
    showLab: "Signalweg",
    hideLab: "Signalweg aus",
    lab: "Wo das Signal langläuft",
    labHint: "Der Weg deines letzten Buchstabens durch die Maschine.",
    clear: "Löschen",
    clickHint: "Klick auf eine Taste oder tippe einen Buchstaben.",
    historyTitle: "Wie sie funktioniert",
    historyText: "Bei jedem Tastendruck dreht sich die rechte Walze einen Schritt weiter. Das Signal läuft durchs Steckerbrett, durch alle drei Walzen, wird von der Umkehrwalze zurückgespiegelt und kommt durch andere Wege wieder zurück. So wird aus jedem Buchstaben ein anderer — und nie er selbst.",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild aus",
    sound: "Ton",
    muteOn: "Stumm",
    muteOff: "Aktiv",
    /* Intro */
    introTitle: "Willkommen an der Enigma",
    introNext: "Weiter",
    introStart: "Los geht’s",
    introSkip: "Überspringen",
    intro1Title: "1 · Tippe einen Buchstaben",
    intro1Body: "Drück eine Taste auf der Tastatur — oder tipp einfach auf deiner echten Tastatur. Im Lampenfeld leuchtet sofort der verschlüsselte Buchstabe auf.",
    intro2Title: "2 · Beobachte die Walzen",
    intro2Body: "Mit jedem Tastendruck dreht sich die rechte Walze. Sie verändert die Verdrahtung — derselbe Buchstabe ergibt das nächste Mal etwas anderes.",
    intro3Title: "3 · Probier’s aus",
    intro3Body: "Tipp ein Wort. Dann stell die Walzen wieder auf die gleiche Startposition und tipp den verschlüsselten Text — du bekommst dein Original zurück. Das ist die Magie der Enigma.",
  },
  en: {
    title: "Enigma — the famous cipher machine",
    desc: "Type a letter — watch the rotors turn and a different letter light up. Type it again with the same start position — and you get the original back.",
    back: "Back",
    setup: "Settings",
    rotors: "Rotors (Left · Middle · Right)",
    reflector: "Reflector wheel",
    reflectorHelp: "Sends the signal back through the rotors at the end. That's why encrypting and decrypting are the same operation.",
    ring: "Ring offset (Ringstellung)",
    ringHelp: "Shifts the wiring inside the rotor against the outer letters. Rarely needed — just leave it at 01.",
    pos: "Start position (Grundstellung)",
    posHelp: "Which letter shows in the rotor window at the start. Sender and receiver must set the same position.",
    rotorChoice: "Rotor type",
    rotorChoiceHelp: "Pick three of the five historical rotors (I–V). Each has a different wiring.",
    plugboard: "Letter swap (Plugboard)",
    plugboardHelp: "Swaps letter pairs before and after the rotors. E.g. \"AB\" swaps A↔B. Can be left empty.",
    plugboardHint: "Letter pairs separated by spaces, e.g. AV BS CG DL.",
    keyboard: "Keyboard",
    lampboard: "Lampboard (output)",
    output: "Encrypted text",
    input: "Typed text",
    reset: "Reset",
    showLab: "Signal path",
    hideLab: "Hide path",
    lab: "Where the signal travels",
    labHint: "The path of your last letter through the machine.",
    clear: "Clear",
    clickHint: "Click a key or type any letter.",
    historyTitle: "How it works",
    historyText: "Every keystroke advances the right rotor by one step. The signal flows through the plugboard, through all three rotors, is reflected back, and returns via different paths. So every letter becomes a different one — and never itself.",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    sound: "Sound",
    muteOn: "Muted",
    muteOff: "On",
    introTitle: "Welcome to the Enigma",
    introNext: "Next",
    introStart: "Let's go",
    introSkip: "Skip",
    intro1Title: "1 · Type a letter",
    intro1Body: "Press a key on the keyboard — or just type on your real keyboard. The encrypted letter lights up instantly on the lampboard.",
    intro2Title: "2 · Watch the rotors",
    intro2Body: "With every keystroke the right rotor turns. It changes the wiring — so the same letter produces something different next time.",
    intro3Title: "3 · Try it out",
    intro3Body: "Type a word. Then set the rotors back to the same start position and type the encrypted text — you'll get your original back. That's the magic of Enigma.",
  },
  fr: {
    title: "Enigma — la célèbre machine à chiffrer",
    desc: "Tape une lettre — regarde les rotors tourner et une autre lettre s'allumer. Retape-la avec la même position de départ — et tu retrouves l'original.",
    back: "Retour",
    setup: "Réglages",
    rotors: "Rotors (Gauche · Milieu · Droite)",
    reflector: "Roue réflectrice",
    reflectorHelp: "Renvoie le signal à travers les rotors à la fin. C'est pourquoi chiffrer et déchiffrer sont la même opération.",
    ring: "Décalage anneau (Ringstellung)",
    ringHelp: "Décale le câblage interne du rotor par rapport aux lettres extérieures. Rarement nécessaire — laisse à 01.",
    pos: "Position de départ (Grundstellung)",
    posHelp: "Quelle lettre apparaît dans la fenêtre du rotor au début. Émetteur et destinataire doivent régler la même.",
    rotorChoice: "Type de rotor",
    rotorChoiceHelp: "Choisis trois des cinq rotors historiques (I–V). Chacun a un câblage différent.",
    plugboard: "Échange de lettres (tableau de connexions)",
    plugboardHelp: "Échange des paires de lettres avant et après les rotors. Ex. « AB » échange A↔B. Peut rester vide.",
    plugboardHint: "Paires séparées par des espaces, ex. AV BS CG DL.",
    keyboard: "Clavier",
    lampboard: "Tableau lumineux (sortie)",
    output: "Texte chiffré",
    input: "Texte saisi",
    reset: "Réinitialiser",
    showLab: "Chemin du signal",
    hideLab: "Masquer chemin",
    lab: "Où passe le signal",
    labHint: "Le trajet de ta dernière lettre à travers la machine.",
    clear: "Effacer",
    clickHint: "Clique une touche ou tape une lettre.",
    historyTitle: "Comment ça marche",
    historyText: "Chaque frappe fait avancer le rotor de droite d'un cran. Le signal traverse le tableau de connexions, les trois rotors, est renvoyé par la roue réflectrice, et revient par d'autres chemins. Chaque lettre devient une autre — jamais elle-même.",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter plein écran",
    sound: "Son",
    muteOn: "Muet",
    muteOff: "Activé",
    introTitle: "Bienvenue sur l'Enigma",
    introNext: "Suivant",
    introStart: "C'est parti",
    introSkip: "Passer",
    intro1Title: "1 · Tape une lettre",
    intro1Body: "Appuie sur une touche du clavier — ou tape sur ton vrai clavier. La lettre chiffrée s'allume aussitôt sur le tableau lumineux.",
    intro2Title: "2 · Regarde les rotors",
    intro2Body: "À chaque frappe, le rotor de droite tourne. Il modifie le câblage — la même lettre donne quelque chose de différent la fois suivante.",
    intro3Title: "3 · Essaie",
    intro3Body: "Tape un mot. Puis remets les rotors à la même position de départ et tape le texte chiffré — tu retrouves ton original. C'est la magie de l'Enigma.",
  },
} as const;

/* QWERTZ layout used on the original Enigma */
const QWERTZ = [
  "QWERTZUIO".split(""),
  "ASDFGHJK".split(""),
  "PYXCVBNML".split(""),
];

/* ------------------------------- HelpDot --------------------------------- */
/** Small "?" icon next to a label that reveals a plain-language explanation. */
function HelpDot({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label="help"
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-[9px] font-mono text-muted-foreground/70 hover:text-primary hover:border-primary transition-colors"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------------ IntroOverlay ----------------------------- */
const INTRO_KEY = "enigma_intro_seen_v1";

function IntroOverlay({
  t,
  onClose,
}: {
  t: (typeof STR)[keyof typeof STR];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: t.intro1Title, body: t.intro1Body },
    { title: t.intro2Title, body: t.intro2Body },
    { title: t.intro3Title, body: t.intro3Body },
  ];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border-2 border-primary/40 bg-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-primary/80">
          {t.introTitle}
        </div>
        <h2 className="font-mono text-lg text-foreground mb-2">{steps[step].title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{steps[step].body}</p>

        {/* progress dots */}
        <div className="flex items-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            {t.introSkip}
          </button>
          <button
            onClick={() => (isLast ? onClose() : setStep(step + 1))}
            className="rounded border border-primary bg-primary/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
          >
            {isLast ? t.introStart : t.introNext}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Rotor visual ------------------------------ */
/**
 * 3D cylindrical rotor showing all 26 letters wrapped around the drum.
 * Front-most letter is the active position; side letters fade with depth.
 */
function RotorWindow({
  rotor,
  label,
  onChangePos,
}: {
  rotor: RotorState;
  label: string;
  onChangePos: (delta: number) => void;
}) {
  const RADIUS = 70; // px — controls drum size
  // Each letter occupies 360/26 ≈ 13.846° around the cylinder.
  // We rotate the whole drum so the active position sits at the front (0°).
  const stepAngle = 360 / 26;
  const drumRotation = -rotor.position * stepAngle;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label} · {rotor.name}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="step down"
          onClick={() => onChangePos(-1)}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors px-1"
        >
          ▲
        </button>

        {/* Cylinder housing */}
        <div
          className="relative"
          style={{
            width: 78,
            height: RADIUS * 2 + 14,
            perspective: 600,
          }}
        >
          {/* Brass end-caps */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5 rounded-t bg-gradient-to-b from-[#d4a84a] via-[#9a7820] to-[#5c4612] shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1.5 rounded-b bg-gradient-to-t from-[#d4a84a] via-[#9a7820] to-[#5c4612] shadow-[0_-1px_2px_rgba(0,0,0,0.6)]"
          />

          {/* Drum */}
          <div
            className="absolute inset-y-1.5 left-1/2"
            style={{
              width: 0,
              transformStyle: "preserve-3d",
              transform: `rotateX(${drumRotation}deg)`,
              transition: "transform 280ms cubic-bezier(0.34, 1.2, 0.64, 1)",
            }}
          >
            {ALPHA.split("").map((letter, idx) => {
              const angle = idx * stepAngle;
              // Letters at the back are dimmed; front letter is highlighted.
              const delta = ((idx - rotor.position) % 26 + 26) % 26;
              const front = delta === 0;
              const visibility = Math.cos((delta <= 13 ? delta : delta - 26) * stepAngle * Math.PI / 180);
              const opacity = visibility > 0 ? 0.25 + visibility * 0.75 : 0;
              return (
                <div
                  key={letter}
                  className="absolute left-1/2 top-1/2 flex h-5 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center font-mono text-[15px] font-semibold"
                  style={{
                    transform: `rotateX(${angle}deg) translateZ(${RADIUS}px)`,
                    backfaceVisibility: "hidden",
                    color: front ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.85)",
                    textShadow: front
                      ? "0 0 8px hsl(var(--primary) / 0.7)"
                      : "none",
                    opacity,
                  }}
                >
                  {letter}
                </div>
              );
            })}

            {/* Subtle ridges between letters for mechanical feel */}
            {ALPHA.split("").map((_, idx) => (
              <div
                key={`r${idx}`}
                aria-hidden
                className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 bg-black/40"
                style={{
                  transform: `rotateX(${idx * stepAngle + stepAngle / 2}deg) translateZ(${RADIUS}px)`,
                  backfaceVisibility: "hidden",
                }}
              />
            ))}
          </div>

          {/* Front gradient mask — gives depth & focus on active letter */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-sm"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.0) 65%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Active-letter window indicator (brass marker) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-6 border-y border-primary/60 shadow-[0_0_10px_hsl(var(--primary)/0.25)_inset]"
          />
        </div>

        <button
          type="button"
          aria-label="step up"
          onClick={() => onChangePos(1)}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors px-1"
        >
          ▼
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Wiring Diagram ------------------------------ */
/**
 * Visual side-view of the signal flowing through the machine.
 * Shows 5 columns of 26 letter contacts (Plugboard | R | M | L | Reflector)
 * and draws the actual path the last keypress took: forward (gold) and
 * back (cyan), so you can SEE how the wiring works.
 */
function WiringDiagram({ trace, cfg }: { trace: TraceStep[]; cfg: EnigmaConfig }) {
  // Re-key on every new trace so the polylines remount and re-run the
  // stroke-dashoffset animation from the start (otherwise the same element
  // wouldn't restart).
  const animKey = useRef(0);
  animKey.current += 1;

  // Column positions
  const W = 320;       // viewBox width
  const H = 360;       // viewBox height
  const TOP = 14;
  const BOT = H - 14;
  const COLS = ["IN", "PB", "R", "M", "L", "UKW"]; // input, plugboard, right, middle, left, reflector
  const xFor = (i: number) => 18 + (i * (W - 36)) / (COLS.length - 1);
  const yFor = (idx: number) => TOP + ((BOT - TOP) * idx) / 25;
  const A0 = "A".charCodeAt(0);
  const idxOf = (ch: string) => ch.charCodeAt(0) - A0;

  // Decode trace into letter indices at each column boundary.
  // trace order produced by encryptLetter:
  //   0: Plugboard in       (in -> pb)
  //   1..3: Rotor pass forward (R, M, L)
  //   4: Reflector
  //   5..7: Rotor pass back (L, M, R) — note: shown as III, II, I labels
  //   8: Plugboard out
  let letters: string[] = [];
  if (trace.length >= 9) {
    letters = [
      trace[0].from, // typed letter (IN)
      trace[0].to,   // after plugboard
      trace[1].to,   // after R
      trace[2].to,   // after M
      trace[3].to,   // after L
      trace[4].to,   // after reflector
      // back path: trace[5].to is after L (back), [6].to after M, [7].to after R
      trace[5].to,
      trace[6].to,
      trace[7].to,
      trace[8].to,   // final lamp
    ];
  }

  // Build forward & back path point sets in viewBox coords.
  // Forward goes IN(0) -> PB(1) -> R(2) -> M(3) -> L(4) -> UKW(5)
  // Back goes UKW(5) -> L(4) -> M(3) -> R(2) -> PB(1) -> OUT (back to col 0)
  const fwdPts: [number, number][] = letters.length
    ? [
        [xFor(0), yFor(idxOf(letters[0]))],
        [xFor(1), yFor(idxOf(letters[1]))],
        [xFor(2), yFor(idxOf(letters[2]))],
        [xFor(3), yFor(idxOf(letters[3]))],
        [xFor(4), yFor(idxOf(letters[4]))],
        [xFor(5), yFor(idxOf(letters[5]))],
      ]
    : [];
  const bckPts: [number, number][] = letters.length
    ? [
        [xFor(5), yFor(idxOf(letters[5]))],
        [xFor(4), yFor(idxOf(letters[6]))],
        [xFor(3), yFor(idxOf(letters[7]))],
        [xFor(2), yFor(idxOf(letters[8]))],
        [xFor(1), yFor(idxOf(letters[9]))],
        [xFor(0), yFor(idxOf(letters[9]))],
      ]
    : [];

  const polyline = (pts: [number, number][]) =>
    pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // Total length of a polyline in pixel-space (for stroke-dashoffset animation)
  const pathLength = (pts: [number, number][]) => {
    let l = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      l += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.round(l);
  };

  // Active letter highlights per column
  const activeIdx = letters.length ? letters.map(idxOf) : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Column headers */}
      {["IN", "PB", "I", "II", "III", "UKW"].map((label, i) => (
        <text
          key={label + i}
          x={xFor(i)}
          y={10}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ font: "600 8px ui-monospace, monospace", letterSpacing: "0.1em" }}
        >
          {label}
        </text>
      ))}

      {/* Vertical rails: 26 letter contacts per column */}
      {COLS.map((_, ci) => (
        <g key={ci}>
          <line
            x1={xFor(ci)}
            x2={xFor(ci)}
            y1={TOP}
            y2={BOT}
            stroke="hsl(var(--border))"
            strokeWidth={ci === 0 ? 0 : 1}
            opacity={0.6}
          />
          {ci > 0 &&
            ALPHA.split("").map((l, li) => {
              const isHot =
                activeIdx.length > 0 &&
                ((ci === 1 && (li === activeIdx[1] || li === activeIdx[9])) ||
                  (ci === 2 && (li === activeIdx[2] || li === activeIdx[8])) ||
                  (ci === 3 && (li === activeIdx[3] || li === activeIdx[7])) ||
                  (ci === 4 && (li === activeIdx[4] || li === activeIdx[6])) ||
                  (ci === 5 && li === activeIdx[5]));
              return (
                <circle
                  key={l}
                  cx={xFor(ci)}
                  cy={yFor(li)}
                  r={isHot ? 2.4 : 1.1}
                  fill={isHot ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  opacity={isHot ? 1 : 0.35}
                />
              );
            })}
        </g>
      ))}

      {/* Letter labels on outer rails (IN + UKW) */}
      {ALPHA.split("").map((l, li) => (
        <g key={"lbl" + l}>
          <text
            x={xFor(0) - 4}
            y={yFor(li) + 2}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ font: "500 6.5px ui-monospace, monospace" }}
            opacity={activeIdx[0] === li || activeIdx[9] === li ? 1 : 0.45}
          >
            {l}
          </text>
        </g>
      ))}

      {/* --- animated stroke-dashoffset draw effect --- */}
      <style>{`
        @keyframes enigmaDraw { from { stroke-dashoffset: var(--enigma-len); } to { stroke-dashoffset: 0; } }
      `}</style>

      {/* Forward path (gold) — draws left → right */}
      {fwdPts.length > 0 && (() => {
        const len = pathLength(fwdPts);
        const d = pointsToPath(fwdPts);
        return (
          <g key={`fwd-${animKey.current}`}>
            <polyline
              points={polyline(fwdPts)}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.95}
              style={{
                ["--enigma-len" as any]: len,
                strokeDasharray: len,
                strokeDashoffset: len,
                animation: `enigmaDraw 480ms cubic-bezier(0.4,0,0.2,1) forwards`,
                filter: "drop-shadow(0 0 3px hsl(var(--primary) / 0.5))",
              }}
            />
            {/* Hidden motion path + glowing electron */}
            <path id={`fwd-path-${animKey.current}`} d={d} fill="none" stroke="none" />
            <circle r={3.6} fill="hsl(var(--primary))" opacity={0.95}
              style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}>
              <animateMotion dur="480ms" begin="0s" fill="freeze" rotate="auto" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href={`#fwd-path-${animKey.current}`} />
              </animateMotion>
              {/* Fade out at the end so the dot doesn't sit on the reflector */}
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="480ms" begin="0s" fill="freeze" />
            </circle>
          </g>
        );
      })()}
      {/* Back path (cyan) — draws right → left, after the forward pass */}
      {bckPts.length > 0 && (() => {
        const len = pathLength(bckPts);
        const d = pointsToPath(bckPts);
        return (
          <g key={`bck-${animKey.current}`}>
            <polyline
              points={polyline(bckPts)}
              fill="none"
              stroke="#00bcd4"
              strokeWidth={1.8}
              strokeDasharray={`${len}`}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.95}
              style={{
                ["--enigma-len" as any]: len,
                strokeDashoffset: len,
                animation: `enigmaDraw 480ms cubic-bezier(0.4,0,0.2,1) 420ms forwards`,
                filter: "drop-shadow(0 0 3px #00bcd4aa)",
              }}
            />
            <path id={`bck-path-${animKey.current}`} d={d} fill="none" stroke="none" />
            <circle r={3.6} fill="#00bcd4" opacity={0}
              style={{ filter: "drop-shadow(0 0 6px #00bcd4)" }}>
              <animateMotion dur="480ms" begin="0.42s" fill="freeze" rotate="auto" keyTimes="0;1" keySplines="0.4 0 0.2 1" calcMode="spline">
                <mpath href={`#bck-path-${animKey.current}`} />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="480ms" begin="0.42s" fill="freeze" />
            </circle>
          </g>
        );
      })()}

      {/* IN / OUT letter chips */}
      {letters.length > 0 && (
        <>
          <text
            x={xFor(0) - 4}
            y={yFor(idxOf(letters[0])) - 6}
            textAnchor="end"
            className="fill-primary"
            style={{ font: "700 9px ui-monospace, monospace" }}
          >
            {letters[0]} ▶
          </text>
          <text
            x={xFor(0) - 4}
            y={yFor(idxOf(letters[9])) + 12}
            textAnchor="end"
            style={{ font: "700 9px ui-monospace, monospace", fill: "#00bcd4" }}
          >
            ◀ {letters[9]}
          </text>
        </>
      )}

      {/* Empty-state hint */}
      {letters.length === 0 && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ font: "500 9px ui-monospace, monospace" }}
        >
          —
        </text>
      )}

      {/* Legend */}
      <g transform={`translate(${W - 110}, ${H - 18})`}>
        <line x1={0} x2={14} y1={0} y2={0} stroke="hsl(var(--primary))" strokeWidth={1.6} />
        <text x={18} y={3} className="fill-muted-foreground" style={{ font: "500 7px ui-monospace, monospace" }}>
          forward
        </text>
        <line x1={56} x2={70} y1={0} y2={0} stroke="#00bcd4" strokeWidth={1.6} strokeDasharray="3 2" />
        <text x={74} y={3} className="fill-muted-foreground" style={{ font: "500 7px ui-monospace, monospace" }}>
          back
        </text>
      </g>
    </svg>
  );
}

/* ------------------------------ Lampboard -------------------------------- */
function Lamp({ letter, lit }: { letter: string; lit: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-all duration-150 ${
        lit
          ? "border-primary bg-primary/30 text-primary shadow-[0_0_14px_hsl(var(--primary)/0.85)]"
          : "border-muted bg-muted/20 text-muted-foreground/60"
      }`}
    >
      {letter}
    </div>
  );
}

/* ------------------------------- Page ------------------------------------ */
export default function EnigmaPage() {
  const { language } = useLanguage();
  const t = STR[language as keyof typeof STR] ?? STR.en;

  const [rotors, setRotors] = useState<[RotorState, RotorState, RotorState]>([
    { name: "I",   position: 0, ring: 0 },
    { name: "II",  position: 0, ring: 0 },
    { name: "III", position: 0, ring: 0 },
  ]);
  const [reflector, setReflector] = useState<ReflectorName>("B");
  const [plugboard, setPlugboard] = useState("AV BS CG DL FU HZ IN KM OW RX");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [lit, setLit] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [showLab, setShowLab] = useState(true);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const litTimer = useRef<number | null>(null);
  const playClick = useRotorClick(muted);

  const cfg: EnigmaConfig = useMemo(
    () => ({ rotors, reflector, plugboard }),
    [rotors, reflector, plugboard]
  );

  // Track native fullscreen state (user may exit with Esc)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Show 3-step intro on first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(INTRO_KEY)) setShowIntro(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  const closeIntro = useCallback(() => {
    setShowIntro(false);
    try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* noop */ }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      rootRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  const press = useCallback(
    (letter: string) => {
      const ch = letter.toUpperCase();
      if (!/^[A-Z]$/.test(ch)) return;
      const before = rotors;
      const result = encryptLetter(ch, { rotors, reflector, plugboard });
      setRotors(result.rotors);
      setInput((s) => (s + ch).slice(-200));
      setOutput((s) => (s + result.output).slice(-200));
      setTrace(result.trace);
      setLit(result.output);
      // Count how many rotors stepped — each step = a click (slightly louder if multiple)
      const steps = result.rotors.reduce(
        (n, r, i) => n + (r.position !== before[i].position ? 1 : 0),
        0
      );
      if (steps > 0) playClick(steps === 1 ? 1 : steps === 2 ? 1.25 : 1.5);
      if (litTimer.current) window.clearTimeout(litTimer.current);
      litTimer.current = window.setTimeout(() => setLit(null), 220);
    },
    [rotors, reflector, plugboard, playClick]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      }
    },
    [press]
  );

  const setRotorName = (idx: 0 | 1 | 2, name: RotorName) =>
    setRotors((r) => {
      const next = [...r] as [RotorState, RotorState, RotorState];
      next[idx] = { ...next[idx], name };
      return next;
    });

  const setRotorPos = (idx: 0 | 1 | 2, pos: number) =>
    setRotors((r) => {
      const next = [...r] as [RotorState, RotorState, RotorState];
      next[idx] = { ...next[idx], position: ((pos % 26) + 26) % 26 };
      return next;
    });

  const setRotorRing = (idx: 0 | 1 | 2, ring: number) =>
    setRotors((r) => {
      const next = [...r] as [RotorState, RotorState, RotorState];
      next[idx] = { ...next[idx], ring: ((ring % 26) + 26) % 26 };
      return next;
    });

  const reset = () => {
    setInput("");
    setOutput("");
    setTrace([]);
    setLit(null);
  };

  return (
    <>
      <PageMeta title={t.title} description={t.desc} />
      <div
        ref={rootRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="h-[100svh] w-full flex flex-col overflow-hidden outline-none bg-background"
      >
        {/* Header — compact, single row */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.back}</span>
            </Link>
            <span className="hidden md:inline font-mono text-xs uppercase tracking-[0.3em] text-primary/80 truncate">
              Chiffriermaschine · Enigma I
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowIntro(true)}
              title={t.introTitle}
              className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.introTitle}</span>
            </button>
            <button
              onClick={() => setMuted((m) => !m)}
              title={`${t.sound}: ${muted ? t.muteOn : t.muteOff}`}
              className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{muted ? t.muteOn : t.muteOff}</span>
            </button>
            <button
              onClick={() => setShowLab((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {showLab ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{showLab ? t.hideLab : t.showLab}</span>
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? t.exitFullscreen : t.fullscreen}
              className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
            </button>
          </div>
        </div>

        {/* Body — fills remaining viewport */}
        <div className={`flex-1 min-h-0 grid gap-3 p-3 sm:p-4 ${showLab ? "lg:grid-cols-[1fr_340px]" : ""}`}>
          {/* ----- Machine ------------------------------------------------ */}
          <div
            className="relative rounded-xl border-2 border-primary/30 p-3 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-y-auto"
            style={{
              background:
                "linear-gradient(180deg, #3a2a14 0%, #2a1d0a 35%, #221808 100%)",
            }}
          >
            {/* Rotor windows */}
            <div className="rounded-lg border border-primary/30 bg-black/40 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.rotors}
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {([0, 1, 2] as const).map((i) => (
                  <RotorWindow
                    key={i}
                    rotor={rotors[i]}
                    label={["L", "M", "R"][i]}
                    onChangePos={(d) => {
                      setRotorPos(i, rotors[i].position + d);
                      playClick(0.7);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Lampboard */}
            <div className="mt-3 rounded-lg border border-primary/30 bg-black/40 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.lampboard}
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {QWERTZ.map((row, ri) => (
                  <div
                    key={ri}
                    className="flex gap-1.5"
                    style={{ marginLeft: ri === 1 ? 16 : 0 }}
                  >
                    {row.map((l) => (
                      <Lamp key={l} letter={l} lit={lit === l} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard */}
            <div className="mt-3 rounded-lg border border-primary/30 bg-black/40 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {t.keyboard} <span className="ml-2 normal-case tracking-normal text-muted-foreground/70">— {t.clickHint}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {QWERTZ.map((row, ri) => (
                  <div
                    key={ri}
                    className="flex gap-1.5"
                    style={{ marginLeft: ri === 1 ? 16 : 0 }}
                  >
                    {row.map((l) => (
                      <button
                        key={l}
                        onClick={() => press(l)}
                        className="h-9 w-9 rounded-full border border-primary/40 bg-gradient-to-b from-zinc-700 to-zinc-900 font-mono text-sm font-semibold text-primary shadow-[inset_0_-2px_2px_rgba(0,0,0,0.6),0_2px_3px_rgba(0,0,0,0.5)] hover:from-zinc-600 hover:to-zinc-800 active:translate-y-px transition-all"
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="mt-3 grid gap-3 rounded-lg border border-primary/30 bg-black/40 p-3 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.setup}
                </div>
                {/* Column headers */}
                <div className="mb-1 grid grid-cols-[1rem_1fr_1fr_1fr] gap-2 text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  <span />
                  <span className="flex items-center gap-1">{t.rotorChoice}<HelpDot text={t.rotorChoiceHelp} /></span>
                  <span className="flex items-center gap-1">{t.pos}<HelpDot text={t.posHelp} /></span>
                  <span className="flex items-center gap-1">{t.ring}<HelpDot text={t.ringHelp} /></span>
                </div>
                <div className="space-y-2">
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="grid grid-cols-[1rem_1fr_1fr_1fr] items-center gap-2 text-xs">
                      <span className="w-4 font-mono text-muted-foreground">{["L", "M", "R"][i]}</span>
                      <select
                        value={rotors[i].name}
                        onChange={(e) => setRotorName(i, e.target.value as RotorName)}
                        className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
                      >
                        {(Object.keys(ROTORS) as RotorName[]).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <select
                        value={rotors[i].position}
                        onChange={(e) => setRotorPos(i, Number(e.target.value))}
                        className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
                        title={t.pos}
                      >
                        {ALPHA.split("").map((l, idx) => (
                          <option key={l} value={idx}>{l}</option>
                        ))}
                      </select>
                      <select
                        value={rotors[i].ring}
                        onChange={(e) => setRotorRing(i, Number(e.target.value))}
                        className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
                        title={t.ring}
                      >
                        {ALPHA.split("").map((l, idx) => (
                          <option key={l} value={idx}>
                            {String(idx + 1).padStart(2, "0")} · {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.reflector}
                    <HelpDot text={t.reflectorHelp} />
                  </div>
                  <div className="flex gap-2">
                    {(Object.keys(REFLECTORS) as ReflectorName[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setReflector(r)}
                        className={`rounded border px-3 py-1 font-mono text-xs transition-colors ${
                          reflector === r
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        UKW-{r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.plugboard}
                    <HelpDot text={t.plugboardHelp} />
                  </div>
                  <input
                    value={plugboard}
                    onChange={(e) => setPlugboard(e.target.value.toUpperCase())}
                    spellCheck={false}
                    className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-xs uppercase tracking-wider"
                    placeholder="AB CD EF"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{t.plugboardHint}</p>
                </div>
              </div>
            </div>

            {/* I/O */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-primary/30 bg-black/40 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.input}
                </div>
                <div className="font-mono text-sm text-foreground/90 break-all min-h-[1.5rem]">
                  {input || "—"}
                </div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-black/40 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.output}
                  </span>
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {t.clear}
                  </button>
                </div>
                <div className="font-mono text-sm text-primary break-all min-h-[1.5rem]">
                  {output ? output.match(/.{1,5}/g)?.join(" ") : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ----- Lab Panel — visual wiring diagram --------------------- */}
          {showLab && (
            <aside className="rounded-xl border border-primary/30 bg-card/60 p-3 backdrop-blur overflow-hidden flex flex-col">
              <h2 className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {t.lab}
              </h2>
              <div className="flex-1 min-h-0 mt-2">
                <WiringDiagram trace={trace} cfg={cfg} />
              </div>
            </aside>
          )}
        </div>
        {showIntro && <IntroOverlay t={t} onClose={closeIntro} />}
      </div>
    </>
  );
}
