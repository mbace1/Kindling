import type { ChargePhase, CombatPattern, CombatVerb, SpeciesId } from "@/lib/kindling/model";
import { combatMove, counterAdvice } from "@/lib/kindling/combat-moves";
import {
  intentPanelCopy,
  patternAdvice,
  patternLabel,
  recommendedCounter,
} from "@/lib/kindling/combat-depth";
import { counterTo } from "@/lib/kindling/gameplay-rules";

export const COMBAT_ACTION_COPY: Record<CombatVerb, { title: string; hint: string; role: string }> = {
  strike: { title: "Strike", hint: "Reliable attack · free Nerve", role: "Breaks Skill · interrupts charge/feint" },
  guard: { title: "Guard", hint: "Reduce damage · restore Nerve", role: "Breaks Strike" },
  skill: { title: "Skill", hint: "Stronger special · spends Nerve", role: "Breaks Guard" },
};

export function intentCopy(
  verb: CombatVerb,
  pattern: CombatPattern = "steady",
  chargePhase: ChargePhase | null = null,
) {
  if (pattern === "charging" && chargePhase === "windup") {
    return "Winding now · next turn they Charge — Strike interrupts, or the heavy lands.";
  }
  if (pattern === "charging") return "Charging — Strike cuts the release short.";
  if (pattern === "feint") return "The wind-up looks false. Strike catches a feint.";
  if (verb === "strike") return "They are committing to a direct attack.";
  if (verb === "guard") return "They are bracing to absorb damage.";
  return "They are preparing their strongest technique.";
}

export function actionStat(verb: CombatVerb, stats: { strike: number; guard: number; skill: number }) {
  return verb === "strike" ? stats.strike : verb === "guard" ? stats.guard : stats.skill;
}

export function moveLabel(species: SpeciesId, verb: CombatVerb) {
  return combatMove(species, verb).name;
}

export function moveBeat(species: SpeciesId, verb: CombatVerb) {
  return combatMove(species, verb).beat;
}

export function telegraphPanelCopy(
  enemy: SpeciesId,
  verb: CombatVerb,
  pattern: CombatPattern = "steady",
  chargePhase: ChargePhase | null = null,
) {
  const move = combatMove(enemy, verb);
  return intentPanelCopy({
    telegraph: verb,
    pattern,
    moveName: move.name,
    moveTelegraph: move.telegraph,
    chargePhase,
  });
}

export function previewExchangeHint(
  verb: CombatVerb,
  intent: CombatVerb,
  pattern: CombatPattern = "steady",
  chargePhase: ChargePhase | null = null,
) {
  const recommended = recommendedCounter(pattern, intent, chargePhase);
  if (pattern === "charging" && chargePhase === "windup") {
    if (verb === "strike") return "A clean poke while they wind. Interrupt comes next.";
    return "They are still winding — the heavy comes next.";
  }
  if (verb === recommended) {
    if (pattern === "charging") return "This interrupts the wind-up.";
    if (pattern === "feint") return "This catches the feint.";
    return "This answers their intent.";
  }
  if (pattern === "charging" && verb !== "strike") return "They finish the heavy if you wait.";
  if (verb === intent) return "Mirror clash — neither side has the edge.";
  return "Off-angle. Expect a harder trade.";
}

export { counterAdvice, counterTo, patternAdvice, patternLabel, recommendedCounter };
