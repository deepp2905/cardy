import { useEffect, type RefObject } from "react";

// Click-and-drag scrolling for the sketch layouts. A native scroller only
// responds to the wheel or a touch drag; on desktop these ideas are meant to
// be felt, so the pointer drags the scroll position directly.

export function useDragScroll(
  ref: RefObject<HTMLElement | null>,
  axis: "x" | "y" = "x",
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let start = 0;
    let startScroll = 0;

    const down = (e: PointerEvent) => {
      // Ignore anything that isn't a primary mouse/pen press; touch already
      // scrolls natively and capturing it would fight the platform.
      if (e.pointerType === "touch" || e.button !== 0) return;
      dragging = true;
      start = axis === "x" ? e.clientX : e.clientY;
      startScroll = axis === "x" ? el.scrollLeft : el.scrollTop;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = (axis === "x" ? e.clientX : e.clientY) - start;
      if (axis === "x") el.scrollLeft = startScroll - delta;
      else el.scrollTop = startScroll - delta;
    };

    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      el.style.cursor = "";
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [ref, axis]);
}
