import { useState } from "react";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { Card } from "./card/Card";
import { PALETTE, seedConfigs } from "./card/cardConfig";

type Step = "welcome" | "customize" | "confirm";

const configs = seedConfigs();
const ids = Object.keys(configs);

// Phase A harness: the real Card + dialkit panel for tuning the shader
// look per palette entry. Steps arrive in Phases C–G.
export default function App() {
  const [step] = useState<Step>("customize");

  const p = useDialKit("Card tuning", {
    palette: [0, 0, PALETTE.length - 1, 1],
    note: { type: "text", default: "FOR COFFEE ONLY" },
    shader: {
      frame: [8000, 0, 30000, 100],
      softness: [0.75, 0, 1, 0.01],
      intensity: [0.18, 0, 1, 0.01],
      noise: [0.3, 0, 1, 0.01],
    },
    wave: {
      a: [3, 0.5, 8, 0.5],
      b: [2, 0.5, 8, 0.5],
      phase: [0.5, 0, 1, 0.01],
      intensity: [0.5, 0, 1, 0.01],
    },
  });

  const config = {
    ...configs[ids[Math.round(p.palette)]],
    note: p.note.toUpperCase().slice(0, 24),
    curve: { a: p.wave.a, b: p.wave.b, phase: p.wave.phase },
    intensity: p.wave.intensity,
  };

  return (
    <div className="column">
      <Card config={config} shaderParams={p.shader} />
      <p className="shell-note">cardy — phase A ({step})</p>
      <DialRoot />
    </div>
  );
}
