#!/usr/bin/env node
import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();

function roll(pathId, startedAt) {
  let h = (startedAt >>> 0) ^ 0x51ed270b;
  for (let i = 0; i < pathId.length; i++) {
    h = Math.imul(h ^ pathId.charCodeAt(i), 0x45d9f3b) >>> 0;
    h ^= h >>> 16;
  }
  return (h >>> 0) / 0x1_0000_0000;
}
function counter(v) { return v === "strike" ? "Guard" : v === "guard" ? "Skill" : "Strike"; }

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const intro = page.getByRole("button", { name: "Tend the fire" });
  await intro.waitFor({ state: "visible" });
  await intro.click();
  await intro.waitFor({ state: "detached" });
  await page.getByRole("heading", { name: /0 \/ 6 care tasks/ }).waitFor();

  for (const name of ["Drank some water", "Stepped outside", "Moved your body"]) {
    await page.getByRole("button", { name: new RegExp(`^${name}`) }).first().click();
  }
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.ok(saved.fuel >= 3, "three care actions earn enough Flames for a Journey");

  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("kindlingState") || "null");
    s.found = [{ id: "gate-ruin", name: "old birch token", kind: "relic", from: "ruin", date: s.sheet.date }, ...(s.found || [])];
    localStorage.setItem("kindlingState", JSON.stringify(s));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("button", { name: "Drowned Courtyard" }).click();
  await page.getByRole("heading", { name: /is on the path\./ }).waitFor();

  const deterministicStart = await page.evaluate(({ now }) => {
    const pathId = "forest";
    const localRoll = (startedAt) => {
      let h = (startedAt >>> 0) ^ 0x51ed270b;
      for (let i = 0; i < pathId.length; i++) {
        h = Math.imul(h ^ pathId.charCodeAt(i), 0x45d9f3b) >>> 0;
        h ^= h >>> 16;
      }
      return (h >>> 0) / 0x1_0000_0000;
    };
    for (let i = 0; i < 5000; i++) {
      const candidate = now - 32_000 - i;
      if (localRoll(candidate) < 0.35) return candidate;
    }
    throw new Error("no deterministic ambush seed found");
  }, { now: Date.now() });
  assert.ok(roll("forest", deterministicStart) < 0.35, "seed guarantees Drowned Courtyard shortcut ambush");
  await page.evaluate((startedAt) => {
    const s = JSON.parse(localStorage.getItem("kindlingState") || "null");
    s.walk.startedAt = startedAt;
    s.walk.endsAt = startedAt + 90_000;
    localStorage.setItem("kindlingState", JSON.stringify(s));
  }, deterministicStart);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("button", { name: /Wade through/ }).waitFor();
  const beforeCombat = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  const rewardsBefore = beforeCombat.found.length;
  await page.getByRole("button", { name: /Wade through/ }).click();
  await page.getByRole("heading", { name: "Mossling" }).waitFor();

  for (let turn = 0; turn < 30; turn++) {
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
    if (saved.combat?.result) break;
    const action = counter(saved.combat.telegraph);
    await page.getByRole("button", { name: new RegExp(`^${action}`) }).click();
  }
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(saved.combat?.result, "win", "counter-reading loop wins the deterministic encounter");
  assert.ok(saved.found.length > rewardsBefore, "combat victory grants a Journey reward");
  await page.getByRole("button", { name: "Back to the paths" }).click();
  await page.getByRole("button", { name: "Today" }).click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(saved.combat, null, "full loop returns from combat to camp");
  assert.equal(saved.walk, null, "ambush resolves the active walk");
  console.log(JSON.stringify({ ok: true, care: true, flames: true, journey: true, decision: "shortcut", combat: "win", reward: true, returned: true }, null, 2));
} finally {
  await browser.close();
}
