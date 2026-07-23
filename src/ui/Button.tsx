import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { snappy } from "../lib/motionConfig";
import "./ui.css";

type ButtonProps = ComponentProps<typeof motion.button> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <motion.button
      className={["btn", `btn-${variant}`, className].filter(Boolean).join(" ")}
      whileTap={{ scale: 0.96 }}
      transition={snappy}
      {...rest}
    />
  );
}
