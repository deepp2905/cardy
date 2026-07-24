import type { CardConfig } from "../card/cardConfig";
import { NoteField } from "./NoteField";
import { Slider } from "./Slider";
import "./controls.css";

// Controlled panel bound to the centered card's config (PLAN.md §3):
// reads/writes configs[activeId] only — no global control state.
type DialPanelProps = {
  config: CardConfig;
  onPatch: (patch: Partial<CardConfig>) => void;
};

// Note sits above the sliders; the whole panel is pinned to the bottom of
// the step, just above the action bar.
export function DialPanel({ config, onPatch }: DialPanelProps) {
  return (
    <div className="dial-panel">
      <NoteField value={config.note} onChange={(note) => onPatch({ note })} />
      <Slider
        label="Character"
        value={config.character}
        onChange={(character) => onPatch({ character })}
      />
      <Slider
        label="Intensity"
        value={config.intensity}
        onChange={(intensity) => onPatch({ intensity })}
      />
    </div>
  );
}
