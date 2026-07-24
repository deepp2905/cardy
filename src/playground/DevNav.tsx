import { DEV_TABS } from "./devTabs";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

// Shared top nav for every dev route (the /play pages and /explore), so the
// tabs and the exit link stay put wherever you are.

export function DevNav() {
  const route = useHashRoute();

  return (
    <nav className="pg-nav" aria-label="Dev pages">
      <span className="pg-brand">cardy · playground</span>
      <div className="pg-tabs">
        {DEV_TABS.map((t) => (
          <a
            key={t.path}
            href={`#${t.path}`}
            className="pg-tab"
            aria-current={route.startsWith(t.path) ? "page" : undefined}
          >
            {t.label}
          </a>
        ))}
        <a href="#/" className="pg-tab pg-tab-exit">
          ← App
        </a>
      </div>
    </nav>
  );
}
