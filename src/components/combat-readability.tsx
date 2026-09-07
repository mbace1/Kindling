import type { CombatVerb, SpeciesId } from "@/lib/kindling/model";
import { combatMove, counterAdvice } from "@/lib/kindling/combat-moves";
import { counterTo } from "@/lib/kindling/gameplay-rules";

export const COMBAT_ACTION_COPY: Record<CombatVerb, { title: string; hint: string; role: string }> = {
  strike: { title: "Strike", hint: "Reliable attack", role: "Breaks Skill" },
  guard: { title: "Guard", hint: "Reduce incoming damage", role: "Breaks Strike" },
  skill: { title: "Skill", hint: "Stronger special attack", role: "Breaks Guard" },
};

export function intentCopy(verb: CombatVerb) {
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

export function telegraphPanelCopy(enemy: SpeciesId, verb: CombatVerb) {
  const move = combatMove(enemy, verb);
  return {
    title: move.name,
    intent: move.telegraph,
    advice: counterAdvice(verb),
    counter: counterTo(verb),
  };
}

export function previewExchangeHint(verb: CombatVerb, intent: CombatVerb) {
  if (verb === counterTo(intent)) return "This answers their intent.";
  if (verb === intent) return "Mirror clash — neither side has the edge.";
  return "Off-angle. Expect a harder trade.";
}
