"use client";

import { useEffect, useRef } from "react";
import { addTask, kick, reducedMotion, type Frame } from "./motion";

/**
 * The hero: eight rank trails converge at the all-reduce. The healthy ranks
 * arrive together and wait for the late one (rank 2, orange-rimmed); released,
 * the eight become one luminous line that turns down the hero and lands on the
 * page's spine. Illustration only.
 *
 * Two canvases: static (haze, lane tracks, gate, the merged line's glow; drawn on
 * resize) and live (packets, the late lane's rim, blooms; drawn per frame while the
 * hero is on screen). Under reduced motion one composed still is drawn. Before
 * hydration and without JS the server-rendered SVG in Hero.tsx stands in.
 */

const LANES = 8;
const LATE = 2;
const STEP = 5.0; // seconds per training step
const ARRIVE = 2.1; // healthy ranks reach the barrier
const TRAVEL = 1.75; // the merged packet runs the single line
const LAGS = [0, 0.45, 0.85, 0.95, 0.4, 0, 0]; // the late rank's lag per step
const MAXLAG = 0.95;

type Pt = [number, number];
type Path = { pts: Pt[]; len: number[]; total: number };

function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] {
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
function measure(pts: Pt[]): Path {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}
function at(path: Path, d: number): [number, number, number] {
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
function sub(path: Path, d0: number, d1: number): Pt[] {
  const a = at(path, d0), b = at(path, d1);
  const out: Pt[] = [[a[0], a[1]]];
  for (let i = a[2]; i < b[2]; i++) out.push(path.pts[i]);
  out.push([b[0], b[1]]);
  return out;
}
function line(g: CanvasRenderingContext2D, pts: Pt[]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
}
function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, out: Pt[]) {
  const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.12));
  for (let i = 1; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
}
function straight(x0: number, y0: number, x1: number, y1: number, out: Pt[]) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8));
  for (let i = 1; i <= n; i++) out.push([x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n)]);
}
function sprite(size: number, stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}
const ease = (x: number) => 1 - Math.pow(1 - x, 2.2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lagAt = (k: number) => LAGS[((k % LAGS.length) + LAGS.length) % LAGS.length];

export default function HeroPath() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = root.current;
    const hero = wrap?.closest("section");
    if (!wrap || !hero) return;
    const cStatic = wrap.querySelector<HTMLCanvasElement>("[data-layer=static]")!;
    const cLive = wrap.querySelector<HTMLCanvasElement>("[data-layer=live]")!;
    const xS = cStatic.getContext("2d");
    const xL = cLive.getContext("2d");
    const anchor = hero.querySelector<HTMLElement>("[data-spine-anchor]");
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    const tagGate = wrap.querySelector<HTMLElement>("[data-tag=gate]")!;
    const tagLate = wrap.querySelector<HTMLElement>("[data-tag=late]")!;
    if (!xS || !xL || !anchor || !copy) return;
    const reduce = reducedMotion();

    let W = 0, H = 0, dpr = 1;
    let geo: null | { B: { x: number; y: number }; lanes: Path[]; merged: Path; phone: boolean; gate: number } = null;
    let blue: HTMLCanvasElement, warm: HTMLCanvasElement;
    let onScreen = true;
    let t = 0.6;

    function layout() {
      const r = hero!.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [cStatic, cLive]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      const sx = anchor!.getBoundingClientRect().left - r.left + 1;
      const cr = copy!.getBoundingClientRect();
      const phone = W < 760;
      let B: { x: number; y: number }, top: number, bot: number, xTurn: number, yBase: number, rad: number;
      if (!phone) {
        const right = cr.left - r.left - 140;
        B = { x: Math.max(sx + 220, Math.min(right - 100, W * 0.37)), y: H * 0.5 };
        top = H * 0.22;
        bot = H * 0.78;
        xTurn = B.x + 104;
        rad = 34;
        yBase = H - Math.max(70, H * 0.085);
      } else {
        // Phone: the lanes converge in a band above the copy; the single line then turns
        // down the copy's left edge, so the spine starts in the first viewport.
        const copyTop = cr.top - r.top;
        yBase = copyTop - 18;
        B = { x: W * 0.6, y: yBase * 0.46 };
        top = 16;
        bot = yBase - 26;
        xTurn = Math.min(W - 18, B.x + 76);
        rad = 20;
      }
      const lanes: Path[] = [];
      for (let i = 0; i < LANES; i++) {
        const y0 = top + (bot - top) * (i / (LANES - 1));
        lanes.push(measure(bez([-30, y0], [B.x * 0.4, y0], [B.x * 0.72, B.y + (y0 - B.y) * 0.16], [B.x, B.y], 90)));
      }
      const m: Pt[] = [[B.x, B.y]];
      straight(B.x, B.y, xTurn - rad, B.y, m);
      arcPts(xTurn - rad, B.y + rad, rad, -Math.PI / 2, 0, m);
      straight(xTurn, B.y + rad, xTurn, yBase - rad, m);
      arcPts(xTurn - rad, yBase - rad, rad, 0, Math.PI / 2, m);
      straight(xTurn - rad, yBase, sx + rad, yBase, m);
      arcPts(sx + rad, yBase + rad, rad, -Math.PI / 2, -Math.PI, m);
      straight(sx, yBase + rad, sx, H + 6, m);
      geo = { B, lanes, merged: measure(m), phone, gate: phone ? 40 : 150 };
      blue = sprite(64, [[0, "rgba(235,248,255,1)"], [0.18, "rgba(143,211,247,0.85)"], [0.45, "rgba(2,151,222,0.28)"], [1, "rgba(2,151,222,0)"]]);
      warm = sprite(64, [[0, "rgba(255,236,226,1)"], [0.2, "rgba(255,154,122,0.85)"], [0.5, "rgba(252,115,77,0.25)"], [1, "rgba(252,115,77,0)"]]);
      drawStatic(sx, yBase);
      // Labels sit on navy chips, fully opaque at every phase of the loop.
      tagGate.style.setProperty("--tx", `${Math.round(phone ? B.x + 14 : B.x - 34)}px`);
      tagGate.style.setProperty("--ty", `${Math.round(phone ? B.y - 30 : B.y - geo.gate - 26)}px`);
      const lp = at(lanes[LATE], lanes[LATE].total * (phone ? 0.1 : 0.2));
      tagLate.style.setProperty("--tx", `${Math.round(Math.max(phone ? 12 : sx + 6, lp[0]))}px`);
      tagLate.style.setProperty("--ty", `${Math.round(lp[1] - (phone ? 24 : 30))}px`);
      wrap!.dataset.live = "";
    }

    function drawStatic(sx: number, yBase: number) {
      const g = xS!, { B, lanes, merged, phone, gate } = geo!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // the light that reveals the form: a cobalt haze around the barrier and along the base
      let rg = g.createRadialGradient(B.x, B.y, 0, B.x, B.y, Math.max(W, H) * 0.55);
      rg.addColorStop(0, "rgba(4,61,99,0.55)");
      rg.addColorStop(0.35, "rgba(2,22,36,0.45)");
      rg.addColorStop(1, "rgba(2,7,10,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      rg = g.createRadialGradient(sx, yBase, 0, sx, yBase, W * 0.5);
      rg.addColorStop(0, "rgba(3,115,176,0.16)");
      rg.addColorStop(1, "rgba(3,115,176,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      // axis ticks under the base run
      g.fillStyle = "rgba(143,211,247,1)";
      for (let x = sx + 48; !phone && x < B.x + 90; x += 24) {
        g.globalAlpha = 0.05 + 0.13 * Math.max(0, 1 - Math.abs(x - (sx + B.x) / 2) / ((B.x - sx) * 0.75));
        g.fillRect(x, yBase + 14, 1, (x - sx) % 120 < 24 ? 9 : 5);
      }
      g.globalAlpha = 1;
      // the barrier gate
      let lg = g.createLinearGradient(0, B.y - gate, 0, B.y + gate);
      lg.addColorStop(0, "rgba(234,242,245,0)");
      lg.addColorStop(0.5, "rgba(234,242,245,0.32)");
      lg.addColorStop(1, "rgba(234,242,245,0)");
      g.fillStyle = lg;
      g.fillRect(B.x - 0.5, B.y - gate, 1, gate * 2);
      // lane tracks: long-exposure trails, dim at the edge, brighter as they converge
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      g.lineJoin = "round";
      for (const ln of lanes) {
        lg = g.createLinearGradient(0, 0, B.x, 0);
        lg.addColorStop(0, "rgba(2,151,222,0)");
        lg.addColorStop(0.45, "rgba(2,151,222,0.05)");
        lg.addColorStop(1, "rgba(77,184,238,0.20)");
        g.strokeStyle = lg;
        g.lineWidth = 7;
        line(g, ln.pts);
        g.stroke();
        lg = g.createLinearGradient(0, 0, B.x, 0);
        lg.addColorStop(0, "rgba(143,211,247,0.04)");
        lg.addColorStop(0.6, "rgba(143,211,247,0.20)");
        lg.addColorStop(1, "rgba(207,235,250,0.55)");
        g.strokeStyle = lg;
        g.lineWidth = 1;
        line(g, ln.pts);
        g.stroke();
      }
      // the single line the eight become
      const layers: [number, string][] = phone
        ? [[22, "rgba(2,151,222,0.05)"], [11, "rgba(2,151,222,0.10)"], [5, "rgba(77,184,238,0.28)"], [2.2, "rgba(143,211,247,0.8)"], [1, "rgba(235,248,255,0.95)"]]
        : [[34, "rgba(2,151,222,0.04)"], [18, "rgba(2,151,222,0.08)"], [8, "rgba(2,151,222,0.20)"], [3.4, "rgba(77,184,238,0.65)"], [1.4, "rgba(235,248,255,0.95)"]];
      for (const [w, col] of layers) {
        g.strokeStyle = col;
        g.lineWidth = w;
        line(g, merged.pts);
        g.stroke();
      }
      const s = phone ? 90 : 150;
      g.drawImage(blue, B.x - s / 2, B.y - s / 2, s, s);
      g.globalCompositeOperation = "source-over";
    }

    function trail(g: CanvasRenderingContext2D, path: Path, head: number, tailLen: number, rgb: string, alpha: number, width: number) {
      if (alpha <= 0.004) return;
      const pts = sub(path, Math.max(0, head - tailLen), head);
      if (pts.length < 2) return;
      const a = pts[0], b = pts[pts.length - 1];
      const lg = g.createLinearGradient(a[0], a[1], b[0], b[1]);
      lg.addColorStop(0, `rgba(${rgb},0)`);
      lg.addColorStop(1, `rgba(${rgb},${alpha})`);
      g.strokeStyle = lg;
      g.lineWidth = width;
      line(g, pts);
      g.stroke();
    }
    function dot(g: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, y: number, s: number, a: number) {
      if (a <= 0.004) return;
      g.globalAlpha = a;
      g.drawImage(img, x - s / 2, y - s / 2, s, s);
      g.globalAlpha = 1;
    }

    function frame(time: number) {
      if (!geo) return;
      const g = xL!, { B, lanes, merged, phone } = geo;
      const k = Math.floor(time / STEP), tau = time - k * STEP;
      const lag = lagAt(k);
      const prev = lagAt(k - 1);
      const warmth = clamp01((prev + (lag - prev) * clamp01(tau / 1.2)) / MAXLAG);
      const release = ARRIVE + lag;
      const waiting = tau >= ARRIVE && tau < release;
      const tail = phone ? 70 : 150;
      const dotS = phone ? 18 : 26;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      // the late lane's orange rim: a restrained edge on its lower side
      if (warmth > 0.01) {
        const ln = lanes[LATE];
        g.save();
        g.translate(0, phone ? 1.5 : 2.2);
        g.strokeStyle = `rgba(252,115,77,${0.55 * warmth})`;
        g.lineWidth = 1.2;
        line(g, ln.pts);
        g.stroke();
        g.strokeStyle = `rgba(252,115,77,${0.09 * warmth})`;
        g.lineWidth = 7;
        line(g, ln.pts);
        g.stroke();
        g.restore();
      }
      // packets in lockstep; the late rank on its own clock
      for (let i = 0; i < LANES; i++) {
        const ln = lanes[i];
        const late = i === LATE;
        const dur = late ? ARRIVE + lag : ARRIVE;
        const p = clamp01(tau / dur);
        const fade = tau > release ? clamp01(1 - (tau - release) / 0.35) : 1;
        if (fade <= 0) continue;
        const head = ease(p) * ln.total;
        const arrived = p >= 1;
        const tl = arrived ? tail * Math.max(0.15, 1 - (tau - dur) / 0.6) : tail;
        if (late && warmth > 0.05) {
          trail(g, ln, head, tl, "252,115,77", 0.75 * warmth * fade, 2);
          trail(g, ln, head, tl * 0.7, "207,235,250", 0.55 * (1 - warmth * 0.6) * fade, 1.2);
        } else {
          trail(g, ln, head, tl, "143,211,247", 0.85 * fade, 1.8);
        }
        const pt = at(ln, head);
        dot(g, late && warmth > 0.05 ? warm : blue, pt[0], pt[1], dotS, (arrived ? 0.5 : 0.95) * fade);
      }
      // everyone waits at the barrier: the bloom swells; then one packet runs the single line
      if (waiting) {
        const w = (tau - ARRIVE) / Math.max(0.01, lag);
        dot(g, blue, B.x, B.y, (phone ? 60 : 96) * (1 + 0.35 * w), 0.55 + 0.2 * w);
      } else if (tau >= release) {
        const since = tau - release;
        const flash = clamp01(1 - since / 0.7);
        dot(g, blue, B.x, B.y, (phone ? 110 : 190) * (1 + 0.4 * (1 - flash)), 0.9 * flash);
        const q = clamp01(since / TRAVEL);
        if (q < 1) {
          const head = q * q * (3 - 2 * q) * merged.total;
          trail(g, merged, head, phone ? 120 : 220, "207,235,250", 0.9 * (1 - q * 0.25), 2.4);
          const pt = at(merged, head);
          dot(g, blue, pt[0], pt[1], dotS * 1.4, 0.95);
        }
      }
      g.globalCompositeOperation = "source-over";
    }

    // A composed still: step 3, seven healthy ranks waiting, the late rank most of the way in.
    const STILL = 2 * STEP + ARRIVE + 0.62;
    const rebuild = () => {
      layout();
      frame(reduce.matches ? STILL : t);
    };

    const ro = new ResizeObserver(() => rebuild());
    ro.observe(hero);
    ro.observe(copy);
    const io = new IntersectionObserver((es) => {
      onScreen = es[es.length - 1].isIntersecting;
      kick();
    });
    io.observe(hero);
    const onReduce = () => {
      frame(reduce.matches ? STILL : t);
      kick();
    };
    reduce.addEventListener("change", onReduce);

    const remove = addTask(
      {
        wants: () => onScreen && !reduce.matches && geo !== null,
        draw: (f: Frame) => {
          t += f.dt;
          frame(t);
        },
      },
      {
        name: "hero",
        run: (i) => {
          frame(t + (i + 1) / 60);
          xL.getImageData(0, 0, 1, 1);
        },
      },
    );
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) rebuild();
    });
    rebuild();

    return () => {
      cancelled = true;
      remove();
      ro.disconnect();
      io.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <div ref={root} className="ys-hero-path" aria-hidden="true">
      <canvas data-layer="static" />
      <canvas data-layer="live" />
      <span className="ys-hero-tag" data-tag="gate">all-reduce</span>
      <span className="ys-hero-tag ys-hero-tag-late" data-tag="late">rank 2 · late</span>
    </div>
  );
}
