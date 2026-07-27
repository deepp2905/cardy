import { memo, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, type MotionValue } from "motion/react";
import { Card } from "./Card";
import type { CardConfig } from "./cardConfig";
import { cardMove, crossfade } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
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

// Memoised: App re-renders on every heroTarget report and wrap-phase change,
// and without the memo each of those rebuilt this card's pattern SVG. All
// props are stable identities (memoised config, MotionValues, literals)
// except target/phase, which change rarely.
export const HeroCard = memo(function HeroCard({
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
  // Outer opacity = step-level visibility (welcome hides the card entirely).
  // Inner opacity = within-step fade: the deck yields to its live centre card
  // mid-drag; the wrap sequence hands off to the in-sheet copy. Two nodes at
  // identical position and size crossfading — no layout, so no pop.
  //
  // ONLY the deck phase reads deckOpacity; rest AND hidden read restOpacity.
  // Binding hidden to deckOpacity flashed the card at the end of the wrap
  // sequence: through the sequence the inner value is restOpacity = 0 (handed
  // off to the sheet), but the moment the epilogue flipped the phase to
  // hidden, the binding switched to deckOpacity = 1 — so the card popped fully
  // visible for the outer fade's 300ms. Outside the sequence restOpacity is 1,
  // so welcome's hide behaves exactly as before.
  const innerOpacity = phase === "deck" ? deckOpacity : restOpacity;

  const reduce = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Has the hero been placed since it last went hidden? Tracked explicitly
  // rather than inferred from x/y ("am I at the origin" is a different question
  // from "have I been placed", and they diverge on re-entry). This is what
  // distinguishes the two kinds of move:
  //   - customize <-> confirm: the card never hides, so it is already placed and
  //     SPRINGS between the deck and rest slots. That glide is the point.
  //   - welcome -> customize (incl. after Start Over): the card was hidden, so
  //     the first target hard-sets and it simply appears in the deck. Without
  //     this it sprang ~106px up from the stale confirm coordinates.
  // Mirrored in a ref because the placement effect READS it to choose hard-set
  // vs spring: as a dependency it retriggered the effect on the very same
  // target, so the hard-set was immediately followed by a spring away from it —
  // which is the flight this exists to remove. The state copy only drives
  // `visible`; the ref is what the effect consults.
  const [placed, setPlaced] = useState(false);
  const placedRef = useRef(false);
  const setPlacedBoth = (v: boolean) => {
    placedRef.current = v;
    setPlaced(v);
  };

  useEffect(() => {
    if (phase === "hidden") setPlacedBoth(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (!target) return;
    if (!placedRef.current) {
      setPlacedBoth(true);
      x.set(target.x);
      y.set(target.y);
      return;
    }
    animate(x, target.x, cardMove);
    animate(y, target.y, cardMove);
    // placedRef is intentionally absent: reading it must not retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.x, target?.y, x, y]);

  // Fade in only once the card has a real position for this appearance —
  // otherwise it paints at 0,0 (top-left) for the frames before the deck
  // finishes measuring, which the settle-wait made long enough to see.
  // Between slots it stays visible, because `placed` is still true.
  const visible = phase !== "hidden" && placed;

  return (
    <motion.div
      className="hero-card"
      aria-hidden={!visible}
      style={{ x, y }}
    >
      <motion.div
        className="hero-card-fade"
        animate={{ opacity: visible ? 1 : 0 }}
        transition={crossfade}
      >
        {/* Entrance matches the deck's own cards: the customize step gives every
            child `opacity 0->1, y 8->0` on `crossfade` (see Customize's `item`
            variant). The hero is a sibling of that tree rather than part of it,
            so it replays the same values here — otherwise it just blinked into
            place while the deck around it rose. The y lives on THIS node because
            the outer node's transform is owned by the x/y motion values and
            .hero-card-fade's is the -50%/-50% centring. */}
        <motion.div
          className="hero-card-inner"
          style={{ opacity: innerOpacity }}
          animate={{ y: visible ? 0 : reduce ? 0 : 8 }}
          transition={crossfade}
        >
          <Card config={config} name={name} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
