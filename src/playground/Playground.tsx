import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { ThemeToggle } from "../ui/ThemeToggle";
import { CardPlayground } from "./CardPlayground";
import { DevNav } from "./DevNav";
import { DEV_TABS } from "./devTabs";
import { PalettePlayground } from "./PalettePlayground";
import { TypePlayground } from "./TypePlayground";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

export default function Playground() {
  const route = useHashRoute();
  const page = route.replace(/^\/play\/?/, "") || "index";

  return (
    <div className="playground">
      <div className="corner-controls">
        <ThemeToggle />
      </div>
      <DevNav />

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
              {DEV_TABS.map((t) => (
                <a key={t.path} href={`#${t.path}`} className="pg-index-link">
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <DialRoot position="bottom-left" />
    </div>
  );
}
