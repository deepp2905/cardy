import { useState } from "react";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import { motion } from "motion/react";
import { card as cardSpring } from "./lib/motionConfig";

type Step = "welcome" | "customize" | "confirm";

// Phase 0 shell: step machine skeleton + dialkit smoke test.
// The placeholder swatch below gets replaced by Card.tsx in Phase A.
export default function App() {
  const [step] = useState<Step>("welcome");

  const p = useDialKit("Phase 0 smoke test", {
    hue: [250, 0, 360, 1],
    scale: [1, 0.5, 1.5, 0.01],
  });

  return (
    <div className="column">
      <motion.div
        className="placeholder-card"
        animate={{ scale: p.scale }}
        transition={cardSpring}
        style={{ background: `oklch(0.62 0.19 ${p.hue})` }}
      />
      <p className="shell-note">cardy — phase 0 shell ({step})</p>
      <DialRoot />
    </div>
  );
}
