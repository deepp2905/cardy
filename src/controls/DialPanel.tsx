import type { CardConfig } from "../card/cardConfig";
import { Dial } from "./Dial";
import { NoteField } from "./NoteField";
import "./controls.css";

// Controlled panel bound to the centered card's config (PLAN.md §3):
// reads/writes configs[activeId] only — no global dial state.
type DialPanelProps = {
  config: CardConfig;
  onPatch: (patch: Partial<CardConfig>) => void;
};

export function DialPanel({ config, onPatch }: DialPanelProps) {
  return (
    <div className="dial-panel">
      <div className="dial-row">
        <Dial
          label="Character"
          value={config.character}
          onChange={(character) => onPatch({ character })}
        />
        <Dial
          label="Intensity"
          value={config.intensity}
          onChange={(intensity) => onPatch({ intensity })}
        />
      </div>
      <NoteField value={config.note} onChange={(note) => onPatch({ note })} />
    </div>
  );
}
