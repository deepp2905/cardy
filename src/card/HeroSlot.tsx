import { useEffect, useRef } from "react";

/**
 * An invisible, card-sized box a step renders where the persistent HeroCard
 * should sit. It participates in the real flex layout (so the position comes
 * from the actual composition, never a hardcoded offset), measures its own
 * centre relative to the nearest .step-stage, and reports it up. The hero then
 * springs its transform to that point.
 *
 * Only the customize deck and the confirm rest position use this; welcome hides
 * the hero so needs no slot. Measurement is once per mount plus on resize —
 * never per frame.
 */
export function HeroSlot({
  className,
  owner,
  onMeasure,
}: {
  className?: string;
  /** Which step this slot belongs to. App ignores reports whose owner isn't the
   *  active step, so a slot that is mid-unmount during a step swap can't
   *  overwrite the incoming step's target. */
  owner: "deck" | "rest";
  /** Centre of this slot in .step-stage coordinates. */
  onMeasure: (owner: "deck" | "rest", point: { x: number; y: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Report the slot centre in VIEWPORT coordinates. The hero is position:fixed,
    // so it anchors to exactly this point regardless of what column/full-bleed
    // container the slot lives in — there is only one coordinate space, which
    // removes the whole class of "hero centred on the column while the deck is
    // centred on the viewport" misalignment.
    const measure = () => {
      const r = el.getBoundingClientRect();
      // A zero rect means layout hasn't settled yet; skip so a premature 0,0
      // never becomes the target.
      if (r.width === 0) return;
      onMeasure(owner, {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // The slot can move without resizing (step swap, scroll), so also re-measure
    // on the next few frames after mount and on scroll/resize.
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [owner, onMeasure]);

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden="true"
      style={{
        width: "var(--slide-w)",
        // The card's aspect ratio (ISO ID-1: 85.6 x 53.98) so the slot has the
        // card's real height and its centre matches the card's centre.
        aspectRatio: "85.6 / 53.98",
        visibility: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}
