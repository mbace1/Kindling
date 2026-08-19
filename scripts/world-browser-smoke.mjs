#!/usr/bin/env node
import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";

function dayKeyNow() {
  const d = new Date(Date.now() - 4 * 3_600_000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const today = dayKeyNow();
const ember = { id: "ember-world", species: "ember", name: "Ember", born: today, bondXp: 160 };

function seed(clears = []) {
  const found = clears.map((from, index) => ({
    id: `clear-${from}`,
    name: `proof ${index + 1}`,
    kind: "relic",
    from,
    date: today,
  }));
  return {
    v: 1,
    updatedAt: Date.now(),
    tasks: [{ id: "water", text: "Drank some water", category: "body" }],
    sheet: { date: today, done: ["water"], paid: ["water"], bonus: [], mood: null, breaths: 0 },
    fuel: 10,
    kept: 8,
    days: 3,
    streak: 1,
    best: 2,
    lastKept: today,
    found,
    journal: [],
    sound: false,
    seen: true,
    companion: ember,
    lineage: [],
    unlocked: ["ember"],
    kindlingPending: false,
    awaitingHatch: false,
    egg: null,
    combat: null,
    walk: null,
    encounters: { wins: 0, losses: 0 },
    roster: [ember],
    walkedOnce: true,
  };
}

async function openWorld(browser, value) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript((save) => localStorage.setItem("kindlingState", JSON.stringify(save)), value);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.locator("main canvas").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: "The road keeps opening." }).waitFor();
  return { context, page };
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  const fresh = await openWorld(browser, seed());
  assert.equal(await fresh.page.getByRole("button", { name: "Birch Ruins" }).isEnabled(), true, "Birch Ruins starts open");
  assert.equal(await fresh.page.getByRole("button", { name: "Drowned Courtyard" }).isDisabled(), true, "Drowned Courtyard starts locked");
  assert.equal(await fresh.page.getByRole("button", { name: "Bell Keep" }).isDisabled(), true, "Bell Keep starts locked");
  assert.equal(await fresh.page.getByRole("button", { name: "Ashwood" }).isDisabled(), true, "Ashwood starts locked");
  assert.match(await fresh.page.locator("body").innerText(), /0 \/ 5\s+roads known/, "fresh world shows five-chapter progression");
  await fresh.context.close();

  const afterBirch = await openWorld(browser, seed(["ruin"]));
  assert.equal(await afterBirch.page.getByRole("button", { name: "Drowned Courtyard" }).isEnabled(), true, "Birch clear opens Drowned Courtyard");
  assert.equal(await afterBirch.page.getByRole("button", { name: "Bell Keep" }).isDisabled(), true, "Bell Keep still waits for Drowned Courtyard");
  await afterBirch.page.getByRole("button", { name: "Drowned Courtyard" }).click();
  await afterBirch.page.getByRole("heading", { name: /Ember is on the path\./ }).waitFor();
  const drownedWalk = await afterBirch.page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null")?.walk);
  assert.equal(drownedWalk.pathId, "forest", "Drowned Courtyard preserves the legacy forest route id in saves");
  await afterBirch.context.close();

  const deep = await openWorld(browser, seed(["ruin", "forest", "road", "ash"]));
  for (const name of ["Birch Ruins", "Drowned Courtyard", "Bell Keep", "Ashwood"]) {
    assert.equal(await deep.page.getByRole("button", { name }).isEnabled(), true, `${name} remains replayable after clear`);
  }
  assert.match(await deep.page.locator("body").innerText(), /The gate is visible beyond Ashwood\. It does not open yet\./, "Old Gate is revealed after Ashwood");
  assert.match(await deep.page.locator("body").innerText(), /4 \/ 5\s+roads known/, "four live regions plus Old Gate are represented");
  const overflow = await deep.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `world screen overflows horizontally by ${overflow}px`);
  await deep.page.screenshot({ path: "artifacts/betterment-world.png", fullPage: true });
  await deep.context.close();

  console.log(JSON.stringify({ ok: true, sequence: ["Birch Ruins", "Drowned Courtyard", "Bell Keep", "Ashwood", "Old Gate"] }, null, 2));
} finally {
  await browser.close();
}
