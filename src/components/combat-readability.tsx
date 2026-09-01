import type { CombatVerb } from "@/lib/kindling/model";

export const COMBAT_ACTION_COPY: Record<CombatVerb, { title: string; hint: string }> = {
  strike: { title: "Strike", hint: "Reliable attack" },
  guard: { title: "Guard", hint: "Reduce incoming damage" },
  skill: { title: "Skill", hint: "Stronger special attack" },
};

export function intentCopy(verb: CombatVerb) {
  if (verb === "strike") return "They are committing to a direct attack.";
  if (verb === "guard") return "They are bracing to absorb damage.";
  return "They are preparing their strongest technique.";
}

export function actionStat(verb: CombatVerb, stats: { strike: number; guard: number; skill: number }) {
  return verb === "strike" ? stats.strike : verb === "guard" ? stats.guard : stats.skill;
}
