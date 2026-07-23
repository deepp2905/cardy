// Types + palette + defaults + serialization for the card. PLAN.md §3–4.

export type CardConfig = {
  id: string;
  baseColor: string; // oklch() string from PALETTE
  curve: { a: number; b: number; phase: number }; // Lissajous params (Phase B)
  intensity: number; // 0..1, dial 2
  note: string; // "" | max 24 chars
};

export const CARD_ASPECT = 85.6 / 53.98; // ISO/IEC 7810 ID-1

export type PaletteEntry = { name: string; color: string };

export const PALETTE: PaletteEntry[] = [
  { name: "cobalt", color: "oklch(0.62 0.19 250)" },
  { name: "violet", color: "oklch(0.62 0.19 300)" },
  { name: "magenta", color: "oklch(0.62 0.17 350)" },
  { name: "coral", color: "oklch(0.65 0.18 25)" },
  { name: "amber", color: "oklch(0.70 0.16 85)" },
  { name: "jade", color: "oklch(0.66 0.17 150)" },
  { name: "teal", color: "oklch(0.64 0.15 200)" },
  { name: "graphite", color: "oklch(0.30 0.03 260)" },
];

const DEFAULT_CURVE = { a: 3, b: 2, phase: 0.5 };

export function seedConfigs(): Record<string, CardConfig> {
  return Object.fromEntries(
    PALETTE.map((p, i) => [
      `card-${i}`,
      {
        id: `card-${i}`,
        baseColor: p.color,
        curve: { ...DEFAULT_CURVE },
        intensity: 0.5,
        note: "",
      } satisfies CardConfig,
    ]),
  );
}

const OKLCH_RE = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/;

export function parseOklch(color: string): { l: number; c: number; h: number } {
  const m = OKLCH_RE.exec(color);
  if (!m) return { l: 0.62, c: 0.19, h: 250 };
  return { l: Number(m[1]), c: Number(m[2]), h: Number(m[3]) };
}

export function oklchString(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

// Foreground ink chosen purely from base lightness — no per-color tuning.
export function inkFor(baseColor: string): { ink: string; inkMuted: string } {
  const { l, h } = parseOklch(baseColor);
  if (l >= 0.68) {
    return {
      ink: oklchString(0.2, 0.02, h),
      inkMuted: oklchString(0.28, 0.03, h),
    };
  }
  return {
    ink: oklchString(0.97, 0.005, h),
    inkMuted: oklchString(0.88, 0.015, h),
  };
}

// --- URL serialization (applied on confirm; PLAN.md §3) ---

export function cardConfigToParams(config: CardConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("c", config.baseColor);
  p.set("a", String(config.curve.a));
  p.set("b", String(config.curve.b));
  p.set("ph", config.curve.phase.toFixed(3));
  p.set("i", config.intensity.toFixed(3));
  if (config.note) p.set("n", config.note);
  return p;
}

export function cardConfigFromParams(params: URLSearchParams): CardConfig | null {
  const c = params.get("c");
  if (!c || !OKLCH_RE.test(c)) return null;
  return {
    id: "shared",
    baseColor: c,
    curve: {
      a: Number(params.get("a") ?? DEFAULT_CURVE.a),
      b: Number(params.get("b") ?? DEFAULT_CURVE.b),
      phase: Number(params.get("ph") ?? DEFAULT_CURVE.phase),
    },
    intensity: Math.min(1, Math.max(0, Number(params.get("i") ?? 0.5))),
    note: (params.get("n") ?? "").slice(0, 24),
  };
}
