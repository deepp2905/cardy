import { motion, type Variants } from "motion/react";
import { CardCarousel } from "../carousel/CardCarousel";
import type { CardConfig } from "../card/cardConfig";
import { DialPanel } from "../controls/DialPanel";
import { crossfade, ENTER_STAGGER } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { Button } from "../ui/Button";
import "./steps.css";

type CustomizeProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  onActiveChange: (id: string) => void;
  onPatch: (id: string, patch: Partial<CardConfig>) => void;
  onOrder: () => void;
};

export function Customize({
  configs,
  ids,
  activeId,
  onActiveChange,
  onPatch,
  onOrder,
}: CustomizeProps) {
  const reduce = usePrefersReducedMotion();
  const active = configs[activeId];

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: crossfade },
  };

  return (
    <motion.div
      className="customize"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: ENTER_STAGGER }}
    >
      <motion.div className="customize-carousel" variants={item}>
        <CardCarousel
          configs={configs}
          ids={ids}
          activeId={activeId}
          onActiveChange={onActiveChange}
        />
      </motion.div>
      <motion.div className="customize-panel" variants={item}>
        <DialPanel
          config={active}
          onPatch={(patch) => onPatch(activeId, patch)}
        />
      </motion.div>
      <motion.div className="customize-cta" variants={item}>
        <Button onClick={onOrder}>Order this card</Button>
      </motion.div>
    </motion.div>
  );
}
