import { useEffect, useRef, useState } from "react";

/**
 * THIS is the deck the app ships. src/explore/useCardDeck.ts is a near-identical
 * dev-only fork behind #/explore — tune the real carousel HERE, or the change
 * won't reach users. Known drift, so a diff between them isn't alarming:
 * arrow keys spring here (settle) but hard-set there (commit); the drag guard
 * is unconditional here but gated on data-clickable there; and the fork carries
 * a COUNT default and a focusAmount helper the app has no use for.
 *
 * A fractional card index driven directly by drag, wheel, and keyboard — no
 * native scroller underneath. Ported from the explore playground's deck hook
 * (the Coverflow experiment), which is the mechanic the app now ships.
 *
 * A real scroll container with `scroll-snap-type: mandatory` cannot coexist
 * with an imperative drag: mandatory snap re-snaps to the nearest point on
 * every programmatic scroll, so the drag writes a position and the browser
 * pulls it straight back. Owning the index outright removes that fight and the
 * fragile offset measuring along with it.
 *
 * `index` is continuous (2.4 = 40% of the way from card 2 to card 3), so the
 * layout interpolates against it and every card responds to the gesture.
 */

const WHEEL_DIVISOR = 220; // wheel px per card
const DRAG_DIVISOR = 190; // pointer px per card

// Settle spring. Damping ratio ~0.82 — under 1 so it feels alive, but high
// enough that it eases into the card without visibly overshooting past it.
const SETTLE_STIFFNESS = 210;
const SETTLE_DAMPING_RATIO = 0.82;
// Rest thresholds. Two constants because they measure different dimensions:
// one is a distance in cards, the other a speed in cards/sec. A single 0.001
// for both made the velocity test ~1000x stricter than the position test, so
// the spring ran a tail of frames after it had visually arrived.
const REST_DELTA = 0.001; // position: stop when this close to the target, in cards
const REST_VELOCITY = 0.01; // speed: and moving slower than this, in cards/sec

// Rubberband past the ends (same asymptote as the app's slider): the raw
// overshoot is squashed so it approaches a ceiling but never reaches it, then
// the release settle springs back to a real card.
const RUBBER_CEILING = 0.85; // most it can travel past the end, in cards
const RUBBER_RESISTANCE = 1.1; // overshoot (in cards) that reaches half the ceiling

// Wheel/trackpad overscroll bounce. Only a FAST scroll into an end bounces; a
// slow one just stops at the end card, so careful scrolling never wobbles.
// The bounce is the settle spring launched outward from the end card with the
// scroll's own speed, so it flies out and springs back on its own — no stretch
// to hold while a trackpad's momentum tail keeps pushing.
const WHEEL_BOUNCE_SPEED = 6; // cards/sec into the end needed to bounce (~1300px/s)
const WHEEL_BOUNCE_GAIN = 1; // scroll speed -> launch speed
// Launch cap. The settle spring is integrated per frame, which bleeds energy
// at big steps, so its overshoot depends on refresh rate: a 14 cards/sec
// launch peaks ~0.26 of a card past the end at 60Hz, ~0.33 at 120Hz.
const WHEEL_BOUNCE_MAX_LAUNCH = 14;
// Wheel events further apart than this start a new gesture: velocity resets,
// and a bounce stops swallowing the momentum tail that caused it.
const WHEEL_GESTURE_GAP_MS = 100;
const WHEEL_LINE_PX = 16; // deltaMode 1 (Firefox mouse wheels report lines)

/** Fold a value that has run past [0, max] back under resistance. */
function rubberband(v: number, max: number): number {
  const over = v < 0 ? v : v > max ? v - max : 0;
  if (over === 0) return v;
  const pull = Math.abs(over);
  const eased = (pull / (pull + RUBBER_RESISTANCE)) * RUBBER_CEILING;
  return over < 0 ? -eased : max + eased;
}

export function useCardDeck(axis: "x" | "y" = "x", count = 1, initial = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initial);
  const [hasInteracted, setHasInteracted] = useState(false);
  // Motion state is explicit rather than inferred from index. A wheel event can
  // clamp to an exact end index while the gesture is still live, and floating
  // point integration can cross a whole number before the spring is actually at
  // rest. Only the spring's rest condition is allowed to settle the deck.
  const [settled, setSettled] = useState(true);
  // Ref mirrors state so handlers read the live value without re-subscribing.
  const value = useRef(initial);
  const raf = useRef<number | null>(null);
  // Set inside the effect; lets a card click spring the deck to its index.
  const settleTo = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const max = count - 1;
    const clamp = (v: number) => Math.min(max, Math.max(0, v));
    // Hard-clamped commit for wheel/keyboard/settle — discrete moves land on
    // real cards, no bounce.
    const commit = (v: number) => {
      value.current = clamp(v);
      setIndex(value.current);
    };
    // Drag commit: resist past the ends so the deck bounces instead of
    // stopping dead, then the release settle springs it back.
    const commitDrag = (v: number) => {
      value.current = rubberband(v, max);
      setIndex(value.current);
    };
    const stopSettle = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };

    // Spring to the nearest whole card on release — integrated each frame so
    // the motion has real spring character rather than a fixed-duration tween.
    // `launch` is an initial velocity in cards/sec — the wheel bounce starts
    // the spring AT the end card moving outward, and lets it come back.
    const settle = (target?: number, launch = 0) => {
      stopSettle();
      // Clamp the target: a rubberbanded overshoot rounds to an index outside
      // the deck, so snap to the real end card. On a card click, `target` is
      // that card's index.
      const to = clamp(target ?? Math.round(value.current));
      // A press/release or boundary key can ask to settle an already-resting
      // card. Keep ownership with the hero instead of flashing the deck copy.
      if (!launch && Math.abs(value.current - to) < REST_DELTA) {
        commit(to);
        setSettled(true);
        return;
      }
      setSettled(false);
      const damping = SETTLE_DAMPING_RATIO * 2 * Math.sqrt(SETTLE_STIFFNESS);
      let velocity = launch;
      let last = performance.now();

      const step = (now: number) => {
        // Clamp dt so a background-tab stall can't fling the spring.
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const x = value.current - to;
        const accel = -SETTLE_STIFFNESS * x - damping * velocity;
        velocity += accel * dt;
        const next = value.current + velocity * dt;

        if (
          Math.abs(next - to) < REST_DELTA &&
          Math.abs(velocity) < REST_VELOCITY
        ) {
          commit(to);
          setSettled(true);
          raf.current = null;
          return;
        }
        // Write raw, not clamped: settling from a rubberbanded overshoot passes
        // through the out-of-range region, and clamping would freeze it there.
        value.current = next;
        setIndex(next);
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    };

    let wheelIdle: ReturnType<typeof setTimeout>;
    let lastWheel = -Infinity;
    let wheelSpeed = 0; // smoothed, cards/sec, signed
    let bounceDir = 0; // direction of a live bounce whose momentum tail we swallow
    const onWheel = (e: WheelEvent) => {
      let delta =
        axis === "x"
          ? Math.abs(e.deltaX) > Math.abs(e.deltaY)
            ? e.deltaX
            : e.deltaY
          : e.deltaY;
      if (e.deltaMode === 1) delta *= WHEEL_LINE_PX;
      else if (e.deltaMode === 2) delta *= WHEEL_DIVISOR;
      if (!delta) return;
      e.preventDefault();
      setHasInteracted(true);

      const now = e.timeStamp;
      const gap = now - lastWheel;
      lastWheel = now;
      const dir = Math.sign(delta);
      const sameGesture = gap < WHEEL_GESTURE_GAP_MS;

      // A bounce is in flight: the trackpad's momentum tail (or the rest of a
      // fast wheel spin) keeps pushing into the end. Swallow it so the spring
      // can fly out and come back on its own; a pause or a reversal ends that.
      if (bounceDir !== 0) {
        if (dir === bounceDir && sameGesture) return;
        bounceDir = 0;
      }

      // Speed from consecutive events of one gesture. The first event of a
      // gesture has no interval, so it counts as zero — a single wheel notch
      // at the end must never bounce, however big its delta.
      const step = delta / WHEEL_DIVISOR;
      const instant = sameGesture ? step / (Math.max(gap, 8) / 1000) : 0;
      wheelSpeed = sameGesture ? wheelSpeed * 0.5 + instant * 0.5 : 0;

      stopSettle();
      setSettled(false);
      clearTimeout(wheelIdle);
      const next = value.current + step;

      const pastEnd = next < 0 || next > max;
      if (
        pastEnd &&
        Math.sign(wheelSpeed) === dir &&
        Math.abs(wheelSpeed) >= WHEEL_BOUNCE_SPEED
      ) {
        commit(next); // pin to the end card, then launch outward from it
        bounceDir = dir;
        settle(
          undefined,
          dir * Math.min(Math.abs(wheelSpeed) * WHEEL_BOUNCE_GAIN, WHEEL_BOUNCE_MAX_LAUNCH),
        );
        return;
      }

      commit(next);
      wheelIdle = setTimeout(settle, 110);
    };

    let dragging = false;
    let startPos = 0;
    let startIndex = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // The entire deck is one direct-manipulation surface. Starting on a
      // neighbour or the empty space between cards behaves exactly like
      // starting on the centred card.
      dragging = true;
      stopSettle();
      startPos = axis === "x" ? e.clientX : e.clientY;
      startIndex = value.current;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = axis === "x" ? e.clientX : e.clientY;
      if (Math.abs(now - startPos) >= 8) setHasInteracted(true);
      // Dragging left/up advances the deck, matching scroll direction.
      setSettled(false);
      commitDrag(startIndex - (now - startPos) / DRAG_DIVISOR);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "";
      settle();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const back = axis === "x" ? "ArrowLeft" : "ArrowUp";
      const fwd = axis === "x" ? "ArrowRight" : "ArrowDown";
      if (e.key !== back && e.key !== fwd) return;
      e.preventDefault();
      setHasInteracted(true);
      // Spring, don't hard-set: clicking a card glides it to centre, and the
      // keyboard deserves the same designed motion. settle() clamps its
      // target, so holding an arrow at either end just re-settles in place.
      settle(Math.round(value.current) + (e.key === fwd ? 1 : -1));
    };

    // Expose the spring so an external index change can drive the deck.
    settleTo.current = (i: number) => settle(i);

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("keydown", onKeyDown);

    return () => {
      stopSettle();
      clearTimeout(wheelIdle);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [axis, count]);

  /** Nearest whole card — use this for `focused`, never `d === 0`. Clamped:
   *  a rubberband past an end can round to -1 or count, which is no card. */
  const focusedIndex = Math.min(count - 1, Math.max(0, Math.round(index)));

  /** Spring the deck so card `i` becomes the centred one. */
  const goTo = (i: number) => settleTo.current(i);

  return { ref, index, focusedIndex, settled, hasInteracted, goTo };
}
