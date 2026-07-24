import { useState } from "react";
import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { DevNav } from "../playground/DevNav";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ExploreShell } from "./ExploreShell";
import { VariantBoundary } from "./VariantBoundary";
import { VariantSwitcher, type VariantMeta } from "./VariantSwitcher";
import { AppleWalletVariant } from "./variants/AppleWalletVariant";
import { CoverflowVariant } from "./variants/CoverflowVariant";
import { ExplodedVariant } from "./variants/ExplodedVariant";
import { ScrollVariant } from "./variants/ScrollVariant";
import { TiersVariant } from "./variants/TiersVariant";
import { WalletVariant } from "./variants/WalletVariant";
import { WingsVariant } from "./variants/WingsVariant";
import "./explore.css";

// Rough sketches of card-carousel mechanics, each in Step 2's real chrome so
// the layout is judged in the space it would actually get. Cards are grey
// wireframes — this is about ARRANGEMENT, not artwork.

// Horizontal decks first, then vertical — grouped by scroll axis so the menu
// reads by mechanic.
const VARIANTS: (VariantMeta & { render: () => React.ReactElement })[] = [
  // --- horizontal ---
  {
    id: "scroll",
    name: "Horizontal scroll",
    note: "What ships today",
    render: () => <ScrollVariant />,
  },
  {
    id: "coverflow",
    name: "Coverflow",
    note: "Neighbours rotate away like wings",
    render: () => <CoverflowVariant />,
  },
  {
    id: "wings",
    name: "Perspective wings",
    note: "Neighbours hinge on their inner edge",
    render: () => <WingsVariant />,
  },
  // --- vertical ---
  {
    id: "exploded",
    name: "Exploded stack",
    note: "Fanned along depth, tilted back",
    render: () => <ExplodedVariant />,
  },
  {
    id: "wallet",
    name: "Revolut wallet",
    note: "Focused card lifts out of the stack",
    render: () => <WalletVariant />,
  },
  {
    id: "apple",
    name: "Apple wallet",
    note: "Tight stack, strip peek",
    render: () => <AppleWalletVariant />,
  },
  {
    id: "tiers",
    name: "Fanned tiers",
    note: "Pyramid of narrowing bands",
    render: () => <TiersVariant />,
  },
];

export default function Explore() {
  const [activeId, setActiveId] = useState(VARIANTS[0].id);
  const active = VARIANTS.find((v) => v.id === activeId) ?? VARIANTS[0];

  return (
    <div className="explore">
      <div className="corner-controls">
        <ThemeToggle />
      </div>
      <DevNav />

      <VariantSwitcher
        variants={VARIANTS}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {/* Keyed so switching variants remounts: each mounts its own dialkit
          panel, and only the mounted one's panel is registered. */}
      <ExploreShell key={active.id}>
        <VariantBoundary variantName={active.name}>
          {active.render()}
        </VariantBoundary>
      </ExploreShell>

      {/* bottom-RIGHT here: the variant menu owns bottom-left on this page. */}
      <DialRoot position="bottom-right" />
    </div>
  );
}
