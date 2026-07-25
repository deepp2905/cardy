import { useMemo } from "react";
import { useDialKit } from "dialkit";
import { Card } from "../card/Card";
import { seedConfigs } from "../card/cardConfig";
import { CopyButton } from "./CopyButton";

// Live specimen for the card's type roles. The specimen IS the real card
// (same component, pattern art, layout) rendered in grayscale, so the wordmark,
// name and note are tweaked exactly where they sit on the shipped card. The
// three roles are overridden live via a scoped <style> — nothing touches :root.
export function TypePlayground() {
  const p = useDialKit("Card type", {
    wordmark: {
      size: [6.4, 4, 9, 0.1],
      weight: [650, 200, 700, 10],
      tracking: [0.01, -0.04, 0.1, 0.005],
    },
    name: {
      size: [4.4, 3, 7, 0.1],
      weight: [590, 200, 700, 10],
      tracking: [0.05, 0, 0.3, 0.005],
    },
    note: {
      size: [3.1, 2, 5, 0.1],
      weight: [400, 200, 700, 10],
      tracking: [0.12, 0, 0.3, 0.005],
    },
  });

  // A real seeded card so the pattern art is genuine, not a placeholder.
  const config = useMemo(() => {
    const c = seedConfigs()["card-2"];
    return { ...c, note: "For coffee only" };
  }, []);

  // Override the three card roles on this instance only. Scoped by the wrapper
  // class so it never leaks to other cards on the page.
  const overrides = `
    .pg-type-card .card-wordmark {
      font-size: ${p.wordmark.size}cqw;
      font-weight: ${p.wordmark.weight};
      letter-spacing: ${p.wordmark.tracking}em;
    }
    .pg-type-card .card-name {
      font-size: ${p.name.size}cqw;
      font-weight: ${p.name.weight};
      letter-spacing: ${p.name.tracking}em;
    }
    .pg-type-card .card-note {
      font-size: ${p.note.size}cqw;
      font-weight: ${p.note.weight};
      letter-spacing: ${p.note.tracking}em;
    }
  `;

  const copyText = () =>
    [
      `/* card.css (cqw units) */`,
      `.card-wordmark { font-size: ${p.wordmark.size.toFixed(1)}cqw; font-weight: ${p.wordmark.weight}; letter-spacing: ${p.wordmark.tracking.toFixed(3)}em; }`,
      `.card-name { font-size: ${p.name.size.toFixed(1)}cqw; font-weight: ${p.name.weight}; letter-spacing: ${p.name.tracking.toFixed(3)}em; }`,
      `.card-note { font-size: ${p.note.size.toFixed(1)}cqw; font-weight: ${p.note.weight}; letter-spacing: ${p.note.tracking.toFixed(3)}em; }`,
    ].join("\n");

  return (
    <div className="pg-page pg-type">
      <style>{overrides}</style>
      <div className="pg-type-card pg-card-wrap">
        <Card config={config} name="ALEX RIVERA" />
      </div>
      <CopyButton getText={copyText} label="Copy card type tokens" />
    </div>
  );
}
