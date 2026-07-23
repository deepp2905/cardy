// Name personalization from the URL path (PLAN.md Phase P).
//
// `/alex-rivera` => { first: "Alex", last: "Rivera", cardName: "ALEX RIVERA" }
//
// Read ONCE at mount. The app never mutates the URL — every step change is
// useState — so the segment survives the whole journey without a router.

export type Person = {
  first: string;
  last: string;
  /** Pre-capped, uppercased, ready to engrave. */
  cardName: string;
};

export const DEFAULT_PERSON: Person = {
  first: "Alex",
  last: "Rivera",
  cardName: "ALEX RIVERA",
};

// Longest name the mono face fits on one card line at 4.4cqw. The parser owns
// this cap so Card stays a pure (config) => visual with no truncation logic.
export const CARD_NAME_MAX = 20;

// Letters and interior dashes only. Everything else — digits, dots, slashes,
// encoded bytes, a scanner probe, /favicon.ico — falls back to the default.
// This is the injection guard, not a formatting nicety.
const SEGMENT_RE = /^[A-Za-z]([A-Za-z-]*[A-Za-z])?$/;

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function parsePerson(pathname?: string): Person {
  const raw = pathname ?? window.location.pathname;

  let segment: string;
  try {
    segment = decodeURIComponent(raw.replace(/^\/+|\/+$/g, ""));
  } catch {
    return DEFAULT_PERSON; // malformed percent-encoding
  }

  if (!SEGMENT_RE.test(segment)) return DEFAULT_PERSON;

  const parts = segment.split("-").filter(Boolean).map(titleCase);
  if (parts.length === 0) return DEFAULT_PERSON;

  // Split on the FIRST dash; extra dashes fold into the last name, so
  // "mary-jane-watson" reads as Mary / Jane Watson.
  const [first, ...rest] = parts;
  const last = rest.join(" ");

  return { first, last, cardName: engrave(first, last) };
}

// Fit the name to the card without truncating mid-word: try "FIRST LAST",
// then "FIRST L." (the convention embossed cards already use), then a hard
// cut as the last resort.
function engrave(first: string, last: string): string {
  const full = [first, last].filter(Boolean).join(" ").toUpperCase();
  if (full.length <= CARD_NAME_MAX) return full;

  if (last) {
    const abbreviated = `${first.toUpperCase()} ${last.charAt(0).toUpperCase()}.`;
    if (abbreviated.length <= CARD_NAME_MAX) return abbreviated;
  }

  return first.toUpperCase().slice(0, CARD_NAME_MAX).trimEnd();
}
