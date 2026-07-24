import { motion, type Variants } from "motion/react";
import { CardCarousel } from "../carousel/CardCarousel";
import type { CardConfig } from "../card/cardConfig";
import { DialPanel } from "../controls/DialPanel";
import { crossfade, ENTER_STAGGER } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./steps.css";

type CustomizeProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  cardName: string;
  /** Shared across every card — see App. */
  note: string;
  onActiveChange: (id: string) => void;
  onNoteChange: (note: string) => void;
  onPatch: (id: string, patch: Partial<CardConfig>) => void;
};

// Body only — the CTAs live in the persistent action bar (App).
export function Customize({
  configs,
  ids,
  activeId,
  cardName,
  note,
  onActiveChange,
  onNoteChange,
  onPatch,
}: CustomizeProps) {
  const reduce = usePrefersReducedMotion();
  const active = configs[activeId];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: ENTER_STAGGER } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: crossfade },
  };

  return (
    <motion.div
      className="step-body customize"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="customize-carousel" variants={item}>
        <CardCarousel
          configs={configs}
          ids={ids}
          activeId={activeId}
          cardName={cardName}
          note={note}
          onActiveChange={onActiveChange}
        />
      </motion.div>
      <motion.div className="customize-panel" variants={item}>
        <DialPanel
          config={active}
          note={note}
          onNoteChange={onNoteChange}
          onPatch={(patch) => onPatch(activeId, patch)}
        />
      </motion.div>
    </motion.div>
  );
}
