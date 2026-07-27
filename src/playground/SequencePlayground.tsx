import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { DialTimeline, useDialKit, useDialTimeline } from "dialkit";
import { Card } from "../card/Card";
import { seedConfigs, type CardConfig } from "../card/cardConfig";
import { CarrierSheet } from "../confirm/CarrierSheet";
import { Envelope } from "../confirm/Envelope";
import { MailSlot } from "../confirm/MailSlot";
import { useStageScale } from "../confirm/useStageScale";
import { CARD, ENVELOPE_ENTER_Y, INSERT_TRAVEL } from "../confirm/geometry";
import { useSlideW } from "../lib/useSlideW";
import "../confirm/confirm.css";
import "./playground.css";

/**
 * Wrap-sequence tuning bench.
 *
 * The shipped sequence (useWrapSequence) is a fixed beat schedule of setTimeouts
 * driving MotionValues — you can watch it, but you can't scrub it or retime a
 * beat without an edit-reload-rewatch loop. This page rebuilds the same
 * choreography as a dialkit TIMELINE: every beat is a clip you can drag along
 * the track, resize, and re-curve, with a scrubbable playhead.
 *
 * Crucially it drives the REAL components — CarrierSheet, Envelope, MailSlot,
 * the live Card — off the same MotionValue names useWrapSequence uses. So what
 * you tune here is what the app does, and the numbers transfer directly back
 * into BEAT / the transitions in motionConfig.
 *
 * Bind pattern: each clip's `current` is the interpolated value AT the playhead,
 * so scrubbing is exact — the scene is truly at that point in time whether
 * playing, paused, or dragged.
 */

const CARDS = seedConfigs();
const CARD_IDS = Object.keys(CARDS);

export function SequencePlayground() {
  const stageRef = useRef<HTMLDivElement>(null);
  const mmPx = useStageScale(stageRef);
  const slideW = useSlideW();

  // Which seeded card rides the sequence — the fold shading reads differently
  // on a dark vs a light face, so it's worth being able to swap.
  const [cardIdx, setCardIdx] = useState(2);
  const config: CardConfig = CARDS[CARD_IDS[cardIdx]];

  const scene = useDialKit("Scene", {
    card: {
      type: "select",
      options: CARD_IDS.map((_id, i) => ({
        value: String(i),
        label: `Card ${i + 1}`,
      })),
      default: "2",
    },
    showSlot: true,
  });
  useEffect(() => {
    const next = Number(scene.card);
    if (!Number.isNaN(next)) setCardIdx(next);
  }, [scene.card]);

  // --- The sequence, as a timeline -----------------------------------------
  // Times/durations mirror useWrapSequence's BEAT table so this opens on the
  // shipped choreography; drag the clips to retime it.
  const t = useDialTimeline(
    "Wrap sequence",
    {
      duration: 5.2,

      // Sheet fades in as the standalone rest card fades out, and the card
      // settles from its --slide-w rest scale down to sequence scale.
      sheet: {
        at: 0,
        duration: 0.6,
        from: { restOpacity: 1, sheetOpacity: 0, sheetScale: 0.97, cardScale: 1 },
        to: { restOpacity: 0, sheetOpacity: 1, sheetScale: 1, cardScale: 0 },
        transition: { type: "easing", duration: 0.6, ease: [0.32, 0.72, 0, 1] },
      },

      // Wireframe printing appears on the carrier.
      printing: {
        at: 0.35,
        duration: 0.25,
        from: { printOpacity: 0 },
        to: { printOpacity: 1 },
        transition: { type: "easing", duration: 0.25, ease: [0.32, 0.72, 0, 1] },
      },

      // The two folds, as one sequence clip: leg 1 brings the bottom panel up,
      // leg 2 brings the top panel down over it.
      folds: {
        at: 0.6,
        from: { rotBottom: 0, rotTop: 0 },
        steps: [
          {
            duration: 0.25,
            to: { rotBottom: -180 },
            transition: { type: "spring", stiffness: 220, damping: 26 },
          },
          {
            duration: 0.55,
            to: { rotTop: 180 },
            transition: { type: "spring", stiffness: 220, damping: 26 },
          },
        ],
      },

      // Envelope fades in below the packet, then the packet descends into it.
      envelope: {
        at: 1.4,
        duration: 0.3,
        from: { envOpacity: 0 },
        to: { envOpacity: 1 },
        transition: { type: "easing", duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      },
      insert: {
        at: 1.7,
        duration: 0.55,
        from: { sheetY: 0 },
        to: { sheetY: 1 },
        transition: { type: "spring", stiffness: 180, damping: 30 },
      },

      // Flap closes while the pair rises to centre — one beat, two motions.
      close: {
        at: 2.25,
        duration: 0.45,
        from: { flapRot: -165, envY: 1, packetY: 1 },
        to: { flapRot: 0, envY: 0, packetY: 0 },
        transition: { type: "spring", stiffness: 220, damping: 26 },
      },

      // Under-damped stamp: 0 -> 1 overshoots to ~1.15 on its own.
      seal: {
        at: 2.7,
        duration: 0.4,
        from: { sealScale: 0, sealRot: -8, nudgeY: -2 },
        to: { sealScale: 1, sealRot: 0, nudgeY: 0 },
        transition: { type: "spring", stiffness: 500, damping: 15 },
      },

      // Fully occluded by now — stop compositing the packet.
      hidePacket: {
        at: 3.1,
        duration: 0.2,
        from: { sheetOpacity2: 1 },
        to: { sheetOpacity2: 0 },
        transition: { type: "easing", duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      },

      // Flip to the addressed face.
      flip: {
        at: 3.3,
        duration: 0.55,
        from: { flipRot: 0 },
        to: { flipRot: 180 },
        transition: { type: "spring", stiffness: 200, damping: 26 },
      },

      // Slot arrives, then the drag hint.
      slot: {
        at: 4.25,
        duration: 0.4,
        from: { slotOpacity: 0, slotScaleX: 0.9 },
        to: { slotOpacity: 1, slotScaleX: 1 },
        transition: { type: "easing", duration: 0.4, ease: [0.32, 0.72, 0, 1] },
      },
      hint: {
        at: 4.4,
        duration: 0.3,
        from: { hintOpacity: 0 },
        to: { hintOpacity: 1 },
        transition: { type: "easing", duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      },
    },
    { autoplay: false, loop: false, persist: true },
  );

  // --- Bind timeline output to the real components' MotionValues ------------
  // useWrapSequence owns these in the app; here the timeline is the driver.
  const restOpacity = useMotionValue(1);
  const cardScale = useMotionValue(1);
  const sheetOpacity = useMotionValue(0);
  const sheetScale = useMotionValue(0.97);
  const sheetY = useMotionValue(0);
  const printOpacity = useMotionValue(0);
  const rotBottom = useMotionValue(0);
  const rotTop = useMotionValue(0);
  const envOpacity = useMotionValue(0);
  const envY = useMotionValue(0);
  const flapRot = useMotionValue(-165);
  const sealScale = useMotionValue(0);
  const sealRot = useMotionValue(-8);
  const flipRot = useMotionValue(0);
  const nudgeY = useMotionValue(0);
  const slotOpacity = useMotionValue(0);
  const slotScaleX = useMotionValue(0.9);
  const slotSwallow = useMotionValue(1);
  const hintOpacity = useMotionValue(0);

  // The card's rest scale (it renders at 85.6mm and is scaled UP to --slide-w
  // at rest, then settles to 1 through the sheet beat).
  const cardPx = CARD.w * mmPx;
  const restScale = cardPx > 0 ? slideW / cardPx : 1;

  useEffect(() => {
    // `current` is the value interpolated at the playhead, so this is exact
    // while scrubbing — not just at clip boundaries.
    restOpacity.set(t.sheet.current.restOpacity);
    // cardScale runs restScale -> 1; the clip carries 1 -> 0 as a lerp factor.
    cardScale.set(1 + (restScale - 1) * t.sheet.current.cardScale);
    // Packet opacity is the sheet fade in, gated by the later hidePacket fade.
    sheetOpacity.set(
      t.sheet.current.sheetOpacity * t.hidePacket.current.sheetOpacity2,
    );
    sheetScale.set(t.sheet.current.sheetScale);
    printOpacity.set(t.printing.current.printOpacity);
    rotBottom.set(t.folds.current.rotBottom);
    rotTop.set(t.folds.current.rotTop);
    envOpacity.set(t.envelope.current.envOpacity);
    flapRot.set(t.close.current.flapRot);
    sealScale.set(t.seal.current.sealScale);
    sealRot.set(t.seal.current.sealRot);
    nudgeY.set(t.seal.current.nudgeY * mmPx);
    flipRot.set(t.flip.current.flipRot);
    slotOpacity.set(t.slot.current.slotOpacity);
    slotScaleX.set(t.slot.current.slotScaleX);
    hintOpacity.set(t.hint.current.hintOpacity);
    // Travel values are unit lerps in the timeline, scaled to mm here so the
    // dials stay readable (0..1) instead of raw millimetre counts.
    sheetY.set(
      t.insert.current.sheetY * INSERT_TRAVEL * mmPx * t.close.current.packetY,
    );
    envY.set(t.close.current.envY * ENVELOPE_ENTER_Y * mmPx);
  });

  // Derived values the real components expect — same maths as useWrapSequence.
  const bottomShade = useTransform(rotBottom, [-180, -90, 0], [0.14, 0.5, 0]);
  const topShade = useTransform(rotTop, [0, 90, 180], [0, 0.5, 0.14]);
  const bottomCast = useTransform(rotBottom, [-180, -90, 0], [0.12, 0.35, 0]);
  const topCast = useTransform(rotTop, [0, 90, 180], [0, 0.35, 0.12]);
  const bottomCastScale = useTransform(rotBottom, [-180, -90, 0], [1, 0.7, 0.2]);
  const topCastScale = useTransform(rotTop, [0, 90, 180], [0.2, 0.7, 1]);
  const bottomFront = useTransform(rotBottom, (r) => (Math.abs(r) > 90 ? 0 : 1));
  const bottomBack = useTransform(rotBottom, (r) => (Math.abs(r) > 90 ? 1 : 0));
  const topFront = useTransform(rotTop, (r) => (Math.abs(r) > 90 ? 0 : 1));
  const topBack = useTransform(rotTop, (r) => (Math.abs(r) > 90 ? 1 : 0));
  const flapShade = useTransform(flapRot, [-165, -90, 0], [0.2, 0.5, 0]);
  const norm = (r: number) => ((r % 360) + 360) % 360;
  const isBack = (r: number) => norm(r) < 90 || norm(r) > 270;
  const envBackOpacity = useTransform(flipRot, (r) => (isBack(r) ? 1 : 0));
  const envFrontOpacity = useTransform(flipRot, (r) => (isBack(r) ? 0 : 1));
  const shadowScaleX = useTransform(
    flipRot,
    (r) => 0.3 + 0.7 * Math.abs(Math.cos((r * Math.PI) / 180)),
  );
  const shadowOpacity = useTransform(
    flipRot,
    (r) => 0.35 + 0.65 * Math.abs(Math.cos((r * Math.PI) / 180)),
  );

  const values = {
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
  };

  // The standalone rest card (the app's persistent hero) — here it's local,
  // driven by the same restOpacity the sheet beat fades out.
  const restCardOpacity = restOpacity;

  // Static stand-ins for the drag rig — this bench tunes the timed sequence,
  // not the post gesture, so the envelope is inert here.
  const noop = () => {};
  const noDrag: Record<string, unknown> = {};
  const one = useMotionValue(1);
  const zero = useMotionValue(0);

  return (
    <div className="seq-page">
      <div
        className="confirm-stage seq-stage"
        ref={stageRef}
        style={{ "--mm": `${mmPx}px` } as React.CSSProperties}
      >
        <motion.div className="wrap-scene" style={{ y: nudgeY }}>
          {/* At-rest card, standing in for the app's persistent hero. */}
          <motion.div
            className="card-holder--rest"
            style={{ opacity: restCardOpacity, gridArea: "1 / 1" }}
          >
            <Card config={config} name="ALEX RIVERA" />
          </motion.div>

          <CarrierSheet v={values}>
            <motion.div className="card-holder" style={{ scale: cardScale }}>
              <Card config={config} name="ALEX RIVERA" />
            </motion.div>
          </CarrierSheet>

          <Envelope
            v={values}
            firstName="Alex"
            interactive={false}
            onPost={noop}
            dragProps={noDrag}
            dragScale={one}
            dragTilt={zero}
            vanish={one}
          />

          {scene.showSlot && <MailSlot v={values} />}
        </motion.div>
      </div>

      <DialTimeline defaultVisible defaultOpen />
    </div>
  );
}
