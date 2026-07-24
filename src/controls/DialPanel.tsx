import type { CardConfig, PatternShape } from "../card/cardConfig";
import { NoteField } from "./NoteField";
import { Slider } from "./Slider";
import { Segmented, type SegmentedOption } from "./Segmented";
import "./controls.css";

// Controlled panel bound to the centered card's config (PLAN.md §3):
// reads/writes configs[activeId] only — no global control state.
type DialPanelProps = {
  config: CardConfig;
  /** Shared across all cards, so it lives above the per-card config. */
  note: string;
  onNoteChange: (note: string) => void;
  onPatch: (patch: Partial<CardConfig>) => void;
};

// Tiny previews of the three shapes, so the picker shows what it makes.
const shapeIcon = (shape: PatternShape) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 14 14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
  };
  if (shape === "circle")
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="5" />
      </svg>
    );
  if (shape === "rect")
    return (
      <svg {...common}>
        <rect x="2" y="2" width="10" height="10" rx="1.6" />
      </svg>
    );
  return (
    <svg {...common} strokeLinejoin="round">
      <polygon points="7,2 12,12 2,12" />
    </svg>
  );
};

const SHAPE_OPTIONS: SegmentedOption<PatternShape>[] = [
  { value: "circle", label: "Circle", icon: shapeIcon("circle") },
  { value: "rect", label: "Square", icon: shapeIcon("rect") },
  { value: "triangle", label: "Triangle", icon: shapeIcon("triangle") },
];

const FILL_OPTIONS: SegmentedOption<"outline" | "filled">[] = [
  { value: "outline", label: "Outline" },
  { value: "filled", label: "Filled" },
];

// Note sits above the controls; the whole panel is pinned to the bottom of
// the step, just above the action bar.
export function DialPanel({
  config,
  note,
  onNoteChange,
  onPatch,
}: DialPanelProps) {
  return (
    <div className="dial-panel">
      <NoteField value={note} onChange={onNoteChange} />
      <div className="dial-row">
        <Segmented
          label="Shape"
          value={config.shape}
          options={SHAPE_OPTIONS}
          onChange={(shape) => onPatch({ shape })}
          iconOnly
        />
        <Segmented
          label="Fill"
          value={config.filled ? "filled" : "outline"}
          options={FILL_OPTIONS}
          onChange={(v) => onPatch({ filled: v === "filled" })}
        />
      </div>
      <Slider
        label="Spacing"
        value={config.spacing}
        onChange={(spacing) => onPatch({ spacing })}
      />
      <Slider
        label="Frequency"
        value={config.frequency}
        onChange={(frequency) => onPatch({ frequency })}
      />
      <Slider
        label="Phase"
        value={config.phase}
        onChange={(phase) => onPatch({ phase })}
      />
    </div>
  );
}
