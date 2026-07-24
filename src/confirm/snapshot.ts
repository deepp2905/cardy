import { toPng } from "html-to-image";

/**
 * PNG of the card, for the epilogue's "Download your design".
 *
 * NOT on the animation's critical path — see the note in Confirm.tsx. It fires
 * once when the sequence starts and is awaited by nobody; if it fails, the
 * download button simply doesn't render.
 *
 * The known failure mode is a black card: html-to-image clones into an SVG
 * `foreignObject`, and a WebGL drawing buffer is cleared after each frame
 * unless the context was created with `preserveDrawingBuffer: true` — which
 * `@paper-design/shaders-react` owns, not us. Because this is decoupled from
 * the animation, a black PNG costs a download, not the sequence.
 */
export async function snapshotCard(node: HTMLElement): Promise<string | null> {
  try {
    return await toPng(node, { pixelRatio: 2, cacheBust: true });
  } catch {
    return null;
  }
}

export function downloadPng(dataUrl: string, filename = "cardy-card.png") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
