import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const atlases = [
  ["ember", "public/art/ember-idle-runtime.svg", "svg"],
  ["mossling", "public/art/mossling-idle-runtime.png", "png"],
  ["ashling", "public/art/ashling-idle-runtime.png", "png"],
  ["mossknight", "public/art/mossknight-idle-runtime.png", "png"],
];

function pngDimensions(buffer) {
  assert.equal(buffer.toString("ascii", 1, 4), "PNG", "valid PNG signature");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test("runtime companion atlases obey the 8x2 sprite contract", async () => {
  for (const [species, path, kind] of atlases) {
    const info = await stat(path);
    assert.ok(info.size > 100, `${species} atlas is not an empty/corrupt placeholder`);
    const file = await readFile(path);
    let width;
    let height;
    if (kind === "png") {
      ({ width, height } = pngDimensions(file));
    } else {
      const text = file.toString("utf8");
      const viewBox = text.match(/viewBox="0 0 (\d+) (\d+)"/);
      assert.ok(viewBox, `${species} SVG declares a numeric viewBox`);
      width = Number(viewBox[1]);
      height = Number(viewBox[2]);
      assert.ok(!text.includes("data:image/"), `${species} SVG does not hide an opaque embedded bitmap`);
      assert.ok((text.match(/<use\b/g) ?? []).length >= 16, `${species} SVG exposes all 16 cells`);
    }
    assert.ok(width > 0 && height > 0, `${species} atlas has dimensions`);
    assert.equal(width % 8, 0, `${species} width divides cleanly into 8 columns`);
    assert.equal(height % 2, 0, `${species} height divides cleanly into 2 rows`);
    assert.ok(width / 8 >= 16 && height / 2 >= 16, `${species} cells are not implausibly tiny`);
  }
});
