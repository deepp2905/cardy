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
        <div className="slider-field">
          <span className="slider-label">Engraving</span>
          <div className="explore-input">For coffee only</div>
        </div>
        <DummySlider label="Character" pct={62} />
        <DummySlider label="Intensity" pct={38} />
        <div className="action-bar">
          <div className="back-slot">
            <div className="btn btn-back">
              <svg className="cta-arrow" viewBox="0 0 24 24">
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
          </div>
          <div className="btn btn-primary btn-next">
            <svg className="cta-arrow" viewBox="0 0 24 24">
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

function DummySlider({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="slider-field">
      <span className="slider-label">{label}</span>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${pct}%` }} />
        <div
          className="slider-thumb"
          style={{ left: `calc(${pct}% - 10px)`, height: 34, top: 13 }}
        />
      </div>
    </div>
  );
}
