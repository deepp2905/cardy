import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 2. Exploded stack — cards fanned along a depth axis, tilted back so you read
// the deck edge-on. Scrolls vertically; the focused card sits flattest.
export function ExplodedVariant() {
  const p = useDialKit("Exploded stack", {
    tiltX: [62, 0, 85, 1],
    spacing: [86, 20, 200, 1],
    scaleStep: [0.03, 0, 0.15, 0.005],
    focusLift: [40, 0, 160, 1],
    perspective: [1200, 400, 3000, 50],
  });

  const { ref, active } = useCentreIndex("y");

  return (
    <div
      className="v-exploded"
      ref={ref}
      style={{ perspective: `${p.perspective}px` }}
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const away = Math.abs(d);
        const focused = i === active;
        return (
          <div key={i} className="v-exploded-slot" style={{ height: p.spacing }}>
            <MockCard
              depth={Math.min(1, away * 0.22)}
              focused={focused}
              style={{
                transform: [
                  `rotateX(${focused ? p.tiltX * 0.35 : p.tiltX}deg)`,
                  `translateZ(${focused ? p.focusLift : -away * 12}px)`,
                  `scale(${1 - away * p.scaleStep})`,
                ].join(" "),
                zIndex: COUNT - away,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
