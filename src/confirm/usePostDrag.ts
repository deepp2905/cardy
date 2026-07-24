import { useCallback, useRef } from "react";
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
  const hintDismissed = useRef(false);

  // Small velocity-derived tilt. The difference between dragging an object and
  // dragging a div.
  const velocity = useVelocity(v.envY);
  const rawTilt = useTransform(velocity, [-800, 800], [2, -2], { clamp: true });
  const dragTilt = useSpring(rawTilt, snappy);

  // Insurance against a seam at the plate edge: the last 20mm of travel fades.
  const vanish = useTransform(
    v.envY,
    [(POST_TRAVEL - 20) * mmPx, POST_TRAVEL * mmPx],
    [1, 0],
    { clamp: true },
  );

  const runPost = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("posting");
    animate(v.envY, POST_TRAVEL * mmPx, post);
    animate(dragScale, 0.97, post);
    animate(v.hintOpacity, 0, { duration: 0.15 });
    window.setTimeout(() => {
      v.slotSwallow.set(0.86);
      animate(v.slotSwallow, 1, snappy);
    }, 150);
    window.setTimeout(onPosted, 450);
  }, [phase, setPhase, v, mmPx, dragScale, onPosted]);

  const onDragStart = useCallback(() => {
    if (!hintDismissed.current) {
      hintDismissed.current = true;
      animate(v.hintOpacity, 0, { duration: 0.2 });
    }
    animate(dragScale, 1.03, snappy);
  }, [v.hintOpacity, dragScale]);

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
