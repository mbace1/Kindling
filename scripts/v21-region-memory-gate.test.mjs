import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [model, store, world, journey, decision, celebrate, versions, canonical, plan] = await Promise.all([
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/lib/kindling/world.ts"),
  read("src/components/journey-world-screen.tsx"),
  read("src/components/journey-decision.tsx"),
  read("src/components/progression-celebration.tsx"),
  read("VERSIONS.md"),
  read("CANONICAL.md"),
  read("PRODUCT_PLAN.md"),
]);

test("region memory accumulates finds, rests, shortcuts, and fights", () => {
  assert.match(model, /regionMemories/);
  assert.match(model, /export function recordRegionMemory/);
  assert.match(model, /export function summarizeRegionMemory/);
  assert.match(model, /REGION_MEMORY_CAP\s*=\s*4/);
  assert.match(store, /recordRegionMemory\(s, c\.pathId/);
  assert.match(decision, /withRegionMemory\(current, pathId, "find"/);
  assert.match(decision, /withRegionMemory\(current, pathId, "rest"/);
  assert.match(decision, /withRegionMemory\(current, pathId, "shortcut"/);
  assert.match(journey, /Remembers ·|Road remembers/);
  assert.match(journey, /summarizeRegionMemory/);
});

test("missed care and Kindle never clear region memory or Old Gate", () => {
  assert.match(model, /Missed care may Kindle a companion; it never erases regionMemories \/ Old Gate/);
  const rollover = model.match(/export function applyRollover[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.doesNotMatch(rollover, /regionMemories\s*=/);
  assert.doesNotMatch(rollover, /oldGateOpened\s*=/);
  assert.match(canonical, /absence never removes loot, Flames, world progress/);
});

test("Old Gate ships an approach / next-world interim beat", () => {
  assert.match(world, /export function oldGateReady/);
  assert.match(world, /export function oldGateIsOpen/);
  assert.match(world, /readyCopy|openCopy|approachLabel/);
  assert.match(store, /openOldGate:/);
  assert.match(journey, /Approach the Old Gate|The stone answers|Path opens/);
  assert.match(celebrate, /Path opens/);
  assert.match(celebrate, /oldGateOpened/);
  assert.doesNotMatch(journey, /It does not open yet/);
});

test("VERSIONS and plan name v21", () => {
  assert.match(versions, /## v21/);
  assert.match(versions, /region memory|Old Gate|next world/i);
  assert.match(plan, /v21/);
});

test("region memory runtime accumulates and survives rollover semantics", () => {
  const runtime = `
import {
  applyRollover,
  freshSave,
  normalizeSave,
  recordRegionMemory,
  summarizeRegionMemory,
  consecutiveMissed,
} from "./src/lib/kindling/model.ts";
import { oldGateReady, oldGateIsOpen, WORLD_PATHS } from "./src/lib/kindling/world.ts";

const s = freshSave();
recordRegionMemory(s, "ruin", { kind: "find", text: "Found a pale shard on this road.", at: 1 });
recordRegionMemory(s, "ruin", { kind: "rest", text: "Rested together on this road.", at: 2 });
recordRegionMemory(s, "ruin", { kind: "win", text: "Birch Ruins falls quiet.", at: 3 });
const summary = summarizeRegionMemory(s.regionMemories.ruin);
if (!summary || !summary.includes("Birch Ruins falls quiet")) throw new Error("summary missing newest beat");
if (!summary.includes("also")) throw new Error("summary should soft-list older beats");
if (s.regionMemories.ruin.beats.length !== 3) throw new Error("beats should accumulate");

// Missed care / Kindle path must not wipe memory
s.lastKept = "2020-01-01";
s.sheet.date = "2020-01-01";
applyRollover(s);
if (!s.regionMemories.ruin) throw new Error("rollover erased region memory");
const again = normalizeSave(JSON.parse(JSON.stringify(s)));
if (!again.regionMemories.ruin?.beats?.length) throw new Error("normalize dropped region memory");

// Visible after Bell Keep; ready after Ashwood + care/Journey progress
s.kept = 0;
s.encounters = { wins: 0, losses: 0 };
if (oldGateReady(s)) throw new Error("gate should not be ready without clears");
s.found.push({ id: "f-road", name: "proof", kind: "relic", from: "road", date: "2026-09-10" });
if (oldGateReady(s)) throw new Error("gate should stay sealed before Ashwood");
s.found.push({ id: "f-ash", name: "proof", kind: "ash", from: "ash", date: "2026-09-10" });
if (oldGateReady(s)) throw new Error("gate should need care or a win after Ashwood");
s.kept = 5;
if (!oldGateReady(s)) throw new Error("gate should be ready after Ashwood + care");
if (oldGateIsOpen(s)) throw new Error("gate should start closed");
s.oldGateOpened = true;
if (!oldGateIsOpen(s)) throw new Error("gate open flag failed");
console.log(JSON.stringify({ ok: true, summary, beats: s.regionMemories.ruin.beats.length, gateReady: true }));
`;
  const r = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", runtime], {
    encoding: "utf8",
    cwd: new URL("..", import.meta.url).pathname,
  });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /"ok":\s*true/);
});
