import type { ComponentProps, CSSProperties } from "react";
import type { CardConfig } from "./cardConfig";
import { inkFor } from "./cardConfig";
import { CardShader } from "./CardShader";
import { WaveGraphic } from "./WaveGraphic";
import "./card.css";

// Pure (config) => visual. Used in carousel, welcome, and snapshot.
// Sizing is container-query based: parent sets the width, everything
// inside scales in cqw units.

type CardProps = {
  config: CardConfig;
  /** Dev-tuning override for the shader look (dialkit harness). */
  shaderParams?: Partial<ComponentProps<typeof CardShader>>;
};

export function Card({ config, shaderParams }: CardProps) {
  const { ink, inkMuted } = inkFor(config.baseColor);

  return (
    <div
      className="card-frame"
      style={{ "--ink": ink, "--ink-muted": inkMuted } as CSSProperties}
    >
      <div className="card-surface">
        <div className="card-layer">
          <CardShader baseColor={config.baseColor} {...shaderParams} />
        </div>
        <WaveGraphic curve={config.curve} intensity={config.intensity} />
        <div className="card-layer card-content">
          <div className="card-top">
            <span className="card-wordmark">cardy</span>
            <ContactlessMark />
          </div>
          <ChipMark />
          <div className="card-bottom">
            <div className="card-identity">
              <span className="card-name">ALEX RIVERA</span>
              {config.note && <span className="card-note">{config.note}</span>}
            </div>
            <NetworkMark />
          </div>
        </div>
        <div className="card-sheen" />
      </div>
    </div>
  );
}

function ChipMark() {
  return (
    <svg className="card-chip" viewBox="0 0 44 34" aria-hidden="true">
      <defs>
        <linearGradient id="chip-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6d9a8" />
          <stop offset="0.55" stopColor="#c9b26e" />
          <stop offset="1" stopColor="#a98f4e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="32" rx="6" fill="url(#chip-face)" />
      <rect
        x="1"
        y="1"
        width="42"
        height="32"
        rx="6"
        fill="none"
        stroke="rgba(60,45,15,0.45)"
        strokeWidth="1"
      />
      <path
        d="M15 1v10a4 4 0 0 1-4 4H1M29 1v10a4 4 0 0 0 4 4h10M15 33v-10a4 4 0 0 0-4-4M29 33v-10a4 4 0 0 1 4-4M15 17h14"
        fill="none"
        stroke="rgba(60,45,15,0.45)"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ContactlessMark() {
  return (
    <svg className="card-contactless" viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M6.5 8.5a10 10 0 0 1 0 7" opacity="0.45" />
        <path d="M10 6.8a13 13 0 0 1 0 10.4" opacity="0.65" />
        <path d="M13.5 5a16.5 16.5 0 0 1 0 14" opacity="0.85" />
        <path d="M17 3.2a20.5 20.5 0 0 1 0 17.6" />
      </g>
    </svg>
  );
}

// Generic overlapping circles — deliberately NOT a real network mark.
function NetworkMark() {
  return (
    <svg className="card-network" viewBox="0 0 38 24" aria-hidden="true">
      <circle cx="13" cy="12" r="11" fill="currentColor" opacity="0.55" />
      <circle cx="25" cy="12" r="11" fill="currentColor" opacity="0.3" />
    </svg>
  );
}
