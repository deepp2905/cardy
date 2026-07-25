import type { ReactNode } from "react";
import "./explore.css";

// Just a centred stage for the carousel variant. The old Step 2 chrome (step
// indicator + low-fi mock controls) was removed — it added complexity without
// changing what the variant reads like.

export function ExploreShell({ children }: { children: ReactNode }) {
  return (
    <div className="explore-column">
      <main className="explore-stage">{children}</main>
    </div>
  );
}
