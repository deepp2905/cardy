import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { CardShell } from "./CardShell";
import "./cardvariants.css";

// v3 — bold geometric: a hard diagonal split into two tones, with an optional
// offset accent block. Graphic and confident.
export function GeometricVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Geometric", {
    /** Diagonal angle of the split, degrees. */
    angle: [24, 0, 90, 1],
    /** Position of the split across the card (%). */
    split: [46, 10, 90, 1],
    /** Tone contrast between the two halves. */
    contrast: [0.4, 0, 0.8, 0.01],
    /** Accent block size (0 hides it). */
    block: [0.3, 0, 1, 0.01],
  });

  const dark = `color-mix(in oklch, ${baseColor}, black ${(
    p.contrast * 60
  ).toFixed(0)}%)`;
  const light = `color-mix(in oklch, ${baseColor}, white ${(
    p.contrast * 30
  ).toFixed(0)}%)`;

  return (
    <CardShell baseColor={baseColor}>
      <div
        className="cv-geo"
        style={
          {
            "--a": light,
            "--b": dark,
            "--split": `${p.split}%`,
            "--angle": `${p.angle}deg`,
          } as CSSProperties
        }
      >
        {p.block > 0.02 && (
          <span
            className="cv-geo-block"
            style={{
              width: `${18 + p.block * 34}cqw`,
              height: `${18 + p.block * 34}cqw`,
              background: baseColor,
            }}
          />
        )}
      </div>
    </CardShell>
  );
}
