/**
 * The scroll field's shape, shared by the canvas (ScrollField.tsx) and the
 * server-rendered still (FieldStill.tsx), so the page shows the same picture
 * without JavaScript, before hydration and once the canvas draws.
 *
 * Two folded ribbons of light. Each is a run of panels (faces) along its
 * length, alternately lit and in shadow, with a hard crease where they meet.
 * Lengths that scale with the field are Len = [a, b], meaning a·W + b·H (W, H:
 * the field's size in CSS px); distances along a ribbon are in units of H.
 */

export type FieldMode = "phone" | "desk";
export type Len = [number, number];
export const lenPx = (l: Len, W: number, H: number) => l[0] * W + l[1] * H;
export const fieldMode = (W: number): FieldMode => (W < 760 ? "phone" : "desk");

/** The reading line, as a fraction of the field's height. */
export const READ = 0.62;
/** Reduced motion: the still is drawn as if scrolled this many viewports... */
export const STILL_SCROLL = 0.55;
/** ...with the ribbons' sway and light at this point of the page (0 top, 1 bottom). */
export const STILL_P: Record<FieldMode, number> = { phone: 0.048, desk: 0.07 };
/** How warm the orange edge is at the top of the page in the default layout (the canvas works it out from the sections). */
export const TOP_WARMTH: Record<FieldMode, number> = { phone: 0.145, desk: 0.2 };

export type Ribbon = {
  ox: Len; oy: Len; // a point on the ribbon's centre line
  angle: number; // direction of the ribbon's length, radians
  half: Len; // half its width
  panel: number; // distance between creases, H units
  skew: number; // crease angle relative to the ribbon's normal, radians
  speed: number; // slide per px scrolled
  base: number; amp: number; // face brightness: resting and at the light's centre
  gain: number;
};

/** One panel: [s0, s1] along the ribbon (H units), lit or in shadow; b: a lit face's brightness; dist: its distance from the light. */
export type Face = { s0: number; s1: number; lit: boolean; b: number; dist: number };

const deg = Math.PI / 180;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The ribbons at scroll fraction p of the page. */
export function ribbons(mode: FieldMode, p: number): Ribbon[] {
  const wob = Math.sin(p * Math.PI * 2);
  if (mode === "phone") {
    return [
      { ox: [0.95 + 0.04 * wob, 0], oy: [0, 0.4], angle: (106 + 5 * wob) * deg, half: [0.36, 0], panel: 0.3, skew: 24 * deg, speed: 0.3, base: 0.45, amp: 0.55, gain: 1 },
      { ox: [0.02 - 0.03 * wob, 0], oy: [0, 0.72], angle: (70 - 4 * wob) * deg, half: [0.26, 0], panel: 0.42, skew: -22 * deg, speed: 0.12, base: 0.25, amp: 0.45, gain: 0.8 },
    ];
  }
  return [
    { ox: [0.86 + 0.04 * wob, 0], oy: [0, 0.42], angle: (115 + 6 * wob) * deg, half: [0.2, 0], panel: 0.36, skew: 28 * deg, speed: 0.3, base: 0.45, amp: 0.55, gain: 1 },
    { ox: [0.05 - 0.03 * wob, 0], oy: [0, 0.62], angle: (62 - 5 * wob) * deg, half: [0.13, 0], panel: 0.46, skew: -24 * deg, speed: 0.12, base: 0.25, amp: 0.45, gain: 0.8 },
  ];
}

/** How bright the faces are: quiet behind the hero, full strength from the first section on (scroll in H units). */
export const gainAt = (scroll: number) => 0.55 + 0.45 * smooth(0, 0.9, scroll);

/**
 * Ribbon i's faces (not yet culled to the screen): scrolled `scroll` viewports
 * down, at page fraction p, for a field `aspect` (W/H) wide.
 */
export function faces(R: Ribbon, i: number, p: number, scroll: number, aspect: number): Face[] {
  const period = 2 * R.panel;
  const shift = scroll * R.speed;
  const sh = ((shift % period) + period) % period;
  const reach = Math.hypot(aspect, 1) + R.panel * 2;
  const k0 = -Math.ceil(reach / R.panel) - 1, k1 = Math.ceil(reach / R.panel) + 2;
  // the light's centre drifts along each ribbon as the reader moves through the page
  const lightAt = (i === 0 ? -0.1 : 0.25) + Math.sin(p * Math.PI * (i === 0 ? 3 : 2) + i) * R.panel * 0.9;
  const out: Face[] = [];
  for (let k = k0 & ~1; k <= k1; k++) {
    const s0 = k * R.panel - sh, s1 = s0 + R.panel;
    const mid = (s0 + s1) / 2;
    out.push({ s0, s1, lit: (k & 1) === 0, b: R.base + R.amp * Math.exp(-(((mid - lightAt) / (R.panel * 1.6)) ** 2)), dist: Math.abs(mid - lightAt) });
  }
  return out;
}

/** A face's corners in px (the canvas's path order) and the ends of its centre line, or null when it is off the field. */
export function faceGeometry(R: Ribbon, f: Face, W: number, H: number) {
  const dx = Math.cos(R.angle), dy = Math.sin(R.angle);
  const cx = Math.cos(R.angle + Math.PI / 2 + R.skew), cy = Math.sin(R.angle + Math.PI / 2 + R.skew);
  const ox = lenPx(R.ox, W, H), oy = lenPx(R.oy, W, H), h = lenPx(R.half, W, H);
  const px0 = ox + dx * f.s0 * H, py0 = oy + dy * f.s0 * H;
  const px1 = ox + dx * f.s1 * H, py1 = oy + dy * f.s1 * H;
  const minX = Math.min(px0, px1) - h, maxX = Math.max(px0, px1) + h;
  const minY = Math.min(py0, py1) - h, maxY = Math.max(py0, py1) + h;
  if (maxX < 0 || minX > W || maxY < 0 || minY > H) return null;
  return {
    p0: [px0, py0] as const,
    p1: [px1, py1] as const,
    // the crease the face rises from (lit faces carry a hairline along it)
    crease: { x0: px0 - cx * h, y0: py0 - cy * h, x1: px0 + cx * h, y1: py0 + cy * h },
    corners: [
      [px0 - cx * h, py0 - cy * h],
      [px0 + cx * h, py0 + cy * h],
      [px1 + cx * h, py1 + cy * h],
      [px1 - cx * h, py1 - cy * h],
    ] as const,
  };
}

/** Colour stops of a lit face (from its crease toward the next) and of a shadow face, scaled by brightness. */
export const LIT_STOPS: [number, [number, number, number, number]][] = [
  [0, [143, 211, 247, 0.85]],
  [0.08, [77, 184, 238, 0.62]],
  [0.35, [2, 151, 222, 0.34]],
  [0.7, [3, 115, 176, 0.16]],
  [1, [4, 61, 99, 0.06]],
];
export const SHADOW_STOPS: [number, [number, number, number, number]][] = [
  [0, [2, 22, 36, 0.45]],
  [1, [1, 4, 6, 0.8]],
];
export const creaseAlpha = (b: number) => Math.min(0.75, 0.6 * b);
/** The warm edge runs along this stretch of the crease nearest the light. */
export const EDGE_FROM = 0.22, EDGE_TO = 0.86;
export const EDGE_STOPS = (w: number): [number, [number, number, number, number]][] => [
  [0, [252, 115, 77, 0]],
  [0.45, [252, 115, 77, 0.85 * w]],
  [1, [255, 154, 122, 0.95 * w]],
];
export const EDGE_GLOW = (w: number) => 0.16 * w;

/** What to draw for a pose: per ribbon, its faces, how bright, and how warm its edge is. */
export type Pose = { p: number; scroll: number; gain: number; warmth: number };

export const TOP_POSE = (mode: FieldMode): Pose => ({ p: 0, scroll: 0, gain: gainAt(0), warmth: TOP_WARMTH[mode] });
export const STILL_POSE = (mode: FieldMode): Pose => ({ p: STILL_P[mode], scroll: STILL_SCROLL, gain: gainAt(STILL_SCROLL), warmth: 0.9 });
