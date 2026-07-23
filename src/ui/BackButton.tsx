import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";
import "./ui.css";

// Square, icon-only. Same shafted arrow as the next button, mirrored left.
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="btn btn-back"
      aria-label="Go back"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={snappy}
    >
      <svg className="cta-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 12H5m6-6-6 6 6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
