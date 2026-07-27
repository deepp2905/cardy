import type { KeyboardEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { ENVELOPE, SLOT_MOUTH } from "./geometry";
import type { SequenceValues } from "./useWrapSequence";

/**
 * Two-face kraft envelope (PRD-CONFIRM.md §3.3, §5.4, §5.5).
 *
 * We look at the BACK the whole time it's being filled — that's where a real
 * envelope's flap and opening are — then flip 180° to the addressed front. So
 * "For {first}" is hidden until the flip, which is the payoff.
 *
 * Faces swap on a MotionValue threshold, never `backface-visibility` (§5.1).
 * The packet isn't clipped either: it's a sibling one z-layer below, so it
 * simply slides behind this element (§5.3).
 */
export function Envelope({
  v,
  firstName,
  interactive,
  mmPx,
  onPost,
  dragProps,
  dragScale,
  dragTilt,
  vanish,
}: {
  v: SequenceValues;
  firstName: string;
  /** True only at `idle` — the envelope becomes the drag/keyboard target. */
  interactive: boolean;
  /** Stage scale, for the slot-mouth clip below. */
  mmPx: number;
  onPost: () => void;
  dragProps: Record<string, unknown>;
  dragScale: MotionValue<number>;
  dragTilt: MotionValue<number>;
  vanish: MotionValue<number>;
}) {
  const opacity = useTransform(
    [v.envOpacity, vanish],
    ([a, b]: number[]) => a * b,
  );

  // The ground shadow is a sibling of the envelope (so the envelope can flip
  // above it without dragging it along), which means it does NOT inherit the
  // envelope's own opacity. Gate it by envOpacity * vanish too, or it shows at
  // rest as a blob with nothing casting it (the envelope is still invisible then).
  //
  // It also gets its own fade at the mouth: it sits BELOW the envelope, so it
  // would cross the line first and sit there as a smudge under a slot that has
  // nothing above it. Clipping it would just cut a hard edge into a soft
  // gradient, so it fades over the last few mm of approach instead.
  const shadowSink = useTransform(
    v.envY,
    [(SLOT_MOUTH - ENVELOPE.h / 2 - 12) * mmPx, (SLOT_MOUTH - ENVELOPE.h / 2) * mmPx],
    [1, 0],
    { clamp: true },
  );
  const shadowOpacity = useTransform(
    [v.shadowOpacity, v.envOpacity, vanish, shadowSink],
    ([s, a, b, sink]: number[]) => s * a * b * sink,
  );

  // Clip the envelope at the slot's mouth, so ONLY the envelope is masked.
  //
  // The old approach painted a full-width opaque plate over everything below
  // the line, which also covered whatever else happened to be down there — in
  // practice the envelope's own bottom edge while it was still above the slot.
  // A clip-path applies to this element alone: nothing else in the scene is
  // touched, and there is no plate to keep in sync with the stage colour.
  //
  // The cut must stay FIXED in stage space while the envelope travels through
  // it, so it's expressed in the envelope's own local coordinates: as envY
  // grows the cut moves up the element by the same amount. Above the mouth the
  // inset is 0 (nothing clipped); once the envelope's bottom edge passes the
  // mouth the inset grows until the whole element is hidden.
  //
  // clip-path (not an ancestor's overflow: hidden) because the envelope is a
  // `preserve-3d` subtree, which Safari will not clip via an ancestor — see
  // MailSlot's docblock. Clipping the element itself is reliable.
  const clip = useTransform(v.envY, (y) => {
    const h = ENVELOPE.h * mmPx;
    // Distance from the element's top edge down to the fixed mouth line.
    const cutFromTop = SLOT_MOUTH * mmPx - (y - h / 2);
    const hidden = Math.min(Math.max(h - cutFromTop, 0), h);
    return `inset(0 0 ${hidden}px 0)`;
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPost();
    }
  };

  return (
    <>
      <motion.div
        className="env-shadow"
        style={{ opacity: shadowOpacity, scaleX: v.shadowScaleX, y: v.envY }}
        aria-hidden="true"
      />
      <motion.div
        className="envelope"
        style={{
          opacity,
          y: v.envY,
          rotateY: v.flipRot,
          scale: dragScale,
          rotate: dragTilt,
          clipPath: clip,
        }}
        {...(interactive
          ? {
              tabIndex: 0,
              role: "button" as const,
              "aria-label": "Post your card",
              onKeyDown,
            }
          : { "aria-hidden": true })}
        {...dragProps}
      >
        {/* Back: body + flap + seal. Visible from the fold through the seal. */}
        <motion.div
          className="env-face env-face--back"
          style={{ opacity: v.envBackOpacity }}
        >
          <div className="env-body">
            <div className="env-mouth" />
          </div>
          <motion.div className="env-flap" style={{ rotateX: v.flapRot }}>
            <motion.div className="panel-shade" style={{ opacity: v.flapShade }} />
          </motion.div>
          <motion.div
            className="env-seal"
            style={{ scale: v.sealScale, rotate: v.sealRot }}
          >
            <span>cardy</span>
          </motion.div>
        </motion.div>

        {/* Front: the address side, pre-mirrored so it reads correctly at 180°. */}
        <motion.div
          className="env-face env-face--front"
          style={{ opacity: v.envFrontOpacity }}
        >
          <span className="env-for">For {firstName}</span>
        </motion.div>
      </motion.div>
    </>
  );
}
