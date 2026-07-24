import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 3. Coverflow — neighbours rotate away on Y like wings, centre card stays
// flat and forward. The classic iTunes mechanic.
export function CoverflowVariant() {
  const p = useDialKit("Coverflow", {
    cardWidth: [300, 180, 460, 5],
    rotateY: [52, 0, 85, 1],
    spread: [0.48, 0.1, 1.2, 0.01],
    depthPush: [140, 0, 400, 5],
    scaleStep: [0.06, 0, 0.2, 0.005],
    perspective: [1100, 400, 3000, 50],
  });

  const { ref, index, focusedIndex } = useCardDeck("x");
  const pitch = p.cardWidth * p.spread;

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
        // Rotation saturates at one card out so distant cards sit parallel
        // rather than continuing to spin.
        const turn = -Math.sign(d) * Math.min(1, away) * p.rotateY;
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: [
                `translateX(${d * pitch}px)`,
                `rotateY(${turn}deg)`,
                `translateZ(${-Math.min(1, away) * p.depthPush}px)`,
                `scale(${1 - Math.min(away, 3) * p.scaleStep})`,
              ].join(" "),
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * 0.25)}
              focused={i === focusedIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
