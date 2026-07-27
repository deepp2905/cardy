import { motion } from "motion/react";
import type { PatternShape } from "../card/cardConfig";
import { crossfade } from "../lib/motionConfig";

/**
 * Brief "making it" beat between the envelope dropping into the slot and the
 * epilogue. The mark is the user's OWN pattern shape — same shape and fill
 * mode they chose in customize — so the wait reads as their card being made
 * rather than a generic spinner. Drawn in neutral ink, not the card colour:
 * the card has just gone into the slot, and a saturated mark here reads as a
 * new object rather than a quiet progress state.
 *
 * Motion: a continuous 360° rotation with a size pulse. The pulse is a
 * symmetric keyframe set on easeInOut — the smoothed sine of a pendulum — so
 * the shape breathes rather than throbs. Rotation and pulse live on separate
 * nodes so the two transforms never fight over one matrix.
 *
 * Reduced motion: no rotation, no pulse — a gentle opacity breath instead,
 * so the state still reads as "working" without anything moving.
 */
export function PostLoading({
  shape,
  filled,
  reduce,
}: {
  shape: PatternShape;
  filled: boolean;
  reduce: boolean;
}) {
  // currentColor, set by .post-loading-shape in CSS, so the mark tracks the
  // theme's neutral ink in both light and dark.
  const paint = filled
    ? { fill: "currentColor" }
    : { fill: "none", stroke: "currentColor", strokeWidth: 2.6 };

  return (
    <motion.div
      className="post-loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={crossfade}
    >
      <motion.div
        className="post-loading-spin"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={
          reduce
            ? undefined
            : { repeat: Infinity, duration: 2.6, ease: "linear" }
        }
      >
        <motion.svg
          viewBox="0 0 48 48"
          className="post-loading-shape"
          aria-hidden="true"
          animate={reduce ? { opacity: [0.55, 1, 0.55] } : { scale: [1, 1.16, 1] }}
          transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
        >
          {shape === "circle" && <circle cx="24" cy="24" r="16" {...paint} />}
          {shape === "rect" && (
            <rect x="8" y="8" width="32" height="32" rx="4.5" {...paint} />
          )}
          {shape === "triangle" && (
            <polygon points="24,7 41,39 7,39" strokeLinejoin="round" {...paint} />
          )}
        </motion.svg>
      </motion.div>
      <p className="post-loading-text">Creating your card&hellip;</p>
    </motion.div>
  );
}
