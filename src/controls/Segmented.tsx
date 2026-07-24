import { useId } from "react";
import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";
import "./controls.css";

// A pill segmented control that mirrors the slider's visual language: same
// track fill, same uppercase label, same pill radius. The active indicator is
// a shared-layout element so switching options glides the pill across rather
// than hard-cutting — the retarget is the micro-moment, like the slider thumb.

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Optional glyph shown above the label (e.g. shape previews). */
  icon?: React.ReactNode;
};

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  // Unique group so multiple Segmented controls don't share one layout pill.
  const groupId = useId();
  return (
    <div className="segmented-field">
      <span className="segmented-label">{label}</span>
      <div className="segmented-track" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className="segmented-option"
              data-active={active}
              onClick={() => onChange(opt.value)}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${groupId}`}
                  className="segmented-indicator"
                  transition={snappy}
                />
              )}
              <span className="segmented-content">
                {opt.icon && (
                  <span className="segmented-icon" aria-hidden="true">
                    {opt.icon}
                  </span>
                )}
                <span className="segmented-text">{opt.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
