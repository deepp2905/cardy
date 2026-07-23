import { useState } from "react";
import { motion } from "motion/react";
import { snappy } from "../lib/motionConfig";

// Copies apply-ready text (the caller decides the format) and confirms.
export function CopyButton({
  getText,
  label = "Copy values",
}: {
  getText: () => string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.button
      type="button"
      className="pg-copy"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={snappy}
      data-copied={copied}
    >
      {copied ? "Copied ✓" : label}
    </motion.button>
  );
}
