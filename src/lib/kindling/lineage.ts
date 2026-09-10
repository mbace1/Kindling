import {
  ASH_TRAITS,
  SPECIES,
  stageOfCompanion,
  type Ancestor,
  type Companion,
  type EggState,
  type KindlingSave,
  type SpeciesId,
  dayKey,
  newId,
} from "./model";

export type AshTraitId = (typeof ASH_TRAITS)[number];

export type AshTraitDef = {
  id: AshTraitId;
  label: string;
  /** Short combat/Journey flavor shown on Keep and hatch. */
  summary: string;
  combatLine: string;
  journeyLine: string;
  combat: { hp: number; strike: number; guard: number; skill: number; speed: number };
  journey: {
    restBondBonus: number;
    restTimeDelta: number;
    investigateTimeDelta: number;
    shortcutTimeDelta: number;
    ambushMultiplier: number;
    ambushGuard: number;
    investigateExtra: boolean;
  };
};

export const ASH_TRAIT_DEFS: Record<AshTraitId, AshTraitDef> = {
  "ember-core": {
    id: "ember-core",
    label: "Ember Core",
    summary: "Heirloom heat that favors Skill and soft rests.",
    combatLine: "+1 Skill on the road",
    journeyLine: "+5 Bond and faster rests",
    combat: { hp: 0, strike: 0, guard: 0, skill: 1, speed: 0 },
    journey: {
      restBondBonus: 5,
      restTimeDelta: -1_000,
      investigateTimeDelta: 0,
      shortcutTimeDelta: 0,
      ambushMultiplier: 1,
      ambushGuard: 0,
      investigateExtra: false,
    },
  },
  "quiet-guard": {
    id: "quiet-guard",
    label: "Quiet Guard",
    summary: "A patient shell — Guard first, ambushes braced.",
    combatLine: "+1 Guard on the road",
    journeyLine: "+2 opening Guard in ambushes",
    combat: { hp: 1, strike: 0, guard: 1, skill: 0, speed: 0 },
    journey: {
      restBondBonus: 0,
      restTimeDelta: 0,
      investigateTimeDelta: 0,
      shortcutTimeDelta: 0,
      ambushMultiplier: 0.9,
      ambushGuard: 2,
      investigateExtra: false,
    },
  },
  "quick-spark": {
    id: "quick-spark",
    label: "Quick Spark",
    summary: "A restless pace — Strike and shortcuts lean forward.",
    combatLine: "+1 Strike · +1 Speed",
    journeyLine: "Faster shortcuts, softer ambush odds",
    combat: { hp: 0, strike: 1, guard: 0, skill: 0, speed: 1 },
    journey: {
      restBondBonus: 0,
      restTimeDelta: 0,
      investigateTimeDelta: 0,
      shortcutTimeDelta: -2_000,
      ambushMultiplier: 0.85,
      ambushGuard: 0,
      investigateExtra: false,
    },
  },
  "moss-memory": {
    id: "moss-memory",
    label: "Moss Memory",
    summary: "Notices what the road still holds.",
    combatLine: "+1 Skill · +1 Vitality",
    journeyLine: "Faster investigates; may uncover extra",
    combat: { hp: 1, strike: 0, guard: 0, skill: 1, speed: 0 },
    journey: {
      restBondBonus: 0,
      restTimeDelta: 0,
      investigateTimeDelta: -2_000,
      shortcutTimeDelta: 0,
      ambushMultiplier: 1,
      ambushGuard: 0,
      investigateExtra: true,
    },
  },
};

export function isAshTraitId(value: string | undefined | null): value is AshTraitId {
  return !!value && (ASH_TRAITS as readonly string[]).includes(value);
}

export function ashTraitDef(trait?: string | null): AshTraitDef | null {
  if (!isAshTraitId(trait)) return null;
  return ASH_TRAIT_DEFS[trait];
}

export function ashTraitLabel(trait?: string | null) {
  return ashTraitDef(trait)?.label ?? (trait ? trait : null);
}

export function ashTraitSummary(trait?: string | null) {
  const def = ashTraitDef(trait);
  if (!def) return null;
  return `${def.summary} ${def.combatLine}. ${def.journeyLine}.`;
}

const CHILD_STEMS: Record<SpeciesId, string[]> = {
  ember: ["Coal", "Hearth", "Glow", "Brand", "Kindle"],
  mossling: ["Fern", "Lichen", "Root", "Moss", "Thicket"],
  ashling: ["Cinder", "Spark", "Soot", "Flick", "Emberling"],
  mossknight: ["Toll", "Ward", "Bastion", "Keep", "Rook"],
};

function stableIndex(seed: string, mod: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, mod);
}

/** Named hatchling from egg parents — not a bare species dump. */
export function nameHatchedChild(species: SpeciesId, parentAName: string, parentBName: string) {
  const stems = CHILD_STEMS[species];
  const idx = stableIndex(`${parentAName}|${parentBName}|${species}`, stems.length);
  return stems[idx];
}

export function hatchCompanionFromEgg(egg: EggState): Companion {
  const trait = egg.trait && isAshTraitId(egg.trait) ? egg.trait : egg.trait;
  const name = nameHatchedChild(egg.species, egg.parentAName, egg.parentBName);
  return {
    id: newId("c"),
    species: egg.species,
    name,
    born: dayKey(),
    bondXp: 0,
    trait,
    parentAId: egg.parentAId,
    parentBId: egg.parentBId,
    parentAName: egg.parentAName,
    parentBName: egg.parentBName,
  };
}

/** Living elder currently in the pack (roster), if any. */
export function packElder(roster: Companion[]): Companion | null {
  let best: Companion | null = null;
  for (const c of roster) {
    if (stageOfCompanion(c).id !== "elder") continue;
    if (!best || c.bondXp > best.bondXp) best = c;
  }
  return best;
}

export type LineageRoadModifier = {
  elderName: string;
  elderId: string;
  restBondBonus: number;
  ambushMultiplier: number;
  restTimeDelta: number;
  summary: string;
};

/** Soft Journey blessing when an elder walks in the pack. Never wellness. */
export function lineageRoadModifier(s: Pick<KindlingSave, "roster">): LineageRoadModifier | null {
  const elder = packElder(s.roster);
  if (!elder) return null;
  return {
    elderName: elder.name,
    elderId: elder.id,
    restBondBonus: 8,
    ambushMultiplier: 0.88,
    restTimeDelta: -1_500,
    summary: `Walking with elder ${elder.name}`,
  };
}

export type FamilyNodeKind = "living" | "egg" | "kindled";

export type FamilyNode = {
  key: string;
  kind: FamilyNodeKind;
  name: string;
  species: SpeciesId;
  stageLabel: string;
  trait?: string;
  parentLine?: string;
  active?: boolean;
  kindledOn?: string;
  bondXp?: number;
};

/** Firelit roster: living pack, warming egg, Kindled family — not a flat dump. */
export function buildFamilyRoster(s: Pick<KindlingSave, "roster" | "companion" | "egg" | "lineage">): {
  living: FamilyNode[];
  egg: FamilyNode | null;
  kindled: FamilyNode[];
} {
  const living: FamilyNode[] = s.roster.map((c) => {
    const stage = stageOfCompanion(c);
    const parentLine =
      c.parentAName && c.parentBName ? `Born of ${c.parentAName} + ${c.parentBName}` : undefined;
    return {
      key: c.id,
      kind: "living" as const,
      name: c.name,
      species: c.species,
      stageLabel: stage.name,
      trait: c.trait,
      parentLine,
      active: c.id === s.companion?.id,
      bondXp: c.bondXp,
    };
  });

  const egg: FamilyNode | null = s.egg
    ? {
        key: `egg-${s.egg.parentAId}-${s.egg.parentBId}`,
        kind: "egg",
        name: `${SPECIES[s.egg.species].name} egg`,
        species: s.egg.species,
        stageLabel: "warming",
        trait: s.egg.trait,
        parentLine: `From ${s.egg.parentAName} + ${s.egg.parentBName}`,
      }
    : null;

  const kindled: FamilyNode[] = s.lineage.map((a: Ancestor) => ({
    key: a.id,
    kind: "kindled" as const,
    name: a.name,
    species: a.species,
    stageLabel: a.stage,
    trait: a.trait,
    kindledOn: a.kindledOn,
    bondXp: a.bondXp,
  }));

  return { living, egg, kindled };
}
