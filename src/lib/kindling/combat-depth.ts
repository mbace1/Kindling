import {
  SPECIES,
  STAGES,
  stageOfCompanion,
  type CombatVerb,
  type Companion,
  type Species,
  type SpeciesId,
} from "./model";
import { counterTo } from "./gameplay-rules";

export const NERVE_MAX = 3;

export type CombatPattern = "steady" | "charging" | "feint";

export type EnemyArchetype = {
  id: string;
  label: string;
  regionHint: string;
  chargeChance: number;
  feintChance: number;
  preferredHeavy: CombatVerb;
};

export type CompanionSkillUnlock = {
  id: string;
  name: string;
  unlockRank: number;
  summary: string;
};

export type DepthRoundInput = {
  player: CombatVerb;
  telegraph: CombatVerb;
  pattern: CombatPattern;
  chargeVerb: CombatVerb | null;
  nerve: number;
  nerveMax: number;
  pc: Species["combat"];
  ec: Species["combat"];
  companion?: Companion | null;
};

export type DepthRoundResult = {
  pDmg: number;
  eDmg: number;
  countered: boolean;
  interrupted: boolean;
  feinted: boolean;
  strained: boolean;
  nextNerve: number;
  beatLines: string[];
};

const REGION_ARCHETYPE: Record<string, EnemyArchetype> = {
  ruin: {
    id: "ruin-watcher",
    label: "Ruin Watcher",
    regionHint: "Pale trunks hide false openings.",
    chargeChance: 0.18,
    feintChance: 0.28,
    preferredHeavy: "skill",
  },
  forest: {
    id: "root-ambusher",
    label: "Root Ambusher",
    regionHint: "Wet roots wind up a delayed crush.",
    chargeChance: 0.32,
    feintChance: 0.12,
    preferredHeavy: "strike",
  },
  road: {
    id: "banner-warden",
    label: "Banner Warden",
    regionHint: "The keep gathers weight before it falls.",
    chargeChance: 0.38,
    feintChance: 0.08,
    preferredHeavy: "strike",
  },
  ash: {
    id: "cinder-runner",
    label: "Cinder Runner",
    regionHint: "Ash feints and sudden dashes.",
    chargeChance: 0.16,
    feintChance: 0.34,
    preferredHeavy: "skill",
  },
};

const DEFAULT_ARCHETYPE: EnemyArchetype = {
  id: "path-ward",
  label: "Path Ward",
  regionHint: "The road keeps its own rhythm.",
  chargeChance: 0.22,
  feintChance: 0.18,
  preferredHeavy: "skill",
};

export function enemyArchetype(pathId: string): EnemyArchetype {
  return REGION_ARCHETYPE[pathId] ?? DEFAULT_ARCHETYPE;
}

function growthRank(companion: Companion) {
  const stage = stageOfCompanion(companion);
  return Math.max(0, STAGES.findIndex((entry) => entry.id === stage.id));
}

/** Bond/stage unlocks that change the RPS math in a readable way. */
export function companionSkillUnlocks(companion?: Companion | null): CompanionSkillUnlock[] {
  if (!companion) return [];
  const rank = growthRank(companion);
  const all: CompanionSkillUnlock[] = [];
  switch (companion.species) {
    case "ember":
      all.push({
        id: "hearth-focus",
        name: "Hearth Focus",
        unlockRank: 1,
        summary: "Skill that answers Guard gains +2 pressure.",
      });
      all.push({
        id: "banked-flare",
        name: "Banked Flare",
        unlockRank: 3,
        summary: "Nerve recovers faster after a clean counter.",
      });
      break;
    case "mossling":
      all.push({
        id: "spore-breath",
        name: "Spore Breath",
        unlockRank: 1,
        summary: "Guard recovers +1 extra Nerve.",
      });
      all.push({
        id: "root-brace",
        name: "Root Brace",
        unlockRank: 3,
        summary: "Counter-Guard vs Strike softens one more point.",
      });
      break;
    case "ashling":
      all.push({
        id: "cinder-step",
        name: "Cinder Step",
        unlockRank: 1,
        summary: "Strike that answers Skill gains +2 pressure.",
      });
      all.push({
        id: "spark-lung",
        name: "Spark Lung",
        unlockRank: 3,
        summary: "Nerve max rises to 4.",
      });
      break;
    case "mossknight":
      all.push({
        id: "toll-guard",
        name: "Toll Guard",
        unlockRank: 1,
        summary: "Guard that answers Strike returns +2 counter damage.",
      });
      all.push({
        id: "stone-patience",
        name: "Stone Patience",
        unlockRank: 3,
        summary: "Interrupting a charge deals +2.",
      });
      break;
  }
  return all.filter((skill) => rank >= skill.unlockRank);
}

export function hasCompanionSkill(companion: Companion | null | undefined, id: string) {
  return companionSkillUnlocks(companion).some((skill) => skill.id === id);
}

export function nerveMaxFor(companion?: Companion | null) {
  if (hasCompanionSkill(companion, "spark-lung")) return NERVE_MAX + 1;
  return NERVE_MAX;
}

export function patternAdvice(pattern: CombatPattern, telegraph: CombatVerb) {
  if (pattern === "charging") {
    return "Strike interrupts the wind-up. Waiting lets the heavy land.";
  }
  if (pattern === "feint") {
    return "The wind-up looks false. Strike catches a feint.";
  }
  return telegraph === "strike"
    ? "Guard breaks the commitment."
    : telegraph === "guard"
      ? "Skill presses through the brace."
      : "Strike interrupts the technique.";
}

export function recommendedCounter(pattern: CombatPattern, telegraph: CombatVerb): CombatVerb {
  if (pattern === "charging" || pattern === "feint") return "strike";
  return counterTo(telegraph);
}

export function patternLabel(pattern: CombatPattern) {
  if (pattern === "charging") return "Charging";
  if (pattern === "feint") return "Feint";
  return "Steady";
}

function rollPattern(archetype: EnemyArchetype, random: () => number): CombatPattern {
  const roll = random();
  if (roll < archetype.chargeChance) return "charging";
  if (roll < archetype.chargeChance + archetype.feintChance) return "feint";
  return "steady";
}

function tendencyTelegraph(tendency: string, roll: number): CombatVerb {
  if (tendency === "guard-heavy") return roll < 0.55 ? "guard" : roll < 0.8 ? "strike" : "skill";
  if (tendency === "quick-striker") return roll < 0.6 ? "strike" : roll < 0.8 ? "skill" : "guard";
  if (tendency === "counterattacker") return roll < 0.5 ? "guard" : roll < 0.8 ? "strike" : "skill";
  return roll < 0.4 ? "skill" : roll < 0.75 ? "strike" : "guard";
}

/** Pick the next enemy presentation: steady telegraph, delayed heavy, or feint. */
export function pickEnemyIntent(
  enemy: SpeciesId,
  pathId: string,
  random: () => number = Math.random,
): { telegraph: CombatVerb; pattern: CombatPattern; chargeVerb: CombatVerb | null } {
  const archetype = enemyArchetype(pathId);
  const tendency = SPECIES[enemy].combat.tendency;
  const pattern = rollPattern(archetype, random);
  if (pattern === "charging") {
    const chargeVerb = archetype.preferredHeavy;
    return { telegraph: chargeVerb, pattern, chargeVerb };
  }
  const telegraph = tendencyTelegraph(tendency, random());
  if (pattern === "feint") {
    return { telegraph, pattern, chargeVerb: null };
  }
  return { telegraph, pattern: "steady", chargeVerb: null };
}

function baseResolve(
  player: CombatVerb,
  enemy: CombatVerb,
  pc: Species["combat"],
  ec: Species["combat"],
) {
  let pDmg = 0;
  let eDmg = 0;
  const pAtk = player === "skill" ? pc.skill : pc.strike;
  const eAtk = enemy === "skill" ? ec.skill : ec.strike;
  if (player === "strike" || player === "skill") {
    eDmg = Math.max(1, pAtk - (enemy === "guard" ? Math.ceil(ec.guard / 2) : 0));
    if (player === "skill") eDmg += 1;
    if (enemy === "guard" && ec.tendency === "counterattacker") pDmg += 2;
  }
  if (enemy === "strike" || enemy === "skill") {
    pDmg += Math.max(1, eAtk - (player === "guard" ? Math.ceil(pc.guard / 2) : 0));
    if (enemy === "skill") pDmg += 1;
  }
  if (player === "guard" && enemy === "strike") pDmg = Math.max(0, pDmg - 2);
  const countered =
    (player === "guard" && enemy === "strike") ||
    (player === "skill" && enemy === "guard") ||
    (player === "strike" && enemy === "skill");
  return { pDmg, eDmg, countered };
}

/**
 * Resolve one duel exchange with Nerve commitment, charge interrupt, feints,
 * and Bond-unlocked companion skills. Does not touch wellness state.
 */
export function resolveDepthRound(input: DepthRoundInput): DepthRoundResult {
  const { player, telegraph, pattern, chargeVerb, nerve, nerveMax, pc, ec, companion } = input;
  const beatLines: string[] = [];
  let strained = false;

  let nextNerve = nerve;
  if (player === "skill") {
    if (nerve <= 0) {
      strained = true;
      beatLines.push("Nerve spent — the technique lands thin.");
    } else {
      nextNerve = nerve - 1;
    }
  }
  if (player === "guard") {
    const bonus = hasCompanionSkill(companion, "spore-breath") ? 2 : 1;
    nextNerve = Math.min(nerveMax, nextNerve + bonus);
    if (bonus > 1) beatLines.push("Spore Breath steadies Nerve.");
  }

  let interrupted = false;
  let feinted = false;
  let enemyVerb: CombatVerb = telegraph;
  let interruptBonus = 0;

  if (pattern === "charging") {
    if (player === "strike") {
      interrupted = true;
      beatLines.push("Strike cuts the wind-up short.");
      if (hasCompanionSkill(companion, "stone-patience")) {
        interruptBonus = 2;
        beatLines.push("Stone Patience punishes the charge.");
      }
    } else {
      enemyVerb = chargeVerb ?? telegraph;
      beatLines.push("The delayed heavy lands.");
    }
  } else if (pattern === "feint") {
    feinted = true;
    enemyVerb = telegraph === "strike" ? "skill" : telegraph === "guard" ? "strike" : "guard";
    if (player === "strike") {
      beatLines.push("Strike catches the feint.");
    } else if (player === counterTo(telegraph)) {
      beatLines.push("The read was true for a real blow — the feint slips past.");
    } else {
      beatLines.push("Ash and misdirection.");
    }
  }

  let pDmg = 0;
  let eDmg = 0;
  let countered = false;

  if (pattern === "charging" && interrupted) {
    pDmg = 0;
    eDmg = Math.max(1, pc.strike + interruptBonus);
    countered = true;
  } else {
    const resolved = baseResolve(player, enemyVerb, pc, ec);
    pDmg = resolved.pDmg;
    eDmg = resolved.eDmg;
    countered = resolved.countered;
    if (pattern === "charging" && !interrupted) {
      pDmg += 3;
    }
  }

  if (strained && player === "skill" && eDmg > 0) {
    eDmg = Math.max(1, eDmg - 2);
  }

  if (hasCompanionSkill(companion, "hearth-focus") && player === "skill" && enemyVerb === "guard") {
    eDmg += 2;
    beatLines.push("Hearth Focus burns through the brace.");
  }
  if (hasCompanionSkill(companion, "cinder-step") && player === "strike" && enemyVerb === "skill") {
    eDmg += 2;
    beatLines.push("Cinder Step cuts the technique.");
  }
  if (hasCompanionSkill(companion, "toll-guard") && player === "guard" && enemyVerb === "strike") {
    eDmg += 2;
    beatLines.push("Toll Guard answers the blow.");
  }
  if (hasCompanionSkill(companion, "root-brace") && player === "guard" && enemyVerb === "strike") {
    pDmg = Math.max(0, pDmg - 1);
  }
  if (hasCompanionSkill(companion, "banked-flare") && countered && player !== "guard") {
    nextNerve = Math.min(nerveMax, nextNerve + 1);
  }


  return {
    pDmg,
    eDmg,
    countered: countered || interrupted || (feinted && player === "strike"),
    interrupted,
    feinted,
    strained,
    nextNerve,
    beatLines,
  };
}

export function combatAftermathCopy(args: {
  result: "win" | "lose";
  pathId: string;
  enemy: SpeciesId;
  companionName: string;
}) {
  const region = enemyArchetype(args.pathId);
  const foe = SPECIES[args.enemy].name;
  if (args.result === "win") {
    return {
      journal: `${args.companionName} held the path against ${foe}.`,
      roadEcho: `${region.label} falls quiet. The road remembers the exchange.`,
    };
  }
  return {
    journal: `The road kept ${foe}. ${args.companionName} walked home.`,
    roadEcho: `${region.regionHint} The fire is still there.`,
  };
}

export function intentPanelCopy(args: {
  telegraph: CombatVerb;
  pattern: CombatPattern;
  moveName: string;
  moveTelegraph: string;
}) {
  const advice = patternAdvice(args.pattern, args.telegraph);
  const counter = recommendedCounter(args.pattern, args.telegraph);
  if (args.pattern === "charging") {
    return {
      title: `${args.moveName} · charging`,
      intent: `They gather weight for a delayed ${args.telegraph}.`,
      advice,
      counter,
      pattern: args.pattern,
    };
  }
  if (args.pattern === "feint") {
    return {
      title: `${args.moveName} · feint`,
      intent: `It looks like ${args.telegraph}, but the wind-up feels false.`,
      advice,
      counter,
      pattern: args.pattern,
    };
  }
  return {
    title: args.moveName,
    intent: args.moveTelegraph,
    advice,
    counter,
    pattern: args.pattern,
  };
}
