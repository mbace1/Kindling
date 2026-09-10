import { useEffect, useRef, useState } from "react";
import { CompanionAtlasSprite } from "@/components/ember-atlas-sprite";
import type { Companion, SpeciesId } from "@/lib/kindling/model";
import { SPECIES, portraitSrc } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

type Props = {
  a: Companion;
  b: Companion;
  child: SpeciesId;
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
};

/**
 * DBZ-style fingertip combine beat. Parents remain after the flash —
 * this is presentation only; the store's combine/breed never consumes them.
 */
export function FingerTouchCombine({ a, b, child, open, onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<"approach" | "touch" | "flash" | "settle">("approach");
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (!open) {
      setPhase("approach");
      return;
    }
    setPhase("approach");
    const t1 = window.setTimeout(() => setPhase("touch"), 720);
    const t2 = window.setTimeout(() => setPhase("flash"), 1280);
    const t3 = window.setTimeout(() => setPhase("settle"), 1780);
    const t4 = window.setTimeout(() => completeRef.current(), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${a.name} and ${b.name} combine`}
      className="fixed inset-0 z-[70] grid place-items-center bg-night/92 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-fire/35 bg-gradient-to-b from-coal to-night p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-fire">Combine</p>
        <h2 className="mt-1 text-center font-display text-2xl text-bone">
          Fingertip to fingertip
        </h2>
        <p className="mt-2 text-center text-sm text-mute">
          They reach across the coals. Fusion energy gathers — neither leaves the fire.
        </p>

        <div className="relative mx-auto mt-6 h-44 w-full max-w-sm">
          <div
            className={cn(
              "absolute bottom-2 left-2 transition-transform duration-700 ease-out",
              phase === "approach" && "-translate-x-6",
              (phase === "touch" || phase === "flash" || phase === "settle") && "translate-x-4",
            )}
          >
            <CompanionAtlasSprite species={a.species} mode={phase === "flash" ? "victory" : "curious"} className="h-28 w-28" />
            <p className="mt-1 text-center text-xs text-bone/70">{a.name}</p>
          </div>
          <div
            className={cn(
              "absolute bottom-2 right-2 transition-transform duration-700 ease-out",
              phase === "approach" && "translate-x-6",
              (phase === "touch" || phase === "flash" || phase === "settle") && "-translate-x-4",
            )}
          >
            <CompanionAtlasSprite species={b.species} mode={phase === "flash" ? "victory" : "curious"} className="h-28 w-28 scale-x-[-1]" />
            <p className="mt-1 text-center text-xs text-bone/70">{b.name}</p>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-[42%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fire shadow-[0_0_18px_rgba(255,181,78,0.85)] transition-all duration-500",
              phase === "approach" && "scale-50 opacity-40",
              phase === "touch" && "scale-125 opacity-100",
              phase === "flash" && "scale-[6] opacity-90 animate-[kindling-combine-flare_520ms_ease-out_1]",
              phase === "settle" && "scale-75 opacity-70",
            )}
            aria-hidden
          />
          {(phase === "touch" || phase === "flash") && (
            <div
              className="pointer-events-none absolute inset-x-8 top-[38%] h-px bg-gradient-to-r from-transparent via-fire to-transparent opacity-90 animate-[kindling-combine-beam_700ms_ease-out_1]"
              aria-hidden
            />
          )}
        </div>

        <div className={cn("mt-4 space-y-2 transition-opacity duration-500", phase === "settle" ? "opacity-100" : "opacity-0")}>
          <div className="flex items-center justify-center gap-3">
            <img src={portraitSrc(child)} alt="" className="h-14 w-14 object-contain drop-shadow-[0_0_12px_rgba(255,181,78,0.35)]" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-mute">Settles as</p>
              <p className="font-display text-lg text-fire">{SPECIES[child].name} egg</p>
            </div>
          </div>
          <p className="text-center text-xs text-bone/70">
            {a.name} and {b.name} stay by the fire. Keep holds the coals — warmth only gathers.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 min-h-10 w-full rounded-md border border-ash/70 bg-stone/40 text-sm text-mute"
        >
          Step back
        </button>
      </div>
    </div>
  );
}
