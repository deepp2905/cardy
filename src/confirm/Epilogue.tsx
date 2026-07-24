import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { crossfade } from "../lib/motionConfig";
import { Button } from "../ui/Button";
import { downloadPng } from "./snapshot";

/**
 * Post-drop epilogue (PRD-CONFIRM.md §7, PLAN.md Phase F).
 *
 * The flow's real ending: confirmation, the digital-card offer, the design as a
 * file, and the share link. It's also what puts the card back on screen — the
 * sequence buries the thing the user made, and this is where it returns.
 */
export function Epilogue({
  png,
  shareUrl,
  onRestart,
}: {
  png: string | null;
  shareUrl: string;
  onRestart: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const [walletNote, setWalletNote] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

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

      <div className="epilogue-links">
        {png && (
          <button type="button" className="link-btn" onClick={() => downloadPng(png)}>
            Download your design
          </button>
        )}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            navigator.clipboard?.writeText(shareUrl).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          {copied ? "Link copied" : "Copy share link"}
        </button>
        <button type="button" className="link-btn" onClick={onRestart}>
          Design another
        </button>
      </div>
    </motion.div>
  );
}
