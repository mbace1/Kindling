import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [rivals, depth, model, store, journey, versions, plan, canonical] = await Promise.all([
  read("src/lib/kindling/combat-rivals.ts"),
  read("src/lib/kindling/combat-depth.ts"),
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/components/journey-world-screen.tsx"),
  read("VERSIONS.md"),
  read("PRODUCT_PLAN.md"),
  read("CANONICAL.md"),
]);

test("five named keepers cover the major region ids", () => {
  assert.match(rivals, /pathId: "ruin"/);
  assert.match(rivals, /pathId: "forest"/);
  assert.match(rivals, /pathId: "road"/);
  assert.match(rivals, /pathId: "ash"/);
  assert.match(rivals, /pathId: "old-gate"/);
  assert.match(rivals, /Pale Archwarden/);
  assert.match(rivals, /Root-Sunk Warden/);
  assert.match(rivals, /Unrung Bellward/);
  assert.match(rivals, /Cinder Crown/);
  assert.match(rivals, /Threshold Keeper/);
  assert.match(rivals, /phases:/);
  assert.match(rivals, /pressureSkillId/);
});

test("rival duels reuse Nerve charge/feint and never scold wellness", () => {
  assert.match(store, /beginRivalCombat/);
  assert.match(store, /pickRivalIntent/);
  assert.match(store, /resolveDepthRound/);
  assert.match(store, /rivalPhase/);
  assert.match(store, /setRivalStatus/);
  assert.match(store, /bested/);
  assert.match(model, /rivalId/);
  assert.match(model, /rivals:/);
  assert.match(depth, /resolveDepthRound/);
  assert.doesNotMatch(rivals, /you failed|don't forget|you should|missed your/i);
  assert.match(canonical, /combat loss never removes wellness progress/);
  assert.match(store, /You walk home/);
});

test("Journey surfaces looming / challenged / bested keepers", () => {
  assert.match(journey, /rivalStatusLabel/);
  assert.match(journey, /Keeper ·/);
  assert.match(journey, /Challenge the Threshold Keeper|Walk to challenge/);
  assert.match(journey, /rivalForPath\("old-gate"\)/);
});

test("VERSIONS and plan record v22 with B then A follow-ups", () => {
  assert.match(versions, /## v22/);
  assert.match(versions, /keeper|rival|multi-phase/i);
  assert.match(plan, /v22/);
  assert.match(plan, /Living lineage/);
  assert.match(plan, /World beyond Gate/);
  assert.match(plan, /C → B → A|C — Boss/);
});

test("rival multi-phase runtime advances then bests without wellness edits", () => {
  const runtime = `
import {
  freshSave,
  normalizeSave,
  applyRollover,
} from "./src/lib/kindling/model.ts";
import {
  ROAD_RIVALS,
  rivalPhaseHp,
  rivalPressureSoftened,
  setRivalStatus,
  pickRivalIntent,
  rivalAftermathCopy,
} from "./src/lib/kindling/combat-rivals.ts";
import { resolveDepthRound } from "./src/lib/kindling/combat-depth.ts";

const rival = ROAD_RIVALS.find((r) => r.pathId === "ruin");
if (!rival || rival.phases.length < 2) throw new Error("ruin rival missing phases");
const s = freshSave();
s.companion = { ...s.companion, bondXp: 900 }; // elder-ish for skills
const soft = rivalPressureSoftened(rival, s.companion);
const hp0 = rivalPhaseHp(rival, 0, soft);
const hp1 = rivalPhaseHp(rival, 1, soft);
if (!(hp0 > 0 && hp1 > 0)) throw new Error("phase hp invalid");

let phase = 0;
let enemyHp = hp0;
const pc = { hp: 40, strike: 12, guard: 8, skill: 14, speed: 8, tendency: "skill-focused" };
const ec = { hp: hp0, strike: 4, guard: 6, skill: 8, speed: 4, tendency: "guard-heavy" };
let nerve = 3;
let rounds = 0;
while (phase < rival.phases.length && rounds++ < 80) {
  const intent = pickRivalIntent(rival, phase, () => 0.9); // prefer steady
  const depth = resolveDepthRound({
    player: "skill",
    telegraph: intent.telegraph,
    pattern: intent.pattern,
    chargeVerb: intent.chargeVerb,
    chargePhase: intent.chargePhase,
    nerve,
    nerveMax: 3,
    pc,
    ec: { ...ec, hp: enemyHp },
    companion: s.companion,
  });
  nerve = depth.nextNerve;
  enemyHp = Math.max(0, enemyHp - Math.max(3, depth.eDmg));
  if (enemyHp <= 0) {
    if (phase < rival.phases.length - 1) {
      phase += 1;
      enemyHp = rivalPhaseHp(rival, phase, soft);
    } else break;
  }
}
if (phase !== rival.phases.length - 1 || enemyHp > 0) throw new Error("failed to clear multi-phase");
s.rivals = setRivalStatus({}, "ruin", "bested");
const aftermath = rivalAftermathCopy({ result: "win", rival, companionName: s.companion.name });
if (!aftermath.roadEcho.includes("yield") && !aftermath.roadEcho.includes("Pale")) throw new Error("bested copy missing");
const kept = s.kept;
const fuel = s.fuel;
applyRollover(s);
if (s.kept !== kept || s.fuel !== fuel) throw new Error("wellness changed");
if (!s.rivals.ruin || s.rivals.ruin.status !== "bested") throw new Error("rival status lost");
const again = normalizeSave(JSON.parse(JSON.stringify(s)));
if (again.rivals.ruin?.status !== "bested") throw new Error("normalize dropped rivals");
if (ROAD_RIVALS.length !== 5) throw new Error("expected five keepers");
console.log(JSON.stringify({ ok: true, phases: rival.phases.length, rivals: ROAD_RIVALS.length, soft }));
`;
  const r = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", runtime], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /"ok":\s*true/);
});
