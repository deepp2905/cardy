import type { KeyboardEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
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
  const shadowOpacity = useTransform(
    [v.shadowOpacity, v.envOpacity, vanish],
    ([s, a, b]: number[]) => s * a * b,
  );

  // Depth of the flap layer, switched at the halfway point of its swing.
  // Past -90° it is still folded back behind the envelope's mouth, so it sits
  // under the packet (0). Once it swings inside that plane it belongs on top
  // of the pocket (3, above .envelope's 2), which is where a closed flap lives.
  // A hard switch, not a ramp: z-index is discrete anyway, and -90° is exactly
  // edge-on, so the change lands on the frame where the flap has no visible
  // area to pop.
  const flapZ = useTransform(v.flapRot, (r) => (r < -90 ? 0 : 3));

  // Which face of the flap we're looking at. Past -90° it is folded back and
  // we see its INSIDE (the darker liner); from -90° to 0° we see the outside,
  // which is just the front of a closed envelope and should match the pocket.
  const flapInner = useTransform(v.flapRot, (r) => (r < -90 ? 1 : 0));

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
        {/* Back: the pocket. Visible from the fold through the seal. The flap
            is NOT here — it renders as a sibling of .envelope below, so the
            packet can pass between the two. */}
        <motion.div
          className="env-face env-face--back"
          style={{ opacity: v.envBackOpacity }}
        >
          <div className="env-body">
            <div className="env-mouth" />
          </div>
        </motion.div>

        {/* Front: the address side, pre-mirrored so it reads correctly at 180°. */}
        <motion.div
          className="env-face env-face--front"
          style={{ opacity: v.envFrontOpacity }}
        >
          <span className="env-for">For {firstName}</span>
        </motion.div>
      </motion.div>

      {/* The flap, rendered OUTSIDE .envelope so it shares a stacking context
          with the packet. That is the whole point: while it hangs open the
          packet (.sheet, z-index 1) sits ABOVE the flap and BELOW the envelope
          body (2), which is what reads as paper sliding down into the mouth.
          Nested inside .envelope it could only ever be above or below the
          ENTIRE packet, never between the envelope's own two layers.

          It is ONE element for both states — the same triangle rotates from
          -165° (open, lying back behind the paper) to 0° (closed, lying on the
          front of the pocket). So its depth has to change with it: a flap that
          stayed behind would close BEHIND the envelope. zLayer flips as it
          passes vertical, which is the moment a real flap crosses the plane of
          the envelope mouth. Carries the same y/flip transforms as the envelope
          so it travels with it. */}
      <motion.div
        className="env-flap-layer"
        style={{
          opacity,
          y: v.envY,
          rotateY: v.flipRot,
          scale: dragScale,
          rotate: dragTilt,
          zIndex: flapZ,
        }}
        aria-hidden="true"
      >
        <motion.div
          className="env-flap"
          style={{ rotateX: v.flapRot, opacity: v.envBackOpacity }}
        >
          {/* The INSIDE of the flap (what you see while it hangs open, folded
              back toward the viewer) is a darker liner — it's the underside of
              the paper, in shadow from the envelope's own mouth. The OUTSIDE
              (closed, at 0°) is plain kraft that matches the pocket, because
              at that point it is simply the front of the envelope.

              Swapped on a threshold rather than by backface-visibility, which
              is the same call the fold panels make (§5.1) — it is the least
              reliable thing in Safari's 3D. */}
          <motion.div
            className="env-flap-face env-flap-face--inner"
            style={{ opacity: flapInner }}
          />
          <motion.div className="panel-shade" style={{ opacity: v.flapShade }} />
        </motion.div>
      </motion.div>
    </>
  );
}
