import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "../card/Card";
import { type CardConfig } from "../card/cardConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { CarrierSheet } from "../confirm/CarrierSheet";
import { Envelope } from "../confirm/Envelope";
import { Epilogue } from "../confirm/Epilogue";
import { MailSlot } from "../confirm/MailSlot";
import { PostHint } from "../confirm/PostHint";
import { usePostDrag } from "../confirm/usePostDrag";
import { useStageScale } from "../confirm/useStageScale";
import { useWrapSequence } from "../confirm/useWrapSequence";
import "../confirm/confirm.css";

/**
 * Step 3 — the card, then wrap → seal → flip → post.
 *
 * Entry point: the sequence does NOT start on step entry. The card sits at rest
 * at `--slide-w` until the user presses the forward arrow, which flips
 * `started`. Everything before that is exactly what this step showed before.
 *
 * The card in the sequence is the *live* `<Card>`, not a snapshot — a deliberate
 * change from PRD-CONFIRM.md §D10. The reason the PRD banned the live component
 * was WebGL inside a rotating `preserve-3d` subtree, but only the two OUTER fold
 * panels rotate: the card lives on the static middle panel and is fully occluded
 * by the time anything containing it moves in 3D. So it's unmounted at
 * `inserting` and never rotates while visible. This removes html-to-image from
 * the critical path entirely (it now runs lazily, only for the download).
 */
export function Confirm({
  config,
  name,
  firstName,
  started,
  onRestart,
}: {
  config: CardConfig;
  name: string;
  firstName: string;
  started: boolean;
  onRestart: () => void;
}) {
  const reduce = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mmPx = useStageScale(stageRef);
  const [slideW, setSlideW] = useState(372);
  const [showEpilogue, setShowEpilogue] = useState(false);

  // --slide-w is `min(372px, 88dvw)`; read it rather than duplicating the rule.
  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--slide-w");
      const px = parseFloat(raw);
      if (!Number.isNaN(px) && px > 0) setSlideW(px);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const { phase, setPhase, values } = useWrapSequence({
    mmPx,
    slideW,
    started,
    reduce,
  });

  const { dragProps, dragScale, dragTilt, vanish, runPost } = usePostDrag({
    v: values,
    mmPx,
    phase,
    setPhase,
    onPosted: () => {
      setPhase("done");
      setShowEpilogue(true);
    },
  });

  // Chrome hides for the duration. Done with a root data attribute and rules in
  // confirm.css so App.tsx and ui.css stay untouched (see §Conflict surface).
  useEffect(() => {
    const root = document.documentElement;
    if (started) root.dataset.sequence = "playing";
    else delete root.dataset.sequence;
    return () => {
      delete root.dataset.sequence;
    };
  }, [started]);

  useEffect(() => {
    if (!started) setShowEpilogue(false);
  }, [started]);

  // The live card is only mounted while it can be seen. From `inserting` on it
  // is behind two folded paper panels and the envelope body.
  const cardVisible = phase === "rest" || phase === "folding";

  const status =
    phase === "done"
      ? "Posted. Your card arrives in about 7 days."
      : phase === "idle"
        ? "Sealed. Drag down or press Enter to post."
        : started
          ? "Packing your card."
          : "";

  return (
    <div
      className="confirm-stage"
      ref={stageRef}
      style={{ "--mm": `${mmPx}px` } as React.CSSProperties}
      data-phase={phase}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {!showEpilogue && (
        <motion.div className="wrap-scene" style={{ y: values.nudgeY }}>
          <CarrierSheet v={values}>
            {cardVisible && (
              <motion.div
                className="card-holder"
                ref={cardRef}
                style={{ scale: values.cardScale }}
              >
                <Card config={config} name={name} />
              </motion.div>
            )}
          </CarrierSheet>

          <Envelope
            v={values}
            firstName={firstName}
            interactive={phase === "idle"}
            onPost={runPost}
            dragProps={dragProps}
            dragScale={dragScale}
            dragTilt={dragTilt}
            vanish={vanish}
          />

          <MailSlot v={values} />
          {(phase === "idle" || phase === "posting") && (
            <PostHint v={values} reduce={reduce} onMail={runPost} />
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showEpilogue && <Epilogue key="epilogue" onRestart={onRestart} />}
      </AnimatePresence>
    </div>
  );
}
