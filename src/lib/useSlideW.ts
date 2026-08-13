import { useEffect, useSyncExternalStore } from "react";

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
 *
 * The probe and the resize listener are MODULE-level, shared by every caller.
 * The hook used to build its own probe per component, so the carousel, the
 * confirm stage and the sequence playground each ran a separate element and a
 * separate listener to compute a number that is identical by definition — which
 * is the opposite of the "one source of truth" this file exists to provide.
 */

const DEFAULT_SLIDE_W = 372;

let probe: HTMLDivElement | null = null;
let current = DEFAULT_SLIDE_W;
const listeners = new Set<() => void>();

function read() {
  if (!probe) return;
  const px = probe.getBoundingClientRect().width;
  // A zero width means layout hasn't resolved yet; keep the last good value.
  if (px > 0 && px !== current) {
    current = px;
    listeners.forEach((l) => l());
  }
}

function subscribe(onChange: () => void): () => void {
  if (listeners.size === 0) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;top:-9999px;left:0;visibility:hidden;pointer-events:none;width:var(--slide-w,372px);";
    document.body.appendChild(probe);
    read();
    // --slide-w only varies with the viewport, so resize is the one signal.
    window.addEventListener("resize", read);
  }
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener("resize", read);
      probe?.remove();
      probe = null;
    }
  };
}

const getSnapshot = () => current;
// The probe is a DOM measurement, so on the server there is nothing to read.
const getServerSnapshot = () => DEFAULT_SLIDE_W;

export function useSlideW(): number {
  // The probe is appended during subscribe (commit time), so the first snapshot
  // can still be the default even where layout could already resolve it. One
  // post-mount read settles it — read() notifies through the same listener set,
  // so no extra local state is needed to surface the correction.
  useEffect(read, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
