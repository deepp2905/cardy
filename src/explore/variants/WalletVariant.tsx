import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 4. Revolut wallet — vertical overlap with the focused card pulled clear of
// the stack and scaled up; the cards above and below peek out behind it.
export function WalletVariant() {
  const p = useDialKit("Revolut wallet", {
    cardWidth: [330, 200, 460, 5],
    peek: [58, 16, 160, 1],
    focusScale: [1.12, 1, 1.5, 0.01],
    /** Extra space opened above and below the focused card. */
    focusGap: [40, 0, 160, 1],
    sideInset: [26, 0, 90, 1],
    fade: [0.55, 0, 1, 0.01],
  });

  const { ref, index, focusedIndex } = useCardDeck("y");

  return (
    <div
      className="v-deck"
      ref={ref}
      tabIndex={0}
      style={{ "--card-w": `${p.cardWidth}px` } as CSSProperties}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - index;
        const away = Math.abs(d);
        // Proximity to focus, 1 at the centre and 0 a card away — drives the
        // lift continuously instead of switching on an exact match.
        const focus = Math.max(0, 1 - away);
        const y = d * p.peek + Math.sign(d) * Math.min(away, 1) * p.focusGap;
        const scale = 1 + (p.focusScale - 1) * focus;
        const inset = p.sideInset * Math.min(away, 2) * 0.5;
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
              depth={Math.min(1, away * p.fade * 0.4)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
