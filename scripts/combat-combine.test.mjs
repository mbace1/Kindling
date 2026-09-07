import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (p) => readFile(new URL(`../${p}`, import.meta.url), "utf8");

const [model, store, combat, moves, keep, pack, cinematic, canonical] = await Promise.all([
  read("src/lib/kindling/model.ts"),
  read("src/lib/kindling/store.ts"),
  read("src/lib/kindling/companion-combat.ts"),
  read("src/lib/kindling/combat-moves.ts"),
  read("src/components/companion-responsive.tsx"),
  read("src/components/pack-responsive.tsx"),
  read("src/components/finger-touch-combine.tsx"),
  read("CANONICAL.md"),
]);

test("combine is the player-facing name for the same breed save contract", () => {
  assert.match(store, /combine: \(aId, bId\) => \{\s*get\(\)\.breed\(aId, bId\);/);
  assert.match(store, /An Ember Egg rests in the coals/);
  assert.match(store, /Combining never consumes either parent/);
  assert.match(store, /s\.egg = \{/);
  assert.doesNotMatch(store.match(/breed: \(aId, bId\) => \{[\s\S]*?\n  \},/)?.[0] ?? "", /s\.roster = s\.roster\.filter/);
  assert.doesNotMatch(store.match(/breed: \(aId, bId\) => \{[\s\S]*?\n  \},/)?.[0] ?? "", /s\.roster\.splice/);
});

test("egg warmth still only accumulates from kept care", () => {
  assert.match(model, /EGG_WARMTH_REQUIRED\s*=\s*5/);
  assert.match(model, /s\.kept\s*-\s*s\.egg\.startedKept/);
  assert.doesNotMatch(model, /egg\.required\s*-=/);
  assert.doesNotMatch(model, /startedKept\s*\+=/);
  assert.match(keep, /Missed days do not cool it/);
});

test("tender-or-older remains the combine gate", () => {
  assert.match(store, /bondUnits\(a\) < 18 \|\| bondUnits\(b\) < 18/);
  assert.match(keep, /Two tender-or-older companions can combine/);
  assert.match(model, /id: "tender"/);
});

test("combat names moves and keeps the Strike\/Guard\/Skill triangle", () => {
  assert.match(moves, /Hearth Strike/);
  assert.match(moves, /Bark Shell/);
  assert.match(moves, /Cinder Dash/);
  assert.match(moves, /Counter Toll/);
  assert.match(model, /countered/);
  assert.match(store, /combatStatsForCompanion/);
  assert.match(combat, /identity: "Hearthcaster"/);
});

test("Keep and Pack treat combat and combine as one firelit game", () => {
  assert.match(keep, /FingerTouchCombine/);
  assert.match(keep, /Fingertip|combine/i);
  assert.match(pack, /fingertip to fingertip|Fusion energy is still warming/);
  assert.match(cinematic, /Fingertip to fingertip/);
  assert.match(cinematic, /neither leaves the fire/);
  assert.doesNotMatch(keep, /you failed|don't forget|you should/i);
  assert.doesNotMatch(pack, /you failed|don't forget|you should/i);
});

test("canonical invariants still name the breed\/egg contract", () => {
  assert.match(canonical, /breeding \/ combining never consumes either parent/);
  assert.match(canonical, /egg warmth accumulates; missed time does not reduce it/);
  assert.match(canonical, /combat loss never removes wellness progress/);
});
