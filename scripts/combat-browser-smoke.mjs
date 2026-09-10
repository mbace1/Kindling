#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true }).catch(() => undefined);

function dayKeyNow() {
  const d = new Date(Date.now() - 4 * 3_600_000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const today = dayKeyNow();
const tasks = [
  { id: "water", text: "Drank some water", category: "body" },
  { id: "outside", text: "Stepped outside", category: "daily" },
  { id: "moved", text: "Moved your body", category: "body" },
  { id: "ate", text: "Ate something real", category: "body" },
  { id: "tidied", text: "Put one thing back", category: "daily" },
];

function seed(combat) {
  const ember = { id: "ember-combat", species: "ember", name: "Ember", born: today, bondXp: 240 };
  return {
    v: 1,
    updatedAt: Date.now(),
    tasks,
    sheet: { date: today, done: ["water", "outside"], paid: ["water", "outside"], bonus: [], mood: "steady", breaths: 0 },
    fuel: 4,
    kept: 12,
    days: 5,
    streak: 2,
    best: 4,
    lastKept: today,
    found: [],
    journal: [],
    sound: false,
    seen: true,
    companion: ember,
    lineage: [],
    unlocked: ["ember"],
    kindlingPending: false,
    awaitingHatch: false,
    egg: null,
    combat,
    walk: null,
    encounters: { wins: 0, losses: 0 },
    roster: [ember],
    walkedOnce: true,
    rivals: {},
  };
}

function wellness(saved) {
  return {
    sheet: saved.sheet,
    fuel: saved.fuel,
    kept: saved.kept,
    days: saved.days,
    streak: saved.streak,
    best: saved.best,
    lastKept: saved.lastKept,
    bondXp: saved.companion?.bondXp,
    lineage: saved.lineage,
  };
}

async function seededPage(browser, initial) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript((value) => localStorage.setItem("kindlingState", JSON.stringify(value)), initial);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e?.message || e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator("main canvas").waitFor({ state: "visible" });
  return { context, page, errors };
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
let activePage = null;
let failureShot = "artifacts/betterment-combat-failure.png";
try {
  const retreatCombat = {
    enemy: "mossknight", pathId: "road", playerHp: 26, playerMax: 26,
    enemyHp: 48, enemyMax: 48, telegraph: "strike", log: ["Moss Knight holds the path."], result: null,
  };
  const retreatRun = await seededPage(browser, seed(retreatCombat));
  activePage = retreatRun.page;
  const retreatBefore = await retreatRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  await retreatRun.page.getByRole("button", { name: /Retreat from the encounter/ }).click();
  await retreatRun.page.getByRole("heading", { name: "The road keeps opening." }).waitFor();
  const retreatAfter = await retreatRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(retreatAfter.combat, null, "retreat closes combat immediately");
  assert.deepEqual(wellness(retreatAfter), wellness(retreatBefore), "retreat cannot change wellness, Flames, Bond, or lineage");
  assert.equal(retreatAfter.found.length, 0, "retreat creates no reward");
  assert.deepEqual(retreatRun.errors, [], `retreat browser errors: ${retreatRun.errors.join(" | ")}`);
  await retreatRun.context.close();
  activePage = null;

  const loseCombat = {
    enemy: "mossknight", pathId: "road", playerHp: 1, playerMax: 26,
    enemyHp: 48, enemyMax: 48, telegraph: "strike", log: ["Moss Knight holds the path."], result: null,
  };
  const loseRun = await seededPage(browser, seed(loseCombat));
  activePage = loseRun.page;
  failureShot = "artifacts/betterment-combat-defeat-failure.png";
  const loseBefore = await loseRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  await loseRun.page.getByRole("button", { name: "Walk" }).click();
  await loseRun.page.getByRole("heading", { name: "Moss Knight" }).waitFor();
  await loseRun.page.screenshot({ path: "artifacts/betterment-combat-actions.png", fullPage: true });
  await loseRun.page.getByRole("button", { name: "Strike" }).click();
  await loseRun.page.getByText("You walk home. The fire is still there.").waitFor();
  const loseAfter = await loseRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(loseAfter.combat.result, "lose", "combat records defeat");
  assert.equal(loseAfter.encounters.losses, 1, "defeat increments only encounter loss history");
  assert.deepEqual(wellness(loseAfter), wellness(loseBefore), "defeat cannot change wellness, Flames, Bond, or lineage");
  assert.equal(loseAfter.found.length, 0, "defeat awards no loot");
  assert.ok(typeof loseAfter.roadEcho === "string" && loseAfter.roadEcho.length > 0, "defeat leaves a road echo for Journey");
  assert.ok(loseAfter.combat.nerveMax >= 3, "combat carries Nerve");
  await loseRun.page.screenshot({ path: "artifacts/betterment-combat-defeat.png", fullPage: true });
  assert.deepEqual(loseRun.errors, [], `defeat browser errors: ${loseRun.errors.join(" | ")}`);
  await loseRun.context.close();
  activePage = null;

  const winCombat = {
    enemy: "mossling", pathId: "forest", playerHp: 26, playerMax: 26,
    enemyHp: 1, enemyMax: 30, telegraph: "strike", log: ["Mossling holds the path."], result: null,
  };
  const winRun = await seededPage(browser, seed(winCombat));
  activePage = winRun.page;
  failureShot = "artifacts/betterment-combat-win-failure.png";
  const winBefore = await winRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  await winRun.page.getByRole("button", { name: "Walk" }).click();
  await winRun.page.getByRole("heading", { name: "Mossling" }).waitFor();
  await winRun.page.getByRole("button", { name: "Skill" }).click();
  await winRun.page.getByText("The path opens.").waitFor();
  const won = await winRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(won.combat.result, "win", "combat records victory");
  assert.equal(won.encounters.wins, 1, "victory increments encounter win history");
  assert.equal(won.found.length, 1, "victory can add one route reward");
  assert.deepEqual(wellness(won), wellness(winBefore), "victory reward cannot alter wellness, Flames, Bond, or lineage");
  assert.ok(typeof won.roadEcho === "string" && won.roadEcho.length > 0, "victory leaves a road echo for Journey");
  await winRun.page.getByRole("button", { name: "Keep them by the fire" }).click();
  await winRun.page.getByRole("heading", { name: "Ember", exact: true }).waitFor();
  const captured = await winRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(captured.combat, null, "capture closes combat");
  assert.equal(captured.roster.length, 2, "captured Mossling joins the roster");
  assert.ok(captured.roster.some((m) => m.species === "mossling"), "captured species is present by the fire");
  assert.equal(captured.companion.id, "ember-combat", "capture does not replace the active companion");
  assert.deepEqual(wellness(captured), wellness(winBefore), "capture cannot alter wellness, Flames, Bond, or lineage");
  await winRun.page.screenshot({ path: "artifacts/betterment-combat-win.png", fullPage: true });
  assert.deepEqual(winRun.errors, [], `victory browser errors: ${winRun.errors.join(" | ")}`);
  await winRun.context.close();
  activePage = null;

  const rivalPhaseCombat = {
    enemy: "mossling",
    pathId: "ruin",
    playerHp: 26,
    playerMax: 26,
    enemyHp: 1,
    enemyMax: 26,
    telegraph: "guard",
    log: ["Pale Archwarden · Keeper of Birch Ruins holds the road.", "Phase 1 · False openings."],
    result: null,
    nerve: 3,
    nerveMax: 3,
    pattern: "steady",
    chargeVerb: null,
    chargePhase: null,
    round: 1,
    rivalId: "pale-archwarden",
    rivalPhase: 0,
    rivalPhases: 2,
    rivalName: "Pale Archwarden",
  };
  const phaseRun = await seededPage(browser, seed(rivalPhaseCombat));
  activePage = phaseRun.page;
  failureShot = "artifacts/betterment-combat-rival-failure.png";
  await phaseRun.page.getByRole("button", { name: "Walk" }).click();
  await phaseRun.page.getByRole("heading", { name: "Pale Archwarden" }).waitFor();
  await phaseRun.page.getByText(/phase 1\/2/i).waitFor();
  await phaseRun.page.getByRole("button", { name: "Skill" }).click();
  await phaseRun.page.getByText(/Phase 2/i).waitFor();
  const mid = await phaseRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(mid.combat.result, null, "phase advance is not a win yet");
  assert.equal(mid.combat.rivalPhase, 1, "rival advances to phase 2");
  assert.ok(mid.combat.enemyHp > 0, "phase 2 restores rival HP");
  assert.deepEqual(phaseRun.errors, [], `rival phase browser errors: ${phaseRun.errors.join(" | ")}`);
  await phaseRun.context.close();
  activePage = null;

  const rivalFinale = {
    ...rivalPhaseCombat,
    rivalPhase: 1,
    rivalPhases: 2,
    enemyHp: 1,
    enemyMax: 30,
    log: ["Pale Archwarden · phase 2."],
  };
  const finaleRun = await seededPage(browser, { ...seed(rivalFinale), rivals: { ruin: { status: "challenged", updatedAt: Date.now() } } });
  activePage = finaleRun.page;
  const rivalBefore = await finaleRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  await finaleRun.page.getByRole("button", { name: "Walk" }).click();
  await finaleRun.page.getByRole("heading", { name: "Pale Archwarden" }).waitFor();
  await finaleRun.page.getByRole("button", { name: "Skill" }).click();
  await finaleRun.page.getByText("The path opens.").waitFor();
  const rivalAfter = await finaleRun.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(rivalAfter.combat.result, "win", "rival duel completes");
  assert.equal(rivalAfter.rivals?.ruin?.status, "bested", "rival marked bested");
  assert.deepEqual(wellness(rivalAfter), wellness(rivalBefore), "rival win cannot change wellness");
  assert.ok(typeof rivalAfter.roadEcho === "string" && /Pale Archwarden|yield/i.test(rivalAfter.roadEcho), "bested road echo");
  await finaleRun.page.screenshot({ path: "artifacts/betterment-combat-rival.png", fullPage: true });
  assert.deepEqual(finaleRun.errors, [], `rival finale browser errors: ${finaleRun.errors.join(" | ")}`);
  await finaleRun.context.close();
  activePage = null;

  console.log(JSON.stringify({ ok: true, retreat: true, defeat: true, victory: true, capture: true, rival: true }, null, 2));
} catch (err) {
  await activePage?.screenshot({ path: failureShot, fullPage: true }).catch(() => undefined);
  throw err;
} finally {
  await browser.close();
}
