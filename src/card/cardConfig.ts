// Types + palette + defaults + serialization for the card. PLAN.md §3–4.

export type PatternShape = "circle" | "rect" | "triangle";

export type CardConfig = {
  id: string;
  baseColor: string; // oklch() string from PALETTE
  // --- pattern dials (PLAN.md §3; raw params never exposed to the UI) ---
  shape: PatternShape; // segmented control
  filled: boolean; // segmented control (filled vs outline)
  spacing: number; // 0..1 → grid pitch, SPACING_MIN..SPACING_MAX
  frequency: number; // 0..1 → radial wavelength, FREQ_MIN..FREQ_MAX
  phase: number; // 0..1 → wave offset, 0..2π
  note: string; // "" | max 24 chars
};

export const CARD_ASPECT = 85.6 / 53.98; // ISO/IEC 7810 ID-1

export type PaletteEntry = { name: string; color: string };

// Nine brand colours, from the 500-level swatches. Each carries its own
// lightness and chroma (not a normalised ramp), so they read with distinct
// brightness/saturation — a varied, characterful set rather than a uniform
// family.
export const PALETTE: PaletteEntry[] = [
  { name: "blue", color: "oklch(0.532 0.255 262.502)" },
  { name: "pink", color: "oklch(0.724 0.188 346.723)" },
  { name: "orange", color: "oklch(0.62 0.18 41.644)" },
  { name: "yellow", color: "oklch(0.794 0.156 85.922)" },
  { name: "lime", color: "oklch(0.83 0.203 122.796)" },
  { name: "green", color: "oklch(0.636 0.213 141.929)" },
  { name: "jade", color: "oklch(0.69 0.115 184.634)" },
  { name: "cyan", color: "oklch(0.665 0.186 249.535)" },
  { name: "purple", color: "oklch(0.499 0.241 282.011)" },
];

// One shared starting point for every card: the strip reads as a single
// design in eight colourways, and the sliders are what makes yours distinct.
export const DEFAULT_SHAPE: PatternShape = "circle";
export const DEFAULT_FILLED = false;
// Spacing starts at 64 (SPACING_MIN); the slider only ever adds sparseness.
export const DEFAULT_SPACING = 0;
export const DEFAULT_FREQUENCY = 0.32; // ≈140px wavelength, the tuned default
export const DEFAULT_PHASE = 0;

export function seedConfigs(): Record<string, CardConfig> {
  return Object.fromEntries(
    PALETTE.map((p, i) => [
      `card-${i}`,
      {
        id: `card-${i}`,
        baseColor: p.color,
        shape: DEFAULT_SHAPE,
        filled: DEFAULT_FILLED,
        spacing: DEFAULT_SPACING,
        frequency: DEFAULT_FREQUENCY,
        phase: DEFAULT_PHASE,
        note: "",
      } satisfies CardConfig,
    ]),
  );
}

// --- Designed dial mappings (never expose raw params; PLAN.md Phase C) ---
//
// The pattern engine has ~13 params; all but three are pinned to tuned
// constants (see PATTERN_FIXED). The three sliders each map 0..1 into a safe
// band so every position on the track looks intentional.

/** Grid pitch in card-space px. Slider runs from the tuned default up. */
export const SPACING_MIN = 64;
export const SPACING_MAX = 125;
/** Radial wavelength in px. Lower = tighter rings. */
export const FREQ_MIN = 40;
export const FREQ_MAX = 400;

/** Constants the UI never exposes — the pattern's fixed personality. */
export const PATTERN_FIXED = {
  strokeWidth: 1.6,
  size: 32,
  angle: 0,
  staggerSize: 0.24,
  staggerAngle: 90,
  staggerSpacing: 16,
  /** plus-lighter is fixed off: shapes deepen the card colour (plus-darker). */
  plusLighter: false,
  /** Group opacity by fill mode. */
  filledOpacity: 0.1,
  outlineOpacity: 0.25,
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Resolve the three sliders + fixed constants into the pattern's real params. */
export function patternParams(config: CardConfig) {
  return {
    ...PATTERN_FIXED,
    shape: config.shape,
    filled: config.filled,
    spacing: lerp(SPACING_MIN, SPACING_MAX, config.spacing),
    staggerFreq: lerp(FREQ_MIN, FREQ_MAX, config.frequency),
    phase: config.phase * Math.PI * 2,
    opacity: config.filled
      ? PATTERN_FIXED.filledOpacity
      : PATTERN_FIXED.outlineOpacity,
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
  // 0.72, above the palette's 0.68: the coloured cards keep white ink and
  // their glowing additive marks. Only genuinely pale cards get dark ink.
  if (l >= 0.72) {
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
// Case is preserved as typed — the card uppercases on render (engraving is
// a property of the card, not of the input). The charset therefore has to
// admit both cases.
export const NOTE_CHARSET = /[^A-Za-z0-9 .,!♥]/g;

export function sanitizeNote(raw: string): string {
  return raw.replace(NOTE_CHARSET, "").slice(0, NOTE_MAX);
}

// --- URL serialization (applied on confirm; PLAN.md §3) ---

const SHAPES: PatternShape[] = ["circle", "rect", "triangle"];

export function cardConfigToParams(config: CardConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("c", config.baseColor);
  p.set("sh", config.shape);
  p.set("f", config.filled ? "1" : "0");
  p.set("sp", config.spacing.toFixed(3));
  p.set("fq", config.frequency.toFixed(3));
  p.set("ph", config.phase.toFixed(3));
  if (config.note) p.set("n", config.note);
  return p;
}

export function cardConfigFromParams(params: URLSearchParams): CardConfig | null {
  const c = params.get("c");
  if (!c || !OKLCH_RE.test(c)) return null;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const shape = params.get("sh");
  return {
    id: "shared",
    baseColor: c,
    shape: SHAPES.includes(shape as PatternShape)
      ? (shape as PatternShape)
      : DEFAULT_SHAPE,
    filled: params.get("f") === "1",
    spacing: clamp01(Number(params.get("sp") ?? DEFAULT_SPACING)),
    frequency: clamp01(Number(params.get("fq") ?? DEFAULT_FREQUENCY)),
    phase: clamp01(Number(params.get("ph") ?? DEFAULT_PHASE)),
    note: sanitizeNote(params.get("n") ?? ""),
  };
}
