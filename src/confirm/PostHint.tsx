import { motion } from "motion/react";
import { SLOT_TOP, mm } from "./geometry";
import type { SequenceValues } from "./useWrapSequence";

/**
 * "Drag down to post", between the envelope and the slot. Fades out on first
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
}: {
  v: SequenceValues;
  reduce: boolean;
  onMail: () => void;
}) {
  if (reduce) {
    return (
      <motion.div
        className="post-hint post-hint--reduced"
        style={{ opacity: v.hintOpacity, top: mm(SLOT_TOP - 26) }}
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
      style={{ opacity: v.hintOpacity, top: mm(SLOT_TOP - 22) }}
      aria-hidden="true"
    >
      <span>Drag down to post</span>
      <svg viewBox="0 0 24 24" className="post-hint-arrow">
        <path
          d="M12 5v14m-6-6 6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}
