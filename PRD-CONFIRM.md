# PRD-CONFIRM.md — Step 3: wrap, seal, post

> Build spec for the Confirm step. Supersedes PLAN.md Phase E + F where the two
> disagree; §15 lists every amendment explicitly so the change is legible rather
> than looking like drift. Read §2 (geometry) and §11 (snapshot) before writing a
> line of code — both contain hard constraints that are expensive to retrofit.
>
> Reference: Josh Puckett's envelope animation, analysed frame-by-frame. We run
> its inverse — wrap instead of unwrap — plus a drag-to-post gate it doesn't have.

---

## 0. What this is

The user has just designed a card. On "Order this card" the card is snapshotted,
laid on a wireframe carrier sheet, folded into thirds, slid into a kraft
envelope, sealed with a sticker, and flipped to reveal **For {First}** on the
address side. A mail slot fades in below. The user drags the envelope into it.
An epilogue confirms the order.

**The thesis of the art direction:** the carrier sheet is a deliberate low-fidelity
wireframe — placeholder bars, no real copy. The card is the only fully rendered
object in the frame. The fidelity gap *is* the focus device, so the card stays the
hero even while it is being covered up.

**Total runtime:** 4.20s from mount to the envelope at rest; slot settled at 5.00s.
Auto-plays, no skip.

---

## 1. Decision record (locked — do not relitigate)

| # | Decision | Rationale |
|---|---|---|
| D1 | Carrier sheet is **1.4× card width**, not true A4 | True A4 at card scale is 785×1111px against a 372px column. Cheating the proportion keeps the card at 0.60× instead of 0.36×. |
| D2 | Fold is a **horizontal C-fold** (bottom up, then top down) | Physically how carrier letters fold. Top panel lands last and nearest camera — the stronger final beat. |
| D3 | Sheet is **lo-fi wireframe**, everything downstream is **fully rendered** | Fidelity gap keeps the card hero. Envelope must carry real text, so the wireframe stops at the sheet. |
| D4 | **Cream** sheet, **kraft** envelope | Two distinct paper values so the packet stays readable against the envelope during insertion. |
| D5 | Seal is a **circular sticker with the `cardy` wordmark** | Matches the app's flat visual language; no new rendering technique. |
| D6 | **Auto-play, no skip** | Purest as a designed moment. Accepted cost: full replay on back→forward. |
| D7 | **Bare 2D slot below**, drag down | Keeps PLAN.md's downward-velocity drag physics. Reads as a mail slot without illustrating a mailbox. |
| D8 | **Full PLAN.md Phase F epilogue** | Wallet + download + share. Also the thing that puts the card back on screen at the end. |
| D9 | App chrome **hides for the sequence**; epilogue owns its CTAs | The bottom of the column is where the slot goes. |
| D10 | Fold the **snapshot PNG**, never the live `<Card>` | WebGL canvas inside `preserve-3d` is the Safari failure mode PLAN.md flags. |

**Explicitly declined**, recorded so nobody re-proposes them:

- Envelope tinted from `config.baseColor` — declined. Reversal cost is ~2 lines
  against `parseOklch`/`oklchString` if the ending ever feels impersonal.
- Hero hold on the card before fold 1 — declined.
- Card bulge showing through the folded packet — declined.

---

## 2. Geometry — exact, and non-negotiable

All physical dimensions in millimetres. One scale factor converts to pixels.

### 2.1 Objects

| Object | mm | Notes |
|---|---|---|
| Card | 85.6 × 53.98 | ISO/IEC 7810 ID-1. Radius 3.18mm. Never changes. |
| Carrier sheet | **120 × 192** | 1.4× card width. Height = 3 panels × 64mm. |
| Fold panel | 120 × 64 | Each panel clears the card with 5.01mm top/bottom margin. |
| Folded packet | 120 × 64 | Landscape. |
| Envelope | **126 × 70** | Packet + 3mm clearance on every side. |
| Envelope flap | 126 × 38.5 | 55% of envelope height, triangular. |
| Seal sticker | Ø 14 | Centred on the flap's point. |
| Mail slot | **139 × 10** | 1.1× envelope width — anything narrower and the envelope cannot enter without rotating corner-first. Radius 5mm. |

### 2.2 Scale

The slot is the widest object in the flow, so it sets the scale:

```css
.confirm-stage {
  --stage-w: min(372px, 88dvw);        /* matches --slide-w in index.css */
  --stage-h: 100%;                      /* the confirm stage's own height */
  --mm: min(var(--stage-w) / 139, var(--stage-h) / 200);
}
```

`139` = slot width. `200` = sheet height (192) + 8mm breathing; the sheet is the
tallest object in the sequence, so it is the vertical binding constraint.

Reference values:

| Viewport | `--mm` | Card | Sheet | Envelope | Slot |
|---|---|---|---|---|---|
| Desktop (stage 372 × ≥535) | 2.676px | 229 × 144 | 321 × 514 | 337 × 187 | 372 × 27 |
| iPhone 375×667 (stage 330 × 547) | 2.374px | 203 × 128 | 285 × 456 | 299 × 166 | 330 × 24 |

**The card renders at 0.60× its customize size** (372px → 229px). This is
unavoidable and is absorbed by the `layoutId` step transition — one resize, on
the way in, before anything folds. It reads as stepping back to look at the whole
thing. Do not add a second camera move later in the sequence.

Every dimension in CSS is written as `calc(<mm> * var(--mm))`. No raw pixel sizes
inside the stage except hairlines (`1px`) and shadow offsets.

### 2.3 Vertical choreography (all y relative to stage centre = 0)

| Phase | Object positions |
|---|---|
| Fold | Sheet centred, spans −96 → +96 |
| Post-fold | Packet centred, spans −32 → +32 |
| Envelope enters | Envelope centre **+69**, spans +34 → +104. Gap to packet bottom = 2mm |
| Insert | Packet translates **+69** (0 → +69), envelope stationary |
| Settle | Envelope group rises **−69** (+69 → 0). Packet rides with it |
| Rest | Envelope centred, spans −35 → +35 |
| Slot | 40mm below envelope bottom: spans **+75 → +85** |

Max vertical extent at any moment is the sheet (192mm), which the `--mm` formula
already guards. The insert beat reaches +104mm, which fits inside the iPhone's
±115mm half-stage with 11mm to spare.

The 69mm up-then-down of the packet is not wasted motion — it is pick-up-and-insert,
and it is the exact inverse of the reference, where the letter rose 69mm out of a
stationary envelope before the envelope faded.

---

## 3. Art direction

### 3.1 New tokens

The app's 12-step ramp inverts between themes. Paper and kraft must **not** invert —
paper that changes colour with the UI theme stops reading as a physical object. So
these are the only non-ramp colours in the app. They shift value slightly between
themes for glare and separation, not hue.

```css
:root {
  --paper:            oklch(0.968 0.012 88);
  --paper-edge:       oklch(0 0 0 / 0.07);   /* hairline — light theme only */
  --paper-rule:       oklch(0.895 0.012 85);
  --paper-bar:        oklch(0.878 0.013 85);
  --paper-ink-muted:  oklch(0.700 0.020 85);

  --kraft:            oklch(0.792 0.052 72);
  --kraft-flap:       oklch(0.754 0.056 70);
  --kraft-inner:      oklch(0.700 0.050 68);
  --kraft-ink:        oklch(0.320 0.030 65);

  --seal:             oklch(0.260 0.020 70);
  --seal-ink:         oklch(0.950 0.010 85);

  --slot:             oklch(0.100 0 0);
  --slot-rim:         transparent;

  --sheet-shadow:
    0 2px 6px oklch(0 0 0 / 0.10),
    0 20px 50px -18px oklch(0 0 0 / 0.35);
  --envelope-shadow:
    0 3px 8px oklch(0 0 0 / 0.16),
    0 24px 48px -18px oklch(0 0 0 / 0.40);
  --oncard-shadow:
    0 1px 2px oklch(0 0 0 / 0.18),
    0 4px 10px -4px oklch(0 0 0 / 0.22);
}

:root[data-theme="dark"] {
  --paper:            oklch(0.935 0.014 86);  /* dimmed so it doesn't glare */
  --paper-edge:       transparent;             /* dark stage separates it already */
  --paper-rule:       oklch(0.862 0.013 84);
  --paper-bar:        oklch(0.845 0.014 84);
  --paper-ink-muted:  oklch(0.660 0.022 84);

  --kraft:            oklch(0.735 0.052 70);
  --kraft-flap:       oklch(0.698 0.055 68);
  --kraft-inner:      oklch(0.640 0.048 66);
  --kraft-ink:        oklch(0.280 0.030 64);

  --seal:             oklch(0.200 0.020 70);

  --slot:             oklch(0.080 0 0);
  --slot-rim:         oklch(0.380 0 0);       /* 1px top rim so the recess exists */

  --sheet-shadow:
    0 2px 6px oklch(0 0 0 / 0.35),
    0 24px 56px -18px oklch(0 0 0 / 0.60);
  --envelope-shadow:
    0 3px 8px oklch(0 0 0 / 0.40),
    0 28px 56px -18px oklch(0 0 0 / 0.65);
}
```

**Theme-specific behaviours:**

- Light theme: the sheet gets a `--paper-edge` hairline (`box-shadow: 0 0 0 1px`)
  because cream on near-white has almost no value separation. Dark theme drops it.
- Dark theme: the slot gets a 1px `--slot-rim` on its top edge. Without it, a black
  hole on a dark stage is invisible.
- The confirm stage suppresses the ambient glow that `index.css` paints above the
  column (`--stage-glow: none` for the duration). The slot plate (§6.4) must be a
  pixel-perfect match to the stage background, and a gradient behind it makes that
  impossible.

### 3.2 The wireframe carrier sheet

Cream stock, 120 × 192mm, radius 1.5mm. Three panels at y 0–64, 64–128, 128–192.
Inner padding 14mm on both sides (inner content width = 92mm).

**No real copy anywhere on this sheet except the wordmark.** Everything else is a
placeholder bar. Bars are `--paper-bar`, radius = half their height. Rules are
1px `--paper-rule`, full inner width.

**Top panel** (y 0–64) — reads as a letterhead:

| Element | Position | Size |
|---|---|---|
| `cardy` wordmark | x 14, baseline y 12 | 7mm, weight 650, ls 0.01em, `--paper-ink-muted` |
| Ref bar | right-aligned, y 9 | 22 × 3mm |
| Rule | y 22 | 92 × 1px |
| Body bars ×3 | y 30, 37.6, 45.2 | 92, 92, 61 × 2.6mm |

**Middle panel** (y 64–128) — the card's bed. Nothing else on it.

| Element | Position | Size |
|---|---|---|
| Registration outline | centred | 90.6 × 59mm, radius 5.7mm, 1px dashed `--paper-rule` (dash 2mm / gap 2mm) |
| Corner ticks ×4 | outline corners | 4mm arms, 0.5mm thick, `--paper-ink-muted` |
| Card (snapshot) | centred | 85.6 × 53.98mm, radius 3.18mm, `--oncard-shadow` |

The outline is 2.5mm larger than the card on every side, so it stays visible as a
registration frame rather than being covered. It fades in **with** the bars, after
the sheet has settled — the sheet arrives, then its printing appears.

**Bottom panel** (y 128–192) — signature block + small print:

| Element | Position | Size |
|---|---|---|
| Signature bars ×2 | y 10, 17.6 | 38, 26 × 2.6mm |
| Rule | y 30 | 92 × 1px |
| Small-print bars ×3 | y 38, 43.2, 48.4 | 92, 92, 66 × 1.8mm |

### 3.3 The envelope

Kraft body, flap and pocket-interior at three distinct values so the open envelope
reads as a container and not a flat rectangle.

- **Back face** (visible during fold, insert, seal): `--kraft` body; flap
  `--kraft-flap` clipped to `polygon(0 0, 100% 0, 50% 100%)`, hinged on the
  envelope's top edge, height 38.5mm; a `--kraft-inner` inset gradient along the
  top 6mm of the body reading as the pocket mouth.
- **Front face** (revealed by the flip): flat `--kraft`, no seams. `For {First}`
  centred, `--font-sans`, 6mm, weight 500, `--kraft-ink`. If the rendered string
  exceeds 100mm, step down to 5mm. (`parsePerson` already gates the charset to
  `[A-Za-z-]` and title-cases, so the string is always short and safe.)
- Both faces carry a 1px inner highlight on the top edge (`oklch(1 0 0 / 0.12)`)
  so the paper has a lit edge.

### 3.4 The seal

Ø14mm circle, `--seal` fill, `cardy` wordmark centred in `--seal-ink` at 5mm.
Positioned at the flap's point: 50% width, 55% height of the envelope. Sits above
the flap in z-order. It is a flat sticker — no wax irregularity, no bevel.

---

## 4. Beat sheet

Times are seconds from Confirm mount, **after** the snapshot has resolved. Drive
this with motion's `useAnimate` sequence API — it is exactly what the `at:`
parameter is for, and it keeps the whole timeline readable in one array.

| at | Beat | Target | Transition |
|---|---|---|---|
| 0.00 | Chrome out | `StepIndicator`, `ActionBar` → opacity 0 | `crossfade` (0.30) |
| 0.00 | Card arrives | `layoutId` from carousel → sheet middle panel, 0.60× | `arrive` |
| 0.35 | Sheet in | opacity 0→1, scale 0.97→1 | `wrap` + 0.40 fade |
| 0.70 | Printing in | outline, ticks, bars, rules → opacity 0→1 | 0.25 fade |
| 0.95 | **Fold 1** | bottom panel `rotateX` 0 → −180° | `fold` |
| 1.20 | **Fold 2** | top panel `rotateX` 0 → +180° | `fold`, `FOLD_STAGGER` 0.25 |
| 1.75 | Envelope in | opacity 0→1 at y +69mm, flap already open at −165° | 0.30 fade |
| 2.05 | **Insert** | packet y 0 → +69mm | `insert` |
| 2.60 | **Flap closes** | flap `rotateX` −165° → 0 | `fold` |
| 2.60 | Envelope settles | envelope group y +69mm → 0 | `fold` |
| 3.05 | **Seal stamps** | sticker scale 0 → 1.15 → 1, rotate −8° → 0 | `stamp` |
| 3.05 | Screen nudge | stage y 0 → −2px → 0 | `snappy` |
| 3.45 | Hold | — | 0.20 |
| 3.65 | **Flip** | envelope `rotateY` 0 → 180° | `flip` |
| 4.20 | Rest | idle `drift` begins | `drift` |
| 4.60 | Slot in | opacity 0→1, `scaleX` 0.9→1 | 0.40 fade |
| 4.75 | Hint in | "Drag down to post" + ↓ | 0.30 fade |
| 5.00 | **Drag gate** | sequence complete, awaiting input | — |

---

## 5. Mechanics

### 5.1 Two-face objects — do not use `backface-visibility`

Every flipping surface (the two fold panels, the envelope) has a front and a back.
`backface-visibility: hidden` inside `preserve-3d` is the single least reliable
thing in Safari and it is what PLAN.md means by "the known dragon".

**Use a MotionValue face swap instead.** Deterministic in every browser:

```tsx
const rotY = useMotionValue(0);
const face = useTransform(rotY, r => (((r % 360) + 360) % 360) > 90 &&
                                     (((r % 360) + 360) % 360) < 270 ? "back" : "front");
// render one face at a time, keyed off `face`
```

The reference confirms this is correct behaviour: at exactly the edge-on frame the
card is a 1px sliver and the face has already swapped. A threshold swap reproduces
that; a backface rule approximates it.

### 5.2 The fold

```
.sheet                       perspective: 1400px; transform-style: preserve-3d
  .panel--top      y 0        transform-origin: bottom center; z-index: 3
  .panel--mid      y 64       static; z-index: 1
  .panel--bottom   y 128      transform-origin: top center;    z-index: 2
```

Hinges and directions:

- **Bottom panel** hinges on its *top* edge (the lower crease, y=128) and rotates
  `rotateX(-180deg)` — swinging up and *toward* the viewer, landing face-down over
  the card.
- **Top panel** hinges on its *bottom* edge (the upper crease, y=64) and rotates
  `rotateX(180deg)` — swinging down and toward the viewer, landing over the bottom
  panel.

z-index ordering (mid 1 → bottom 2 → top 3) is what makes each panel land *on top*
of the previous one. Set it up front; it cannot be fixed by transform order.

**Shading.** Each panel carries `.panel-shade` (`position: absolute; inset: 0`),
a flat black overlay whose opacity is driven by the panel's own rotation:

```tsx
const shade = useTransform(rotX, [0, 90, 180], [0, 0.50, 0.14]);
```

Peak darkness at 90° (edge-on to the light), settling to 0.14 on the landed back
face so the folded packet has layer separation. Single light source, from the top.

**Cast shadow.** A separate `.panel-cast` div sits on the panel *beneath* the one
folding, matching its footprint, with:

```tsx
const castOpacity = useTransform(rotX, [0, 90, 180], [0, 0.35, 0.12]);
const castScaleY  = useTransform(rotX, [0, 90, 180], [0.2, 0.7, 1]);
```

This is what sells paper. Do not skip it — the fold looks like a flat rectangle
rotating without it.

### 5.3 The insert — z-index theatre, never `overflow`

Safari will not clip a 3D-transformed child with `overflow: hidden` on a
`preserve-3d` ancestor. Both the envelope pocket and the mail slot depend on
clipping, so **neither uses clipping.** Both use a painted panel above the moving
object.

Envelope back view, z-order bottom to top:

1. `.env-shadow`
2. `.packet` — the folded sheet, animating `y`
3. `.env-back-body` — opaque `--kraft`. **This is the mask.**
4. `.env-flap`
5. `.seal`

The packet starts entirely above the envelope's top edge, so nothing occludes it.
As it translates down, `.env-back-body` covers it progressively. No clipping, no
`overflow`, no Safari risk. Identical technique to the reference.

### 5.4 The flap

Positioned with its hinge at the envelope's top edge, body extending downward
(closed position), `transform-origin: top center`, `clip-path: polygon(0 0, 100% 0, 50% 100%)`.

- Open: `rotateX(-165deg)` — swings up and back. Not a full 180°: the residual 15°
  reads as depth and matches the reference, where the open flap is visibly tilted
  rather than perfectly flat.
- Closed: `rotateX(0)`.

The flap gets its own `.panel-shade` on the same 0/90/180 curve.

### 5.5 The flip

`rotateY` 0 → 180° on the envelope group, `perspective: 1400px` on the stage.

The shadow must animate with it or the flip looks weightless. From the reference,
the drop shadow visibly shrinks through the edge-on frame and recovers:

```tsx
const shadowScaleX = useTransform(rotY, r => 0.30 + 0.70 * Math.abs(Math.cos(r * Math.PI / 180)));
const shadowOpacity = useTransform(rotY, r => 0.35 + 0.65 * Math.abs(Math.cos(r * Math.PI / 180)));
```

The `flip` spring's natural overshoot produces the small rock the reference shows
at settle. Do not damp it out.

---

## 6. The drag gate

### 6.1 Rest state

Envelope centred, front face showing, idle `drift` (±4px, 3.2s, gated off under
reduced motion). Hint label "Drag down to post" with a ↓ glyph, 40mm below the
envelope and above the slot, `--text-sm`, `--color-10`. Fades out over 0.2s on
first `pointerdown` and never returns.

### 6.2 Drag

```tsx
drag="y"
dragConstraints={{ top: -8 * mm, bottom: 120 * mm }}
dragElastic={0.15}
dragMomentum={false}
```

- **Grab feedback:** scale 1.03, shadow to `0 10px 22px oklch(0 0 0 / .3)`, `snappy`.
- **Drag tilt:** `useTransform(velocityY, [-800, 800], [2, -2])` degrees. Small,
  but it's the difference between dragging an object and dragging a div.
- X is not draggable. A mail slot is a horizontal constraint; free 2D drag would
  require the envelope to rotate to align, which looks worse than not offering it.

### 6.3 Magnetic assist — "it must be impossible to fail"

PLAN.md specifies a literal 120px radius. In this geometry the resting gap between
the envelope's bottom edge and the slot's top edge is only 40mm (107px on desktop),
so a 120px radius would snap before the user has moved. **Restate it in the
geometry's own units** — this is a refinement of PLAN.md Phase F, not a departure:

Complete the post if **either**:
- release with `dragY > 20mm` (past halfway to the slot), **or**
- release with `velocity.y > 300px/s` and `dragY > 6mm`.

Otherwise spring back to rest with `snappy`.

### 6.4 The post animation

The slot is a **plate**, not a hole:

```
.slot-plate   full stage width, from slot top downward, background: var(--color-2)
              z-index above the envelope — this is the mask
.slot-rect    139 × 10mm, --slot fill, radius 5mm, painted on the plate
.slot-lip     6mm gradient strip above the plate top edge,
              linear-gradient(to top, oklch(0 0 0 / .35), transparent),
              z-index above the envelope — darkens it as it enters
```

The envelope disappears exactly at the plate's top edge, which is the slot's lip.
No clipping anywhere.

Sequence on completion:

| at | Target | Transition |
|---|---|---|
| 0.00 | envelope y → +120mm, rotate → 0, scale → 0.97 | `post` |
| 0.15 | `.slot-rect` scaleY 1 → 0.86 → 1 | `snappy` |
| — | envelope opacity 1 → 0 across the last 20mm of travel | insurance against a mask seam |
| 0.45 | epilogue rises | `crossfade` + y 12 → 0 |

---

## 7. Epilogue

Rises 0.45s after the post begins. Full PLAN.md Phase F content.

| Element | Copy | Behaviour |
|---|---|---|
| Heading | **On its way.** | `--text-display`, `tabIndex={-1}`, receives focus |
| Sub | Your card arrives in about 7 days. | `--text-md`, `--color-10` |
| Primary | Add the digital card now | Mobile: fake success sheet. Desktop: popover — "We've emailed you a link — open it on your phone." Custom wallet-style button; **do not** clone the official Apple badge. |
| Secondary | Download your design | Serves the snapshot PNG from §11. Free feature — the file already exists. |
| Secondary | Copy share link | `cardConfigToParams(config)`; label swaps to "Link copied" for 2s |
| Tertiary | Design another | Returns to welcome. Replaces the ActionBar's "Start over", which is hidden. |

---

## 8. Copy deck

Every user-visible string in this step. Nothing else renders text.

```
Envelope front .......... For {First}
Drag hint ............... Drag down to post
Reduced-motion button ... Mail it
Epilogue heading ........ On its way.
Epilogue sub ............ Your card arrives in about 7 days.
Wallet CTA .............. Add the digital card now
Wallet (desktop) ........ We've emailed you a link — open it on your phone.
Download CTA ............ Download your design
Share CTA ............... Copy share link  →  Link copied
Restart CTA ............. Design another
SR announce (start) ..... Packing your card.
SR announce (rest) ...... Sealed. Drag down or press Enter to post.
SR announce (posted) .... Posted. Your card arrives in about 7 days.
```

The carrier sheet renders **`cardy`** and nothing else. Every other mark on it is
a placeholder bar.

---

## 9. Motion presets

Added to `lib/motionConfig.ts`. PLAN.md §9 forbids inline springs — no exceptions
in this step.

```ts
// Shared-element arrival: card travels carousel → sheet at 0.60x.
export const arrive: Transition = { type: "spring", stiffness: 200, damping: 28 };

// Carrier sheet fade-and-settle behind the card.
export const wrap: Transition = { type: "spring", stiffness: 260, damping: 30 };

// Packet descending into the pocket. Mass > 1 so it reads as paper with weight.
export const insert: Transition = { type: "spring", stiffness: 200, damping: 28, mass: 1.1 };

// 180° envelope flip. Slightly under-damped — the small rock at settle is the
// reference's signature and must survive.
export const flip: Transition = { type: "spring", stiffness: 180, damping: 22, mass: 1.1 };

// Envelope gliding into the slot after release. A response to a gesture, so a
// spring, not a tween.
export const post: Transition = { type: "spring", stiffness: 240, damping: 30 };
```

Reused unchanged: `fold` (both fold panels, flap close, envelope settle), `stamp`
(seal), `snappy` (grab feedback, spring-back, slot swallow, screen nudge), `drift`
(idle bob), `crossfade` (all opacity), `FOLD_STAGGER` (0.25, unchanged — two
180° panels at `fold`'s ~0.5s settle means fold 2 starts when fold 1 is ~70% done,
which is the energy we want).

---

## 10. Reduced motion + accessibility

### 10.1 `prefers-reduced-motion`

Per PLAN.md §7, tightened for this step:

- Whole 4.2s sequence → **two crossfades, 0.70s total**: card-on-sheet → sealed
  envelope back → envelope front. No folds, no flip, no insert.
- Seal fades in; no `stamp` overshoot, no screen nudge.
- No `drift`, no drag tilt.
- Slot appears immediately with the envelope.
- **Drag is replaced by a "Mail it" button.** On press, the envelope crossfades
  out and the epilogue appears. No `post` glide.

### 10.2 Keyboard and screen reader

Auto-play with no skip means a screen-reader user hears nothing for 4.2s unless we
narrate it. Required:

- `aria-live="polite"` status region, announcements per §8.
- Envelope at rest: `tabIndex={0}`, `role="button"`,
  `aria-label="Post your card"`. **Enter** or **Space** runs the same `post`
  animation as a completed drag.
- On post complete, move focus to the epilogue `<h2>` (`tabIndex={-1}`).
- The sequence itself is `aria-hidden` while playing — it is decoration; the live
  region carries the meaning.
- Focus ring uses the app's existing focus-visible treatment. Never a rest-state
  outline (index.css convention).

---

## 11. Snapshot pipeline — read before building

On "Order this card", **before** the step transition:

```ts
const png = await toPng(cardNode, { pixelRatio: 2 });
```

Keep the live card mounted until it resolves (~200ms), hidden behind the step
transition. Pass the data URL into `Confirm`. It serves double duty as the
epilogue's "Download your design" file.

### The risk you must gate on

`html-to-image` clones the DOM into an SVG `foreignObject`. **WebGL canvases
frequently come out black**, because the drawing buffer is cleared after each
frame unless the context was created with `preserveDrawingBuffer: true`.
`@paper-design/shaders-react` controls that context — we do not.

**Gate 1 (30 min, §13).** Snapshot a card and look at it. If the shader is black:

1. Try passing `preserveDrawingBuffer` through the shader component's props.
2. Failing that, call `canvas.toDataURL()` synchronously inside a
   `requestAnimationFrame` immediately after a render, cache the result, and swap
   an `<img>` in before calling `toPng`.
3. Failing that, take the fallback below.

**Snapshot fallback:** render the live `<Card>` inside a `transform-style: flat`
wrapper and degrade the folds to 2D `scaleY` with the same shading curves. The
fold still reads; it loses its Z-depth. This must never block the flow — a failed
snapshot degrades the animation, it does not error the step.

---

## 12. Files and state

```
src/steps/Confirm.tsx          // orchestration + phase state machine + epilogue mount
src/confirm/geometry.ts        // every mm constant in §2; the --mm formula
src/confirm/useSequence.ts     // useAnimate timeline from §4; returns current Phase
src/confirm/snapshot.ts        // toPng wrapper, fallback flag, download helper
src/confirm/CarrierSheet.tsx   // wireframe sheet, 3 panels, fold transforms, shading
src/confirm/Envelope.tsx       // two-face envelope, flap, pocket theatre, seal
src/confirm/MailSlot.tsx       // plate + rect + lip
src/confirm/MailboxDrag.tsx    // drag wiring, magnetic assist, post animation
src/confirm/Epilogue.tsx       // final panel
src/confirm/confirm.css
```

```ts
type Phase =
  | "arrive" | "sheet" | "folding" | "inserting" | "sealing"
  | "flipping" | "idle" | "posting" | "done";
```

`Phase` is derived from the `useAnimate` timeline, not tracked in parallel — one
source of truth. `idle` is the only phase that accepts input.

**Wiring into `App.tsx`:** replace the inline confirm placeholder with `<Confirm />`.
Chrome (`StepIndicator`, `.action-bar-fixed`) takes an `aria-hidden` + opacity-0
state driven by `step === "confirm" && phase !== "done"`.

---

## 13. Gates and timeboxes

Stop and surface the decision when a timebox expires — do not silently pick.

| Gate | Budget | Fallback |
|---|---|---|
| **1. Snapshot renders the shader** (not black) | 30 min | Live `<Card>` + flat 2D folds (§11) |
| **2. Safari `preserve-3d` + face swap** across fold, flap and flip | 45 min | 2D `scaleY` folds with the same shading curves; flip becomes a crossfade |
| **3. 60fps on mid-tier Android** through the full sequence | 30 min | Drop `.panel-cast` shadows first, then the shade overlays |
| **4. Vertical fit at 375×667** with chrome hidden | 15 min | Lower the `--mm` vertical divisor from 200 to 210 |

Perf rules: transform and opacity only, no layout-triggering properties.
`will-change: transform` on folding panels and the envelope **during their beat
only** — set on enter, removed on settle. Nothing in this step touches the WebGL
shader; the snapshot is why.

---

## 14. Cut list (execute in order)

1. Cut `.panel-cast` shadows → shade overlays only.
2. Cut the registration outline and corner ticks.
3. Cut the screen nudge on the seal.
4. Cut fold 2 → one fold, then crossfade to the packet.
5. Cut "Copy share link" from the epilogue.
6. Cut the flip → envelope crossfades from back face to front face.

**Never cut** (inherited from PLAN.md §8, unchanged): the magnetic drag, the seal
stamp, reduced-motion support, exact card proportions.

Note that the flip is cut *last* despite being the most expensive beat. It is the
reference's best moment and the payoff for the whole sequence — it is worth more
than the four cheaper items above it combined.

---

## 15. Amendments to PLAN.md

Apply these to PLAN.md when this ships, so the two documents do not contradict:

| § | Was | Now |
|---|---|---|
| Phase E | 3 folds: left panel over, right panel over, bottom flap up | Horizontal C-fold: bottom panel up, top panel down |
| Phase E | Card lies on "a paper sheet (subtle paper texture)" | Lo-fi wireframe carrier sheet; card is the only high-fidelity object |
| Phase E | Wax seal **or** sticker | Circular sticker, `cardy` wordmark |
| Phase F | Mailbox illustration with flag that flips up | Bare 2D slot; no mailbox, no flag |
| Phase F | Magnetic assist ~120px radius | 20mm / 300px-per-s thresholds (§6.3) — same "impossible to fail" guarantee, restated in this geometry |
| §6 | "nothing animates longer than ~700ms except the full fold sequence (~2.2s total)" | Sequence ceiling raised to **4.2s** |
| §6 | — | Five presets added: `arrive`, `wrap`, `insert`, `flip`, `post` |
| §3 | `confirm/EnvelopeFold.tsx`, `confirm/MailboxDrag.tsx` | File plan in §12 |

Unchanged and still binding: `FOLD_STAGGER` 0.25, the never-cut list, the
reduced-motion contract, ID-1 proportions, "all springs live in motionConfig.ts".

---

## 16. Instructions to Claude Code

- Build in this order: **geometry → sheet (static) → folds → envelope + insert →
  seal → flip → slot + drag → epilogue → reduced motion → a11y.** Each stage should
  look finished before the next starts. Do not build the drag before the flip works.
- **Clear Gate 1 first.** Snapshot quality determines whether the entire fold is 3D
  or 2D. Discovering a black card in hour 3 costs the whole sequence.
- Every dimension is `calc(<mm> * var(--mm))`. If you find yourself typing a pixel
  value inside the stage, you are working around the scale system — stop and fix
  the constant in `geometry.ts` instead.
- Every spring comes from `motionConfig.ts`. No inline transitions, including in
  `useAnimate` sequences.
- Use the MotionValue face swap (§5.1). Do not use `backface-visibility`, and do
  not use `overflow: hidden` to mask either the pocket or the slot.
- Test Safari at the end of **each** stage, not at the end of the step. The
  `preserve-3d` failures are silent — things render in the wrong order rather than
  throwing.
- Commit per stage with a descriptive message. Report bundle size and console
  warnings after each build.
- When a gate's timebox expires, stop and surface the decision with a
  recommendation. Do not silently take the fallback.
