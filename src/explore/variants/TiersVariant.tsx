import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 7. Fanned tiers — a pyramid of bands, each card slightly narrower than the
// one behind so every tier stays legible. Scrolls vertically.
export function TiersVariant() {
  const p = useDialKit("Fanned tiers", {
    band: [46, 16, 120, 1],
    narrowStep: [0.05, 0, 0.2, 0.005],
    focusPop: [1.1, 1, 1.4, 0.01],
    curve: [10, 0, 60, 1],
    fade: [0.35, 0, 1, 0.01],
  });

  const { ref, active } = useCentreIndex("y");

  return (
    <div className="v-tiers" ref={ref}>
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const away = Math.abs(d);
        const focused = d === 0;
        return (
          <div
            key={i}
            className="v-tiers-slot"
            style={{ height: focused ? p.band * 2.4 : p.band, zIndex: COUNT - away }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade * 0.4)}
              focused={focused}
              style={{
                transform: [
                  `scale(${focused ? p.focusPop : 1 - Math.min(away, 4) * p.narrowStep})`,
                  // Slight arc so the stack reads as fanned, not just offset.
                  `translateY(${Math.sign(d) * Math.min(away, 4) * -p.curve * 0.1}px)`,
                ].join(" "),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
