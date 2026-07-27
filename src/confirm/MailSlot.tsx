import type { CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { SLOT, SLOT_MOUTH } from "./geometry";
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
  // The aperture's width, as a percentage of its full size. The arrival
  // (sequence) and the closing (post) are two animations on one axis, so they
  // multiply rather than fight.
  //
  // WIDTH, not scaleX: scaling an element scales its border-radius too, so a
  // rect squeezed to 4% wide had its horizontal radius squeezed with it and
  // the round ends flattened into slivers as the slot shut. Animating the
  // width leaves the radius at its true px value, so the aperture keeps its
  // pill ends all the way closed. Width animation is not compositor-only, but
  // this is one small element on a beat with nothing else moving.
  //
  // Expressed as a calc() in --mm like every other dimension in this step,
  // rather than a percentage: the anchor is a full-width box, so a percentage
  // would resolve against the stage rather than the slot's own size.
  const width = useTransform(
    [v.slotScaleX, close] as const,
    ([arrive, shut]: number[]) =>
      `calc(${arrive * shut * SLOT.w} * var(--mm))`,
  );
  const opacity = useTransform(
    [v.slotOpacity, fade] as const,
    ([arrive, out]: number[]) => arrive * out,
  );

  // The seam position, handed to CSS from the one constant that defines it.
  // Hardcoding this in the stylesheet let the graphic drift away from the JS
  // clip when SLOT_GAP moved the slot.
  const anchorVars = {
    "--slot-mouth": `calc(${SLOT_MOUTH} * var(--mm))`,
  } as CSSProperties;

  return (
    <>
      {/* Back half — below the envelope, so the envelope covers it on entry. */}
      <motion.div
        className="slot-layer slot-layer--back"
        style={{ opacity }}
        aria-hidden="true"
      >
        {/* Back half carries no plate, so it can fade wholesale. */}
        <div className="slot-anchor" style={anchorVars}>
          <motion.div
            className="slot-rect slot-rect--back"
            // x:-50% centres the rect; it MUST live in the motion transform,
            // not in CSS. Motion writes scaleX/scaleY straight to `transform`,
            // which would otherwise clobber a CSS `translateX(-50%)` and shove
            // the rect half its width to the right.
            style={{ x: "-50%", width, scaleY: v.slotSwallow }}
          />
        </div>
      </motion.div>

      {/* Front half — above the envelope, so the lip covers paper on the way
          in. No masking plate any more: the envelope is clipped at the mouth by
          its own wrapper (.env-clip in Envelope.tsx), which hides exactly one
          element instead of painting an opaque rectangle over everything below
          the line. */}
      <motion.div
        className="slot-layer slot-layer--front"
        style={{ opacity }}
        aria-hidden="true"
      >
        <div className="slot-anchor" style={anchorVars}>
          <motion.div
            className="slot-rect slot-rect--front"
            style={{ x: "-50%", width, scaleY: v.slotSwallow, opacity: fade }}
          />
        </div>
      </motion.div>
    </>
  );
}
