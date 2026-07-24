import { useDialKit } from "dialkit";
import { PALETTE, oklchString, parseOklch } from "../card/cardConfig";
import { CopyButton } from "./CopyButton";

type Range = [number, number, number, number];

// The palette is normalised: one lightness and one chroma shared by every
// colour, with only the hue varying per entry. So the dials are a single
// `l` + `c` under Shared, and one hue slider per colour under Hues.
const seed = parseOklch(PALETTE[0].color);

const HUE_DIALS: Record<string, Range> = Object.fromEntries(
  PALETTE.map((entry) => [
    entry.name,
    [parseOklch(entry.color).h, 0, 360, 1] as Range,
  ]),
);

export function PalettePlayground() {
  const p = useDialKit("Palette", {
    shared: {
      l: [seed.l, 0, 1, 0.005] as Range,
      c: [seed.c, 0, 0.4, 0.005] as Range,
    },
    hues: HUE_DIALS,
  }) as {
    shared: { l: number; c: number };
    hues: Record<string, number>;
  };

  const colorFor = (name: string) =>
    oklchString(p.shared.l, p.shared.c, p.hues[name]);

  const copyText = () => {
    const rows = PALETTE.map(
      (e) => `  { name: "${e.name}", color: "${colorFor(e.name)}" },`,
    ).join("\n");
    return `export const PALETTE: PaletteEntry[] = [\n${rows}\n];`;
  };

  return (
    <div className="pg-page">
      <div className="pg-swatches">
        {PALETTE.map((e) => {
          const color = colorFor(e.name);
          return (
            <div key={e.name} className="pg-swatch">
              <div className="pg-swatch-chip" style={{ background: color }} />
              <span className="pg-swatch-name">{e.name}</span>
              <code className="pg-swatch-code">{color}</code>
            </div>
          );
        })}
      </div>
      <CopyButton getText={copyText} label="Copy PALETTE array" />
    </div>
  );
}
