import type { KeyboardEvent } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { FLAP_PARK_MM, SLOT_MOUTH } from "./geometry";
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

  // Clip at the slot's mouth, so ONLY the envelope is masked — nothing else in
  // the scene is touched and there is no opaque plate to keep in sync with the
  // stage colour.
  //
  // The clip lives on a WRAPPER, not on .envelope itself. clip-path forces a
  // new stacking context, which flattens transform-style: preserve-3d — and
  // .envelope is preserve-3d carrying the rotateY flip, so clipping it
  // collapses the two faces out of 3D space. A plain wrapper above it has no
  // 3D to lose, so the mask works and the flip survives.
  //
  // The wrapper does NOT move (the envelope's y lives inside it), so the cut
  // line is fixed in stage space: a constant inset from the wrapper's own top.
  // The wrapper is stage-sized, so that inset is measured from the stage top,
  // which is 50% + SLOT_MOUTH.
  const envClip = `inset(0 0 calc(50% - ${SLOT_MOUTH} * var(--mm)) 0)`;

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

  // The hinge's vertical offset: flapLift 1 = parked at the envelope's corner
  // radius (so the flap's square corners don't overhang the body's rounded ones
  // while it lies open), 0 = flush with the top edge. Expressed as a calc() in
  // --mm rather than resolved px, so it tracks the stage scale without this
  // component needing to know it.
  const flapOffset = useTransform(
    v.flapLift,
    (lift) => `calc(${lift * FLAP_PARK_MM} * var(--mm))`,
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPost();
    }
  };

  return (
    <>
      {/* Clipping wrapper. Holds the envelope and its ground shadow, and cuts
          everything below the slot's mouth. See envClip above for why the clip
          cannot live on .envelope itself. The flap layer stays OUTSIDE this
          wrapper: it needs to interleave with the packet by z-index, and a
          clip-path here would trap it in this stacking context. */}
      <div className="env-clip" style={{ clipPath: envClip }}>
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
              is NOT here — it renders as a sibling below, so the packet can
              pass between the two. */}
          <motion.div
            className="env-face env-face--back"
            style={{ opacity: v.envBackOpacity }}
          >
            <div className="env-body">
              <div className="env-mouth" />
            </div>
          </motion.div>

          {/* Front: the address side, pre-mirrored so it reads right at 180°. */}
          <motion.div
            className="env-face env-face--front"
            style={{ opacity: v.envFrontOpacity }}
          >
            <span className="env-for">For {firstName}</span>
          </motion.div>
        </motion.div>
      </div>

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
          style={{
            rotateX: v.flapRot,
            opacity: v.envBackOpacity,
            // Slides the hinge from its parked 1.5mm offset up to the envelope's
            // top edge as the flap closes, so it lands flush rather than a
            // corner-radius low. y (not top) so it stays on the compositor.
            y: flapOffset,
          }}
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
