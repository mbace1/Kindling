import { useEffect, useRef, useState } from "react";
import { SPECIES, stageOfCompanion } from "@/lib/kindling/model";
import { useKindling } from "@/lib/kindling/store";
import { OLD_GATE, WORLD_PATHS, pathUnlocked } from "@/lib/kindling/world";

type Celebration = { eyebrow: string; title: string; copy: string };

export function ProgressionCelebration() {
  const s = useKindling();
  const previousRoads = useRef<string[] | null>(null);
  const previousSpecies = useRef<string[] | null>(null);
  const previousStage = useRef<string | null>(null);
  const previousEgg = useRef<boolean | null>(null);
  const previousGate = useRef<boolean | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  useEffect(() => {
    if (!s.hydrated) return;
    const roads = WORLD_PATHS.filter((path) => pathUnlocked(s, path)).map((path) => path.id);
    const species = [...s.unlocked];
    const stage = s.companion ? stageOfCompanion(s.companion) : null;
    const hasEgg = Boolean(s.egg);
    const gateOpen = Boolean(s.oldGateOpened);

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

    if (previousStage.current && stage && previousStage.current !== stage.id) {
      setCelebration({
        eyebrow: "Bond stage",
        title: stage.name,
        copy: `${s.companion?.name ?? "Your companion"} hardened into ${stage.name}. Keep remembers the growth.`,
      });
    }

    if (previousEgg.current === false && hasEgg && s.egg) {
      setCelebration({
        eyebrow: "Combine afterglow",
        title: `${SPECIES[s.egg.species].name} egg`,
        copy: `${s.egg.parentAName} and ${s.egg.parentBName} remain. Warmth only gathers in the coals.`,
      });
    }

    if (previousGate.current === false && gateOpen) {
      setCelebration({
        eyebrow: "Path opens",
        title: OLD_GATE.displayName,
        copy: "A next world waits beyond the threshold. The world is the reward.",
      });
    }

    previousRoads.current = roads;
    previousSpecies.current = species;
    previousStage.current = stage?.id ?? null;
    previousEgg.current = hasEgg;
    previousGate.current = gateOpen;
  }, [s.hydrated, s.found.length, s.unlocked.length, s.companion?.id, s.companion?.bondXp, s.egg?.species, s.egg?.parentAName, s.oldGateOpened]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 2100);
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
