import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { CardShell } from "./CardShell";
import "./cardvariants.css";

// v2 — flat minimal: a gradient fill, nothing else. Restraint as the
// statement (the Apple Card school).
export function FlatMinimalVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Flat minimal", {
    /** Direction of the gradient sweep, degrees. */
    angle: [160, 0, 360, 1],
    /** How far the ends shade from the base colour. */
    darken: [0.34, 0, 0.7, 0.01],
    lighten: [0.1, 0, 0.5, 0.01],
    /** Where the colour transition is centred, 0..1 along the sweep. */
    midpoint: [0.5, 0.1, 0.9, 0.01],
    /** 0 = smooth blend, 1 = hard two-tone band. */
    hardness: [0, 0, 1, 0.01],
  });

  const light = `color-mix(in oklch, ${baseColor}, white ${(
    p.lighten * 100
  ).toFixed(0)}%)`;
  const dark = `color-mix(in oklch, ${baseColor}, black ${(
    p.darken * 100
  ).toFixed(0)}%)`;
  // hardness pinches the two colour stops toward the midpoint.
  const spread = (1 - p.hardness) * 0.5;
  const stopA = ((p.midpoint - spread) * 100).toFixed(1);
  const stopB = ((p.midpoint + spread) * 100).toFixed(1);

  return (
    <CardShell baseColor={baseColor}>
      <div
        className="cv-flat"
        style={
          {
            background: `linear-gradient(${p.angle}deg, ${light} ${stopA}%, ${dark} ${stopB}%)`,
          } as CSSProperties
        }
      />
    </CardShell>
  );
}
