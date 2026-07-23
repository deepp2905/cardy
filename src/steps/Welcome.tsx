import { motion, type Variants } from "motion/react";
import { crossfade, ENTER_STAGGER } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./steps.css";

// Body only — the CTA lives in the persistent action bar (App).
export function Welcome() {
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
      className="step-body welcome-copy"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item}>Welcome, Alex</motion.h1>
      <motion.p variants={item}>
        Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
        your wave, your words.
      </motion.p>
    </motion.div>
  );
}
