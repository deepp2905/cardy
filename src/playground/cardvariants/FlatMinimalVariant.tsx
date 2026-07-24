import type { CSSProperties } from "react";
import { useDialKit } from "dialkit";
import { CardShell } from "./CardShell";
import "./cardvariants.css";

// v2 — flat minimal: a solid or gently graded fill and a single hairline rule.
// Restraint as the statement (the Apple Card school).
export function FlatMinimalVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Flat minimal", {
    /** Vertical gradient depth: 0 = solid, 1 = strong top->bottom shade. */
    gradient: [0.35, 0, 1, 0.01],
    /** Where the hairline sits, top to bottom (%). */
    rulePosition: [62, 0, 100, 1],
    ruleOpacity: [0.5, 0, 1, 0.05],
  });

  const darker = `color-mix(in oklch, ${baseColor}, black ${(
    p.gradient * 34
  ).toFixed(0)}%)`;

  return (
    <CardShell baseColor={baseColor}>
      <div
        className="cv-flat"
        style={
          {
            "--top": baseColor,
            "--bottom": darker,
          } as CSSProperties
        }
      >
        <span
          className="cv-flat-rule"
          style={{ top: `${p.rulePosition}%`, opacity: p.ruleOpacity }}
        />
      </div>
    </CardShell>
  );
}
