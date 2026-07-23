import type { ReactNode } from "react";
import { BackButton } from "./BackButton";
import "./ui.css";

// Consistent bottom-anchored action row. Optional square back button on the
// left; the primary CTA (children) flexes to fill the remaining width.
export function ActionBar({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="action-bar">
      {onBack && <BackButton onClick={onBack} />}
      {children}
    </div>
  );
}
