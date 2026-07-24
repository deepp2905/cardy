import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, focusAmount, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 2. Exploded stack — cards fanned along a depth axis and tilted back so you
// read the deck edge-on; the focused card flattens toward the viewer.
export function ExplodedVariant() {
  const p = useDialKit("Exploded stack", {
    cardWidth: [330, 200, 460, 5],
    tiltX: [34, 0, 80, 1],
    /** How much the focused card straightens up (0 = keeps the tilt). */
    focusFlatten: [0.7, 0, 1, 0.05],
    spacing: [96, 20, 240, 1],
    scaleStep: [0.03, 0, 0.15, 0.005],
    focusLift: [60, 0, 200, 2],
    /** How many cards out the focus flatten/lift reaches. */
    focusFalloff: [1, 0.5, 4, 0.1],
    /** Per-card z recession behind the deck. */
    depthStep: [12, 0, 60, 1],
    depthCap: [4, 1, 7, 1],
    fade: [0.22, 0, 1, 0.01],
    perspective: [1200, 400, 3000, 50],
  });

  const { ref, index, focusedIndex } = useCardDeck("y");

  return (
    <div
      className="v-deck"
      data-vertical="true"
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
        const focus = focusAmount(away, p.focusFalloff);
        const capped = Math.min(away, p.depthCap);
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: [
                `translateY(${d * p.spacing}px)`,
                // The focused card rotates toward flat and lifts forward.
                `rotateX(${p.tiltX * (1 - focus * p.focusFlatten)}deg)`,
                `translateZ(${focus * p.focusLift - capped * p.depthStep}px)`,
                `scale(${1 - capped * p.scaleStep})`,
              ].join(" "),
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
