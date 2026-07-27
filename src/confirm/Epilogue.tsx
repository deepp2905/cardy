import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
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
      {/* The heading follows the last action taken: posting the card, then
          asking for the digital one. Keyed so the swap crossfades rather than
          silently substituting the text under the reader's eye. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.h2
          key={walletAdded ? "wallet" : "posted"}
          className="epilogue-title"
          ref={headingRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={crossfade}
        >
          {walletAdded ? "Email sent." : "On its way."}
        </motion.h2>
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={walletAdded ? "wallet" : "posted"}
          className="epilogue-sub"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={crossfade}
        >
          {walletAdded
            ? isTouch
              ? "Open it on this phone to add the card to your wallet."
              : "Check your inbox, then open the link on your phone."
            : "Your card arrives in about 7 days."}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
