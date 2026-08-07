import { Link } from "react-router-dom";

/** Game-HUD-Kopfzeile: Voxel-Logo, Pixel-Titel, segmentierte Energieleiste, Sound-Toggle. */
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
    <header className="sticky top-0 z-30 border-b-2 border-[#243347] bg-[#0b1119]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span
            aria-hidden
            className="voxel-bevel-gold flex h-9 w-9 flex-shrink-0 items-center justify-center border-2 border-[#ffd23f] bg-[#f5b800] font-pixel text-[11px] text-[#080b10]"
          >
            N
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-pixel text-[12px] text-[#f5b800] sm:text-[15px]">NOTNAGEL</h1>
            <p className="truncate text-[10.5px] text-[#8090a6] sm:text-[11px]">
              BCM-Assistent für Fachbereiche · inside-the-box.org
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
          {step > 0 && (
            <span className="hidden border-2 border-[#00bcd4]/40 bg-[#00bcd4]/10 px-2.5 py-1 font-pixel text-[9px] uppercase text-[#7fdcea] lg:inline">
              Lv {step}/5 · {steps[step - 1]}
            </span>
          )}
          <button
            onClick={onToggleSound}
            aria-label={soundOn ? "Sound ausschalten" : "Sound einschalten"}
            aria-pressed={soundOn}
            className={`voxel-press border-2 px-2.5 py-1.5 text-xs font-semibold transition ${
              soundOn
                ? "border-[#f5b800]/60 bg-[#f5b800]/15 text-[#f5b800]"
                : "border-[#2c3c52] text-[#8090a6] hover:border-[#f5b800]/50 hover:text-[#f5b800]"
            }`}
          >
            {soundOn ? "♪" : "✕♪"}
          </button>
          <button
            onClick={onReset}
            aria-label="Neu starten"
            className="voxel-press border-2 border-[#2c3c52] px-2.5 py-1.5 text-xs font-semibold text-[#c2cfe0] transition hover:border-[#f5b800]/50 hover:text-[#f5b800] sm:px-3"
          >
            ↺<span className="hidden sm:inline"> Neu</span>
          </button>
          <Link
            to="/"
            className="voxel-press border-2 border-[#2c3c52] px-2.5 py-1.5 text-xs font-semibold text-[#c2cfe0] transition hover:border-[#f5b800]/50 hover:text-[#f5b800]"
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
              className={`h-2 flex-1 border ${
                i < step
                  ? "border-[#ffd23f] bg-[#f5b800]"
                  : "border-[#243347] bg-[#101823]"
              }`}
            />
          ))}
        </div>
      )}
    </header>
  );
}

/** Level-Stepper: Voxel-Kacheln statt Pills. */
export function LevelStepper({
  step, steps, onSelect, className = "",
}: {
  step: number;
  steps: string[];
  onSelect: (n: number) => void;
  className?: string;
}) {
  return (
    <ol className={`mb-6 flex items-stretch gap-1.5 overflow-x-auto pb-1 sm:mb-7 ${className}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex min-w-0 flex-shrink-0">
            <button
              onClick={() => onSelect(n)}
              aria-current={active ? "step" : undefined}
              className={`voxel-press flex items-center gap-2 border-2 px-2.5 py-2 transition ${
                active
                  ? "voxel-bevel-gold voxel-glow border-[#ffd23f] bg-[#f5b800] text-[#080b10]"
                  : done
                    ? "voxel-bevel border-[#00bcd4]/45 bg-[#00bcd4]/10 text-[#7fdcea] hover:border-[#f5b800]/60"
                    : "voxel-bevel border-[#243347] bg-[#141c28] text-[#8090a6] hover:border-[#f5b800]/50"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center border font-pixel text-[8px] ${
                  active
                    ? "border-[#080b10]/40 bg-[#080b10]/20 text-[#080b10]"
                    : done
                      ? "border-[#00bcd4]/50 bg-[#00bcd4]/20 text-[#bfeaf2]"
                      : "border-[#2c3c52] bg-[#101823] text-[#8090a6]"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className="font-pixel text-[9px] uppercase sm:text-[10px]">{label}</span>
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
