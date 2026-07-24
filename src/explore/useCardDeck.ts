import { useEffect, useRef, useState } from "react";

/** How many mock cards every layout renders. */
export const COUNT = 8;

/**
 * A fractional card index driven directly by drag and wheel — no native
 * scroller underneath.
 *
 * The previous approach used a real scroll container with
 * `scroll-snap-type: mandatory` and set scrollLeft/scrollTop imperatively
 * during a drag. Those cannot coexist: mandatory snap re-snaps to the
 * nearest snap point on every programmatic scroll, so the drag wrote a
 * position and the browser immediately pulled it back. Owning the index
 * outright also removes the offsetLeft/offsetTop measuring, which was
 * fragile once slots started overlapping.
 *
 * `index` is continuous (2.4 = 40% of the way from card 2 to card 3), so
 * layouts interpolate against it and every card responds to the gesture.
 */

const WHEEL_DIVISOR = 220; // wheel px per card
const DRAG_DIVISOR = 190; // pointer px per card

// Settle spring. Damping ratio ~0.9 — under 1 so it feels alive, but high
// enough that it eases into the card without visibly overshooting past it.
// Lower STIFFNESS = slower; lower DAMPING_RATIO = bouncier.
const SETTLE_STIFFNESS = 210;
const SETTLE_DAMPING_RATIO = 0.82;
const REST_DELTA = 0.001; // stop when this close and near-still

// Rubberband past the ends (same asymptote as the app's slider): the raw
// overshoot is squashed so it approaches a ceiling but never reaches it, then
// the release settle springs back to a real card.
const RUBBER_CEILING = 0.85; // most it can travel past the end, in cards
const RUBBER_RESISTANCE = 1.1; // overshoot (in cards) that reaches half the ceiling

/** Fold a value that has run past [0, max] back under resistance. */
function rubberband(v: number, max: number): number {
  const over = v < 0 ? v : v > max ? v - max : 0;
  if (over === 0) return v;
  const pull = Math.abs(over);
  const eased = (pull / (pull + RUBBER_RESISTANCE)) * RUBBER_CEILING;
  return over < 0 ? -eased : max + eased;
}

export function useCardDeck(axis: "x" | "y" = "x", count = COUNT) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Ref mirrors state so handlers read the live value without re-subscribing.
  const value = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const max = count - 1;
    const clamp = (v: number) => Math.min(max, Math.max(0, v));
    // Hard-clamped commit for wheel/keyboard/settle — discrete moves land on
    // real cards, no bounce.
    const commit = (v: number) => {
      value.current = clamp(v);
      setIndex(value.current);
    };
    // Drag commit: resist past the ends so the deck bounces instead of
    // stopping dead, then the release settle springs it back.
    const commitDrag = (v: number) => {
      value.current = rubberband(v, max);
      setIndex(value.current);
    };
    const stopSettle = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    // Spring to the nearest whole card on release — integrated each frame so
    // the motion has real spring character (a slight settle) rather than a
    // fixed-duration tween, without the overshoot of an under-damped bounce.
    const settle = () => {
      stopSettle();
      // Clamp the target: a rubberbanded overshoot (e.g. -0.7) rounds to an
      // index outside the deck, so snap to the real end card instead.
      const to = clamp(Math.round(value.current));
      const damping =
        SETTLE_DAMPING_RATIO * 2 * Math.sqrt(SETTLE_STIFFNESS);
      let velocity = 0;
      let last = performance.now();

      const step = (now: number) => {
        // Clamp dt so a background-tab stall can't fling the spring.
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const x = value.current - to;
        const accel = -SETTLE_STIFFNESS * x - damping * velocity;
        velocity += accel * dt;
        const next = value.current + velocity * dt;

        if (Math.abs(next - to) < REST_DELTA && Math.abs(velocity) < REST_DELTA) {
          commit(to);
          raf.current = null;
          return;
        }
        // Write raw, not clamped: settling from a rubberbanded overshoot
        // (e.g. -0.7 -> 0) passes through the out-of-range region, and
        // clamping would freeze it at the boundary.
        value.current = next;
        setIndex(next);
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      const delta =
        axis === "x"
          ? Math.abs(e.deltaX) > Math.abs(e.deltaY)
            ? e.deltaX
            : e.deltaY
          : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      stopSettle();
      commit(value.current + delta / WHEEL_DIVISOR);
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(settle, 110);
    };
    let wheelIdle: ReturnType<typeof setTimeout>;

    let dragging = false;
    let startPos = 0;
    let startIndex = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      stopSettle();
      startPos = axis === "x" ? e.clientX : e.clientY;
      startIndex = value.current;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = axis === "x" ? e.clientX : e.clientY;
      // Dragging left/up advances the deck, matching scroll direction.
      commitDrag(startIndex - (now - startPos) / DRAG_DIVISOR);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "";
      settle();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const back = axis === "x" ? "ArrowLeft" : "ArrowUp";
      const fwd = axis === "x" ? "ArrowRight" : "ArrowDown";
      if (e.key !== back && e.key !== fwd) return;
      e.preventDefault();
      stopSettle();
      commit(Math.round(value.current) + (e.key === fwd ? 1 : -1));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("keydown", onKeyDown);

    return () => {
      stopSettle();
      clearTimeout(wheelIdle);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [axis, count]);

  /** Nearest whole card — use this for `focused`, never `d === 0`. */
  const focusedIndex = Math.round(index);

  return { ref, index, focusedIndex };
}
