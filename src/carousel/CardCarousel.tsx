import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Card } from "../card/Card";
import type { CardConfig } from "../card/cardConfig";
import { PALETTE } from "../card/cardConfig";
import { card as cardSpring } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./carousel.css";

// Scroll-snap strip; the slide nearest the container center is active.
// Neighbors recede (scale/blur/opacity) — opacity-only under reduced motion.
type CardCarouselProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  onActiveChange: (id: string) => void;
};

export function CardCarousel({
  configs,
  ids,
  activeId,
  onActiveChange,
}: CardCarouselProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();

  const centerSlide = (id: string, smooth = true) => {
    const strip = stripRef.current;
    const slide = strip?.querySelector<HTMLElement>(`[data-slide="${id}"]`);
    if (!strip || !slide) return;
    const left =
      slide.offsetLeft - (strip.clientWidth - slide.clientWidth) / 2;
    strip.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  };

  // Start centered on the initial active card.
  useEffect(() => {
    centerSlide(activeId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const center = strip.scrollLeft + strip.clientWidth / 2;
    let best = activeId;
    let bestDist = Infinity;
    for (const el of strip.querySelectorAll<HTMLElement>("[data-slide]")) {
      const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = el.dataset.slide!;
      }
    }
    if (best !== activeId) onActiveChange(best);
  };

  const step = (dir: -1 | 1) => {
    const next = ids[ids.indexOf(activeId) + dir];
    if (next) centerSlide(next);
  };

  return (
    <div
      className="carousel"
      ref={stripRef}
      onScroll={handleScroll}
      tabIndex={0}
      role="radiogroup"
      aria-label="Choose a card color"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
      }}
    >
      {ids.map((id, i) => {
        const isActive = id === activeId;
        return (
          <div
            key={id}
            data-slide={id}
            className="carousel-slide"
            role="radio"
            aria-checked={isActive}
            aria-label={PALETTE[i]?.name ?? id}
            onClick={() => {
              if (!isActive) centerSlide(id);
            }}
          >
            <motion.div
              className="carousel-card"
              animate={{
                scale: reduce ? 1 : isActive ? 1 : 0.86,
                opacity: isActive ? 1 : 0.55,
                filter:
                  reduce || isActive
                    ? "blur(0px) saturate(1)"
                    : "blur(1.5px) saturate(0.85)",
              }}
              transition={cardSpring}
            >
              <Card config={configs[id]} />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
