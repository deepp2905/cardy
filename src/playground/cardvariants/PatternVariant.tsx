import { useId } from "react";
import { useDialKit } from "dialkit";
import { CardShell } from "./CardShell";
import "./cardvariants.css";

// v5 — pattern field: a grid of small shapes (rect / circle / triangle) that
// fills the card and bleeds off every edge. Each cell's size, angle and
// spacing offset are staggered by a RADIAL sine wave from the centre, so some
// shapes tuck in and others stick out as you move outward — phase slides the
// pattern. All shapes render white at 50% / plus-lighter, grouped so the blend
// is applied once.

const VIEW_W = 856;
const VIEW_H = 540;

type Shape = "rect" | "circle" | "triangle";

export function PatternVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Pattern", {
    shape: {
      type: "select",
      options: ["rect", "circle", "triangle"],
      default: "circle",
    },
    filled: false,
    /** plus-lighter (on) brightens, plus-darker (off) deepens. */
    plusLighter: true,
    strokeWidth: [1.6, 0.5, 6, 0.1],
    /** Base cell size, px in card space. */
    size: [34, 6, 120, 1],
    /** Base rotation of every shape, degrees. */
    angle: [0, 0, 90, 1],
    /** Grid pitch, px in card space (before spacing stagger). */
    spacing: [64, 20, 200, 1],
    // --- radial stagger: one wave, per-property amounts ---
    /** Wavelength of the radial ripple, px. Lower = tighter rings. */
    staggerFreq: [140, 40, 400, 5],
    /** Slides the ripple in/out from the centre. */
    phase: [0, 0, 6.283, 0.05],
    /** How much each property responds to the wave. */
    staggerSize: [0.4, 0, 1, 0.01],
    staggerAngle: [30, 0, 180, 1],
    staggerSpacing: [12, 0, 80, 1],
  });

  const id = useId();
  const shape = p.shape as Shape;
  // Lighten uses white shapes + plus-lighter; darken uses black + multiply
  // (plus-darker is NOT a valid CSS mix-blend-mode — it silently no-ops).
  // The group carries opacity and blend. Filled shapes cover more area than
  // thin outlines, so they read too strong at the same opacity: 10% filled
  // vs 25% outline.
  const stroke = p.plusLighter ? "#fff" : "#000";
  const blend = p.plusLighter ? "plus-lighter" : "multiply";
  const groupOpacity = p.filled ? 0.1 : 0.25;

  // Overscan the grid so shapes bleed past every edge.
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;
  const cols = Math.ceil((VIEW_W + p.size * 2) / p.spacing) + 2;
  const rows = Math.ceil((VIEW_H + p.size * 2) / p.spacing) + 2;

  const cells: {
    x: number;
    y: number;
    s: number;
    rot: number;
  }[] = [];

  for (let r = -Math.floor(rows / 2); r <= Math.floor(rows / 2); r++) {
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      // Base grid position from centre.
      let gx = cx + c * p.spacing;
      let gy = cy + r * p.spacing;
      const dist = Math.hypot(gx - cx, gy - cy);
      // One radial wave, sampled at this cell's distance.
      const wave = Math.sin((dist / p.staggerFreq) * Math.PI * 2 + p.phase);
      // Spacing stagger pushes the cell along its radial direction.
      const nx = dist === 0 ? 0 : (gx - cx) / dist;
      const ny = dist === 0 ? 0 : (gy - cy) / dist;
      gx += nx * wave * p.staggerSpacing;
      gy += ny * wave * p.staggerSpacing;
      // Size and angle staggered by the same wave.
      const s = Math.max(1, p.size * (1 + wave * p.staggerSize));
      const rot = p.angle + wave * p.staggerAngle;
      cells.push({ x: gx, y: gy, s, rot });
    }
  }

  const renderShape = (
    cell: { x: number; y: number; s: number; rot: number },
    i: number,
  ) => {
    const half = cell.s / 2;
    const t = `rotate(${cell.rot} ${cell.x} ${cell.y})`;
    const fillAttr = p.filled ? { fill: stroke } : { fill: "none" };
    const strokeAttr = p.filled
      ? {}
      : { stroke, strokeWidth: p.strokeWidth };
    const common = { key: i, transform: t, ...fillAttr, ...strokeAttr };
    if (shape === "circle") {
      return <circle {...common} cx={cell.x} cy={cell.y} r={half} />;
    }
    if (shape === "rect") {
      return (
        <rect
          {...common}
          x={cell.x - half}
          y={cell.y - half}
          width={cell.s}
          height={cell.s}
          rx={cell.s * 0.14}
        />
      );
    }
    // triangle
    const pts = [
      `${cell.x},${cell.y - half}`,
      `${cell.x + half},${cell.y + half}`,
      `${cell.x - half},${cell.y + half}`,
    ].join(" ");
    return <polygon {...common} points={pts} />;
  };

  return (
    <CardShell baseColor={baseColor}>
      <div className="card-layer" style={{ background: baseColor }}>
        <svg
          className="cv-pattern"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* One group carries the opacity and blend so all shapes composite
              together once rather than each blending separately. */}
          <g
            style={{ opacity: groupOpacity, mixBlendMode: blend }}
            strokeLinejoin="round"
            data-id={id}
          >
            {cells.map(renderShape)}
          </g>
        </svg>
      </div>
    </CardShell>
  );
}
