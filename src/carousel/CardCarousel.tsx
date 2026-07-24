import { memo, useEffect, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { Card } from "../card/Card";
import type { CardConfig } from "../card/cardConfig";
import { PALETTE } from "../card/cardConfig";
import { CARD_HERO_LAYOUT_ID, cardHeroLayout } from "../lib/motionConfig";
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
};

export function CardCarousel({
  configs,
  ids,
  activeId,
  cardName,
  note,
  onActiveChange,
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
        // The active, settled card carries the shared layoutId so it flies into
        // the wrap step as the same element (no crossfade). It rides an INNER
        // wrapper — the outer .deck-item owns the coverflow transform, and
        // Motion's layout projection needs an element whose transform it fully
        // controls. At focus the wrapper is centred (outer transform ~identity),
        // so the id maps to a card sitting at screen centre. Only when settled
        // (index is whole) so mid-drag no card claims it.
        const settled = Number.isInteger(index);
        const isHero = active && settled;
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
              {...(isHero
                ? { layoutId: CARD_HERO_LAYOUT_ID, transition: cardHeroLayout }
                : {})}
            >
              <DeckCard config={configs[id]} note={note} name={cardName} />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
