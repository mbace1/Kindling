#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const out = process.argv[3] || "artifacts/betterment-mobile.png";
const campOut = out.replace(/\.png$/i, "-camp.png");
const allowStaticHydration = process.argv.includes("--allow-static-hydration");
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true }).catch(() => undefined);

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
const requested = new Set();
const failedResponses = [];
page.on("pageerror", (e) => errors.push(String(e?.message || e)));
page.on("console", (m) => {
  if (m.type() !== "error") return;
  const message = m.text();
  if (!message.startsWith("Failed to load resource:")) errors.push(message);
});
page.on("response", (r) => {
  const pathname = new URL(r.url()).pathname;
  if (pathname.includes("/art/")) requested.add(pathname);
  if (r.status() >= 400) failedResponses.push(`${r.status()} ${pathname}`);
});

let failed = null;
try {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  assert.ok(response && response.status() < 400, `page status ${response?.status()}`);

  await page.getByRole("button", { name: "Tend the fire" }).waitFor();
  await page.getByRole("button", { name: "Tend the fire" }).click();
  await page.getByRole("button", { name: "Tend the fire" }).waitFor({ state: "detached" });
  await page.getByRole("heading", { name: "0 / 6 care tasks" }).waitFor();

  assert.equal(await page.locator("canvas").count(), 1, "Today has one gameplay canvas");
  await page.waitForFunction(() => document.querySelector("canvas")?.width > 0);
  for (const name of ["camp-q1.png", "camp-q2.png", "camp-q3.png", "camp-q4.png"]) {
    assert.ok([...requested].some((p) => p.endsWith(`/art/camp/${name}`)), `${name} was requested`);
  }
  assert.ok([...requested].some((p) => p.endsWith("/art/ember-idle-runtime.svg")), "live Ember idle atlas was requested");
  for (const name of ["mossling-idle-runtime.png", "ashling-idle-runtime.png", "mossknight-idle-runtime.png"]) {
    const atlas = await page.request.get(new URL(`art/${name}`, url).toString());
    assert.equal(atlas.status(), 200, `${name} is served as a runtime atlas`);
  }
  assert.ok([...requested].some((p) => p.endsWith("/art/fire-states.png")), "approved five-state fire sheet was requested");
  assert.ok([...requested].some((p) => p.endsWith("/art/ui/ui-kit.png")), "approved UI kit atlas was requested");
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('img[data-camp-tile]')];
    return tiles.length === 4 && tiles.every((img) => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
  }, null, { timeout: 10_000 });
  const campScene = page.locator('[data-camp-scene="native-16x9"]');
  const plateBox = await campScene.boundingBox();
  assert.ok(plateBox && plateBox.width >= 380 && plateBox.height >= 210, "clean camp plate visibly fills the 16:9 phone scene");
  assert.ok(plateBox && Math.abs((plateBox.width / plateBox.height) - (16 / 9)) < 0.08, "camp plate preserves the documented 16:9 canvas");

  const moreCare = page.getByRole("button", { name: /More care/ });
  assert.equal(await moreCare.count(), 1, "phone Today exposes one compact secondary-care control");
  assert.equal(await moreCare.getAttribute("aria-expanded"), "false", "secondary care is collapsed by default on phone");
  assert.equal(await page.getByText("How is it", { exact: true }).isVisible(), false, "mood controls are not simultaneously visible on phone");

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Do 10 push-ups +" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  const pushups = page.getByRole("button", { name: /Do 10 push-ups/ }).first();
  await pushups.click();
  await page.getByText("Optional · go further", { exact: true }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "1 / 7 care tasks" }).count(), 1, "base goal counts toward the full editable care list");
  const afterBase = await page.locator("body").innerText();
  assert.match(afterBase, /20\s+Flames/, "base goal shows 20 Flames");
  const savedAfterBase = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(savedAfterBase.companion?.bondXp, 20, "base goal grows active companion Bond by 20 XP");

  await page.getByRole("button", { name: /Feeling good\? Reach 20 push-ups total/ }).click();
  await page.getByText(/One more tier: reach 30 push-ups total/).waitFor();
  assert.equal(await page.getByRole("heading", { name: "1 / 7 care tasks" }).count(), 1, "Tier II does not duplicate task completion");
  const afterTier2 = await page.locator("body").innerText();
  assert.match(afterTier2, /40\s+Flames/, "Tier II added 20 Flames");
  const savedAfterTier2 = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null"));
  assert.equal(savedAfterTier2.companion?.bondXp, 60, "Tier II adds 40 Bond XP even when Bond details are collapsed");

  await page.getByRole("button", { name: /^Drank some water/ }).click();
  await page.getByRole("heading", { name: "2 / 7 care tasks" }).waitFor();
  await page.screenshot({ path: campOut, fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `mobile page overflows horizontally by ${overflow}px`);

  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: "The road keeps opening." }).waitFor();
  const journeyText = await page.locator("body").innerText();
  assert.match(journeyText, /60 Flames/, "Journey price is 60 Flames");
  assert.match(journeyText, /about 90 seconds/, "Journey explains its duration");

  await page.getByRole("button", { name: "Birch Ruins" }).click();
  await page.getByRole("heading", { name: /is on the path\./ }).waitFor();
  assert.ok([...requested].some((p) => p.endsWith("/art/birch-ruins-clean.svg")), "clean Birch Ruins environment art was requested");
  assert.ok([...requested].some((p) => p.endsWith("/art/ember-idle-runtime.svg")), "runtime companion remains separate from Journey background art");
  const beforeReload = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("kindlingState") || "null");
    return { walk: save?.walk, fuel: save?.fuel, seen: save?.seen };
  });
  assert.ok(beforeReload.walk, "Journey is persisted to the save");
  assert.equal(beforeReload.walk.endsAt - beforeReload.walk.startedAt, 90_000, "Journey duration is exactly 90 seconds");
  assert.equal(beforeReload.fuel, 0, "Journey spends exactly 60 Flames / 3 legacy fuel");
  assert.equal(beforeReload.seen, true, "intro dismissal survived hydration");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "2 / 7 care tasks" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Tend the fire" }).count(), 0, "intro does not return after reload");
  assert.equal(await page.getByText(/Ember is on the path\./).count(), 1, "active Journey is visible immediately after reload");
  assert.match(await page.locator("canvas").getAttribute("aria-label"), /^The bonfire$/, "away companion is not presented as being at camp");

  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: /is on the path\./ }).waitFor();
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("kindlingState") || "null")?.walk);
  assert.equal(afterReload.startedAt, beforeReload.walk.startedAt, "reload does not reroll Journey start");
  assert.equal(afterReload.endsAt, beforeReload.walk.endsAt, "reload does not reroll Journey finish");

  await page.getByRole("button", { name: "Today" }).click();
  await page.getByRole("heading", { name: "2 / 7 care tasks" }).waitFor();
  assert.equal(await page.getByText(/Ember is on the path\./).count(), 1, "Journey status remains visible from Today");
  const actionableErrors = allowStaticHydration
    ? errors.filter((error) => !error.includes("Minified React error #418"))
    : errors;
  const actionableResponses = allowStaticHydration
    ? failedResponses.filter((response) => response !== "404 /Suds-Jack/hub/shell.js")
    : failedResponses;
  assert.deepEqual(actionableErrors, [], `browser errors: ${actionableErrors.join(" | ")}`);
  assert.deepEqual(actionableResponses, [], `failed responses: ${actionableResponses.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, viewport: "390x844", art: [...requested], ignoredStaticHydration: allowStaticHydration ? errors.length - actionableErrors.length : 0, screenshot: out, campScreenshot: campOut }, null, 2));
} catch (err) {
  failed = err;
  const overlays = await page.locator(".fixed.inset-0.z-40").allInnerTexts().catch(() => []);
  console.error(JSON.stringify({ ok: false, overlays, errors, failedResponses, art: [...requested], error: String(err?.message || err) }, null, 2));
} finally {
  await page.screenshot({ path: out, fullPage: true }).catch(() => undefined);
  await browser.close();
}

if (failed) throw failed;
