import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 3. Coverflow — neighbours rotate away on Y like wings, centre card stays
// flat and forward. Horizontal scroll; the classic iTunes mechanic.
export function CoverflowVariant() {
  const p = useDialKit("Coverflow", {
    rotateY: [52, 0, 85, 1],
    overlap: [0.52, 0, 0.9, 0.01],
    depthPush: [140, 0, 400, 5],
    scaleStep: [0.06, 0, 0.2, 0.005],
    perspective: [1100, 400, 3000, 50],
  });

  const { ref, active } = useCentreIndex();
  const cardW = 300;
  const step = cardW * (1 - p.overlap);

  return (
    <div
      className="v-coverflow"
      ref={ref}
      style={{ perspective: `${p.perspective}px` }}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const away = Math.abs(d);
        return (
          <div
            key={i}
            className="v-coverflow-slot"
            style={{ flexBasis: step, width: cardW }}
          >
            <MockCard
              depth={Math.min(1, away * 0.25)}
              focused={d === 0}
              style={{
                transform: [
                  `rotateY(${-Math.sign(d) * Math.min(1, away) * p.rotateY}deg)`,
                  `translateZ(${d === 0 ? 0 : -p.depthPush}px)`,
                  `scale(${1 - Math.min(away, 3) * p.scaleStep})`,
                ].join(" "),
                zIndex: COUNT - away,
              }}
            />
          </div>
        );
      })}
      <style>{`.v-coverflow { padding-inline: calc(50% - ${cardW / 2}px); }`}</style>
    </div>
  );
}
