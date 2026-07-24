import { useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  IMPACT_MIN_VELOCITY,
  IMPACT_VELOCITY_SCALE,
  RUBBERBAND_MAX,
  RUBBERBAND_RESISTANCE,
  rubberband,
} from "../lib/motionConfig";
import { mapRange } from "../lib/mapRange";

// Overscroll bounce for a horizontal scroll container.
//
// Native rubberbanding exists only on iOS/macOS Safari; Android Chrome and
// desktop Windows hard-stop at the ends. This supplies it everywhere by
// translating the strip past its bounds under resistance and springing back.
//
// The resistance is an asymptote, not a clamp: raw pull is squashed to 0..1
// via p/(p+resistance) and mapped onto the allowed travel, so the strip keeps
// responding to the finger however far you drag while never reaching the
// ceiling. A hard cap would go dead the moment it was hit.
//
// Once the scroller is pinned at an end it emits no further scroll events,
// so the overscroll has to be read from the raw wheel/touch input instead.

const EDGE_EPSILON = 1; // sub-pixel scroll positions are common at the ends

type Edge = -1 | 0 | 1; // -1 = at start, 1 = at end, 0 = free

export function useRubberband(
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const offset = useMotionValue(0);
  /** Raw accumulated overscroll — capped only when written to `offset`. */
  const pulled = useRef(0);
  /** In-flight settle, kept so a new pull can cancel it instead of racing. */
  const settling = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const edgeAt = (): Edge => {
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft <= EDGE_EPSILON) return -1;
      if (el.scrollLeft >= max - EDGE_EPSILON) return 1;
      return 0;
    };

    // `delta` is finger/wheel travel: positive = content moves right, i.e.
    // the user is pulling toward the START of the strip.
    const pull = (delta: number) => {
      const edge = edgeAt();
      // Only resist when pushing further past the edge we're already on:
      // pulling right (+) at the start, or pulling left (-) at the end.
      const past = (edge === -1 && delta > 0) || (edge === 1 && delta < 0);
      if (!past) {
        if (pulled.current !== 0) release();
        return false;
      }
      // A new pull cancels any in-flight settle, so the two never fight.
      settling.current?.stop();
      settling.current = null;

      // The accumulator stays RAW; the curve is applied only on the way out.
      // Feeding the shaped value back in would compound a non-linear curve
      // against itself and saturate the pull at a third of its range.
      pulled.current += delta;
      const raw = pulled.current;

      // Asymptote: t approaches 1 but never arrives, so mapping it onto the
      // allowed travel gives a soft ceiling instead of a wall. RESISTANCE is
      // the pull at which t = 0.5, i.e. how stiff the band feels.
      const magnitude = Math.abs(raw);
      const t = magnitude / (magnitude + RUBBERBAND_RESISTANCE);
      offset.set(Math.sign(raw) * mapRange(t, 0, 1, 0, RUBBERBAND_MAX));
      return true;
    };

    const release = () => {
      if (pulled.current === 0) return;
      pulled.current = 0;
      settling.current?.stop();
      settling.current = animate(offset, 0, rubberband);
    };

    // --- Momentum arriving at an edge -------------------------------------
    //
    // Native scroll owns the fling, and a scroller emits no events once it
    // hits a bound — so the only trace of an impact is the velocity the
    // scroller had on the frame BEFORE it stopped. Track that, and when the
    // position pins to an edge, bounce proportionally to it. A fling that had
    // already slowed to nothing produces no visible bounce, which is exactly
    // the "less rubberband if it has already slowed down" behaviour.

    let lastLeft = el.scrollLeft;
    let lastTime = performance.now();
    let velocity = 0; // px per ms, signed
    let wasAtEdge = edgeAt() !== 0;

    const onScrollImpact = () => {
      const now = performance.now();
      const dt = now - lastTime;
      const prevVelocity = velocity;
      if (dt > 0) {
        const dx = el.scrollLeft - lastLeft;
        // Smooth a little: raw per-frame deltas are noisy near the end.
        velocity = 0.7 * (dx / dt) + 0.3 * velocity;
        lastLeft = el.scrollLeft;
        lastTime = now;
      }

      const edge = edgeAt();
      // The frame that lands on the bound is usually a partial step, which
      // understates the impact — measure with the frame before it.
      const impactVelocity =
        Math.abs(prevVelocity) > Math.abs(velocity) ? prevVelocity : velocity;
      // Only fire on the transition into an edge, and only if the user isn't
      // already dragging past it (pull() owns that case).
      if (edge !== 0 && !wasAtEdge && pulled.current === 0) {
        const speed = Math.abs(impactVelocity);
        if (speed > IMPACT_MIN_VELOCITY) {
          const t = speed / (speed + IMPACT_VELOCITY_SCALE);
          const distance = mapRange(t, 0, 1, 0, RUBBERBAND_MAX);
          // Overscrolling right (edge 1) throws the strip left, and vice versa.
          settling.current?.stop();
          offset.set(-edge * distance);
          settling.current = animate(offset, 0, rubberband);
        }
      }
      wasAtEdge = edge !== 0;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      // Wheel has no "release" event, so decay on an idle timer instead.
      if (pull(-delta)) {
        e.preventDefault();
        clearTimeout(wheelIdle);
        wheelIdle = setTimeout(release, 90);
      }
    };
    let wheelIdle: ReturnType<typeof setTimeout>;

    let touchX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
    };
    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].clientX;
      const delta = touchX - x;
      touchX = x;
      if (pull(-delta) && e.cancelable) e.preventDefault();
    };

    el.addEventListener("scroll", onScrollImpact, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", release);
    el.addEventListener("touchcancel", release);

    return () => {
      clearTimeout(wheelIdle);
      settling.current?.stop();
      el.removeEventListener("scroll", onScrollImpact);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", release);
      el.removeEventListener("touchcancel", release);
    };
  }, [ref, enabled, offset]);

  return offset;
}
