import { motion, type Variants } from "motion/react";
import { crossfade, ENTER_STAGGER } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { Button } from "../ui/Button";
import "./steps.css";

export function Welcome({ onStart }: { onStart: () => void }) {
  const reduce = usePrefersReducedMotion();

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: crossfade },
  };

  return (
    <motion.div
      className="welcome"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: ENTER_STAGGER }}
    >
      <div className="welcome-copy">
        <motion.h1 variants={item}>Welcome, Alex</motion.h1>
        <motion.p variants={item}>
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </motion.p>
      </div>
      <motion.div className="welcome-cta" variants={item}>
        <Button onClick={onStart}>
          Start designing
          <ArrowIcon />
        </Button>
      </motion.div>
    </motion.div>
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
