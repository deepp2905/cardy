import { useEffect, useState } from "react";

/**
 * The resolved card render width — `--slide-w: min(372px, 88dvw)` (index.css)
 * — as a number. One source of truth for every JS consumer: the carousel's
 * footprint math and the confirm stage's rest scale both need the same figure
 * the CSS uses, or the hero and the deck cards end up different sizes and the
 * "one card" illusion pops on settle.
 *
 * Measured via a hidden probe element rather than parsed from the token:
 * getComputedStyle returns an UNREGISTERED custom property as its raw token
 * stream ("min(372px, 88dvw)"), so parseFloat reads NaN and a naive reader
 * silently falls back to the desktop value on phones. Layout resolves the
 * min() for us.
 */
export function useSlideW(): number {
  const [slideW, setSlideW] = useState(372);

  useEffect(() => {
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:-9999px;left:0;visibility:hidden;pointer-events:none;width:var(--slide-w,372px);";
    document.body.appendChild(probe);
    const read = () => {
      const px = probe.getBoundingClientRect().width;
      if (px > 0) setSlideW(px);
    };
    read();
    // --slide-w only varies with the viewport, so resize is the one signal.
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("resize", read);
      probe.remove();
    };
  }, []);

  return slideW;
}
