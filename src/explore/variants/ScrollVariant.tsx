import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 1. Horizontal scroll — what the app ships today, for side-by-side comparison.
export function ScrollVariant() {
  const p = useDialKit("Horizontal scroll", {
    cardWidth: [400, 200, 520, 1],
    gap: [24, 0, 120, 1],
    minScale: [0.5, 0.4, 1, 0.01],
    falloff: [5, 0.5, 5, 0.1],
    /** Vertical drop for receding cards — a subtle arc. */
    arc: [80, 0, 80, 2],
  });

  const { ref, index, focusedIndex } = useCardDeck("x", COUNT, 2);

  // Lay cards edge-to-edge with a CONSTANT gap. Fixed centre-to-centre spacing
  // left uneven gaps once cards were scaled — a big card eats into the gap, a
  // small one leaves more. Instead: accumulate each card's actual scaled width
  // plus the gap along the strip, then shift so the (fractional) focused index
  // lands at 0.
  const scaleAt = (i: number) => {
    const t = Math.min(1, Math.abs(i - index) / p.falloff);
    const eased = 1 - (1 - t) * (1 - t);
    return 1 + (p.minScale - 1) * eased;
  };

  const centres: number[] = [];
  for (let i = 0, acc = 0; i < COUNT; i++) {
    acc +=
      i === 0
        ? (p.cardWidth * scaleAt(0)) / 2
        : (p.cardWidth * scaleAt(i - 1)) / 2 +
          p.gap +
          (p.cardWidth * scaleAt(i)) / 2;
    centres.push(acc);
  }
  // Interpolate the strip position of the fractional index and re-origin there.
  const lo = Math.floor(index);
  const hi = Math.min(COUNT - 1, lo + 1);
  const originX = centres[lo] + (centres[hi] - centres[lo]) * (index - lo);

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
        const scale = scaleAt(i);
        const x = centres[i] - originX;
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: `translateX(${x}px) translateY(${eased * p.arc}px) scale(${scale})`,
              zIndex: COUNT - Math.round(Math.abs(d)),
            }}
          >
            {/* depth 0: colour never shifts with position — size and arc
                carry the recession instead. */}
            <MockCard depth={0} focused={i === focusedIndex} index={i} />
          </div>
        );
      })}
    </div>
  );
}
