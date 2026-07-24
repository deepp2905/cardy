import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 5. Perspective wings — the centre card is full size and flat; neighbours
// hinge away from it like door panels, anchored on their inner edge.
export function WingsVariant() {
  const p = useDialKit("Perspective wings", {
    wingAngle: [64, 0, 88, 1],
    centreWidth: [330, 180, 520, 5],
    wingWidth: [120, 40, 300, 5],
    perspective: [900, 300, 2500, 25],
    wingFade: [0.4, 0, 1, 0.01],
  });

  const { ref, active } = useCentreIndex();

  return (
    <div
      className="v-wings"
      ref={ref}
      style={{ perspective: `${p.perspective}px` }}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const focused = d === 0;
        const side = Math.sign(d);
        return (
          <div
            key={i}
            className="v-wings-slot"
            style={{
              flexBasis: focused ? p.centreWidth : p.wingWidth,
              zIndex: focused ? COUNT : COUNT - Math.abs(d),
            }}
          >
            <MockCard
              depth={focused ? 0 : p.wingFade}
              focused={focused}
              style={{
                transformOrigin: side > 0 ? "left center" : "right center",
                transform: focused
                  ? "none"
                  : `rotateY(${-side * p.wingAngle}deg)`,
                width: focused ? p.centreWidth : p.centreWidth,
              }}
            />
          </div>
        );
      })}
      <style>{`.v-wings { padding-inline: calc(50% - ${p.centreWidth / 2}px); }`}</style>
    </div>
  );
}
