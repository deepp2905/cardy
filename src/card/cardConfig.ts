// Types + palette + defaults + serialization for the card. PLAN.md §3–4.

export type CardConfig = {
  id: string;
  baseColor: string; // oklch() string from PALETTE
  character: number; // 0..1, dial 1 — swept through a designed curve mapping
  intensity: number; // 0..1, dial 2 — drives wave amplitude + shader texture
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

export function seedConfigs(): Record<string, CardConfig> {
  return Object.fromEntries(
    PALETTE.map((p, i) => [
      `card-${i}`,
      {
        id: `card-${i}`,
        baseColor: p.color,
        character: i / (PALETTE.length - 1), // spread so the strip shows range
        intensity: 0.5,
        note: "",
      } satisfies CardConfig,
    ]),
  );
}

// --- Designed dial mappings (never expose raw params; PLAN.md Phase C) ---

// Dial 1 sweeps one path through Lissajous space chosen so every position
// looks intentional: `a` rises steadily, `b` breathes against it, phase drifts.
export function characterToCurve(t: number): {
  a: number;
  b: number;
  phase: number;
} {
  return {
    a: 1 + 5 * t,
    b: 1.3 + 2.6 * (0.5 + 0.5 * Math.sin(Math.PI * 2 * 0.8 * t - 1.1)),
    phase: 0.15 + 0.7 * t,
  };
}

// Dial 1 also scrubs which frozen frame of the shader the background uses,
// so "character" recomposes the whole card, not just the line.
export function characterToFrame(t: number): number {
  return 2000 + 24000 * t;
}

// Dial 2 maps one knob to shader distortion + grain (plus wave amplitude,
// which WaveGraphic applies itself).
export function intensityToShader(i: number): {
  intensity: number;
  noise: number;
} {
  return {
    intensity: 0.08 + 0.28 * i,
    noise: 0.12 + 0.5 * i,
  };
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
// `isLight` reports which branch was taken: additive blends (plus-lighter)
// only read on the dark-card branch, where the ink is near-white.
export function inkFor(baseColor: string): {
  ink: string;
  inkMuted: string;
  isLight: boolean;
} {
  const { l, h } = parseOklch(baseColor);
  if (l >= 0.68) {
    return {
      ink: oklchString(0.2, 0.02, h),
      inkMuted: oklchString(0.28, 0.03, h),
      isLight: true,
    };
  }
  return {
    ink: oklchString(0.97, 0.005, h),
    inkMuted: oklchString(0.88, 0.015, h),
    isLight: false,
  };
}

export const NOTE_MAX = 24;
export const NOTE_CHARSET = /[^A-Z0-9 .,!♥]/g;

export function sanitizeNote(raw: string): string {
  return raw.toUpperCase().replace(NOTE_CHARSET, "").slice(0, NOTE_MAX);
}

// --- URL serialization (applied on confirm; PLAN.md §3) ---

export function cardConfigToParams(config: CardConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("c", config.baseColor);
  p.set("ch", config.character.toFixed(3));
  p.set("i", config.intensity.toFixed(3));
  if (config.note) p.set("n", config.note);
  return p;
}

export function cardConfigFromParams(params: URLSearchParams): CardConfig | null {
  const c = params.get("c");
  if (!c || !OKLCH_RE.test(c)) return null;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  return {
    id: "shared",
    baseColor: c,
    character: clamp01(Number(params.get("ch") ?? 0.5)),
    intensity: clamp01(Number(params.get("i") ?? 0.5)),
    note: sanitizeNote(params.get("n") ?? ""),
  };
}
