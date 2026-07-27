import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { CardExplorer } from "./cardvariants/CardExplorer";
import { DEV_TABS } from "./devTabs";
import { PalettePlayground } from "./PalettePlayground";
import { SequencePlayground } from "./SequencePlayground";
import { TypePlayground } from "./TypePlayground";
import { useHashRoute } from "./useHashRoute";
import "./playground.css";

export default function Playground() {
  const route = useHashRoute();
  const page = route.replace(/^\/play\/?/, "") || "index";

  return (
    <div className="playground">
      <main className="pg-main">
        {page === "card" && <CardExplorer />}
        {page === "palette" && <PalettePlayground />}
        {page === "type" && <TypePlayground />}
        {page === "sequence" && <SequencePlayground />}
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

      {/* productionEnabled: dialkit hides itself in production builds by
          default (its `isDevDefault` reads import.meta.env.MODE), so DialRoot
          returned null on the deployed URL and the panels never appeared. The
          playground is reachable only from #/play and its chunk is lazy, so
          real visitors to the main flow still never download or see it. */}
      <DialRoot
        position="bottom-right"
        defaultOpen={false}
        productionEnabled
      />
    </div>
  );
}
