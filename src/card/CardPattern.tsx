import { useId } from "react";
import type { CardConfig } from "./cardConfig";
import { patternParams } from "./cardConfig";

// The card's background artwork: a grid of small shapes (circle / rect /
// triangle) that fills the card and bleeds off every edge. Each cell's size,
// angle and spacing offset are staggered by a RADIAL sine wave from the
// centre, so some shapes tuck in and others bulge out as you move outward.
// Ported from the playground PatternVariant; the two sliders (spacing /
// frequency) and the two segmented controls (shape / fill) come through the
// config, everything else is a fixed constant resolved by patternParams().

// Card-space viewBox — matches the ID-1 aspect (856/540 ≈ 85.6/53.98).
const VIEW_W = 856;
const VIEW_H = 540;

export function CardPattern({ config }: { config: CardConfig }) {
  const p = patternParams(config);
  const id = useId();

  // plus-lighter is fixed off, so shapes ARE a deepened tint of the card
  // colour drawn normally (the Chromium-safe "implied colour" plus-darker
  // trick) rather than black + a blend that muddies toward grey.
  const stroke = `color-mix(in oklch, ${config.baseColor}, black 55%)`;

  // Overscan the grid so shapes bleed past every edge.
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;
  const cols = Math.ceil((VIEW_W + p.size * 2) / p.spacing) + 2;
  const rows = Math.ceil((VIEW_H + p.size * 2) / p.spacing) + 2;

  const cells: { x: number; y: number; s: number; rot: number }[] = [];
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
    const strokeAttr = p.filled ? {} : { stroke, strokeWidth: p.strokeWidth };
    const common = { key: i, transform: t, ...fillAttr, ...strokeAttr };
    if (p.shape === "circle") {
      return <circle {...common} cx={cell.x} cy={cell.y} r={half} />;
    }
    if (p.shape === "rect") {
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
    <svg
      className="card-pattern"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* One group carries the opacity so all shapes composite together once
          rather than each blending separately. */}
      <g style={{ opacity: p.opacity }} strokeLinejoin="round" data-id={id}>
        {cells.map(renderShape)}
      </g>
    </svg>
  );
}
