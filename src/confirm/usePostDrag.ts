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
  ENVELOPE,
  POST_COMMIT_MM,
  POST_FLICK_MM,
  POST_FLICK_VELOCITY,
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

  // Flipped by runPost, i.e. on release. Everything that dismantles the scene
  // (the hint fade, the slot close) reads this so it can't start mid-drag: the
  // gesture is reversible until the user lets go.
  const committed = useMotionValue(0);

  // Chevron fade, driven by POSITION rather than by the post trigger: it holds
  // while the envelope is still travelling toward the slot it points at, and
  // clears over the stretch where the paper is disappearing behind the lip.
  // Starts once the envelope's top edge reaches the mouth, done by the time it
  // is fully swallowed. Multiplied into the sequence's own hintOpacity in
  // Confirm, so the arrival fade-in still owns the other direction.
  // Position-driven like the slot close, and gated the same way: a drag that
  // goes deep and comes back keeps its arrow, because nothing was committed.
  const hintFadeStart = SLOT_MOUTH * mmPx;
  const hintFadeEnd = (SLOT_MOUTH + ENVELOPE.h / 2) * mmPx;
  const hintFade = useTransform(
    [v.envY, committed] as const,
    ([y, go]: number[]) => {
      if (!go) return 1;
      const t = (y - hintFadeStart) / (hintFadeEnd - hintFadeStart);
      return 1 - Math.min(Math.max(t, 0), 1);
    },
  );

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
  const slotClose = useTransform(
    [v.envY, committed] as const,
    ([y, go]: number[]) => {
      if (!go) return 1;
      const t = (y - closeStart) / (closeEnd - closeStart);
      return 1 - Math.min(Math.max(t, 0), 1) * 0.96;
    },
  );
  const slotFade = useTransform(
    [v.envY, committed] as const,
    ([y, go]: number[]) => {
      if (!go) return 1;
      // Holds through the first half of the close, then fades out.
      const mid = (closeStart + closeEnd) / 2;
      if (y <= mid) return 1;
      const t = (y - mid) / (closeEnd - mid);
      return 1 - Math.min(Math.max(t, 0), 1);
    },
  );

  const runPost = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("posting");
    // Release (or Enter, or the reduced-motion button) is what commits: only
    // now may the slot start closing behind the envelope.
    committed.set(1);
    animate(v.envY, POST_TRAVEL * mmPx, post);
    animate(dragScale, 0.97, post);
    // The hint is NOT faded here. It fades when the envelope has actually gone
    // in (see hintFade below) — dismissing it the moment the post is triggered
    // took the arrow away while the paper was still visibly travelling toward
    // the slot it was pointing at.
    postTimer.current = window.setTimeout(onPosted, 450);
  }, [phase, setPhase, v, mmPx, dragScale, onPosted, committed]);

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
