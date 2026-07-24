import { useRef } from "react";
import { motion } from "motion/react";
import "./explore.css";

// Floating, draggable list of the layout ideas. Starts top-left so it clears
// the fixed theme toggle and playground link on the right; drag is bounded to
// the viewport so it can't be thrown off-screen.

export type VariantMeta = { id: string; name: string; note: string };

export function VariantSwitcher({
  variants,
  activeId,
  onSelect,
  colorful,
  onColorfulChange,
}: {
  variants: VariantMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  colorful: boolean;
  onColorfulChange: (v: boolean) => void;
}) {
  const constraints = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Bounds for the drag — fixed, full-viewport, non-interactive. */}
      <div ref={constraints} className="switcher-bounds" />
      <motion.div
        className="switcher"
        drag
        dragConstraints={constraints}
        dragMomentum={false}
        dragElastic={0.06}
        whileDrag={{ scale: 1.02 }}
      >
        <div className="switcher-head">
          <span className="switcher-grip" aria-hidden="true">
            ⠿
          </span>
          <span className="switcher-title">Carousel ideas</span>
          <button
            type="button"
            className="switcher-toggle"
            data-on={colorful}
            aria-pressed={colorful}
            onClick={() => onColorfulChange(!colorful)}
          >
            Colour
          </button>
        </div>
        <div className="switcher-list">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              className="switcher-item"
              data-active={v.id === activeId}
              onClick={() => onSelect(v.id)}
            >
              <span className="switcher-index">{i + 1}</span>
              <span className="switcher-text">
                <span className="switcher-name">{v.name}</span>
                <span className="switcher-note">{v.note}</span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
