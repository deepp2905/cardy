import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCardDeck } from "../useCardDeck";
import "../explore.css";

// 3. Coverflow — neighbours rotate away on Y like wings, centre card stays
// flat and forward. The classic iTunes mechanic.
export function CoverflowVariant() {
  const p = useDialKit("Coverflow", {
    cardWidth: [400, 180, 460, 5],
    rotateY: [64, 0, 85, 1],
    /** Gap next to the flat centre card (fraction of card width). */
    centreGap: [0.34, 0, 1, 0.01],
    /** Gap between the rotated background cards (fraction of card width). */
    backGap: [0.12, 0, 0.6, 0.01],
    depthPush: [240, 0, 400, 5],
    scaleStep: [0.04, 0, 0.2, 0.005],
    scaleDepth: [7, 1, 7, 1],
    fade: [0, 0, 1, 0.01],
    perspective: [1200, 400, 3000, 50],
  });

  const { ref, index, focusedIndex, goTo } = useCardDeck("x", COUNT, 2);

  // Dynamic spacing. A flat centre card is full width on screen; a rotated
  // neighbour is foreshortened to cardWidth * cos(angle). Each card is placed
  // by its OWN on-screen footprint (plus a gap), accumulated along the strip
  // from that card's ACTUAL rotation at the current index — so the flat centre
  // gets a wide berth while the compressed background cards pack tighter, and
  // rotated cards never overlap even mid-drag between positions.
  const footprintOf = (i: number) => {
    const away = Math.min(1, Math.abs(i - index));
    return p.cardWidth * Math.cos((away * p.rotateY * Math.PI) / 180);
  };
  // Gap left of card i: wide near the flat centre, compressing to backGap out.
  const gapOf = (i: number) => {
    const nearCentre = Math.max(0, 1 - Math.abs(i - index - 0.5));
    return p.cardWidth * (p.backGap + (p.centreGap - p.backGap) * nearCentre);
  };

  // Cumulative centre-x of each card from actual per-card footprints, then
  // re-origin so the fractional focused index lands at 0.
  const centres: number[] = [];
  for (let i = 0, acc = 0; i < COUNT; i++) {
    acc +=
      i === 0
        ? footprintOf(0) / 2
        : footprintOf(i - 1) / 2 + gapOf(i) + footprintOf(i) / 2;
    centres.push(acc);
  }
  const lo = Math.floor(index);
  const hi = Math.min(COUNT - 1, lo + 1);
  const originX = centres[lo] + (centres[hi] - centres[lo]) * (index - lo);

  return (
    <div
      className="v-deck"
      ref={ref}
      tabIndex={0}
      data-clickable="true"
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
        const active = i === focusedIndex;
        // Rotation saturates at one card out so distant cards sit parallel
        // rather than continuing to spin.
        const turn = -Math.sign(d) * Math.min(1, away) * p.rotateY;
        const x = centres[i] - originX;
        return (
          <div
            key={i}
            className="deck-item"
            data-active={active}
            onClick={() => {
              if (!active) goTo(i);
            }}
            style={{
              transform: [
                `translateX(${x}px)`,
                `rotateY(${turn}deg)`,
                `translateZ(${-Math.min(1, away) * p.depthPush}px)`,
                `scale(${1 - Math.min(away, p.scaleDepth) * p.scaleStep})`,
              ].join(" "),
              zIndex: COUNT - Math.round(away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade)}
              focused={active}
              index={i}
            />
          </div>
        );
      })}
    </div>
  );
}
