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
