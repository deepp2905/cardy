import { Segmented } from "../controls/Segmented";
import { snappyCalm } from "../lib/motionConfig";
import { DEV_TABS } from "./devTabs";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

// Shared top nav for every dev route (the /play pages and /explore). The route
// menu is the app's Segmented control (fit-content); the exit-to-app button
// mirrors the corner theme toggle so the whole header row reads as one system.

export function DevNav() {
  const route = useHashRoute();

  // Which tab is active — the longest matching path wins (so /play/card beats a
  // bare prefix). Falls back to the first tab.
  const active =
    DEV_TABS.filter((t) => route.startsWith(t.path))
      .sort((a, b) => b.path.length - a.path.length)[0]?.path ??
    DEV_TABS[0].path;

  return (
    <nav className="pg-nav" aria-label="Dev pages">
      <a href="#/" className="pg-exit corner-btn" aria-label="Back to app">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 12H5m6-6-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      <div className="pg-nav-menu">
        <Segmented
          label="Dev pages"
          value={active}
          options={DEV_TABS.map((t) => ({ value: t.path, label: t.label }))}
          onChange={(path) => {
            window.location.hash = `#${path}`;
          }}
          fitContent
          transition={snappyCalm}
        />
      </div>
    </nav>
  );
}
