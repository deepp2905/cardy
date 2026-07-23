import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { snappy } from "../lib/motionConfig";
import "./ui.css";

type ButtonProps = ComponentProps<typeof motion.button> & {
  variant?: "primary" | "secondary";
};

export function Button({ variant = "primary", ...rest }: ButtonProps) {
  return (
    <motion.button
      className={`btn btn-${variant}`}
      whileTap={{ scale: 0.97 }}
      transition={snappy}
      {...rest}
    />
  );
}
