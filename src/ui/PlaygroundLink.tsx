import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";
import "./ui.css";

// Dev-only shortcut into the value playground. Rendered next to the theme
// toggle; the playground itself is lazy-loaded, so this link is the only
// cost the main bundle pays for it.
export function PlaygroundLink() {
  return (
    <motion.a
      href="#/play"
      className="corner-btn playground-link"
      aria-label="Open the value playground"
      title="Playground"
      whileTap={{ scale: 0.96 }}
      transition={snappy}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 7.5v9l7-4.5-7-4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </motion.a>
  );
}
