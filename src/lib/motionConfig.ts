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

export const fold: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
};

export const stamp: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 15,
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
/** How many slide pitches the falloff spans before reaching the minimum. */
export const CAROUSEL_FALLOFF_SLIDES = 3;

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
