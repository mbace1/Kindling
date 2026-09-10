# Kindling — product plan

**A health app for Dark Souls fans.** A fun thing to check in on that keeps you
reminded about staying healthy. `CANONICAL.md` holds the rules; this holds the
order of work and, for each item, **who can do it**.

Written 2026-08-21 (art audit); Phase 1–2 / 5 status refreshed 2026-09-08 against
shipping code — combat/combine is the active lane, not old R1 blockers.

---

## The finding that sets the order

The art is **not** the hurdle. Most of it already exists and is not being used.

`art-src/approved-hires/` (16 sheets, 38 MB) is
the owner-approved visual language: real pixel art, warm fire against cold
moonlight, deep value hierarchy. Audited file by file, it splits into two kinds:

**Finished, usable as-is — five composed scenes at 1672×941, no labels, no
captions, no frames.** `camp-night-moonlit` is the camp exactly as `CANONICAL.md`
specifies it: monster left, bonfire to its right, ruin behind, opening toward the
path and castle. At 1672 wide it covers a phone at DPR 3 with room to spare.

**Boards — the ten sheets and the UI kit.** Labelled and captioned, so not
droppable into a build, but the assets on them are genuinely separated against
flat dark ground and can be cut. Two are worth naming:

- `environments/bonfire-camp-sheet.png` carries **five discrete bonfire states** —
  unlit ring, low embers, medium, full, sparks — plus logs, ashes, smoke and ember
  particles. That is the 5-point care loop, drawn. `CANONICAL.md` says fire
  height and light must stay gameplay-owned and never be baked into a background;
  this is the asset that lets that be true.
- `art-bible/ember.png` carries real sprite strips — **idle 8f, walk 6f, run 6f,
  attack 8f** — plus separated parts (head, horns, arms, tail, scarf front and
  back) and rigging notes.

Meanwhile the app runs on Grok-derived placeholder art: `camp.jpg` and
`path.jpg`, painterly illustration rather than pixel art, and four 256×256
companion sprites. **Two visual languages are live at once and the approved one
is the one not shipping.**

So the first two phases need no new art at all. They are cutting and integration.

---

## The constraint, stated plainly

**This assistant cannot generate 2D or 3D art.** No image model in this instance.
What it can do: cut, key, trim, quantise and compose existing sheets
(`tools/cut.mjs`), write the integration code, animate in code, build, test and
deploy.

So every item below is tagged:

- **[cut]** — comes out of the approved bible. No new art. Startable now.
- **[code]** — no art involved.
- **[render]** — needs a new image from the owner's pipeline. Blocked until it
  arrives, and the plan says exactly what to ask for.

An item is never "waiting on art" unless it is tagged `[render]`.

---

## Phase 0 — move the canon here **[code]** — DONE 2026-08-21

`art-src/` and `tools/` lived in `mbace1/Suds-Jack/kindling/`. The art is
consumed here, the plan is here, and that repo is a deployment target. Move:

- `art-src/**` → this repo (38 MB; it is the canon and it belongs with the source)
- `tools/cut.mjs` and siblings → this repo

One catch, already paid for once: **Piritori's docs point five commands at
`kindling/tools/cut.mjs`.** That project is moving to its own repo too, so it
needs its own copy. Do not simply delete the Suds-Jack one out from under it.

Done by COPY, not move, for that reason: all 16 sheets verified here against
MANIFEST.md's sha256 column, and the Suds-Jack copy left standing until Piritori
has its own. Deleting it is that lane's call.

---

## Phase 1 — the camp screen **[cut]**

The top of `CANONICAL.md`'s own development order, and the biggest single visual
gain available. No new art.

1. Cut `scenes/camp-night-moonlit.png` to the camp background, replacing
   `camp.jpg`. Keep the full composition — do not crop to a strip.
2. Cut the **five bonfire states** from `environments/bonfire-camp-sheet.png` and
   bind them to the care count: 0 → unlit ring, 1 → low embers, 2–3 → medium,
   4 → full, 5 → full plus sparks. The fire is the score. Nothing else has to be.
3. Cut `camp-twilight` and `camp-night-castle` as the other two times of day; the
   camp sheet's three preview strips confirm the intended progression.

**Acceptance:** the composed screen at 390×844, DPR 3, judged on
`CANONICAL.md`'s nine criteria. Ticking a line visibly changes the fire. A
screenshot, not a green suite — a gate that certifies *works* cannot see *looks*.

**Status, 2026-09-08 — fire states ship; full plate swap still art-gated.**

Shipped (verify in tree, not wishful): `public/art/fire-states.png` is bound into
the camp canvas; `public/art/camp-night-clean.png` and camp quadrant plates exist
as interim character-free camp art; the live camp still composites carefully so a
baked companion never doubles the runtime sprite.

Still art-gated (not DONE): a final owner-approved camp plate that matches the
bible language at device resolution without a painted-in creature. Request **R1**
in `art-src/ART_REQUESTS.md` remains the ask for that plate. Do not treat R1 as
landed until the plate is committed and wired as the camp background.

**Agents now:** do not block combat/Journey/combine work on R1. Prefer the active
code lane (Phase 5 / VERSIONS combat entries) over re-litigating camp art.

---

## Phase 2 — Ember is alive **[render]** — was **[cut]**, and the measurement moved it

**Correction, 2026-08-22.** This phase was written on a wrong premise. The
companion is **not** a static PNG: `public/art/ember.png` is a 2×2 sheet and
`drawCompanion` already runs a four-frame idle at 3 fps. So the question was
never "animate it" but "is the bible's animation better", and the answer is
measured: **no, not at this resolution.**

An idle frame on the board measures **89 × 73 px** of ink. The camp canvas draws
the companion at 112 CSS = **224 device px** on a phone, so cutting the bible
strip is a 3.07× upscale against the shipping sheet's 1.75×. The approved design
would arrive *softer* than the placeholder it replaced. Refused rather than
shipped.

Two things came out of it. The board **labels the idle strip `8f` and draws
seven** — anyone building the loop from the label gets the rhythm wrong. And
request **R2** in `art-src/ART_REQUESTS.md` now asks for the four strips as a
real sprite sheet at ≥256 px frames on flat magenta, with the true frame counts
stated. It is a resolution problem, not a redesign.

**Status, 2026-09-08 — interim runtime atlases ship; bible-res R2 still open.**

Shipped (verify in tree): `ember-idle-runtime.svg` plus Mossling / Ashling /
Moss Knight idle-runtime sheets drive camp, Journey, Pack and Keep motion with
species-weighted cadence, hit and victory modes (see VERSIONS v10–v16). That is
enough for the companion to read alive on a phone.

Still art-gated (not DONE): request **R2** — ≥256 px approved strips on flat
magenta — has not replaced the interim runtime atlas. Until R2 is committed and
wired, do not delete the shipping runtime sheets.

**Agents now:** companion animation polish is opportunistic; combat depth and
combine readability are the active product work.

---

## Phase 3 — the road **[render]** + **[cut]**

The Walk tab is five ordered regions. Exactly one of them has approved art:
`scenes/travel-day-path.png`, and `travel-day-journey.png` beside it.

- **[cut]** Birch Ruins ← `travel-day-path`, replacing `path.jpg`. **DONE
  2026-08-21** — and it replaced the file rather than adding beside it, so all
  five regions and both fallbacks moved to the approved language at once. Ember
  is painted into this plate, which is a problem on the camp screen and is right
  here: the banner is a plain `<img>` with no sprite over it, and a companion
  setting out on the road is what the picture is of.
- **[render]** Drowned Courtyard, Bell Keep, Ashwood, Old Gate.

**This is the first place generation is genuinely required**, and PR #4 is the
warning: it delivered Birch Ruins at 640×206 for a slot that needs 1260×480, so
it went to mush on the device `CANONICAL.md` says to judge on.

The request, so the next one has a number to beat:

> Four region banners in the approved Kindling pixel-art language, matching
> `scenes/travel-day-path.png` for palette, dithering and value hierarchy.
> **1672×941 each, no labels, no captions, no frame.** Each needs a framing
> device, a subject with somewhere to be, and depth — a flat strip of scenery
> reads as wallpaper. Drowned Courtyard: standing water in a colonnade. Bell
> Keep: a tower with the bell visible. Ashwood: burnt forest, the fire was here
> once. Old Gate: something older than the road, closing it.

**Learned shipping the first one:** do not put the screen's title on the plate.
Two rounds of scrim-tuning either put the subject in shadow or cut the companion
off at the horns — these compositions carry their subject low, and a title sitting
on top of it is the wrong variable to tune. The title lives in the text column
below now, where it is legible by construction, and the plate is left alone.

---

## Phase 4 — the UI wears the language **[cut]**

`ui/ui-kit.png` is approved and unused; the app is Tailwind defaults on dark.
Cut the frames, buttons and meters and dress the shell in them. Lower return
than 1–3, so it comes after — but it is what stops the app reading as a form.

**Status, 2026-08-28 — started in PR #5.** The approved high-res kit is now
runtime-accessible as a single atlas at `public/art/ui/ui-kit.png` using the
same Git blob as the canonical source, so the binary is not duplicated in the
repository. Live uses so far:

- Today uses the kit's five circular fire-progress cells instead of generic bars.
- Combat uses the exact STRIKE / GUARD / SKILL button art.
- Bottom navigation uses the kit's fire / road / companion / pack / book symbols
  while keeping Kindling's current tab names rather than shipping baked labels
  that do not match the product.
- The one-day warning can show the exact LOW FLAMES badge.
- Browser smoke requires the approved atlas to be requested, and combat smoke
  captures the live action buttons before the first move.

Do not use baked example copy from the sheet when its semantics differ from the
runtime action. The remaining safe targets are generic frames/panels and exact
label matches; avoid reskinning for its own sake.

---

## Phase 5 — combat, world, breeding **[code]** — active (Sep 2026)

`CANONICAL.md` items 4–6. Invariants still enforced by
`scripts/betterment-contract.test.mjs`. The old "do not start before phases 1–2"
gate is obsolete for this lane: interim camp/companion art already keeps core
screens honest enough that combat and combine are the higher-leverage work.

**Shipped (verify VERSIONS + code, not this paragraph alone):**
- v17 — named Strike / Guard / Skill, telegraph readability, fingertip combine
- v18 — Nerve, same-round charge/feint archetypes, Bond skills, road echo
- v19 — charge is a real two-turn wind-up (telegraph → land or Strike-interrupt)
- v20 — egg warmth afterglow, persistent region echoes, camp-on-the-road, Bond/combine celebration
- v21 — deeper per-region memory; Old Gate approach / next-world interim beat
- v22 — named keepers / multi-phase rival duels on the five roads (epic C)
- v23 — living lineage roster: hatch inheritance, firelit family tree, walk-with-elder (epic B)
- v24 — world beyond Old Gate: Pale Reach + Hollow Spire with Journey / memory / rival hooks (epic A)

**Epic roadmap (owner order C → B → A) — complete:**
- **C — Boss / named rival duels** — shipped in v22
- **B — Living lineage** — shipped in v23 (family tree / hatch traits / elder walk)
- **A — World beyond Gate** — shipped in v24 (Pale Reach + Hollow Spire past the threshold)

**Next relevant agents work here**, not on reopening R1/R2 unless art arrives:
- dedicated Old Gate / beyond-gate plates only when art arrives (interim ships without blocking)
- keep Strike-interrupt fantasy; never touch wellness on combat loss; no scolding
- more region content only when the road memory / camp loop still reads clear

---

## Standing rules for this repo

- **Screen-first.** The composed screen is the deliverable, not the asset.
- **Nothing that scolds**, in copy or in mechanics. Souls games let you walk back.
- **Nothing leaves the browser.** No account required, no network call, no
  leaderboard. It is why the cabinet has no high score.
- **Two build targets, one source.** `npm run build` for Vercel, `npm run
  build:hub` for the arcade. The hub build must stay a subset, never a fork.
- **A delivery that is not a committed file did not arrive.** Four deliveries
  into this project the recurring failure has been a document describing art that
  never travelled. `approved-hires/MANIFEST.md` exists so a delivery is checked
  by hash rather than by eye.
