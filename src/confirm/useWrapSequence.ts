import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  arrive,
  crossfade,
  flip,
  fold,
  insert,
  stamp,
  wrap,
} from "../lib/motionConfig";
import { CARD, ENVELOPE_ENTER_Y, INSERT_TRAVEL } from "./geometry";

/**
 * The whole 3.85s wrap sequence, as MotionValues plus a beat schedule.
 * PRD-CONFIRM.md §4 — retimed, see note below.
 *
 * The PRD's beat sheet opened with an `arrive` beat that carried the card from
 * the carousel into the sheet via layoutId. The sequence now starts on the
 * arrow press on step 3 instead, so the card is *already* on screen at
 * `--slide-w` when the first beat fires. `arrive` therefore becomes a scale
 * settle (index.css requires the card not to resize between steps — it
 * resizes when the sequence starts, which is a different thing) and every
 * later beat shifts 0.35s earlier.
 */

export type Phase =
  | "rest" // card on screen, awaiting the arrow
  | "folding"
  | "inserting"
  | "sealing"
  | "flipping"
  | "idle" // sealed, addressed, awaiting the drag
  | "posting"
  | "done";

/** Beat times in seconds from the arrow press. */
const BEAT = {
  sheet: 0,
  printing: 0.35,
  fold1: 0.6,
  fold2: 0.85,
  envelope: 1.4,
  insert: 1.7,
  close: 2.25,
  seal: 2.7,
  hidePacket: 3.1,
  flip: 3.3,
  rest: 3.85,
  slot: 4.25,
  hint: 4.4,
} as const;

/** Reduced-motion path: two crossfades, 0.7s total (PLAN.md §7). */
const REDUCED = { swap: 0.35 } as const;

/** How far the idle tug pulls the envelope, in mm. Small — it's a hint that
 *  the object is grabbable, not a demonstration of the whole travel. */
const TUG_MM = 7;

export function useWrapSequence({
  mmPx,
  slideW,
  started,
  reduce,
  restOpacity,
}: {
  mmPx: number;
  slideW: number;
  started: boolean;
  reduce: boolean;
  /** The persistent hero's rest opacity, owned by App. The sequence fades it to
   *  0 as the in-sheet card takes over — an opacity crossfade between two nodes
   *  at the same position and size, so no pop. */
  restOpacity: MotionValue<number>;
}) {
  const [phase, setPhase] = useState<Phase>("rest");

  // --- Card -----------------------------------------------------------------
  // The card renders at its sequence size (85.6mm) and is scaled UP at rest so
  // it matches --slide-w, per index.css's "must not resize between steps".
  const cardPx = CARD.w * mmPx;
  const restScale = cardPx > 0 ? slideW / cardPx : 1;
  const cardScale = useMotionValue(1);
  // The resting card is the persistent hero (App-owned restOpacity). It hands
  // off to the in-sheet card as the sheet fades in — both at the same position
  // and size, so the crossfade can't pop.

  // --- Sheet ---------------------------------------------------------------
  const sheetOpacity = useMotionValue(0);
  const sheetScale = useMotionValue(0.97);
  const sheetY = useMotionValue(0);
  const printOpacity = useMotionValue(0);
  const rotBottom = useMotionValue(0); // 0 → -180
  const rotTop = useMotionValue(0); // 0 → +180

  // --- Envelope ------------------------------------------------------------
  const envOpacity = useMotionValue(0);
  const envY = useMotionValue(0);
  const flapRot = useMotionValue(-165);
  const sealScale = useMotionValue(0);
  const sealRot = useMotionValue(-8);
  const flipRot = useMotionValue(0);
  const nudgeY = useMotionValue(0);

  // --- Slot ----------------------------------------------------------------
  const slotOpacity = useMotionValue(0);
  const slotScaleX = useMotionValue(0.9);
  /** Driven by the post, not the timeline — the slot flexes as it swallows. */
  const slotSwallow = useMotionValue(1);
  const hintOpacity = useMotionValue(0);

  // Keep the resting card scale correct across resizes, but never fight the
  // sequence for control of the value once it has started.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && restScale > 0) cardScale.set(restScale);
  }, [restScale, cardScale]);

  // --- Derived: fold shading (PRD §5.2) ------------------------------------
  // Peak darkness edge-on to the light at 90°, settling to 0.14 on the landed
  // back face so the folded packet keeps layer separation.
  const bottomShade = useTransform(rotBottom, [-180, -90, 0], [0.14, 0.5, 0]);
  const topShade = useTransform(rotTop, [0, 90, 180], [0, 0.5, 0.14]);
  const bottomCast = useTransform(rotBottom, [-180, -90, 0], [0.12, 0.35, 0]);
  const topCast = useTransform(rotTop, [0, 90, 180], [0, 0.35, 0.12]);
  const bottomCastScale = useTransform(rotBottom, [-180, -90, 0], [1, 0.7, 0.2]);
  const topCastScale = useTransform(rotTop, [0, 90, 180], [0.2, 0.7, 1]);

  // Face swap by threshold, never backface-visibility (PRD §5.1).
  const bottomFront = useTransform(rotBottom, (r) => (Math.abs(r) > 90 ? 0 : 1));
  const bottomBack = useTransform(rotBottom, (r) => (Math.abs(r) > 90 ? 1 : 0));
  const topFront = useTransform(rotTop, (r) => (Math.abs(r) > 90 ? 0 : 1));
  const topBack = useTransform(rotTop, (r) => (Math.abs(r) > 90 ? 1 : 0));
  // Flap shading. Peaks edge-on and falls to nothing at both ends: 0.2 open
  // (the liner is already a darker stock, so it needs little help) and 0 closed
  // (the outside is the front of the envelope, lit like the pocket beside it).
  // The peak is well under the fold panels' 0.5 — a flap is thin card catching
  // light from the mouth, not a sheet turning edge-on to a lamp, and at 0.5 the
  // closed flap read as a dark wedge stuck to the envelope.
  const flapShade = useTransform(flapRot, [-165, -90, 0], [0.2, 0.3, 0]);

  // --- Derived: flip (PRD §5.5) --------------------------------------------
  const norm = (r: number) => ((r % 360) + 360) % 360;
  const isBack = (r: number) => norm(r) < 90 || norm(r) > 270;
  const envBackOpacity = useTransform(flipRot, (r) => (isBack(r) ? 1 : 0));
  const envFrontOpacity = useTransform(flipRot, (r) => (isBack(r) ? 0 : 1));
  // The shadow must shrink through the edge-on frame or the flip is weightless.
  const shadowScaleX = useTransform(
    flipRot,
    (r) => 0.3 + 0.7 * Math.abs(Math.cos((r * Math.PI) / 180)),
  );
  const shadowOpacity = useTransform(
    flipRot,
    (r) => 0.35 + 0.65 * Math.abs(Math.cos((r * Math.PI) / 180)),
  );

  const values = useMemo(
    () => ({
      cardScale,
      sheetOpacity,
      sheetScale,
      sheetY,
      printOpacity,
      rotBottom,
      rotTop,
      envOpacity,
      envY,
      flapRot,
      sealScale,
      sealRot,
      flipRot,
      nudgeY,
      slotOpacity,
      slotScaleX,
      slotSwallow,
      hintOpacity,
      bottomShade,
      topShade,
      bottomCast,
      topCast,
      bottomCastScale,
      topCastScale,
      bottomFront,
      bottomBack,
      topFront,
      topBack,
      flapShade,
      envBackOpacity,
      envFrontOpacity,
      shadowScaleX,
      shadowOpacity,
    }),
    // MotionValues are stable identities; this object never needs rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // --- Schedule ------------------------------------------------------------
  const timers = useRef<number[]>([]);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const at = useCallback((seconds: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, seconds * 1000));
  }, []);

  useEffect(() => {
    if (!started || mmPx <= 0) return;
    startedRef.current = true;

    if (reduce) {
      // Two crossfades, no folds, no flip. The card and sheet leave; a sealed,
      // addressed envelope arrives in their place.
      const t = { duration: REDUCED.swap };
      flipRot.set(180);
      flapRot.set(0);
      sealScale.set(1);
      sealRot.set(0);
      animate(cardScale, restScale, t);
      animate(restOpacity, 0, t);
      animate(sheetOpacity, 0, t);
      animate(envOpacity, 1, t);
      animate(slotOpacity, 1, t);
      animate(slotScaleX, 1, t);
      animate(hintOpacity, 1, t);
      setPhase("idle");
      return clear;
    }

    at(BEAT.sheet, () => {
      // Hand the hero card off from the standalone rest copy to the one on the
      // sheet: the sheet fades in as the rest card fades out, same beat.
      animate(restOpacity, 0, crossfade);
      animate(sheetOpacity, 1, crossfade);
      animate(sheetScale, 1, wrap);
      animate(cardScale, 1, arrive);
    });
    at(BEAT.printing, () => {
      animate(printOpacity, 1, { duration: 0.25, ease: crossfade.ease });
    });
    at(BEAT.fold1, () => {
      setPhase("folding");
      animate(rotBottom, -180, fold);
    });
    at(BEAT.fold2, () => {
      animate(rotTop, 180, fold);
    });
    at(BEAT.envelope, () => {
      setPhase("inserting");
      envY.set(ENVELOPE_ENTER_Y * mmPx);
      animate(envOpacity, 1, { duration: 0.3, ease: crossfade.ease });
    });
    at(BEAT.insert, () => {
      animate(sheetY, INSERT_TRAVEL * mmPx, insert);
    });
    at(BEAT.close, () => {
      // Flap closes while the pair rises to centre — one beat, two motions.
      animate(flapRot, 0, fold);
      animate(envY, 0, fold);
      animate(sheetY, 0, fold);
    });
    at(BEAT.seal, () => {
      setPhase("sealing");
      // `stamp` is under-damped (ζ ≈ 0.34), so a plain 0 → 1 produces the
      // ~1.15 overshoot the PRD asks for. No keyframes needed.
      animate(sealScale, 1, stamp);
      animate(sealRot, 0, stamp);
      nudgeY.set(-2);
      animate(nudgeY, 0, stamp);
    });
    at(BEAT.hidePacket, () => {
      // Fully occluded by now — stop compositing it.
      animate(sheetOpacity, 0, { duration: 0.2 });
    });
    at(BEAT.flip, () => {
      setPhase("flipping");
      animate(flipRot, 180, flip);
    });
    at(BEAT.rest, () => setPhase("idle"));
    at(BEAT.slot, () => {
      animate(slotOpacity, 1, { duration: 0.4, ease: crossfade.ease });
      animate(slotScaleX, 1, wrap);
    });
    at(BEAT.hint, () => {
      animate(hintOpacity, 1, { duration: 0.3, ease: crossfade.ease });
      // Tug the envelope down twice and let it snap back — the gesture the
      // chevron is asking for, performed once so it reads as "this thing
      // moves, and it moves DOWN". Keyframes on one animate() call so the two
      // pulls are one interruptible animation: the drag handler stops envY on
      // pointerdown, so grabbing mid-tug hands control straight over.
      animate(
        envY,
        [0, TUG_MM * mmPx, 0, TUG_MM * 0.62 * mmPx, 0],
        {
          duration: 1.5,
          times: [0, 0.22, 0.46, 0.66, 1],
          ease: "easeInOut",
        },
      );
    });

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, reduce, mmPx]);

  // Leaving the step (back button) rewinds everything. Each value is STOPPED
  // before it's set: clear() only cancels pending beats, and a MotionValue
  // .set() does not stop an animation already running on it — without the
  // stop, an in-flight fold/fade keeps writing after the reset and the rewind
  // silently loses.
  useEffect(() => {
    if (started) return;
    startedRef.current = false;
    clear();
    setPhase("rest");
    const reset = (mv: MotionValue<number>, v: number) => {
      mv.stop();
      mv.set(v);
    };
    reset(cardScale, restScale);
    reset(restOpacity, 1);
    reset(sheetOpacity, 0);
    reset(sheetScale, 0.97);
    reset(sheetY, 0);
    reset(printOpacity, 0);
    reset(rotBottom, 0);
    reset(rotTop, 0);
    reset(envOpacity, 0);
    reset(envY, 0);
    reset(flapRot, -165);
    reset(sealScale, 0);
    reset(sealRot, -8);
    reset(flipRot, 0);
    reset(nudgeY, 0);
    reset(slotOpacity, 0);
    reset(slotScaleX, 0.9);
    reset(slotSwallow, 1);
    reset(hintOpacity, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // restOpacity is App-owned and OUTLIVES this hook. If the component unmounts
  // while the sheet-beat crossfade is still animating it toward 0, that
  // animation keeps writing after unmount and the hero is left invisible the
  // next time the confirm step mounts. Stop it and hand it back at 1.
  useEffect(
    () => () => {
      restOpacity.stop();
      restOpacity.set(1);
    },
    [restOpacity],
  );

  return { phase, setPhase, values, restScale };
}

export type SequenceValues = ReturnType<typeof useWrapSequence>["values"];
