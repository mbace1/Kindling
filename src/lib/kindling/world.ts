import { PATHS, type KindlingSave } from "./model";
import { REGION_CONTENT, regionContent } from "./world-content";

const source = Object.fromEntries(PATHS.map((path) => [path.id, path])) as Record<string, (typeof PATHS)[number]>;

export type WorldPath = (typeof PATHS)[number] & {
  chapter: number;
  displayName: string;
  worldBlurb: string;
  unlockAfter: string | null;
  artDirection: string;
  art: string;
  crop: string;
  ambience: string;
};

// Legacy path ids stay stable for save compatibility. Presentation and region
// metadata live in world-content.ts so new roads do not require component edits.
export const WORLD_PATHS: WorldPath[] = REGION_CONTENT.map((region) => ({
  ...source[region.id],
  chapter: region.chapter,
  displayName: region.displayName,
  worldBlurb: region.worldBlurb,
  unlockAfter: region.unlockAfter,
  artDirection: region.artDirection,
  art: region.art,
  crop: region.crop,
  ambience: region.ambience,
}));

export const OLD_GATE = {
  chapter: 5,
  id: "old-gate",
  displayName: "Old Gate",
  worldBlurb: "Beyond Ashwood, something older closes the road.",
  unlockAfter: "ash",
  artDirection: "monumental ancient gate, distant warm slit of light, forest ending at stone",
  art: "art/ashwood-clean.svg",
} as const;

export { regionContent };

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
