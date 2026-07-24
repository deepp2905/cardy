import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { crossfade } from "../lib/motionConfig";

/**
 * Post-drop epilogue (PRD-CONFIRM.md §7, PLAN.md Phase F).
 *
 * The flow's real ending: confirmation and the digital-card offer. The two
 * CTAs (Start over + Add the digital card) live in the persistent ActionBar,
 * not here — the primary is the same element that carried every step's CTA, so
 * returning to step 1 reads as that button coming back rather than a new
 * screen. This body is just the message and the wallet confirmation note.
 */
export function Epilogue({ walletAdded }: { walletAdded: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const isTouch =
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  return (
    <motion.div
      className="epilogue"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={crossfade}
    >
      <h2 className="epilogue-title" ref={headingRef} tabIndex={-1}>
        On its way.
      </h2>
      <p className="epilogue-sub">Your card arrives in about 7 days.</p>

      {walletAdded && (
        <motion.p
          className="epilogue-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={crossfade}
        >
          {isTouch
            ? "Added. Open your wallet to see it."
            : "We've emailed you a link — open it on your phone."}
        </motion.p>
      )}
    </motion.div>
  );
}
