import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { arrowNudge, snappy } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { BackButton } from "./BackButton";
import "./ui.css";

/**
 * Width the back slot animates to: the square button (--control-h) plus the
 * 10px margin in ui.css. Motion needs a number, so the token is read from the
 * root once at mount; the fallback matches today's 60px so a pre-CSS read
 * still renders correctly. The 10px margin remains a comment-contract with
 * .back-slot .btn-back in ui.css.
 */
const BACK_SLOT_W_FALLBACK = 70;
function useBackSlotW(): number {
  const [w, setW] = useState(BACK_SLOT_W_FALLBACK);
  useEffect(() => {
    const h = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--control-h"),
    );
    if (!Number.isNaN(h) && h > 0) setW(h + 10);
  }, []);
  return w;
}

// Persistent bottom action row (lives outside the step transitions so it
// stays constant across the journey). When the back button appears/leaves,
// its slot animates its width so the flexing next CTA resizes smoothly.
//
// The primary "next" button is one element for the whole flow — its label and
// action change per step, but it never unmounts, so it glides between states
// rather than swapping. On the epilogue an optional `secondary` button stacks
// below it: the primary is still the same persistent element (now "Start
// over"), which is what makes the return to step 1 read as a continuation.
export function ActionBar({
  onBack,
  onNext,
  nextLabel,
  showArrow = true,
  secondary,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  /** The arrow-nudge glyph; hidden when the primary is a terminal action. */
  showArrow?: boolean;
  /** Optional stacked secondary CTA (epilogue only). */
  secondary?: { label: string; onClick: () => void };
}) {
  const reduce = usePrefersReducedMotion();
  const backSlotW = useBackSlotW();

  return (
    <div className="action-bar" data-stacked={secondary ? "true" : undefined}>
      <div className="action-bar-row">
        <AnimatePresence initial={false}>
          {onBack && (
            <motion.div
              key="back"
              className="back-slot"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: backSlotW, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={reduce ? { duration: 0 } : snappy}
            >
              <BackButton onClick={onBack} />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          className="btn btn-primary btn-next"
          aria-label={nextLabel}
          onClick={onNext}
          whileTap={{ scale: 0.96 }}
          transition={snappy}
        >
          {/* Steps 1-3 are arrow-only CTAs (label is aria-only). A terminal
              action like "Start over" has no forward arrow, so show its
              label as visible text instead of rendering an empty pill. */}
          {!showArrow && <span className="btn-next-label">{nextLabel}</span>}
          {showArrow && (
            <motion.svg
              className="cta-arrow"
              viewBox="0 0 24 24"
              aria-hidden="true"
              animate={reduce ? undefined : { x: [...arrowNudge.x] }}
              transition={reduce ? undefined : arrowNudge.transition}
            >
              <path
                d="M4 12h15m-6-6 6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </motion.button>
      </div>
      <AnimatePresence initial={false}>
        {secondary && (
          <motion.button
            key="secondary"
            type="button"
            className="btn btn-secondary btn-action-secondary"
            onClick={secondary.onClick}
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "var(--action-h)", opacity: 1, marginTop: 10 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={reduce ? { duration: 0 } : snappy}
            whileTap={{ scale: 0.96 }}
          >
            {secondary.label}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
