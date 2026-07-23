import { AnimatePresence, motion } from "motion/react";
import { arrowNudge, snappy } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { BackButton } from "./BackButton";
import "./ui.css";

// Persistent bottom action row (lives outside the step transitions so it
// stays constant across the journey). When the back button appears/leaves,
// its slot animates its width so the flexing next CTA resizes smoothly.
export function ActionBar({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const reduce = usePrefersReducedMotion();

  return (
    <div className="action-bar">
      <AnimatePresence initial={false}>
        {onBack && (
          <motion.div
            key="back"
            className="back-slot"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 62, opacity: 1 }}
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>
    </div>
  );
}
