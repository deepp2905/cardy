// Small numeric helpers shared by the dial mappings and the carousel
// proximity scaling (PLAN.md Phase C).

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Linearly remap `v` from [inMin, inMax] to [outMin, outMax], clamped. */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  const t = clamp01((v - inMin) / (inMax - inMin));
  return outMin + t * (outMax - outMin);
}

/** Standard ease-out (quadratic): fast at the start, settling at the end. */
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** `mapRange` with the normalised position eased rather than linear. */
export function mapRangeEased(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  ease: (t: number) => number = easeOut,
): number {
  if (inMax === inMin) return outMin;
  const t = ease(clamp01((v - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}
