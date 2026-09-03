#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const required = [
  "public/art/birch-ruins-clean.svg",
  "public/art/drowned-courtyard-clean.svg",
  "public/art/bell-keep-clean.svg",
  "public/art/ashwood-clean.svg",
  "public/art/ember-idle-runtime.svg",
  "public/art/mossling-idle-runtime.png",
  "public/art/ashling-idle-runtime.png",
  "public/art/mossknight-idle-runtime.png",
  "public/art/ui/ui-kit.png",
  "public/art/fire-states.png",
];

function pngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", "invalid PNG signature");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
function svgDimensions(text) {
  const viewBox = text.match(/viewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)["']/i);
  const width = Number(text.match(/\bwidth=["']([\d.]+)/i)?.[1] || viewBox?.[3] || 0);
  const height = Number(text.match(/\bheight=["']([\d.]+)/i)?.[1] || viewBox?.[4] || 0);
  return { width, height };
}

const hashes = new Map();
const report = [];
for (const relative of required) {
  const file = path.join(ROOT, relative);
  const info = await stat(file);
  assert.ok(info.size >= 100, `${relative} is suspiciously tiny (${info.size} bytes)`);
  const buffer = await readFile(file);
  const hash = createHash("sha256").update(buffer).digest("hex");
  if (hashes.has(hash)) throw new Error(`${relative} duplicates ${hashes.get(hash)}`);
  hashes.set(hash, relative);
  let dimensions;
  if (relative.endsWith(".png")) dimensions = pngDimensions(buffer);
  else {
    const text = buffer.toString("utf8");
    assert.ok(text.includes("<svg"), `${relative} is not SVG content`);
    assert.ok(!/data:image\/png;base64/i.test(text) || relative.includes("ember-idle-runtime"), `${relative} embeds raster data instead of owning clean vector environment art`);
    dimensions = svgDimensions(text);
  }
  assert.ok(dimensions.width > 0 && dimensions.height > 0, `${relative} has invalid dimensions`);
  if (relative.includes("-clean.svg")) {
    const ratio = dimensions.width / dimensions.height;
    assert.ok(ratio > 1.35 && ratio < 2.2, `${relative} environment aspect ratio ${ratio.toFixed(2)} is outside the landscape contract`);
  }
  if (relative.includes("idle-runtime")) {
    assert.equal(dimensions.width % 8, 0, `${relative} width must divide into 8 atlas columns`);
    assert.equal(dimensions.height % 2, 0, `${relative} height must divide into 2 atlas rows`);
    assert.ok(dimensions.width / 8 >= 8 && dimensions.height / 2 >= 8, `${relative} atlas cells are implausibly small`);
  }
  report.push({ file: relative, bytes: info.size, ...dimensions, sha256: hash.slice(0, 12) });
}

console.log(JSON.stringify({ ok: true, validated: report.length, assets: report }, null, 2));