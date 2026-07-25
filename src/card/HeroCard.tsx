import { useEffect } from "react";
import { animate, motion, useMotionValue, type MotionValue } from "motion/react";
import { Card } from "./Card";
import type { CardConfig } from "./cardConfig";
import { cardMove } from "../lib/motionConfig";
import "./heroCard.css";

/**
 * The one persistent card of the whole flow.
 *
 * This node is mounted once in MainFlow, as a sibling of the step AnimatePresence,
 * and never unmounts as the user moves welcome -> customize -> confirm. That is
 * the entire point: "state preserved across steps" and "the card doesn't pop"
 * are different problems, and the pop was a *continuity* failure — the card was
 * two different DOM nodes (the carousel's active slot and the confirm hero)
 * handed off via a shared layoutId, whose measured box was distorted by the
 * coverflow ancestor transform. With one node that never remounts, there is no
 * box to measure and nothing to hand off.
 *
 * Position: the hero is absolutely placed inside .step-stage and centred on a
 * target point (targetX/targetY) that the active step reports from its own live
 * layout via an invisible spacer (HeroSlot). On a step change the hero SPRINGS
 * between the two points. Crucially this is a plain transform on a node that
 * never remounts — Motion measures nothing, so it is deterministic and cannot
 * pop the way the old layout projection did.
 *
 * Size is always --slide-w. The only per-step layout difference is the centre
 * point, which the spacers supply, so the card never resizes either.
 */
export type HeroPhase = "hidden" | "deck" | "rest";

export function HeroCard({
  config,
  name,
  phase,
  /** Centre point the hero should occupy, in .step-stage coordinates. */
  target,
  /** During a carousel drag the deck shows its own centre card; the hero yields
   *  by dropping to 0. A MotionValue so the fade never touches React state. */
  deckOpacity,
  /** The wrap sequence owns the rest-card opacity once it starts. */
  restOpacity,
}: {
  config: CardConfig;
  name: string;
  phase: HeroPhase;
  target: { x: number; y: number } | null;
  deckOpacity: MotionValue<number>;
  restOpacity: MotionValue<number>;
}) {
  const visible = phase !== "hidden";
  // Outer opacity = step-level visibility (welcome hides the card entirely).
  // Inner opacity = within-step fade: the deck yields to its live centre card
  // mid-drag; the wrap sequence hands off to the in-sheet copy. Two nodes at
  // identical position and size crossfading — no layout, so no pop.
  const innerOpacity = phase === "rest" ? restOpacity : deckOpacity;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring to the reported centre. First placement (no prior target) is a hard
  // set so the card appears in place rather than flying in from 0,0.
  useEffect(() => {
    if (!target) return;
    const settled = x.get() !== 0 || y.get() !== 0;
    if (!settled) {
      x.set(target.x);
      y.set(target.y);
      return;
    }
    animate(x, target.x, cardMove);
    animate(y, target.y, cardMove);
  }, [target?.x, target?.y, x, y]);

  return (
    <motion.div
      className="hero-card"
      aria-hidden={!visible}
      style={{ x, y }}
    >
      <motion.div
        className="hero-card-fade"
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div className="hero-card-inner" style={{ opacity: innerOpacity }}>
          <Card config={config} name={name} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
