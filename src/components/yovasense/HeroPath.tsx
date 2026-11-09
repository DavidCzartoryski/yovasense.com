"use client";

import { useEffect, useRef } from "react";
import { addTask, kick, reducedMotion, type Frame } from "./motion";
import { BLUE, LANES, LATE, PHONE_QUERY, SIZE, STILL, WARM, bez, laneCtrl, measure, scene, type Mode, type Path, type Pt } from "./heroGeometry";

/**
 * The hero's moving layer: packets on the eight rank lanes, the late rank's
 * orange rim, the blooms at the all-reduce and the packet that runs the single
 * line. Illustration only.
 *
 * The lanes, the line and the light around them are server-rendered (Hero.tsx)
 * and stay in place; this canvas draws only what moves, over them. It starts
 * at the pose the server-rendered still shows, so nothing jumps when it takes
 * over, and under reduced motion it draws that pose once. Geometry comes from
 * the page: B and the turn from the still's marker elements, the spine's x
 * from the copy's anchor.
 */

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

export default function HeroPath() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = root.current;
    const hero = wrap?.closest("section");
    if (!wrap || !hero) return;
    const cLive = wrap.querySelector<HTMLCanvasElement>("canvas")!;
    const xL = cLive.getContext("2d");
    const anchor = hero.querySelector<HTMLElement>("[data-spine-anchor]");
    const mB = hero.querySelector<HTMLElement>("[data-hx=b]");
    const mTurn = hero.querySelector<HTMLElement>("[data-hx=turn]");
    if (!xL || !anchor || !mB || !mTurn) return;
    const reduce = reducedMotion();
    const phoneQ = window.matchMedia(PHONE_QUERY);

    let W = 0, H = 0, dpr = 1;
    let geo: null | { B: { x: number; y: number }; lanes: Path[]; merged: Path; mode: Mode } = null;
    const blue = sprite(64, BLUE), warm = sprite(64, WARM);
    let onScreen = true;
    let t = STILL;

    function layout() {
      const r = hero!.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cLive.width = Math.round(W * dpr);
      cLive.height = Math.round(H * dpr);
      const mode: Mode = phoneQ.matches ? "phone" : "desk";
      const b = mB!.getBoundingClientRect(), tn = mTurn!.getBoundingClientRect();
      const B = { x: b.left - r.left, y: b.top - r.top };
      const xTurn = tn.left - r.left, yBase = tn.top - r.top;
      const sx = anchor!.getBoundingClientRect().left - r.left + 1;
      const rad = parseFloat(getComputedStyle(hero!).getPropertyValue("--hx-rad")) || 20;
      const hb = mode === "phone" ? yBase : r.height;
      const lanes = Array.from({ length: LANES }, (_, i) => measure(bez(laneCtrl(mode, i, B.x, hb, B.y), 90)));
      const m: Pt[] = [[B.x, B.y]];
      straight(B.x, B.y, xTurn - rad, B.y, m);
      arcPts(xTurn - rad, B.y + rad, rad, -Math.PI / 2, 0, m);
      straight(xTurn, B.y + rad, xTurn, yBase - rad, m);
      arcPts(xTurn - rad, yBase - rad, rad, 0, Math.PI / 2, m);
      straight(xTurn - rad, yBase, sx + rad, yBase, m);
      arcPts(sx + rad, yBase + rad, rad, -Math.PI / 2, -Math.PI, m);
      straight(sx, yBase + rad, sx, H + 6, m);
      geo = { B, lanes, merged: measure(m), mode };
    }

    function trail(g: CanvasRenderingContext2D, pts: Pt[], rgb: string, alpha: number, width: number) {
      if (alpha <= 0.004 || pts.length < 2) return;
      const a = pts[0], b = pts[pts.length - 1];
      const lg = g.createLinearGradient(a[0], a[1], b[0], b[1]);
      lg.addColorStop(0, `rgba(${rgb},0)`);
      lg.addColorStop(1, `rgba(${rgb},${alpha})`);
      g.strokeStyle = lg;
      g.lineWidth = width;
      line(g, pts);
      g.stroke();
    }

    function frame(time: number) {
      if (!geo) return;
      const g = xL!, { B, lanes, merged, mode } = geo;
      const s = scene(time, mode, lanes, B, merged);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      g.lineCap = "round";
      // the late lane's orange rim: a restrained edge on its lower side
      if (s.rim > 0.01) {
        g.save();
        g.translate(0, SIZE[mode].rimDy);
        g.strokeStyle = `rgba(252,115,77,${0.55 * s.rim})`;
        g.lineWidth = 1.2;
        line(g, lanes[LATE].pts);
        g.stroke();
        g.strokeStyle = `rgba(252,115,77,${0.09 * s.rim})`;
        g.lineWidth = 7;
        line(g, lanes[LATE].pts);
        g.stroke();
        g.restore();
      }
      for (const tr of s.trails) trail(g, tr.pts, tr.rgb, tr.a, tr.w);
      for (const d of s.dots) {
        if (d.a <= 0.004) continue;
        g.globalAlpha = d.a;
        g.drawImage(d.warm ? warm : blue, d.x - d.s / 2, d.y - d.s / 2, d.s, d.s);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }

    const rebuild = () => {
      layout();
      frame(reduce.matches ? STILL : t);
      wrap!.dataset.live = "";
    };

    const ro = new ResizeObserver(() => rebuild());
    ro.observe(hero);
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
      <canvas />
    </div>
  );
}
