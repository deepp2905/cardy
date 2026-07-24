import { useDialKit } from "dialkit";
import { CopyButton } from "./CopyButton";

// Live specimen for the type scale + role styles. Specimen elements read
// dial values via inline style, so nothing here touches :root.
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
    cardName: {
      weight: [500, 200, 700, 10],
      tracking: [0.08, 0, 0.3, 0.005],
    },
    cardNote: {
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
      `/* card name (mono) */ font-weight: ${p.cardName.weight}; letter-spacing: ${p.cardName.tracking.toFixed(3)}em;`,
      `/* card note (mono) */ font-weight: ${p.cardNote.weight}; letter-spacing: ${p.cardNote.tracking.toFixed(3)}em;`,
    ].join("\n");

  return (
    <div className="pg-page">
      <div className="pg-specimen">
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
            maxWidth: "34ch",
          }}
        >
          Let&rsquo;s get you a card that&rsquo;s tailored to you — your color,
          your wave, your words.
        </p>
        <span
          className="pg-specimen-label"
          style={{
            fontSize: `${p.sizes.xs}px`,
            fontWeight: p.label.weight,
            letterSpacing: `${p.label.tracking}em`,
          }}
        >
          Character
        </span>
        <span
          className="pg-specimen-mono"
          style={{
            fontWeight: p.cardName.weight,
            letterSpacing: `${p.cardName.tracking}em`,
          }}
        >
          ALEX RIVERA
        </span>
        <span
          className="pg-specimen-mono"
          style={{
            fontWeight: p.cardNote.weight,
            letterSpacing: `${p.cardNote.tracking}em`,
            opacity: 0.7,
          }}
        >
          FOR COFFEE ONLY
        </span>
      </div>
      <CopyButton getText={copyText} label="Copy type tokens" />
    </div>
  );
}
