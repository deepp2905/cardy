import { useState } from "react";
import { motion } from "motion/react";
import { snappy, snappyFar } from "../lib/motionConfig";
import "./ui.css";

export type Step = "welcome" | "customize" | "confirm";

const STEPS: Step[] = ["welcome", "customize", "confirm"];

// Three segments; the lit fill spring-slides between them (layoutId).
// A jump of more than one segment (confirm -> welcome) uses a stiffer spring
// so the longer trip doesn't read as a slow drift across the whole bar.
export function StepIndicator({ current }: { current: Step }) {
  const index = STEPS.indexOf(current);

  // Track the previous step as state, not a render-phase ref mutation:
  // StrictMode double-invokes render, which would zero the distance on the
  // second pass and silently fall back to the single-step spring.
  const [prev, setPrev] = useState(index);
  if (prev !== index) setPrev(index);
  const distance = Math.abs(index - prev);

  return (
    <div
      className="steps"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={index + 1}
      aria-label={`Step ${index + 1} of ${STEPS.length}`}
    >
      {STEPS.map((s) => (
        <div key={s} className="steps-seg">
          {s === current && (
            <motion.div
              className="steps-fill"
              layoutId="steps-fill"
              transition={distance > 1 ? snappyFar : snappy}
            />
          )}
        </div>
      ))}
    </div>
  );
}
