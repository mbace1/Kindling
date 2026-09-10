import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [
  lineage,
  model,
  store,
  combat,
  journeyTrait,
  tree,
  keep,
  eggPanel,
  journey,
  decision,
  celebrate,
  versions,
  plan,
  canonical,
] = await Promise.all([
  read("src/lib/kindling/lineage.ts"),
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/lib/kindling/companion-combat.ts"),
  read("src/lib/kindling/companion-journey.ts"),
  read("src/components/lineage-family-tree.tsx"),
  read("src/components/companion-responsive.tsx"),
  read("src/components/egg-warmth-panel.tsx"),
  read("src/components/journey-world-screen.tsx"),
  read("src/components/journey-decision.tsx"),
  read("src/components/progression-celebration.tsx"),
  read("VERSIONS.md"),
  read("PRODUCT_PLAN.md"),
  read("CANONICAL.md"),
]);

test("ash traits carry visible combat and Journey flavor", () => {
  assert.match(lineage, /ASH_TRAIT_DEFS/);
  assert.match(lineage, /ember-core/);
  assert.match(lineage, /quiet-guard/);
  assert.match(lineage, /quick-spark/);
  assert.match(lineage, /moss-memory/);
  assert.match(lineage, /combatLine/);
  assert.match(lineage, /journeyLine/);
  assert.match(combat, /ashTraitDef/);
  assert.match(journeyTrait, /withAshJourney|ashTraitDef/);
});

test("hatch names a child with parents and makes them active", () => {
  assert.match(lineage, /nameHatchedChild/);
  assert.match(lineage, /hatchCompanionFromEgg/);
  assert.match(store, /hatchCompanionFromEgg/);
  assert.match(store, /s\.companion = born/);
  assert.match(store, /Child of|hatched from the coals — child of/);
  assert.match(model, /parentAName\?:/);
  assert.match(eggPanel, /Will inherit/);
  assert.match(celebrate, /Family hatch/);
});

test("Lineage UI is a firelit family tree, not a flat dump", () => {
  assert.match(tree, /Firelit family tree|aria-label="Firelit family tree"/);
  assert.match(tree, /Kindled family/);
  assert.match(tree, /By the fire/);
  assert.match(tree, /Warming in the coals/);
  assert.doesNotMatch(tree, /grayscale/);
  assert.match(keep, /LineageFamilyTree|Family tree/);
  assert.match(keep, /Family tree/);
});

test("walk with elder softens Journey without touching wellness", () => {
  assert.match(lineage, /lineageRoadModifier/);
  assert.match(lineage, /Walking with elder/);
  assert.match(journey, /Walk with elder/);
  assert.match(journey, /lineageRoadModifier/);
  assert.match(decision, /elder walk|elderMod|currentElder/);
  assert.doesNotMatch(lineage, /you failed|don't forget|you should/i);
  assert.match(canonical, /combat loss never removes wellness progress/);
});

test("combine parents remain; warmth only gathers; Kindle keeps the name", () => {
  assert.match(store, /Combining never consumes either parent/);
  assert.match(model, /s\.kept\s*-\s*s\.egg\.startedKept/);
  assert.match(eggPanel, /warmth only gathers/i);
  assert.match(store, /s\.lineage\.unshift/);
  assert.doesNotMatch(store.match(/confirmKindling:[\s\S]*?\n  \},/)?.[0] ?? "", /you failed|scold/i);
});

test("VERSIONS and plan record v23 with A next", () => {
  assert.match(versions, /## v23/);
  assert.match(versions, /Living lineage|family tree|Walk with elder/i);
  assert.match(plan, /v23/);
  assert.match(plan, /shipped in v23/);
  assert.match(plan, /World beyond Gate/);
  assert.match(plan, /epic A|A — World/);
});

test("lineage runtime: named hatch, trait combat bonus, elder modifier", () => {
  const runtime = `
import { freshSave, normalizeSave, EGG_WARMTH_REQUIRED } from "./src/lib/kindling/model.ts";
import { combatStatsForCompanion } from "./src/lib/kindling/companion-combat.ts";
import {
  hatchCompanionFromEgg,
  lineageRoadModifier,
  packElder,
  ashTraitDef,
  nameHatchedChild,
  buildFamilyRoster,
} from "./src/lib/kindling/lineage.ts";

const egg = {
  species: "ashling",
  parentAId: "a",
  parentBId: "b",
  parentAName: "Ember",
  parentBName: "Mossling",
  startedKept: 0,
  required: EGG_WARMTH_REQUIRED,
  trait: "quick-spark",
};
const born = hatchCompanionFromEgg(egg);
if (!born.name || born.name === "Ashling") throw new Error("expected named child, got " + born.name);
if (born.parentAName !== "Ember" || born.parentBName !== "Mossling") throw new Error("parents missing");
if (born.trait !== "quick-spark") throw new Error("trait not inherited");
const named = nameHatchedChild("ashling", "Ember", "Mossling");
if (named !== born.name) throw new Error("name not stable");

const withTrait = { ...born, bondXp: 0 };
const stats = combatStatsForCompanion(withTrait);
const base = combatStatsForCompanion({ ...withTrait, trait: undefined });
if (!stats || !base) throw new Error("stats missing");
if (!(stats.strike > base.strike && stats.speed > base.speed)) throw new Error("quick-spark combat bonus missing");

const s = freshSave();
s.roster = [
  { id: "elder-1", species: "ember", name: "Old Coal", born: "2026-01-01", bondXp: 2000 },
  born,
];
s.companion = born;
s.lineage = [{
  id: "k1", species: "mossling", name: "Moss", stage: "keeper", kept: 40, bondXp: 800, kindledOn: "2026-01-02", trait: "moss-memory",
}];
s.egg = null;
const elder = packElder(s.roster);
if (!elder || elder.name !== "Old Coal") throw new Error("pack elder missing");
const mod = lineageRoadModifier(s);
if (!mod || mod.restBondBonus < 1 || mod.ambushMultiplier >= 1) throw new Error("elder mod invalid");
const tree = buildFamilyRoster(s);
if (tree.living.length < 2 || tree.kindled.length !== 1) throw new Error("family roster shape wrong");
const round = normalizeSave(JSON.parse(JSON.stringify(s)));
if (!round.roster.find((m) => m.id === born.id)?.parentAName) throw new Error("parent fields dropped on normalize");
console.log(JSON.stringify({ ok: true, child: born.name, elder: elder.name, trait: ashTraitDef("quick-spark")?.label }));
`;
  const run = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", runtime], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
  });
  if (run.status !== 0) {
    console.error(run.stdout, run.stderr);
  }
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /"ok":true/);
});
