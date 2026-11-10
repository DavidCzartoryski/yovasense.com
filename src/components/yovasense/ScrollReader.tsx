"use client";

import { useEffect } from "react";
import { addTask, reducedMotion, type Frame } from "./motion";

/**
 * Moves the document-space parts of the page with the reader, inside the
 * shared loop. The spine is lit down to the reading line and dim ahead of it;
 * station nodes, the escalation branch and other [data-reader-mark] elements
 * light as the line passes them; [data-sweep] layers slide their light across
 * a section as it passes; [data-drift] layers (a field slightly larger than its
 * section) drift a few percent as it passes; [data-arrive] layers warm up as
 * their section arrives; [data-glow] layers (the product section's orange
 * current and its bloom) brighten as their section comes into view, pulse
 * twice as the current crosses the screen, and dim as the section leaves.
 *
 * Everything is written as transform, opacity or one attribute toggle, and
 * positions are measured on resize only. Without JS and under reduced motion
 * none of this runs and the page shows its static state: the whole spine lit,
 * every node lit, light at rest, the current at a medium glow.
 */

const READ = 0.62;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) => t * t * (3 - 2 * t);

// The glow, g in 0..1, by scroll position only (no clock). It follows the current's heart (the
// middle of its bloom) up the screen: a soft peak as the heart passes each of PEAKS (fractions of
// the screen from the top: the lower middle, just under the console on desktop, then the upper
// middle), each a raised cosine PEAK_HALF of a screen either side, and TROUGH between and around
// them; the whole is faded in over the first ARRIVE of a screen of the section and out over its
// last. The layers map g linearly onto these ranges; at rest (globals.css, reduced motion, no JS)
// they show GLOW_REST.
const PEAKS = [0.68, 0.32];
const PEAK_HALF = 0.26;
const TROUGH = 0.35;
const ARRIVE = 0.75;
const CURRENT = [0.3, 1] as const; // opacity: a faint current at its lowest, all of it at a peak
const BLOOM = [0, 0.85] as const; // opacity
const BLOOM_SCALE = 0.07; // the bloom swells by this much from rest to a peak
const GLOW_REST = 0.54; // the current at 0.68, the bloom at 0.46, scale 1

type Seg = { fill: HTMLElement; top: number; h: number; last: number };
type Mark = { el: HTMLElement; y: number; lit: boolean };
type Span = { el: HTMLElement; top: number; h: number; last: number };
type Glow = Span & { bloom: boolean; heart: number };

function glowAt(g: Glow, scrollY: number, vh: number) {
  const shown = Math.min(scrollY + vh - g.top, g.top + g.h - scrollY);
  const inView = ease(clamp01(shown / (vh * ARRIVE)));
  const at = (g.heart - scrollY) / vh;
  let pulse = 0;
  for (const p of PEAKS) {
    const d = Math.abs(at - p) / PEAK_HALF;
    if (d < 1) pulse = Math.max(pulse, 0.5 + 0.5 * Math.cos(Math.PI * d));
  }
  return inView * (TROUGH + (1 - TROUGH) * pulse);
}

/** The middle of an element in document px from its layout (offsets up to its section), so
 * the drift and the bloom's own scale do not move it. */
function layoutMid(el: HTMLElement, host: HTMLElement, hostTop: number) {
  let y = el.offsetHeight / 2;
  for (let e: HTMLElement | null = el; e !== host; e = e.offsetParent as HTMLElement | null) {
    if (!e) return el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2;
    y += e.offsetTop;
  }
  return hostTop + y;
}

export default function ScrollReader() {
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const reduce = reducedMotion();
    let segs: Seg[] = [];
    let marks: Mark[] = [];
    let sweeps: Span[] = [];
    let drifts: Span[] = [];
    let arrives: Span[] = [];
    let glows: Glow[] = [];
    let vh = window.innerHeight;
    let force = true;

    function measure() {
      const y = window.scrollY;
      vh = window.innerHeight;
      segs = Array.from(document.querySelectorAll<HTMLElement>(".ys-spine")).flatMap((s) => {
        const fill = s.querySelector<HTMLElement>(".ys-spine-fill");
        const r = s.getBoundingClientRect();
        return fill ? [{ fill, top: r.top + y, h: Math.max(1, r.height), last: -1 }] : [];
      });
      marks = Array.from(document.querySelectorAll<HTMLElement>("[data-reader-mark]")).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, y: r.top + y + r.height / 2, lit: el.hasAttribute("data-lit") };
      });
      const span = (sel: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(sel)).map((el) => {
          const host = el.closest("section") ?? el;
          const r = host.getBoundingClientRect();
          return { el, top: r.top + y, h: Math.max(1, r.height), last: -1 };
        });
      sweeps = span("[data-sweep]");
      drifts = span("[data-drift]");
      arrives = span("[data-arrive]");
      glows = span("[data-glow]").map((s) => {
        const host = s.el.closest("section") ?? document.body;
        const bloom = host.querySelector<HTMLElement>('[data-glow="bloom"]') ?? s.el;
        return { ...s, bloom: s.el === bloom, heart: layoutMid(bloom, host, s.top) };
      });
      force = true;
    }

    function apply(scrollY: number) {
      const readY = scrollY + vh * READ;
      for (const s of segs) {
        const f = clamp01((readY - s.top) / s.h);
        if (force || Math.abs(f - s.last) > 0.0004) {
          s.fill.style.transform = `translate3d(0, ${((f - 1) * 100).toFixed(3)}%, 0)`;
          s.last = f;
        }
      }
      for (const m of marks) {
        const lit = readY >= m.y;
        if (force || lit !== m.lit) {
          m.lit = lit;
          m.el.toggleAttribute("data-lit", lit);
        }
      }
      for (const s of sweeps) {
        const t = clamp01((scrollY + vh - s.top) / (s.h + vh));
        if (force || Math.abs(t - s.last) > 0.0005) {
          s.el.style.transform = `translate3d(${((t - 0.5) * 44).toFixed(2)}%, ${((0.5 - t) * 18).toFixed(2)}%, 0)`;
          s.last = t;
        }
      }
      // inside the layer's overscan (globals.css .ys-fold-drift: 3% each side, 5% above and below)
      for (const s of drifts) {
        const t = clamp01((scrollY + vh - s.top) / (s.h + vh));
        if (force || Math.abs(t - s.last) > 0.0005) {
          s.el.style.transform = `translate3d(${((0.5 - t) * 2.4).toFixed(3)}%, ${((t - 0.5) * 7).toFixed(3)}%, 0)`;
          s.last = t;
        }
      }
      for (const s of arrives) {
        const t = clamp01((scrollY + vh - s.top) / (vh * 0.7));
        const o = 0.35 + 0.65 * t * t * (3 - 2 * t);
        if (force || Math.abs(o - s.last) > 0.002) {
          s.el.style.opacity = o.toFixed(3);
          s.last = o;
        }
      }
      for (const g of glows) {
        const v = glowAt(g, scrollY, vh);
        if (force || Math.abs(v - g.last) > 0.002) {
          g.last = v;
          const [lo, hi] = g.bloom ? BLOOM : CURRENT;
          g.el.style.opacity = (lo + (hi - lo) * v).toFixed(3);
          if (g.bloom) g.el.style.transform = `scale(${(1 + BLOOM_SCALE * (v - GLOW_REST)).toFixed(4)})`;
        }
      }
      force = false;
    }

    function clear() {
      main!.classList.remove("ys-reading");
      for (const s of segs) s.fill.style.transform = "";
      for (const m of marks) m.el.removeAttribute("data-lit");
      for (const s of [...sweeps, ...drifts, ...arrives, ...glows]) {
        s.el.style.transform = "";
        s.el.style.opacity = "";
      }
    }

    function enable() {
      measure();
      if (reduce.matches) {
        clear();
        return;
      }
      main!.classList.add("ys-reading");
      apply(window.scrollY);
    }

    const ro = new ResizeObserver(() => {
      if (reduce.matches) return;
      measure();
      apply(window.scrollY);
    });
    ro.observe(document.body);
    const onReduce = () => enable();
    reduce.addEventListener("change", onReduce);

    const remove = addTask({
      wants: (f: Frame) => !reduce.matches && (f.scrolled || force),
      draw: (f: Frame) => {
        vh = f.vh || vh;
        apply(f.scrollY);
      },
    });
    enable();

    return () => {
      remove();
      ro.disconnect();
      reduce.removeEventListener("change", onReduce);
      clear();
    };
  }, []);

  return null;
}
