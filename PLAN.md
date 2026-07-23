# PLAN.md — Card Customizer (Design Engineer Challenge)

> Feed this file to Claude Code. Work through phases in order. Phases are
> sequenced risk-first: the things most likely to fail are prototyped before
> anything is polished. Respect the timeboxes — when a timebox expires, take
> the fallback and move on. The cut list at the bottom is authoritative when
> hours run out.

---

## 0. Product summary

A 3-step physical-card customizer for a fictional challenger bank. The thesis:
letting users invest effort in designing their card (IKEA effect) creates
ownership, attachment, and top-of-wallet behavior. No incumbent issuer offers
this; Cash App's custom cards and marketing stunts (the tap-to-pay magic wand)
prove the demand signal in the Gen Z segment.

**The three steps:**

1. **Welcome** — short, confident intro. One CTA. Sets tone.
2. **Customize** — a horizontal carousel of ~8 cards, each seeded with a
   distinct OKLCH color. The centered card is live-editable via a small dial
   panel (max 2 dials + 1 short text note). Card has a shader/generative wave
   graphic driven by the dials. Card tilts on desktop hover and on mobile
   accelerometer.
3. **Confirm** — the finished card is wrapped in paper (3 folds), slides into
   an envelope, user drags the envelope to a mailbox (magnetic assist), gets
   "arrives in ~7 days" + "add digital card to wallet now" epilogue.

**Non-goals:** no auth, no backend, no real payments, no persistence beyond
URL params. This is a polished vertical slice, not a product.

---

## 1. Stack (fixed — do not relitigate)

- **Vite + React 19 + TypeScript.** SPA, static build, deployed to Vercel.
- **motion** (`motion/react`, latest) for all animation. No CSS keyframe
  animation except trivial idle loops.
- **@paper-design/shaders-react** for the card background shader.
- **dialkit** (Josh Puckett) for the dial controls. If its API fights us as a
  user-facing control, fall back to a custom dial built with motion's
  `useMotionValue` + pointer events — budget 90 min max for that fallback.
- **html-to-image** for snapshotting the card DOM node to PNG at the
  customize→confirm transition.
- **culori** (or hand-rolled helpers) for OKLCH manipulation if needed;
  prefer raw CSS `oklch()` strings where possible.
- No component library. No Tailwind unless dev speed demands it — if used,
  keep it out of the card itself (card styles hand-written for full control).

## 2. Layout system

Single centered column, `max-width: 420px`, full viewport height, works
identically on mobile and desktop. Desktop gets ambient treatment outside the
column (subtle gradient / vignette, generous negative space) but **all
interactive content lives inside the column**. This is a deliberate design
choice, not a shortcut — state it in the doc.

Card aspect ratio: ISO/IEC 7810 ID-1 = 85.60 × 53.98 mm ≈ **1.586:1**.
Card corner radius ≈ 3.18mm scaled to render size. Get this exactly right;
wrong card proportions are instantly visible to a design reviewer.

---

## 3. Architecture

```
src/
  App.tsx                 // step state machine: welcome | customize | confirm
  steps/
    Welcome.tsx
    Customize.tsx
    Confirm.tsx
  card/
    Card.tsx              // pure: (config) => visual. Used everywhere.
    CardShader.tsx        // paper-shaders background layer
    WaveGraphic.tsx       // generative curve layer (see Phase B spike)
    cardConfig.ts         // types + palette + defaults + serialization
  controls/
    DialPanel.tsx         // dialkit wrapper, binds to active card's config
    NoteField.tsx         // constrained one-line note (24 chars, charset-limited)
  carousel/
    CardCarousel.tsx      // scroll-snap + motion, center detection
  tilt/
    useTilt.ts            // pointer hover (desktop) + deviceorientation (mobile)
  confirm/
    snapshot.ts           // html-to-image capture of Card node
    EnvelopeFold.tsx      // paper wrap + fold sequence (operates on snapshot)
    MailboxDrag.tsx       // magnetic drag + drop + confirmation state
  lib/
    motionConfig.ts       // ALL spring/transition presets live here, nowhere else
    reducedMotion.ts
```

**State model (critical — build this first):**

```ts
type CardConfig = {
  id: string;            // stable per carousel slot
  baseColor: string;     // oklch string from palette
  curve: { a: number; b: number; phase: number }; // Lissajous params
  intensity: number;     // dial 2: maps to amplitude/scale/grain via mapRange
  note: string;          // "" | max 24 chars
};

// One config PER carousel card, keyed by id. Editing only ever touches the
// centered card's config. Sliding to another card shows THAT card's config
// in the dial panel (controls visually reset/retarget). Configs persist for
// the session — user can slide back and their earlier tweaks are intact.
const [configs, setConfigs] = useState<Record<string, CardConfig>>(seedConfigs);
const [activeId, setActiveId] = useState<string>(...);
```

Do not use global mutable dial state. The dial panel is a controlled component
reading/writing `configs[activeId]`. This is the one architectural decision
that cannot be retrofitted cheaply.

**Serialization:** `cardConfigToParams(config)` → URLSearchParams, applied on
confirm. Makes the final card shareable/reloadable for free and gives the
reviewer a durable link to *their* creation. ~30 min, high demo value.

---

## 4. Palette (curated, not free)

8 seed colors in OKLCH, constant lightness/chroma band so every card looks
premium and text contrast is guaranteed. Starting set (tweak by eye later):

```
oklch(0.62 0.19 250)  // cobalt
oklch(0.62 0.19 300)  // violet
oklch(0.62 0.17 350)  // magenta
oklch(0.65 0.18 25)   // coral
oklch(0.70 0.16 85)   // amber
oklch(0.66 0.17 150)  // jade
oklch(0.64 0.15 200)  // teal
oklch(0.30 0.03 260)  // graphite (the "serious" option)
```

Foreground (name, note, chip, logo) is a fixed near-white or near-black chosen
per-card by computing OKLCH lightness — no per-color hand tuning.

---

## 5. Phases

### Phase 0 — Scaffold + deploy pipeline (30 min)
- Vite + React + TS scaffold, deploy empty shell to Vercel immediately.
- Install: motion, @paper-design/shaders-react, dialkit, html-to-image.
- Verify dialkit actually installs and renders; if the npm package is broken
  or dev-panel-only, decide NOW between (a) using it as a dev tool and
  building a custom user-facing dial, or (b) skinning it. Do not discover
  this in hour 8.
- `motionConfig.ts` with named presets (see §6).

### Phase A — The card itself (2 hrs) **[risk spike: shader perf]**
- `Card.tsx`: exact ID-1 proportions, layered: shader bg → wave graphic →
  content (bank wordmark, chip, name "ALEX RIVERA" fixed, note line, network
  logo placeholder drawn as generic circles — do NOT use real Visa/MC marks).
- Wire one paper-shaders shader as background, tinted by `baseColor`.
- **Perf gate:** test on a real mid-tier Android phone AND iOS Safari via the
  Vercel deploy. Target: 60fps with shader running while a motion spring
  animates card rotation. If the shader can't hold 60fps on mobile, fallback:
  render shader static (paused uniform) or replace with a pre-rendered
  gradient mesh + grain PNG overlay. Decide within the timebox.

### Phase B — Wave graphic spike (1.5 hrs, hard timebox)
Try in this order, keep the first that looks great and runs fast:
1. **SVG path** — Lissajous-family curve sampled to a `<path>`, params
   `{a, b, phase}` from dial 1, `intensity` mapping (mapRange) to stroke
   width / amplitude / repeat count. Crisp, cheap, snapshots perfectly with
   html-to-image. **This is the expected winner.**
2. **Canvas 2D** — only if SVG can't achieve a desired effect (glow, additive
   blending).
3. **Shader uniform** — only if the paper shader already exposes usable
   params; do not write custom GLSL in this budget.
- The curve does NOT animate continuously. It re-forms with a spring when a
  dial changes (animate path `d` via motion or interpolate sample points).
  A 300–500ms settle animation on dial release = the "alive" feeling without
  perpetual motion.

### Phase C — Customize screen (2.5 hrs)
- `CardCarousel`: CSS scroll-snap horizontal strip + IntersectionObserver (or
  scroll position math) for center detection → sets `activeId`. Non-center
  cards: scale 0.86, slight blur/desaturate, reduced opacity. Center card:
  full scale + tilt enabled.
- Dial panel below carousel: dial 1 = curve character (single knob sweeping
  through Lissajous a/b/phase space via a designed mapping — precompute the
  mapping so every position looks good; never expose raw a/b as separate
  controls), dial 2 = intensity. Both write to `configs[activeId]`.
- Retarget behavior: when center card changes, dials animate to the new
  card's stored values (springs, ~250ms) — this retargeting IS a micro-magic
  moment, make it visible.
- `NoteField`: single line, 24 char max, uppercase, restricted charset
  `[A-Z0-9 .,!♥]`, renders on card in engraved style. Placeholder suggests
  personality: "FOR COFFEE ONLY".
- CTA: "Order this card" — only enabled state worth designing; no disabled
  states needed (any config is valid).

### Phase D — Tilt (1.5 hrs)
- Desktop: pointer position over card → `useMotionValue` x/y → springs →
  `rotateX/rotateY` (max ±10°) + a specular highlight div whose gradient
  position follows the pointer (the highlight is what sells it).
- Mobile: `deviceorientation`. iOS 13+ requires
  `DeviceOrientationEvent.requestPermission()` from a user gesture on HTTPS:
  put a small "✨ Bring it to life" chip on the customize screen; tapping it
  requests permission. Denied/unavailable/Android-flaky → fallback to
  touch-drag tilt on the card itself (same motion values, driven by pan).
- **Budget rule:** if accelerometer eats more than 45 min of debugging,
  ship touch-drag tilt only and note it in the doc as a deliberate scope call.
- Tilt disabled entirely under reduced motion.

### Phase E — Confirm: snapshot + fold (3 hrs) **[highest craft risk]**
- On "Order this card": capture `Card` node → PNG via html-to-image
  (2x pixel ratio). Keep the live card visible until capture resolves; swap
  imperceptibly to the image. (~200ms, hide behind the step transition.)
- `EnvelopeFold` sequence (all operating on flat images/divs, NOT the live
  component):
  1. Card image lies centered on a paper sheet (subtle paper texture, drop
     shadow).
  2. Three folds: left panel folds over (rotateY around left edge), right
     panel folds over (rotateY around right edge), bottom flap folds up
     (rotateX). Each fold: spring, ~450ms, staggered 250ms, with a shadow
     gradient that darkens during the fold (shadow sells the paper).
  3. Folded parcel scales down slightly and slides into an envelope opening
     (envelope drawn in front layer, parcel passes behind its front face —
     simple z-index theater, no real 3D needed).
  4. Envelope flap closes. A wax-seal or sticker stamps on with an
     overshooting spring (scale 0 → 1.15 → 1) + tiny haptic-feel screen
     nudge. **This stamp is the sound-effect moment of the whole flow —
     spend 20 extra minutes on it.**
- Implementation notes: parent needs `perspective: 1200px`; each folding
  panel `transform-origin` on its hinge edge; fold panels show the paper
  back-face (solid) not `backface-visibility` tricks. Test in Safari early —
  Safari's preserve-3d + overflow bugs are the known dragon here.
- **Fallback if fold fights back past the timebox:** cut folds to ONE
  motion — paper wraps via a single crossfade+scale into the parcel — and
  keep the envelope insert + seal, which carry most of the charm.

### Phase F — Mailbox drag + epilogue (1.5 hrs)
- Envelope becomes draggable (motion `drag`), constrained to vertical-ish
  axis with elastic bounds. Mailbox illustration below with an open slot.
- **Magnetic assist:** on drag, when envelope center is within ~120px of the
  slot OR on release with downward velocity, animate it snapping into the
  slot (spring, slight rotation to align). Any release closer than halfway
  completes the action. It must be impossible to fail.
- Affordance: idle bobbing animation on the envelope + a "drag me to the
  mailbox" label with a downward arrow that fades on first touch. Under
  reduced motion: no drag — a "Mail it" button does the same thing.
- Mailbox flag flips up on delivery (rotate spring). Then epilogue panel
  rises: "Your card is on its way — arrives in ~7 days." Below: "Can't
  wait? Add your digital card now" → custom wallet-style button (do NOT
  pixel-clone the official Apple badge). Mobile: fake success sheet.
  Desktop: popover "We've emailed you a link — open on your phone."
  Also: "Download your design" (serves the snapshot PNG — free feature from
  Phase E) and a share link (URL-serialized config).

### Phase G — Welcome screen + step transitions (1 hr)
- Do this LATE, once the card exists, so the welcome screen can show real
  product: a slowly idle-tilting card (autonomous gentle rotation) with
  headline. Copy direction: confident, short. e.g. "Your card. Actually
  yours." / sub: "Design it in 60 seconds. We'll mail it in 7 days." CTA:
  "Start designing".
- Step transitions: shared-element feel — the card is the continuity object.
  Welcome→Customize: welcome card animates into carousel center position
  (motion `layoutId`). Customize→Confirm: card animates from carousel to the
  paper sheet. One object traveling through the whole story = the craft
  signature of the piece.

### Phase H — Polish pass (2 hrs)
- Reduced motion audit (see §7).
- Perf: no layout-triggering animations (transform/opacity/filter only),
  `will-change` on the card during tilt, shader paused when card off-screen.
- Meta: title, description, OG image (use a rendered card snapshot),
  favicon (mini card).
- QA matrix: iOS Safari, Android Chrome, desktop Chrome/Safari/Firefox.
- Copy pass: every string reviewed once, no lorem, no "Submit".
- Empty-ish states: note field empty is fine (line simply absent from card).

### Phase I — Ship + doc (1.5 hrs, outside the app budget)
- Vercel production deploy, custom subdomain if available.
- Portfolio write-up: the 5 opportunities, why this one (IKEA-effect framing,
  Cash App demand signal), design decisions (curated OKLCH palette rationale,
  two-dial constraint, magnetic drag, reduced-motion strategy, snapshot-fold
  tradeoff), stack + AI workflow (Claude Code usage — the brief explicitly
  wants this).
- Record 2 short screen captures (desktop hover tilt; mobile full flow) as
  insurance against reviewer environment issues.

**Total: ~16 hrs core + 1.5 doc.** The 10–12 hr version exists only via the
cut list.

---

## 6. Motion spec (initial values — tune with dialkit, keep in motionConfig.ts)

| Name | Use | Values |
|---|---|---|
| `snappy` | dial retarget, UI bits | spring, stiffness 420, damping 30 |
| `card` | tilt springs | spring, stiffness 170, damping 20, mass 0.9 |
| `fold` | paper folds | spring, stiffness 220, damping 26 |
| `stamp` | seal overshoot | spring, stiffness 500, damping 15 |
| `drift` | idle bob | keyframe y ±4px, 3.2s, easeInOut, repeat |
| `settle` | wave re-form on dial release | spring, stiffness 120, damping 18 |

Rules: no `duration`-based tweens for interactive responses (springs only);
tweens allowed for opacity crossfades (0.25–0.35s, ease [0.32,0.72,0,1]);
stagger between fold panels 0.25s; nothing in the app animates longer than
~700ms except the full fold sequence (~2.2s total) — long enough to savor,
short enough to never feel slow on a second run.

## 7. Reduced motion contract

`useReducedMotion()` gates, globally:
- Tilt (pointer + accelerometer): OFF.
- Carousel: scroll-snap stays (user-initiated motion is fine), scale/blur on
  neighbors becomes opacity-only.
- Fold sequence: replaced by two crossfades (card→parcel, parcel→sealed
  envelope), total <0.8s.
- Mailbox drag: replaced by a "Mail it" button; flag flip becomes a fade.
- Idle bobbing/drift: OFF.
- All opacity transitions: KEPT.

## 8. Cut list (execute in order when out of time)

1. Cut accelerometer tilt → touch-drag tilt only (keep desktop hover).
2. Cut 3-fold sequence → single wrap crossfade + envelope insert + seal.
3. Cut per-card curve dial → curve fixed per palette card, keep intensity
   dial only.
4. Cut note field.
5. Cut URL serialization + share.
6. Cut welcome idle card → static render.
7. **Never cut:** magnetic drag-to-mailbox, the seal stamp, reduced-motion
   support, exact card proportions. These are the review.

## 9. Instructions to Claude Code

- Work phase by phase; do not start a later phase before the earlier phase's
  gate criteria are met. Ask before deviating from the architecture in §3.
- All animation values go through `motionConfig.ts`. Never inline springs.
- Every interactive element: hover, active, focus-visible states. Keyboard:
  carousel arrows navigate cards; dials adjustable via arrow keys; the
  entire flow completable without a pointer.
- After each phase, run the build and report bundle size + any console
  warnings. Commit per phase with a descriptive message.
- When a timebox decision is hit (shader perf, dialkit viability, fold
  fallback), STOP and surface the decision with a recommendation instead of
  silently picking one.
