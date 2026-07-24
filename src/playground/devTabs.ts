// Dev route tabs, shared by DevNav and the playground index. Kept out of
// DevNav.tsx so that file only exports components (fast-refresh rule).
export const DEV_TABS = [
  { path: "/play/card", label: "Card" },
  { path: "/play/palette", label: "Palette" },
  { path: "/play/type", label: "Type" },
  // Own route, not a /play page — it has its own chrome and dial panels.
  { path: "/explore", label: "Carousel ideas" },
];
