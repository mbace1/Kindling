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

const MOSSLING_SEQUENCES: CompanionAnimationSpec["sequences"] = {
  walk: [8, 9, 10, 11, 12, 11, 10, 9],
  happy: [0, 1, 2, 3, 4, 3, 2, 1],
  low: [14, 15, 14, 15],
  warm: [0, 1, 2, 1],
  sleep: [14, 15, 15, 14],
  curious: [2, 3, 4, 5, 4, 3],
  hit: [14, 13, 14, 15],
  victory: [1, 2, 3, 4, 5, 4, 3, 2],
};

const ASHLING_SEQUENCES: CompanionAnimationSpec["sequences"] = {
  walk: [8, 10, 12, 13, 12, 10, 9, 11, 13, 11],
  happy: [0, 2, 4, 6, 7, 5, 3, 1],
  low: [13, 14, 15, 14],
  warm: [0, 2, 1, 3, 2, 1],
  sleep: [14, 15, 14, 15],
  curious: [3, 5, 6, 7, 6, 4],
  hit: [15, 13, 14, 12],
  victory: [0, 3, 5, 7, 6, 4, 2, 1],
};

const MOSS_KNIGHT_SEQUENCES: CompanionAnimationSpec["sequences"] = {
  walk: [8, 9, 10, 11, 10, 9],
  happy: [0, 1, 2, 1, 0, 3, 2, 1],
  low: [14, 15, 15, 14],
  warm: [0, 1, 0, 2, 1, 0],
  sleep: [15, 15, 14, 15],
  curious: [2, 3, 4, 3, 2],
  hit: [14, 15, 14, 13],
  victory: [1, 3, 5, 5, 4, 2, 1],
};

const EMBER_SPEED: CompanionAnimationSpec["speedMs"] = { walk: 88, happy: 112, low: 250, warm: 170, sleep: 410, curious: 155, hit: 78, victory: 92 };
const MOSSLING_SPEED: CompanionAnimationSpec["speedMs"] = { walk: 116, happy: 145, low: 285, warm: 210, sleep: 470, curious: 205, hit: 105, victory: 130 };
const ASHLING_SPEED: CompanionAnimationSpec["speedMs"] = { walk: 76, happy: 96, low: 230, warm: 150, sleep: 390, curious: 135, hit: 72, victory: 82 };
const MOSS_KNIGHT_SPEED: CompanionAnimationSpec["speedMs"] = { walk: 148, happy: 170, low: 320, warm: 245, sleep: 520, curious: 225, hit: 120, victory: 150 };

export const COMPANION_ANIMATIONS: Record<SpeciesId, CompanionAnimationSpec> = {
  ember: { cols: 8, rows: 2, smoothing: false, sequences: EMBER_SEQUENCES, speedMs: EMBER_SPEED, motion: { walkScale: 1, tilt: 1.8, victoryLift: 4 } },
  mossling: { cols: 8, rows: 2, smoothing: true, sequences: MOSSLING_SEQUENCES, speedMs: MOSSLING_SPEED, motion: { walkScale: 0.78, tilt: 0.7, victoryLift: 2 } },
  ashling: { cols: 8, rows: 2, smoothing: true, sequences: ASHLING_SEQUENCES, speedMs: ASHLING_SPEED, motion: { walkScale: 1.35, tilt: 2.8, victoryLift: 6 } },
  mossknight: { cols: 8, rows: 2, smoothing: true, sequences: MOSS_KNIGHT_SEQUENCES, speedMs: MOSS_KNIGHT_SPEED, motion: { walkScale: 0.58, tilt: 0.35, victoryLift: 1 } },
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
