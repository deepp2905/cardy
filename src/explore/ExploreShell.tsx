import type { ReactNode } from "react";
import { StepIndicator } from "../ui/StepIndicator";
import "./explore.css";

// Reproduces Step 2's chrome — note field, two sliders, the action bar — so
// each layout idea is judged in the space it would really have. Deliberately
// LOW-FIDELITY: no text or icons, just filled blocks at the real sizes, so the
// eye reads ARRANGEMENT (like the grey wireframe cards), not the controls.
// None of these do anything; they are here for the geometry.

export function ExploreShell({ children }: { children: ReactNode }) {
  return (
    <div className="explore-column">
      <header className="app-header">
        <StepIndicator current="customize" />
      </header>

      <main className="explore-stage">{children}</main>

      <div className="explore-controls" aria-hidden="true">
        <div className="explore-field">
          <div className="explore-input" />
        </div>
        <DummySlider pct={62} />
        <DummySlider pct={38} />
        <div className="explore-actions">
          <div className="explore-btn explore-btn-back" />
          <div className="explore-btn explore-btn-next" />
        </div>
      </div>
    </div>
  );
}

// Plain filled track + fill + thumb — no label, low-fidelity like the cards.
function DummySlider({ pct }: { pct: number }) {
  return (
    <div className="explore-field">
      <div className="explore-track">
        <div className="explore-fill" style={{ width: `${pct}%` }} />
        <div className="explore-thumb" style={{ left: `calc(${pct}% - 2px)` }} />
      </div>
    </div>
  );
}
