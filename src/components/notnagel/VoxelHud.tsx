/** Game-HUD-Kopfzeile: Voxel-Logo, Titel, Level-Info. Steuerungs-Buttons wandern in die fixe Fußzeile. */
export function HudBar({
  step, steps,
}: {
  step: number;
  steps: string[];
}) {
  return (
    <header className="sticky top-0 z-30 h-14 flex-shrink-0 border-b border-[#22303f] bg-[#0a1017]/95 backdrop-blur sm:h-16">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span
            aria-hidden
            className="voxel-bevel-gold flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-[#ffd23f] bg-[#f5b800] font-pixel text-[11px] text-[#0a0e14] sm:h-9 sm:w-9 sm:text-[12px]"
          >
            N
          </span>
          <div className="min-w-0">
            <h1 className="text-[14px] font-extrabold uppercase leading-tight tracking-[0.16em] text-[#ffd23f] sm:text-[17px]">
              Notnagel
            </h1>
            <p className="truncate text-[10px] leading-tight text-[#7f8fa6] sm:text-[11px]">
              <span className="sm:hidden">BCM-Assistent</span>
              <span className="hidden sm:inline">BCM-Assistent für Fachbereiche · inside-the-box.org</span>
            </p>
          </div>
        </div>

        {step > 0 && (
          <span className="hidden flex-shrink-0 border border-[#00bcd4]/40 bg-[#00bcd4]/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9ce6f2] lg:inline">
            Level {step}/5 · {steps[step - 1]}
          </span>
        )}
      </div>
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
    <ol className={`mb-5 flex items-stretch gap-1.5 overflow-x-auto pb-1 sm:gap-2 ${className}`}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex min-w-0 flex-shrink-0">
            <button
              onClick={() => onSelect(n)}
              aria-current={active ? "step" : undefined}
              aria-label={`Level ${n}: ${label}`}
              className={`voxel-press flex items-center gap-2 border px-2.5 py-2 transition sm:gap-2.5 sm:px-3 ${
                active
                  ? "voxel-bevel-gold border-[#ffd23f] bg-[#f5b800] text-[#0a0e14]"
                  : done
                    ? "voxel-bevel border-[#00bcd4]/45 bg-[#00bcd4]/10 text-[#9ce6f2] hover:border-[#f5b800]/70"
                    : "voxel-bevel border-[#22303f] bg-[#16202e] text-[#7f8fa6] hover:border-[#f5b800]/60 hover:text-[#d6e0ee]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center border font-pixel text-[8px] ${

                  active
                    ? "border-[#0a0e14]/40 bg-[#0a0e14]/20 text-[#0a0e14]"
                    : done
                      ? "border-[#00bcd4]/60 bg-[#00bcd4]/20 text-[#bfeaf2]"
                      : "border-[#33455c] bg-[#101823] text-[#93a4bb]"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`text-[11.5px] font-bold uppercase tracking-[0.14em] ${
                  active ? "" : "hidden sm:inline"
                }`}
              >
                {label}
              </span>


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
