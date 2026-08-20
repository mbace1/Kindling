import { PATHS, type KindlingSave } from "./model";

const source = Object.fromEntries(PATHS.map((path) => [path.id, path])) as Record<string, (typeof PATHS)[number]>;

export type WorldPath = (typeof PATHS)[number] & {
  chapter: number;
  displayName: string;
  worldBlurb: string;
  unlockAfter: string | null;
  artDirection: string;
  art: string;
  crop: string;
};

// Keep the legacy route ids for save compatibility. The ordered world names are
// the player-facing canon. Each region owns a runtime art slot. Until a region
// receives its own committed environment file, that slot deliberately points at
// the checked-in path fallback so the game never references a missing asset.
export const WORLD_PATHS: WorldPath[] = [
  {
    ...source.ruin,
    chapter: 1,
    displayName: "Birch Ruins",
    worldBlurb: "White trunks, broken arches, and the first road away from the fire.",
    unlockAfter: null,
    artDirection: "cool birch woodland, broken pale stone, open daylight path",
    art: "art/birch-ruins.jpg",
    crop: "50% center",
  },
  {
    ...source.forest,
    chapter: 2,
    displayName: "Drowned Courtyard",
    worldBlurb: "Roots have split the old court. Water sits where people once did.",
    unlockAfter: "ruin",
    artDirection: "wet courtyard, roots and moss, shallow water, overgrown masonry",
    art: "art/path.jpg",
    crop: "54% center",
  },
  {
    ...source.road,
    chapter: 3,
    displayName: "Bell Keep",
    worldBlurb: "A road of old banners climbs toward a bell that no one rings.",
    unlockAfter: "forest",
    artDirection: "ruined keep approach, hanging banners, tower silhouette, windy high path",
    art: "art/path.jpg",
    crop: "60% center",
  },
  {
    ...source.ash,
    chapter: 4,
    displayName: "Ashwood",
    worldBlurb: "Black trees, pale ground, and warmth trapped under the dust.",
    unlockAfter: "road",
    artDirection: "burnt woodland, ash ground, ember traces, open dead-tree path",
    art: "art/path.jpg",
    crop: "42% center",
  },
];

export const OLD_GATE = {
  chapter: 5,
  id: "old-gate",
  displayName: "Old Gate",
  worldBlurb: "Beyond Ashwood, something older closes the road.",
  unlockAfter: "ash",
  artDirection: "monumental ancient gate, distant warm slit of light, forest ending at stone",
  art: "art/path.jpg",
} as const;

export function pathCleared(s: Pick<KindlingSave, "found">, pathId: string) {
  return s.found.some((item) => item.from === pathId);
}

export function pathUnlocked(s: Pick<KindlingSave, "found">, path: WorldPath) {
  return path.unlockAfter === null || pathCleared(s, path.unlockAfter);
}

export function oldGateVisible(s: Pick<KindlingSave, "found">) {
  return pathCleared(s, OLD_GATE.unlockAfter);
}

export function worldProgress(s: Pick<KindlingSave, "found">) {
  const cleared = WORLD_PATHS.filter((path) => pathCleared(s, path.id)).length;
  return { cleared, total: WORLD_PATHS.length + 1 };
}
