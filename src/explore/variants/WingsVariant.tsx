import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 5. Perspective wings — the centre card is full size and flat; neighbours
// hinge away from it like door panels, anchored on their inner edge.
export function WingsVariant() {
  const p = useDialKit("Perspective wings", {
    cardWidth: [235, 180, 520, 5],
    wingAngle: [60, 0, 88, 1],
    /** Gap between the centre card's edge and the hinge, in px. */
    hinge: [48, -60, 120, 1],
    /** How far apart the folded wings stack (multiplies their spacing). */
    wingSpacing: [0.8, 0.1, 1.2, 0.05],
    perspective: [2500, 300, 2500, 25],
    wingFade: [0, 0, 1, 0.01],
  });

  const { ref, index, focusedIndex } = useCardDeck("x", COUNT, 2);

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
        const side = Math.sign(d) || 1;
        // Wings fold about the centre card's edge, so each step out adds only
        // the foreshortened width rather than a full card.
        const fold = Math.min(1, away);
        const foreshortened =
          Math.cos((fold * p.wingAngle * Math.PI) / 180) * p.cardWidth;
        const offset =
          side *
          (p.cardWidth / 2 +
            p.hinge +
            (away - 0.5) * foreshortened * p.wingSpacing);
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transformOrigin: side > 0 ? "left center" : "right center",
              transform: [
                `translateX(${away < 0.5 ? d * (p.cardWidth * 0.5) : offset}px)`,
                `rotateY(${-side * fold * p.wingAngle}deg)`,
              ].join(" "),
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard depth={fold * p.wingFade} focused={i === focusedIndex} index={i} />
          </div>
        );
      })}
    </div>
  );
}
