import test from "node:test";
import assert from "node:assert/strict";

function counterTo(intent) {
  if (intent === "strike") return "guard";
  if (intent === "guard") return "skill";
  return "strike";
}

function combatGrowthOpening(current, growth) {
  const openingDamage = Math.min(growth.openingDamage, Math.max(0, current.enemyHp - 1));
  return { playerHp: current.playerHp + growth.hpBonus, playerMax: current.playerMax + growth.hpBonus, enemyHp: Math.max(1, current.enemyHp - openingDamage), openingDamage };
}

test("combat counter triangle remains explicit", () => {
  assert.equal(counterTo("strike"), "guard");
  assert.equal(counterTo("guard"), "skill");
  assert.equal(counterTo("skill"), "strike");
});

test("Bond opening pressure can never delete an enemy before the fight", () => {
  assert.deepEqual(combatGrowthOpening({ playerHp: 20, playerMax: 20, enemyHp: 3 }, { hpBonus: 4, openingDamage: 8 }), { playerHp: 24, playerMax: 24, enemyHp: 1, openingDamage: 2 });
});
