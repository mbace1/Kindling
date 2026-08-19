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
const departure = Date.now() - 120_000;
const ember = { id: "ember-return", species: "ember", name: "Ember", born: today, bondXp: 100 };
const seed = {
  v: 1,
  updatedAt: departure,
  tasks: [
    { id: "water", text: "Drank some water", category: "body" },
    { id: "outside", text: "Stepped outside", category: "daily" },
    { id: "moved", text: "Moved your body", category: "body" },
    { id: "ate", text: "Ate something real", category: "body" },
    { id: "tidied", text: "Put one thing back", category: "daily" },
  ],
  sheet: { date: today, done: ["water"], paid: ["water"], bonus: [], mood: null, breaths: 0 },
  fuel: 0,
  kept: 5,
  days: 2,
  streak: 1,
  best: 2,
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
  combat: null,
  walk: { pathId: "ruin", startedAt: departure, endsAt: departure + 90_000 },
  encounters: { wins: 0, losses: 0 },
  roster: [ember],
  walkedOnce: true,
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

async function runOnce(label) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript((value) => localStorage.setItem("kindlingState", JSON.stringify(value)), seed);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e?.message || e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  // The app opens on Today, hydrates the expired Journey, then immediately
  // resolves it and moves to Pack. No manual Walk-tab visit is allowed here.
  await page.getByRole("heading", { name: "Pack" }).waitFor({ timeout: 10_000 });
  assert.equal(await page.getByText(/is on the path/i).count(), 0, `${label}: expired journey is no longer shown as active`);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(saved.walk, null, `${label}: expired Journey is cleared on return`);
  assert.equal(saved.combat, null, `${label}: safe Birch ruin return does not create combat`);
  assert.equal(saved.found.length, 1, `${label}: exactly one return item is created`);
  assert.equal(saved.found[0].from, "ruin", `${label}: find remembers the route`);
  assert.ok(saved.journal.some((entry) => entry.lines.some((line) => line.includes(saved.found[0].name))), `${label}: return is written into the journal`);
  assert.match(await page.locator("body").innerText(), new RegExp(saved.found[0].name, "i"), `${label}: returned item is visible immediately`);
  assert.deepEqual(errors, [], `${label}: browser errors: ${errors.join(" | ")}`);

  await page.screenshot({ path: `artifacts/betterment-return-${label}.png`, fullPage: true }).catch(() => undefined);
  await context.close();
  return saved.found[0].name;
}

try {
  const first = await runOnce("a");
  const second = await runOnce("b");
  assert.equal(second, first, "same saved departure resolves to the same find after reload/replay");
  console.log(JSON.stringify({ ok: true, find: first, deterministic: true }, null, 2));
} finally {
  await browser.close();
}
