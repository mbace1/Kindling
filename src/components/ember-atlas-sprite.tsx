import { useEffect, useMemo, useState } from "react";
import { assetSrc } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

type EmberMode = "walk" | "happy" | "low" | "warm" | "sleep" | "curious";

type Props = {
  mode: EmberMode;
  className?: string;
};

const SEQUENCES: Record<EmberMode, number[]> = {
  walk: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
  happy: [0, 2, 4, 6, 8, 10, 12, 14, 12, 10, 8, 6, 4, 2],
  low: [11, 12, 13, 12],
  warm: [0, 1, 2, 3, 2, 1],
  sleep: [13, 14, 15, 14],
  curious: [3, 4, 5, 6, 5, 4],
};

const SPEED: Record<EmberMode, number> = {
  walk: 95,
  happy: 120,
  low: 260,
  warm: 180,
  sleep: 420,
  curious: 170,
};

export function EmberAtlasSprite({ mode, className }: Props) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sequence = useMemo(() => SEQUENCES[mode], [mode]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    if (reduced) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % sequence.length), SPEED[mode]);
    return () => window.clearInterval(timer);
  }, [mode, reduced, sequence.length]);

  const frame = sequence[step % sequence.length] ?? 0;
  const col = frame % 8;
  const row = Math.floor(frame / 8);
  const walkLift = mode === "walk" && !reduced ? (step % 2 ? -2 : 0) : 0;
  const curiousTilt = mode === "curious" && !reduced ? (step % 3 === 1 ? -2 : 1) : 0;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "block origin-bottom bg-contain bg-no-repeat [image-rendering:pixelated]",
        mode === "happy" && "animate-[pulse_900ms_ease-in-out_infinite]",
        mode === "sleep" && "opacity-90",
        mode === "low" && "opacity-80",
        className,
      )}
      style={{
        backgroundImage: `url(${assetSrc("art/ember-idle-runtime.svg")})`,
        backgroundSize: "800% 200%",
        backgroundPosition: `${(col / 7) * 100}% ${row * 100}%`,
        transform: `translateY(${walkLift}px) rotate(${curiousTilt}deg)`,
      }}
    />
  );
}
