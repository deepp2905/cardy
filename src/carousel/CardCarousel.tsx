import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, type MotionValue } from "motion/react";
import { Card } from "../card/Card";
import type { CardConfig } from "../card/cardConfig";
import { PALETTE } from "../card/cardConfig";
import {
  CAROUSEL_SCALE_MAX,
  CAROUSEL_SCALE_MIN,
} from "../lib/motionConfig";
import { mapRangeEased } from "../lib/mapRange";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./carousel.css";

// Scroll-snap strip; the slide nearest the container centre is active.
// Every card is fully opaque and unblurred — only size conveys focus, and it
// does so continuously: scale is mapped from each slide's distance to the
// centre, so cards grow as they approach rather than popping at the handoff.
type CardCarouselProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  cardName: string;
  onActiveChange: (id: string) => void;
};

export function CardCarousel({
  configs,
  ids,
  activeId,
  cardName,
  onActiveChange,
}: CardCarouselProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  // Overscroll bounce is left to the platform: a custom one runs on top of
  // native elastic scrolling rather than replacing it, and the two fight.
  // One motion value per slide, written straight from the scroll handler.
  // Driving scale through React state would re-render all 8 cards (each with
  // a shader canvas and an SVG) on every scroll frame. Slides register their
  // own value here on mount (hooks can't run in a loop).
  const scales = useRef<Record<string, MotionValue<number>>>({});
  const register = useCallback((id: string, value: MotionValue<number>) => {
    scales.current[id] = value;
  }, []);

  const applyScales = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || reduce) return;
    const centre = strip.scrollLeft + strip.clientWidth / 2;
    for (const el of strip.querySelectorAll<HTMLElement>("[data-slide]")) {
      const value = scales.current[el.dataset.slide!];
      if (!value) continue;
      const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - centre);
      // Full size dead-centre, easing down to the minimum one slide out.
      // Ease-out front-loads the change near the centre, so arriving at the
      // middle reads as a snap into focus rather than a constant drift.
      value.set(
        mapRangeEased(
          dist,
          0,
          el.clientWidth,
          CAROUSEL_SCALE_MAX,
          CAROUSEL_SCALE_MIN,
        ),
      );
    }
  }, [reduce]);

  const centerSlide = (id: string, smooth = true) => {
    const strip = stripRef.current;
    const slide = strip?.querySelector<HTMLElement>(`[data-slide="${id}"]`);
    if (!strip || !slide) return;
    const left =
      slide.offsetLeft - (strip.clientWidth - slide.clientWidth) / 2;
    strip.scrollTo({ left, behavior: smooth ? "smooth" : "instant" });
  };

  // Start centered on the initial active card, then seed the scales so the
  // first paint already shows the centre card at full size.
  useEffect(() => {
    centerSlide(activeId, false);
    applyScales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-measure on resize: slide widths and the centre both move.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new ResizeObserver(applyScales);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [applyScales]);

  const handleScroll = () => {
    const strip = stripRef.current;
    if (!strip) return;
    applyScales();
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
          <Slide
            key={id}
            id={id}
            label={PALETTE[i]?.name ?? id}
            isActive={isActive}
            reduce={reduce}
            register={register}
            onSelect={() => {
              if (!isActive) centerSlide(id);
            }}
          >
            <Card config={configs[id]} name={cardName} />
          </Slide>
        );
      })}
    </div>
  );
}

// One slide. Owns its own scale motion value and hands it to the strip, which
// writes to it directly during scroll — no re-render per frame.
function Slide({
  id,
  label,
  isActive,
  reduce,
  register,
  onSelect,
  children,
}: {
  id: string;
  label: string;
  isActive: boolean;
  reduce: boolean;
  register: (id: string, value: MotionValue<number>) => void;
  onSelect: () => void;
  children: ReactNode;
}) {
  const scale = useMotionValue(CAROUSEL_SCALE_MIN);
  useEffect(() => {
    register(id, scale);
  }, [id, scale, register]);

  return (
    <div
      data-slide={id}
      className="carousel-slide"
      role="radio"
      aria-checked={isActive}
      aria-label={label}
      onClick={onSelect}
    >
      {/* Scale only — full opacity, no blur, no desaturation. */}
      <motion.div
        className="carousel-card"
        style={reduce ? undefined : { scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}
