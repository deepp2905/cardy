import { useEffect, useId } from "react";
import {
  motion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { settleOptions } from "../lib/motionConfig";
import { usePrefersReducedMotion } from "../lib/reducedMotion";

// Generative wave layer (Phase B spike — SVG path won).
//
// A Lissajous-flavored ribbon: x sweeps the card with a sinusoidal wobble,
// y oscillates independently. `a`/`b` are the two frequencies, `phase`
// shifts both. The curve does not animate continuously — the four params
// are springs, so a dial change morphs the path into its new shape and
// settles (PLAN.md Phase B).

const VIEW_W = 856;
const VIEW_H = 540;
const SAMPLES = 140;
const MARGIN_X = -20; // start/end slightly off-card so ends never show

type WaveGraphicProps = {
  curve: { a: number; b: number; phase: number };
  intensity: number; // 0..1
};

function wavePath(
  a: number,
  b: number,
  phase: number,
  intensity: number,
  phaseOffset: number,
): string {
  const amp = VIEW_H * (0.1 + 0.24 * intensity);
  const wobble = VIEW_W * 0.04 * intensity;
  const midY = VIEW_H * 0.52;
  const ph = (phase + phaseOffset) * Math.PI * 2;
  let d = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const x =
      MARGIN_X +
      (VIEW_W - 2 * MARGIN_X) * t +
      wobble * Math.sin(Math.PI * 2 * a * t + ph);
    const y =
      midY +
      amp * Math.sin(Math.PI * 2 * b * t + ph * 0.7) * Math.sin(Math.PI * t);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d;
}

function useSettledParam(target: number): MotionValue<number> {
  const reduce = usePrefersReducedMotion();
  const value = useSpring(target, settleOptions);
  useEffect(() => {
    if (reduce) value.jump(target);
    else value.set(target);
  }, [value, target, reduce]);
  return value;
}

export function WaveGraphic({ curve, intensity }: WaveGraphicProps) {
  const id = useId(); // per-instance defs ids — many cards render at once
  const a = useSettledParam(curve.a);
  const b = useSettledParam(curve.b);
  const phase = useSettledParam(curve.phase);
  const level = useSettledParam(intensity);

  const params = [a, b, phase, level];
  const dMain = useTransform(params, ([av, bv, pv, iv]: number[]) =>
    wavePath(av, bv, pv, iv, 0),
  );
  const dEchoA = useTransform(params, ([av, bv, pv, iv]: number[]) =>
    wavePath(av, bv, pv, iv * 0.92, 0.045),
  );
  const dEchoB = useTransform(params, ([av, bv, pv, iv]: number[]) =>
    wavePath(av, bv, pv, iv * 0.84, -0.045),
  );
  const mainWidth = useTransform(level, (iv) => 3 + iv * 5);

  return (
    <svg
      className="card-wave"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.14" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.86" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width={VIEW_W} height={VIEW_H} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g
        mask={`url(#${id}-mask)`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        <motion.path d={dEchoB} strokeWidth={2} opacity={0.18} />
        <motion.path d={dEchoA} strokeWidth={2.5} opacity={0.32} />
        <motion.path d={dMain} strokeWidth={mainWidth} opacity={0.75} />
      </g>
    </svg>
  );
}
