import type { CSSProperties } from "react";
import "./explore.css";

// Wireframe stand-in for the real Card: ID-1 proportions, corner radius and
// shadow only. Deliberately no shader or wave — these layouts put 8+ cards on
// screen at once and this is a sketch of ARRANGEMENT, not of the artwork.

type MockCardProps = {
  /** 0..1 — darker with depth, so stacked cards read as receding. */
  depth?: number;
  /** Marks the focused card: brighter fill and a stronger shadow. */
  focused?: boolean;
  label?: string;
  style?: CSSProperties;
};

export function MockCard({
  depth = 0,
  focused = false,
  label,
  style,
}: MockCardProps) {
  return (
    <div
      className="mock-card"
      data-focused={focused}
      style={{ "--depth": depth, ...style } as CSSProperties}
    >
      {label && <span className="mock-card-label">{label}</span>}
    </div>
  );
}
