import type { CombatVerb, SpeciesId } from "./model";
import { SPECIES } from "./model";

export type CombatMove = {
  verb: CombatVerb;
  name: string;
  beat: string;
  telegraph: string;
};

const MOVES: Record<SpeciesId, Record<CombatVerb, Omit<CombatMove, "verb">>> = {
  ember: {
    strike: { name: "Hearth Strike", beat: "A clean blow of banked heat.", telegraph: "They gather heat for a direct blow." },
    guard: { name: "Coal Ward", beat: "Shoulders set. The fire holds.", telegraph: "They brace behind a shell of coals." },
    skill: { name: "Kindled Arc", beat: "A special flare through the gap.", telegraph: "They coil a bright technique." },
  },
  mossling: {
    strike: { name: "Root Jab", beat: "A patient poke from the undergrowth.", telegraph: "They lean in for a rooted jab." },
    guard: { name: "Bark Shell", beat: "Moss and bark take the hit.", telegraph: "They close into a bark shell." },
    skill: { name: "Spore Veil", beat: "A soft burst that finds the seams.", telegraph: "They prepare a spore technique." },
  },
  ashling: {
    strike: { name: "Cinder Dash", beat: "Fast, reckless, already gone.", telegraph: "They blur into a cinder dash." },
    guard: { name: "Ash Slip", beat: "A sideways skip that softens the blow.", telegraph: "They slip sideways into ash." },
    skill: { name: "Ember Bite", beat: "Teeth of fire, then empty air.", telegraph: "They wind up an ember bite." },
  },
  mossknight: {
    strike: { name: "Stone Edge", beat: "A heavy, honest cut.", telegraph: "They raise a stone edge." },
    guard: { name: "Bulwark", beat: "Nothing gets through clean.", telegraph: "They plant like a wall." },
    skill: { name: "Counter Toll", beat: "The answer comes after the hit.", telegraph: "They wait to toll a counter." },
  },
};

export function combatMove(species: SpeciesId, verb: CombatVerb): CombatMove {
  const entry = MOVES[species][verb];
  return { verb, ...entry };
}

export function enemyTelegraphCopy(enemy: SpeciesId, verb: CombatVerb) {
  return combatMove(enemy, verb).telegraph;
}

export function counterAdvice(verb: CombatVerb) {
  if (verb === "strike") return "Guard breaks the commitment.";
  if (verb === "guard") return "Skill presses through the brace.";
  return "Strike interrupts the technique.";
}

export function exchangeHeadline(args: {
  playerName: string;
  playerSpecies: SpeciesId;
  enemy: SpeciesId;
  player: CombatVerb;
  enemyVerb: CombatVerb;
  pDmg: number;
  eDmg: number;
  countered: boolean;
}) {
  const yours = combatMove(args.playerSpecies, args.player).name;
  const theirs = combatMove(args.enemy, args.enemyVerb).name;
  if (args.countered && args.eDmg > args.pDmg) {
    return `${args.playerName}'s ${yours} answers ${theirs}.`;
  }
  if (args.pDmg === 0 && args.eDmg === 0) {
    return `${yours} meets ${theirs}. Neither yields.`;
  }
  if (args.eDmg > args.pDmg) {
    return `${yours} lands harder than ${theirs}.`;
  }
  if (args.pDmg > args.eDmg) {
    return `${SPECIES[args.enemy].name}'s ${theirs} presses through.`;
  }
  return `${yours} and ${theirs} trade evenly.`;
}
