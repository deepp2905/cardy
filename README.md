# cardy

A 3-step physical-card customizer for a fictional challenger bank. The thesis:
letting people invest effort in designing their card creates ownership and
attachment — the IKEA effect, applied to a piece of plastic that otherwise
arrives looking like everyone else's.

Built as a design-engineering challenge piece: a polished vertical slice, not a
product. No auth, no backend, no persistence beyond URL params.

## The flow

1. **Welcome** — short intro, one CTA. The name comes from the URL path
   (`/alex-rivera`), so the card is personalised before the user touches
   anything.
2. **Customize** — a coverflow deck of nine colourways, each seeded with its own
   generative pattern. The centred card is live-editable: two sliders (spacing,
   frequency) and two segmented controls (shape, fill). Every card is a valid
   starting point, and every slider position is designed to look intentional.
3. **Confirm** — the finished card is laid on a carrier sheet, folded in thirds,
   slid into a kraft envelope, sealed and flipped to reveal the address side.
   The user drags it into a mail slot to post it.

## Running it

```bash
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

Open `/alex-rivera` (or any `/first-last` path) to see personalisation.

---

# How it works

Three ideas carry the whole app: **one card that never unmounts**, **a pattern
generated from a seed**, and **a paper sequence measured in millimetres**. If
you understand those three, you understand the codebase.

## The shape of it

```
src/
  App.tsx              state for the whole flow + the persistent card
  steps/               Welcome · Customize · Confirm — one file per step
  card/                the card itself: face, pattern, config, hero wrapper
  carousel/            the coverflow deck + its drag/wheel/keyboard hook
  controls/            slider, segmented control, note field
  confirm/             the wrap sequence: sheet, envelope, slot, drag-to-post
  ui/                  action bar, step indicator, theme toggle
  lib/                 motion tokens, URL name parsing, reduced-motion hook
  playground/          dev benches (#/play) — lazy, not in the main bundle
  explore/             carousel mechanic experiments (#/explore) — lazy
```

There is no router and no state library. [App.tsx](src/App.tsx) holds every
piece of flow state in `useState` — current step, the nine card configs, which
card is active, the engraved note — and passes it down. The app never mutates
the URL, so the name parsed at mount survives the whole journey.

## Design tokens

Everything visual resolves through CSS custom properties in
[index.css](src/index.css). A 12-step neutral ramp runs background (`--color-1`)
to text (`--color-12`); the dark theme **remaps the same semantic steps**, so no
component ever branches on theme. `data-theme` is stamped on `<html>` before
paint.

The only non-neutral colour in the entire app lives on the cards themselves.

Other tokens worth knowing: `--control-h` (every interactive control is a pill
at one shared height, fills only — no borders at rest), a fixed type scale
(`--text-xs` … `--text-display`), and `--slide-w`, the card's render width.
`--slide-w` is global rather than scoped to the carousel because the confirm
step needs the same figure — the card must not resize between steps.

Motion is tokenised the same way. Every spring and transition in the app is
defined in [motionConfig.ts](src/lib/motionConfig.ts) and never inlined. Springs
are documented by damping ratio, so tuning one doesn't silently change its
character.

---

## 1. One card, three steps

The card is a **single React node mounted in `App`** that never unmounts as you
move through the flow.

Steps don't render the card. They render an invisible, card-sized spacer —
[HeroSlot](src/card/HeroSlot.tsx) — wherever the card *should* sit. The slot
participates in real flex layout, measures its own centre with
`getBoundingClientRect`, and reports that point up to `App`. The card is
`position: fixed` and springs its transform to whatever point it's told.

```
Customize step          Confirm step
┌──────────────┐        ┌──────────────┐
│  [HeroSlot]  │───┐    │              │
│   (deck)     │   │    │  [HeroSlot]  │───┐
└──────────────┘   │    │    (rest)    │   │
                   ▼    └──────────────┘   ▼
              reports x,y                reports x,y
                   └──────► App ◄──────────┘
                             │
                      one <HeroCard>
                    springs to the target
```

Measurement happens once per mount plus on resize — never per frame.

**Why it's built this way.** The obvious approach is a shared `layoutId`
hand-off between two card nodes. That popped: the measured box was distorted by
the deck's coverflow transform, so the projection maths started from a lie. With
one node there is nothing to measure across steps and nothing to hand off.

Two details make it hold together:

- **Ownership guarding.** During a step swap, the outgoing step's slot is still
  mounted while the incoming one measures. `App` tags each slot with an owner
  (`"deck"` or `"rest"`) and ignores reports that don't match the current phase,
  so a dying slot can't overwrite the incoming target.
- **Opacity hand-offs, not remounts.** Two `MotionValue`s (`deckOpacity`,
  `restOpacity`) let the persistent card yield to a live deck card mid-drag, or
  to the in-sheet card when the wrap sequence starts. Both nodes sit at the same
  position and size, so a crossfade can't pop. Being MotionValues, per-frame
  writes never trigger a React render.

The step wrapper uses `AnimatePresence mode="sync"`, not `"wait"` — the entering
step mounts immediately, so its slot measures on the *same beat* the outgoing
content starts fading. The card glides while the surroundings fade, rather than
waiting for the old step to leave first.

## 2. The pattern engine

Each card's artwork is an SVG grid of small shapes that bleeds off every edge.
Cell size, angle and position are staggered by a **single radial sine wave**
from the card's centre, so shapes tuck in and bulge out as you move outward.
It's about forty lines in [CardPattern.tsx](src/card/CardPattern.tsx):

```
for each cell in the grid:
  dist  = distance from card centre
  wave  = sin(dist / frequency * 2π)      ← one wave drives all three
  position += radial direction * wave * staggerSpacing
  size      = size * (1 + wave * staggerSize)
  rotation  = angle + wave * staggerAngle
```

**The cards are deterministic.** `seedConfigs()` in
[cardConfig.ts](src/card/cardConfig.ts) uses a seeded PRNG (mulberry32) keyed on
card index, so the same nine cards appear on every visit and a demo is
reproducible. Shape and fill are *dealt* round-robin rather than rolled — random
draws clumped, leaving strips with four triangles and one square. Dealing
guarantees 3/3/3 shapes and covers every shape×fill pairing.

**Raw parameters are never exposed.** The engine has ~13 knobs. Eleven are
pinned to tuned constants (`PATTERN_FIXED`); only two reach the UI. Each slider
maps 0..1 into a safe band via `patternParams()`, so **there is no position on
any track that looks like a mistake**:

| Slider | Maps to | Range |
| --- | --- | --- |
| Spacing | grid pitch | 25 → 100 px |
| Frequency | radial wavelength | 40 → 400 px |

The interesting layer sits between those two: each card also gets a seed-time
**`personality`** — grid angle, mark size, stroke weight, and how hard the wave
twists/pulses/shoves each cell. Those are the levers that actually change a
pattern's *character*. The two sliders only change density and scale of one
motif, which is why cards rhymed too closely before personality existed.

The grid can reach ~1,000 cells at the spacing floor, so it's memoised on the
params that actually shape it. Opacity hand-offs, note edits and parent state
touches all reuse the cell array.

## 3. The wrap sequence

Step 3 is a 3.85-second choreographed sequence, then a gesture.

**Everything is measured in millimetres.** [geometry.ts](src/confirm/geometry.ts)
declares real-world dimensions — the card is ISO/IEC 7810 ID-1 (85.6 × 53.98mm),
the envelope 126 × 70mm, the sheet 120 × 192mm folded into three 64mm panels.
[useStageScale](src/confirm/useStageScale.ts) measures the stage and produces one
`--mm` scale factor. Nothing inside the stage is sized in raw pixels except
hairlines.

That matters because the drag thresholds are also specified in mm. The scale is
measured in JS rather than expressed as a CSS `min()` precisely so both sides
share one source of truth.

[useWrapSequence.ts](src/confirm/useWrapSequence.ts) owns the choreography as a
**beat schedule** — a table of times in seconds from the arrow press — driving a
set of `MotionValue`s:

```
0.00  sheet fades in, card settles onto it   ← hero hands off here
0.35  the sheet's print appears
0.60  bottom third folds up
0.85  top third folds down
1.40  envelope enters from below
1.70  packet descends into the pocket
2.25  flap closes as the pair rises to centre
2.70  wax seal stamps (under-damped spring — the overshoot IS the beat)
3.30  envelope flips 180° to the address side
3.85  at rest, awaiting the drag
```

A single `TEMPO` constant multiplies every beat *and* every duration, so pace is
one dial rather than thirteen numbers to keep in sync. The springs are slowed by
`k/T²` and `c/T`, which preserves the damping ratio exactly — the character is
identical, only the pace changes.

Three implementation notes that explain otherwise-odd code:

- **Only the outer fold panels rotate in 3D**, and the card unmounts before
  anything containing it moves — so the Safari `preserve-3d` failure mode never
  applies.
- **Faces swap by threshold, never `backface-visibility`.** A `useTransform` on
  the rotation flips opacity at 90°.
- **The packet is clipped from the bottom at the envelope's mouth.** The sheet
  is 192mm and the envelope 70mm, so the unfolded thirds would hang out. The
  clip line tracks `envY` live, so it follows the envelope as the pair rises.

The sequence **animates the live card**, not a snapshot — your pattern, your
note, folded into the sheet.

Then the user drags the envelope to a mail slot
([usePostDrag.ts](src/confirm/usePostDrag.ts)). The post commits on release past
halfway *or* on any downward flick, from almost anywhere — the terminal action
of the flow is designed to be impossible to fail.

## 4. The carousel

[useCardDeck.ts](src/carousel/useCardDeck.ts) owns a **fractional index** driven
directly by drag, wheel and keyboard. `2.4` means 40% of the way from card 2 to
card 3; the layout interpolates against it, so every card responds continuously
to the gesture rather than snapping on a threshold.

There is no native scroller underneath, deliberately. A container with
`scroll-snap-type: mandatory` re-snaps to the nearest point on every
programmatic scroll — the drag writes a position and the browser pulls it
straight back. Owning the index outright removes that fight and the fragile
offset-measuring along with it.

Release runs a **hand-integrated spring** (stiffness 210, ζ ≈ 0.82) frame by
frame, so the settle has real spring character rather than a fixed-duration
tween. Past the ends, a rubberband function squashes overshoot toward an
asymptote it never reaches, then the settle springs back to a real card.

## 5. Reduced motion

`prefers-reduced-motion` is **a real path, not a disable switch**
([reducedMotion.ts](src/lib/reducedMotion.ts)):

- The wrap sequence collapses to two crossfades (0.7s total) — the card and
  sheet leave, a sealed and addressed envelope arrives in their place.
- The deck becomes a flat draggable strip.
- Drag-to-post gets a button. **The terminal action of the flow can never be
  gesture-only.**

## 6. Personalisation and sharing

[personalization.ts](src/lib/personalization.ts) reads `/first-last` once at
mount. The segment regex admits letters and interior dashes only — this is an
injection guard, not a formatting nicety; digits, dots, encoded bytes and
`/favicon.ico` all fall back to the default person.

Names are fitted without truncating mid-word: `FIRST LAST`, then `FIRST L.` (the
convention embossed cards already use), then a hard cut as a last resort.

Card configs serialise to compact URL params (`c`, `sh`, `f`, `sp`, `fq`, `n`,
plus `pr` for the six personality numbers) so a shared link renders the sender's
exact card rather than a defaults fallback.

## Dev tooling

Hash routes, lazy-loaded and excluded from the main bundle:

- `#/play` — dialkit benches for colour, type, card art, and the wrap sequence
  (`#/play/sequence` is a scrubbable timeline of the envelope choreography)
- `#/explore` — carousel mechanic experiments, including the Coverflow variant
  the app now ships

The playground is where the pattern engine and the deck mechanic were designed
before either landed in the app. `dialkit` is a dev dependency only.

## Stack

Vite · React 19 · TypeScript · [motion](https://motion.dev) ·
[dialkit](https://www.npmjs.com/package/dialkit) (dev only)

No CSS framework, no state library, no router. Plain CSS with custom properties;
`useState` in one component; hash routing for dev pages only.

## Further reading

- [PLAN.md](PLAN.md) — the build plan, phase by phase
- [PRD-CONFIRM.md](PRD-CONFIRM.md) — the confirm sequence spec, beat by beat
- [AUDIT.md](AUDIT.md) — a craft audit against the original brief
- [docs/](docs/) — the written case study
