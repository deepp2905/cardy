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
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduce = usePrefersReducedMotion();

  // Fraction of the track [0..1] that the label text occupies (measured below,
  // once trackScaleX exists). The thumb dims while it sits over that span so it
  // doesn't clutter the letters — the fill already reads the value there. Held
  // in a ref so the opacity transform reads the live value on every spring tick
  // without being rebuilt when it changes.
  const labelSpanRef = useRef(0);

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

  // Coalesce pointer-driven changes to one per frame. pointermove can outrun
  // paint (high-Hz mice fire at 500-1000Hz), and every onChange rebuilds the
  // bound card's pattern — up to ~1,000 SVG cells at the spacing floor. One
  // commit per frame is all the screen can show anyway. The native input's own
  // onChange (keyboard) stays direct: those events are discrete.
  const changeRaf = useRef(0);
  const pendingValue = useRef(0);
  const onChangeAtPaint = (v: number) => {
    pendingValue.current = v;
    if (changeRaf.current) return;
    changeRaf.current = requestAnimationFrame(() => {
      changeRaf.current = 0;
      onChange(pendingValue.current);
    });
  };
  useEffect(
    () => () => {
      cancelAnimationFrame(changeRaf.current);
      if (animTimeout.current) clearTimeout(animTimeout.current);
    },
    [],
  );

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
  // Both label copies counter the track's stretch by the same factor.
  const labelCounterScale = useTransform(trackScaleX, (s) => 1 / s);

  // Measure the label's width as a fraction of the track, re-measuring on
  // resize and when the label text changes.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const lbl = labelRef.current;
      if (!track || !lbl) return;
      const tw = track.getBoundingClientRect().width / trackScaleX.get();
      if (tw > 0) labelSpanRef.current = lbl.getBoundingClientRect().width / tw;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [label, trackScaleX]);

  // Dim the thumb to 25% while it overlaps the label text so it doesn't clutter
  // the letters — the fill already reads the value there. Rides on an OUTER
  // wrapper so the inner thumb keeps its own rest/hover/active opacity (CSS);
  // the two opacities multiply. A small ramp at the label's trailing edge fades
  // it back instead of a hard cut. Driven by the display spring so it eases;
  // reads the span from a ref so a re-measure takes effect without rebuilding
  // the transform.
  const thumbDim = useTransform(display, (v) => {
    const span = labelSpanRef.current;
    if (span <= 0) return 1;
    const RAMP = 0.04; // fraction of track over which it returns to full
    if (v <= span) return 0.25;
    if (v >= span + RAMP) return 1;
    return 0.25 + 0.75 * ((v - span) / RAMP);
  });

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
        {/* Two stacked copies of the label, both pinned left and counter-scaled
            so the track's overshoot stretch doesn't smear the text. The base is
            the resting gray; the white copy is clipped to exactly the fill's
            width (--pct), so the label reads gray on the empty track and flips
            to white only where the dark fill has slid over it. Non-interactive
            so neither ever intercepts a drag. */}
        <motion.span
          ref={labelRef}
          className="slider-label"
          aria-hidden="true"
          style={{
            scaleX: labelCounterScale,
            // Text is left-pinned, so cancel the stretch from the left edge —
            // regardless of which way the track itself is anchored.
            transformOrigin: "0% 50%",
          }}
        >
          {label}
        </motion.span>
        <motion.span
          className="slider-label slider-label-over"
          aria-hidden="true"
          style={{
            scaleX: labelCounterScale,
            transformOrigin: "0% 50%",
          }}
        >
          {label}
        </motion.span>
        {/* Wrapper carries the "over the label" dim; the thumb keeps its own
            CSS rest/hover/active opacity, and the two multiply. */}
        <motion.div
          className="slider-thumb-wrap"
          aria-hidden="true"
          style={{ opacity: thumbDim }}
        >
          <motion.div
            className="slider-thumb"
            // Height, not scaleY: transform-scaling a fixed-px radius squashes
            // it flat on the scaled axis and the pill stops being round.
            // Centred in the 60px track at both sizes. Shrinks near the ends:
            // the track is a pill, so the usable height collapses with the
            // curve (only ~36px of the 60 is available 6px in from the edge).
            animate={{ height: thumbH, top: (TRACK_H - thumbH) / 2 }}
            transition={{ ...snappy, damping: 24 }}
          />
        </motion.div>
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
            onChangeAtPaint(valueFromClientX(e.clientX));
            updateOvershoot(e.clientX);
          }}
          onPointerMove={(e) => {
            if ((e.buttons & 1) !== 1) return;
            if (!dragStarted.current) {
              dragStarted.current = true;
              setAnimating(false);
            }
            onChangeAtPaint(valueFromClientX(e.clientX));
            updateOvershoot(e.clientX);
          }}
          onPointerUp={release}
          onPointerCancel={release}
        />
      </motion.div>
    </div>
  );
}
