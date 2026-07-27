import { motion, useTransform, type MotionValue } from "motion/react";
import type { SequenceValues } from "./useWrapSequence";

/**
 * The drop slot (PRD-CONFIRM.md §6.4).
 *
 * Not a hole — a *plate*. Safari won't clip a 3D-transformed child via
 * `overflow: hidden` on a `preserve-3d` ancestor, so nothing here clips.
 *
 * The slot is drawn as TWO halves so the envelope can pass between them:
 *
 *   .slot-half--back   z-index 1  — behind the envelope. Its bottom half of
 *                                   the aperture, so paper descending into
 *                                   the slot is drawn OVER it and reads as
 *                                   being inside the box.
 *   (the envelope)     z-index 2
 *   .slot-half--front  z-index 6  — in front, carrying the opaque plate that
 *                                   hides everything below the lip. This is
 *                                   what actually swallows the envelope.
 *
 * The seam sits at the aperture's vertical MIDDLE, not its top: masking from
 * the top edge made the envelope look like it was entering halfway down the
 * hole. Each half owns the corner radii on its own outer edge and none on the
 * seam, so the two read as one continuous rounded aperture.
 */
export function MailSlot({
  v,
  close,
  fade,
}: {
  v: SequenceValues;
  /** 1 while open, → 0 as the mouth narrows shut once the envelope is in. */
  close: MotionValue<number>;
  /** Fades the whole slot away after it has closed. */
  fade: MotionValue<number>;
}) {
  // The arrival scaleX (sequence) and the closing scaleX (post) are two
  // different animations on one axis, so they multiply rather than fight.
  const scaleX = useTransform(
    [v.slotScaleX, close] as const,
    ([arrive, shut]: number[]) => arrive * shut,
  );
  const opacity = useTransform(
    [v.slotOpacity, fade] as const,
    ([arrive, out]: number[]) => arrive * out,
  );

  return (
    <>
      {/* Back half — below the envelope, so the envelope covers it on entry. */}
      <motion.div
        className="slot-layer slot-layer--back"
        style={{ opacity }}
        aria-hidden="true"
      >
        {/* Back half carries no plate, so it can fade wholesale. */}
        <div className="slot-anchor">
          <motion.div
            className="slot-rect slot-rect--back"
            // x:-50% centres the rect; it MUST live in the motion transform,
            // not in CSS. Motion writes scaleX/scaleY straight to `transform`,
            // which would otherwise clobber a CSS `translateX(-50%)` and shove
            // the rect half its width to the right.
            style={{ x: "-50%", scaleX, scaleY: v.slotSwallow }}
          />
        </div>
      </motion.div>

      {/* Front half — above the envelope, so the lip covers paper on the way
          in. No masking plate here any more: the envelope clips ITSELF at the
          mouth (see Envelope.tsx), which hides only the envelope instead of
          painting an opaque rectangle over everything below the line. */}
      <motion.div
        className="slot-layer slot-layer--front"
        style={{ opacity }}
        aria-hidden="true"
      >
        <div className="slot-anchor">
          <motion.div
            className="slot-rect slot-rect--front"
            style={{ x: "-50%", scaleX, scaleY: v.slotSwallow }}
          />
        </div>
      </motion.div>
    </>
  );
}
