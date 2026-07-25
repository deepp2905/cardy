import { memo, useEffect, useState, type CSSProperties } from "react";
import { animate, motion, useTransform, type MotionValue } from "motion/react";
import { Card } from "../card/Card";
import type { CardConfig } from "../card/cardConfig";
import { PALETTE } from "../card/cardConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { useCardDeck } from "./useCardDeck";
import "./carousel.css";

// The deck re-renders every frame during a drag (the index is React state),
// but CardPattern rebuilds a several-hundred-cell SVG on each render. Memoise
// the card subtree so only the wrapper's transform changes per frame — the
// artwork rebuilds only when its own config actually changes. `config` is
// stable parent state and `note`/`name` are strings, so the merge happens here
// behind the memo boundary rather than creating a fresh object every frame.
const DeckCard = memo(function DeckCard({
  config,
  note,
  name,
}: {
  config: CardConfig;
  note: string;
  name: string;
}) {
  return <Card config={{ ...config, note }} name={name} />;
});

// Coverflow deck (ported from the explore playground's Coverflow experiment).
// Neighbours rotate away on Y like wings; the centre card stays flat and
// forward — the classic cover-flow mechanic. No scroll container: useCardDeck
// owns a fractional index driven by drag/wheel/keyboard, and every card is
// placed by transform from that index, so all cards respond continuously to
// the gesture rather than popping at a snap point.

// Tuned constants, lifted from the playground's dialkit defaults.
const ROTATE_Y = 56; // degrees a neighbour turns away
const CENTRE_GAP = 0.48; // gap beside the flat centre card (fraction of width)
const BACK_GAP = 0; // gap between the rotated background cards
const SCALE_STEP = 0.04; // per-card shrink with depth
const SCALE_DEPTH = 7; // cards out at which shrink stops
const PERSPECTIVE = 1200; // px

// Card render width: the column width, clamped to fit narrow viewports. The
// footprint math below needs a concrete number, so it's measured rather than
// left to CSS.
const MAX_CARD_W = 372;

type CardCarouselProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  cardName: string;
  /** Shared engraving — merged into every card's config at render. */
  note: string;
  onActiveChange: (id: string) => void;
  /** 1 while the deck is mid-drag (its own centre card shows), 0 when settled
   *  (the persistent hero shows in the centre slot instead). The carousel drives
   *  this; HeroCard reads it. A MotionValue so the per-frame index changes never
   *  cause a React render here. */
  deckOpacity: MotionValue<number>;
};

export function CardCarousel({
  configs,
  ids,
  activeId,
  cardName,
  note,
  onActiveChange,
  deckOpacity,
}: CardCarouselProps) {
  const reduce = usePrefersReducedMotion();
  const count = ids.length;
  const activePos = Math.max(0, ids.indexOf(activeId));

  const { ref, index, focusedIndex, goTo } = useCardDeck("x", count, activePos);

  // Card width, measured from the deck so the footprint math is in real px.
  const [cardW, setCardW] = useState(MAX_CARD_W);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setCardW(Math.min(MAX_CARD_W, Math.max(200, el.clientWidth - 32)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  // Report the centred card up to the parent as the deck settles.
  useEffect(() => {
    const next = ids[focusedIndex];
    if (next && next !== activeId) onActiveChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex]);

  // Hand the centre slot between the deck's live card (mid-drag) and the
  // persistent hero (settled). deckOpacity is the HERO's opacity: 1 when settled
  // (the flat hero owns the centre), 0 mid-drag (the deck's own live card, which
  // can do the coverflow tilt the flat hero can't, owns it).
  //
  // Both the hero and the deck's centre card read this SAME MotionValue — the
  // deck card gets the inverse (deckCardOpacity below) — and we CROSSFADE it
  // rather than hard-set. That's the fix for the settle flicker: a hard 0/1 flip
  // split across two render pipelines (React style on the deck card, MotionValue
  // on the hero) left a frame where both or neither showed, reading as a
  // flash/double. One animated value, applied by Motion to both in the same
  // frames, with a brief overlap where both are partially visible — and since
  // they're pixel-aligned, that overlap is invisible.
  const settled = Number.isInteger(index);
  useEffect(() => {
    animate(deckOpacity, settled ? 1 : 0, {
      duration: 0.12,
      ease: [0.32, 0.72, 0, 1],
    });
  }, [settled, deckOpacity]);

  // The deck's active centre card shows the inverse of the hero.
  const deckCardOpacity = useTransform(deckOpacity, (v) => 1 - v);

  // Follow an external selection (parent sets activeId): spring the deck to it,
  // unless it's already the settled card.
  useEffect(() => {
    if (activePos !== focusedIndex) goTo(activePos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePos]);

  // --- Coverflow layout, computed from the fractional index ----------------
  // A flat centre card is full width on screen; a rotated neighbour is
  // foreshortened to cardW * cos(angle). Each card is placed by its OWN
  // on-screen footprint (plus a gap), accumulated along the strip from its
  // actual rotation at the current index — so the flat centre gets a wide
  // berth while the compressed background cards pack tighter, and rotated
  // cards never overlap even mid-drag between positions.
  const footprintOf = (i: number) => {
    const away = Math.min(1, Math.abs(i - index));
    return cardW * Math.cos((away * ROTATE_Y * Math.PI) / 180);
  };
  const gapOf = (i: number) => {
    const nearCentre = Math.max(0, 1 - Math.abs(i - index - 0.5));
    return cardW * (BACK_GAP + (CENTRE_GAP - BACK_GAP) * nearCentre);
  };

  const centres: number[] = [];
  for (let i = 0, acc = 0; i < count; i++) {
    acc +=
      i === 0
        ? footprintOf(0) / 2
        : footprintOf(i - 1) / 2 + gapOf(i) + footprintOf(i) / 2;
    centres.push(acc);
  }
  const lo = Math.floor(index);
  const hi = Math.min(count - 1, lo + 1);
  const originX = centres[lo] + (centres[hi] - centres[lo]) * (index - lo);

  return (
    <div
      className="carousel-deck"
      ref={ref}
      tabIndex={0}
      role="radiogroup"
      aria-label="Choose a card color"
      style={
        {
          perspective: `${PERSPECTIVE}px`,
          "--card-w": `${cardW}px`,
        } as CSSProperties
      }
    >
      {ids.map((id, i) => {
        const d = i - index;
        const away = Math.abs(d);
        const active = i === focusedIndex;
        // Rotation saturates at one card out so distant cards sit parallel
        // rather than continuing to spin.
        // Reduced motion: a flat draggable strip — cards still track the
        // finger (keyed off the continuous index), just without the Y-rotation,
        // depth scale, or perspective that make it a coverflow.
        const turn = reduce ? 0 : -Math.sign(d) * Math.min(1, away) * ROTATE_Y;
        const x = reduce ? d * cardW * 1.06 : centres[i] - originX;
        const scale = reduce
          ? 1
          : 1 - Math.min(away, SCALE_DEPTH) * SCALE_STEP;
        // The active centre card crossfades with the persistent hero on the
        // shared deckOpacity (its inverse). Non-active cards are always opaque.
        // Transform (per-frame from `index`) stays on the plain outer .deck-item;
        // opacity rides an inner motion node so Motion never touches the
        // transform string.
        return (
          <div
            key={id}
            className="deck-item"
            data-active={active}
            role="radio"
            aria-checked={active}
            aria-label={PALETTE[i]?.name ?? id}
            onClick={() => {
              if (!active) goTo(i);
            }}
            style={{
              transform: `translateX(${x}px) rotateY(${turn}deg) scale(${scale})`,
              zIndex: count - Math.round(away),
            }}
          >
            <motion.div
              className="deck-card-inner"
              style={active ? { opacity: deckCardOpacity } : undefined}
            >
              <DeckCard config={configs[id]} note={note} name={cardName} />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
