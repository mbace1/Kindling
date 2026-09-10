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
  /** Interim plate — dedicated Old Gate art not required to ship the beat. */
  art: "art/ashwood-clean.svg",
  crop: "62% 42%",
  sealedCopy: "The gate is visible beyond Ashwood. The stone still holds.",
  readyCopy: "Every road behind you answers. The gate will open if you approach.",
  openCopy: "The slit of light widens. A next world waits beyond the threshold — the road itself is the reward.",
  approachLabel: "Approach the Old Gate",
} as const;

export { regionContent };

export function pathCleared(s: Pick<KindlingSave, "found">, pathId: string) {
  return s.found.some((item) => item.from === pathId);
}

export function pathUnlocked(s: Pick<KindlingSave, "found">, path: WorldPath) {
  return path.unlockAfter === null || pathCleared(s, path.unlockAfter);
}

/** Gate looms once Bell Keep is known — Ashwood still waits ahead. */
export function oldGateVisible(s: Pick<KindlingSave, "found">) {
  return pathCleared(s, "road");
}

/**
 * Path opens after Ashwood is known and enough care/Journey progress.
 * Care (kept) and road clears buy the opening — never a streak threat.
 */
export function oldGateReady(s: Pick<KindlingSave, "found" | "kept" | "encounters">) {
  const ashKnown = pathCleared(s, "ash");
  const careProgress = (s.kept ?? 0) >= 5;
  const journeyProgress = (s.encounters?.wins ?? 0) >= 1;
  return ashKnown && (careProgress || journeyProgress);
}

export function oldGateIsOpen(s: Pick<KindlingSave, "oldGateOpened">) {
  return Boolean(s.oldGateOpened);
}

export function worldProgress(s: Pick<KindlingSave, "found" | "oldGateOpened">) {
  const cleared = WORLD_PATHS.filter((path) => pathCleared(s, path.id)).length;
  const gate = oldGateIsOpen(s) ? 1 : 0;
  return { cleared: cleared + gate, total: WORLD_PATHS.length + 1 };
}
