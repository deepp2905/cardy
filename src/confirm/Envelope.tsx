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
        style={{ opacity: v.shadowOpacity, scaleX: v.shadowScaleX, y: v.envY }}
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
