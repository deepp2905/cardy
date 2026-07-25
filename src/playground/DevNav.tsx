import { DEV_TABS } from "./devTabs";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

// Shared top nav for every dev route (the /play pages and /explore), so the
// tabs and the exit link stay put wherever you are.

export function DevNav() {
  const route = useHashRoute();

  return (
    <nav className="pg-nav" aria-label="Dev pages">
      <a href="#/" className="pg-tab pg-tab-exit">
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
        App
      </a>
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
      </div>
      <span className="pg-brand">playground</span>
    </nav>
  );
}
