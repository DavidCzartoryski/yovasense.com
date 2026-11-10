/**
 * The hero illustration's shape and timing, shared by the server-rendered
 * picture (Hero.tsx) and the live canvas (HeroPath.tsx), so the page shows the
 * same composition before hydration, without JavaScript and after the canvas
 * takes over.
 *
 * Where things sit is set in CSS (globals.css, the --hx-* properties on
 * .ys-hero): the convergence B, the turn, the base run and the spine. The
 * static picture is laid out from those, and the canvas reads them back from
 * two marker elements. What lives here is the lanes' shape, in units of the
 * lane box (x: 0 at the left edge, 1 at B; y: 0 to 1 over the box height), and
 * the pose of everything that moves at a given time.
 */

export type Pt = [number, number];
export type Path = { pts: Pt[]; len: number[]; total: number };
export type Mode = "phone" | "desk";
export const MODES: Mode[] = ["phone", "desk"];

/**
 * The CSS breakpoint below which the hero uses its "phone" composition: the
 * lanes converge in a band above the copy. Tablets use it too; side by side,
 * the copy column left too little room for the picture below 1100px.
 */
export const PHONE_QUERY = "(max-width: 1099px)";

/** One lane per signal layer: GPU, host, network, scheduler, storage, workload. */
export const LANES = 6;
/** The lane that carries the fault (drawn orange). */
export const FAULT = 2;
export const STEP = 5.0; // seconds per cycle: evidence in, a diagnosis, the path to recovery
export const ARRIVE = 2.1; // the last healthy signal reaches B
export const TRAVEL = 1.75; // the merged packet runs the single line
const LAGS = [0, 0.45, 0.85, 0.95, 0.4, 0, 0]; // how long after ARRIVE the fault's signal lands, per cycle
const MAXLAG = 0.95;
/** How much earlier than ARRIVE each healthy lane lands, s, so the signals come in one by one (the fault lane's entry is unused). */
const SETTLE = [0.5, 0.2, 0, 0.4, 0.1, 0.55];
/** The composed still: cycle 3, the healthy signals in, the fault's most of the way in. */
export const STILL = 2 * STEP + ARRIVE + 0.62;

/**
 * Lane box per mode. Phone: the band above the copy, as tall as the base run's
 * y (--hx-base); desktop: the whole hero. by matches --hx-by.
 */
export const SHAPE: Record<Mode, { top: number; bot: number; by: number; x0: number }> = {
  phone: { top: 16 / 154, bot: 128 / 154, by: 0.46, x0: -0.13 },
  desk: { top: 0.22, bot: 0.78, by: 0.5, x0: -0.08 },
};

/** Sizes of the moving parts, px. */
export const SIZE: Record<Mode, { tail: number; dot: number; wait: number; flash: number; runTail: number; rimDy: number }> = {
  phone: { tail: 70, dot: 18, wait: 60, flash: 110, runTail: 120, rimDy: 1.5 },
  desk: { tail: 150, dot: 26, wait: 96, flash: 190, runTail: 220, rimDy: 2.2 },
};

/**
 * Reference lane boxes (390 x 844 phone, 1440 x 900 desktop). The moving layer
 * is worked out in this box and then stretched to the real one (as the
 * server-rendered SVG is), so the two agree at every width.
 */
export const REF: Record<Mode, { bx: number; hb: number }> = {
  phone: { bx: 234, hb: 154 },
  desk: { bx: 390.66, hb: 878.6 },
};

export const BLUE: [number, string][] = [[0, "rgba(235,248,255,1)"], [0.18, "rgba(143,211,247,0.85)"], [0.45, "rgba(2,151,222,0.28)"], [1, "rgba(2,151,222,0)"]];
export const WARM: [number, string][] = [[0, "rgba(255,236,226,1)"], [0.2, "rgba(255,154,122,0.85)"], [0.5, "rgba(252,115,77,0.25)"], [1, "rgba(252,115,77,0)"]];

/** Control points of lane i in a lane box bx wide and hb tall, converging at (bx, by). */
export function laneCtrl(mode: Mode, i: number, bx: number, hb: number, by: number): [Pt, Pt, Pt, Pt] {
  const s = SHAPE[mode];
  const y0 = hb * (s.top + (s.bot - s.top) * (i / (LANES - 1)));
  return [[s.x0 * bx, y0], [bx * 0.4, y0], [bx * 0.72, by + (y0 - by) * 0.16], [bx, by]];
}

export function bez([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt], n: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    pts.push([
      v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
      v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
    ]);
  }
  return pts;
}
export function measure(pts: Pt[]): Path {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}
export function at(path: Path, d: number): [number, number, number] {
  const { pts, len, total } = path;
  d = Math.max(0, Math.min(total, d));
  let lo = 0, hi = len.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (len[m] < d) lo = m;
    else hi = m;
  }
  const seg = len[hi] - len[lo] || 1, f = (d - len[lo]) / seg;
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f, hi];
}
export function sub(path: Path, d0: number, d1: number): Pt[] {
  const a = at(path, d0), b = at(path, d1);
  const out: Pt[] = [[a[0], a[1]]];
  for (let i = a[2]; i < b[2]; i++) out.push(path.pts[i]);
  out.push([b[0], b[1]]);
  return out;
}

const ease = (x: number) => 1 - Math.pow(1 - x, 2.2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lagAt = (k: number) => LAGS[((k % LAGS.length) + LAGS.length) % LAGS.length];

export type Trail = { pts: Pt[]; rgb: string; a: number; w: number };
export type Dot = { x: number; y: number; s: number; a: number; warm: boolean };
/** Everything that moves, at one moment. rim: strength of the fault lane's orange edge (0-1). */
export type Scene = { rim: number; trails: Trail[]; dots: Dot[] };

/**
 * The pose at time t (seconds): the healthy signals land at B one by one, the
 * fault's signal (lane 2, orange-rimmed) completes the picture, B blooms into
 * one diagnosis, and one packet runs the single line toward recovery.
 * The lanes and B are in lane space and come out through xf; the single line
 * (merged) is already in place.
 */
export function scene(time: number, mode: Mode, lanes: Path[], B: { x: number; y: number }, merged: Path | null, xf: (p: Pt) => Pt = (p) => p): Scene {
  const sz = SIZE[mode];
  const k = Math.floor(time / STEP), tau = time - k * STEP;
  const lag = lagAt(k);
  const prev = lagAt(k - 1);
  const warmth = clamp01((prev + (lag - prev) * clamp01(tau / 1.2)) / MAXLAG);
  const release = ARRIVE + lag;
  const waiting = tau >= ARRIVE && tau < release;
  const out: Scene = { rim: warmth, trails: [], dots: [] };
  // each healthy signal on its own clock; the fault's lands last
  for (let i = 0; i < lanes.length; i++) {
    const ln = lanes[i];
    const fault = i === FAULT;
    const dur = fault ? ARRIVE + lag : ARRIVE - SETTLE[i % SETTLE.length];
    const p = clamp01(tau / dur);
    const fade = tau > release ? clamp01(1 - (tau - release) / 0.35) : 1;
    if (fade <= 0) continue;
    const head = ease(p) * ln.total;
    const arrived = p >= 1;
    const tl = arrived ? sz.tail * Math.max(0.15, 1 - (tau - dur) / 0.6) : sz.tail;
    const warm = fault && warmth > 0.05;
    if (warm) {
      out.trails.push({ pts: sub(ln, head - tl, head).map(xf), rgb: "252,115,77", a: 0.75 * warmth * fade, w: 2 });
      out.trails.push({ pts: sub(ln, head - tl * 0.7, head).map(xf), rgb: "207,235,250", a: 0.55 * (1 - warmth * 0.6) * fade, w: 1.2 });
    } else {
      out.trails.push({ pts: sub(ln, head - tl, head).map(xf), rgb: "143,211,247", a: 0.85 * fade, w: 1.8 });
    }
    const [hx, hy] = at(ln, head);
    const pt = xf([hx, hy]);
    out.dots.push({ x: pt[0], y: pt[1], s: sz.dot, a: (arrived ? 0.5 : 0.95) * fade, warm });
  }
  // the evidence gathers at B: the bloom swells; with the fault's signal in, one packet runs the single line
  const [bx, by] = xf([B.x, B.y]);
  if (waiting) {
    const w = (tau - ARRIVE) / Math.max(0.01, lag);
    out.dots.push({ x: bx, y: by, s: sz.wait * (1 + 0.35 * w), a: 0.55 + 0.2 * w, warm: false });
  } else if (tau >= release) {
    const since = tau - release;
    const flash = clamp01(1 - since / 0.7);
    out.dots.push({ x: bx, y: by, s: sz.flash * (1 + 0.4 * (1 - flash)), a: 0.9 * flash, warm: false });
    const q = clamp01(since / TRAVEL);
    if (q < 1 && merged) {
      const head = q * q * (3 - 2 * q) * merged.total;
      out.trails.push({ pts: sub(merged, head - sz.runTail, head), rgb: "207,235,250", a: 0.9 * (1 - q * 0.25), w: 2.4 });
      const pt = at(merged, head);
      out.dots.push({ x: pt[0], y: pt[1], s: sz.dot * 1.4, a: 0.95, warm: false });
    }
  }
  return out;
}

/**
 * The still pose for the server-rendered picture, in the reference lane box:
 * trails in lane-box units (0-1000 on both axes), dots as fractions of the box.
 */
export function stillScene(mode: Mode) {
  const { bx, hb } = REF[mode];
  const by = SHAPE[mode].by * hb;
  const lanes = Array.from({ length: LANES }, (_, i) => measure(bez(laneCtrl(mode, i, bx, hb, by), 90)));
  const s = scene(STILL, mode, lanes, { x: bx, y: by }, null);
  return {
    rim: s.rim,
    trails: s.trails.map((t) => ({ ...t, pts: t.pts.map(([x, y]): Pt => [(x * 1000) / bx, (y * 1000) / hb]) })),
    dots: s.dots.map((d) => ({ ...d, x: d.x / bx, y: d.y / hb })),
  };
}

/** SVG path data for lane i in lane-box units. */
export function laneD(mode: Mode, i: number) {
  const [p0, p1, p2, p3] = laneCtrl(mode, i, 1000, 1000, SHAPE[mode].by * 1000);
  const f = (p: Pt) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`;
  return `M${f(p0)} C${f(p1)} ${f(p2)} ${f(p3)}`;
}

/**
 * CSS stops for a canvas sprite's radial gradient. Canvas interpolates the
 * stops unpremultiplied and CSS premultiplied, so the in-between colours are
 * spelled out here to make the two read the same.
 */
export function spriteGradient(stops: [number, string][]) {
  const parse = (c: string) => c.slice(5, -1).split(",").map(Number);
  const out: string[] = [];
  for (let i = 0; i < stops.length; i++) {
    const [o, c] = stops[i];
    out.push(`${c} ${+(o * 100).toFixed(2)}%`);
    if (i === stops.length - 1) break;
    const a = parse(c), b = parse(stops[i + 1][1]), o1 = stops[i + 1][0];
    for (let k = 1; k < 4; k++) {
      const f = k / 4, m = a.map((v, j) => v + (b[j] - v) * f);
      out.push(`rgba(${m.slice(0, 3).map((v) => Math.round(v)).join(",")},${+m[3].toFixed(3)}) ${+((o + (o1 - o) * f) * 100).toFixed(2)}%`);
    }
  }
  return `radial-gradient(closest-side, ${out.join(", ")})`;
}
