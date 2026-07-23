import { motion } from "motion/react";
import { crossfade } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { Button } from "../ui/Button";
import "./steps.css";

export function Welcome({ onStart }: { onStart: () => void }) {
  const reduce = usePrefersReducedMotion();

  return (
    <div className="welcome">
      <motion.div
        className="welcome-copy"
        initial={{ opacity: 0, y: reduce ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={crossfade}
      >
        <h1>Welcome, Alex</h1>
        <p>
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </p>
      </motion.div>
      <motion.div
        className="welcome-cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...crossfade, delay: 0.12 }}
      >
        <Button onClick={onStart}>
          Start designing
          <ArrowIcon />
        </Button>
      </motion.div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="btn-arrow" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 12h15m-6-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
