import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 4. Revolut wallet — vertical overlap with the focused card pulled clear of
// the stack and scaled up; the cards above and below peek out behind it.
export function WalletVariant() {
  const p = useDialKit("Revolut wallet", {
    peek: [58, 16, 160, 1],
    focusScale: [1.12, 1, 1.5, 0.01],
    focusGap: [34, 0, 120, 1],
    sideInset: [26, 0, 90, 1],
    fade: [0.55, 0, 1, 0.01],
  });

  const { ref, active } = useCentreIndex("y");

  return (
    <div className="v-wallet" ref={ref}>
      {Array.from({ length: COUNT }, (_, i) => {
        const d = i - active;
        const away = Math.abs(d);
        const focused = d === 0;
        return (
          <div
            key={i}
            className="v-wallet-slot"
            style={{
              height: focused ? p.peek + p.focusGap * 2 : p.peek,
              zIndex: focused ? COUNT + 1 : COUNT - away,
            }}
          >
            <MockCard
              depth={Math.min(1, away * p.fade * 0.4)}
              focused={focused}
              style={{
                transform: `scale(${focused ? p.focusScale : 1})`,
                marginInline: focused ? 0 : p.sideInset * Math.min(away, 2) * 0.5,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
