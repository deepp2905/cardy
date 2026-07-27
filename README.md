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
```

## A few decisions worth knowing

**One card, three steps.** The card is a single React node mounted in `App` that
never unmounts. Steps report *where* it should sit via invisible spacers
(`HeroSlot`); the card springs its transform to that point. This replaced a
shared-`layoutId` hand-off, which popped — the measured box was distorted by the
deck's coverflow transform. With one node there is nothing to measure and
nothing to hand off.

**The pattern is deterministic.** `seedConfigs()` uses a seeded PRNG keyed on
card index, so the same nine cards appear every visit and a demo is
reproducible. Shape and fill are dealt round-robin rather than rolled, so the
strip always shows all three shapes and both fill modes.

**Raw parameters are never exposed.** The pattern engine has ~13 knobs; all but
two are pinned to tuned constants. Each slider maps 0..1 into a safe band, so
there is no position on any track that looks like a mistake.

**The confirm sequence animates the live card**, not a snapshot. Only the outer
fold panels rotate in 3D, and the card unmounts before anything containing it
moves — so the Safari `preserve-3d` failure mode the original plan worried about
never applies.

**Reduced motion is a real path**, not a disable switch. The wrap sequence
collapses to two crossfades, the deck becomes a flat draggable strip, and the
drag-to-post gets a button — the terminal action of the flow can never be
gesture-only.

## Dev tooling

Hash routes, excluded from the main bundle:

- `#/play` — dialkit benches for colour, type, card art, and the wrap sequence
  (`#/play/sequence` is a scrubbable timeline of the envelope choreography)
- `#/explore` — carousel mechanic experiments

## Stack

Vite · React 19 · TypeScript · [motion](https://motion.dev) ·
[dialkit](https://www.npmjs.com/package/dialkit) (dev only)
