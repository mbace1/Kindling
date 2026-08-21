# Kindling / Betterment — canonical production rules

This repository is the **source project**.

`mbace1/Suds-Jack/kindling/` is a deployment target only. Do not develop a second Kindling implementation there and do not treat its generated/static files as the design source.

## What this is (owner, 2026-08-21)

**A health app for Dark Souls fans.** A fun thing to check in on that keeps you
reminded about staying healthy.

That sentence decides arguments the criteria below cannot. It is not a wellness
product wearing a dark-fantasy skin — the audience is people who already like
sitting at a bonfire between attempts, and the appeal is the *place*, not the
tracking. So:

- **Checking in has to be a pleasure, not a chore.** If a screen reads as a form
  to fill in, it is wrong however correct its numbers are.
- **The world is the reward.** Care buys firelight, a companion who stays, a road
  that opens. It does not buy points, badges or a streak to protect.
- **Souls games never scold you either.** They let you walk back. That is the
  same rule as "the copy never scolds", arrived at from the fiction rather than
  from wellness-app etiquette — which is why it holds.
- **Difficulty is not the borrowed thing.** Nobody wants a punishing habit
  tracker. What is borrowed is the tone: quiet, unhurried, a little grim, and
  entirely on your side.

## What is authoritative

1. The game/product rules in the current Betterment GDD direction.
2. The working runtime implementation in this repository.
3. Runtime art physically committed under `public/art/`.
4. The composed mobile screen as the final visual acceptance target.

A concept sheet, presentation board, ZIP in chat, prompt, or manifest that does not have its actual runtime asset in this repository is **reference only**.

## Visual production rule

**Assets are not the deliverable. The composed game screen is the deliverable.**

For each screen, judge the final running composition:

- silhouette and focal hierarchy
- layer order
- crop and scale
- negative space
- monster/fire relationship
- readability at phone width
- warmth/cold hierarchy
- UI-to-world balance
- motion and return states

Do not approve a visual change solely because a PNG loaded or a screenshot looks attractive in isolation.

## Art handoff rule

Runtime art must arrive as a real file under `public/art/` (or another explicit runtime folder) **before integration work begins**.

Do not use:

- chat-only sandbox files as a dependency
- presentation boards as cut assets
- text manifests that name missing images
- code-drawn substitutes when approved runtime art already exists
- a second art library whose relationship to the live files is unclear

If a new asset is needed, its source/reference may live beside production work, but the game should reference the actual checked-in runtime file.

## Current visual foundation

The Grok-derived art already under `public/art/` is the current runtime foundation:

- `camp.jpg`
- `path.jpg`
- Ember / Mossling / Ashling / Moss Knight sheets
- companion/enemy portraits

The approved camp staging is:

**monster on the left → bonfire just to its right → ruin behind → composition opens toward the path/castle on the right.**

Fire height/light remains gameplay-owned and must not be replaced by a static reward state baked into a background.

## Gameplay invariants

- daily Fire target is always **5 care points**
- more than 5 never changes the completeness denominator
- optional progressive tiers reward Flames/Bond but do not fill more Fire
- one fully missed care-day is warning only
- two consecutive fully missed care-days Kindle the active monster
- the Kindled monster remains in lineage
- absence never removes loot, Flames, world progress or other companions
- Journey is real-time and resolves while away
- combat loss never removes wellness progress
- breeding never consumes either parent
- egg warmth accumulates; missed time does not reduce it

## Economy naming

Internal legacy `fuel` units may remain in save data for compatibility.

Player-facing economy is **Flames**:

`1 legacy fuel = 20 Flames`

The word **Kindling** is reserved for the game/title and the monster-fate story beat, not the spendable-currency label.

## Development order

Work screen-first and keep the playable foundation coherent:

1. Today / bonfire / care loop
2. Companion / Bond / lineage / egg
3. Journey / return flow
4. Combat
5. broader world progression
6. additional content and art variants
7. static hub deployment

Do not build new content to hide an unresolved core-screen problem.

## Deployment

When the standalone experience is accepted, create a static hub build and copy that output into `mbace1/Suds-Jack/kindling/` as a deployment PR.

The hub copy must not become a parallel source branch.
