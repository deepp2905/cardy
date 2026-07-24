import type { CSSProperties } from "react";
import { PALETTE } from "../card/cardConfig";
import "./explore.css";

// Wireframe stand-in for the real Card: ID-1 proportions, corner radius and
// shadow only. Deliberately no shader or wave — these layouts put 8+ cards on
// screen at once and this is a sketch of ARRANGEMENT, not of the artwork.

type MockCardProps = {
  /** 0..1 — darker with depth, so stacked cards read as receding. */
  depth?: number;
  /** Marks the focused card. */
  focused?: boolean;
  /** Which slot this is, for picking a palette colour when colour is on. */
  index?: number;
  label?: string;
  style?: CSSProperties;
};

export function MockCard({
  depth = 0,
  focused = false,
  index = 0,
  label,
  style,
}: MockCardProps) {
  // The card's own colour, from the real app palette. Whether it shows is
  // gated by [data-colorful] on the deck (CSS), so the toggle costs nothing
  // to thread through the variants.
  const color = PALETTE[index % PALETTE.length].color;
  return (
    <div
      className="mock-card"
      data-focused={focused}
      style={{ "--depth": depth, "--card-color": color, ...style } as CSSProperties}
    >
      {label && <span className="mock-card-label">{label}</span>}
    </div>
  );
}
