import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import {
  arrive,
  crossfade,
  flip,
  fold,
  insert,
  wrap,
} from "../lib/motionConfig";
import { CARD, ENVELOPE, ENVELOPE_ENTER_Y } from "./geometry";

/**
 * The whole wrap sequence (~1.8s to grabbable), as MotionValues plus a beat schedule.
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

/**
 * Global tempo. Every beat time and every duration in this file is multiplied
 * by it, so the choreography keeps its proportions and only the pace changes —
 * one dial instead of thirteen numbers to keep in sync.
 */
const TEMPO = 1.25;
/** The flap's close runs this much slower than the fold spring it shares a
 *  character with, so the seal reads as its own deliberate moment. It only
 *  starts once the paper is fully inside, so its pace can't expose paper. */
const FLAP_SLOW = 1.3;
/** Scale a base duration/beat by the global tempo. */
const slow = (seconds: number) => seconds * TEMPO;
/**
 * Slow a spring by the same tempo. Stiffness by 1/T² and damping by 1/T keeps
 * the damping ratio exactly, so the character (bounce, overshoot) is the
 * motionConfig tuning and only the pace changes. Springs AND beats ride the
 * one dial, so the event-tied handoffs keep landing where they were tuned.
 */
const tempo = (t: Transition): Transition =>
  t.type === "spring" && typeof t.stiffness === "number" && typeof t.damping === "number"
    ? { ...t, stiffness: t.stiffness / TEMPO ** 2, damping: t.damping / TEMPO }
    : t;
const S = {
  arrive: tempo(arrive),
  fold: tempo(fold),
  insert: tempo(insert),
  flip: tempo(flip),
  wrap: tempo(wrap),
  // The flap closes FLAP_SLOW x slower than the folds (same damping ratio).
  flap: tempo({
    ...fold,
    stiffness: (fold as { stiffness: number }).stiffness / FLAP_SLOW ** 2,
    damping: (fold as { damping: number }).damping / FLAP_SLOW,
  }),
};

/**
 * Beat times in seconds from the arrow press, before TEMPO.
 *
 * Only the first act is on the clock. Every beat from the flap close on is
 * hooked to a MOMENT of the beat before it (see the thresholds below) rather
 * than to a guessed delay, so the handoffs overlap and stay locked to their
 * cause when a spring is retuned.
 *
 * It reads as THREE motions, with overlap inside each and a short hold between:
 *
 *   1. Fold the card in — the card settles onto the sheet, then the two folds
 *      on an even beat (~0.33s apart). Hold once fold 2 has landed.
 *   2. Into the envelope — the envelope fades in in place, then rises to centre
 *      as the packet dips into it and is carried up. Hold once it's fully in.
 *   3. Close, then flip — the flap closes, and the flip starts as it lands.
 *      The flip's settle rock is the punctuation.
 *
 * Every hold hangs off the previous motion actually landing (an event), not a
 * timer, so the gaps survive retuning. Grabbable at ~3.5s.
 */
const BEAT_BASE = {
  sheet: 0,
  printing: 0.1, // early enough that the sheet reads as a letter before it folds
  fold1: 0.35, // as the card's size settles
  fold2: 0.62, // one fold-length later — the folds keep an even overlap
} as const;

const BEAT = Object.fromEntries(
  Object.entries(BEAT_BASE).map(([k, v]) => [k, slow(v)]),
) as Record<keyof typeof BEAT_BASE, number>;

/** Event-tied handoffs. */
const HANDOFF = {
  /** Envelope enters once fold 2 has landed — past this angle (of 180). The
   *  fold spring barely overshoots (ζ 0.876), so 178 is "landed". */
  envelopeAtFoldDeg: 178,
  /** Hold between motion 1 (folding) and motion 2 (into the envelope), before
   *  TEMPO: the folded packet reads as finished before the envelope appears. */
  envelopeHold: 0.16,
  /** The insert counts as finished when the envelope is this close (mm) to
   *  centre — the paper is fully in. */
  insertSettledMM: 0.5,
  /** Hold between motion 2 and motion 3 (close + flip), before TEMPO. The flap
   *  only closes over paper that is already fully inside, so nothing can poke
   *  out over it. */
  flapHold: 0.12,
  /** Flip starts when the flap has LANDED (flat, past this angle) — "close,
   *  then flip", the two steps of motion 3, back to back. */
  flipAtFlapDeg: -2,
  /** Slot arrives once the flip has passed this angle — name readable. */
  slotAtFlipDeg: 150,
  /** Envelope becomes draggable this long after the flip starts (its rock
   *  is still settling, which is fine to grab through), before TEMPO. */
  idleAfterFlip: 0.45,
  /** Hint follows the slot, before TEMPO. */
  hintAfterSlot: 0.28,
  /** Tug waits until the hint is visible, before TEMPO. */
  tugAfterHint: 0.32,
} as const;


/**
 * How far the packet dips (mm) as the envelope rises over it. The envelope
 * must end at stage centre (the slot and drag geometry hang off envY = 0), so
 * the pair can't meet anywhere else; instead the packet slides DOWN into the
 * rising envelope and is carried back up with it — both visibly moving at
 * once. Shaped as sin(π·progress) of the envelope's rise; under ~22mm the
 * packet never moves backwards relative to the envelope.
 */
export const INSERT_DIP_MM = 18;
/**
 * How much further below its old entry point (ENVELOPE_ENTER_Y) the envelope
 * fades in, in mm: 21mm is ~48px at the desktop stage scale, and like every
 * dimension here it scales with the stage. The insert's rise covers the extra
 * distance. Below the slot's mouth, so the envelope's post clip is only
 * applied once it is grabbable (see Envelope's `clipped`).
 */
export const ENVELOPE_ENTER_DROP_MM = 21;
/** Where the envelope fades in, in mm below stage centre. */
export const ENVELOPE_ENTRY_MM = ENVELOPE_ENTER_Y + ENVELOPE_ENTER_DROP_MM;
/** Packet y (mm) for a given envelope y (mm) during the insert. */
export function packetDipMM(envMM: number): number {
  const p = Math.min(1, Math.max(0, 1 - envMM / ENVELOPE_ENTRY_MM));
  return INSERT_DIP_MM * Math.sin(Math.PI * p);
}

/** Reduced-motion path: two crossfades, 0.7s total (PLAN.md §7). */
const REDUCED = { swap: 0.35 } as const;

/** How far the idle tug pulls the envelope, in mm. Small — it's a hint that
 *  the object is grabbable, not a demonstration of the whole travel. */
export const TUG_MM = 7;

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

  // Read inside MotionValue transforms, which build their mapper once and would
  // otherwise capture the first render's values forever.
  const mmPxRef = useRef(mmPx);
  mmPxRef.current = mmPx;
  // The packet is only clipped once it is actually going into the envelope.
  const insertingRef = useRef(false);
  insertingRef.current =
    phase === "inserting" ||
    phase === "sealing" ||
    phase === "flipping" ||
    phase === "idle" ||
    phase === "posting" ||
    phase === "done";

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
  // No sheet scale: the card is the lead and lands ON the sheet. The sheet
  // growing while the card shrinks read as two objects pulling apart.
  const sheetOpacity = useMotionValue(0);
  /** The whole packet layer (paper, print, casts). sheetOpacity fades only the
   *  paper, so hiding the packet behind the flip needs its own switch. */
  const packetOpacity = useMotionValue(1);
  const sheetY = useMotionValue(0);
  const printOpacity = useMotionValue(0);
  const rotBottom = useMotionValue(0); // 0 → -180
  const rotTop = useMotionValue(0); // 0 → +180

  // --- Envelope ------------------------------------------------------------
  const envOpacity = useMotionValue(0);
  const envY = useMotionValue(0);
  const flapRot = useMotionValue(-165);
  // The flap hinges 1.5mm below the envelope's top edge so its square corners
  // don't hang past the body's rounded ones while it lies open (see .env-flap).
  // That offset would leave it sitting low once closed, so it slides up to the
  // edge just before the fold: 1 = parked at the radius, 0 = flush with the top.
  const flapLift = useMotionValue(1);
  const sealScale = useMotionValue(0);
  const sealRot = useMotionValue(-8);
  const flipRot = useMotionValue(0);

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

  // Packet clip. The sheet is 192mm tall and the envelope only 70mm, so once
  // the packet descends into the pocket its unfolded thirds hang out above and
  // below the envelope. The masking plate used to hide the lower overhang by
  // accident; with the plate gone the packet has to be clipped explicitly.
  //
  // The cut is from the BOTTOM, at the envelope's mouth: paper that has passed
  // below the mouth line is inside the pocket and must not be drawn, while
  // everything still above the line is the part not yet posted and stays fully
  // visible. That is what makes the packet appear to slide INTO the envelope.
  //
  // This used to cut from the top with `inset(calc(50% + mouth) 0 0 0)`, which
  // is the exact inverse: it kept what was below the mouth and erased what was
  // above it. Because the packet starts at stage centre (top -32mm, bottom
  // +32mm) and the mouth sits at +34mm, the WHOLE packet was above the line the
  // instant `inserting` began — so it blanked completely for the 375ms before
  // BEAT.insert, then grew downward out of the mouth as it descended. It read
  // as the packet emerging FROM the envelope rather than entering it.
  //
  // envY is tracked live so the line follows the envelope (they rise together
  // at BEAT.close). Expressed in the STAGE's coordinates — the wrapper is
  // stage-sized and static — so `50% + mouth` is the distance from the stage's
  // top to the mouth, and the bottom inset is the stage's remaining half below
  // it. Only applies from `inserting` on: before that the sheet is the whole
  // subject and must not be cut.
  const sheetClip = useTransform([envY, sheetY], ([ey]: number[]) => {
    if (!insertingRef.current) return "inset(0 0 0 0)";
    // Envelope's top edge (the mouth), in px from stage centre.
    const mouth = Math.round(ey - (ENVELOPE.h / 2) * mmPxRef.current);
    // Inset from the stage's BOTTOM up to that line.
    return `inset(0 0 calc(50% - ${mouth}px) 0)`;
  });

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
      packetOpacity,
      sheetY,
      printOpacity,
      rotBottom,
      rotTop,
      envOpacity,
      envY,
      flapRot,
      flapLift,
      sealScale,
      sealRot,
      flipRot,
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
      sheetClip,
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
  // Beats scheduled but not yet run. Distinct from `timers`, which keeps every
  // id it ever created (including fired ones) purely so clear() can cancel in
  // bulk — so its length says nothing about what is still outstanding. The
  // visibility recovery below needs exactly that question answered.
  const pendingBeats = useRef(0);
  /** Unsubscribers for event-tied beats (see `when`). */
  const listeners = useRef<(() => void)[]>([]);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    listeners.current.forEach((off) => off());
    listeners.current = [];
    pendingBeats.current = 0;
  }, []);

  const at = useCallback((seconds: number, run: () => void) => {
    pendingBeats.current++;
    timers.current.push(
      window.setTimeout(() => {
        pendingBeats.current--;
        run();
      }, seconds * 1000),
    );
  }, []);

  // Event-tied beats: run once, the first frame `mv` passes `test`. Counted as
  // pending like a timer, and torn down by clear(), so the rewind and the
  // visibility recovery cancel them exactly as they cancel timed beats.
  const when = useCallback(
    (mv: MotionValue<number>, test: (v: number) => boolean, run: () => void) => {
      pendingBeats.current++;
      let fired = false;
      const off = mv.on("change", (value) => {
        if (fired || !test(value)) return;
        fired = true;
        off();
        pendingBeats.current--;
        run();
      });
      listeners.current.push(off);
    },
    [],
  );

  useEffect(() => {
    if (!started || mmPx <= 0) return;
    startedRef.current = true;

    // The sequence's END STATE: sealed, flipped, addressed, slot open, hint up.
    // Shared by the reduced-motion path (which goes straight here) and the
    // backgrounded-tab recovery below, so there is one definition of "packed"
    // rather than two that can drift.
    const settleToIdle = (duration: number) => {
      const t = { duration };
      // .set() does NOT stop an animation already running on the value (same
      // trap the rewind effect below documents). On the reduced-motion path
      // nothing is in flight, but the visibility recovery interrupts a live
      // sequence — without the stop, an in-flight fold keeps writing over these.
      const hardSet = (mv: MotionValue<number>, v: number) => {
        mv.stop();
        mv.set(v);
      };
      hardSet(flipRot, 180);
      hardSet(flapRot, 0);
      hardSet(flapLift, 0); // arrives already closed, so already flush
      hardSet(sealScale, 1);
      hardSet(sealRot, 0);
      // Mid-fold/mid-insert values. Unset on the reduced-motion path (nothing
      // ever moved them), but the recovery can land here with the packet half
      // folded and the envelope still parked below its entry point.
      hardSet(rotBottom, -180);
      hardSet(rotTop, 180);
      hardSet(sheetY, 0);
      hardSet(packetOpacity, 0);
      hardSet(envY, 0);
      animate(cardScale, restScale, t);
      animate(restOpacity, 0, t);
      animate(sheetOpacity, 0, t);
      animate(envOpacity, 1, t);
      animate(slotOpacity, 1, t);
      animate(slotScaleX, 1, t);
      animate(hintOpacity, 1, t);
      setPhase("idle");
    };

    if (reduce) {
      // Two crossfades, no folds, no flip. The card and sheet leave; a sealed,
      // addressed envelope arrives in their place.
      settleToIdle(REDUCED.swap);
      return clear;
    }

    // Backgrounding the tab clamps setTimeout, so every beat still pending when
    // the tab is hidden lands bunched together on return — the fold, insert,
    // seal and flip firing within a few hundred ms of each other, which reads as
    // a glitch rather than as choreography. The sequence is a performance; if
    // the audience left mid-way there is nothing to perform.
    //
    // So on returning to a tab that was hidden while beats were outstanding,
    // cancel the rest and settle straight to the packed state. The user gets the
    // sealed envelope ready to drag, which is where the sequence was going.
    // Only recover if the sequence was actually mid-flight when we left; a tab
    // switch after the envelope is already idle must not re-run the settle.
    let hiddenMidSequence = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenMidSequence = pendingBeats.current > 0;
        return;
      }
      if (!hiddenMidSequence) return;
      hiddenMidSequence = false;
      clear();
      settleToIdle(REDUCED.swap);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Any press or key after the envelope is grabbable cancels the tug: the
    // drag handler stops envY on pointerdown, but a tug that STARTED after that
    // pointerdown would yank the envelope out from under the user's finger.
    let touched = false;
    const onTouch = () => {
      touched = true;
    };
    document.addEventListener("pointerdown", onTouch);
    document.addEventListener("keydown", onTouch);

    at(BEAT.sheet, () => {
      // Hand the hero card off to the copy on the sheet with a hard SWAP, not
      // a crossfade. The sheet card's opacity is 1 - restOpacity, so this one
      // set hides the hero and shows the copy in the same frame — the hero
      // disappears instantly. At that frame the two are pixel-identical (same
      // width, same native shadows), so the swap is invisible.
      restOpacity.stop();
      restOpacity.set(0);
      // The PAPER fades in beneath it; the card itself never fades.
      animate(sheetOpacity, 1, crossfade);
      animate(cardScale, 1, S.arrive);
    });
    at(BEAT.printing, () => {
      animate(printOpacity, 1, { duration: slow(0.25), ease: crossfade.ease });
    });
    at(BEAT.fold1, () => {
      setPhase("folding");
      animate(rotBottom, -180, S.fold);
    });
    at(BEAT.fold2, () => {
      animate(rotTop, 180, S.fold);
    });
    // Motion 2. The envelope waits for the folds to finish completely, holds a
    // beat, then fades in IN PLACE below the packet — no movement of its own
    // until the insert.
    when(rotTop, (r) => r >= HANDOFF.envelopeAtFoldDeg, () => {
      setPhase("inserting");
      // jump(), not set(): set() records the 0 -> entry leap as velocity, and
      // the insert's animate() later inherits it — the envelope flew ~80mm
      // past its entry point. jump() places it with zero velocity.
      envY.jump(ENVELOPE_ENTRY_MM * mmPx);
      // The hold that separates motion 1 from motion 2.
      at(slow(HANDOFF.envelopeHold), () => {
        animate(envOpacity, 1, { duration: slow(0.27), ease: crossfade.ease });
      });
    });

    // The insert starts once the envelope has fully faded in — the envelope's
    // rise and the packet's dip begin together, as one motion: the envelope
    // rises all the way to centre while the packet dips down into it and is
    // carried back up (packetDipMM). The packet is slaved to the envelope's
    // rise, so they can never drift out of step.
    when(envOpacity, (o) => o >= 1, () => {
      const offDip = envY.on("change", (y) => {
        sheetY.set(packetDipMM(y / mmPxRef.current) * mmPxRef.current);
      });
      listeners.current.push(offDip);
      animate(envY, 0, S.insert);

      // Motion 3 waits for motion 2 to finish: envelope at centre, paper fully
      // in. Then a held beat, then the flap.
      when(
        envY,
        (y) => y <= HANDOFF.insertSettledMM * mmPxRef.current,
        () => at(slow(HANDOFF.flapHold), () => {
          // The lift runs first and fast: the flap slides the 1.5mm up to the
          // envelope's top edge, then folds from there, so it lands flush.
          animate(flapLift, 0, {
            duration: slow(0.16 * FLAP_SLOW),
            ease: crossfade.ease,
          });
          animate(flapRot, 0, S.flap);

          // Close, THEN flip: the flip starts as the flap lands flat. The
          // flip's own settle rock is the punctuation.
          when(
            flapRot,
            (r) => r >= HANDOFF.flipAtFlapDeg,
            () => {
              // The packet is done: stop slaving it to the envelope (the tug
              // and the post move envY later) and hide the WHOLE packet layer.
              // sheetOpacity only fades the paper now, so it left the mid
              // panel's printed outline and the fold casts visible behind the
              // envelope as it turned.
              offDip();
              packetOpacity.set(0);
              // The wax seal is cut (PRD note); keep its values at their end
              // state so the settle/rewind paths stay consistent.
              sealScale.set(1);
              sealRot.set(0);

              setPhase("flipping");
              animate(flipRot, 180, S.flip);
              at(slow(HANDOFF.idleAfterFlip), () => setPhase("idle"));
            },
          );
        }),
      );
    });

    // The slot arrives during the flip's settle, once the name is readable, so
    // the target is already there when the envelope becomes grabbable.
    when(
      flipRot,
      (r) => r >= HANDOFF.slotAtFlipDeg,
      () => {
        animate(slotOpacity, 1, { duration: slow(0.4), ease: crossfade.ease });
        animate(slotScaleX, 1, S.wrap);
        at(slow(HANDOFF.hintAfterSlot), () => {
          animate(hintOpacity, 1, { duration: slow(0.3), ease: crossfade.ease });
          at(slow(HANDOFF.tugAfterHint), () => {
            if (touched) return;
            // Tug the envelope down twice and let it snap back — the gesture
            // the chevron is asking for, performed once so it reads as "this
            // thing moves, and it moves DOWN". Keyframes on one animate() call
            // so the two pulls are one interruptible animation: the drag
            // handler stops envY on pointerdown, so grabbing mid-tug hands
            // control straight over.
            animate(
              envY,
              [0, TUG_MM * mmPx, 0, TUG_MM * 0.62 * mmPx, 0],
              {
                duration: slow(1.5),
                times: [0, 0.22, 0.46, 0.66, 1],
                ease: "easeInOut",
              },
            );
          });
        });
      },
    );

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onTouch);
      document.removeEventListener("keydown", onTouch);
      clear();
    };
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
    reset(packetOpacity, 1);
    reset(sheetY, 0);
    reset(printOpacity, 0);
    reset(rotBottom, 0);
    reset(rotTop, 0);
    reset(envOpacity, 0);
    reset(envY, 0);
    reset(flapRot, -165);
    reset(flapLift, 1);
    reset(sealScale, 0);
    reset(sealRot, -8);
    reset(flipRot, 0);
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
