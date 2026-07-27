import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { PatternShape } from "../card/cardConfig";
import { crossfade } from "../lib/motionConfig";

/**
 * The beat runs for POST_LOADING_MS (Confirm.tsx owns that timer). These four
 * stages narrate what the user just watched happen, in order: the card is
 * printed, the engraving goes on, it's sealed into the envelope, and it's
 * handed to postage. Contextual rather than a single generic "Creating your
 * card" — each line names a real step of making THIS object.
 *
 * `at` is the ms offset the line appears, so the dwells are roughly 1000 /
 * 1100 / 1000 / 900ms. The last one is deliberately the shortest: it hands
 * straight to the epilogue ("Posted."), so it should still be on screen — not
 * already stale — when the crossfade starts.
 */
const STAGES = [
  { at: 0, text: "Printing your card…" },
  { at: 1000, text: "Pressing the engraving…" },
  { at: 2100, text: "Sealing the envelope…" },
  { at: 3100, text: "Handing it to the post…" },
] as const;

/** Total beat length, exported so Confirm's hand-off timer can't drift from it. */
export const POST_LOADING_MS = 4000;

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
 * so the state still reads as "working" without anything moving. The stage
 * text still advances (it's information, not decoration) but loses its
 * vertical travel and crossfades in place.
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
  // Walk the stage list on its own timers. One timeout per stage rather than
  // an interval, so a stage can have its own dwell (see STAGES) and a slow
  // frame can't compound a drift across all four.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = STAGES.slice(1).map((s, i) =>
      window.setTimeout(() => setStage(i + 1), s.at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

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
      {/* Each stage line crossfades with a small vertical travel — the outgoing
          line leaves upward and the incoming arrives from below, so the
          sequence reads as progress moving forward rather than a word swap.
          mode="wait" would leave the box empty between lines; the default
          overlap keeps text on screen continuously, which the reserved-height
          .post-loading-status box makes safe.

          The live region lives here (not on the whole component) and is
          aria-atomic, so each new stage is announced as one complete phrase.
          Confirm.tsx's own status line stops naming this beat — otherwise the
          same progress is announced twice. */}
      <div
        className="post-loading-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence initial={false}>
          <motion.p
            key={stage}
            className="post-loading-text"
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={crossfade}
          >
            {STAGES[stage].text}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
