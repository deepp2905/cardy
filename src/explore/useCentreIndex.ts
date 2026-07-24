import { useEffect, useRef, useState } from "react";

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
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const mid =
          axis === "x"
            ? slide.offsetLeft + slide.clientWidth / 2
            : slide.offsetTop + slide.clientHeight / 2;
        const d = Math.abs(mid - centre);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
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
