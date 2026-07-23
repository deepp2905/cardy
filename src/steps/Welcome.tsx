import { motion, type Variants } from "motion/react";
import { crossfade, ENTER_STAGGER } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { ActionBar } from "../ui/ActionBar";
import { Button } from "../ui/Button";
import "./steps.css";

export function Welcome({ onStart }: { onStart: () => void }) {
  const reduce = usePrefersReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: ENTER_STAGGER } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: crossfade },
  };

  return (
    <motion.div
      className="step welcome"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="step-body welcome-copy" variants={item}>
        <h1>Welcome, Alex</h1>
        <p>
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </p>
      </motion.div>
      <motion.div className="action-bar-slot" variants={item}>
        <ActionBar>
          <Button onClick={onStart}>
            Start designing
            <ArrowIcon />
          </Button>
        </ActionBar>
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
