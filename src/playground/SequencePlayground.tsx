import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { DialTimeline, useDialKit, useDialTimeline } from "dialkit";
import { Card } from "../card/Card";
import { seedConfigs, type CardConfig } from "../card/cardConfig";
import { CarrierSheet } from "../confirm/CarrierSheet";
import { Envelope } from "../confirm/Envelope";
import { MailSlot } from "../confirm/MailSlot";
import { SheetCard } from "../confirm/SheetCard";
import { useStageScale } from "../confirm/useStageScale";
import { CARD, ENVELOPE_ENTER_Y } from "../confirm/geometry";
import {
  ENVELOPE_RISE_MM,
  TUG_MM,
  packetDipMM,
} from "../confirm/useWrapSequence";
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
  // Mirrors useWrapSequence at TEMPO 1.25 (beats x1.25; springs k/1.5625,
  // c/1.25 — same damping ratios as motionConfig) so this opens on the shipped
  // choreography; drag the clips to retime it. The app ties its second half to
  // MOMENTS of the beat before (packet 88% into the rising envelope -> flap
  // closes; flap past -15deg -> flip + packet hidden; flip past 150deg ->
  // slot). A timeline has no events, so those handoffs are baked in here as the
  // absolute times they land at with the shipped springs (simulated: close
  // 1.309, flip 1.593, slot 1.843). Retune a spring here and those clips will
  // NOT follow it the way the app's handoffs do — move them.
  const t = useDialTimeline(
    "Wrap sequence",
    {
      duration: 4.6,

      // Sheet beat. The hero disappears instantly — the sheet card (opacity =
      // 1 - restOpacity) takes over on the same frame, pixel-identical — while
      // the PAPER fades in under it and the card shrinks to sequence size.
      sheet: {
        at: 0,
        props: {
          restOpacity: {
            from: 1,
            to: 0,
            duration: 0.01,
            transition: { type: "easing", duration: 0.01, ease: [0, 0, 1, 1] },
          },
          sheetOpacity: {
            from: 0,
            to: 1,
            duration: 0.3,
            transition: { type: "easing", duration: 0.3, ease: [0.32, 0.72, 0, 1] },
          },
          // `arrive` at tempo. Lerp factor 1 -> 0 (restScale -> 1).
          cardScale: {
            from: 1,
            to: 0,
            duration: 0.6,
            transition: { type: "spring", stiffness: 128, damping: 22.4 },
          },
        },
      },

      // Wireframe printing — early, so the sheet reads as a letter before it
      // folds.
      printing: {
        at: 0.125,
        duration: 0.3125,
        from: { printOpacity: 0 },
        to: { printOpacity: 1 },
        transition: { type: "easing", duration: 0.3125, ease: [0.32, 0.72, 0, 1] },
      },

      // The two folds (`fold` at tempo), an EVEN beat apart: bottom up at
      // 0.4375, top down at 0.775 — the same spacing as fold 2 -> insert.
      folds: {
        at: 0.4375,
        from: { rotBottom: 0, rotTop: 0 },
        steps: [
          {
            duration: 0.3375,
            to: { rotBottom: -180 },
            transition: { type: "spring", stiffness: 141, damping: 20.8 },
          },
          {
            duration: 0.45,
            to: { rotTop: 180 },
            transition: { type: "spring", stiffness: 141, damping: 20.8 },
          },
        ],
      },

      // Envelope fades in below the packet DURING fold 2, rising the last 10mm
      // into its entry point (`wrap` at tempo). envRise is the entry y as a
      // multiple of ENVELOPE_ENTER_Y: (69 + 10) / 69 -> 1.
      envelope: {
        at: 0.775,
        props: {
          envOpacity: {
            from: 0,
            to: 1,
            duration: 0.3375,
            transition: { type: "easing", duration: 0.3375, ease: [0.32, 0.72, 0, 1] },
          },
          envRise: {
            from: (ENVELOPE_ENTER_Y + ENVELOPE_RISE_MM) / ENVELOPE_ENTER_Y,
            to: 1,
            duration: 0.45,
            transition: { type: "spring", stiffness: 166, damping: 24 },
          },
        },
      },

      // The insert, as one motion: the envelope rises all the way to centre
      // (`insert` at tempo) and the packet dips down into it and is carried
      // back up — the dip is derived from envLerp below, exactly as the app
      // slaves the packet to envY.
      insert: {
        at: 1.1125,
        duration: 0.6,
        from: { envLerp: 1 },
        to: { envLerp: 0 },
        transition: { type: "spring", stiffness: 128, damping: 22.4, mass: 1.1 },
      },

      // Flap closes as the paper goes in (88% into the rising envelope).
      close: {
        at: 1.309,
        duration: 0.45,
        from: { flapRot: -165, flapLift: 1 },
        to: { flapRot: 0, flapLift: 0 },
        transition: { type: "spring", stiffness: 141, damping: 20.8 },
      },

      // The whole packet layer is hidden as the flip starts — nothing shows
      // behind the envelope as it turns.
      hidePacket: {
        at: 1.593,
        duration: 0.01,
        from: { packetOpacity: 1 },
        to: { packetOpacity: 0 },
        transition: { type: "easing", duration: 0.01, ease: [0, 0, 1, 1] },
      },

      // Flip (`flip` at tempo) as the flap passes -15deg, the envelope still
      // rising — no hold. Its settle rock is the punctuation.
      flip: {
        at: 1.593,
        duration: 0.85,
        from: { flipRot: 0 },
        to: { flipRot: 180 },
        transition: { type: "spring", stiffness: 115, damping: 17.6, mass: 1.1 },
      },

      // Slot arrives during the rock (flip past 150deg), hint 0.35s later.
      slot: {
        at: 1.843,
        props: {
          slotOpacity: {
            from: 0,
            to: 1,
            duration: 0.5,
            transition: { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] },
          },
          slotScaleX: {
            from: 0.9,
            to: 1,
            duration: 0.5,
            transition: { type: "spring", stiffness: 166, damping: 24 },
          },
        },
      },
      hint: {
        at: 2.193,
        duration: 0.375,
        from: { hintOpacity: 0 },
        to: { hintOpacity: 1 },
        transition: { type: "easing", duration: 0.375, ease: [0.32, 0.72, 0, 1] },
      },

      // Idle tug, 0.4s after the hint: two pulls down (mm) and back — the app's
      // keyframes [0, 7, 0, 4.34, 0] at times [0, .22, .46, .66, 1] of 1.875s,
      // easeInOut.
      tug: {
        at: 2.593,
        from: { tugMM: 0 },
        steps: [
          {
            duration: 0.4125,
            to: { tugMM: TUG_MM },
            transition: { type: "easing", duration: 0.4125, ease: [0.42, 0, 0.58, 1] },
          },
          {
            duration: 0.45,
            to: { tugMM: 0 },
            transition: { type: "easing", duration: 0.45, ease: [0.42, 0, 0.58, 1] },
          },
          {
            duration: 0.375,
            to: { tugMM: TUG_MM * 0.62 },
            transition: { type: "easing", duration: 0.375, ease: [0.42, 0, 0.58, 1] },
          },
          {
            duration: 0.6375,
            to: { tugMM: 0 },
            transition: { type: "easing", duration: 0.6375, ease: [0.42, 0, 0.58, 1] },
          },
        ],
      },
    },
    // New key per schedule change, so state tuned against an older schedule
    // can't load over these defaults.
    { autoplay: false, loop: false, persist: { key: "dialkit:wrap-sequence-t125" } },
  );

  // --- Bind timeline output to the real components' MotionValues ------------
  // useWrapSequence owns these in the app; here the timeline is the driver.
  const restOpacity = useMotionValue(1);
  const cardScale = useMotionValue(1);
  const sheetOpacity = useMotionValue(0);
  const packetOpacity = useMotionValue(1);
  const sheetY = useMotionValue(0);
  const printOpacity = useMotionValue(0);
  const rotBottom = useMotionValue(0);
  const rotTop = useMotionValue(0);
  const envOpacity = useMotionValue(0);
  const envY = useMotionValue(0);
  const flapRot = useMotionValue(-165);
  const flapLift = useMotionValue(1);
  // The bench has no phase machine, so the packet is never clipped here.
  const sheetClip = useMotionValue("inset(0 0 0 0)");
  // The wax seal is cut; held at its end state like the app does.
  const sealScale = useMotionValue(1);
  const sealRot = useMotionValue(0);
  const flipRot = useMotionValue(0);
  const slotOpacity = useMotionValue(0);
  const slotScaleX = useMotionValue(0.9);
  const slotSwallow = useMotionValue(1);
  const hintOpacity = useMotionValue(0);

  // The card's rest scale (it renders at 85.6mm and is scaled UP to --slide-w
  // at rest, then settles to 1 through the sheet beat).
  const cardPx = CARD.w * mmPx;
  const restScale = cardPx > 0 ? slideW / cardPx : 1;

  useEffect(() => {
    // A props clip reports number | string (tracks may carry CSS values); every
    // track here is numeric, so narrow once at the boundary.
    const n = (v: number | string) => (typeof v === "number" ? v : Number(v));
    const sheetTrack = t.sheet.current;

    // `current` is the value interpolated at the playhead, so this is exact
    // while scrubbing — not just at clip boundaries.
    restOpacity.set(n(sheetTrack.restOpacity));
    // cardScale runs restScale -> 1; the clip carries 1 -> 0 as a lerp factor.
    cardScale.set(1 + (restScale - 1) * n(sheetTrack.cardScale));
    // The app keys the mid panel's raised z-index off data-phase="rest" (until
    // the first fold). The bench has no phase machine, so derive it.
    if (stageRef.current) {
      stageRef.current.dataset.phase =
        t.folds.current.rotBottom === 0 ? "rest" : "folding";
    }
    // The paper's fade; the whole packet layer is switched off separately.
    sheetOpacity.set(n(sheetTrack.sheetOpacity));
    packetOpacity.set(t.hidePacket.current.packetOpacity);
    printOpacity.set(t.printing.current.printOpacity);
    rotBottom.set(t.folds.current.rotBottom);
    rotTop.set(t.folds.current.rotTop);
    envOpacity.set(n(t.envelope.current.envOpacity));
    flapRot.set(t.close.current.flapRot);
    flapLift.set(t.close.current.flapLift);
    flipRot.set(t.flip.current.flipRot);
    slotOpacity.set(n(t.slot.current.slotOpacity));
    slotScaleX.set(n(t.slot.current.slotScaleX));
    hintOpacity.set(t.hint.current.hintOpacity);
    // Travel values are unit lerps in the timeline, scaled to mm here so the
    // dials stay readable (0..1) instead of raw millimetre counts.
    // Envelope: entry rise, then the insert's rise to centre, plus the tug.
    const envMM =
      n(t.envelope.current.envRise) * t.insert.current.envLerp * ENVELOPE_ENTER_Y;
    envY.set((envMM + t.tug.current.tugMM) * mmPx);
    // Packet dips into the rising envelope — the app's exact mapping.
    sheetY.set(packetDipMM(envMM) * mmPx);
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
  const flapShade = useTransform(flapRot, [-165, -90, 0], [0.2, 0.3, 0]);
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
        <motion.div className="wrap-scene">
          {/* At-rest card, standing in for the app's persistent hero. */}
          <motion.div
            className="card-holder--rest"
            style={{ opacity: restCardOpacity, gridArea: "1 / 1" }}
          >
            <Card config={config} name="ALEX RIVERA" />
          </motion.div>

          <CarrierSheet v={values}>
            <SheetCard
              cardScale={cardScale}
              restScale={restScale}
              restOpacity={restOpacity}
            >
              <Card config={config} name="ALEX RIVERA" />
            </SheetCard>
          </CarrierSheet>

          <Envelope
            v={values}
            firstName="Alex"
            interactive={false}
            draggable={false}
            onPost={noop}
            dragProps={noDrag}
            dragScale={one}
            dragTilt={zero}
            vanish={one}
          />

          {/* No post gesture on this bench, so the slot never closes: both
              close/fade are pinned open. */}
          {scene.showSlot && <MailSlot v={values} close={one} fade={one} />}
        </motion.div>
      </div>

      {/* productionEnabled for the same reason as DialRoot in Playground.tsx:
          dialkit's components self-hide in production builds, so the timeline
          dock was null on the deployed URL. */}
      {/* defaultVisible keeps the dock on screen; defaultOpen={false} leaves it
          collapsed, so the scene is unobstructed until you reach for it. The
          two are independent props in dialkit. */}
      <DialTimeline defaultVisible defaultOpen={false} productionEnabled />
    </div>
  );
}
