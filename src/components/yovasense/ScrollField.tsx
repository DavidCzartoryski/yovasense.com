"use client";

import { useEffect, useRef } from "react";
import { addTask, kick, reducedMotion, viewport, type Frame } from "./motion";

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
 * Under reduced motion it draws one composed still and never redraws on scroll;
 * without JS the CSS composition in .ys-field-fallback shows instead.
 */

const SOFT = 0.5;
const READ = 0.62; // the reading line, as a fraction of the viewport height
const STILL_SCROLL = 0.55; // reduced motion: the still is drawn as if scrolled this many viewports

type Ribbon = {
  ox: number; oy: number; // a point on the ribbon's centre line, px
  angle: number; // direction of the ribbon's length, radians
  half: number; // half its width, px
  panel: number; // distance between creases, px
  skew: number; // crease angle relative to the ribbon's normal, radians
  speed: number; // slide per px scrolled
  base: number; amp: number; // face brightness: resting and at the light's centre
  gain: number;
};

const deg = Math.PI / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function ribbons(W: number, H: number, p: number): Ribbon[] {
  const phone = W < 760;
  const wob = Math.sin(p * Math.PI * 2);
  if (phone) {
    return [
      { ox: W * (0.95 + 0.04 * wob), oy: H * 0.4, angle: (106 + 5 * wob) * deg, half: W * 0.36, panel: H * 0.3, skew: 24 * deg, speed: 0.3, base: 0.45, amp: 0.55, gain: 1 },
      { ox: W * (0.02 - 0.03 * wob), oy: H * 0.72, angle: (70 - 4 * wob) * deg, half: W * 0.26, panel: H * 0.42, skew: -22 * deg, speed: 0.12, base: 0.25, amp: 0.45, gain: 0.8 },
    ];
  }
  return [
    { ox: W * (0.86 + 0.04 * wob), oy: H * 0.42, angle: (115 + 6 * wob) * deg, half: W * 0.2, panel: H * 0.36, skew: 28 * deg, speed: 0.3, base: 0.45, amp: 0.55, gain: 1 },
    { ox: W * (0.05 - 0.03 * wob), oy: H * 0.62, angle: (62 - 5 * wob) * deg, half: W * 0.13, panel: H * 0.46, skew: -24 * deg, speed: 0.12, base: 0.25, amp: 0.45, gain: 0.8 },
  ];
}

export default function ScrollField() {
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

    function drawRibbon(R: Ribbon, shift: number, lightAt: number, gain: number, warmth: number) {
      const g = gs!;
      const dx = Math.cos(R.angle), dy = Math.sin(R.angle);
      const cx = Math.cos(R.angle + Math.PI / 2 + R.skew), cy = Math.sin(R.angle + Math.PI / 2 + R.skew);
      const period = 2 * R.panel;
      const sh = ((shift % period) + period) % period;
      const reach = Math.hypot(W, H) + R.panel * 2;
      const k0 = -Math.ceil(reach / R.panel) - 1, k1 = Math.ceil(reach / R.panel) + 2;
      const h = R.half;
      let edge: null | { x0: number; y0: number; x1: number; y1: number; b: number } = null;
      let edgeDist = Infinity;
      const creases: { x0: number; y0: number; x1: number; y1: number; b: number }[] = [];
      for (let k = k0 & ~1; k <= k1; k++) {
        const s0 = k * R.panel - sh, s1 = s0 + R.panel;
        const px0 = R.ox + dx * s0, py0 = R.oy + dy * s0;
        const px1 = R.ox + dx * s1, py1 = R.oy + dy * s1;
        // cull panels entirely off screen
        const minX = Math.min(px0, px1) - h, maxX = Math.max(px0, px1) + h;
        const minY = Math.min(py0, py1) - h, maxY = Math.max(py0, py1) + h;
        if (maxX < 0 || minX > W || maxY < 0 || minY > H) continue;
        const lit = (k & 1) === 0;
        const mid = (s0 + s1) / 2;
        const b = R.base + R.amp * Math.exp(-(((mid - lightAt) / (R.panel * 1.6)) ** 2));
        const a = gain * R.gain;
        g.beginPath();
        g.moveTo((px0 - cx * h) * SOFT, (py0 - cy * h) * SOFT);
        g.lineTo((px0 + cx * h) * SOFT, (py0 + cy * h) * SOFT);
        g.lineTo((px1 + cx * h) * SOFT, (py1 + cy * h) * SOFT);
        g.lineTo((px1 - cx * h) * SOFT, (py1 - cy * h) * SOFT);
        g.closePath();
        const lg = g.createLinearGradient(px0 * SOFT, py0 * SOFT, px1 * SOFT, py1 * SOFT);
        if (lit) {
          // a lit face: brightest at the crease it rises from, rolling off toward the next
          lg.addColorStop(0, `rgba(143,211,247,${0.85 * b * a})`);
          lg.addColorStop(0.08, `rgba(77,184,238,${0.62 * b * a})`);
          lg.addColorStop(0.35, `rgba(2,151,222,${0.34 * b * a})`);
          lg.addColorStop(0.7, `rgba(3,115,176,${0.16 * b * a})`);
          lg.addColorStop(1, `rgba(4,61,99,${0.06 * b * a})`);
          creases.push({ x0: px0 - cx * h, y0: py0 - cy * h, x1: px0 + cx * h, y1: py0 + cy * h, b: b * a });
          const d = Math.abs(mid - lightAt);
          if (d < edgeDist) {
            edgeDist = d;
            edge = { x0: px0 - cx * h, y0: py0 - cy * h, x1: px0 + cx * h, y1: py0 + cy * h, b: b * a };
          }
        } else {
          // a shadow face: deepest where it folds under the next lit face
          lg.addColorStop(0, `rgba(2,22,36,${0.45 * a})`);
          lg.addColorStop(1, `rgba(1,4,6,${0.8 * a})`);
        }
        g.fillStyle = lg;
        g.fill();
      }
      // crisp layer: a hairline of light along every hard crease, one warm edge
      const c = gc!;
      for (const e of creases) {
        c.strokeStyle = `rgba(207,235,250,${Math.min(0.75, 0.6 * e.b)})`;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(e.x0, e.y0);
        c.lineTo(e.x1, e.y1);
        c.stroke();
      }
      if (edge && warmth > 0.02) {
        const e = edge as { x0: number; y0: number; x1: number; y1: number; b: number };
        const ax = e.x0 + (e.x1 - e.x0) * 0.22, ay = e.y0 + (e.y1 - e.y0) * 0.22;
        const bx = e.x0 + (e.x1 - e.x0) * 0.86, by = e.y0 + (e.y1 - e.y0) * 0.86;
        const lg = c.createLinearGradient(ax, ay, bx, by);
        lg.addColorStop(0, "rgba(252,115,77,0)");
        lg.addColorStop(0.45, `rgba(252,115,77,${0.85 * warmth})`);
        lg.addColorStop(1, `rgba(255,154,122,${0.95 * warmth})`);
        c.strokeStyle = lg;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
        c.stroke();
        c.strokeStyle = `rgba(252,115,77,${0.16 * warmth})`;
        c.lineWidth = 10;
        c.stroke();
      }
    }

    function draw(scrollY: number, smoothY: number, v: number, still: boolean) {
      if (!measured) measure();
      const max = Math.max(1, docH - H);
      const p = clamp01(smoothY / max);
      // quiet behind the hero, full strength from the first section on
      const gain = 0.55 + 0.45 * smooth(0, H * 0.9, smoothY);
      // the orange edge catches as a section's top crosses the reading line
      let arrive = 0;
      for (const top of arrivals) arrive = Math.max(arrive, Math.exp(-(((top - smoothY - H * READ) / (H * 0.32)) ** 2)));
      const warmth = still ? 0.9 : (0.22 + 0.78 * arrive) * gain;

      gs!.setTransform(1, 0, 0, 1, 0, 0);
      gs!.clearRect(0, 0, cSoft.width, cSoft.height);
      gc!.setTransform(dpr, 0, 0, dpr, 0, 0);
      gc!.clearRect(0, 0, W, H);
      const rs = ribbons(W, H, p);
      rs.forEach((R, i) => {
        // the light's centre drifts along each ribbon as the reader moves through the page
        const lightAt = (i === 0 ? -0.1 : 0.25) * H + Math.sin(p * Math.PI * (i === 0 ? 3 : 2) + i) * R.panel * 0.9;
        drawRibbon(R, smoothY * R.speed, lightAt, gain, i === 0 ? warmth : warmth * 0.45);
      });

      // the reading head: a bloom on the spine at the reading line, while the line is there
      const readY = scrollY + H * READ;
      if (!still && spineX >= 0 && readY > spineTop && readY < spineEnd && bloom) {
        const fadeIn = smooth(spineTop, spineTop + H * 0.25, readY) * (1 - smooth(spineEnd - H * 0.2, spineEnd, readY));
        const phone = W < 760;
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
      <div className="ys-field-fallback" />
      <canvas data-layer="soft" />
      <canvas data-layer="crisp" />
    </div>
  );
}
