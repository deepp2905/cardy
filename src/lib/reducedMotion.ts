import { useReducedMotion } from "motion/react";

// Single import point for the reduced-motion gate so the contract in
// PLAN.md §7 has one seam to audit.
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
