import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [model, world, content, rivals, depth, store, journey, celebrate, versions, plan, canonical] =
  await Promise.all([
    read("src/lib/kindling/model.ts"),
    read("src/lib/kindling/world.ts"),
    read("src/lib/kindling/world-content.ts"),
    read("src/lib/kindling/combat-rivals.ts"),
    read("src/lib/kindling/combat-depth.ts"),
    read("src/lib/kindling/store.ts"),
    read("src/components/journey-world-screen.tsx"),
    read("src/components/progression-celebration.tsx"),
    read("VERSIONS.md"),
    read("PRODUCT_PLAN.md"),
    read("CANONICAL.md"),
  ]);

test("two beyond-gate regions ship with Journey cards", () => {
  assert.match(content, /id: "pale"/);
  assert.match(content, /id: "spire"/);
  assert.match(content, /displayName: "Pale Reach"/);
  assert.match(content, /displayName: "Hollow Spire"/);
  assert.match(content, /unlockAfter: "old-gate"/);
  assert.match(content, /unlockAfter: "pale"/);
  assert.match(content, /Pale Reach · moon flats/);
  assert.match(content, /Hollow Spire · quiet stair/);
  assert.match(model, /id: "pale"/);
  assert.match(model, /id: "spire"/);
});

test("opening the Gate unlocks Pale Reach and celebrates the travel beat", () => {
  assert.match(world, /unlockAfter === "old-gate"/);
  assert.match(world, /Pale Reach opens beyond the threshold/);
  assert.match(store, /Pale Reach waits beyond the threshold/);
  assert.match(store, /Pale Reach opens beyond the gate/);
  assert.match(celebrate, /Into Pale Reach/);
  assert.match(celebrate, /Hollow Spire waits farther on/);
  assert.match(journey, /Walk Pale Reach above/);
  assert.match(journey, /Beyond the gate/);
});

test("beyond-gate rivals and archetypes reuse combat systems with new names", () => {
  assert.match(rivals, /pathId: "pale"/);
  assert.match(rivals, /pathId: "spire"/);
  assert.match(rivals, /Silver Fenward/);
  assert.match(rivals, /Unlit Spireward/);
  assert.match(depth, /pale:/);
  assert.match(depth, /spire:/);
  assert.match(depth, /Pale Watcher|Hollow Warden/);
  assert.match(canonical, /combat loss never removes wellness progress/);
});

test("VERSIONS and plan mark v24 epic A complete", () => {
  assert.match(versions, /## v24/);
  assert.match(versions, /Pale Reach|Hollow Spire|beyond/i);
  assert.match(plan, /v24/);
  assert.match(plan, /shipped in v24|epic A shipped|A — World beyond Gate.*shipped/i);
  assert.match(plan, /C → B → A\) — complete|Epic roadmap \(owner order C → B → A\) — complete/);
});

test("beyond-gate runtime: unlock, memory, rivals, no wellness wipe", () => {
  const runtime = `
import {
  applyRollover,
  freshSave,
  normalizeSave,
  recordRegionMemory,
  summarizeRegionMemory,
} from "./src/lib/kindling/model.ts";
import {
  WORLD_PATHS,
  oldGateReady,
  pathUnlocked,
  beyondGatePaths,
} from "./src/lib/kindling/world.ts";
import {
  ROAD_RIVALS,
  rivalForPath,
  setRivalStatus,
} from "./src/lib/kindling/combat-rivals.ts";
import { enemyArchetype } from "./src/lib/kindling/combat-depth.ts";

const pale = WORLD_PATHS.find((p) => p.id === "pale");
const spire = WORLD_PATHS.find((p) => p.id === "spire");
if (!pale || !spire) throw new Error("beyond paths missing from WORLD_PATHS");
if (beyondGatePaths().length < 2) throw new Error("expected >=2 beyond-gate paths");

const s = freshSave();
s.found = [
  { id: "f-ruin", name: "p", kind: "relic", from: "ruin", date: "2026-09-10" },
  { id: "f-forest", name: "p", kind: "moss", from: "forest", date: "2026-09-10" },
  { id: "f-road", name: "p", kind: "relic", from: "road", date: "2026-09-10" },
  { id: "f-ash", name: "p", kind: "ash", from: "ash", date: "2026-09-10" },
];
s.kept = 5;
if (!oldGateReady(s)) throw new Error("gate should be ready");
if (pathUnlocked(s, pale)) throw new Error("pale must stay locked until gate opens");
s.oldGateOpened = true;
if (!pathUnlocked(s, pale)) throw new Error("pale unlocks with open gate");
if (pathUnlocked(s, spire)) throw new Error("spire waits for pale clear");

recordRegionMemory(s, "pale", { kind: "find", text: "Found a pale thorn on this road.", at: 1 });
recordRegionMemory(s, "pale", { kind: "rest", text: "Rested under the thin moon.", at: 2 });
const summary = summarizeRegionMemory(s.regionMemories.pale);
if (!summary || !summary.includes("thin moon")) throw new Error("pale memory summary missing");

s.found.push({ id: "f-pale", name: "pale thorn", kind: "shard", from: "pale", date: "2026-09-10" });
if (!pathUnlocked(s, spire)) throw new Error("spire should unlock after pale");

const paleRival = rivalForPath("pale");
const spireRival = rivalForPath("spire");
if (!paleRival || paleRival.name !== "Silver Fenward") throw new Error("pale rival missing");
if (!spireRival || spireRival.name !== "Unlit Spireward") throw new Error("spire rival missing");
if (!enemyArchetype("pale").id.includes("pale")) throw new Error("pale archetype missing");
if (!enemyArchetype("spire").id.includes("hollow")) throw new Error("spire archetype missing");

s.rivals = setRivalStatus({}, "pale", "bested");
const kept = s.kept;
const fuel = s.fuel;
applyRollover(s);
if (s.kept !== kept || s.fuel !== fuel) throw new Error("wellness changed on rollover");
if (!s.regionMemories.pale) throw new Error("rollover erased pale memory");
if (!s.oldGateOpened) throw new Error("rollover cleared gate");
const again = normalizeSave(JSON.parse(JSON.stringify(s)));
if (!again.regionMemories.pale?.beats?.length) throw new Error("normalize dropped pale memory");
if (again.rivals.pale?.status !== "bested") throw new Error("normalize dropped pale rival");
if (ROAD_RIVALS.length < 7) throw new Error("expected keepers for beyond roads too");
console.log(JSON.stringify({
  ok: true,
  beyond: beyondGatePaths().map((p) => p.id),
  rivals: ROAD_RIVALS.filter((r) => r.pathId === "pale" || r.pathId === "spire").map((r) => r.name),
  summary,
}));
`;
  const r = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", runtime], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /"ok":\s*true/);
});
