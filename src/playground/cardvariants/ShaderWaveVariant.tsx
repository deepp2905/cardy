import { useDialKit } from "dialkit";
import { CardShader } from "../../card/CardShader";
import { WaveGraphic } from "../../card/WaveGraphic";
import { CardShell } from "./CardShell";

// The character→curve/frame mappings used to live in cardConfig, but the
// shipping card is now the pattern field. This playground variant keeps the
// old shader+wave look as a reference, so the formulas live here with it.
function characterToCurve(t: number): { a: number; b: number; phase: number } {
  return {
    a: 1 + 5 * t,
    b: 1.3 + 2.6 * (0.5 + 0.5 * Math.sin(Math.PI * 2 * 0.8 * t - 1.1)),
    phase: 0.15 + 0.7 * t,
  };
}
const characterToFrame = (t: number) => 2000 + 24000 * t;

// v1 — the previous shipping face: paper-shader gradient + Lissajous wave.
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
