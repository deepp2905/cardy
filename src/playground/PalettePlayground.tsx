import { useDialKit } from "dialkit";
import { PALETTE, oklchString, parseOklch } from "../card/cardConfig";
import { CopyButton } from "./CopyButton";

type Range = [number, number, number, number];
type LCHDials = { l: Range; c: Range; h: Range };

// Seed dialkit groups from the current palette so l/c/h open where they are.
const PALETTE_DIALS: Record<string, LCHDials> = Object.fromEntries(
  PALETTE.map((entry) => {
    const { l, c, h } = parseOklch(entry.color);
    return [
      entry.name,
      {
        l: [l, 0, 1, 0.005] as Range,
        c: [c, 0, 0.4, 0.005] as Range,
        h: [h, 0, 360, 1] as Range,
      } satisfies LCHDials,
    ];
  }),
);

export function PalettePlayground() {
  const p = useDialKit("Palette", PALETTE_DIALS) as Record<
    string,
    { l: number; c: number; h: number }
  >;

  const colorFor = (name: string) =>
    oklchString(p[name].l, p[name].c, p[name].h);

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
