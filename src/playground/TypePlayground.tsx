import { useMemo } from "react";
import { useDialKit } from "dialkit";
import { Card } from "../card/Card";
import { seedConfigs } from "../card/cardConfig";
import { CopyButton } from "./CopyButton";

// Every typography role, shown in its original context so it's tuned where it
// actually appears: the app's display headline + subtitle on a welcome-style
// block, and the card's wordmark / name / note on the real Card (pattern art
// removed, grayscale) so the type is isolated. Roles are overridden live via a
// scoped <style> — nothing here touches :root.
export function TypePlayground() {
  const p = useDialKit("Type", {
    // --- app chrome (steps.css .welcome-copy) ---
    display: {
      size: [34, 20, 72, 1],
      weight: [600, 200, 700, 10],
      tracking: [-0.01, -0.06, 0.04, 0.005],
      leading: [1.1, 0.9, 1.6, 0.05],
    },
    subtitle: {
      size: [18, 12, 24, 1],
      weight: [450, 200, 700, 10],
      tracking: [0, -0.03, 0.04, 0.005],
      leading: [1.6, 1.2, 1.9, 0.05],
    },
    // --- card roles (card.css, cqw units) ---
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

  // A real seeded card for genuine layout; the note gives the third role.
  const config = useMemo(() => {
    const c = seedConfigs()["card-2"];
    return { ...c, note: "For coffee only" };
  }, []);

  // Override each role on this instance only, scoped by the wrapper classes so
  // nothing leaks. The card's pattern layer is hidden so type stands alone.
  const overrides = `
    .pg-type-welcome h1 {
      font-size: ${p.display.size}px;
      font-weight: ${p.display.weight};
      letter-spacing: ${p.display.tracking}em;
      line-height: ${p.display.leading};
    }
    .pg-type-welcome p {
      font-size: ${p.subtitle.size}px;
      font-weight: ${p.subtitle.weight};
      letter-spacing: ${p.subtitle.tracking}em;
      line-height: ${p.subtitle.leading};
    }
    .pg-type-card .card-pattern { display: none; }
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
      `/* app type (steps.css .welcome-copy) */`,
      `--text-display: ${p.display.size}px;`,
      `h1 { font-weight: ${p.display.weight}; letter-spacing: ${p.display.tracking.toFixed(3)}em; line-height: ${p.display.leading.toFixed(2)}; }`,
      `p  { font-size: ${p.subtitle.size}px; font-weight: ${p.subtitle.weight}; letter-spacing: ${p.subtitle.tracking.toFixed(3)}em; line-height: ${p.subtitle.leading.toFixed(2)}; }`,
      ``,
      `/* card type (card.css, cqw units) */`,
      `.card-wordmark { font-size: ${p.wordmark.size.toFixed(1)}cqw; font-weight: ${p.wordmark.weight}; letter-spacing: ${p.wordmark.tracking.toFixed(3)}em; }`,
      `.card-name { font-size: ${p.name.size.toFixed(1)}cqw; font-weight: ${p.name.weight}; letter-spacing: ${p.name.tracking.toFixed(3)}em; }`,
      `.card-note { font-size: ${p.note.size.toFixed(1)}cqw; font-weight: ${p.note.weight}; letter-spacing: ${p.note.tracking.toFixed(3)}em; }`,
    ].join("\n");

  return (
    <div className="pg-page pg-type">
      <style>{overrides}</style>

      {/* App display + subtitle, in the welcome block's real styling. */}
      <div className="pg-type-welcome">
        <h1>Welcome, Alex</h1>
        <p>
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </p>
      </div>

      {/* The real card (pattern hidden, grayscale) for the mono card roles. */}
      <div className="pg-type-card pg-card-wrap">
        <Card config={config} name="ALEX RIVERA" />
      </div>

      <CopyButton getText={copyText} label="Copy type tokens" />
    </div>
  );
}
