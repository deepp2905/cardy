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
const SETTLE_MS = 260;

export function useCardDeck(axis: "x" | "y" = "x", count = COUNT) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Ref mirrors state so handlers read the live value without re-subscribing.
  const value = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = (v: number) => Math.min(count - 1, Math.max(0, v));
    const commit = (v: number) => {
      value.current = clamp(v);
      setIndex(value.current);
    };
    const stopSettle = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    // Ease to the nearest whole card on release. A short tween rather than a
    // spring: overshooting past the last card looks like a bug, not life.
    const settle = () => {
      stopSettle();
      const from = value.current;
      const to = Math.round(from);
      if (from === to) return;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / SETTLE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        commit(from + (to - from) * eased);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else raf.current = null;
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
      commit(startIndex - (now - startPos) / DRAG_DIVISOR);
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
