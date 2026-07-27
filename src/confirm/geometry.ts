// Every physical dimension in the confirm sequence, in millimetres.
// PRD-CONFIRM.md §2. One scale factor (`--mm`) converts mm to px; nothing
// inside the stage is ever sized in raw pixels except hairlines.

export const CARD = { w: 85.6, h: 53.98, r: 3.18 } as const; // ISO/IEC 7810 ID-1
export const SHEET = { w: 120, h: 192, r: 1.5, pad: 14 } as const;
export const PANEL_H = 64; // SHEET.h / 3
export const PACKET = { w: 120, h: 64 } as const;
export const ENVELOPE = { w: 126, h: 70, flapH: 38.5, r: 1.5 } as const;
export const SEAL_D = 14;
export const SLOT = { w: 139, h: 10, r: 5 } as const;

// --- Vertical choreography, y in mm relative to stage centre (PRD §2.3) ---

/** Where the envelope fades in: 2mm below the folded packet's bottom edge. */
export const ENVELOPE_ENTER_Y = 69;
/** Packet's descent into the pocket. Same figure, so the pair ends concentric. */
export const INSERT_TRAVEL = 69;
/** Gap between the envelope's bottom edge at rest and the slot's lip. */
export const SLOT_GAP = 40;
/** Slot lip position — the y at which the envelope disappears. */
export const SLOT_TOP = ENVELOPE.h / 2 + SLOT_GAP; // +75
/** The aperture's vertical MIDDLE — the seam where the two slot halves meet.
 *  Keep in step with `.slot-anchor`'s top in confirm.css; the halves offset
 *  themselves off this line and the masking plate starts SLOT.h / 2 below it
 *  (under the whole aperture, so the lower half stays visible). Used in JS as
 *  the point the envelope is "entering", which drives the hint fade and the
 *  slot close. */
export const SLOT_MOUTH = SLOT_TOP + SLOT.h / 2; // +80
/** How far the envelope travels to be fully swallowed. Must exceed
 *  SLOT_TOP + ENVELOPE.h / 2 (= 110mm): envY moves the envelope's CENTRE, so
 *  that is the point at which its top edge reaches the lip. Nothing fades on
 *  the way in — the slot plate is the only thing hiding it — so a shorter
 *  travel leaves a sliver of paper sitting above the slot. 120 keeps 10mm of
 *  margin. */
export const POST_TRAVEL = 120;

// --- Scale ---

/** The slot is the widest object in the flow, so it sets the horizontal scale. */
export const SCALE_W_DIVISOR = SLOT.w; // 139
/** The sheet is the tallest, so it sets the vertical one (+8mm breathing). */
export const SCALE_H_DIVISOR = SHEET.h + 8; // 200

// --- Sheet printing (PRD §3.2) ---

/** Registration outline sits 2.5mm outside the card on every side, so it reads
 *  as a frame rather than being covered by the card it marks. */
export const REG_INSET = 2.5;

export type Bar = { w: number; h: number; y: number; align?: "end" };

/** Top panel — letterhead. Wordmark is the only real text on the sheet. */
export const TOP_PANEL = {
  wordmarkY: 12,
  wordmarkSize: 7,
  refBar: { w: 22, h: 3, y: 9, align: "end" } as Bar,
  ruleY: 22,
  bars: [
    { w: 92, h: 2.6, y: 30 },
    { w: 92, h: 2.6, y: 37.6 },
    { w: 61, h: 2.6, y: 45.2 },
  ] as Bar[],
} as const;

/** Bottom panel — signature block over small print. */
export const BOTTOM_PANEL = {
  bars: [
    { w: 38, h: 2.6, y: 10 },
    { w: 26, h: 2.6, y: 17.6 },
  ] as Bar[],
  ruleY: 30,
  fineBars: [
    { w: 92, h: 1.8, y: 38 },
    { w: 92, h: 1.8, y: 43.2 },
    { w: 66, h: 1.8, y: 48.4 },
  ] as Bar[],
} as const;

// --- Drag thresholds (PRD §6.3) ---
// PLAN.md Phase F specifies a literal ~120px magnetic radius. In this geometry
// the resting gap between the envelope and the slot is only 40mm (~107px on
// desktop), so 120px would commit before the user had moved. Restated in mm:
// same "impossible to fail" guarantee, expressed in units that work here.

/** Release past halfway to the slot completes the post. */
export const POST_COMMIT_MM = 20;
/** Or any downward flick, from almost anywhere. */
export const POST_FLICK_MM = 6;
export const POST_FLICK_VELOCITY = 300; // px/s
/** A little upward give so the envelope doesn't feel nailed down. */
export const DRAG_TOP_GIVE = 8;

/** mm → a CSS length that tracks the stage scale. */
export function mm(value: number): string {
  return `calc(${value} * var(--mm))`;
}
