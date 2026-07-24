import { useEffect, useRef, useState } from "react";
import { useDragScroll } from "./useDragScroll";

/** How many mock cards every layout renders. */
export const COUNT = 8;

/**
 * Tracks which slide is nearest the scroller's centre on the given axis.
 * Fractional — layouts interpolate against it so cards respond continuously
 * to the scroll rather than snapping at the handoff.
 */
export function useCentreIndex(axis: "x" | "y" = "x") {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Every sketch is drag-scrollable on desktop, not wheel-only.
  useDragScroll(ref, axis);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      // `:scope` is required for a child combinator here — a bare "> *" is
      // not a valid standalone selector and throws.
      const tagged = el.querySelectorAll<HTMLElement>("[data-slide]");
      const slides = tagged.length
        ? tagged
        : el.querySelectorAll<HTMLElement>(":scope > *");
      if (!slides.length) return;
      const centre =
        axis === "x"
          ? el.scrollLeft + el.clientWidth / 2
          : el.scrollTop + el.clientHeight / 2;
      // Nearest slide, plus how far past it the centre has travelled toward
      // the next one — without that fraction every layout snaps between
      // whole sizes instead of tracking the scroll.
      const mids = Array.from(slides, (slide) =>
        axis === "x"
          ? slide.offsetLeft + slide.clientWidth / 2
          : slide.offsetTop + slide.clientHeight / 2,
      );

      let best = 0;
      let bestDist = Infinity;
      mids.forEach((mid, i) => {
        const d = Math.abs(mid - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });

      const signed = centre - mids[best];
      // Pitch to the neighbour the centre is drifting toward.
      const neighbour = signed >= 0 ? best + 1 : best - 1;
      const pitch =
        mids[neighbour] === undefined
          ? undefined
          : Math.abs(mids[neighbour] - mids[best]);

      setActive(pitch ? best + signed / pitch : best);
    };

    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [axis]);

  return { ref, active };
}
