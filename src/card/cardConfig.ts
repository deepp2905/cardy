// Types + palette + defaults + serialization for the card. PLAN.md §3–4.

export type PatternShape = "circle" | "rect" | "triangle";

/**
 * Per-card "personality": constants the UI never exposes but that we vary at
 * seed time so every colourway reads as its own design, not the same motif
 * recoloured. Overrides the matching PATTERN_FIXED values in patternParams.
 * Optional so a shared-link config (no personality in the URL) simply falls
 * back to the tuned defaults.
 */
export type CardPersonality = {
  angle: number; // base grid rotation, deg
  size: number; // mark size, px
  strokeWidth: number; // outline weight, px
  staggerSize: number; // wave pulse on cell size
  staggerAngle: number; // wave twist on cell angle, deg
  staggerSpacing: number; // wave shove along the radial, px
};

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
  /** Seed-time flavour; absent on shared links (falls back to PATTERN_FIXED). */
  personality?: CardPersonality;
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

// Defaults kept for the shared-link fallback path (cardConfigFromParams) and
// as the neutral centre of the randomised bands below.
export const DEFAULT_SHAPE: PatternShape = "circle";
export const DEFAULT_FILLED = false;
// Spacing starts at 64 (SPACING_MIN); the slider only ever adds sparseness.
export const DEFAULT_SPACING = 0;
export const DEFAULT_FREQUENCY = 0.32; // ≈140px wavelength, the tuned default
export const DEFAULT_PHASE = 0;

// Deterministic per-card PRNG. Seeding from the card index (rather than
// Math.random) keeps each colourway's pattern stable across reloads — the
// same eight cards every visit — which also keeps a demo reproducible.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHAPES_ALL: PatternShape[] = ["circle", "rect", "triangle"];

/** Random value in [min, max] from a 0..1 source. */
const band = (r: number, min: number, max: number) => min + r * (max - min);

// Each colourway also gets its own pattern, so the strip reads as eight
// distinct designs rather than one design recoloured. Bands are deliberately
// wide — the slider mappings clamp to safe ranges, so even the extremes stay
// legible — and every card is still a valid starting point the user can tune.
//
// The three sliders (spacing/frequency/phase) mostly change density and offset
// of ONE motif, which is why cards rhymed too closely. The bulk of the variance
// comes from the seed-time `personality`: grid angle, mark weight, and how hard
// the radial wave twists/pulses/shoves each cell — the levers that actually
// change a pattern's character. The dials stay untouched.
export function seedConfigs(): Record<string, CardConfig> {
  return Object.fromEntries(
    PALETTE.map((p, i) => {
      const rand = mulberry32(i * 2654435761 + 0x9e37);
      return [
        `card-${i}`,
        {
          id: `card-${i}`,
          baseColor: p.color,
          shape: SHAPES_ALL[Math.floor(rand() * SHAPES_ALL.length)],
          filled: rand() < 0.5,
          // Density is the most visible difference between cards, so spread it
          // near-full: some seed dense and busy, others sparse and airy. Both
          // ends are still legible via the slider mappings' safe clamps.
          spacing: band(rand(), 0, 0.9),
          frequency: band(rand(), 0.05, 0.95),
          phase: rand(),
          note: "",
          // Bold bands: wide swings around the tuned PATTERN_FIXED values so
          // each card reads as its own design, not a recolour of one motif.
          personality: {
            angle: band(rand(), 0, 45),
            size: band(rand(), 20, 44),
            strokeWidth: band(rand(), 1, 3),
            staggerSize: band(rand(), 0.08, 0.55),
            staggerAngle: band(rand(), 20, 170),
            staggerSpacing: band(rand(), 4, 30),
          },
        } satisfies CardConfig,
      ];
    }),
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
  /** Group opacity by fill mode. Outline is +25% over its original tuned
   *  value (0.25); filled reads lighter at the same bump, so it gets a
   *  further 15% on top (0.125 -> ~0.144) to match the outline's weight. */
  filledOpacity: 0.144,
  outlineOpacity: 0.3125,
} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Resolve the three sliders + fixed constants into the pattern's real params.
 *  The per-card personality (seed time) overrides the matching fixed values;
 *  a shared-link config carries none and keeps the tuned defaults. */
export function patternParams(config: CardConfig) {
  return {
    ...PATTERN_FIXED,
    ...config.personality,
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

// Personality order in the compact `pr` param. Keep in sync with the parser.
const PERSONALITY_KEYS = [
  "angle",
  "size",
  "strokeWidth",
  "staggerSize",
  "staggerAngle",
  "staggerSpacing",
] as const;

export function cardConfigToParams(config: CardConfig): URLSearchParams {
  const p = new URLSearchParams();
  p.set("c", config.baseColor);
  p.set("sh", config.shape);
  p.set("f", config.filled ? "1" : "0");
  p.set("sp", config.spacing.toFixed(3));
  p.set("fq", config.frequency.toFixed(3));
  p.set("ph", config.phase.toFixed(3));
  if (config.note) p.set("n", config.note);
  // Serialize personality so a shared card looks identical to the sender's,
  // not a defaults fallback. One compact param: six numbers, fixed order.
  if (config.personality) {
    p.set(
      "pr",
      PERSONALITY_KEYS.map((k) => config.personality![k].toFixed(2)).join(","),
    );
  }
  return p;
}

function personalityFromParam(raw: string | null): CardPersonality | undefined {
  if (!raw) return undefined;
  const n = raw.split(",").map(Number);
  if (n.length !== PERSONALITY_KEYS.length || n.some((v) => !Number.isFinite(v)))
    return undefined;
  return {
    angle: n[0],
    size: n[1],
    strokeWidth: n[2],
    staggerSize: n[3],
    staggerAngle: n[4],
    staggerSpacing: n[5],
  };
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
    personality: personalityFromParam(params.get("pr")),
  };
}
