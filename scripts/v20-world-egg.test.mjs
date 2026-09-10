import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [model, store, camp, journey, celebrate, readability, versions] = await Promise.all([
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/lib/kindling/camp-construction.ts"),
  read("src/components/journey-world-screen.tsx"),
  read("src/components/progression-celebration.tsx"),
  read("src/components/combat-readability.tsx"),
  read("VERSIONS.md"),
]);

test("region echoes persist per road and do not clear with the banner", () => {
  assert.match(model, /regionEchoes/);
  assert.match(model, /export function recordRegionEcho/);
  assert.match(store, /recordRegionEcho\(s, c\.pathId/);
  const clearImpl = store.match(/clearRoadEcho: \(\) => \{[\s\S]*?\n  \},/)?.[0] ?? "";
  assert.match(clearImpl, /s\.roadEcho = null/);
  assert.doesNotMatch(clearImpl, /regionEchoes/);
  assert.match(journey, /regionEchoes/);
  assert.match(journey, /Echo ·/);
});

test("camp construction surfaces on Journey as Camp on the road", () => {
  assert.match(camp, /campRoadEffects/);
  assert.match(journey, /Camp on the road/);
  assert.match(journey, /campRoadEffects/);
});

test("Bond stage and combine afterglow celebrate without scolding", () => {
  assert.match(celebrate, /Bond stage/);
  assert.match(celebrate, /Combine afterglow/);
  assert.match(celebrate, /Warmth only gathers/);
  assert.doesNotMatch(celebrate, /you failed|don't forget|you should/i);
});

test("Winding to Charging coach stays readable", () => {
  assert.match(readability, /Winding now/);
  assert.match(journey, /Winding now · next turn they Charge/);
  assert.match(journey, /combat never cools it/);
});

test("VERSIONS names v20", () => {
  assert.match(versions, /## v20/);
  assert.match(versions, /egg warmth|region echo|Camp on the road/i);
});
