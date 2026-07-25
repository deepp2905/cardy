import type { ReactNode } from "react";
import { StepIndicator } from "../ui/StepIndicator";
import "./explore.css";

// Reproduces Step 2's chrome — step indicator, note field, two sliders, the
// action bar — so each layout idea is judged in the space it would really
// have. None of these controls do anything; they are here for the geometry.

export function ExploreShell({ children }: { children: ReactNode }) {
  return (
    <div className="explore-column">
      <header className="app-header">
        <StepIndicator current="customize" />
      </header>

      <main className="explore-stage">{children}</main>

      <div className="explore-controls" aria-hidden="true">
        <div className="explore-field">
          <span className="explore-label">Engraving</span>
          <div className="explore-input">For coffee only</div>
        </div>
        <DummySlider label="Character" pct={62} />
        <DummySlider label="Intensity" pct={38} />
        <div className="explore-actions">
          <div className="explore-btn explore-btn-back">
            <svg viewBox="0 0 24 24">
              <path
                d="M20 12H5m6-6-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="explore-btn explore-btn-next">
            <svg viewBox="0 0 24 24">
              <path
                d="M4 12h15m-6-6 6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Label lives INSIDE the track (pinned left), exactly like the real Slider —
// so it never stacks above or overlaps the track.
function DummySlider({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="explore-field">
      <div className="explore-track">
        <div className="explore-fill" style={{ width: `${pct}%` }} />
        <span className="explore-slider-label">{label}</span>
        <div className="explore-thumb" style={{ left: `calc(${pct}% - 2px)` }} />
      </div>
    </div>
  );
}
