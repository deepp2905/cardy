import { useDialKit } from "dialkit";
import { MockCard } from "../MockCard";
import { COUNT, useCentreIndex } from "../useCentreIndex";
import "../explore.css";

// 1. Horizontal scroll — what the app ships today, for side-by-side comparison.
export function ScrollVariant() {
  const p = useDialKit("Horizontal scroll", {
    cardWidth: [372, 200, 520, 1],
    gap: [14, 0, 80, 1],
    minScale: [0.75, 0.4, 1, 0.01],
    falloffSlides: [2, 0.5, 5, 0.1],
  });

  const { ref, active } = useCentreIndex();

  return (
    <div className="v-scroll" ref={ref}>
      {Array.from({ length: COUNT }, (_, i) => {
        const t = Math.min(1, Math.abs(i - active) / p.falloffSlides);
        const eased = 1 - (1 - t) * (1 - t);
        const scale = 1 + (p.minScale - 1) * eased;
        return (
          <div
            key={i}
            className="v-scroll-slide"
            style={{ flexBasis: p.cardWidth, marginRight: i < COUNT - 1 ? p.gap : 0 }}
          >
            <MockCard
              depth={eased}
              focused={Math.round(active) === i}
              style={{ transform: `scale(${scale})` }}
            />
          </div>
        );
      })}
      <style>{`.v-scroll { padding-inline: calc(50% - ${p.cardWidth / 2}px); }`}</style>
    </div>
  );
}
