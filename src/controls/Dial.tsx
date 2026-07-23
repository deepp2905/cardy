import { useEffect, useRef } from "react";
import { motion, useSpring } from "motion/react";
import { snappyOptions } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";
import "./controls.css";

// Custom user-facing dial (dialkit is dev-only; PLAN.md Phase 0 decision).
// Vertical pointer drag, arrow keys, 0..1 value. When the bound value is
// swapped from outside (carousel retarget) the needle springs to the new
// position — that retarget IS the micro-moment (PLAN.md Phase C).

const ROT_RANGE = 135; // degrees each way from 12 o'clock
const DRAG_PIXELS = 160; // full-range vertical travel
const KEY_STEP = 0.05;

type DialProps = {
  label: string;
  value: number; // 0..1
  onChange: (value: number) => void;
};

const toRotation = (v: number) => -ROT_RANGE + v * 2 * ROT_RANGE;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function Dial({ label, value, onChange }: DialProps) {
  const reduce = usePrefersReducedMotion();
  const rotation = useSpring(toRotation(value), snappyOptions);
  const drag = useRef<{ startY: number; startValue: number } | null>(null);

  useEffect(() => {
    // 1:1 while the user drags; spring when the value retargets from outside.
    if (drag.current || reduce) rotation.jump(toRotation(value));
    else rotation.set(toRotation(value));
  }, [rotation, value, reduce]);

  return (
    <div className="dial">
      <div
        className="dial-knob-hit"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { startY: e.clientY, startValue: value };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dy = drag.current.startY - e.clientY;
          onChange(clamp01(drag.current.startValue + dy / DRAG_PIXELS));
        }}
        onPointerUp={(e) => {
          drag.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onKeyDown={(e) => {
          const step =
            e.key === "ArrowUp" || e.key === "ArrowRight"
              ? KEY_STEP
              : e.key === "ArrowDown" || e.key === "ArrowLeft"
                ? -KEY_STEP
                : e.key === "Home"
                  ? -1
                  : e.key === "End"
                    ? 1
                    : null;
          if (step === null) return;
          e.preventDefault();
          onChange(clamp01(value + step));
        }}
      >
        <motion.div className="dial-knob" style={{ rotate: rotation }}>
          <div className="dial-needle" />
        </motion.div>
      </div>
      <span className="dial-label">{label}</span>
    </div>
  );
}
