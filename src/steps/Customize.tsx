import type { CSSProperties } from "react";
import { CardCarousel } from "../carousel/CardCarousel";
import type { CardConfig } from "../card/cardConfig";
import { DialPanel } from "../controls/DialPanel";
import { Button } from "../ui/Button";
import "./steps.css";

type CustomizeProps = {
  configs: Record<string, CardConfig>;
  ids: string[];
  activeId: string;
  onActiveChange: (id: string) => void;
  onPatch: (id: string, patch: Partial<CardConfig>) => void;
  onOrder: () => void;
};

export function Customize({
  configs,
  ids,
  activeId,
  onActiveChange,
  onPatch,
  onOrder,
}: CustomizeProps) {
  const active = configs[activeId];

  return (
    <div
      className="customize"
      style={{ "--accent": active.baseColor } as CSSProperties}
    >
      <CardCarousel
        configs={configs}
        ids={ids}
        activeId={activeId}
        onActiveChange={onActiveChange}
      />
      <DialPanel
        config={active}
        onPatch={(patch) => onPatch(activeId, patch)}
      />
      <Button onClick={onOrder}>Order this card</Button>
    </div>
  );
}
