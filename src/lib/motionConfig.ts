import type { Transition } from "motion/react";

// Every spring/transition in the app lives here. Never inline values.

// Options shape for useSpring() (motion values take no `type` field).
export const snappyOptions = {
  stiffness: 420,
  damping: 30,
} as const;

export const snappy: Transition = {
  type: "spring",
  ...snappyOptions,
};

// Like `snappy` but near-critically damped — glides to rest with almost no
// overshoot. For pill/tab retargets where a bounce reads as sloppy rather than
// lively (e.g. the playground's menu segmented controls).
export const snappyCalm: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 42,
};

// Step indicator travelling more than one segment (e.g. confirm -> welcome
// via "Start over"). Same damping ratio as `snappy` so the character is
// identical — only faster. 4x stiffness halves the settle time, which on a
// 2x-longer trip is roughly double the velocity of a single-step slide.
export const snappyFar: Transition = {
  type: "spring",
  stiffness: 1680,
  damping: 60,
};

export const card: Transition = {
  type: "spring",
  stiffness: 170,
  damping: 20,
  mass: 0.9,
};

// The persistent hero card springs between its customize (deck) centre and its
// confirm (rest) centre on a step change. ζ ≈ 0.98 at these values (near
// critical) so it glides down and settles without a wobble — the old pop came
// from a layout-projection hand-off, not the spring, so this is deliberately
// calm. Position only; the card never resizes, so there is no scale delta to
// resolve.
export const cardMove: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

// --- Confirm-sequence springs ---
//
// These seven (fold, stamp, arrive, wrap, insert, flip, post) run at the wrap
// sequence's TEMPO, 1.25x slower than their original tuning. A spring is slowed
// by k/T² and c/T, which holds the damping ratio exactly — so the character
// (bounce, overshoot, settle shape) is identical and only the pace changes.
// The original values are noted per spring in case the tempo is reverted.

export const fold: Transition = {
  type: "spring",
  stiffness: 141, // was 220
  damping: 20.8, // was 26 — ζ 0.876 either way
};

export const stamp: Transition = {
  type: "spring",
  stiffness: 320, // was 500
  damping: 12, // was 15 — ζ 0.335, the overshoot the seal beat wants
};

// Options shape for useSpring() (motion values take no `type` field).
export const settleOptions = {
  stiffness: 120,
  damping: 18,
} as const;

export const settle: Transition = {
  type: "spring",
  ...settleOptions,
};

// Opacity crossfades only — never for interactive responses.
export const crossfade: Transition = {
  duration: 0.3,
  ease: [0.32, 0.72, 0, 1],
};

// Idle bob (envelope, welcome card). Gated off under reduced motion.
export const drift = {
  y: [0, -4, 0, 4, 0],
  transition: {
    duration: 3.2,
    ease: "easeInOut",
    repeat: Infinity,
  },
} as const;

// Slider overscroll stretch. Safe to hand-roll here (unlike the carousel):
// the track is a plain div, so there is no native scroll bounce to fight.
export const sliderStretch = {
  stiffness: 380,
  damping: 32,
  mass: 0.6,
} as const;

export const FOLD_STAGGER = 0.25;

// Carousel proximity scaling: a slide is full size dead-centre and shrinks
// toward CAROUSEL_SCALE_MIN one slide-width out, mapped continuously so the
// growth tracks the finger rather than snapping on the active change.
// Eased (not linear) so most of the size change happens near the centre —
// scale is the only focus cue left now that opacity and blur are gone.
export const CAROUSEL_SCALE_MIN = 0.75;
export const CAROUSEL_SCALE_MAX = 1;
/**
 * How many slide pitches the falloff spans before reaching the minimum.
 * 2 puts the first neighbour at ~81% and the second at the 75% floor —
 * enough of a gradient to read across the deck, while the floor is
 * actually reached by a card the user can see.
 */
export const CAROUSEL_FALLOFF_SLIDES = 2;

// Overscroll bounce is deliberately NOT implemented here. A custom rubberband
// layers on top of the platform's own elastic scrolling instead of replacing
// it (there is no way to opt out of native overscroll while keeping the
// scroller), and the two animating the same gesture never resolve cleanly.

// Entrance choreography: semantic chunks stagger in, never one big block.
export const ENTER_STAGGER = 0.08;

// Icon cross-swap (theme toggle etc): scale/opacity/blur, springs, no bounce.
export const iconSwap: Transition = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
};

// Theme icon swap — quick, near-critically damped so the bounce is barely
// visible (paired with popLayout). Critical damping at this stiffness ~53.
export const iconPop: Transition = {
  type: "spring",
  stiffness: 700,
  damping: 44,
};

// Periodic nudge for the forward CTA arrow: drift right, ease back, pause,
// repeat. Draws the eye toward "next" without perpetual motion.
export const arrowNudge = {
  x: [0, 5, 0],
  transition: {
    duration: 0.7,
    ease: "easeInOut",
    repeat: Infinity,
    repeatDelay: 4,
  },
} as const;

// --- Confirm sequence (PRD-CONFIRM.md §9) ------------------------------------

// Card settling back to sequence scale as the carrier sheet appears behind it.
export const arrive: Transition = {
  type: "spring",
  stiffness: 128, // was 200
  damping: 22.4, // was 28 — ζ 0.990 either way
};

// Carrier sheet fade-and-settle.
export const wrap: Transition = {
  type: "spring",
  stiffness: 166, // was 260
  damping: 24, // was 30 — ζ 0.930
};

// Packet descending into the envelope pocket. mass > 1 so it reads as paper
// with weight rather than a div changing its y.
export const insert: Transition = {
  type: "spring",
  stiffness: 128, // was 200
  damping: 22.4, // was 28 — ζ 0.944
  mass: 1.1,
};

// 180° envelope flip. Deliberately under-damped: the small rock at settle is
// the reference animation's signature and must survive tuning.
export const flip: Transition = {
  type: "spring",
  stiffness: 115, // was 180
  damping: 17.6, // was 22 — ζ 0.782, keeps the rock at settle
  mass: 1.1,
};

// Envelope gliding into the slot after release. A response to a gesture, so a
// spring — never a duration tween (§6 rules).
export const post: Transition = {
  type: "spring",
  stiffness: 154, // was 240
  damping: 24, // was 30 — ζ 0.968
};
