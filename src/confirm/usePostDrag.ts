import { useCallback, useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
  type PanInfo,
} from "motion/react";
import {
  POST_CATCH_PAUSE_MS,
  postCatch,
  postHintDismiss,
  postPull,
  postRecoil,
  snappy,
} from "../lib/motionConfig";
import {
  DRAG_BRAKE_PULL_MM,
  DRAG_BRAKE_ZONE_MM,
  DRAG_TOP_GIVE,
  ENVELOPE,
  POST_CATCH_Y,
  POST_COMMIT_MM,
  POST_FLICK_MM,
  POST_FLICK_VELOCITY,
  POST_RECOIL_MM,
  POST_TRAVEL,
  SLOT_MOUTH,
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
  reduce,
  onPosted,
}: {
  v: SequenceValues;
  mmPx: number;
  phase: Phase;
  setPhase: (p: Phase) => void;
  reduce: boolean;
  onPosted: () => void;
}) {
  const dragScale = useMotionValue(1);
  // The catch pause must not resume the machine sequence into an unmounted tree.
  const postTimer = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(postTimer.current);
    };
  }, []);

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

  // Flipped by runPost, i.e. on release. Everything that dismantles the scene
  // (the hint fade, the slot close) reads this so it can't start mid-drag: the
  // gesture is reversible until the user lets go.
  const committed = useMotionValue(0);

  // The arrow and caption leave as one affordance only after the machine has
  // caught the envelope. Keeping this independent of position means a user can
  // pull into the brake zone and reverse without losing the instruction.
  const hintFade = useMotionValue(1);

  // Slot close-up: once the envelope is in, the aperture narrows to nothing
  // (width only — the halves keep their height, so it reads as the mouth
  // closing rather than the slot shrinking away) and the whole thing fades.
  //
  // Gated on `committed`, NOT on position alone. Dragging the envelope deep and
  // then back up is a legitimate thing to do — the drag is reversible until you
  // let go — and a position-only close started shutting the slot mid-gesture,
  // so the target vanished under a finger that hadn't committed to anything.
  // The gate flips in runPost, i.e. on release (or on the keyboard/button
  // path), after which position drives the rest.
  const closeStart = (SLOT_MOUTH + ENVELOPE.h / 2) * mmPx;
  const closeEnd = POST_TRAVEL * mmPx;
  /** How far past full width the mouth flares before it shuts. */
  const SLOT_ANTICIPATE = 0.06;
  /** Fraction of the close spent on that flare. */
  const SLOT_ANTICIPATE_T = 0.28;
  const slotClose = useTransform(
    [v.envY, committed] as const,
    ([y, go]: number[]) => {
      if (!go) return 1;
      const t = Math.min(Math.max((y - closeStart) / (closeEnd - closeStart), 0), 1);
      // Anticipation: the mouth flares OUTWARD before it closes, the way a
      // thing gathers itself before a move. Without it the aperture just
      // deflates, which reads as it being switched off rather than shutting.
      if (t < SLOT_ANTICIPATE_T) {
        // One half-sine over the flare: 1 -> 1+SLOT_ANTICIPATE -> 1, so it
        // arrives back at full width exactly where the narrowing starts and
        // the two stretches meet without a kink.
        const p = t / SLOT_ANTICIPATE_T;
        return 1 + Math.sin(p * Math.PI) * SLOT_ANTICIPATE;
      }
      // Then narrow all the way to 0 — with the opacity fade gone, anything
      // left over sits on the stage as a visible nub instead of a shut slot.
      const p = (t - SLOT_ANTICIPATE_T) / (1 - SLOT_ANTICIPATE_T);
      // Ease-in so it starts slowly out of the flare and accelerates shut.
      return 1 - p * p;
    },
  );
  // No opacity fade on the close: the aperture narrowing to nothing already
  // reads as the mouth shutting, and fading it at the same time made the slot
  // dissolve rather than close — two different exits fighting each other. Kept
  // as a constant 1 so MailSlot's opacity maths is untouched.
  const slotFade = useMotionValue(1);

  const runPost = useCallback(async (releaseVelocity = 0) => {
    if (phase !== "idle" || committed.get()) return;
    setPhase("posting");
    committed.set(1);
    v.envY.stop();
    dragScale.stop();

    // Reduced motion keeps the same clear completion but skips the spatial
    // pause, recoil, and pull entirely.
    if (reduce) {
      hintFade.jump(0);
      v.envY.jump(POST_TRAVEL * mmPx);
      dragScale.jump(0.97);
      onPosted();
      return;
    }

    const catchY = POST_CATCH_Y * mmPx;
    const brakeStart = (POST_CATCH_Y - DRAG_BRAKE_ZONE_MM) * mmPx;
    // Inside the brake zone the rendered velocity has already fallen toward
    // zero. An early flick still hands its velocity to the catch spring, while
    // a pull that reached the stop lands firmly without overshooting it.
    const catchVelocity = v.envY.get() < brakeStart ? Math.max(0, releaseVelocity) : 0;

    await Promise.all([
      animate(v.envY, catchY, { ...postCatch, velocity: catchVelocity }).finished,
      animate(dragScale, 1, postCatch).finished,
    ]);
    if (!mounted.current) return;

    await animate(hintFade, 0, postHintDismiss).finished;
    if (!mounted.current) return;

    await new Promise<void>((resolve) => {
      postTimer.current = window.setTimeout(resolve, POST_CATCH_PAUSE_MS);
    });
    if (!mounted.current) return;

    // Visible anticipation first, then the under-damped machine pull. The final
    // spring's overshoot is mostly behind the clip, so this explicit recoil is
    // what makes the bounce legible while the envelope is still half exposed.
    await animate(v.envY, (POST_CATCH_Y - POST_RECOIL_MM) * mmPx, postRecoil).finished;
    if (!mounted.current) return;

    await Promise.all([
      animate(v.envY, POST_TRAVEL * mmPx, postPull).finished,
      animate(dragScale, 0.97, postPull).finished,
    ]);
    if (mounted.current) onPosted();
  }, [
    phase,
    committed,
    setPhase,
    v.envY,
    dragScale,
    reduce,
    hintFade,
    mmPx,
    onPosted,
  ]);

  // Motion's pan recognizer tracks raw pointer travel without also writing the
  // element's transform. That separation lets the final 8mm be remapped through
  // a braking curve while the rest of the drag remains exactly 1:1.
  const dragOrigin = useRef(0);

  const onPanSessionStart = useCallback(() => {
    animate(dragScale, 1.03, snappy);
  }, [dragScale]);

  const onPanStart = useCallback(() => {
    // Stop the idle tug at its presentation value, then continue from there.
    v.envY.stop();
    dragOrigin.current = v.envY.get();
  }, [v.envY]);

  const onPan = useCallback(
    (_e: unknown, info: PanInfo) => {
      const top = -DRAG_TOP_GIVE * mmPx;
      const catchY = POST_CATCH_Y * mmPx;
      const brakeZone = DRAG_BRAKE_ZONE_MM * mmPx;
      const brakePull = DRAG_BRAKE_PULL_MM * mmPx;
      const brakeStart = catchY - brakeZone;
      const rawY = Math.max(top, dragOrigin.current + info.offset.y);

      if (rawY <= brakeStart) {
        v.envY.set(rawY);
        return;
      }

      // A quadratic ease-out has a 1:1 slope at entry because brakePull is
      // exactly twice brakeZone, then its slope falls continuously to zero.
      // The pointer travels 16mm while the envelope covers the final 8mm.
      const t = Math.min((rawY - brakeStart) / brakePull, 1);
      v.envY.set(brakeStart + brakeZone * (1 - (1 - t) ** 2));
    },
    [mmPx, v.envY],
  );

  const onPanEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      const y = info.offset.y;
      const commit =
        y > POST_COMMIT_MM * mmPx ||
        (info.velocity.y > POST_FLICK_VELOCITY && y > POST_FLICK_MM * mmPx);
      if (commit) {
        void runPost(info.velocity.y);
        return;
      }
      animate(dragScale, 1, snappy);
      animate(v.envY, 0, snappy);
    },
    [mmPx, runPost, dragScale, v.envY],
  );

  const onPointerRelease = useCallback(() => {
    // Also covers a press that never crossed Motion's pan threshold.
    animate(dragScale, 1, snappy);
  }, [dragScale]);

  const onPointerCancel = useCallback(() => {
    if (committed.get()) return;
    animate(dragScale, 1, snappy);
    animate(v.envY, 0, snappy);
  }, [committed, dragScale, v.envY]);

  const dragProps =
    phase === "idle" && !reduce
      ? {
          onPanSessionStart,
          onPanStart,
          onPan,
          onPanEnd,
          onPointerUp: onPointerRelease,
          onPointerCancel,
        }
      : {};

  return {
    dragProps,
    dragScale,
    dragTilt,
    vanish,
    hintFade,
    slotClose,
    slotFade,
    runPost,
  };
}
