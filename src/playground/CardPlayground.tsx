import { useDialKit } from "dialkit";
import { Card } from "../card/Card";
import { oklchString, sanitizeNote } from "../card/cardConfig";
import { CopyButton } from "./CopyButton";

// Full manual control over one card's look. character/intensity still drive
// the designed mappings; frame/softness/noise override the shader directly.
export function CardPlayground() {
  const p = useDialKit("Card", {
    color: {
      l: [0.62, 0, 1, 0.005],
      c: [0.19, 0, 0.4, 0.005],
      h: [250, 0, 360, 1],
    },
    character: [0.5, 0, 1, 0.01],
    intensity: [0.5, 0, 1, 0.01],
    note: { type: "text", default: "FOR COFFEE ONLY" },
    shader: {
      softness: [0.75, 0, 1, 0.01],
      frame: [8000, 0, 30000, 100],
      noise: [0.3, 0, 1, 0.01],
    },
  });

  const baseColor = oklchString(p.color.l, p.color.c, p.color.h);
  const config = {
    id: "play",
    baseColor,
    character: p.character,
    intensity: p.intensity,
    note: sanitizeNote(p.note),
  };

  const copyText = () =>
    JSON.stringify(
      {
        baseColor,
        character: Number(p.character.toFixed(3)),
        intensity: Number(p.intensity.toFixed(3)),
        note: config.note,
        shader: {
          softness: Number(p.shader.softness.toFixed(3)),
          frame: Math.round(p.shader.frame),
          noise: Number(p.shader.noise.toFixed(3)),
        },
      },
      null,
      2,
    );

  return (
    <div className="pg-page">
      <div className="pg-preview">
        <div className="pg-card-wrap">
          <Card
            config={config}
            shaderParams={{
              softness: p.shader.softness,
              frame: p.shader.frame,
              noise: p.shader.noise,
            }}
          />
        </div>
        <code className="pg-readout">{baseColor}</code>
      </div>
      <CopyButton getText={copyText} label="Copy card config" />
    </div>
  );
}
