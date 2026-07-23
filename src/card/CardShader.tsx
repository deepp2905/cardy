import { useMemo } from "react";
import { GrainGradient } from "@paper-design/shaders-react";
import { converter, formatHex } from "culori";
import { parseOklch, oklchString } from "./cardConfig";

const toRgb = converter("rgb");

// The shader lib parses hex reliably; oklch strings go through culori
// (with sRGB gamut clamping) before hitting WebGL.
function hex(l: number, c: number, h: number): string {
  const rgb = toRgb(oklchString(l, c, h));
  return rgb ? formatHex(rgb) : "#000000";
}

type CardShaderProps = {
  baseColor: string;
  /** Static by default — a physical card doesn't move. Also the perf fallback. */
  speed?: number;
  /** Which frame of the (unplayed) animation to freeze on. */
  frame?: number;
  softness?: number;
  intensity?: number;
  noise?: number;
};

// Grainy gradient background tinted from the card's base color.
// Three tints derived in OKLCH space so every palette entry gets the
// same depth relationship for free.
export function CardShader({
  baseColor,
  speed = 0,
  frame = 8000,
  softness = 0.75,
  intensity = 0.18,
  noise = 0.3,
}: CardShaderProps) {
  const { l, c, h } = parseOklch(baseColor);

  const colors = useMemo(
    () => [
      hex(Math.max(0.12, l - 0.24), c * 0.85, h - 10),
      hex(l, c, h),
      hex(Math.min(0.93, l + 0.14), c * 1.05, h + 8),
    ],
    [l, c, h],
  );
  const colorBack = useMemo(
    () => hex(Math.max(0.08, l - 0.34), c * 0.7, h - 15),
    [l, c, h],
  );

  return (
    <GrainGradient
      className="card-shader-canvas"
      colors={colors}
      colorBack={colorBack}
      shape="wave"
      softness={softness}
      intensity={intensity}
      noise={noise}
      speed={speed}
      frame={frame}
      webGlContextAttributes={{ preserveDrawingBuffer: true }}
    />
  );
}
