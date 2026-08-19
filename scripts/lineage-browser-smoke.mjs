#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true }).catch(() => undefined);

function keyDaysAgo(days) {
  const d = new Date(Date.now() - days * 86_400_000 - 4 * 3_600_000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

const today = keyDaysAgo(0);
const tasks = [
  { id: "water", text: "Drank some water", category: "body" },
  { id: "outside", text: "Stepped outside", category: "daily" },
  { id: "moved", text: "Moved your body", category: "body" },
  { id: "ate", text: "Ate something real", category: "body" },
  { id: "tidied", text: "Put one thing back", category: "daily" },
  { id: "said", text: "Said something to someone", category: "connection" },
];

function companion(id, species, name, born = keyDaysAgo(8), bondXp = 360) {
  return { id, species, name, born, bondXp };
}

function save(overrides = {}) {
  const ember = companion("ember-a", "ember", "Ember");
  return {
    v: 1,
    updatedAt: Date.now(),
    tasks,
    sheet: { date: today, done: [], paid: [], bonus: [], mood: null, breaths: 0 },
    fuel: 0,
    kept: 18,
    days: 8,
    streak: 1,
    best: 4,
    lastKept: today,
    found: [],
    journal: [],
    sound: false,
    seen: true,
    companion: ember,
    lineage: [],
    unlocked: ["ember", "mossling"],
    kindlingPending: false,
    awaitingHatch: false,
    egg: null,
    combat: null,
    walk: null,
    encounters: { wins: 0, losses: 0 },
    roster: [ember],
    walkedOnce: true,
    ...overrides,
  };
}

async function seededPage(browser, initial) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript((seed) => localStorage.setItem("kindlingState", JSON.stringify(seed)), initial);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e?.message || e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  return { context, page, errors };
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  // ── Egg / lineage ────────────────────────────────────────────────
  const ember = companion("ember-a", "ember", "Ember");
  const moss = companion("moss-b", "mossling", "Mossling");
  const eggRun = await seededPage(browser, save({ companion: ember, roster: [ember, moss], unlocked: ["ember", "mossling"] }));
  const { page: eggPage } = eggRun;

  await eggPage.getByRole("button", { name: "Keep" }).click();
  await eggPage.getByRole("heading", { name: "Ember" }).waitFor();
  assert.match(await eggPage.locator("body").innerText(), /a tender/, "mature Ember reads as tender");
  assert.match(await eggPage.locator("body").innerText(), /Mossling/, "second mature parent is present");

  const pair = eggPage.getByRole("button", { name: /Ember · Mossling/ });
  await pair.click();
  await eggPage.getByText("Ember Egg", { exact: true }).waitFor();
  const afterPair = await eggPage.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(afterPair.roster.length, 2, "breeding consumes neither parent");
  assert.equal(afterPair.egg.species, "ashling", "Ember + Mossling produces an Ashling egg");
  assert.equal(afterPair.egg.required, 5, "egg requires five future ordinary care actions");
  assert.equal(afterPair.egg.startedKept, 18, "egg warmth starts at the current lifetime-care count");

  await eggPage.getByRole("button", { name: "Today" }).click();
  for (const name of ["Drank some water", "Stepped outside", "Moved your body", "Ate something real", "Put one thing back"]) {
    await eggPage.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  }
  await eggPage.getByRole("heading", { name: "5 / 5 tended" }).waitFor();
  await eggPage.getByRole("button", { name: "Keep" }).click();
  await eggPage.getByText("Warm enough to hatch whenever you are ready.").waitFor();
  assert.match(await eggPage.locator("body").innerText(), /5 \/ 5 ordinary care actions warmed the egg/, "five real care actions fully warm the egg");

  await eggPage.getByRole("button", { name: "Hatch" }).click();
  const hatched = await eggPage.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(hatched.egg, null, "hatch clears the egg");
  assert.equal(hatched.roster.length, 3, "offspring joins both surviving parents");
  assert.deepEqual(hatched.roster.slice(0, 2).map((m) => m.id), ["ember-a", "moss-b"], "parents remain unchanged in roster order");
  assert.ok(hatched.roster.some((m) => m.species === "ashling"), "Ashling offspring exists");
  await eggPage.screenshot({ path: "artifacts/betterment-lineage.png", fullPage: true });
  assert.deepEqual(eggRun.errors, [], `egg flow browser errors: ${eggRun.errors.join(" | ")}`);
  await eggRun.context.close();

  // ── First missed day: warning only ──────────────────────────────
  const warnRun = await seededPage(browser, save({ lastKept: keyDaysAgo(2) }));
  const warningBody = await warnRun.page.locator("body").innerText();
  assert.match(warningBody, /The fire is fading\./, "one fully missed care-day shows warning state");
  assert.equal(await warnRun.page.getByText(/became Kindling/).count(), 0, "first missed day does not Kindle");
  assert.deepEqual(warnRun.errors, [], `warning flow browser errors: ${warnRun.errors.join(" | ")}`);
  await warnRun.context.close();

  // ── Never-started save: install day grace, then two misses ─────
  const oldEmber = companion("ember-old", "ember", "Ember", keyDaysAgo(3), 160);
  const kindleRun = await seededPage(browser, save({
    kept: 0,
    days: 0,
    streak: 0,
    best: 0,
    lastKept: null,
    companion: oldEmber,
    roster: [oldEmber],
    unlocked: ["ember"],
  }));
  const { page: kindlePage } = kindleRun;
  await kindlePage.getByRole("heading", { name: "Ember became Kindling." }).waitFor();
  const anchored = await kindlePage.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(anchored.lastKept, oldEmber.born, "never-started save is anchored to birth after install-day grace");
  assert.equal(anchored.kindlingPending, true, "two completed missed days trigger Kindling even before a first care action");

  await kindlePage.screenshot({ path: "artifacts/betterment-kindling.png", fullPage: true });
  await kindlePage.getByRole("button", { name: "Keep their name" }).click();
  await kindlePage.getByRole("heading", { name: "Something small is waiting." }).waitFor();
  await kindlePage.getByRole("button", { name: /Ember/ }).click();
  await kindlePage.getByRole("heading", { name: "0 / 5 tended" }).waitFor();
  const restarted = await kindlePage.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(restarted.lineage.length, 1, "Kindled monster is retained as one ancestor");
  assert.equal(restarted.lineage[0].id, "ember-old", "ancestor keeps the actual Kindled monster identity");
  assert.equal(restarted.lineage[0].bondXp, 160, "ancestor keeps its own Bond XP");
  assert.ok(restarted.companion && restarted.companion.id !== "ember-old", "a new living Ember can continue immediately");
  assert.equal(restarted.awaitingHatch, false, "restart hatch closes the empty-coals state");
  assert.deepEqual(kindleRun.errors, [], `Kindling flow browser errors: ${kindleRun.errors.join(" | ")}`);
  await kindleRun.context.close();

  console.log(JSON.stringify({ ok: true, egg: true, warning: true, kindling: true }, null, 2));
} finally {
  await browser.close();
}
