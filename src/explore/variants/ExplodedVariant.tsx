import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, focusAmount, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 2. Exploded stack — every card sweeps its tilt through zero in one
// direction as it travels the deck: leaning back above centre, flat (parallel
// to the screen) at centre, and continuing to lean the OTHER way below, so it
// never appears to reverse. Far cards rest near-flat (edge-on) but not fully,
// or they'd collapse to a line.
export function ExplodedVariant() {
  const p = useDialKit("Exploded stack", {
    cardWidth: [400, 200, 460, 5],
    /** Resting tilt of the far cards, degrees. Signed through centre. */
    maxTilt: [88, 20, 88, 1],
    /** Cards of travel over which the tilt sweeps 0 -> maxTilt. */
    tiltSpread: [1, 0.5, 4, 0.1],
    spacing: [161, 20, 240, 1],
    scaleStep: [0.1, 0, 0.15, 0.005],
    /** Forward pop of the focused card, px. */
    focusLift: [40, 0, 200, 2],
    /** Cards out the lift reaches. */
    focusFalloff: [1.6, 0.5, 4, 0.1],
    /** Per-card z recession behind the deck. */
    depthStep: [60, 0, 60, 1],
    depthCap: [1, 1, 7, 1],
    fade: [0, 0, 1, 0.01],
    perspective: [1200, 400, 3000, 50],
  });

  const { ref, index, focusedIndex } = useCardDeck("y");
  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));

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
        // SIGNED tilt through zero: a card leans one way above centre, is flat
        // at centre, and continues leaning the other way below — one direction
        // of rotation the whole way through, clamped so far cards rest near
        // maxTilt rather than folding to a line.
        const tilt = p.maxTilt * clamp(d / p.tiltSpread, -1, 1);
        return (
          <div
            key={i}
            className="deck-item"
            style={{
              transform: [
                `translateY(${d * p.spacing}px)`,
                `rotateX(${tilt}deg)`,
                `translateZ(${focus * p.focusLift - capped * p.depthStep}px)`,
                `scale(${1 - capped * p.scaleStep})`,
              ].join(" "),
              // Pivot about the centre now: with a signed tilt there is no
              // apparent reversal to correct for, and centre-pivot keeps the
              // flat focused card visually centred.
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade)}
              focused={i === focusedIndex}
              index={i}
            />
          </div>
        );
      })}
    </div>
  );
}
