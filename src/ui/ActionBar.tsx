import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";
import { BackButton } from "./BackButton";
import "./ui.css";

// Persistent bottom action row (lives outside the step transitions so it
// stays constant across the journey). Optional square back button on the
// left; the arrow-only next CTA flexes to fill the remaining width.
export function ActionBar({
  onBack,
  onNext,
  nextLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="action-bar">
      {onBack && <BackButton onClick={onBack} />}
      <motion.button
        type="button"
        className="btn btn-primary btn-next"
        aria-label={nextLabel}
        onClick={onNext}
        whileTap={{ scale: 0.96 }}
        transition={snappy}
      >
        <svg className="cta-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 12h15m-6-6 6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </div>
  );
}
