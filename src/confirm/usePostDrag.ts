import { useCallback, useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  type PanInfo,
} from "motion/react";
import { post, snappy } from "../lib/motionConfig";
import {
  DRAG_TOP_GIVE,
  POST_COMMIT_MM,
  POST_FLICK_MM,
  POST_FLICK_VELOCITY,
  POST_TRAVEL,
} from "./geometry";
import type { Phase, SequenceValues } from "./useWrapSequence";

/**
 * Drag-to-post (PRD-CONFIRM.md §6).
 *
 * PLAN.md §8 marks the magnetic assist as never-cut and PLAN.md Phase F sets the
 * rule: it must be impossible to fail. Release past halfway commits; so does any
 * downward flick from almost anywhere.
 */
export function usePostDrag({
  v,
  mmPx,
  phase,
  setPhase,
  onPosted,
}: {
  v: SequenceValues;
  mmPx: number;
  phase: Phase;
  setPhase: (p: Phase) => void;
  onPosted: () => void;
}) {
  const dragScale = useMotionValue(1);
  // The 450ms post-completion timer must not fire into an unmounted tree.
  const postTimer = useRef(0);
  useEffect(() => () => clearTimeout(postTimer.current), []);

  // Small velocity-derived tilt. The difference between dragging an object and
  // dragging a div.
  const velocity = useVelocity(v.envY);
  const rawTilt = useTransform(velocity, [-800, 800], [2, -2], { clamp: true });
  const dragTilt = useSpring(rawTilt, snappy);

  // No fade on the way in: .slot-plate is an OPAQUE mask (z-index 5, the stage
  // colour, extending well below the lip) and the envelope sits under it at
  // z-index 2, so it is genuinely occluded as it descends. Fading it as well
  // made a solid object turn to vapour before the slot had swallowed it —
  // paper going into a letterbox doesn't dissolve, it goes behind the lip.
  // Kept as a constant 1 so Envelope's opacity/shadow maths is untouched.
  const vanish = useMotionValue(1);

  const runPost = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("posting");
    animate(v.envY, POST_TRAVEL * mmPx, post);
    animate(dragScale, 0.97, post);
    animate(v.hintOpacity, 0, { duration: 0.15 });
    // No slot "swallow" flex — the envelope sinks straight in without the box
    // squeezing around it.
    postTimer.current = window.setTimeout(onPosted, 450);
  }, [phase, setPhase, v, mmPx, dragScale, onPosted]);

  // The hint stays put through a drag: picking the envelope up and putting it
  // back down doesn't teach you anything, so the affordance has to survive it.
  // It only leaves on an actual post (runPost fades it as the envelope goes).
  const onDragStart = useCallback(() => {
    // The idle tug may still be running on envY; stop it or Motion's drag and
    // the keyframe animation both write the same value and the envelope jitters.
    v.envY.stop();
    animate(dragScale, 1.03, snappy);
  }, [v.envY, dragScale]);

  const onDragEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      const y = info.offset.y;
      const commit =
        y > POST_COMMIT_MM * mmPx ||
        (info.velocity.y > POST_FLICK_VELOCITY && y > POST_FLICK_MM * mmPx);
      if (commit) {
        runPost();
        return;
      }
      animate(dragScale, 1, snappy);
      animate(v.envY, 0, snappy);
    },
    [mmPx, runPost, dragScale, v.envY],
  );

  const dragProps =
    phase === "idle"
      ? {
          drag: "y" as const,
          dragConstraints: {
            top: -DRAG_TOP_GIVE * mmPx,
            bottom: POST_TRAVEL * mmPx,
          },
          dragElastic: 0.15,
          dragMomentum: false,
          onDragStart,
          onDragEnd,
        }
      : {};

  return { dragProps, dragScale, dragTilt, vanish, runPost };
}
