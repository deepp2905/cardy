import { useDialKit } from "dialkit";
import { CopyButton } from "./CopyButton";

// Live specimen for the type scale + role styles. Rather than list every role
// in a stack, each is shown where it actually lives: the card roles (wordmark,
// name, note) sit inside a lo-fi card wireframe at their real cqw positions,
// and the app-chrome roles (headline, body, label) sit inside a screen mock.
// Tweaking a dial moves the real text in context. Specimen elements read dial
// values via inline style, so nothing here touches :root.
export function TypePlayground() {
  const p = useDialKit("Type scale", {
    sizes: {
      xs: [11, 8, 16, 1],
      sm: [13, 10, 18, 1],
      base: [15, 12, 20, 1],
      md: [16, 12, 22, 1],
      display: [34, 20, 72, 1],
    },
    headline: {
      weight: [620, 200, 700, 10],
      tracking: [-0.02, -0.06, 0.04, 0.005],
      leading: [1.1, 0.9, 1.6, 0.05],
    },
    body: {
      weight: [400, 200, 700, 10],
      tracking: [0, -0.03, 0.04, 0.005],
      leading: [1.55, 1.2, 1.9, 0.05],
    },
    label: {
      weight: [550, 200, 700, 10],
      tracking: [0.14, 0, 0.3, 0.005],
    },
    // --- card roles: sized in cqw, previewed inside a card wireframe ---
    wordmark: {
      size: [6.4, 4, 9, 0.1],
      weight: [650, 200, 700, 10],
      tracking: [0.01, -0.04, 0.1, 0.005],
    },
    cardName: {
      size: [4.4, 3, 7, 0.1],
      weight: [590, 200, 700, 10],
      tracking: [0.05, 0, 0.3, 0.005],
    },
    cardNote: {
      size: [3.1, 2, 5, 0.1],
      weight: [400, 200, 700, 10],
      tracking: [0.12, 0, 0.3, 0.005],
    },
  });

  const copyText = () =>
    [
      `--text-xs: ${p.sizes.xs}px;`,
      `--text-sm: ${p.sizes.sm}px;`,
      `--text-base: ${p.sizes.base}px;`,
      `--text-md: ${p.sizes.md}px;`,
      `--text-display: ${p.sizes.display}px;`,
      ``,
      `/* headline */ font-weight: ${p.headline.weight}; letter-spacing: ${p.headline.tracking.toFixed(3)}em; line-height: ${p.headline.leading.toFixed(2)};`,
      `/* body */ font-weight: ${p.body.weight}; letter-spacing: ${p.body.tracking.toFixed(3)}em; line-height: ${p.body.leading.toFixed(2)};`,
      `/* label (uppercase) */ font-weight: ${p.label.weight}; letter-spacing: ${p.label.tracking.toFixed(3)}em;`,
      ``,
      `/* --- card.css (cqw units) --- */`,
      `.card-wordmark { font-size: ${p.wordmark.size.toFixed(1)}cqw; font-weight: ${p.wordmark.weight}; letter-spacing: ${p.wordmark.tracking.toFixed(3)}em; }`,
      `.card-name { font-size: ${p.cardName.size.toFixed(1)}cqw; font-weight: ${p.cardName.weight}; letter-spacing: ${p.cardName.tracking.toFixed(3)}em; }`,
      `.card-note { font-size: ${p.cardNote.size.toFixed(1)}cqw; font-weight: ${p.cardNote.weight}; letter-spacing: ${p.cardNote.tracking.toFixed(3)}em; }`,
    ].join("\n");

  return (
    <div className="pg-page pg-type">
      {/* Card wireframe — the three mono roles at their real cqw positions. */}
      <div className="pg-wire-card" aria-label="Card typography in context">
        <div className="pg-wire-card-top">
          <span
            className="pg-wire-wordmark"
            style={{
              fontSize: `${p.wordmark.size}cqw`,
              fontWeight: p.wordmark.weight,
              letterSpacing: `${p.wordmark.tracking}em`,
            }}
          >
            cardy
          </span>
          <span className="pg-wire-block pg-wire-contactless" />
        </div>
        <span className="pg-wire-block pg-wire-chip" />
        <div className="pg-wire-card-bottom">
          <div className="pg-wire-identity">
            <span
              className="pg-wire-name"
              style={{
                fontSize: `${p.cardName.size}cqw`,
                fontWeight: p.cardName.weight,
                letterSpacing: `${p.cardName.tracking}em`,
              }}
            >
              ALEX RIVERA
            </span>
            <span
              className="pg-wire-note"
              style={{
                fontSize: `${p.cardNote.size}cqw`,
                fontWeight: p.cardNote.weight,
                letterSpacing: `${p.cardNote.tracking}em`,
              }}
            >
              FOR COFFEE ONLY
            </span>
          </div>
          <span className="pg-wire-block pg-wire-network" />
        </div>
      </div>

      {/* Screen wireframe — headline / body / label as app chrome. */}
      <div className="pg-wire-screen" aria-label="App typography in context">
        <div className="pg-wire-nav">
          <span className="pg-wire-block pg-wire-dot" />
          <span className="pg-wire-block pg-wire-pill" />
        </div>
        <span
          className="pg-wire-label"
          style={{
            fontSize: `${p.sizes.xs}px`,
            fontWeight: p.label.weight,
            letterSpacing: `${p.label.tracking}em`,
          }}
        >
          Step one
        </span>
        <h1
          style={{
            fontSize: `${p.sizes.display}px`,
            fontWeight: p.headline.weight,
            letterSpacing: `${p.headline.tracking}em`,
            lineHeight: p.headline.leading,
          }}
        >
          Welcome, Alex
        </h1>
        <p
          style={{
            fontSize: `${p.sizes.md}px`,
            fontWeight: p.body.weight,
            letterSpacing: `${p.body.tracking}em`,
            lineHeight: p.body.leading,
          }}
        >
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </p>
        <span className="pg-wire-block pg-wire-cta" />
      </div>

      <CopyButton getText={copyText} label="Copy type tokens" />
    </div>
  );
}
