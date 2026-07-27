import { memo, useEffect, useRef, type CSSProperties } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { Card } from "../card/Card";
import type { CardConfig } from "../card/cardConfig";
import { PALETTE } from "../card/cardConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import { useSlideW } from "../lib/useSlideW";
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
  /** Report the deck's exact card centre so the persistent hero sits on it. The
   *  slot is rendered as a grid item INSIDE the deck, so it shares the identical
   *  centring the deck cards use — no few-px offset from measuring a different
   *  box. */
  onHeroSlot: (owner: "deck" | "rest", point: { x: number; y: number }) => void;
};

export function CardCarousel({
  configs,
  ids,
  activeId,
  cardName,
  note,
  onActiveChange,
  deckOpacity,
  onHeroSlot,
}: CardCarouselProps) {
  const reduce = usePrefersReducedMotion();
  const count = ids.length;
  const activePos = Math.max(0, ids.indexOf(activeId));

  const { ref, index, focusedIndex, goTo } = useCardDeck("x", count, activePos);

  // Card width: the SAME resolved --slide-w the hero and confirm use — one
  // source of truth. The deck used to measure its own width (full-bleed dvw
  // minus a margin), which disagreed with --slide-w below ~423px viewport, so
  // the hero/deck swap visibly changed card size on phones.
  const cardW = useSlideW();

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
  // Both the hero and the deck's centre card read this SAME MotionValue — one
  // value applied by Motion to both in the same frames. That's what fixed the
  // original settle flicker: a 0/1 flip split across two render pipelines
  // (React style on the deck card, MotionValue on the hero) left a frame where
  // both or neither showed.
  //
  // The handoff is a SWAP, not a crossfade. Both cards cast --card-shadow, and
  // a shadow fades with its element: mid-crossfade you get two shadows at ~50%
  // instead of one at 100%, which composites LIGHTER than either endpoint. The
  // hairline (0 0 0 1px) and the ambient drop both thin out at once and the
  // card blooms off the page — a gentle brightening right on settle. Being
  // pixel-aligned doesn't save it; that only holds at full opacity.
  //
  // So the handoff is a hard swap at a single instant: deckOpacity goes 0 or 1
  // with no ramp, and the deck card takes its exact inverse. Exactly one card,
  // and therefore exactly one shadow, is visible in every frame.
  const settled = Number.isInteger(index);
  useEffect(() => {
    // Set, don't animate: any ramp puts both cards at partial alpha for those
    // frames, which is exactly the shadow artifact described above.
    deckOpacity.set(settled ? 1 : 0);
  }, [settled, deckOpacity]);

  // Exact inverse of a value that is only ever 0 or 1 — so this is only ever
  // 1 or 0 too. The two cards are pixel-identical, so the swap is invisible.
  const deckCardOpacity = useTransform(deckOpacity, (v) => 1 - v);

  // Freeze the active card's config while it's hidden. Settled, the active
  // deck card sits at opacity 0 behind the hero — but slider ticks change its
  // config identity, so the DeckCard memo missed and the INVISIBLE card
  // rebuilt its full pattern on every pointermove. Holding the last-visible
  // config while settled skips that; the frame a drag starts (settled flips
  // false) it re-renders once with the live config — exactly when it becomes
  // visible, which is the only moment correctness needs it.
  const activeConfig = configs[ids[focusedIndex]];
  const frozenActive = useRef(activeConfig);
  if (!settled) frozenActive.current = activeConfig;

  // Report the ACTIVE deck card's real viewport centre as the hero target, so
  // the flat hero lands exactly on the deck card (measuring the live element
  // beats any spacer that approximates it — that left a few-px vertical snap on
  // settle). Re-measured whenever the settled card changes or the deck resizes.
  const activeItemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!settled) return;
    let raf = 0;
    let lastY = NaN;
    let stableFrames = 0;
    // Poll the active card's centre until it stops moving, reporting only the
    // RESTING position — but report the first reading immediately so the hero
    // has somewhere to be right away.
    //
    // The deck's centre walks ~18px over ~200ms after `settled` flips, because
    // the customize step animates its children `y: 8 -> 0` on entry. Feeding the
    // hero every frame of that made it chase a moving target (a long climb from
    // the rest slot, re-aimed four times mid-flight). But waiting for the walk
    // to finish before reporting anything left the hero with no position at all
    // for those 200ms, so it appeared late and without motion.
    //
    // So: report the first measurement at once, but correct for the entrance
    // offset still in flight. The step lifts its children by ENTER_Y and the
    // hero replays that same rise itself, so what the hero wants is the deck
    // card's RESTING centre — the live rect minus however much of the lift has
    // not yet played out. Measuring the wrapper (which carries the animating
    // transform) against the item gives exactly that remainder.
    // How much of the step's enter-lift is still applied to the deck, in px.
    // Read off the live transform of the animating ancestor rather than assumed
    // from a timer, so it is correct whenever we happen to sample. The ancestor
    // is found by the data-hero-lift-source attribute Customize stamps on its
    // animating wrapper — an explicit contract, not a class name that could be
    // innocently renamed (see Customize.tsx).
    const pendingLift = () => {
      const el = activeItemRef.current?.closest("[data-hero-lift-source]");
      if (!(el instanceof HTMLElement)) return 0;
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return m.m42; // translateY currently applied
    };
    const report = () => {
      const el = activeItemRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Round to whole pixels: a fractional fixed-position with a box-shadow
      // anti-aliases into a faint light seam on one edge. Integer coords remove it.
      onHeroSlot("deck", {
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2 - pendingLift()),
      });
    };
    const tick = () => {
      const el = activeItemRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const cy = Math.round(r.top + r.height / 2);
      // First real measurement: hand it over now, don't wait for the settle.
      if (Number.isNaN(lastY)) report();
      // Two consecutive frames within 0.5px = at rest; correct once and stop.
      if (Math.abs(cy - lastY) < 0.5) {
        if (++stableFrames >= 2) {
          report();
          return;
        }
      } else {
        stableFrames = 0;
      }
      lastY = cy;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("resize", tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled, focusedIndex, cardW]);

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
      aria-orientation="horizontal"
      // Focus stays on the group (it owns the arrow keys); this tells AT which
      // radio is current, so arrowing/dragging announces the colour. Without
      // it a screen reader on the group can't perceive the selection at all.
      aria-activedescendant={`deck-${ids[focusedIndex]}`}
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
            id={`deck-${id}`}
            ref={active ? activeItemRef : undefined}
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
              <DeckCard
                config={
                  active && settled ? frozenActive.current : configs[id]
                }
                note={note}
                name={cardName}
              />
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
