import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 6. Apple wallet — tight vertical stack where only a title strip of each card
// shows; the focused one expands to full height over the cards behind it.
export function AppleWalletVariant() {
  const p = useDialKit("Apple wallet", {
    strip: [34, 12, 90, 1],
    focusScale: [1.06, 1, 1.4, 0.01],
    shrinkBelow: [0.94, 0.7, 1, 0.01],
    stackShift: [8, 0, 40, 1],
    fade: [0.3, 0, 1, 0.01],
  });

  const { ref, active } = useCentreIndex("y");

  return (
    <div className="v-apple" ref={ref}>
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const away = Math.abs(d);
        const focused = d === 0;
        // Cards below the focused one compress toward the bottom edge.
        const below = d > 0;
        return (
          <div
            key={i}
            className="v-apple-slot"
            style={{
              height: focused ? "auto" : p.strip,
              zIndex: Math.round(focused ? COUNT + 1 : below ? COUNT - away : away),
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade * 0.5)}
              focused={focused}
              style={{
                transform: [
                  `scale(${focused ? p.focusScale : Math.pow(p.shrinkBelow, Math.min(away, 4))})`,
                  `translateY(${focused ? 0 : -Math.sign(d) * Math.min(away, 4) * p.stackShift}px)`,
                ].join(" "),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
