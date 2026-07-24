import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 1. Horizontal scroll — what the app ships today, for side-by-side comparison.
export function ScrollVariant() {
  const p = useDialKit("Horizontal scroll", {
    cardWidth: [372, 200, 520, 1],
    gap: [14, 0, 120, 1],
    minScale: [0.75, 0.4, 1, 0.01],
    falloff: [2, 0.5, 5, 0.1],
  });

  const { ref, index, focusedIndex } = useCardDeck("x");
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
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: `translateX(${d * pitch}px) scale(${scale})`,
              zIndex: COUNT - Math.round(Math.abs(d)),
            }}
          >
            <MockCard depth={eased} focused={i === focusedIndex} />
          </div>
        );
      })}
    </div>
  );
}
