import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { ThemeToggle } from "../ui/ThemeToggle";
import { CardPlayground } from "./CardPlayground";
import { PalettePlayground } from "./PalettePlayground";
import { TypePlayground } from "./TypePlayground";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

const TABS = [
  { path: "/play/card", label: "Card" },
  { path: "/play/palette", label: "Palette" },
  { path: "/play/type", label: "Type" },
];

export default function Playground() {
  const route = useHashRoute();
  const page = route.replace(/^\/play\/?/, "") || "index";

  return (
    <div className="playground">
      <div className="corner-controls">
        <ThemeToggle />
      </div>
      <nav className="pg-nav" aria-label="Playground pages">
        <span className="pg-brand">cardy · playground</span>
        <div className="pg-tabs">
          {TABS.map((t) => (
            <a
              key={t.path}
              href={`#${t.path}`}
              className="pg-tab"
              aria-current={page === t.label.toLowerCase() ? "page" : undefined}
            >
              {t.label}
            </a>
          ))}
          <a href="#/" className="pg-tab pg-tab-exit">
            ← App
          </a>
        </div>
      </nav>

      <main className="pg-main">
        {page === "card" && <CardPlayground />}
        {page === "palette" && <PalettePlayground />}
        {page === "type" && <TypePlayground />}
        {page === "index" && (
          <div className="pg-index">
            <h1>Playground</h1>
            <p>
              Tune values with the dial panel, then copy them and hand them back
              to apply in the app.
            </p>
            <div className="pg-index-links">
              {TABS.map((t) => (
                <a key={t.path} href={`#${t.path}`} className="pg-index-link">
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <DialRoot />
    </div>
  );
}
