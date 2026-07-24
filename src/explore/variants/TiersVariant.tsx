import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, focusAmount, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 7. Fanned tiers — a pyramid of bands, each card slightly narrower than the
// one behind so every tier stays legible.
export function TiersVariant() {
  const p = useDialKit("Fanned tiers", {
    cardWidth: [330, 200, 460, 5],
    band: [46, 16, 140, 1],
    narrowStep: [0.05, 0, 0.2, 0.005],
    /** Cards beyond this stop narrowing further. */
    narrowDepth: [4, 1, 7, 1],
    focusPop: [1.12, 1, 1.4, 0.01],
    /** Space opened below the focused tier so its face is readable. */
    focusGap: [110, 0, 280, 2],
    /** How many cards out the focus pop reaches. */
    focusFalloff: [1, 0.5, 4, 0.1],
    fade: [0.35, 0, 1, 0.01],
    fadeReach: [0.4, 0.1, 1, 0.05],
  });

  const { ref, index, focusedIndex } = useCardDeck("y");

  return (
    <div
      className="v-deck"
      data-vertical="true"
      ref={ref}
      tabIndex={0}
      style={{ "--card-w": `${p.cardWidth}px` } as CSSProperties}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - index;
        const away = Math.abs(d);
        const focus = focusAmount(away, p.focusFalloff);
        const y = d * p.band + (d > 0 ? Math.min(away, 1) * p.focusGap : 0);
        const scale =
          1 +
          (p.focusPop - 1) * focus -
          Math.min(away, p.narrowDepth) * p.narrowStep;
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: `translateY(${y}px) scale(${scale})`,
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade * p.fadeReach)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
