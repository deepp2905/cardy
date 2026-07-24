import { useDialKit } from "dialkit";
import { CardShell } from "./CardShell";
import "./cardvariants.css";

// v4 — engraved / embossed: a field of fine repeating sine lines in tints of
// the base colour, like guilloché on a metal card. Monochrome, machined.
const VIEW_W = 856;
const VIEW_H = 540;

export function EngravedVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Engraved", {
    /** Number of engraved lines. */
    lines: [18, 4, 40, 1],
    /** Wave amplitude of the lines (px in card space). */
    amplitude: [40, 0, 120, 1],
    /** Horizontal frequency of the sine. */
    frequency: [2.4, 0.5, 8, 0.1],
    /** Line contrast against the fill. */
    contrast: [0.5, 0, 1, 0.05],
  });

  const line = `color-mix(in oklch, ${baseColor}, white ${(
    p.contrast * 55
  ).toFixed(0)}%)`;
  const fill = `color-mix(in oklch, ${baseColor}, black 8%)`;

  const paths: string[] = [];
  const count = Math.round(p.lines);
  for (let n = 0; n <= count; n++) {
    const baseY = (VIEW_H / count) * n;
    let d = "";
    const samples = 48;
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const x = t * VIEW_W;
      const y =
        baseY +
        p.amplitude *
          Math.sin(Math.PI * 2 * p.frequency * t + (n * Math.PI) / 6);
      d += (s === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }
    paths.push(d);
  }

  return (
    <CardShell baseColor={baseColor}>
      <div className="card-layer" style={{ background: fill }}>
        <svg
          className="cv-engraved"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g fill="none" stroke={line} strokeWidth="1.4" opacity="0.9">
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </svg>
      </div>
    </CardShell>
  );
}
