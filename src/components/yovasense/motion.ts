/**
 * The homepage's one requestAnimationFrame loop. The hero, the light field and
 * the scroll reader register tasks here; the loop runs only while some task
 * wants a frame, stops in hidden tabs, and is never started under
 * prefers-reduced-motion (the tasks check that themselves and draw one still).
 *
 * Scroll position comes from a passive scroll listener, viewport size from a
 * resize listener, so nothing in the loop reads layout.
 */

export type Frame = {
  /** seconds */
  now: number;
  /** seconds since the last frame, capped at 0.05 */
  dt: number;
  scrollY: number;
  /** viewport size, CSS px */
  vw: number;
  vh: number;
  /** scrollY differs from the previous frame's */
  scrolled: boolean;
};

export type Task = {
  /** Called once per frame before draw; return false to sit this frame out. */
  wants: (f: Frame) => boolean;
  draw: (f: Frame) => void;
};

type Stats = { frames: number; totalMs: number; maxMs: number };

const tasks = new Set<Task>();
const benches = new Map<string, (i: number) => void>();
const stats: Stats = { frames: 0, totalMs: 0, maxMs: 0 };
let installed = false;
let running = false;
let raf = 0;
let last = 0;
let scrollY = 0;
let lastScrollY = Number.NaN;
let vw = 0;
let vh = 0;

declare global {
  interface Window {
    __ysMotion?: { stats: Stats; running: () => boolean; tasks: () => number };
    __ysBench?: (n?: number) => Record<string, number>;
  }
}

export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)");
}

export function viewport() {
  return { vw, vh, scrollY };
}

function install() {
  if (installed) return;
  installed = true;
  scrollY = window.scrollY;
  vw = document.documentElement.clientWidth;
  vh = window.innerHeight;
  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
      kick();
    },
    { passive: true },
  );
  window.addEventListener(
    "resize",
    () => {
      vw = document.documentElement.clientWidth;
      vh = window.innerHeight;
      kick();
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else kick();
  });
  window.__ysMotion = { stats, running: () => running, tasks: () => tasks.size };
  // Flushed cost per frame: n frames of every registered drawing task at advancing
  // time and scroll positions, each followed by a 1x1 canvas readback so raster work
  // has to finish. Leaves the live state as it was.
  window.__ysBench = (n = 120) => {
    const out: Record<string, number> = {};
    for (const [name, fn] of benches) {
      const t0 = performance.now();
      for (let i = 0; i < n; i++) fn(i);
      out[name] = (performance.now() - t0) / n;
    }
    kick();
    return out;
  };
}

function tick(now: number) {
  raf = 0;
  if (document.hidden) {
    running = false;
    return;
  }
  const t0 = performance.now();
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const f: Frame = { now: now / 1000, dt, scrollY, vw, vh, scrolled: scrollY !== lastScrollY };
  let any = false;
  for (const t of tasks) {
    if (t.wants(f)) {
      t.draw(f);
      any = true;
    }
  }
  lastScrollY = scrollY;
  if (any) {
    const ms = performance.now() - t0;
    stats.frames++;
    stats.totalMs += ms;
    if (ms > stats.maxMs) stats.maxMs = ms;
    raf = requestAnimationFrame(tick);
  } else {
    running = false;
  }
}

function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  running = false;
}

/** Ask for frames (after a scroll, resize, visibility or state change). */
export function kick() {
  if (!installed || running || document.hidden || tasks.size === 0) return;
  running = true;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

export function addTask(task: Task, bench?: { name: string; run: (i: number) => void }) {
  install();
  tasks.add(task);
  if (bench) benches.set(bench.name, bench.run);
  kick();
  return () => {
    tasks.delete(task);
    if (bench) benches.delete(bench.name);
    if (tasks.size === 0) stop();
  };
}
