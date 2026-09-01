import { SPECIES, STAGES, stageOfCompanion, type Companion } from "./model";

export type CompanionCombatGrowth = {
  rank: number;
  rankLabel: string;
  hpBonus: number;
  strikeBonus: number;
  guardBonus: number;
  skillBonus: number;
  speedBonus: number;
};

const ROMAN = ["I", "II", "III", "IV", "V"] as const;

function growthRank(companion: Companion) {
  const stage = stageOfCompanion(companion);
  return Math.max(0, STAGES.findIndex((entry) => entry.id === stage.id));
}

export function companionCombatGrowth(companion?: Companion | null): CompanionCombatGrowth | null {
  if (!companion) return null;
  const rank = growthRank(companion);
  const rankLabel = ROMAN[Math.min(rank, ROMAN.length - 1)];

  switch (companion.species) {
    case "ember":
      return {
        rank,
        rankLabel,
        hpBonus: rank * 2,
        strikeBonus: rank,
        guardBonus: rank,
        skillBonus: rank * 2,
        speedBonus: rank,
      };
    case "mossling":
      return {
        rank,
        rankLabel,
        hpBonus: rank * 3,
        strikeBonus: 0,
        guardBonus: rank * 2,
        skillBonus: rank * 2,
        speedBonus: 0,
      };
    case "ashling":
      return {
        rank,
        rankLabel,
        hpBonus: rank,
        strikeBonus: rank * 2,
        guardBonus: 0,
        skillBonus: rank,
        speedBonus: rank * 2,
      };
    case "mossknight":
      return {
        rank,
        rankLabel,
        hpBonus: rank * 4,
        strikeBonus: rank,
        guardBonus: rank * 2,
        skillBonus: 0,
        speedBonus: 0,
      };
  }
}

export function combatStatsForCompanion(companion?: Companion | null) {
  if (!companion) return null;
  const base = SPECIES[companion.species].combat;
  const growth = companionCombatGrowth(companion);
  if (!growth) return { ...base };
  return {
    ...base,
    hp: base.hp + growth.hpBonus,
    strike: base.strike + growth.strikeBonus,
    guard: base.guard + growth.guardBonus,
    skill: base.skill + growth.skillBonus,
    speed: base.speed + growth.speedBonus,
  };
}
