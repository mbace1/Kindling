import { useEffect, useMemo, useState } from "react";
import { assetSrc } from "@/lib/kindling/model";
import { cn } from "@/lib/utils";

type EmberMode = "walk" | "happy";

type Props = {
  mode: EmberMode;
  className?: string;
};

const WALK_SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const HAPPY_SEQUENCE = [0, 2, 4, 6, 8, 10, 12, 14, 12, 10, 8, 6, 4, 2];

export function EmberAtlasSprite({ mode, className }: Props) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sequence = useMemo(() => (mode === "walk" ? WALK_SEQUENCE : HAPPY_SEQUENCE), [mode]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    if (reduced) return;
    const ms = mode === "walk" ? 100 : 120;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % sequence.length), ms);
    return () => window.clearInterval(timer);
  }, [mode, reduced, sequence.length]);

  const frame = sequence[step % sequence.length] ?? 0;
  const col = frame % 8;
  const row = Math.floor(frame / 8);

  return (
    <span
      aria-hidden="true"
      className={cn("block bg-contain bg-no-repeat [image-rendering:pixelated]", mode === "happy" && "origin-bottom animate-[pulse_900ms_ease-in-out_infinite]", className)}
      style={{
        backgroundImage: `url(${assetSrc("art/ember-idle-atlas.png")})`,
        backgroundSize: "800% 200%",
        backgroundPosition: `${(col / 7) * 100}% ${row * 100}%`,
      }}
    />
  );
}
