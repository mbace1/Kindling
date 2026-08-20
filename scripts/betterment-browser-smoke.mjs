#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const out = process.argv[3] || "artifacts/betterment-mobile.png";
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true }).catch(() => undefined);

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
const requested = new Set();
page.on("pageerror", (e) => errors.push(String(e?.message || e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("response", (r) => { if (r.url().includes("/art/")) requested.add(new URL(r.url()).pathname); });

let failed = null;
try {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  assert.ok(response && response.status() < 400, `page status ${response?.status()}`);

  await page.getByRole("button", { name: "Tend the fire" }).waitFor();
  await page.getByRole("button", { name: "Tend the fire" }).click();
  await page.getByRole("button", { name: "Tend the fire" }).waitFor({ state: "detached" });
  await page.getByRole("heading", { name: "0 / 5 tended" }).waitFor();

  assert.equal(await page.locator("canvas").count(), 1, "Today has one composed camp canvas");
  await page.waitForFunction(() => document.querySelector("canvas")?.width > 0);
  await page.waitForTimeout(500);
  assert.ok([...requested].some((p) => p.endsWith("/art/camp.jpg")), "live camp art was requested");
  assert.ok([...requested].some((p) => p.endsWith("/art/ember.png")), "live Ember sprite was requested");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Do 10 push-ups +" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  const pushups = page.getByRole("button", { name: /Do 10 push-ups/ }).first();
  await pushups.click();
  await page.getByText("Optional · go further", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "1 / 5 tended" }).count(), 1, "base goal adds one Fire point");
  const afterBase = await page.locator("body").innerText();
  assert.match(afterBase, /20\s+Flames/, "base goal shows 20 Flames");
  assert.match(afterBase, /20 Bond XP/, "base goal grows active companion Bond");

  await page.getByRole("button", { name: /Feeling good\? Reach 20 push-ups total/ }).click();
  await page.getByText(/One more tier: reach 30 push-ups total/).waitFor();
  assert.equal(await page.getByRole("heading", { name: "1 / 5 tended" }).count(), 1, "Tier II does not add Fire");
  const afterTier2 = await page.locator("body").innerText();
  assert.match(afterTier2, /40\s+Flames/, "Tier II added 20 Flames");
  assert.match(afterTier2, /60 Bond XP/, "Tier II added 40 Bond XP");

  await page.getByRole("button", { name: /^Drank some water/ }).click();
  await page.getByRole("heading", { name: "2 / 5 tended" }).waitFor();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `mobile page overflows horizontally by ${overflow}px`);

  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: "The road keeps opening." }).waitFor();
  const journeyText = await page.locator("body").innerText();
  assert.match(journeyText, /60 Flames/, "Journey price is 60 Flames");
  assert.match(journeyText, /about 90 seconds/, "Journey explains its duration");

  await page.getByRole("button", { name: "Birch Ruins" }).click();
  await page.getByRole("heading", { name: /is on the path\./ }).waitFor();
  const beforeReload = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("kindlingState") || "null");
    return { walk: save?.walk, fuel: save?.fuel, seen: save?.seen };
  });
  assert.ok(beforeReload.walk, "Journey is persisted to the save");
  assert.equal(beforeReload.walk.endsAt - beforeReload.walk.startedAt, 90_000, "Journey duration is exactly 90 seconds");
  assert.equal(beforeReload.fuel, 0, "Journey spends exactly 60 Flames / 3 legacy fuel");
  assert.equal(beforeReload.seen, true, "intro dismissal survived hydration");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "2 / 5 tended" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Tend the fire" }).count(), 0, "intro does not return after reload");
  assert.equal(await page.getByText(/Ember is on the path\./).count(), 1, "active Journey is visible immediately after reload");
  assert.match(await page.locator("canvas").getAttribute("aria-label"), /^The bonfire$/, "away companion is not presented as being at camp");

  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: /is on the path\./ }).waitFor();
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null")?.walk);
  assert.equal(afterReload.startedAt, beforeReload.walk.startedAt, "reload does not reroll Journey start");
  assert.equal(afterReload.endsAt, beforeReload.walk.endsAt, "reload does not reroll Journey finish");

  await page.getByRole("button", { name: "Today" }).click();
  await page.getByRole("heading", { name: "2 / 5 tended" }).waitFor();
  assert.equal(await page.getByText(/Ember is on the path\./).count(), 1, "Journey status remains visible from Today");
  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, viewport: "390x844", art: [...requested], screenshot: out }, null, 2));
} catch (err) {
  failed = err;
  const overlays = await page.locator(".fixed.inset-0.z-40").allInnerTexts().catch(() => []);
  console.error(JSON.stringify({ ok: false, overlays, errors, art: [...requested], error: String(err?.message || err) }, null, 2));
} finally {
  await page.screenshot({ path: out, fullPage: true }).catch(() => undefined);
  await browser.close();
}

if (failed) throw failed;
