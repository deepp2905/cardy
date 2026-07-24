import type { CSSProperties, ReactNode } from "react";
import {
  ChipMark,
  ContactlessMark,
  NetworkMark,
} from "../../card/Card";
import { inkFor } from "../../card/cardConfig";
import "../../card/card.css";

// The card frame + chrome (chip, wordmark, name, marks) shared by every art-
// direction variant. Variants render only their BACKGROUND art into `children`
// (behind the content), so each explores the card face while the ID-1 frame,
// proportions and chrome stay identical for a fair comparison.

type CardShellProps = {
  baseColor: string;
  name?: string;
  note?: string;
  /** Background art layer(s); sit under the content. */
  children: ReactNode;
};

export function CardShell({
  baseColor,
  name = "ALEX RIVERA",
  note,
  children,
}: CardShellProps) {
  const { ink, inkMuted, isLight } = inkFor(baseColor);
  return (
    <div
      className="card-frame"
      data-additive={!isLight}
      style={{ "--ink": ink, "--ink-muted": inkMuted } as CSSProperties}
    >
      <div className="card-surface">
        {children}
        <div className="card-layer card-content">
          <div className="card-top">
            <span className="card-wordmark">cardy</span>
            <ContactlessMark />
          </div>
          <ChipMark />
          <div className="card-bottom">
            <div className="card-identity">
              <span className="card-name">{name}</span>
              {note && <span className="card-note">{note}</span>}
            </div>
            <NetworkMark />
          </div>
        </div>
        <div className="card-sheen" />
      </div>
    </div>
  );
}
