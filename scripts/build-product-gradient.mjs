// Makes the grainy-gradient background of the homepage's product section (#product), "currents":
// a navy field with soft, liquid blue swirls and one thin orange current through the open space.
//
// Three layers per composition, so the page can light the current as the reader scrolls
// (ScrollReader, [data-glow]) while the field stays as it is:
//   public/textures/product-field-<comp>.webp    the navy and blue field, opaque
//   public/textures/product-current-<comp>.webp  the orange current on transparent, cropped to it
//   public/textures/product-bloom-<comp>.webp    a wide, pre-blurred orange glow round the current,
//                                                on transparent, at a third of CSS size, cropped
// and src/data/product-glow.json, where the two cropped layers sit on the field (CSS inset, as
// percentages of the drift layer), which ProductShowcase.tsx hands to the CSS.
//
// Every pixel is computed here in plain JS (seeded gradient noise, domain-warped fBm, colour
// ramps mixed in linear light), so the same seed always gives the same images. The field is soft,
// so it is rendered at about two thirds of its CSS size and scaled up by the browser; the film
// grain is a separate tile (scripts/build-grain-tile.mjs) laid over everything at device pixels,
// so it stays sharp. The images carry only a sub-level dither against banding, no grain.
//
// Two compositions, laid out against the section's own layout: the copy column sits over the
// calm, dark part of the field, and the current and its glow stay out of it.
//   desk   1440 x 2000 CSS px section (copy column on the left, console top right, crops below)
//   phone   390 x 1900 CSS px section (copy on top, crops below)
// The field covers the drift layer, which is the section plus 5% above and below and 3% either
// side (globals.css, .ys-fold-drift), so the section is mapped onto [-0.03, 1.03] x [-0.05, 1.05].
//
//   node scripts/build-product-gradient.mjs              everything
//   node scripts/build-product-gradient.mjs --png /tmp/g  also write PNGs there, for inspection
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname;
const { values: args } = parseArgs({
  options: {
    png: { type: "string" },
    out: { type: "string", default: `${ROOT}public/textures` },
    data: { type: "string", default: `${ROOT}src/data/product-glow.json` },
    quality: { type: "string", default: "94" },
  },
});

const SEED = 7146; // phones +101

// ---------- the drift layer's overscan, as fractions of the section ----------
const OVER_X = 0.03;
const OVER_Y = 0.05;

// ---------- compositions ----------
// w x h: field image pixels. cssW x cssH: the section it is designed against.
// copy: the box the copy column (with its scroll drift) must stay dark under, CSS px.
// feather: how far past that box the light takes to arrive, CSS px.
// pivot: the point the swirls are enlarged about (the middle of the open space), CSS px.
const COMPS = {
  desk: { w: 960, h: 1334, cssW: 1440, cssH: 2000, copy: [0, 0, 610, 1320], feather: 330, scale: 760, pivot: [1000, 1000] },
  phone: { w: 300, h: 1460, cssW: 390, cssH: 1900, copy: [0, 0, 390, 1010], feather: 300, scale: 470, pivot: [195, 1400] },
};

// ---------- the calm: how far the field is turned down from the first cut ----------
// The first cut ("currents", 17fb6dd) was too busy. These numbers take about a third of its
// energy out: the swirls are drawn larger and softer and rise less far up a darker, less cyan
// ramp, and the current moved to its own layers. Against the first cut's field, in OKLab over the
// section: lightness spread -44%, mean |grad L| -41%, mean lightness -19%, chroma -21%, bright
// cyan almost gone (desktop; phones within a few points). The first cut was GROW 1,
// EDGE [0.34, 0.82], GAIN 1.05, WARP 2.4 / 2.2 and the ramp in the comment below.
const GROW = 1.12; // swirl size, about the pivot
const EDGE = [0.31, 0.88]; // where a swirl's edge rises (a wider span is a softer edge)
const GAIN = 0.9; // how far up the ramp the brightest swirl reaches
const WARP = [2.25, 2.1]; // domain-warp strength: lower is lazier, fewer tight curls
const CURRENT_GAMMA = 0.7; // see currents()
// first cut: [0 #02070A] [0.18 #021624] [0.34 #03304F] [0.54 #0373B0] [0.74 #0297DE] [0.9 #2CC3F0] [1 #B4EDFF]
const FIELD_RAMP = [
  [0.0, "#02070A"], [0.18, "#021624"], [0.36, "#032C49"], [0.56, "#045F98"],
  [0.76, "#037AB9"], [0.9, "#1394CF"], [1.0, "#58BCE6"],
];

// ---------- seeded randomness and noise ----------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return (s + 0.5) / 4294967296;
  };
}

/** 2D gradient noise in about [-1, 1], quintic fade, 256 seeded unit gradients. */
function gradientNoise(seed) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = new Float64Array(256), gy = new Float64Array(256);
  for (let i = 0; i < 256; i++) {
    const a = r() * Math.PI * 2;
    gx[i] = Math.cos(a); gy[i] = Math.sin(a);
  }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const h00 = perm[perm[X] + Y], h10 = perm[perm[X + 1] + Y];
    const h01 = perm[perm[X] + Y + 1], h11 = perm[perm[X + 1] + Y + 1];
    const n00 = gx[h00] * xf + gy[h00] * yf;
    const n10 = gx[h10] * (xf - 1) + gy[h10] * yf;
    const n01 = gx[h01] * xf + gy[h01] * (yf - 1);
    const n11 = gx[h11] * (xf - 1) + gy[h11] * (yf - 1);
    const u = fade(xf), v = fade(yf);
    return 1.414 * ((n00 + u * (n10 - n00)) * (1 - v) + (n01 + u * (n11 - n01)) * v);
  };
}

/** fBm with each octave rotated, so no axis shows through. Returns about [-1, 1]. */
function fbmOf(noise, octaves = 4, gain = 0.5) {
  return (x, y) => {
    let a = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += a * noise(x, y);
      norm += a;
      const nx = 1.6 * x - 1.2 * y + 17.3, ny = 1.2 * x + 1.6 * y - 9.1; // x2 frequency, rotated 36.9 deg
      x = nx; y = ny; a *= gain;
    }
    return sum / norm;
  };
}

// ---------- colour ----------
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = (l) => (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055);
const hex = (h) => [1, 3, 5].map((i) => toLin(parseInt(h.slice(i, i + 2), 16)));

/** A ramp of [position, "#rrggbb"] stops, interpolated in linear light with eased segments. */
function ramp(stops) {
  const s = stops.map(([t, c]) => [t, hex(c)]);
  return (t) => {
    if (t <= s[0][0]) return s[0][1];
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i][0]) {
        const [t0, c0] = s[i - 1], [t1, c1] = s[i];
        let k = (t - t0) / (t1 - t0);
        k = k * k * (3 - 2 * k);
        return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
      }
    }
    return s[s.length - 1][1];
  };
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mixLin = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ORANGE = hex("#FC734D");
const ORANGE_300 = hex("#FF9A7A");

/** 1 inside the copy box, falling to 0 over `feather` px outside it, the edge bent by noise. */
function calmMask(comp, n) {
  const [x0, y0, x1, y1] = comp.copy;
  return (X, Y) => {
    const bend = 0.35 * comp.feather * n(X / comp.scale * 1.3 + 40, Y / comp.scale * 1.3 - 12);
    const dx = Math.max(x0 - X, 0, X - x1), dy = Math.max(y0 - Y, 0, Y - y1);
    const d = Math.hypot(dx, dy) + bend;
    return 1 - smooth(-comp.feather * 0.15, comp.feather, d);
  };
}

// The copy column's calm part is not empty: the same field runs through it, held to the bottom of
// its ramp (CAP), so the type sits on deep navy and blue with the shapes still moving underneath.
const CAP = 0.3;

/** How much of the ramp a point may use: CAP under the copy, all of it in the open space. */
function roomOf(comp, calm) {
  const desk = comp === COMPS.desk;
  return (X, Y) => {
    const u = X / comp.cssW, v = Y / comp.cssH;
    const open = desk ? smooth(0.05, 0.6, 0.75 * u + 0.35 * v) : smooth(0.38, 0.72, v);
    const k = calm(X, Y);
    return CAP + (1 - CAP) * open * (1 - k);
  };
}

// ---------- the design ----------
// Domain-warped fBm, stretched along the flow, read as soft liquid blue streaks over navy. The
// current is one wavy line across the flow's cross-axis, bent by the same warp, so it runs with
// the swirls. Returns, for (X, Y) in section CSS px: the field's linear RGB, the current's
// coverage (0..1) and colour, and how much glow the spot may take (0 under the copy).
function currents(comp, seed) {
  const nq = fbmOf(gradientNoise(seed), 3, 0.45);
  const nr = fbmOf(gradientNoise(seed + 1), 3, 0.45);
  const nf = fbmOf(gradientNoise(seed + 2), 2, 0.35);
  const n2 = fbmOf(gradientNoise(seed + 3), 3);
  const calm = calmMask(comp, n2);
  const room = roomOf(comp, calm);
  const W = comp.cssW, H = comp.cssH;
  const desk = comp === COMPS.desk;
  const S = desk ? 1450 : 620;
  const SY = S * (desk ? 0.6 : 0.5);
  const blue = ramp(FIELD_RAMP);
  const ang = desk ? -0.38 : -1.05; // the flow: rising to the right on desktop, steeper on phones
  const ca = Math.cos(ang), sa = Math.sin(ang);
  // enlarge about the pivot: the pivot keeps its noise coordinates, everything else moves out
  const [PX, PY] = comp.pivot;
  const p0x = (PX * ca - PY * sa) / S, p0y = (PX * sa + PY * ca) / SY;
  /** The warp at noise coordinates (px, py): the flow field shared by the swirls and the current. */
  const warp = (px, py) => {
    const qx = nq(px, py), qy = nq(px + 5.2, py + 1.3);
    const rx = nr(px + WARP[0] * qx + 1.7, py + WARP[0] * qy + 9.2), ry = nr(px + WARP[0] * qx + 8.3, py + WARP[0] * qy + 2.8);
    return { qx, qy, rx, ry };
  };
  return (X, Y) => {
    // the swirls, enlarged about the pivot (it keeps its noise coordinates, the rest moves out)
    const dX = X - PX, dY = Y - PY;
    const gx = p0x + (dX * ca - dY * sa) / (S * GROW), gy = p0y + (dX * sa + dY * ca) / (SY * GROW);
    const g = warp(gx, gy);
    const f = 0.5 + 0.5 * nf(gx + WARP[1] * g.rx, gy + WARP[1] * g.ry);
    const lit = smooth(EDGE[0], EDGE[1], f) * (0.7 + 0.3 * smooth(0.0, 0.5, Math.hypot(g.qx, g.qy)));
    const rm = room(X, Y);
    const field = blue(clamp01(lit * GAIN) * rm);
    // the current, where it was in the first cut: one wavy line across the flow's cross-axis,
    // bent by the warp; a bright core and a faint skirt either side
    const px = (X * ca - Y * sa) / S, py = (X * sa + Y * ca) / SY;
    const w = GROW === 1 ? g : warp(px, py);
    const across = py * (desk ? 0.6 : 0.5) - (desk ? 0.44 : 0.95) + 0.22 * (w.rx + 0.6 * w.qy);
    const wb = desk ? 0.008 : 0.011;
    const core = Math.exp(-((across / wb) ** 2));
    const band = core + 0.18 * Math.exp(-((across / (wb * 4.5)) ** 2));
    const u = X / W, v = Y / H;
    const reach = desk ? smooth(0.44, 0.62, u) * (1 - smooth(0.9, 1.0, v)) : smooth(0.5, 0.6, v) * (1 - smooth(0.96, 1.03, v));
    const cover = Math.min(1, band) * reach * smooth(CAP + 0.25, 1, rm) * 0.92;
    // The first cut mixed the current into the field in linear light; the page lays it over the
    // field with plain alpha, which reads darker at the same coverage. A gamma on the coverage
    // brings the skirt back to about where it was.
    const current = cover ** CURRENT_GAMMA;
    const tint = mixLin(ORANGE, ORANGE_300, 0.4 * core);
    return { field, cover, current, tint, glowRoom: smooth(CAP, CAP + 0.45 * (1 - CAP), rm) };
  };
}

// ---------- render ----------
/** Section CSS px of field-image pixel (i, j) in a w x h grid over the drift layer. */
const at = (comp, w, h, i, j) => [
  ((i + 0.5) / w * (1 + 2 * OVER_X) - OVER_X) * comp.cssW,
  ((j + 0.5) / h * (1 + 2 * OVER_Y) - OVER_Y) * comp.cssH,
];

/** Separable Gaussian blur of a w x h float buffer, sigma in pixels, edges clamped. */
function blur(src, w, h, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-(((i - r) / sigma) ** 2) / 2));
  const ks = k.reduce((a, b) => a + b, 0);
  const tmp = new Float64Array(w * h), out = new Float64Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let s = 0;
    for (let t = -r; t <= r; t++) s += k[t + r] * src[j * w + Math.min(w - 1, Math.max(0, i + t))];
    tmp[j * w + i] = s / ks;
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let s = 0;
    for (let t = -r; t <= r; t++) s += k[t + r] * tmp[Math.min(h - 1, Math.max(0, j + t)) * w + i];
    out[j * w + i] = s / ks;
  }
  return out;
}

/** The box of pixels with any alpha, padded, or the whole image if empty. */
function alphaBox(rgba, w, h, pad) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (rgba[(j * w + i) * 4 + 3] > 0) {
      if (i < x0) x0 = i; if (i > x1) x1 = i;
      if (j < y0) y0 = j; if (j > y1) y1 = j;
    }
  }
  if (x1 < 0) return { left: 0, top: 0, width: w, height: h };
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** CSS inset (top right bottom left) of a crop, as percentages of the whole w x h image. */
const insetOf = (b, w, h) => [
  b.top / h, (w - b.left - b.width) / w, (h - b.top - b.height) / h, b.left / w,
].map((f) => `${(f * 100).toFixed(3)}%`).join(" ");

async function write(name, raw, w, h, channels, crop) {
  let img = sharp(raw, { raw: { width: w, height: h, channels } });
  if (crop) img = sharp(await img.extract(crop).raw().toBuffer(), { raw: { width: crop.width, height: crop.height, channels } });
  const webp = await img.clone().webp({ quality: Number(args.quality), alphaQuality: 90, smartSubsample: true, effort: 6 }).toBuffer();
  const out = resolve(args.out, `${name}.webp`);
  mkdirSync(resolve(args.out), { recursive: true });
  writeFileSync(out, webp);
  if (args.png) {
    mkdirSync(resolve(args.png), { recursive: true });
    await img.clone().png().toFile(resolve(args.png, `${name}.png`));
  }
  const size = crop ? `${crop.width}x${crop.height} of ${w}x${h}` : `${w}x${h}`;
  console.log(`${out}: ${size}, ${webp.length} bytes`);
}

const BLOOM_PX = 1 / 3; // bloom image pixels per CSS px: it is all soft
const BLOOM_SIGMA = [16, 54]; // CSS px: a close glow round the line and a wide haze
const BLOOM_MIX = [1.5, 1.6]; // their weights before the clamp
const BLOOM_MAX = 0.62; // the bloom image's strongest alpha

async function render(compName) {
  const comp = COMPS[compName];
  const seed = SEED + (compName === "phone" ? 101 : 0);
  const sample = currents(comp, seed);
  const { w, h } = comp;
  const dither = rng(seed ^ 0x9e3779b9);
  // triangular dither of under one level: breaks banding, too faint to read as grain
  const level = (x) => Math.max(0, Math.min(255, Math.round(x * 255 + (dither() - dither()) * 0.75)));

  // the field and the current, on the field's grid
  const field = Buffer.alloc(w * h * 3);
  const current = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const [X, Y] = at(comp, w, h, i, j);
      const s = sample(X, Y);
      for (let k = 0; k < 3; k++) {
        field[(j * w + i) * 3 + k] = level(toSrgb(clamp01(s.field[k])));
        current[(j * w + i) * 4 + k] = Math.round(toSrgb(s.tint[k]) * 255);
      }
      current[(j * w + i) * 4 + 3] = Math.round(clamp01(s.current) * 255); // a narrow line: no dither needed
    }
  }

  // the bloom, on its own coarse grid over the same drift layer: the current's coverage (with no
  // skirt cut-off), blurred twice, kept out of the copy
  const bw = Math.round(comp.cssW * (1 + 2 * OVER_X) * BLOOM_PX), bh = Math.round(comp.cssH * (1 + 2 * OVER_Y) * BLOOM_PX);
  const cov = new Float64Array(bw * bh), room = new Float64Array(bw * bh);
  const SS = 3; // supersample the thin line so it does not alias on the coarse grid
  for (let j = 0; j < bh; j++) {
    for (let i = 0; i < bw; i++) {
      let c = 0;
      for (let a = 0; a < SS; a++) for (let b = 0; b < SS; b++) {
        const [X, Y] = at(comp, bw * SS, bh * SS, i * SS + a, j * SS + b);
        c += sample(X, Y).cover;
      }
      cov[j * bw + i] = c / (SS * SS);
      const [X, Y] = at(comp, bw, bh, i, j);
      room[j * bw + i] = sample(X, Y).glowRoom;
    }
  }
  const near = blur(cov, bw, bh, BLOOM_SIGMA[0] * BLOOM_PX), far = blur(cov, bw, bh, BLOOM_SIGMA[1] * BLOOM_PX);
  const bloom = Buffer.alloc(bw * bh * 4);
  const tint = ORANGE.map((c) => Math.round(toSrgb(c) * 255));
  for (let p = 0; p < bw * bh; p++) {
    const a = BLOOM_MAX * Math.min(1, BLOOM_MIX[0] * near[p] + BLOOM_MIX[1] * far[p]) * room[p];
    bloom.set(tint, p * 4);
    bloom[p * 4 + 3] = a > 0.004 ? level(a) : 0;
  }

  const cBox = alphaBox(current, w, h, 2), bBox = alphaBox(bloom, bw, bh, 1);
  await write(`product-field-${compName}`, field, w, h, 3);
  await write(`product-current-${compName}`, current, w, h, 4, cBox);
  await write(`product-bloom-${compName}`, bloom, bw, bh, 4, bBox);
  return { current: insetOf(cBox, w, h), bloom: insetOf(bBox, bw, bh) };
}

const boxes = {};
for (const compName of Object.keys(COMPS)) boxes[compName] = await render(compName);
writeFileSync(args.data, `${JSON.stringify({
  note: "Generated by scripts/build-product-gradient.mjs. Where the cropped current and bloom images sit on the product section's drift layer, as CSS inset. Do not edit by hand.",
  ...boxes,
}, null, 2)}\n`);
console.log(`${args.data}: ${JSON.stringify(boxes)}`);
