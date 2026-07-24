import { useDialKit } from "dialkit";
import { CardShader } from "../../card/CardShader";
import { WaveGraphic } from "../../card/WaveGraphic";
import { characterToCurve, characterToFrame } from "../../card/cardConfig";
import { CardShell } from "./CardShell";

// v1 — the current shipping face: paper-shader gradient + Lissajous wave.
export function ShaderWaveVariant({ baseColor }: { baseColor: string }) {
  const p = useDialKit("Shader + wave", {
    character: [0.5, 0, 1, 0.01],
    intensity: [0.5, 0, 1, 0.01],
    shader: {
      softness: [0.75, 0, 1, 0.01],
      noise: [0.3, 0, 1, 0.01],
    },
  });

  const curve = characterToCurve(p.character);

  return (
    <CardShell baseColor={baseColor}>
      <div className="card-layer">
        <CardShader
          baseColor={baseColor}
          frame={characterToFrame(p.character)}
          softness={p.shader.softness}
          intensity={0.08 + 0.28 * p.intensity}
          noise={p.shader.noise}
        />
      </div>
      <WaveGraphic curve={curve} intensity={p.intensity} />
    </CardShell>
  );
}
