import type { SpeciesId } from "./model";

export type CompanionAtlasMode = "walk" | "happy" | "low" | "warm" | "sleep" | "curious" | "hit" | "victory";

export type CompanionAnimationSpec = {
  cols: number;
  rows: number;
  smoothing: boolean;
  sequences: Record<CompanionAtlasMode, readonly number[]>;
  speedMs: Record<CompanionAtlasMode, number>;
  motion: { walkScale: number; tilt: number; victoryLift: number };
};

const EMBER_SEQUENCES: CompanionAnimationSpec["sequences"] = {
  walk: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
  happy: [0, 2, 4, 6, 8, 10, 12, 14, 12, 10, 8, 6, 4, 2],
  low: [11, 12, 13, 12],
  warm: [0, 1, 2, 3, 2, 1],
  sleep: [13, 14, 15, 14],
  curious: [3, 4, 5, 6, 5, 4],
  hit: [11, 12, 11, 13],
  victory: [2, 4, 6, 8, 10, 12, 10, 8, 6, 4],
};

const PACK_SEQUENCES: CompanionAnimationSpec["sequences"] = {
  walk: [8, 9, 10, 11, 12, 13, 12, 11, 10, 9],
  happy: [0, 2, 4, 6, 4, 2],
  low: [14, 15, 14, 15],
  warm: [0, 1, 2, 3, 2, 1],
  sleep: [14, 15, 15, 14],
  curious: [3, 4, 5, 6, 5, 4],
  hit: [14, 15, 14, 13],
  victory: [1, 3, 5, 7, 6, 4, 2, 0],
};

const SPEED: CompanionAnimationSpec["speedMs"] = {
  walk: 95,
  happy: 120,
  low: 260,
  warm: 180,
  sleep: 420,
  curious: 170,
  hit: 90,
  victory: 105,
};

export const COMPANION_ANIMATIONS: Record<SpeciesId, CompanionAnimationSpec> = {
  ember: { cols: 8, rows: 2, smoothing: false, sequences: EMBER_SEQUENCES, speedMs: SPEED, motion: { walkScale: 1, tilt: 1.5, victoryLift: 3 } },
  mossling: { cols: 8, rows: 2, smoothing: true, sequences: PACK_SEQUENCES, speedMs: SPEED, motion: { walkScale: 0.78, tilt: 0.8, victoryLift: 2 } },
  ashling: { cols: 8, rows: 2, smoothing: true, sequences: PACK_SEQUENCES, speedMs: SPEED, motion: { walkScale: 1.35, tilt: 2.4, victoryLift: 5 } },
  mossknight: { cols: 8, rows: 2, smoothing: true, sequences: PACK_SEQUENCES, speedMs: SPEED, motion: { walkScale: 0.58, tilt: 0.4, victoryLift: 1 } },
};

export function animationSpec(species: SpeciesId) {
  return COMPANION_ANIMATIONS[species];
}

export function frameCell(species: SpeciesId, frame: number) {
  const spec = animationSpec(species);
  const safe = Math.max(0, Math.min(spec.cols * spec.rows - 1, frame));
  return { col: safe % spec.cols, row: Math.floor(safe / spec.cols), cols: spec.cols, rows: spec.rows };
}

export function sequenceFor(species: SpeciesId, mode: CompanionAtlasMode) {
  return animationSpec(species).sequences[mode];
}
