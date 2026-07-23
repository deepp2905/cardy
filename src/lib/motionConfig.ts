import type { Transition } from "motion/react";

// Every spring/transition in the app lives here. Never inline values.

export const snappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
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

export const settle: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
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

export const FOLD_STAGGER = 0.25;
