import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 6. Apple wallet — tight vertical stack where only a title strip of each card
// shows; the focused one lifts clear of the cards behind it.
export function AppleWalletVariant() {
  const p = useDialKit("Apple wallet", {
    cardWidth: [330, 200, 460, 5],
    strip: [34, 12, 90, 1],
    focusScale: [1.06, 1, 1.4, 0.01],
    /** How much the stack opens up around the focused card. */
    focusGap: [120, 0, 300, 2],
    shrinkStep: [0.03, 0, 0.15, 0.005],
    fade: [0.3, 0, 1, 0.01],
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
        const focus = Math.max(0, 1 - away);
        // Cards above sit at the strip pitch; below the focused card the
        // stack is pushed down so the focused face is fully exposed.
        const y = d * p.strip + (d > 0 ? Math.min(away, 1) * p.focusGap : 0);
        const scale =
          1 + (p.focusScale - 1) * focus - Math.min(away, 4) * p.shrinkStep;
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
              depth={Math.min(1, away * p.fade * 0.5)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
