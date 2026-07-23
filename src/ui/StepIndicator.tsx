import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";
import "./ui.css";

export type Step = "welcome" | "customize" | "confirm";

const STEPS: Step[] = ["welcome", "customize", "confirm"];

// Three segments; the lit fill spring-slides between them (layoutId).
export function StepIndicator({ current }: { current: Step }) {
  return (
    <div
      className="steps"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={STEPS.indexOf(current) + 1}
      aria-label={`Step ${STEPS.indexOf(current) + 1} of ${STEPS.length}`}
    >
      {STEPS.map((s) => (
        <div key={s} className="steps-seg">
          {s === current && (
            <motion.div
              className="steps-fill"
              layoutId="steps-fill"
              transition={snappy}
            />
          )}
        </div>
      ))}
    </div>
  );
}
