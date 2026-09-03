#!/usr/bin/env node
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8080/";
const url = new URL("dev/sprites", base).toString();
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const failed = [];
page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${new URL(r.url()).pathname}`); });
try {
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  assert.ok(response && response.status() < 400, `sprite inspector status ${response?.status()}`);
  await page.getByRole("heading", { name: "Companion Sprite Inspector" }).waitFor();
  assert.equal(await page.locator("[data-inspector-species]").count(), 4, "all four species are inspectable");
  for (const species of ["ember", "mossling", "ashling", "mossknight"]) {
    assert.equal(await page.locator(`[data-frame-grid="${species}"] > div`).count(), 16, `${species} exposes 16 frames`);
    assert.equal(await page.locator(`[data-companion-atlas="${species}"]`).count(), 1, `${species} named animation preview renders`);
  }
  assert.deepEqual(failed, [], `failed responses: ${failed.join(" | ")}`);
} finally {
  await browser.close();
}
