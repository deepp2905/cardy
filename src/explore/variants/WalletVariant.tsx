import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, focusAmount, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 4. Revolut wallet — vertical overlap with the focused card pulled clear of
// the stack and scaled up; the cards above and below peek out behind it.
export function WalletVariant() {
  const p = useDialKit("Revolut wallet", {
    cardWidth: [400, 200, 460, 5],
    peek: [65, 16, 160, 1],
    focusScale: [1, 1, 1.5, 0.01],
    /** Extra space opened above and below the focused card. */
    focusGap: [21, 0, 160, 1],
    /** How many cards out the focus lift reaches. */
    focusFalloff: [4, 0.5, 4, 0.1],
    sideInset: [56, 0, 90, 1],
    sideStagger: [4, 0.5, 4, 0.5],
    fade: [0, 0, 1, 0.01],
    fadeReach: [0.1, 0.1, 1, 0.05],
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
        // Proximity to focus — drives the lift continuously instead of
        // switching on an exact match.
        const focus = focusAmount(away, p.focusFalloff);
        const y =
          d * p.peek + Math.sign(d) * Math.min(away, 1) * p.focusGap;
        const scale = 1 + (p.focusScale - 1) * focus;
        const inset = p.sideInset * Math.min(away, p.sideStagger) * 0.5;
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: `translateY(${y}px) scale(${scale})`,
              paddingInline: inset,
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade * p.fadeReach)}
              focused={i === focusedIndex}
              index={i}
            />
          </div>
        );
      })}
    </div>
  );
}
