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

  // Intro is deliberately hydration-gated. A fast first tap used to be lost when
  // hydration landed after the tap and restored `seen:false`.
  await page.getByRole("button", { name: "Tend the fire" }).waitFor();
  await page.getByRole("button", { name: "Tend the fire" }).click();
  await page.getByRole("button", { name: "Tend the fire" }).waitFor({ state: "detached" });
  await page.getByRole("heading", { name: "0 / 5 tended" }).waitFor();

  assert.equal(await page.locator("canvas").count(), 1, "Today has one composed camp canvas");
  await page.waitForFunction(() => document.querySelector("canvas")?.width > 0);
  await page.waitForTimeout(500);
  assert.ok([...requested].some((p) => p.endsWith("/art/camp.jpg")), "live camp art was requested");
  assert.ok([...requested].some((p) => p.endsWith("/art/ember.png")), "live Ember sprite was requested");

  await page.getByRole("button", { name: "Edit the list" }).click();
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

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `mobile page overflows horizontally by ${overflow}px`);

  await page.getByRole("button", { name: "Walk" }).click();
  await page.getByRole("heading", { name: "Send them out" }).waitFor();
  const journeyText = await page.locator("body").innerText();
  assert.match(journeyText, /60 Flames/, "Journey price is 60 Flames");
  assert.match(journeyText, /90 real-time seconds/, "Journey explains real-time duration");

  await page.getByRole("button", { name: "Today" }).click();
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
