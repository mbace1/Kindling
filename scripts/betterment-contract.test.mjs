import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [model, store, screens, camp, shell] = await Promise.all([
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/components/screens.tsx"),
  read("src/components/camp-canvas.tsx"),
  read("src/components/app-shell.tsx"),
]);

test("five care points is the fixed Fire target", () => {
  assert.match(model, /FULL_DAY\s*=\s*5/);
  assert.match(screens, /Math\.min\(FULL_DAY, cared\)/);
  assert.doesNotMatch(screens, /Four is a good fire/i);
  assert.match(screens, /Fire tended\. Enough for today\./);
});

test("the spendable currency is Flames, not kindling units", () => {
  assert.match(model, /FLAMES_PER_FUEL\s*=\s*20/);
  assert.match(screens, /Flames opens a journey/);
  assert.doesNotMatch(screens, /Three kindling/i);
  assert.doesNotMatch(screens, /costs? \{ERRAND_COST\} kindling/i);
});

test("journeys are real-time 90 second trips", () => {
  assert.match(store, /WALK_DURATION_MS\s*=\s*90_000/);
  assert.match(screens, /takes about 90 seconds/i);
  assert.match(screens, /continues if you close the app/i);
});

test("growth belongs to the active companion", () => {
  assert.match(model, /bondXp:\s*number/);
  assert.match(model, /addBondXp\(s, BASE_BOND_XP\)/);
  assert.match(model, /stageOfCompanion\(s\.companion\)/);
  assert.match(screens, /s\.companion\.bondXp/);
});

test("progressive tiers reward without adding daily Fire", () => {
  assert.match(model, /Do 10 push-ups/);
  assert.match(model, /bondXp:\s*40/);
  assert.match(model, /bondXp:\s*60/);
  assert.match(store, /completeProgressive/);
  assert.match(store, /grantBonus/);
  // The bonus grant deliberately does not touch lifetime care (`kept`), which is
  // also what stops it from filling Fire or warming a lineage egg.
  const grant = model.match(/export function grantBonus[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.doesNotMatch(grant, /s\.kept\s*\+=/);
});

test("lineage eggs warm from five future ordinary care actions", () => {
  assert.match(model, /EGG_WARMTH_REQUIRED\s*=\s*5/);
  assert.match(model, /s\.kept\s*-\s*s\.egg\.startedKept/);
  assert.match(store, /An Ember Egg rests in the coals/);
  assert.match(store, /hatchEgg/);
  assert.doesNotMatch(store, /s\.roster\.push\(born\)[\s\S]{0,200}An Ember Egg rests/);
});

test("two missed care-days Kindle; one is only a warning", () => {
  assert.match(model, /consecutiveMissed\(s\) === 1/);
  assert.match(model, /consecutiveMissed\(s\) >= 2/);
  assert.match(screens, /became Kindling/);
  assert.match(screens, /They stay in the lineage/);
});

test("breathing uses the intended 4 / 4 / 6 cadence for four rounds", () => {
  assert.match(screens, /in:\s*4000/);
  assert.match(screens, /hold:\s*4000/);
  assert.match(screens, /out:\s*6000/);
  assert.match(screens, /completed >= 4/);
});

test("the approved camp staging keeps the companion left of the fire", () => {
  assert.match(camp, /const cx = fx - w \* distance/);
  assert.match(camp, /assetSrc\("art\/camp\.jpg"\)/);
  assert.doesNotMatch(camp, /load\("\/art\/camp\.jpg"\)/);
});

test("a companion on a Journey is not also drawn at camp", () => {
  assert.match(camp, /save\.companion && !save\.walk && !save\.combat/);
  assert.match(shell, /is on the path\./);
  assert.match(shell, /View journey/);
});
