import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "../card/Card";
import { type CardConfig } from "../card/cardConfig";
import { CARD_HERO_LAYOUT_ID, cardHeroLayout } from "../lib/motionConfig";
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
  walletAdded,
  onEpilogueChange,
}: {
  config: CardConfig;
  name: string;
  firstName: string;
  started: boolean;
  /** App owns the wallet CTA (it lives in the ActionBar now); this is its state. */
  walletAdded: boolean;
  /** Report epilogue visibility up so App can swap the ActionBar to it. */
  onEpilogueChange: (shown: boolean) => void;
}) {
  const reduce = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
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

  // Chrome hides for the wrap sequence, then RETURNS on the epilogue: the
  // ActionBar there hosts "Start over" + the wallet CTA, so it must be visible.
  // Driven by a root data attribute + rules in confirm.css so ui.css needs no
  // changes (see §Conflict surface).
  useEffect(() => {
    const root = document.documentElement;
    if (started && !showEpilogue) root.dataset.sequence = "playing";
    else delete root.dataset.sequence;
    return () => {
      delete root.dataset.sequence;
    };
  }, [started, showEpilogue]);

  useEffect(() => {
    if (!started) setShowEpilogue(false);
  }, [started]);

  // Let App swap the ActionBar to its epilogue form (Start over + wallet).
  useEffect(() => {
    onEpilogueChange(showEpilogue);
  }, [showEpilogue, onEpilogueChange]);

  // The live card is only mounted while it can be seen. From `inserting` on it
  // is behind two folded paper panels and the envelope body.
  //
  // At true rest (before the arrow) the card is a standalone hero OUTSIDE the
  // sheet — the sheet fades in from opacity 0 and a child can't out-fade a
  // faded ancestor, so an in-sheet card would be invisible on step entry. Once
  // the sequence has started it lives on the sheet's mid panel, so the fold can
  // cover it; the two crossfade at the sheet beat.
  // Rest card stays mounted through the sheet-beat crossfade (phase is still
  // "rest" for ~0.6s after start) so it fades out rather than vanishing; by
  // "folding" its opacity has reached 0 and it can unmount.
  const restCardVisible = phase === "rest";
  const sheetCardVisible = started && (phase === "rest" || phase === "folding");

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
          {/* Standalone hero at rest — full opacity, outside the fading sheet.
              Carries the shared layoutId so it IS the card that flew in from
              the customize deck (no crossfade). Sized directly to --slide-w
              (the deck's hero width) rather than via `scale`, so its layout
              box matches the deck card's box and the flight is a clean
              translate, not a translate-plus-resize. The Card is width-driven
              (container query), so no scale transform is needed. */}
          {restCardVisible && (
            <motion.div
              className="card-holder card-holder--rest"
              layoutId={CARD_HERO_LAYOUT_ID}
              transition={cardHeroLayout}
              style={{ opacity: values.restCardOpacity }}
            >
              <Card config={config} name={name} />
            </motion.div>
          )}

          <CarrierSheet v={values}>
            {sheetCardVisible && (
              <motion.div
                className="card-holder"
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
        {showEpilogue && <Epilogue key="epilogue" walletAdded={walletAdded} />}
      </AnimatePresence>
    </div>
  );
}
