import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 2. Exploded stack — cards fanned along a depth axis and tilted back so you
// read the deck edge-on; the focused card flattens toward the viewer.
export function ExplodedVariant() {
  const p = useDialKit("Exploded stack", {
    cardWidth: [330, 200, 460, 5],
    tiltX: [34, 0, 80, 1],
    spacing: [96, 20, 240, 1],
    scaleStep: [0.03, 0, 0.15, 0.005],
    focusLift: [60, 0, 200, 2],
    perspective: [1200, 400, 3000, 50],
  });

  const { ref, index, focusedIndex } = useCardDeck("y");

  return (
    <div
      className="v-deck"
      ref={ref}
      tabIndex={0}
      style={
        {
          perspective: `${p.perspective}px`,
          "--card-w": `${p.cardWidth}px`,
        } as CSSProperties
      }
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - index;
        const away = Math.abs(d);
        const focus = Math.max(0, 1 - away);
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: [
                `translateY(${d * p.spacing}px)`,
                // The focused card rotates toward flat and lifts forward.
                `rotateX(${p.tiltX * (1 - focus * 0.7)}deg)`,
                `translateZ(${focus * p.focusLift - Math.min(away, 4) * 12}px)`,
                `scale(${1 - Math.min(away, 4) * p.scaleStep})`,
              ].join(" "),
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * 0.22)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
