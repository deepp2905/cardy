import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { snappy, snappyOptions, sliderStretch } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./controls.css";

// Ported from an earlier project of the author's. The rubberband here is safe
// (unlike the carousel's) because the track is a plain div with pointer
// handlers — there is no native scroll behaviour to fight.

type SliderProps = {
  value: number; // 0..1
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
};

/** Max additive stretch on either end; the damping curve asymptotes here. */
const MAX_STRETCH = 0.12;
/** Pixels of overshoot that give half of MAX_STRETCH. Higher = stiffer. */
const STRETCH_PIVOT_PX = 120;

/** Track height — mirrors --control-h. */
const TRACK_H = 60;
/** Thumb height at rest in the middle of the track. */
const THUMB_MAX = 34;
/** Thumb height at either extreme, where the pill's curve narrows it. */
const THUMB_MIN = 16;
/** Fraction of the track over which the thumb shrinks into the corner. */
const EDGE_ZONE = 0.06;

export function Slider({ value, onChange, label, disabled }: SliderProps) {
  const id = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();

  // The rendered position is a spring, so swapping the bound config (sliding
  // the carousel to another card) glides to the new value instead of jumping
  // — the retarget IS the micro-moment (PLAN.md Phase C). While the user is
  // dragging it must stay 1:1, so the spring is jumped, not set.
  const dragging = useRef(false);
  const display = useSpring(value, snappyOptions);
  useEffect(() => {
    if (dragging.current || reduce) display.jump(value);
    else display.set(value);
  }, [display, value, reduce]);

  const pctValue = useTransform(display, (v) => `${v * 100}%`);

  const [hovered, setHovered] = useState(false);

  // Thumb height: full in the middle, shrinking toward the rounded ends so it
  // never crowds the curve. `edge` is 0 at either extreme, 1 once clear of
  // the corner radius.
  const edge = Math.min(1, Math.min(value, 1 - value) / EDGE_ZONE);
  const thumbFull = hovered ? THUMB_MAX : THUMB_MAX / 1.5;
  const thumbH = THUMB_MIN + (thumbFull - THUMB_MIN) * edge;
  // Brief ease-in when the track is clicked without dragging; cleared on the
  // first move so an actual drag stays 1:1 with the pointer.
  const [animating, setAnimating] = useState(false);
  const dragStarted = useRef(false);
  const animTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Signed overshoot: + past the right end, − past the left.
  const overshoot = useMotionValue(0);
  const overshootSpring = useSpring(overshoot, sliderStretch);
  // Same rational asymptote as the reference: always >= 1, so the track only
  // ever grows; direction comes from the transform origin below.
  const trackScaleX = useTransform(overshootSpring, (o) => {
    const abs = Math.abs(o);
    return 1 + (MAX_STRETCH * abs) / (abs + STRETCH_PIVOT_PX);
  });
  // Anchor the far edge so the track stretches away from the pull.
  const trackOrigin = useTransform(overshootSpring, (o) =>
    o >= 0 ? "0% 50%" : "100% 50%",
  );

  // Measure against the UNSTRETCHED width — scaleX is anchored at one edge,
  // so rect.width already includes any current stretch.
  const baseRect = () => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { left: rect.left, width: rect.width / trackScaleX.get() };
  };

  const valueFromClientX = (clientX: number) => {
    const r = baseRect();
    if (!r) return value;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const updateOvershoot = (clientX: number) => {
    const r = baseRect();
    if (!r) return;
    if (clientX < r.left) overshoot.set(clientX - r.left);
    else if (clientX > r.left + r.width)
      overshoot.set(clientX - (r.left + r.width));
    else overshoot.set(0);
  };

  const release = () => {
    dragging.current = false;
    overshoot.set(0);
    if (!dragStarted.current) {
      animTimeout.current = setTimeout(() => setAnimating(false), 220);
    }
  };

  return (
    <div className="slider-field">
      <label className="slider-label" htmlFor={id}>
        {label}
      </label>
      <motion.div
        ref={trackRef}
        className={`slider-track${animating ? " is-animating" : ""}`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        // motion accepts MotionValues here; CSSProperties doesn't model that.
        style={
          {
            "--pct": pctValue,
            scaleX: trackScaleX,
            transformOrigin: trackOrigin,
          } as unknown as CSSProperties
        }
      >
        <div className="slider-fill" />
        <motion.div
          className="slider-thumb"
          aria-hidden="true"
          // Height, not scaleY: transform-scaling a fixed-px radius squashes
          // it flat on the scaled axis and the pill stops being round.
          // Centred in the 60px track at both sizes. Shrinks near the ends:
          // the track is a pill, so the usable height collapses with the
          // curve (only ~36px of the 60 is available 6px in from the edge).
          animate={{ height: thumbH, top: (TRACK_H - thumbH) / 2 }}
          transition={{ ...snappy, damping: 24 }}
        />
        <input
          id={id}
          type="range"
          className="slider-range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={(e) => {
            if (disabled) return;
            dragStarted.current = false;
            dragging.current = true;
            setAnimating(true);
            if (animTimeout.current) clearTimeout(animTimeout.current);
            // Capture so a drag started anywhere on the track keeps following
            // the pointer — native range inputs only drag from the thumb.
            e.currentTarget.setPointerCapture(e.pointerId);
            onChange(valueFromClientX(e.clientX));
            updateOvershoot(e.clientX);
          }}
          onPointerMove={(e) => {
            if ((e.buttons & 1) !== 1) return;
            if (!dragStarted.current) {
              dragStarted.current = true;
              setAnimating(false);
            }
            onChange(valueFromClientX(e.clientX));
            updateOvershoot(e.clientX);
          }}
          onPointerUp={release}
          onPointerCancel={release}
        />
      </motion.div>
    </div>
  );
}
