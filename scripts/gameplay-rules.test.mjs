import test from "node:test";
import assert from "node:assert/strict";

function counterTo(intent) {
  if (intent === "strike") return "guard";
  if (intent === "guard") return "skill";
  return "strike";
}

function combatGrowthOpening(current, growth) {
  const openingDamage = Math.min(growth.openingDamage, Math.max(0, current.enemyHp - 1));
  return {
    playerHp: current.playerHp,
    playerMax: current.playerMax,
    enemyHp: Math.max(1, current.enemyHp - openingDamage),
    openingDamage,
    vitalityBonus: growth.hpBonus,
  };
}

test("combat counter triangle remains explicit", () => {
  assert.equal(counterTo("strike"), "guard");
  assert.equal(counterTo("guard"), "skill");
  assert.equal(counterTo("skill"), "strike");
});

test("Bond opening pressure can never delete an enemy before the fight", () => {
  assert.deepEqual(
    combatGrowthOpening({ playerHp: 20, playerMax: 20, enemyHp: 3 }, { hpBonus: 4, openingDamage: 8 }),
    { playerHp: 20, playerMax: 20, enemyHp: 1, openingDamage: 2, vitalityBonus: 4 },
  );
});

test("grown vitality is already on the combatant and is not applied twice", () => {
  assert.deepEqual(
    combatGrowthOpening({ playerHp: 30, playerMax: 30, enemyHp: 12 }, { hpBonus: 8, openingDamage: 4 }),
    { playerHp: 30, playerMax: 30, enemyHp: 8, openingDamage: 4, vitalityBonus: 8 },
  );
});
