import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Eye, EyeOff, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
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
    title: "Enigma I — Funktionierender Simulator",
    desc: "Historisch korrekte Wehrmachts-Enigma I mit drei Walzen, Steckerbrett und sichtbarem Signalweg.",
    back: "Zurück",
    setup: "Konfiguration",
    rotors: "Walzen (Links · Mitte · Rechts)",
    reflector: "Reflektor",
    ring: "Ringstellung",
    pos: "Grundstellung",
    plugboard: "Steckerbrett",
    plugboardHint: "Paare durch Leerzeichen, z.B. AV BS CG DL FU HZ IN KM OW RX",
    keyboard: "Tastatur",
    lampboard: "Lampenfeld",
    output: "Ausgabe",
    input: "Eingabe",
    reset: "Zurücksetzen",
    showLab: "Signalweg zeigen",
    hideLab: "Signalweg ausblenden",
    lab: "Signalweg-Labor",
    labHint: "Letzter Tastendruck — vollständiger Pfad durch die Maschine.",
    clear: "Löschen",
    clickHint: "Auf eine Taste klicken oder beliebigen Buchstaben tippen.",
    historyTitle: "Geschichte",
    historyText: "Die Wehrmachts-Enigma I (1930–1945) verschlüsselte mit 3 von 5 Walzen, Steckerbrett und Reflektor. Diese Implementierung folgt der originalen Verdrahtung inkl. Doppelschritt-Anomalie der mittleren Walze.",
    fullscreen: "Vollbild",
    exitFullscreen: "Vollbild beenden",
    sound: "Ton",
    muteOn: "Stumm",
    muteOff: "Aktiv",
  },
  en: {
    title: "Enigma I — Working Simulator",
    desc: "Historically accurate Wehrmacht Enigma I with three rotors, plugboard and live signal path.",
    back: "Back",
    setup: "Configuration",
    rotors: "Rotors (Left · Middle · Right)",
    reflector: "Reflector",
    ring: "Ring setting",
    pos: "Start position",
    plugboard: "Plugboard",
    plugboardHint: "Pairs separated by spaces, e.g. AV BS CG DL FU HZ IN KM OW RX",
    keyboard: "Keyboard",
    lampboard: "Lampboard",
    output: "Output",
    input: "Input",
    reset: "Reset",
    showLab: "Show signal path",
    hideLab: "Hide signal path",
    lab: "Signal Path Lab",
    labHint: "Last keystroke — full electrical journey through the machine.",
    clear: "Clear",
    clickHint: "Click a key or type any letter.",
    historyTitle: "History",
    historyText: "The Wehrmacht Enigma I (1930–1945) encrypted using 3 of 5 rotors, a plugboard and a reflector. This implementation follows the original wiring including the famous double-step anomaly.",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    sound: "Sound",
    muteOn: "Muted",
    muteOff: "On",
  },
  fr: {
    title: "Enigma I — Simulateur fonctionnel",
    desc: "Enigma I de la Wehrmacht historiquement exacte avec trois rotors, tableau de connexions et chemin du signal en direct.",
    back: "Retour",
    setup: "Configuration",
    rotors: "Rotors (Gauche · Milieu · Droite)",
    reflector: "Réflecteur",
    ring: "Réglage anneau",
    pos: "Position initiale",
    plugboard: "Tableau de connexions",
    plugboardHint: "Paires séparées par des espaces, ex. AV BS CG DL FU HZ IN KM OW RX",
    keyboard: "Clavier",
    lampboard: "Tableau lumineux",
    output: "Sortie",
    input: "Entrée",
    reset: "Réinitialiser",
    showLab: "Afficher le chemin du signal",
    hideLab: "Masquer le chemin du signal",
    lab: "Laboratoire du signal",
    labHint: "Dernière frappe — trajet complet à travers la machine.",
    clear: "Effacer",
    clickHint: "Cliquez une touche ou tapez une lettre.",
    historyTitle: "Histoire",
    historyText: "L'Enigma I de la Wehrmacht (1930–1945) chiffrait avec 3 rotors sur 5, un tableau de connexions et un réflecteur. Cette implémentation suit le câblage d'origine, y compris l'anomalie du double pas du rotor central.",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter plein écran",
    sound: "Son",
    muteOn: "Muet",
    muteOff: "Activé",
  },
} as const;

/* QWERTZ layout used on the original Enigma */
const QWERTZ = [
  "QWERTZUIO".split(""),
  "ASDFGHJK".split(""),
  "PYXCVBNML".split(""),
];

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
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.rotors} · {t.pos} / {t.ring}
                </div>
                <div className="space-y-2">
                  {([0, 1, 2] as const).map((i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
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
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.reflector}
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
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.plugboard}
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

          {/* ----- Lab Panel --------------------------------------------- */}
          {showLab && (
            <aside className="rounded-xl border border-primary/30 bg-card/60 p-4 backdrop-blur overflow-y-auto">
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
                {t.lab}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">{t.labHint}</p>
              <div className="mt-3 space-y-1.5">
                {trace.length === 0 ? (
                  <p className="rounded border border-dashed border-border px-3 py-6 text-center font-mono text-xs text-muted-foreground">
                    —
                  </p>
                ) : (
                  trace.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-border bg-background/50 px-3 py-1.5"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </span>
                      <span className="font-mono text-xs">
                        <span className="text-foreground">{s.from}</span>
                        <span className="mx-1.5 text-primary">→</span>
                        <span className="text-primary font-semibold">{s.to}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t.historyTitle}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t.historyText}
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
