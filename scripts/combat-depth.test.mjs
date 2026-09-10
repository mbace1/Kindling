import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [depth, combat, balance, store, model, readability, versions, canonical] = await Promise.all([
  read("src/lib/kindling/combat-depth.ts"),
  read("src/lib/kindling/companion-combat.ts"),
  read("scripts/combat-balance.mjs"),
  read("src/lib/kindling/store.ts"),
  read("src/lib/kindling/model.ts"),
  read("src/components/combat-readability.tsx"),
  read("VERSIONS.md"),
  read("CANONICAL.md"),
]);

test("v18 ships Nerve, charge/feint patterns, and region archetypes", () => {
  assert.match(depth, /NERVE_MAX\s*=\s*3/);
  assert.match(depth, /pattern === "charging"/);
  assert.match(depth, /pattern === "feint"/);
  assert.match(depth, /Banner Warden/);
  assert.match(depth, /Cinder Runner/);
  assert.match(depth, /resolveDepthRound/);
  assert.match(model, /nerveMax/);
  assert.match(model, /CombatPattern/);
  assert.match(store, /resolveDepthRound/);
  assert.match(store, /pickEnemyIntent/);
  assert.match(readability, /spends Nerve/);
});

test("Bond unlocks companion skills that change the exchange", () => {
  assert.match(depth, /Hearth Focus/);
  assert.match(depth, /Spore Breath/);
  assert.match(depth, /Cinder Step/);
  assert.match(depth, /Toll Guard/);
  assert.match(depth, /companionSkillUnlocks/);
});

test("combat aftermath feeds Journey without scolding or wellness edits", () => {
  assert.match(depth, /combatAftermathCopy/);
  assert.match(store, /s\.roadEcho = aftermath\.roadEcho/);
  assert.match(store, /recordRegionEcho\(s, c\.pathId/);
  assert.match(store, /journalEntry\(s\)\.lines\.push\(aftermath\.journal\)/);
  assert.match(model, /roadEcho/);
  assert.match(model, /regionEchoes/);
  assert.doesNotMatch(depth, /you failed|don't forget|you should|missed your/i);
  assert.match(canonical, /combat loss never removes wellness progress/);
});

test("balance growth table matches companion-combat runtime", () => {
  // Runtime deltas at rank 4
  assert.match(combat, /hpBonus: rank \* 2/); // ember
  assert.match(combat, /skillBonus: rank \* 2/);
  assert.match(balance, /ember: \(r\) => \(\{ hp: r \* 2, strike: r, guard: r, skill: r \* 2, speed: r \}\)/);
  assert.match(balance, /mossling: \(r\) => \(\{ hp: r \* 3, strike: 0, guard: r \* 2, skill: r \* 2, speed: 0 \}\)/);
  assert.match(balance, /ashling: \(r\) => \(\{ hp: r, strike: r \* 2, guard: 0, skill: r, speed: r \* 2 \}\)/);
  assert.match(balance, /mossknight: \(r\) => \(\{ hp: r \* 4, strike: r, guard: r \* 2, skill: 0, speed: 0 \}\)/);
  assert.match(balance, /alignedGrowth: true/);
});

test("VERSIONS records v18–v22 combat and world polish", () => {
  assert.match(versions, /## v18/);
  assert.match(versions, /Nerve|charge|feint|archetype|aftermath/i);
  assert.match(versions, /## v19/);
  assert.match(versions, /two-turn|wind-up|windup|release/i);
  assert.match(versions, /## v20/);
  assert.match(versions, /egg|region echo|Camp on the road|Winding/i);
  assert.match(versions, /## v21/);
  assert.match(versions, /region memory|Old Gate|next world/i);
  assert.match(versions, /## v22/);
  assert.match(versions, /keeper|rival|multi-phase/i);
});

test("v19 charge is a two-turn wind-up across resolve and store", () => {
  assert.match(depth, /ChargePhase/);
  assert.match(depth, /chargeContinues/);
  assert.match(depth, /chargePhase === "windup"/);
  assert.match(depth, /chargePhase === "release"|chargePhase: "release"/);
  assert.match(depth, /They gather weight — the blow has not fallen/);
  assert.match(store, /depth\.chargeContinues/);
  assert.match(store, /chargePhase = "release"/);
  assert.match(store, /chargeIntentLine/);
  assert.match(model, /chargePhase/);
});

test("two-turn charge runtime resolves windup then interrupt-or-land", async () => {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", new URL("./combat-charge-runtime.mjs", import.meta.url).pathname],
    { encoding: "utf8", cwd: new URL("..", import.meta.url).pathname },
  );
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /"twoTurnCharge":\s*true/);
});
