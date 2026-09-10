import { SPECIES, eggReady, eggWarmth, portraitSrc, type KindlingSave } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

type Props = {
  save: KindlingSave;
  onHatch?: () => void;
  compact?: boolean;
};

/**
 * Egg afterglow — warmth only gathers; missed days never cool the coals.
 * Shared by Keep and Pack so accumulation reads the same everywhere.
 */
export function EggWarmthPanel({ save, onHatch, compact = false }: Props) {
  const egg = save.egg;
  if (!egg) return null;
  const warmthNow = eggWarmth(save);
  const ready = eggReady(save);
  const pct = Math.max(6, Math.round((warmthNow / Math.max(1, egg.required)) * 100));

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-fire/40 bg-gradient-to-b from-coal via-night/90 to-night shadow-[0_0_28px_rgba(255,122,42,0.12)]",
        compact ? "p-3" : "p-4",
      )}
      aria-label={`Ember egg warmth ${warmthNow} of ${egg.required}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full bg-fire/25 blur-md animate-[kindling-egg-glow_2.4s_ease-in-out_infinite]"
            aria-hidden
          />
          <img
            src={portraitSrc(egg.species)}
            alt=""
            className={cn(
              "relative object-contain drop-shadow-[0_0_14px_rgba(255,181,78,0.45)]",
              compact ? "h-12 w-12" : "h-16 w-16",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fire">Ember Egg</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-mute">In the coals</p>
          <h3 className={cn("font-display text-bone", compact ? "text-lg" : "mt-0.5 text-xl")}>
            {SPECIES[egg.species].name}
          </h3>
          <p className="text-xs text-mute">
            From {egg.parentAName} + {egg.parentBName}. Both remain by the fire.
          </p>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-full bg-ash/90 p-1 shadow-inner">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-ember via-fire to-[#ffd27a] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-full bg-[linear-gradient(110deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] opacity-40"
          aria-hidden
        />
      </div>

      <div className="mt-2.5 flex gap-1.5" aria-label={`${warmthNow} of ${egg.required} warmth`}>
        {Array.from({ length: egg.required }).map((_, i) => {
          const filled = i < warmthNow;
          const newest = filled && i === warmthNow - 1;
          return (
            <span
              key={i}
              className={cn(
                "h-2.5 flex-1 rounded-full transition-colors duration-500",
                filled ? "bg-fire shadow-[0_0_8px_rgba(255,122,42,0.55)]" : "bg-ash",
                newest && "animate-[kindling-egg-warmth-pulse_1.1s_ease-out_1]",
              )}
            />
          );
        })}
      </div>

      <p className="mt-3 text-sm text-mute">
        {ready
          ? "Warm enough to hatch whenever you are ready."
          : `${warmthNow} / ${egg.required} ordinary care actions warmed the egg. Missed days do not cool it — warmth only gathers.`}
      </p>

      {ready && onHatch ? (
        <button
          type="button"
          onClick={onHatch}
          className="mt-3 min-h-12 w-full rounded-md bg-fire px-4 font-medium text-night"
        >
          Hatch
        </button>
      ) : null}
    </section>
  );
}
