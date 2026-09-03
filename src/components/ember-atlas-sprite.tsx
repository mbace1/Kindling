import { useEffect, useMemo, useState } from "react";
import { atlasSrc, type SpeciesId } from "@/lib/kindling/model";
import { animationSpec, frameCell, sequenceFor, type CompanionAtlasMode } from "@/lib/kindling/companion-animation";
import { cn } from "@/lib/utils";

export type { CompanionAtlasMode } from "@/lib/kindling/companion-animation";

type Props = {
  species: SpeciesId;
  mode: CompanionAtlasMode;
  className?: string;
};

export function CompanionAtlasSprite({ species, mode, className }: Props) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const spec = animationSpec(species);
  const sequence = useMemo(() => sequenceFor(species, mode), [species, mode]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    if (reduced) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % sequence.length), spec.speedMs[mode]);
    return () => window.clearInterval(timer);
  }, [mode, reduced, sequence.length, spec.speedMs]);

  const frame = sequence[step % sequence.length] ?? 0;
  const { col, row, cols, rows } = frameCell(species, frame);
  const motion = spec.motion;
  const walkLift = mode === "walk" && !reduced ? (step % 2 ? -2 * motion.walkScale : 0) : 0;
  const curiousTilt = mode === "curious" && !reduced ? (step % 3 === 1 ? -motion.tilt : motion.tilt / 2) : 0;
  const hitKick = mode === "hit" && !reduced ? (step % 2 ? -4 : 3) : 0;
  const victoryLift = mode === "victory" && !reduced && step % 2 ? -motion.victoryLift : 0;

  return (
    <span
      aria-hidden="true"
      data-companion-atlas={species}
      data-companion-mode={mode}
      data-companion-frame={frame}
      className={cn(
        "block origin-bottom bg-contain bg-no-repeat transition-[filter,opacity]",
        spec.smoothing ? "[image-rendering:auto]" : "[image-rendering:pixelated]",
        mode === "happy" && "animate-[pulse_900ms_ease-in-out_infinite]",
        mode === "victory" && "drop-shadow-[0_0_10px_rgba(255,181,78,0.28)]",
        mode === "hit" && "brightness-125 saturate-50",
        mode === "sleep" && "opacity-90",
        mode === "low" && "opacity-80",
        className,
      )}
      style={{
        backgroundImage: `url(${atlasSrc(species)})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${cols > 1 ? (col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (row / (rows - 1)) * 100 : 0}%`,
        transform: `translateX(${hitKick}px) translateY(${walkLift + victoryLift}px) rotate(${curiousTilt}deg)`,
      }}
    />
  );
}

export function EmberAtlasSprite({ mode, className }: { mode: CompanionAtlasMode; className?: string }) {
  return <CompanionAtlasSprite species="ember" mode={mode} className={className} />;
}
