import { useEffect, useMemo, useState } from "react";
import { atlasSrc, type SpeciesId } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

export type CompanionAtlasMode = "walk" | "happy" | "low" | "warm" | "sleep" | "curious" | "hit" | "victory";

type Props = {
  species: SpeciesId;
  mode: CompanionAtlasMode;
  className?: string;
};

const EMBER_SEQUENCES: Record<CompanionAtlasMode, number[]> = {
  walk: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
  happy: [0, 2, 4, 6, 8, 10, 12, 14, 12, 10, 8, 6, 4, 2],
  low: [11, 12, 13, 12],
  warm: [0, 1, 2, 3, 2, 1],
  sleep: [13, 14, 15, 14],
  curious: [3, 4, 5, 6, 5, 4],
  hit: [11, 12, 11, 13],
  victory: [2, 4, 6, 8, 10, 12, 10, 8, 6, 4],
};

const PACK_SEQUENCES: Record<CompanionAtlasMode, number[]> = {
  walk: [8, 9, 10, 11, 12, 13, 12, 11, 10, 9],
  happy: [0, 2, 4, 6, 4, 2],
  low: [14, 15, 14, 15],
  warm: [0, 1, 2, 3, 2, 1],
  sleep: [14, 15, 15, 14],
  curious: [3, 4, 5, 6, 5, 4],
  hit: [14, 15, 14, 13],
  victory: [1, 3, 5, 7, 6, 4, 2, 0],
};

const SPEED: Record<CompanionAtlasMode, number> = {
  walk: 95,
  happy: 120,
  low: 260,
  warm: 180,
  sleep: 420,
  curious: 170,
  hit: 90,
  victory: 105,
};

const SPECIES_MOTION: Record<SpeciesId, { walkScale: number; tilt: number; victoryLift: number }> = {
  ember: { walkScale: 1, tilt: 1.5, victoryLift: 3 },
  mossling: { walkScale: 0.78, tilt: 0.8, victoryLift: 2 },
  ashling: { walkScale: 1.35, tilt: 2.4, victoryLift: 5 },
  mossknight: { walkScale: 0.58, tilt: 0.4, victoryLift: 1 },
};

export function CompanionAtlasSprite({ species, mode, className }: Props) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sequences = species === "ember" ? EMBER_SEQUENCES : PACK_SEQUENCES;
  const sequence = useMemo(() => sequences[mode], [species, mode]);
  const [step, setStep] = useState(0);
  const motion = SPECIES_MOTION[species];

  useEffect(() => {
    setStep(0);
    if (reduced) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % sequence.length), SPEED[mode]);
    return () => window.clearInterval(timer);
  }, [mode, reduced, sequence.length]);

  const frame = sequence[step % sequence.length] ?? 0;
  const col = frame % 8;
  const row = Math.floor(frame / 8);
  const walkLift = mode === "walk" && !reduced ? (step % 2 ? -2 * motion.walkScale : 0) : 0;
  const curiousTilt = mode === "curious" && !reduced ? (step % 3 === 1 ? -motion.tilt : motion.tilt / 2) : 0;
  const hitKick = mode === "hit" && !reduced ? (step % 2 ? -4 : 3) : 0;
  const victoryLift = mode === "victory" && !reduced && step % 2 ? -motion.victoryLift : 0;

  return (
    <span
      aria-hidden="true"
      data-companion-atlas={species}
      data-companion-mode={mode}
      className={cn(
        "block origin-bottom bg-contain bg-no-repeat transition-[filter,opacity]",
        species === "ember" ? "[image-rendering:pixelated]" : "[image-rendering:auto]",
        mode === "happy" && "animate-[pulse_900ms_ease-in-out_infinite]",
        mode === "victory" && "drop-shadow-[0_0_10px_rgba(255,181,78,0.28)]",
        mode === "hit" && "brightness-125 saturate-50",
        mode === "sleep" && "opacity-90",
        mode === "low" && "opacity-80",
        className,
      )}
      style={{
        backgroundImage: `url(${atlasSrc(species)})`,
        backgroundSize: "800% 200%",
        backgroundPosition: `${(col / 7) * 100}% ${row * 100}%`,
        transform: `translateX(${hitKick}px) translateY(${walkLift + victoryLift}px) rotate(${curiousTilt}deg)`,
      }}
    />
  );
}

export function EmberAtlasSprite({ mode, className }: { mode: CompanionAtlasMode; className?: string }) {
  return <CompanionAtlasSprite species="ember" mode={mode} className={className} />;
}
