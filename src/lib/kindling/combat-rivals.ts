import type { CombatVerb, Companion, SpeciesId } from "./model";
import { SPECIES } from "./model";
import { hasCompanionSkill, type ChargePhase, type CombatPattern, type EnemyArchetype } from "./combat-depth";

/** Soft rival memory on each road. Never wellness. */
export type RivalStatus = "looming" | "challenged" | "bested";

export type RivalRecord = {
  status: RivalStatus;
  updatedAt: number;
};

export type RivalPhaseDef = {
  label: string;
  /** Multiplier on base species HP for this phase. */
  hpMult: number;
  chargeChance: number;
  feintChance: number;
  preferredHeavy: CombatVerb;
};

export type RoadRival = {
  id: string;
  /** Existing region ids: ruin | forest | road | ash | old-gate | pale | spire */
  pathId: string;
  name: string;
  title: string;
  species: SpeciesId;
  blurb: string;
  phases: RivalPhaseDef[];
  /** Bond skill that softens a later phase when present. */
  pressureSkillId: string | null;
  pressureHint: string;
  loomingLine: string;
  challengedLine: string;
  bestedLine: string;
};

/** One telegraphed keeper per major region — multi-phase, RPS-readable. */
export const ROAD_RIVALS: RoadRival[] = [
  {
    id: "pale-archwarden",
    pathId: "ruin",
    name: "Pale Archwarden",
    title: "Keeper of Birch Ruins",
    species: "mossling",
    blurb: "White trunks hide a patient watcher under the broken arch.",
    phases: [
      { label: "False openings", hpMult: 0.85, chargeChance: 0.12, feintChance: 0.42, preferredHeavy: "skill" },
      { label: "Arch closes", hpMult: 1.05, chargeChance: 0.28, feintChance: 0.22, preferredHeavy: "skill" },
    ],
    pressureSkillId: "hearth-focus",
    pressureHint: "Hearth Focus softens the closing arch.",
    loomingLine: "Pale Archwarden looms beneath the birch arch.",
    challengedLine: "Pale Archwarden still holds Birch Ruins.",
    bestedLine: "Pale Archwarden yielded the birch road.",
  },
  {
    id: "root-sunk-warden",
    pathId: "forest",
    name: "Root-Sunk Warden",
    title: "Keeper of the Drowned Courtyard",
    species: "mossling",
    blurb: "Wet roots gather weight before they crush.",
    phases: [
      { label: "Black water", hpMult: 0.9, chargeChance: 0.34, feintChance: 0.1, preferredHeavy: "strike" },
      { label: "Root crush", hpMult: 1.15, chargeChance: 0.46, feintChance: 0.08, preferredHeavy: "strike" },
    ],
    pressureSkillId: "root-brace",
    pressureHint: "Root Brace softens the drowned crush.",
    loomingLine: "Root-Sunk Warden waits under the courtyard water.",
    challengedLine: "Root-Sunk Warden still claims the flooded court.",
    bestedLine: "Root-Sunk Warden slipped back into the roots.",
  },
  {
    id: "unrung-bellward",
    pathId: "road",
    name: "Unrung Bellward",
    title: "Keeper of Bell Keep",
    species: "mossknight",
    blurb: "The keep gathers weight before the silent bell.",
    phases: [
      { label: "Banner weight", hpMult: 0.75, chargeChance: 0.4, feintChance: 0.06, preferredHeavy: "strike" },
      { label: "Toll withheld", hpMult: 0.95, chargeChance: 0.28, feintChance: 0.18, preferredHeavy: "skill" },
      { label: "Silent peal", hpMult: 1.1, chargeChance: 0.48, feintChance: 0.05, preferredHeavy: "strike" },
    ],
    pressureSkillId: "toll-guard",
    pressureHint: "Toll Guard answers the silent peal.",
    loomingLine: "Unrung Bellward looms under the keep banners.",
    challengedLine: "Unrung Bellward still holds Bell Keep.",
    bestedLine: "Unrung Bellward stepped aside from the banners.",
  },
  {
    id: "cinder-crown",
    pathId: "ash",
    name: "Cinder Crown",
    title: "Keeper of Ashwood",
    species: "ashling",
    blurb: "Ash feints and sudden dashes under a warm crown of dust.",
    phases: [
      { label: "Ash mirage", hpMult: 0.95, chargeChance: 0.12, feintChance: 0.4, preferredHeavy: "skill" },
      { label: "Crown flare", hpMult: 1.2, chargeChance: 0.22, feintChance: 0.36, preferredHeavy: "strike" },
    ],
    pressureSkillId: "cinder-step",
    pressureHint: "Cinder Step cuts through the crown flare.",
    loomingLine: "Cinder Crown looms where the ash still breathes.",
    challengedLine: "Cinder Crown still runs Ashwood.",
    bestedLine: "Cinder Crown cooled. The ash road remembers.",
  },
  {
    id: "threshold-keeper",
    pathId: "old-gate",
    name: "Threshold Keeper",
    title: "Keeper of the Old Gate",
    species: "mossknight",
    blurb: "Something older than the roads still closes the threshold.",
    phases: [
      { label: "Sealed stone", hpMult: 0.85, chargeChance: 0.3, feintChance: 0.12, preferredHeavy: "strike" },
      { label: "Slit of light", hpMult: 1.05, chargeChance: 0.38, feintChance: 0.14, preferredHeavy: "skill" },
      { label: "Threshold holds", hpMult: 1.2, chargeChance: 0.5, feintChance: 0.08, preferredHeavy: "strike" },
    ],
    pressureSkillId: "stone-patience",
    pressureHint: "Stone Patience punishes the threshold charge.",
    loomingLine: "Threshold Keeper looms at the Old Gate.",
    challengedLine: "Threshold Keeper still bars the Old Gate.",
    bestedLine: "Threshold Keeper yielded. The slit of light widens.",
  },
  {
    id: "silver-fenward",
    pathId: "pale",
    name: "Silver Fenward",
    title: "Keeper of Pale Reach",
    species: "mossling",
    blurb: "Pale flats hide a cold watcher under the thin moon.",
    phases: [
      { label: "Frost hush", hpMult: 0.9, chargeChance: 0.2, feintChance: 0.34, preferredHeavy: "skill" },
      { label: "Pale close", hpMult: 1.12, chargeChance: 0.32, feintChance: 0.22, preferredHeavy: "skill" },
    ],
    pressureSkillId: "spore-breath",
    pressureHint: "Spore Breath softens the pale close.",
    loomingLine: "Silver Fenward looms across the pale flats.",
    challengedLine: "Silver Fenward still holds Pale Reach.",
    bestedLine: "Silver Fenward yielded the pale road.",
  },
  {
    id: "unlit-spireward",
    pathId: "spire",
    name: "Unlit Spireward",
    title: "Keeper of Hollow Spire",
    species: "mossknight",
    blurb: "The hollow crown gathers weight before it falls.",
    phases: [
      { label: "Hollow stair", hpMult: 0.88, chargeChance: 0.36, feintChance: 0.1, preferredHeavy: "strike" },
      { label: "Crown wind", hpMult: 1.05, chargeChance: 0.28, feintChance: 0.2, preferredHeavy: "skill" },
      { label: "Unlit peal", hpMult: 1.18, chargeChance: 0.48, feintChance: 0.08, preferredHeavy: "strike" },
    ],
    pressureSkillId: "stone-patience",
    pressureHint: "Stone Patience punishes the unlit peal.",
    loomingLine: "Unlit Spireward looms in the hollow crown.",
    challengedLine: "Unlit Spireward still claims Hollow Spire.",
    bestedLine: "Unlit Spireward stepped aside from the crown.",
  },
];

export function rivalForPath(pathId: string): RoadRival | null {
  return ROAD_RIVALS.find((r) => r.pathId === pathId) ?? null;
}

export function rivalById(id: string | null | undefined): RoadRival | null {
  if (!id) return null;
  return ROAD_RIVALS.find((r) => r.id === id) ?? null;
}

export function rivalStatusLine(rival: RoadRival, status: RivalStatus | undefined | null): string {
  if (status === "bested") return rival.bestedLine;
  if (status === "challenged") return rival.challengedLine;
  return rival.loomingLine;
}

export function rivalStatusLabel(status: RivalStatus | undefined | null): string {
  if (status === "bested") return "Bested";
  if (status === "challenged") return "Challenged";
  return "Looming";
}

export function normalizeRivals(raw: unknown): Record<string, RivalRecord> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, RivalRecord> = {};
  for (const [pathId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    if (!rivalForPath(pathId)) continue;
    const row = entry as Partial<RivalRecord>;
    if (row.status !== "looming" && row.status !== "challenged" && row.status !== "bested") continue;
    out[pathId] = {
      status: row.status,
      updatedAt: Number.isFinite(row.updatedAt) ? Number(row.updatedAt) : 0,
    };
  }
  return out;
}

export function setRivalStatus(
  rivals: Record<string, RivalRecord>,
  pathId: string,
  status: RivalStatus,
  at = Date.now(),
): Record<string, RivalRecord> {
  const prev = rivals[pathId];
  if (prev?.status === "bested" && status !== "bested") return rivals;
  return {
    ...rivals,
    [pathId]: { status, updatedAt: at },
  };
}

/** Ensure unlocked roads show a looming keeper before the first duel. */
export function ensureRivalLooming(
  rivals: Record<string, RivalRecord>,
  pathId: string,
): Record<string, RivalRecord> {
  if (!rivalForPath(pathId)) return rivals;
  if (rivals[pathId]) return rivals;
  return setRivalStatus(rivals, pathId, "looming");
}

export function rivalPhaseHp(rival: RoadRival, phaseIndex: number, pressureSoftened: boolean): number {
  const phase = rival.phases[Math.max(0, Math.min(rival.phases.length - 1, phaseIndex))];
  const base = SPECIES[rival.species].combat.hp;
  let hp = Math.max(8, Math.round(base * phase.hpMult));
  if (pressureSoftened && phaseIndex > 0) {
    hp = Math.max(8, Math.round(hp * 0.82));
  }
  return hp;
}

export function rivalPressureSoftened(rival: RoadRival, companion?: Companion | null): boolean {
  if (!rival.pressureSkillId || !companion) return false;
  return hasCompanionSkill(companion, rival.pressureSkillId);
}

export function rivalArchetypeForPhase(rival: RoadRival, phaseIndex: number): EnemyArchetype {
  const phase = rival.phases[Math.max(0, Math.min(rival.phases.length - 1, phaseIndex))];
  return {
    id: `${rival.id}-p${phaseIndex}`,
    label: `${rival.name} · ${phase.label}`,
    regionHint: rival.title,
    chargeChance: phase.chargeChance,
    feintChance: phase.feintChance,
    preferredHeavy: phase.preferredHeavy === "guard" ? "strike" : phase.preferredHeavy,
  };
}

function tendencyTelegraph(tendency: string, roll: number): CombatVerb {
  if (tendency === "guard-heavy") return roll < 0.55 ? "guard" : roll < 0.8 ? "strike" : "skill";
  if (tendency === "quick-striker") return roll < 0.6 ? "strike" : roll < 0.8 ? "skill" : "guard";
  if (tendency === "counterattacker") return roll < 0.5 ? "guard" : roll < 0.8 ? "strike" : "skill";
  return roll < 0.4 ? "skill" : roll < 0.75 ? "strike" : "guard";
}

/** Rival intent uses the active phase archetype, not the region trash table. */
export function pickRivalIntent(
  rival: RoadRival,
  phaseIndex: number,
  random: () => number = Math.random,
): {
  telegraph: CombatVerb;
  pattern: CombatPattern;
  chargeVerb: CombatVerb | null;
  chargePhase: ChargePhase | null;
} {
  const archetype = rivalArchetypeForPhase(rival, phaseIndex);
  const tendency = SPECIES[rival.species].combat.tendency;
  const roll = random();
  let pattern: CombatPattern = "steady";
  if (roll < archetype.chargeChance) pattern = "charging";
  else if (roll < archetype.chargeChance + archetype.feintChance) pattern = "feint";
  if (pattern === "charging") {
    const chargeVerb = archetype.preferredHeavy;
    return { telegraph: chargeVerb, pattern, chargeVerb, chargePhase: "windup" };
  }
  const telegraph = tendencyTelegraph(tendency, random());
  if (pattern === "feint") {
    return { telegraph, pattern, chargeVerb: null, chargePhase: null };
  }
  return { telegraph, pattern: "steady", chargeVerb: null, chargePhase: null };
}

export function rivalAftermathCopy(args: {
  result: "win" | "lose";
  rival: RoadRival;
  companionName: string;
  phaseLabel?: string;
}) {
  if (args.result === "win") {
    return {
      journal: `${args.companionName} bested ${args.rival.name}. ${args.rival.title} yields.`,
      roadEcho: args.rival.bestedLine,
    };
  }
  return {
    journal: `${args.rival.name} kept the road. ${args.companionName} walked home.`,
    roadEcho: `${args.rival.challengedLine} The fire is still there.`,
  };
}

/** Prefer a keeper duel when the rival is not yet bested. */
export function shouldMeetRival(
  status: RivalStatus | undefined,
  pathClearedAlready: boolean,
  _random: () => number = Math.random,
): boolean {
  if (status === "bested") return false;
  if (status === "challenged" || status === "looming") return true;
  // After the road is known, the keeper steps forward on the next walk.
  // First discovery walk stays a quiet find / ordinary encounter.
  void _random;
  return pathClearedAlready;
}
