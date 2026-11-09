"use client";

import { useEffect } from "react";
import { addTask, reducedMotion, type Frame } from "./motion";

/**
 * Moves the document-space parts of the page with the reader, inside the
 * shared loop. The spine is lit down to the reading line and dim ahead of it;
 * station nodes, the escalation branch and other [data-reader-mark] elements
 * light as the line passes them; [data-sweep] layers slide their light across
 * a section as it passes; [data-arrive] layers warm up as their section arrives.
 *
 * Everything is written as transform, opacity or one attribute toggle, and
 * positions are measured on resize only. Without JS and under reduced motion
 * none of this runs and the page shows its static state: the whole spine lit,
 * every node lit, light at rest.
 */

const READ = 0.62;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Seg = { fill: HTMLElement; top: number; h: number; last: number };
type Mark = { el: HTMLElement; y: number; lit: boolean };
type Span = { el: HTMLElement; top: number; h: number; last: number };

export default function ScrollReader() {
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const reduce = reducedMotion();
    let segs: Seg[] = [];
    let marks: Mark[] = [];
    let sweeps: Span[] = [];
    let arrives: Span[] = [];
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
      arrives = span("[data-arrive]");
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
      for (const s of arrives) {
        const t = clamp01((scrollY + vh - s.top) / (vh * 0.7));
        const o = 0.35 + 0.65 * t * t * (3 - 2 * t);
        if (force || Math.abs(o - s.last) > 0.002) {
          s.el.style.opacity = o.toFixed(3);
          s.last = o;
        }
      }
      force = false;
    }

    function clear() {
      main!.classList.remove("ys-reading");
      for (const s of segs) s.fill.style.transform = "";
      for (const m of marks) m.el.removeAttribute("data-lit");
      for (const s of [...sweeps, ...arrives]) {
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
