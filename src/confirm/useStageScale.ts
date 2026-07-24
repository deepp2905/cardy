import { useEffect, useState, type RefObject } from "react";
import { SCALE_H_DIVISOR, SCALE_W_DIVISOR } from "./geometry";

/**
 * Pixels-per-millimetre for the confirm stage (PRD-CONFIRM.md §2.2).
 *
 * Measured rather than expressed as a CSS `min()` so the same figure is
 * available to JS — the drag thresholds are specified in mm and need it. One
 * source of truth; the hook writes `--mm` and returns the number.
 */
export function useStageScale(ref: RefObject<HTMLElement | null>): number {
  const [mmPx, setMmPx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      setMmPx(Math.min(w / SCALE_W_DIVISOR, h / SCALE_H_DIVISOR));
    };

    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      measure(box.width, box.height);
    });
    ro.observe(el);
    measure(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, [ref]);

  return mmPx;
}
