import { BASE_BOND_XP, STAGES, stageOfCompanion, type Companion, type SpeciesId } from "./model";
import { useKindling } from "./store";

export type CompanionJourneyTrait = {
  name: string;
  summary: string;
  rank: number;
  rankLabel: string;
  investigateExtra: boolean;
  investigateTimeDelta: number;
  restBondBonus: number;
  restTimeDelta: number;
  shortcutTimeDelta: number;
  ambushMultiplier: number;
  ambushGuard: number;
};

type BaseTrait = Omit<CompanionJourneyTrait, "rank" | "rankLabel">;

const TRAITS: Record<SpeciesId, BaseTrait> = {
  ember: {
    name: "Hearthsense",
    summary: "Ember settles quickly at safe rests.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 10,
    restTimeDelta: -2_000,
    shortcutTimeDelta: 0,
    ambushMultiplier: 1,
    ambushGuard: 0,
  },
  mossling: {
    name: "Forager",
    summary: "Mossling notices useful things others walk past.",
    investigateExtra: true,
    investigateTimeDelta: -8_000,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: 0,
    ambushMultiplier: 1,
    ambushGuard: 0,
  },
  ashling: {
    name: "Quickstep",
    summary: "Ashling turns shortcuts into fast, evasive routes.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: -10_000,
    ambushMultiplier: 0.5,
    ambushGuard: 0,
  },
  mossknight: {
    name: "Bulwark",
    summary: "Moss Knight is hard to surprise and starts ambushes braced.",
    investigateExtra: false,
    investigateTimeDelta: 0,
    restBondBonus: 0,
    restTimeDelta: 0,
    shortcutTimeDelta: 0,
    ambushMultiplier: 0.35,
    ambushGuard: 4,
  },
};

const ROMAN = ["I", "II", "III", "IV", "V"] as const;

function growthRank(companion: Companion) {
  const stage = stageOfCompanion(companion);
  return Math.max(0, STAGES.findIndex((entry) => entry.id === stage.id));
}

export function journeyTraitForCompanion(companion?: Companion | null): CompanionJourneyTrait | null {
  if (!companion) return null;
  const base = TRAITS[companion.species];
  const rank = growthRank(companion);
  const rankLabel = ROMAN[Math.min(rank, ROMAN.length - 1)];

  if (companion.species === "ember") {
    return {
      ...base,
      name: `${base.name} ${rankLabel}`,
      summary: `${base.summary} Growth adds stronger Bond recovery and faster rests.`,
      rank,
      rankLabel,
      restBondBonus: base.restBondBonus + rank * 5,
      restTimeDelta: base.restTimeDelta - rank * 1_000,
    };
  }

  if (companion.species === "mossling") {
    return {
      ...base,
      name: `${base.name} ${rankLabel}`,
      summary: `${base.summary} Growth makes investigations steadily quicker.`,
      rank,
      rankLabel,
      investigateTimeDelta: base.investigateTimeDelta - rank * 1_500,
    };
  }

  if (companion.species === "ashling") {
    return {
      ...base,
      name: `${base.name} ${rankLabel}`,
      summary: `${base.summary} Growth improves speed and lowers shortcut danger.`,
      rank,
      rankLabel,
      shortcutTimeDelta: base.shortcutTimeDelta - rank * 2_000,
      ambushMultiplier: Math.max(0.2, base.ambushMultiplier - rank * 0.07),
    };
  }

  return {
    ...base,
    name: `${base.name} ${rankLabel}`,
    summary: `${base.summary} Growth deepens its guard and resistance to ambush.`,
    rank,
    rankLabel,
    ambushMultiplier: Math.max(0.15, base.ambushMultiplier - rank * 0.05),
    ambushGuard: base.ambushGuard + rank * 2,
  };
}

export function journeyTraitFor(species?: SpeciesId | null) {
  if (!species) return null;
  const active = useKindling.getState().companion;
  if (active?.species === species) return journeyTraitForCompanion(active);
  const base = TRAITS[species];
  return { ...base, rank: 0, rankLabel: ROMAN[0], name: `${base.name} ${ROMAN[0]}` };
}

export function nextJourneyTraitGrowth(companion?: Companion | null) {
  if (!companion) return null;
  const rank = growthRank(companion);
  const next = STAGES[rank + 1];
  if (!next) return null;
  return {
    stage: next.name,
    bondXp: next.at * BASE_BOND_XP,
    remaining: Math.max(0, next.at * BASE_BOND_XP - companion.bondXp),
  };
}
