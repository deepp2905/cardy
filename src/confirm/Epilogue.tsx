import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { crossfade } from "../lib/motionConfig";
import { Button } from "../ui/Button";

/**
 * Post-drop epilogue (PRD-CONFIRM.md §7, PLAN.md Phase F).
 *
 * The flow's real ending: confirmation and the digital-card offer, with a way
 * back to the start. It's also what puts the card back on screen — the
 * sequence buries the thing the user made, and this is where it returns.
 */
export function Epilogue({ onRestart }: { onRestart: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [walletNote, setWalletNote] = useState(false);

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

      <Button className="epilogue-cta" onClick={() => setWalletNote(true)}>
        Add the digital card now
      </Button>
      {walletNote && (
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

      <Button
        variant="secondary"
        className="epilogue-restart"
        onClick={onRestart}
      >
        Start over
      </Button>
    </motion.div>
  );
}
