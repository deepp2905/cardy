import { motion } from "motion/react";
import type { SequenceValues } from "./useWrapSequence";

/**
 * The drop slot (PRD-CONFIRM.md §6.4).
 *
 * Not a hole — a *plate*. Safari won't clip a 3D-transformed child via
 * `overflow: hidden` on a `preserve-3d` ancestor, so nothing here clips. The
 * plate is painted in the stage's own background colour and sits one z-layer
 * above the envelope, so the envelope vanishes exactly at the plate's top edge,
 * which is the slot's lip.
 */
export function MailSlot({ v }: { v: SequenceValues }) {
  return (
    <motion.div
      className="slot-layer"
      style={{ opacity: v.slotOpacity }}
      aria-hidden="true"
    >
      {/* Lip shadow. Above the envelope — it has to fall on the moving object. */}
      <div className="slot-lip" />
      <div className="slot-plate">
        <motion.div
          className="slot-rect"
          style={{ scaleX: v.slotScaleX, scaleY: v.slotSwallow }}
        />
      </div>
    </motion.div>
  );
}
