import { Link } from "react-router-dom";

/** Game-HUD-Kopfzeile: Voxel-Logo, Titel, segmentierte Energieleiste, Sound-Toggle. */
export function HudBar({
  step, steps, soundOn, onToggleSound, onReset,
}: {
  step: number;
  steps: string[];
  soundOn: boolean;
  onToggleSound: () => void;
  onReset: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-[#22303f] bg-[#0a1017]/97 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="voxel-bevel-gold flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-[#ffd23f] bg-[#f5b800] font-pixel text-[13px] text-[#0a0e14]"
          >
            N
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold uppercase tracking-[0.16em] text-[#ffd23f] sm:text-xl">
              Notnagel
            </h1>
            <p className="truncate text-[11.5px] text-[#93a4bb]">
              BCM-Assistent für Fachbereiche · inside-the-box.org
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {step > 0 && (
            <span className="hidden border-2 border-[#00bcd4]/45 bg-[#00bcd4]/12 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#9ce6f2] lg:inline">
              Level {step}/5 · {steps[step - 1]}
            </span>
          )}
          <button
            onClick={onToggleSound}
            aria-label={soundOn ? "Sound ausschalten" : "Sound einschalten"}
            aria-pressed={soundOn}
            className={`voxel-press border-2 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] transition ${
              soundOn
                ? "border-[#f5b800]/70 bg-[#f5b800]/15 text-[#ffd23f]"
                : "border-[#33455c] text-[#93a4bb] hover:border-[#f5b800]/60 hover:text-[#ffd23f]"
            }`}
          >
            {soundOn ? "Ton an" : "Ton aus"}
          </button>
          <button
            onClick={onReset}
            aria-label="Neu starten"
            className="voxel-press border-2 border-[#33455c] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#d6e0ee] transition hover:border-[#f5b800]/60 hover:text-[#ffd23f]"
          >
            ↺<span className="hidden sm:inline"> Neu</span>
          </button>
          <Link
            to="/"
            className="voxel-press border-2 border-[#33455c] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#d6e0ee] transition hover:border-[#f5b800]/60 hover:text-[#ffd23f]"
          >
            ←<span className="hidden sm:inline"> zurück</span>
          </Link>
        </div>
      </div>

      {/* Energieleiste: fünf Blöcke = fünf Level */}
      {step > 0 && (
        <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 sm:px-6">
          {steps.map((label, i) => (
            <span
              key={label}
              aria-hidden
              className={`h-2.5 flex-1 border-2 ${
                i < step
                  ? "border-[#ffd23f] bg-[#f5b800]"
                  : "border-[#22303f] bg-[#101823]"
              }`}
            />
          ))}
        </div>
      )}
    </header>
  );
}

/** Level-Stepper: Voxel-Kacheln mit gut lesbaren Labels. */
export function LevelStepper({
  step, steps, onSelect, className = "",
}: {
  step: number;
  steps: string[];
  onSelect: (n: number) => void;
  className?: string;
}) {
  return (
    <ol className={`mb-7 flex items-stretch gap-2 overflow-x-auto pb-1 ${className}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex min-w-0 flex-shrink-0">
            <button
              onClick={() => onSelect(n)}
              aria-current={active ? "step" : undefined}
              className={`voxel-press flex items-center gap-2.5 border-2 px-3 py-2.5 transition ${
                active
                  ? "voxel-bevel-gold border-[#ffd23f] bg-[#f5b800] text-[#0a0e14]"
                  : done
                    ? "voxel-bevel border-[#00bcd4]/50 bg-[#00bcd4]/12 text-[#9ce6f2] hover:border-[#f5b800]/70"
                    : "voxel-bevel border-[#22303f] bg-[#16202e] text-[#93a4bb] hover:border-[#f5b800]/60 hover:text-[#d6e0ee]"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center border-2 font-pixel text-[9px] ${
                  active
                    ? "border-[#0a0e14]/40 bg-[#0a0e14]/20 text-[#0a0e14]"
                    : done
                      ? "border-[#00bcd4]/60 bg-[#00bcd4]/20 text-[#bfeaf2]"
                      : "border-[#33455c] bg-[#101823] text-[#93a4bb]"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className="text-[13px] font-bold uppercase tracking-[0.1em]">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Kurzer Blockraster-Sweep beim Levelwechsel. */
export function LevelSweep({ token }: { token: number }) {
  if (!token) return null;
  return (
    <div key={token} aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div
        className="voxel-sweep absolute inset-y-0 w-1/3"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(245,184,0,0.10) 0 8px, transparent 8px 16px)",
        }}
      />
    </div>
  );
}
