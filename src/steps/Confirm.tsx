import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type MotionValue } from "motion/react";
import { Card } from "../card/Card";
import { type CardConfig } from "../card/cardConfig";
import { HeroSlot } from "../card/HeroSlot";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { CarrierSheet } from "../confirm/CarrierSheet";
import { Envelope } from "../confirm/Envelope";
import { Epilogue } from "../confirm/Epilogue";
import { MailSlot } from "../confirm/MailSlot";
import { PostHint } from "../confirm/PostHint";
import { PostLoading } from "../confirm/PostLoading";
import { usePostDrag } from "../confirm/usePostDrag";
import { useStageScale } from "../confirm/useStageScale";
import { useSlideW } from "../lib/useSlideW";
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
 * `inserting` and never rotates while visible — no snapshot library needed.
 */
export function Confirm({
  config,
  name,
  firstName,
  started,
  walletAdded,
  restOpacity,
  onEpilogueChange,
  onHeroSlot,
}: {
  config: CardConfig;
  name: string;
  firstName: string;
  started: boolean;
  /** App owns the wallet CTA (it lives in the ActionBar now); this is its state. */
  walletAdded: boolean;
  /** The persistent hero's rest opacity — the wrap sequence drives it so the
   *  hero hands off to the in-sheet card. Owned by App, lives across steps. */
  restOpacity: MotionValue<number>;
  /** Report epilogue visibility up so App can swap the ActionBar to it. */
  onEpilogueChange: (shown: boolean) => void;
  /** Report the rest-card centre so the persistent hero sits exactly on it. */
  onHeroSlot: (owner: "deck" | "rest", point: { x: number; y: number }) => void;
}) {
  const reduce = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mmPx = useStageScale(stageRef);
  // Resolved --slide-w. The old inline parseFloat read the UNRESOLVED token
  // stream ("min(372px, 88dvw)") and silently stayed at 372 on phones; the
  // hook measures a probe so the min() actually resolves.
  const slideW = useSlideW();
  const [showEpilogue, setShowEpilogue] = useState(false);
  // Between the envelope sinking into the slot and the epilogue: a short
  // "making it" beat (the user's own shape spinning — see PostLoading). Also
  // papers over the scene teardown so the epilogue arrives as a clean fade.
  const [showLoading, setShowLoading] = useState(false);

  const { phase, setPhase, values } = useWrapSequence({
    mmPx,
    slideW,
    started,
    reduce,
    restOpacity,
  });

  const {
    dragProps,
    dragScale,
    dragTilt,
    vanish,
    hintFade,
    slotClose,
    slotFade,
    runPost,
  } = usePostDrag({
    v: values,
    mmPx,
    phase,
    setPhase,
    onPosted: () => {
      setPhase("done");
      setShowLoading(true);
    },
  });

  // Hold the loading beat, then hand over to the epilogue.
  useEffect(() => {
    if (!showLoading) return;
    const t = window.setTimeout(() => {
      setShowLoading(false);
      setShowEpilogue(true);
    }, 3600);
    return () => clearTimeout(t);
  }, [showLoading]);

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
    if (!started) {
      setShowEpilogue(false);
      setShowLoading(false);
    }
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

  const status = showEpilogue
    ? "Posted. Your card arrives in about 7 days."
    : showLoading
      ? "Creating your card."
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

      {!showEpilogue && !showLoading && (
        <motion.div className="wrap-scene" style={{ y: values.nudgeY }}>
          {/* The at-rest card is the PERSISTENT hero (mounted in App), not a
              local node — so there is no hand-off and nothing to measure across
              the customize->confirm swap. This invisible slot only reports where
              the hero should sit; the hero springs its transform to it. Its
              opacity is driven by the wrap sequence via the shared restOpacity
              MotionValue, which crossfades it to the in-sheet card. */}
          {restCardVisible && (
            <HeroSlot
              className="card-holder--rest"
              owner="rest"
              onMeasure={onHeroSlot}
            />
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

          <MailSlot v={values} close={slotClose} fade={slotFade} />
          {(phase === "idle" || phase === "posting") && (
            <PostHint
              v={values}
              reduce={reduce}
              onMail={runPost}
              fade={hintFade}
            />
          )}
        </motion.div>
      )}

      {/* mode="wait": the loading beat fades fully out before the epilogue
          fades in — one thing on stage at a time. */}
      <AnimatePresence mode="wait">
        {showLoading && (
          <PostLoading
            key="loading"
            shape={config.shape}
            filled={config.filled}
            reduce={reduce}
          />
        )}
        {showEpilogue && <Epilogue key="epilogue" walletAdded={walletAdded} />}
      </AnimatePresence>
    </div>
  );
}
