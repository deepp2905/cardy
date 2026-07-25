import { useState, type ReactElement } from "react";
import { useDialKit } from "dialkit";
import { oklchString } from "../../card/cardConfig";
import { Segmented } from "../../controls/Segmented";
import { snappyCalm } from "../../lib/motionConfig";
import { VariantBoundary } from "../../explore/VariantBoundary";
import { ShaderWaveVariant } from "./ShaderWaveVariant";
import { FlatMinimalVariant } from "./FlatMinimalVariant";
import { EngravedVariant } from "./EngravedVariant";
import { PatternVariant } from "./PatternVariant";
import "./cardvariants.css";

// Explore art-direction treatments of the card face. One shared colour drives
// every variant so you compare directions on the same colour; each variant
// mounts its own dialkit for its art, and only the active one shows.

type Variant = {
  id: string;
  name: string;
  note: string;
  render: (baseColor: string) => ReactElement;
};

const VARIANTS: Variant[] = [
  {
    id: "shader",
    name: "Shader + wave",
    note: "The current shipping face",
    render: (c) => <ShaderWaveVariant baseColor={c} />,
  },
  {
    id: "flat",
    name: "Flat minimal",
    note: "Solid fill, one hairline",
    render: (c) => <FlatMinimalVariant baseColor={c} />,
  },
  {
    id: "engraved",
    name: "Engraved",
    note: "Guilloché line field",
    render: (c) => <EngravedVariant baseColor={c} />,
  },
  {
    id: "pattern",
    name: "Pattern",
    note: "Staggered shape field",
    render: (c) => <PatternVariant baseColor={c} />,
  },
];

export function CardExplorer() {
  const [activeId, setActiveId] = useState("pattern");
  const active = VARIANTS.find((v) => v.id === activeId) ?? VARIANTS[0];

  // Shared colour, one panel, drives whichever variant is active.
  const col = useDialKit("Colour", {
    l: [0.68, 0, 1, 0.005],
    c: [0.22, 0, 0.4, 0.005],
    h: [250, 0, 360, 1],
  });
  const baseColor = oklchString(col.l, col.c, col.h);

  return (
    <div className="cv-explorer">
      <div className="cv-switcher">
        <Segmented
          label="Card variant"
          value={activeId}
          options={VARIANTS.map((v) => ({ value: v.id, label: v.name }))}
          onChange={setActiveId}
          fitContent
          transition={snappyCalm}
        />
      </div>
      <div className="cv-stage">
        {/* Keyed so switching variants remounts and only the active variant's
            art dialkit is registered. */}
        <VariantBoundary key={active.id} variantName={active.name}>
          <div className="cv-card-wrap">{active.render(baseColor)}</div>
        </VariantBoundary>
      </div>
    </div>
  );
}
