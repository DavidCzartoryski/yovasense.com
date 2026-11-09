"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { addTask, kick, reducedMotion, viewport, type Frame } from "./motion";
import {
  EDGE_FROM, EDGE_GLOW, EDGE_STOPS, EDGE_TO, LIT_STOPS, READ, SHADOW_STOPS, STILL_SCROLL, STILL_POSE,
  creaseAlpha, faceGeometry, faces, fieldMode, gainAt, ribbons, smooth, type Pose, type Ribbon,
} from "./fieldGeometry";

/**
 * The homepage's persistent background: two folded ribbons of light behind
 * every section, in the reference's language (flat lit faces, deep shadow
 * faces, a hard crease where they meet, one warm edge).
 *
 * Scrolling slides each ribbon along its length at its own rate (the near one
 * faster than the far one), sweeps the blue light across its faces, and lights
 * the orange edge on one crease as each section arrives at the reading line.
 * A bloom rides the spine at the reading line, where the spine's lit part ends.
 *
 * Text never sits on this light: every text block has a navy scrim (.ys-scrim).
 * Two canvases, both fixed to the viewport: "soft" at half resolution (faces and
 * bloom) and "crisp" at device resolution (crease hairlines and the warm edge).
 * Under reduced motion it draws one composed still and never redraws on scroll.
 * Its shape lives in fieldGeometry.ts. The first frame (the top of the page, or
 * the reduced-motion still) is server-rendered as FieldStill and passed in as
 * children: it shows without JS and before hydration, and the canvas takes over
 * drawing the same picture.
 */

const SOFT = 0.5;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export default function ScrollField({ children }: { children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cSoft = el.querySelector<HTMLCanvasElement>("[data-layer=soft]")!;
    const cCrisp = el.querySelector<HTMLCanvasElement>("[data-layer=crisp]")!;
    const gs = cSoft.getContext("2d");
    const gc = cCrisp.getContext("2d");
    if (!gs || !gc) return;
    const reduce = reducedMotion();

    let W = 0, H = 0, dpr = 1, docH = 1;
    let spineX = -1, spineTop = 0, spineEnd = 0;
    let arrivals: number[] = [];
    let bloom: HTMLCanvasElement | null = null;
    let sy = window.scrollY; // smoothed scroll: the field follows with a little inertia
    let lastY = sy;
    let vel = 0;
    let measured = false;

    function makeBloom() {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d")!;
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(207,235,250,0.9)");
      gr.addColorStop(0.12, "rgba(143,211,247,0.55)");
      gr.addColorStop(0.4, "rgba(2,151,222,0.18)");
      gr.addColorStop(1, "rgba(2,151,222,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      return c;
    }

    function measure() {
      const w = el!.clientWidth, h = el!.clientHeight;
      if (w !== W || Math.abs(h - H) > 120 || !measured) {
        W = w;
        H = h;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        cSoft.width = Math.max(1, Math.round(W * SOFT));
        cSoft.height = Math.max(1, Math.round(H * SOFT));
        cCrisp.width = Math.max(1, Math.round(W * dpr));
        cCrisp.height = Math.max(1, Math.round(H * dpr));
      }
      const y = window.scrollY;
      docH = document.documentElement.scrollHeight;
      const spines = document.querySelectorAll<HTMLElement>(".ys-spine");
      if (spines.length) {
        const a = spines[0].getBoundingClientRect(), b = spines[spines.length - 1].getBoundingClientRect();
        spineX = a.left + a.width / 2;
        spineTop = a.top + y;
        spineEnd = b.bottom + y;
      }
      arrivals = Array.from(document.querySelectorAll<HTMLElement>("main > section")).map((s) => s.getBoundingClientRect().top + y);
      bloom = bloom || makeBloom();
      measured = true;
    }

    /** Ribbon i's lit and shadow faces on the soft canvas, its crease hairlines and warm edge on the crisp one. */
    function drawRibbon(R: Ribbon, i: number, pose: Pose) {
      const g = gs!;
      const a = pose.gain * R.gain;
      const warmth = i === 0 ? pose.warmth : pose.warmth * 0.45;
      let edge: null | { x0: number; y0: number; x1: number; y1: number; b: number } = null;
      let edgeDist = Infinity;
      const creases: { x0: number; y0: number; x1: number; y1: number; b: number }[] = [];
      for (const f of faces(R, i, pose.p, pose.scroll, W / H)) {
        const fg = faceGeometry(R, f, W, H);
        if (!fg) continue; // entirely off screen
        g.beginPath();
        g.moveTo(fg.corners[0][0] * SOFT, fg.corners[0][1] * SOFT);
        for (let c = 1; c < 4; c++) g.lineTo(fg.corners[c][0] * SOFT, fg.corners[c][1] * SOFT);
        g.closePath();
        const lg = g.createLinearGradient(fg.p0[0] * SOFT, fg.p0[1] * SOFT, fg.p1[0] * SOFT, fg.p1[1] * SOFT);
        // a lit face is brightest at the crease it rises from, rolling off toward the next;
        // a shadow face is deepest where it folds under the next lit face
        const k = f.lit ? f.b * a : a;
        for (const [o, [r, gg, bb, al]] of f.lit ? LIT_STOPS : SHADOW_STOPS) lg.addColorStop(o, `rgba(${r},${gg},${bb},${al * k})`);
        g.fillStyle = lg;
        g.fill();
        if (f.lit) {
          const e = { ...fg.crease, b: f.b * a };
          creases.push(e);
          if (f.dist < edgeDist) {
            edgeDist = f.dist;
            edge = e;
          }
        }
      }
      // crisp layer: a hairline of light along every hard crease, one warm edge
      const c = gc!;
      for (const e of creases) {
        c.strokeStyle = `rgba(207,235,250,${creaseAlpha(e.b)})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(e.x0, e.y0);
        c.lineTo(e.x1, e.y1);
        c.stroke();
      }
      if (edge && warmth > 0.02) {
        const e = edge as { x0: number; y0: number; x1: number; y1: number; b: number };
        const ax = e.x0 + (e.x1 - e.x0) * EDGE_FROM, ay = e.y0 + (e.y1 - e.y0) * EDGE_FROM;
        const bx = e.x0 + (e.x1 - e.x0) * EDGE_TO, by = e.y0 + (e.y1 - e.y0) * EDGE_TO;
        const lg = c.createLinearGradient(ax, ay, bx, by);
        for (const [o, [r, gg, bb, al]] of EDGE_STOPS(warmth)) lg.addColorStop(o, `rgba(${r},${gg},${bb},${al})`);
        c.strokeStyle = lg;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
        c.strokeStyle = `rgba(252,115,77,${EDGE_GLOW(warmth)})`;
        c.lineWidth = 10;
        c.stroke();
      }
    }

    function draw(scrollY: number, smoothY: number, v: number, still: boolean) {
      if (!measured) measure();
      const mode = fieldMode(W);
      let pose: Pose;
      if (still) pose = STILL_POSE(mode);
      else {
        const gain = gainAt(smoothY / H);
        // the orange edge catches as a section's top crosses the reading line
        let arrive = 0;
        for (const top of arrivals) arrive = Math.max(arrive, Math.exp(-(((top - smoothY - H * READ) / (H * 0.32)) ** 2)));
        pose = { p: clamp01(smoothY / Math.max(1, docH - H)), scroll: smoothY / H, gain, warmth: (0.22 + 0.78 * arrive) * gain };
      }

      gs!.setTransform(1, 0, 0, 1, 0, 0);
      gs!.clearRect(0, 0, cSoft.width, cSoft.height);
      gc!.setTransform(dpr, 0, 0, dpr, 0, 0);
      gc!.clearRect(0, 0, W, H);
      ribbons(mode, pose.p).forEach((R, i) => drawRibbon(R, i, pose));

      // the reading head: a bloom on the spine at the reading line, while the line is there
      const readY = scrollY + H * READ;
      if (!still && spineX >= 0 && readY > spineTop && readY < spineEnd && bloom) {
        const fadeIn = smooth(spineTop, spineTop + H * 0.25, readY) * (1 - smooth(spineEnd - H * 0.2, spineEnd, readY));
        const phone = fieldMode(W) === "phone";
        const s = (phone ? 120 : 260) * SOFT;
        gs!.globalAlpha = 0.55 * fadeIn;
        gs!.drawImage(bloom, spineX * SOFT - s / 2, H * READ * SOFT - s / 2, s, s);
        gs!.globalAlpha = 1;
        // a short streak along the spine, longer the faster the page moves
        const len = Math.min(phone ? 70 : 140, Math.abs(v) * 0.06);
        const y0 = H * READ, y1 = y0 - Math.sign(v) * len;
        if (len > 2) {
          const lg = gc!.createLinearGradient(spineX, y0, spineX, y1);
          lg.addColorStop(0, `rgba(235,248,255,${0.9 * fadeIn})`);
          lg.addColorStop(1, "rgba(143,211,247,0)");
          gc!.strokeStyle = lg;
          gc!.lineWidth = 3;
          gc!.beginPath();
          gc!.moveTo(spineX, y0);
          gc!.lineTo(spineX, y1);
          gc!.stroke();
        }
        gc!.fillStyle = `rgba(235,248,255,${0.95 * fadeIn})`;
        gc!.beginPath();
        gc!.arc(spineX, y0, phone ? 2.5 : 3, 0, Math.PI * 2);
        gc!.fill();
      }
    }

    function still() {
      draw(H * STILL_SCROLL, H * STILL_SCROLL, 0, true);
    }

    const ro = new ResizeObserver(() => {
      measure();
      if (reduce.matches) still();
      else {
        draw(viewport().scrollY, sy, 0, false);
        kick();
      }
    });
    ro.observe(document.body);
    ro.observe(el);

    const onReduce = () => {
      if (reduce.matches) still();
      kick();
    };
    reduce.addEventListener("change", onReduce);

    const remove = addTask(
      {
        wants: (f: Frame) => !reduce.matches && (f.scrolled || Math.abs(f.scrollY - sy) > 0.4 || Math.abs(vel) > 2),
        draw: (f: Frame) => {
          const k = 1 - Math.exp(-f.dt * 9);
          sy += (f.scrollY - sy) * k;
          if (Math.abs(f.scrollY - sy) < 0.4) sy = f.scrollY;
          const raw = f.dt > 0 ? (f.scrollY - lastY) / f.dt : 0;
          vel += (raw - vel) * (1 - Math.exp(-f.dt * 12));
          if (!f.scrolled && Math.abs(vel) < 2) vel = 0;
          lastY = f.scrollY;
          draw(f.scrollY, sy, vel, false);
        },
      },
      {
        name: "field",
        run: (i) => {
          const y = (i * 53) % Math.max(1, docH - H);
          draw(y, y, 900, false);
          gs.getImageData(0, 0, 1, 1);
          gc.getImageData(0, 0, 1, 1);
        },
      },
    );

    measure();
    if (reduce.matches) still();
    else draw(window.scrollY, sy, 0, false);
    el.dataset.live = "";

    return () => {
      remove();
      ro.disconnect();
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <div ref={root} className="ys-field" aria-hidden="true">
      <div className="ys-field-fallback">{children}</div>
      <canvas data-layer="soft" />
      <canvas data-layer="crisp" />
    </div>
  );
}
