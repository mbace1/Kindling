#!/usr/bin/env python3
"""Cut the five bonfire states out of the approved environment sheet.

    python3 tools/cut-fire-states.py        # -> public/art/fire-states.png

`art-src/approved-hires/environments/bonfire-camp-sheet.png` is a labelled
BOARD, not a droppable asset — but the assets on it sit separated against flat
ground and cut cleanly. The five bonfire states are the ones that matter most:
they are the five-point care loop drawn, and CANONICAL.md requires fire height
and light to stay gameplay-owned rather than baked into a background.

The parameters live here rather than in someone's head, because a re-cut after a
new sheet delivery should be one command and not an afternoon of eyeballing.

Needs Pillow (`pip install pillow`). The other cutters in this folder run their
image work in Chromium to avoid native deps; this one runs once per art
delivery and its output is committed, so the dependency is not in anyone's way.
"""
from PIL import Image
import os

SHEET = 'art-src/approved-hires/environments/bonfire-camp-sheet.png'
OUT = 'public/art/fire-states.png'

# x-runs of the five sprites, found by scanning the band for columns carrying
# ink; y is common so every state shares one baseline and they swap without the
# ring jumping.
BOXES = [(27, 141), (161, 274), (288, 395), (411, 523), (539, 620)]
Y0, Y1 = 140, 268
NAMES = ['unlit', 'embers', 'medium', 'full', 'sparks']

# The flat panel ground behind the assets.
BASE = (16, 22, 26)

# Tolerance is PER CELL on purpose. A loose key eats the soft shadow under the
# stones — without it each stone trails a comb tooth — but the `sparks` cell's
# ring is dim enough that the same tolerance removes it too. That is correct
# here: sparks is drawn OVER `full` as the 5/5 flourish, so it wants the sparks
# and not a second ring.
TOL = [34, 34, 34, 34, 46]

CELL_W, CELL_H = 128, 136


def main():
    src = Image.open(SHEET).convert('RGBA')
    px = src.load()
    out = Image.new('RGBA', (CELL_W * len(BOXES), CELL_H), (0, 0, 0, 0))
    for i, (a, b) in enumerate(BOXES):
        w, h, tol = b - a, Y1 - Y0, TOL[i]
        cell = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        cp = cell.load()
        for x in range(w):
            for y in range(h):
                c = px[a + x, Y0 + y]
                near = all(abs(c[k] - BASE[k]) <= tol for k in range(3))
                cp[x, y] = (0, 0, 0, 0) if near else c
        out.alpha_composite(cell, (i * CELL_W + (CELL_W - w) // 2, CELL_H - h - 2))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    out.save(OUT)
    print(f'{OUT}: {len(BOXES)} states {CELL_W}x{CELL_H} — ' + ', '.join(NAMES))


if __name__ == '__main__':
    main()
