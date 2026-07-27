import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Card } from "../card/Card";
import { PALETTE, type CardConfig, type PatternShape } from "../card/cardConfig";
import "./wallpaper.css";

/**
 * TEMPORARY screenshot route (#/wallpaper).
 *
 * A dense field of cards that bleeds off every edge, for grabbing a marketing
 * shot. Not part of the product flow: no chrome, no interaction, no links in
 * or out. Delete the folder and its two lines in App.tsx to remove it.
 *
 * Everything is rolled: colour, name, shape, fill, spacing, frequency and
 * personality. Deliberately NOT the balanced deal seedConfigs() uses — the
 * nine-card strip needs guaranteed coverage, but a wallpaper wants the
 * clumping a plain roll gives, since evenly spread variety reads as arranged.
 *
 * Rows are NOT column-aligned. Each carries its own horizontal phase offset —
 * a fraction of one column pitch — so the field reads as drifting bands rather
 * than a spreadsheet. That is why rows are flex strips instead of CSS grid
 * rows: a grid would lock every row to shared column tracks.
 */

const CARD_W = 300; // px per column
const GAP = 16;

const SHAPES: PatternShape[] = ["circle", "rect", "triangle"];

const FIRST = [
  "Ava", "Noah", "Mia", "Liam", "Zoe", "Kai", "Iris", "Omar", "Luca", "Nina",
  "Theo", "Maya", "Ezra", "Ruby", "Milo", "Sofia", "Jude", "Elena", "Arlo",
  "Hana", "Felix", "Nadia", "Cyrus", "Leila", "Otto", "Priya", "Rex", "Yuki",
  "Dara", "Ivan", "Juno", "Marco", "Nour", "Pia", "Quinn", "Rafa", "Suri",
  "Tomas", "Uma", "Vera", "Wren", "Xavi", "Yara", "Zane",
];
const LAST = [
  "Hart", "Vega", "Osei", "Lund", "Reyes", "Kato", "Moss", "Adeyemi", "Ferrari",
  "Okonkwo", "Silva", "Novak", "Haddad", "Lindqvist", "Duarte", "Ionescu",
  "Bergman", "Castillo", "Nakamura", "Petrov", "Sandoval", "Weiss", "Achebe",
  "Delgado", "Fontaine", "Grimaldi", "Halvorsen", "Ismail",
];

/** Same PRNG as cardConfig's, so a given seed always yields the same field. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const band = (r: number, min: number, max: number) => min + r * (max - min);

type Tile = { config: CardConfig; name: string };

function buildTiles(count: number, seed: number): Tile[] {
  const rand = mulberry32(seed);
  // Everything rolled, including shape and fill. An even deal reads as too
  // orderly here — the clumping a plain roll produces (three triangles
  // adjacent, a patch of outlines) is what makes the field look scattered
  // rather than arranged.
  return Array.from({ length: count }, (_, i) => ({
    config: {
      id: `wall-${i}`,
      baseColor: PALETTE[Math.floor(rand() * PALETTE.length)].color,
      shape: SHAPES[Math.floor(rand() * SHAPES.length)],
      filled: rand() < 0.5,
      spacing: band(rand(), 0, 0.9),
      frequency: band(rand(), 0.05, 0.95),
      note: "",
      personality: {
        angle: band(rand(), 0, 45),
        size: band(rand(), 20, 44),
        strokeWidth: band(rand(), 1, 3),
        staggerSize: band(rand(), 0.08, 0.72),
        staggerAngle: band(rand(), 20, 90),
        staggerSpacing: band(rand(), 4, 24),
      },
    },
    name: `${FIRST[Math.floor(rand() * FIRST.length)]} ${
      LAST[Math.floor(rand() * LAST.length)]
    }`,
  }));
}

export default function Wallpaper() {
  // Fill the viewport plus one full card of bleed on every side, so the field
  // is cut off mid-card at all four edges rather than ending on a clean row.
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // Seed from the hash (#/wallpaper/7) so you can roll a different field
  // without touching code — handy when one layout happens to clump.
  const seed = useMemo(() => {
    const n = Number(window.location.hash.split("/")[2]);
    return Number.isFinite(n) && n > 0 ? n : 20260727;
  }, []);

  const cardH = CARD_W / (85.6 / 53.98);
  const pitch = CARD_W + GAP;
  // One extra column beyond the bleed, because a phase-shifted row slides up to
  // a full pitch sideways and would otherwise pull its end card into view.
  const cols = Math.ceil((size.w + CARD_W * 2) / pitch) + 1;
  const rows = Math.ceil((size.h + cardH * 2) / (cardH + GAP));
  const tiles = useMemo(() => buildTiles(cols * rows, seed), [cols, rows, seed]);

  // Per-row horizontal phase. Rows are offset by their own fraction of a pitch
  // so the columns never line up into a rigid lattice — the field reads as
  // drifting bands of cards rather than a spreadsheet. Seeded from the row
  // index (offset from the tile stream) so it is stable across resizes.
  const phases = useMemo(() => {
    const rand = mulberry32(seed ^ 0x5bf03635);
    return Array.from({ length: rows }, () => rand() * pitch);
  }, [rows, seed, pitch]);

  return (
    <div
      className="wallpaper"
      // --card-w drives .wallpaper-cell, so the column width lives only in
      // CARD_W and the CSS can't drift from the JS tile maths.
      style={{ "--card-w": `${CARD_W}px` } as CSSProperties}
    >
      <div className="wallpaper-field" style={{ gap: `${GAP}px` }}>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="wallpaper-row"
            // Negative so the shift pulls left into the bleed; the extra column
            // above covers the gap this opens on the right.
            style={{ gap: `${GAP}px`, marginLeft: `${-phases[r]}px` }}
          >
            {tiles.slice(r * cols, (r + 1) * cols).map((t) => (
              <div key={t.config.id} className="wallpaper-cell">
                <Card config={t.config} name={t.name} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
