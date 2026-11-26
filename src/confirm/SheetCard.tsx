import { useRef, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { CARD } from "./geometry";

/**
 * The card as it sits on the carrier sheet — the copy that gets folded in.
 *
 * It takes over from the persistent hero with a hard swap, so on the swap
 * frame it must be PIXEL-IDENTICAL to the hero:
 *
 * - Sized by WIDTH, not `scale`. The card's internals are in cqw, so it renders
 *   natively at any width; a scale() would also scale its box-shadow (a 1.9x
 *   hairline and drop) and the swap would show as a shadow jump. It starts at
 *   the hero's --slide-w and shrinks to its 85.6mm sequence size.
 * - Opacity is the exact inverse of the hero's (`restOpacity`), so one set()
 *   flips both in the same frame — never both or neither visible.
 * - The extra "lying on paper" shadow fades in as it shrinks, so it isn't there
 *   at the swap (the hero has only the card's own shadow).
 */
export function SheetCard({
  cardScale,
  restScale,
  restOpacity,
  children,
}: {
  /** Size as a multiple of the 85.6mm sequence width: restScale -> 1. */
  cardScale: MotionValue<number>;
  /** cardScale at which the card matches the hero's --slide-w. */
  restScale: number;
  restOpacity: MotionValue<number>;
  children: ReactNode;
}) {
  // Read inside transforms, which build their mapper once.
  const restScaleRef = useRef(restScale);
  restScaleRef.current = restScale;

  const width = useTransform(
    cardScale,
    (s) => `calc(${CARD.w * s} * var(--mm))`,
  );
  const opacity = useTransform(restOpacity, (o) => 1 - o);
  // 0 at hero size, 1 once landed at sequence size.
  const ground = useTransform(cardScale, (s) => {
    const r = restScaleRef.current;
    if (r <= 1) return 1;
    return Math.min(1, Math.max(0, (r - s) / (r - 1)));
  });

  return (
    <motion.div className="card-holder" style={{ width, opacity }}>
      <motion.div
        className="card-ground"
        style={{ opacity: ground }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}
