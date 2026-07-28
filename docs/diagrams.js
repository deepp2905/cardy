/* =========================================================================
   cardy case study — code-generated diagrams
   Every number here is lifted from the shipped source, not invented:
     motionConfig.ts  · springs, tempo, falloff
     cardConfig.ts    · palette, SPACING/FREQ bands, PATTERN_FIXED
     PRD-CONFIRM.md   · geometry in mm
   Mount by putting <div data-dgm="name"></div> in the page.
   ========================================================================= */

const NS = "http://www.w3.org/2000/svg";
const el = (t, a = {}, kids = []) => {
  const n = document.createElementNS(NS, t);
  for (const k in a) n.setAttribute(k, a[k]);
  for (const c of [].concat(kids)) n.appendChild(c);
  return n;
};
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------------------------------------------------------------------- */
/* 1. RUBBERBAND — exponential (dead) vs rational asymptote (alive)        */
/* ---------------------------------------------------------------------- */

function rubberband(host) {
  const W = 620, H = 300, PADL = 46, PADB = 38, PADT = 14, PADR = 14;
  const MAXPULL = 900;      // px of drag we plot
  const CEIL = 160;         // travel ceiling, px
  const RESIST = 220;       // pull at which travel is half the ceiling

  // The shipped curve: t = pull / (pull + resistance), scaled to the ceiling.
  const rational = (p) => CEIL * (p / (p + RESIST));
  // The first attempt: exponential saturation. Reaches the ceiling and dies.
  const expo = (p) => CEIL * (1 - Math.exp(-p / 160));

  const x = (p) => PADL + (p / MAXPULL) * (W - PADL - PADR);
  const y = (t) => H - PADB - (t / (CEIL * 1.08)) * (H - PADB - PADT);

  const path = (fn) => {
    let d = "";
    for (let p = 0; p <= MAXPULL; p += 6) d += (p ? "L" : "M") + x(p).toFixed(1) + " " + y(fn(p)).toFixed(1);
    return d;
  };

  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Two overscroll resistance curves compared: exponential saturation flattens to a dead ceiling, a rational asymptote keeps responding." });

  // grid
  for (let i = 0; i <= 4; i++) {
    const gy = PADT + (i / 4) * (H - PADB - PADT);
    svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: gy, y2: gy, stroke: css("--c3"), "stroke-width": 1 }));
  }
  svg.appendChild(el("line", { x1: PADL, x2: PADL, y1: PADT, y2: H - PADB, stroke: css("--c5"), "stroke-width": 1 }));

  // ceiling
  svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: y(CEIL), y2: y(CEIL), stroke: css("--c5"), "stroke-width": 1, "stroke-dasharray": "3 4" }));
  svg.appendChild(el("text", { x: W - PADR, y: y(CEIL) - 7, "text-anchor": "end", fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("travel ceiling")]));

  // curves
  svg.appendChild(el("path", { d: path(expo), fill: "none", stroke: css("--bad"), "stroke-width": 2, "stroke-linecap": "round" }));
  svg.appendChild(el("path", { d: path(rational), fill: "none", stroke: css("--accent"), "stroke-width": 2.5, "stroke-linecap": "round" }));

  // "goes dead here" marker on the exponential
  const deadAt = 300;
  svg.appendChild(el("circle", { cx: x(deadAt), cy: y(expo(deadAt)), r: 3.5, fill: css("--bad") }));
  svg.appendChild(el("text", { x: x(deadAt) + 10, y: y(expo(deadAt)) - 8, fill: css("--bad"), "font-size": 11, "font-family": css("--mono") }, [document.createTextNode("~300px → dead")]));

  // axis labels
  svg.appendChild(el("text", { x: PADL, y: H - 12, fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("0")]));
  svg.appendChild(el("text", { x: W - PADR, y: H - 12, "text-anchor": "end", fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("900px of pull →")]));
  svg.appendChild(el("text", { x: -((H - PADB + PADT) / 2), y: 13, transform: "rotate(-90)", "text-anchor": "middle", fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("travel")]));

  // live probe
  const probe = el("g", { opacity: 0 });
  const pl = el("line", { y1: PADT, y2: H - PADB, stroke: css("--c6"), "stroke-width": 1 });
  const dotA = el("circle", { r: 4, fill: css("--accent") });
  const dotB = el("circle", { r: 4, fill: css("--bad") });
  probe.append(pl, dotA, dotB);
  svg.appendChild(probe);

  host.appendChild(svg);

  const out = document.createElement("div");
  out.className = "readout";
  out.style.marginTop = "0.85rem";
  out.innerHTML = "Drag across the chart to compare. <b>t = pull / (pull + 220)</b> never reaches its ceiling, so the strip keeps answering however hard you pull.";
  host.appendChild(out);

  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W;
    const p = Math.max(0, Math.min(MAXPULL, ((cx - PADL) / (W - PADL - PADR)) * MAXPULL));
    probe.setAttribute("opacity", 1);
    pl.setAttribute("x1", x(p)); pl.setAttribute("x2", x(p));
    dotA.setAttribute("cx", x(p)); dotA.setAttribute("cy", y(rational(p)));
    dotB.setAttribute("cx", x(p)); dotB.setAttribute("cy", y(expo(p)));
    out.innerHTML = `pull <b>${p.toFixed(0)}px</b> &nbsp;·&nbsp; rational <b>${rational(p).toFixed(1)}px</b> &nbsp;·&nbsp; exponential <b>${expo(p).toFixed(1)}px</b> ${p > 400 ? "&nbsp;— <span style='color:var(--bad)'>flat</span>" : ""}`;
  };
  svg.addEventListener("pointermove", move);
  svg.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, { passive: false });
  svg.addEventListener("pointerleave", () => { probe.setAttribute("opacity", 0); out.innerHTML = "Drag across the chart to compare. <b>t = pull / (pull + 220)</b> never reaches its ceiling, so the strip keeps answering however hard you pull."; });
}

/* ---------------------------------------------------------------------- */
/* 2. PALETTE — the nine real cards, real patterns                        */
/* ---------------------------------------------------------------------- */

const PALETTE = [
  ["blue", "oklch(0.532 0.255 262.502)"], ["pink", "oklch(0.724 0.188 346.723)"],
  ["orange", "oklch(0.62 0.18 41.644)"], ["yellow", "oklch(0.794 0.156 85.922)"],
  ["lime", "oklch(0.83 0.203 122.796)"], ["green", "oklch(0.636 0.213 141.929)"],
  ["jade", "oklch(0.69 0.115 184.634)"], ["cyan", "oklch(0.665 0.186 249.535)"],
  ["purple", "oklch(0.499 0.241 282.011)"],
];
const SHAPES = ["circle", "rect", "triangle"];

// mulberry32 — verbatim from cardConfig.ts, so these are the real nine cards.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const band = (r, min, max) => min + r * (max - min);

function seedConfigs() {
  return PALETTE.map(([name, color], i) => {
    const rand = mulberry32(i * 2654435761 + 0x9e37);
    rand(); rand();                       // burned draws, as shipped
    return {
      name, color,
      shape: SHAPES[i % 3],
      filled: i % 2 === 1,
      spacing: band(rand(), 0, 0.9),
      frequency: band(rand(), 0.05, 0.95),
      personality: {
        angle: band(rand(), 0, 45),
        size: band(rand(), 20, 44),
        strokeWidth: band(rand(), 1, 3),
        staggerSize: band(rand(), 0.08, 0.72),
        staggerAngle: band(rand(), 20, 90),
        staggerSpacing: band(rand(), 4, 24),
      },
    };
  });
}

const lerp = (a, b, t) => a + (b - a) * t;
const SPACING_MIN = 25, SPACING_MAX = 100, FREQ_MIN = 40, FREQ_MAX = 400;

/** A faithful-enough port of CardPattern: grid of marks staggered by a radial sine. */
function patternSVG(cfg, w, h, overrides = {}) {
  const p = { ...cfg.personality, ...overrides };
  const spacing = lerp(SPACING_MIN, SPACING_MAX, overrides.spacing ?? cfg.spacing);
  const freq = lerp(FREQ_MIN, FREQ_MAX, overrides.frequency ?? cfg.frequency);
  const shape = overrides.shape ?? cfg.shape;
  const filled = overrides.filled ?? cfg.filled;
  const opacity = filled ? 0.144 : 0.3125;

  const g = el("g", { opacity, "style": "mix-blend-mode:plus-darker" });
  const cx = w / 2, cy = h / 2;
  const cols = Math.ceil(w / spacing) + 3, rows = Math.ceil(h / spacing) + 3;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = (c - 1) * spacing, by = (r - 1) * spacing;
      const dx = bx - cx, dy = by - cy;
      const dist = Math.hypot(dx, dy);
      const wave = Math.sin((dist / freq) * Math.PI * 2);
      const ang = Math.atan2(dy, dx);
      const shove = wave * p.staggerSpacing;
      const px = bx + Math.cos(ang) * shove;
      const py = by + Math.sin(ang) * shove;
      if (px < -spacing || px > w + spacing || py < -spacing || py > h + spacing) continue;
      const size = p.size * (1 + wave * p.staggerSize) * 0.5;
      if (size <= 0.4) continue;
      const rot = p.angle + wave * p.staggerAngle;
      const fillA = filled ? { fill: "#000" } : { fill: "none", stroke: "#000", "stroke-width": p.strokeWidth };
      let node;
      if (shape === "circle") node = el("circle", { cx: 0, cy: 0, r: size / 2, ...fillA });
      else if (shape === "rect") node = el("rect", { x: -size / 2, y: -size / 2, width: size, height: size, rx: size * 0.12, ...fillA });
      else node = el("polygon", { points: `0,${-size / 2} ${size / 2},${size / 2} ${-size / 2},${size / 2}`, ...fillA });
      node.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot.toFixed(1)})`);
      g.appendChild(node);
    }
  }
  return g;
}

function miniCard(cfg, overrides = {}) {
  const W = 200, H = 126;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none" });
  svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: overrides.color ?? cfg.color }));
  svg.appendChild(patternSVG(cfg, W, H, overrides));
  return svg;
}

function palette(host) {
  const wrap = document.createElement("div");
  wrap.className = "swatches";
  seedConfigs().forEach((cfg) => {
    const d = document.createElement("div");
    d.className = "sw-card";
    d.appendChild(miniCard(cfg));
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = cfg.name;
    // ink follows the same lightness rule as inkFor(): L >= 0.72 goes dark
    const L = parseFloat(cfg.color.match(/oklch\(([\d.]+)/)[1]);
    nm.style.color = L >= 0.72 ? "oklch(0.2 0.02 0)" : "oklch(0.97 0.005 0)";
    d.appendChild(nm);
    wrap.appendChild(d);
  });
  host.appendChild(wrap);
  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "The real nine, drawn here by the same seeded PRNG the app uses — <b>same seed, same cards, every visit</b>. Shape and fill are dealt round-robin, not rolled, so the strip always shows 3/3/3 shapes and both fill modes. A random draw clumped: four triangles and one square.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 3. CONSTRAINT SPACE — what the two sliders actually reach               */
/* ---------------------------------------------------------------------- */

function constraints(host) {
  const cfg = seedConfigs()[7]; // cyan
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:6px";
  const STEPS = 5;
  for (let r = 0; r < STEPS; r++) {
    for (let c = 0; c < STEPS; c++) {
      const d = document.createElement("div");
      d.style.cssText = "aspect-ratio:85.6/53.98;border-radius:5px;overflow:hidden;position:relative";
      d.appendChild(miniCard(cfg, { spacing: c / (STEPS - 1), frequency: r / (STEPS - 1) }));
      grid.appendChild(d);
    }
  }
  host.appendChild(grid);

  const ax = document.createElement("div");
  ax.className = "readout";
  ax.style.cssText = "margin-top:0.85rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem";
  ax.innerHTML = "<span>← spacing <b>25</b> … <b>100</b> →</span><span>↓ frequency <b>40</b> … <b>400</b> ↓</span>";
  host.appendChild(ax);

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "Twenty-five positions on one card's two sliders. <b>The pattern engine has ~13 parameters; the UI exposes two.</b> The other eleven are pinned to tuned constants, and each slider maps 0..1 into a band that was clamped by hand until no position on the track looked like a mistake.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 3b. COMBINATIONS — where 54 million actually comes from                */
/* ---------------------------------------------------------------------- */

function combinations(host) {
  // cardConfigToParams serializes both sliders with .toFixed(3) => 1001 values
  const TERMS = [
    ["9", "colourways", "hand-picked in OKLCH"],
    ["3", "shapes", "circle · square · triangle"],
    ["2", "fill modes", "outline · filled"],
    ["1001", "spacing", "0.000 – 1.000, serialized to 3dp"],
    ["1001", "frequency", "0.000 – 1.000, serialized to 3dp"],
  ];

  const row = document.createElement("div");
  row.style.cssText = "display:flex;flex-wrap:wrap;align-items:stretch;gap:0.5rem";

  TERMS.forEach(([n, label, sub], i) => {
    if (i) {
      const x = document.createElement("div");
      x.style.cssText = "display:grid;place-items:center;color:var(--c6);font-family:var(--mono);font-size:1rem;padding:0 0.1rem";
      x.textContent = "×";
      row.appendChild(x);
    }
    const d = document.createElement("div");
    d.style.cssText = "flex:1 1 7rem;min-width:6.5rem;border-radius:10px;background:var(--c3);padding:0.85rem 0.9rem;display:grid;gap:0.15rem;align-content:start";
    d.innerHTML = `<span style="font-family:var(--mono);font-size:1.35rem;color:var(--c12);line-height:1">${n}</span>
      <span style="font-size:0.8125rem;color:var(--c11)">${label}</span>
      <span style="font-size:0.6875rem;color:var(--c6);font-family:var(--mono);line-height:1.4;margin-top:0.15rem">${sub}</span>`;
    row.appendChild(d);
  });
  host.appendChild(row);

  const eq = document.createElement("div");
  eq.style.cssText = "margin-top:1rem;padding-top:1rem;border-top:1px solid var(--c3);display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:0.5rem";
  eq.innerHTML = `<span class="readout">= distinct shareable states</span>
    <span style="font-family:var(--mono);font-size:clamp(1.5rem,4.5vw,2.25rem);color:var(--accent);letter-spacing:-0.02em" id="combo-count">0</span>`;
  host.appendChild(eq);

  // count up when it scrolls into view
  const target = 54108054;
  const node = eq.querySelector("#combo-count");
  const fmt = (v) => Math.round(v).toLocaleString();
  node.textContent = fmt(target);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    node.textContent = "0";
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now(), DUR = 1400;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / DUR);
          node.textContent = fmt(target * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(host);
  }

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "Not a marketing number — it's the count of states the share URL can actually encode. Both sliders serialize to three decimal places, so each carries <b>1001</b> distinct values. <b>The design work isn't in reaching 54 million; it's in making sure all 54 million are worth having.</b>";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 4. FOLD GEOMETRY — the mm spec, drawn                                  */
/* ---------------------------------------------------------------------- */

function geometry(host) {
  const W = 620, H = 330;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Carrier sheet, folded packet, envelope and mail slot drawn to their real millimetre proportions." });
  const S = 1.28; // mm → px for the diagram

  const label = (x, y, t, col) => el("text", { x, y, fill: col || css("--c6"), "font-size": 10, "font-family": css("--mono"), "text-anchor": "middle" }, [document.createTextNode(t)]);
  const dim = (x1, y1, x2, y2, t) => {
    const g = el("g");
    g.appendChild(el("line", { x1, y1, x2, y2, stroke: css("--c5"), "stroke-width": 1 }));
    g.appendChild(el("line", { x1, y1: y1 - 4, x2: x1, y2: y1 + 4, stroke: css("--c5"), "stroke-width": 1 }));
    g.appendChild(el("line", { x1: x2, y1: y2 - 4, x2, y2: y2 + 4, stroke: css("--c5"), "stroke-width": 1 }));
    g.appendChild(label((x1 + x2) / 2, y1 - 8, t));
    return g;
  };

  // --- carrier sheet 120 × 192, three 64mm panels, card centred ---
  const sw = 120 * S, sh = 192 * S, sx = 40, sy = 42;
  svg.appendChild(el("rect", { x: sx, y: sy, width: sw, height: sh, rx: 3, fill: css("--paper") }));
  for (let i = 1; i < 3; i++) {
    svg.appendChild(el("line", { x1: sx, x2: sx + sw, y1: sy + (64 * S) * i, y2: sy + (64 * S) * i, stroke: css("--c6"), "stroke-width": 1, "stroke-dasharray": "4 4" }));
  }
  // card on the middle panel
  const cw = 85.6 * S, ch = 53.98 * S;
  svg.appendChild(el("rect", { x: sx + (sw - cw) / 2, y: sy + 64 * S + (64 * S - ch) / 2, width: cw, height: ch, rx: 3.18 * S, fill: css("--cyan") }));
  svg.appendChild(dim(sx, sy - 12, sx + sw, sy - 12, "120mm"));
  svg.appendChild(label(sx + sw / 2, sy + sh + 18, "carrier sheet · 192mm"));
  svg.appendChild(label(sx + sw / 2, sy + 64 * S - 8, "fold ↓", css("--c8")));
  svg.appendChild(label(sx + sw / 2, sy + 128 * S + 14, "fold ↑", css("--c8")));

  // --- folded packet 120 × 64 ---
  const px = 232, py = 96;
  svg.appendChild(el("rect", { x: px, y: py, width: 120 * S, height: 64 * S, rx: 3, fill: css("--paper") }));
  svg.appendChild(el("line", { x1: px, x2: px + 120 * S, y1: py + 12, y2: py + 12, stroke: css("--c6"), "stroke-width": 1, opacity: 0.5 }));
  svg.appendChild(label(px + 60 * S, py + 64 * S + 18, "packet · 120 × 64"));

  // --- envelope 126 × 70 ---
  const ex = 232, ey = 200;
  svg.appendChild(el("rect", { x: ex, y: ey, width: 126 * S, height: 70 * S, rx: 3, fill: css("--kraft") }));
  svg.appendChild(el("polygon", { points: `${ex},${ey} ${ex + 63 * S},${ey + 38.5 * S} ${ex + 126 * S},${ey}`, fill: "oklch(0.754 0.056 70)" }));
  svg.appendChild(label(ex + 63 * S, ey + 70 * S + 18, "envelope · 126 × 70"));
  svg.appendChild(dim(ex, ey - 12, ex + 126 * S, ey - 12, "+3mm all round"));

  // --- mail slot 139 × 10 ---
  const mx = 424, my = 232;
  svg.appendChild(el("rect", { x: mx, y: my, width: 139 * S, height: 10 * S, rx: 5 * S, fill: "oklch(0.1 0 0)" }));
  svg.appendChild(label(mx + 69.5 * S, my + 10 * S + 20, "slot · 139 × 10"));
  svg.appendChild(label(mx + 69.5 * S, my - 10, "1.1× envelope width", css("--accent")));

  // arrows
  const arrow = (x1, y1, x2, y2) => {
    const g = el("g");
    g.appendChild(el("line", { x1, y1, x2, y2, stroke: css("--c5"), "stroke-width": 1.5, "marker-end": "url(#ah)" }));
    return g;
  };
  const defs = el("defs");
  const m = el("marker", { id: "ah", viewBox: "0 0 8 8", refX: 6, refY: 4, markerWidth: 5, markerHeight: 5, orient: "auto" });
  m.appendChild(el("path", { d: "M0 0 L8 4 L0 8 z", fill: css("--c5") }));
  defs.appendChild(m);
  svg.appendChild(defs);
  svg.appendChild(arrow(sx + sw + 14, 150, px - 12, 130));
  svg.appendChild(arrow(px + 60 * S, py + 64 * S + 26, ex + 63 * S, ey - 22));
  svg.appendChild(arrow(ex + 126 * S + 12, ey + 40, mx - 10, my + 4));

  host.appendChild(svg);

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "Everything in the sequence is specified in millimetres and converted by <b>one scale factor</b>. The slot is the widest object, so it sets the scale; the sheet is the tallest, so it binds the height. Card is ISO/IEC 7810 ID-1 — 85.6 × 53.98mm, 3.18mm radius — at every size it appears.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 5. SPRING TEMPO — why slowing 7 springs didn't change their character   */
/* ---------------------------------------------------------------------- */

function springSim(k, c, m, dur, dt = 1 / 240) {
  const pts = [];
  let x = 1, v = 0;
  for (let t = 0; t <= dur; t += dt) {
    const a = (-k * x - c * v) / m;
    v += a * dt; x += v * dt;
    pts.push([t, 1 - x]);
  }
  return pts;
}

function tempo(host) {
  const W = 620, H = 260, PADL = 44, PADB = 34, PADT = 16, PADR = 16;
  const DUR = 2.4;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Two spring curves, original and slowed, showing an identical overshoot shape at different paces." });

  const x = (t) => PADL + (t / DUR) * (W - PADL - PADR);
  const y = (v) => H - PADB - v * (H - PADB - PADT) * 0.78;

  svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: y(1), y2: y(1), stroke: css("--c5"), "stroke-width": 1, "stroke-dasharray": "3 4" }));
  svg.appendChild(el("line", { x1: PADL, x2: W - PADR, y1: y(0), y2: y(0), stroke: css("--c3"), "stroke-width": 1 }));
  svg.appendChild(el("line", { x1: PADL, x2: PADL, y1: PADT, y2: H - PADB, stroke: css("--c5"), "stroke-width": 1 }));

  const draw = (pts, col, w) => {
    let d = "";
    pts.forEach(([t, v], i) => { d += (i ? "L" : "M") + x(t).toFixed(1) + " " + y(v).toFixed(1); });
    return el("path", { d, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round" });
  };

  // flip: was 180/22, ships at 115/17.6 — ζ 0.782 either way
  svg.appendChild(draw(springSim(180, 22, 1.1, DUR), css("--c6"), 1.5));
  svg.appendChild(draw(springSim(115, 17.6, 1.1, DUR), css("--accent"), 2.5));

  svg.appendChild(el("text", { x: W - PADR, y: y(1) - 8, "text-anchor": "end", fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("target")]));
  svg.appendChild(el("text", { x: PADL, y: H - 12, fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("0s")]));
  svg.appendChild(el("text", { x: W - PADR, y: H - 12, "text-anchor": "end", fill: css("--c6"), "font-size": 10, "font-family": css("--mono") }, [document.createTextNode("2.4s")]));

  host.appendChild(svg);

  const lg = document.createElement("div");
  lg.className = "legend";
  lg.innerHTML = `<i style="color:var(--c6)"><span class="sw"></span>original · k 180 · c 22</i>
    <i style="color:var(--accent)"><span class="sw"></span>shipped at tempo · k 115 · c 17.6</i>
    <i style="color:var(--c8)">ζ = 0.782 &nbsp;both</i>`;
  host.appendChild(lg);

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "The whole wrap sequence runs 1.25× slower than it was first tuned. Slowing a spring by <b>k/T² and c/T</b> holds the damping ratio exactly — so the overshoot, the rock at settle, the shape of the arrival are all identical, and only the pace changes. The envelope's flip keeps its signature wobble because ζ never moved.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 6. STEP INDICATOR — three rebuilds, then the revert                    */
/* ---------------------------------------------------------------------- */

function stepIndicator(host) {
  const rows = [
    ["v1 · shipped", "one fill slides between segments", "good"],
    ["v2 · built", "flexGrow spring + opacity crossfade", "bad"],
    ["v3 · built", "scaleX wipe per segment", "bad"],
    ["v4 · built", "cumulative fills, three objects", "bad"],
  ];
  const box = document.createElement("div");
  box.style.cssText = "display:grid;gap:1.1rem";

  rows.forEach(([name, desc, verdict], ri) => {
    const row = document.createElement("div");
    row.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr);gap:0.5rem";

    const head = document.createElement("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap";
    head.innerHTML = `<span class="readout"><b style="color:${verdict === "good" ? "var(--good)" : "var(--c8)"}">${name}</b> · ${desc}</span>
      <span class="readout" style="color:${verdict === "good" ? "var(--good)" : "var(--bad)"}">${verdict === "good" ? "kept" : "reverted"}</span>`;
    row.appendChild(head);

    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;gap:4px;height:6px;max-width:12rem;opacity:" + (verdict === "good" ? "1" : "0.5");
    for (let i = 0; i < 3; i++) {
      const seg = document.createElement("div");
      seg.style.cssText = `flex:1;border-radius:99px;background:var(--c4);position:relative;overflow:hidden`;
      const fill = document.createElement("div");
      fill.dataset.fill = ri + "-" + i;
      fill.style.cssText = `position:absolute;inset:0;border-radius:99px;background:${verdict === "good" ? "var(--c12)" : "var(--c8)"};opacity:0;transition:opacity .3s var(--ease)`;
      seg.appendChild(fill);
      bar.appendChild(seg);
    }
    row.appendChild(bar);
    box.appendChild(row);
  });

  host.appendChild(box);

  // animate: v1 slides one fill; the others fade three separate fills
  let step = 0;
  const tick = () => {
    step = (step + 1) % 3;
    host.querySelectorAll("[data-fill]").forEach((f) => {
      const [r, i] = f.dataset.fill.split("-").map(Number);
      if (r === 0) {
        // v1 — one object, slides
        f.style.opacity = i === step ? "1" : "0";
        f.style.transition = "opacity .01s";
      } else {
        f.style.opacity = i <= step ? "1" : "0";
        f.style.transition = "opacity .3s var(--ease)";
      }
    });
  };
  tick();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setInterval(tick, 1400);

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "Every version I built to improve it replaced <b>one object sliding</b> with three fills appearing and disappearing. The bounce I then spent a turn fixing was self-inflicted: my flexGrow spring was fighting motion's layout projection for the same pixels. With static widths there is nothing to fight.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 7. SEQUENCE SCRUBBER — the choreography, on a timeline                 */
/* ---------------------------------------------------------------------- */

const BEATS = [
  ["arrive", 0.00, 0.55], ["sheet", 0.55, 1.10], ["fold ↑", 1.10, 1.75],
  ["fold ↓", 1.75, 2.40], ["envelope", 2.40, 2.95], ["insert", 2.95, 3.55],
  ["flip", 3.55, 4.20], ["slot", 4.20, 5.00],
];

function scrubber(host) {
  const stage = document.createElement("div");
  stage.style.cssText = "position:relative;aspect-ratio:16/9;border-radius:10px;background:var(--c1);overflow:hidden;display:grid;place-items:center";

  const svg = el("svg", { viewBox: "0 0 400 225" });
  const S = 0.62;
  const sheet = el("rect", { x: 200 - 120 * S / 2, y: 112 - 192 * S / 2, width: 120 * S, height: 192 * S, rx: 2, fill: css("--paper"), opacity: 0 });
  const cardR = el("rect", { x: 200 - 85.6 * S / 2, y: 112 - 53.98 * S / 2, width: 85.6 * S, height: 53.98 * S, rx: 3.18 * S, fill: css("--cyan") });
  const packet = el("rect", { x: 200 - 120 * S / 2, y: 112 - 64 * S / 2, width: 120 * S, height: 64 * S, rx: 2, fill: css("--paper"), opacity: 0 });
  const env = el("rect", { x: 200 - 126 * S / 2, y: 112 - 70 * S / 2, width: 126 * S, height: 70 * S, rx: 2, fill: css("--kraft"), opacity: 0 });
  const slot = el("rect", { x: 200 - 139 * S / 2, y: 190, width: 139 * S, height: 10 * S, rx: 5 * S, fill: "oklch(0.1 0 0)", opacity: 0 });
  svg.append(slot, sheet, cardR, packet, env);
  stage.appendChild(svg);
  host.appendChild(stage);

  const scrub = document.createElement("div");
  scrub.className = "scrub";
  scrub.style.marginTop = "0.85rem";
  const beats = document.createElement("div");
  beats.className = "beats";
  BEATS.forEach(([n, a, b]) => {
    const d = document.createElement("div");
    d.style.flex = (b - a);
    d.textContent = n;
    beats.appendChild(d);
  });
  const range = document.createElement("input");
  range.type = "range"; range.min = 0; range.max = 500; range.value = 0;
  const read = document.createElement("div");
  read.className = "readout";
  scrub.append(beats, range, read);
  host.appendChild(scrub);

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const at = (t, a, b) => clamp01((t - a) / (b - a));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);

  const render = (t) => {
    const p = (i) => easeOut(at(t, BEATS[i][1], BEATS[i][2]));
    sheet.setAttribute("opacity", p(1) * 0.95);
    const folded = Math.max(p(2), p(3));
    sheet.setAttribute("height", (192 * S) * (1 - folded * (1 - 64 / 192)));
    sheet.setAttribute("y", 112 - (192 * S) * (1 - folded * (1 - 64 / 192)) / 2);
    cardR.setAttribute("opacity", 1 - Math.max(p(3), p(4)));
    packet.setAttribute("opacity", p(3) * (1 - p(5) * 0.0));
    env.setAttribute("opacity", p(4));
    const ins = p(5);
    packet.setAttribute("y", 112 - 64 * S / 2 + ins * 30);
    packet.setAttribute("opacity", p(3) * (1 - ins));
    const fl = p(6);
    env.setAttribute("transform", `rotate(${fl * 180} 200 112)`);
    env.setAttribute("fill", fl > 0.5 ? "oklch(0.754 0.056 70)" : css("--kraft"));
    slot.setAttribute("opacity", p(7));
    const cur = BEATS.find(([, a, b]) => t >= a && t < b) || BEATS[BEATS.length - 1];
    beats.querySelectorAll("div").forEach((d, i) => d.classList.toggle("on", BEATS[i][0] === cur[0]));
    read.innerHTML = `<b>${t.toFixed(2)}s</b> · ${cur[0]} &nbsp;—&nbsp; total runtime <b>5.00s</b>, auto-play, no skip`;
  };

  range.addEventListener("input", () => render(+range.value / 100));
  render(0);

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "left";
  out.innerHTML = "Scrub the sequence. Eight beats, 5.00 seconds, no skip button — <b>the cost of that is a full replay if you go back and come forward again</b>, which I accepted because a skippable moment isn't a designed moment. Built against a scrubbable dev route (<code>#/play/sequence</code>) rather than by reloading the flow.";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* 8. HERO CARD — a live, tiltable card                                   */
/* ---------------------------------------------------------------------- */

function heroCard(host) {
  const cfgs = seedConfigs();
  let idx = 7;
  const stage = document.createElement("div");
  stage.style.cssText = "perspective:1400px;display:grid;place-items:center;padding:1rem";
  const card = document.createElement("div");
  card.style.cssText = `width:min(372px,80vw);aspect-ratio:85.6/53.98;border-radius:calc(3.18/85.6*100%);position:relative;overflow:hidden;
    box-shadow:0 2px 8px oklch(0 0 0/.3),0 30px 60px -20px oklch(0 0 0/.55);transition:transform .5s var(--ease);transform-style:preserve-3d;cursor:pointer`;
  stage.appendChild(card);
  host.appendChild(stage);

  const paint = () => {
    card.innerHTML = "";
    const cfg = cfgs[idx];
    const svg = miniCard(cfg);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    card.appendChild(svg);
    const L = parseFloat(cfg.color.match(/oklch\(([\d.]+)/)[1]);
    const ink = L >= 0.72 ? "oklch(0.2 0.02 0)" : "oklch(0.97 0.005 0)";
    const face = document.createElement("div");
    face.style.cssText = `position:absolute;inset:0;padding:7% 7.5%;display:flex;flex-direction:column;justify-content:space-between;color:${ink}`;
    face.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span style="font-weight:600;letter-spacing:-0.02em;font-size:clamp(13px,4.4cqw,17px)">cardy</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity="0.85">
          <path d="M8.5 8.5a5 5 0 0 1 0 7M12 5.5a9 9 0 0 1 0 13M5 11.5a2 2 0 0 1 0 1"/></svg>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <span style="font-family:var(--mono);font-weight:590;letter-spacing:0.05em;font-size:clamp(11px,3.4cqw,14px)">ALEX RIVERA</span>
        <span style="display:flex;gap:-6px"><i style="width:15px;height:15px;border-radius:99px;background:${ink};opacity:.55;display:block"></i><i style="width:15px;height:15px;border-radius:99px;background:${ink};opacity:.35;display:block;margin-left:-6px"></i></span>
      </div>`;
    card.appendChild(face);
    const chip = document.createElement("div");
    chip.style.cssText = `position:absolute;left:7.5%;top:34%;width:13%;aspect-ratio:4/3;border-radius:3px;background:${ink};opacity:.32`;
    card.appendChild(chip);
  };
  paint();

  card.addEventListener("click", () => { idx = (idx + 1) % cfgs.length; paint(); });

  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = "transform .12s linear";
      card.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 16}deg)`;
    });
    stage.addEventListener("pointerleave", () => {
      card.style.transition = "transform .6s var(--ease)";
      card.style.transform = "rotateY(0) rotateX(0)";
    });
  }

  const out = document.createElement("p");
  out.className = "caption";
  out.style.textAlign = "center";
  out.innerHTML = "Click to cycle the nine. <span class='dim'>Rendered here by the same seeded generator as the product — the tilt is this page's, not the app's.</span>";
  host.appendChild(out);
}

/* ---------------------------------------------------------------------- */
/* mount                                                                  */
/* ---------------------------------------------------------------------- */

const REGISTRY = { rubberband, palette, constraints, combinations, geometry, tempo, stepIndicator, scrubber, heroCard };

function mountAll() {
  document.querySelectorAll("[data-dgm]").forEach((host) => {
    if (host.dataset.mounted) return;
    const fn = REGISTRY[host.dataset.dgm];
    if (!fn) return;
    host.dataset.mounted = "1";
    try { fn(host); } catch (e) { console.error("diagram failed:", host.dataset.dgm, e); }
  });
}

// Reveal-on-scroll
function reveals() {
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".rv").forEach((n) => io.observe(n));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { mountAll(); reveals(); });
} else { mountAll(); reveals(); }
