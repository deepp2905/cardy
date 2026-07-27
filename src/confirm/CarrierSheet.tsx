import type { ReactNode } from "react";
import { motion, type MotionValue } from "motion/react";
import {
  BOTTOM_PANEL,
  TOP_PANEL,
  type Bar,
  mm,
} from "./geometry";
import type { SequenceValues } from "./useWrapSequence";

/**
 * The lo-fi wireframe carrier sheet (PRD-CONFIRM.md §3.2).
 *
 * Deliberately unrendered: placeholder bars, no real copy except the wordmark.
 * The card is the only high-fidelity object in the frame, and the fidelity gap
 * is what keeps it the hero while it's being covered up.
 */

function Bars({ bars, fine }: { bars: readonly Bar[]; fine?: boolean }) {
  return (
    <>
      {bars.map((b, i) => (
        <div
          key={i}
          className={fine ? "sheet-bar sheet-bar--fine" : "sheet-bar"}
          style={{
            width: mm(b.w),
            height: mm(b.h),
            top: mm(b.y),
            borderRadius: mm(b.h / 2),
            ...(b.align === "end" ? { right: mm(0) } : { left: mm(0) }),
          }}
        />
      ))}
    </>
  );
}

/** Letterhead. `cardy` is the only real text anywhere on the sheet. */
function TopFace() {
  return (
    <div className="sheet-face">
      <span
        className="sheet-wordmark"
        style={{ top: mm(TOP_PANEL.wordmarkY), fontSize: mm(TOP_PANEL.wordmarkSize) }}
      >
        cardy
      </span>
      <Bars bars={[TOP_PANEL.refBar]} />
      <div className="sheet-rule" style={{ top: mm(TOP_PANEL.ruleY) }} />
      <Bars bars={TOP_PANEL.bars} />
    </div>
  );
}

/** Signature block over small print. */
function BottomFace() {
  return (
    <div className="sheet-face">
      <Bars bars={BOTTOM_PANEL.bars} />
      <div className="sheet-rule" style={{ top: mm(BOTTOM_PANEL.ruleY) }} />
      <Bars bars={BOTTOM_PANEL.fineBars} fine />
    </div>
  );
}

export function CarrierSheet({
  v,
  clip,
  children,
}: {
  v: SequenceValues;
  /** Clip path for the wrapper, hiding packet that has entered the envelope. */
  clip?: MotionValue<string>;
  /** The live card, sized at 85.6mm and scaled by the sequence. */
  children: ReactNode;
}) {
  return (
    /* Clipping wrapper, for the same reason Envelope has one: .sheet is
       preserve-3d (the panels rotate in 3D), and clip-path on it would flatten
       that. This wrapper is static and stage-sized, so the cut line stays fixed
       while the packet travels through it. */
    <motion.div className="sheet-clip" style={{ clipPath: clip }}>
      <motion.div
        className="sheet"
        style={{ opacity: v.sheetOpacity, scale: v.sheetScale, y: v.sheetY }}
        aria-hidden="true"
      >
      {/* Middle panel — static. The card's bed; nothing else on it. */}
      <div className="panel panel--mid">
        <motion.div className="sheet-print" style={{ opacity: v.printOpacity }}>
          <div className="reg-outline">
            <i className="reg-tick reg-tick--tl" />
            <i className="reg-tick reg-tick--tr" />
            <i className="reg-tick reg-tick--bl" />
            <i className="reg-tick reg-tick--br" />
          </div>
        </motion.div>
        <div className="card-bed">{children}</div>
      </div>

      {/* Bottom panel folds UP over the card: hinged on its top edge (the lower
          crease), rotating toward the viewer. z-index puts it above the mid. */}
      <motion.div
        className="panel-cast panel-cast--bottom"
        style={{ opacity: v.bottomCast, scaleY: v.bottomCastScale }}
      />
      <motion.div
        className="panel panel--bottom"
        style={{ rotateX: v.rotBottom }}
      >
        <motion.div className="panel-side" style={{ opacity: v.bottomFront }}>
          <motion.div
            className="sheet-print sheet-print--fill"
            style={{ opacity: v.printOpacity }}
          >
            <BottomFace />
          </motion.div>
        </motion.div>
        <motion.div
          className="panel-side panel-side--back"
          style={{ opacity: v.bottomBack }}
        />
        <motion.div className="panel-shade" style={{ opacity: v.bottomShade }} />
      </motion.div>

      {/* Top panel folds DOWN over the bottom one: hinged on its bottom edge
          (the upper crease). Lands last and nearest camera. */}
      <motion.div
        className="panel-cast panel-cast--top"
        style={{ opacity: v.topCast, scaleY: v.topCastScale }}
      />
      <motion.div className="panel panel--top" style={{ rotateX: v.rotTop }}>
        <motion.div className="panel-side" style={{ opacity: v.topFront }}>
          <motion.div
            className="sheet-print sheet-print--fill"
            style={{ opacity: v.printOpacity }}
          >
            <TopFace />
          </motion.div>
        </motion.div>
        <motion.div
          className="panel-side panel-side--back"
          style={{ opacity: v.topBack }}
        />
          <motion.div className="panel-shade" style={{ opacity: v.topShade }} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
