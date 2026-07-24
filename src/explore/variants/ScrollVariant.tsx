import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 1. Horizontal scroll — what the app ships today, for side-by-side comparison.
export function ScrollVariant() {
  const p = useDialKit("Horizontal scroll", {
    cardWidth: [400, 200, 520, 1],
    gap: [0, 0, 120, 1],
    minScale: [0.5, 0.4, 1, 0.01],
    falloff: [5, 0.5, 5, 0.1],
    /** Neighbours dim toward this as they recede. */
    minOpacity: [1, 0.3, 1, 0.05],
    /** Vertical drop for receding cards — a subtle arc. */
    arc: [80, 0, 80, 2],
  });

  const { ref, index, focusedIndex } = useCardDeck("x", COUNT, 2);
  const pitch = p.cardWidth + p.gap;

  return (
    <div
      className="v-deck"
      ref={ref}
      tabIndex={0}
      style={{ "--card-w": `${p.cardWidth}px` } as CSSProperties}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - index;
        const t = Math.min(1, Math.abs(d) / p.falloff);
        const eased = 1 - (1 - t) * (1 - t);
        const scale = 1 + (p.minScale - 1) * eased;
        const opacity = 1 + (p.minOpacity - 1) * eased;
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: `translateX(${d * pitch}px) translateY(${eased * p.arc}px) scale(${scale})`,
              opacity,
              zIndex: COUNT - Math.round(Math.abs(d)),
            }}
          >
            <MockCard depth={eased} focused={i === focusedIndex} index={i} />
          </div>
        );
      })}
    </div>
  );
}
