#!/usr/bin/env node
/**
 * Runtime assertions for two-turn charge. Invoked via tsx from combat-depth.test.mjs.
 */
import assert from "node:assert/strict";
import { resolveDepthRound, pickEnemyIntent } from "../src/lib/kindling/combat-depth.ts";

const pc = { hp: 26, strike: 6, guard: 4, skill: 7, speed: 6, tendency: "skill-focused" };
const ec = { hp: 30, strike: 8, guard: 4, skill: 6, speed: 5, tendency: "quick-striker" };

const windup = resolveDepthRound({
  player: "strike",
  telegraph: "strike",
  pattern: "charging",
  chargeVerb: "strike",
  chargePhase: "windup",
  nerve: 3,
  nerveMax: 3,
  pc,
  ec,
});
assert.equal(windup.chargeContinues, true, "windup must continue into release");
assert.equal(windup.interrupted, false, "windup Strike is a poke, not an interrupt");
assert.equal(windup.pDmg, 0, "enemy deals no damage while winding");
assert.ok(windup.eDmg > 0, "player poke lands during windup");
assert.match(windup.beatLines.join(" "), /gather weight|blow has not fallen/i);

const releaseHit = resolveDepthRound({
  player: "guard",
  telegraph: "strike",
  pattern: "charging",
  chargeVerb: "strike",
  chargePhase: "release",
  nerve: 3,
  nerveMax: 3,
  pc,
  ec,
});
assert.equal(releaseHit.chargeContinues, false);
assert.equal(releaseHit.interrupted, false);
assert.ok(releaseHit.pDmg >= 4, "uninterrupted release adds heavy bonus");
assert.match(releaseHit.beatLines.join(" "), /delayed heavy lands/i);

const releaseInterrupt = resolveDepthRound({
  player: "strike",
  telegraph: "strike",
  pattern: "charging",
  chargeVerb: "strike",
  chargePhase: "release",
  nerve: 3,
  nerveMax: 3,
  pc,
  ec,
});
assert.equal(releaseInterrupt.interrupted, true);
assert.equal(releaseInterrupt.pDmg, 0, "interrupt takes no damage");
assert.ok(releaseInterrupt.eDmg >= pc.strike);
assert.match(releaseInterrupt.beatLines.join(" "), /cuts the wind-up/i);

let sawWindup = false;
for (let i = 0; i < 80; i++) {
  const intent = pickEnemyIntent("mossknight", "road", () => (i < 40 ? 0.01 : 0.5));
  if (intent.pattern === "charging") {
    assert.equal(intent.chargePhase, "windup");
    assert.ok(intent.chargeVerb);
    sawWindup = true;
    break;
  }
}
assert.ok(sawWindup, "road archetype should roll charging with windup phase");

console.log(JSON.stringify({ ok: true, twoTurnCharge: true }));
