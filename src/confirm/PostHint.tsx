import { motion, useTransform, type MotionValue } from "motion/react";
import { SLOT_TOP, mm } from "./geometry";
import type { SequenceValues } from "./useWrapSequence";

/**
 * The post affordance, between the envelope and the slot. A downward chevron
 * that bobs on a sine curve — pure "drag me down", no copy. Fades out on first
 * pointerdown and never returns.
 *
 * Under reduced motion the drag is replaced entirely by a button (PLAN.md §7) —
 * the gesture is the terminal action of the whole flow, so it can never be the
 * only way to finish.
 */
export function PostHint({
  v,
  reduce,
  onMail,
  fade,
}: {
  v: SequenceValues;
  reduce: boolean;
  onMail: () => void;
  /** 1 until the envelope reaches the slot mouth, → 0 as it is swallowed.
   *  Multiplied with the sequence's arrival fade-in, so the hint appears on
   *  the timeline's schedule and leaves on the envelope's position. */
  fade: MotionValue<number>;
}) {
  // Two independent reasons to be hidden; they multiply rather than override.
  const opacity = useTransform(
    [v.hintOpacity, fade] as const,
    ([arrive, out]: number[]) => arrive * out,
  );

  if (reduce) {
    return (
      <motion.div
        className="post-hint post-hint--reduced"
        style={{ opacity, top: `calc(50% + ${mm(SLOT_TOP - 26)})` }}
      >
        <button type="button" className="btn btn-primary btn-mail" onClick={onMail}>
          Mail it
        </button>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="post-hint"
      style={{ opacity: v.hintOpacity, top: `calc(50% + ${mm(SLOT_TOP - 22)})` }}
      aria-hidden="true"
    >
      {/* A sine bob: the ease-in-out on a symmetric 0 → peak → 0 keyframe set is
          the smoothed sine of a pendulum, so the chevron eases in at the top of
          its travel and again at the bottom — the "slow at the extremes" that
          reads as a gentle, breathing pull downward rather than a mechanical
          slide. */}
      <motion.svg
        viewBox="0 0 24 24"
        className="post-hint-chevron"
        initial={{ y: 0 }}
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
      >
        <path
          d="M5 9l7 7 7-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}
