import { useEffect, useRef, useState } from "react";
import { SPECIES } from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";
import { WORLD_PATHS, pathUnlocked } from "@/lib/kindling/world";

type Celebration = { eyebrow: string; title: string; copy: string };

export function ProgressionCelebration() {
  const s = useKindling();
  const previousRoads = useRef<string[] | null>(null);
  const previousSpecies = useRef<string[] | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  useEffect(() => {
    if (!s.hydrated) return;
    const roads = WORLD_PATHS.filter((path) => pathUnlocked(s, path)).map((path) => path.id);
    const species = [...s.unlocked];

    if (previousRoads.current) {
      const opened = roads.find((id) => !previousRoads.current?.includes(id));
      const path = opened ? WORLD_PATHS.find((entry) => entry.id === opened) : null;
      if (path) setCelebration({ eyebrow: "New road", title: path.displayName, copy: path.worldBlurb });
    }

    if (previousSpecies.current) {
      const openedSpecies = species.find((id) => !previousSpecies.current?.includes(id));
      if (openedSpecies && SPECIES[openedSpecies as keyof typeof SPECIES]) {
        const entry = SPECIES[openedSpecies as keyof typeof SPECIES];
        setCelebration({ eyebrow: "New companion", title: entry.name, copy: "They can now be invited to the fire." });
      }
    }

    previousRoads.current = roads;
    previousSpecies.current = species;
  }, [s.hydrated, s.found.length, s.unlocked.length]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 1850);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  if (!celebration) return null;
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-24 z-[75] mx-auto max-w-sm animate-[kindling-reward-rise_1200ms_ease-out_1] rounded-xl border border-fire/40 bg-night/94 px-4 py-3 text-center shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fire">{celebration.eyebrow}</p>
      <p className="mt-1 font-display text-xl text-bone">{celebration.title}</p>
      <p className="mt-1 text-xs text-bone/65">{celebration.copy}</p>
    </div>
  );
}
