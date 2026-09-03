import type { CombatVerb, KindlingSave } from "./model";

export function counterTo(intent: CombatVerb): CombatVerb {
  if (intent === "strike") return "guard";
  if (intent === "guard") return "skill";
  return "strike";
}

export function shouldOfferFireChoice(
  s: Pick<KindlingSave, "companion" | "egg" | "fuel" | "sheet" | "tasks">,
  options: { careCost: number; careMarker: string; hasProgressiveOpportunity: boolean; hidden: boolean },
) {
  if (!s.companion || s.egg || options.hidden || s.fuel < options.careCost) return false;
  if (s.sheet.bonus.includes(options.careMarker) || options.hasProgressiveOpportunity) return false;
  return !s.tasks.some((task) => !s.sheet.done.includes(task.id));
}

export function combatGrowthOpening(current: { playerHp: number; playerMax: number; enemyHp: number }, growth: { hpBonus: number; openingDamage: number }) {
  const openingDamage = Math.min(growth.openingDamage, Math.max(0, current.enemyHp - 1));
  return {
    playerHp: current.playerHp + growth.hpBonus,
    playerMax: current.playerMax + growth.hpBonus,
    enemyHp: Math.max(1, current.enemyHp - openingDamage),
    openingDamage,
  };
}
