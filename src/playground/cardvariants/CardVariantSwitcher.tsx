import { useRef } from "react";
import { motion } from "motion/react";
import "../../explore/explore.css";

// Draggable variant menu, reusing the explore switcher's look. Generic: just a
// titled list, no colour toggle (the card explorer has its own colour picker).

export type CardVariantMeta = { id: string; name: string; note: string };

export function CardVariantSwitcher({
  title,
  variants,
  activeId,
  onSelect,
}: {
  title: string;
  variants: CardVariantMeta[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const constraints = useRef<HTMLDivElement>(null);

  return (
    <>
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
          <span className="switcher-title">{title}</span>
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
