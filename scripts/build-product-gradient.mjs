// Makes the grainy-gradient backgrounds for the homepage's product section (#product):
// public/textures/product-<variant>-<desk|phone>.webp, one pair per variant.
//
//   a  "logo light"  closest to the logo: a dark navy pocket under the copy, light wrapping
//                    round it from blue to cyan, an orange glow rising from the bottom-right corner
//   b  "currents"    navy with marbled, liquid blue and cyan swirls and one thin orange current
//   c  "ember"       navy with flowing orange and coral ribbons, deep blue as the secondary colour
//
// Every pixel is computed here in plain JS (seeded gradient noise, domain-warped fBm, colour
// ramps mixed in linear light), so the same seed always gives the same image. The field is soft,
// so it is rendered at about two thirds of its CSS size and scaled up by the browser; the film
// grain is a separate tile (scripts/build-grain-tile.mjs) laid over it at device pixels, so it
// stays sharp. The images carry only a sub-level dither against banding, no grain.
//
// Two compositions per variant, laid out against the section's own layout: the copy column sits
// over the calm, dark part of the field and the colour fills the space around the screenshots.
//   desk   1440 x 2000 CSS px section (copy column on the left, console top right, crops below)
//   phone   390 x 1900 CSS px section (copy on top, crops below)
// The image covers the drift layer, which is the section plus 5% above and below and 3% either
// side (globals.css, .ys-fold-drift), so the section is mapped onto [-0.03, 1.03] x [-0.05, 1.05].
//
//   node scripts/build-product-gradient.mjs              all variants
//   node scripts/build-product-gradient.mjs --only b     one variant
//   node scripts/build-product-gradient.mjs --png /tmp/g  also write PNGs there, for inspection
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname;
const { values: args } = parseArgs({
  options: {
    only: { type: "string" },
    png: { type: "string" },
    out: { type: "string", default: `${ROOT}public/textures` },
    quality: { type: "string", default: "94" },
  },
});

// ---------- the drift layer's overscan, as fractions of the section ----------
const OVER_X = 0.03;
const OVER_Y = 0.05;

// ---------- compositions ----------
// w x h: image pixels. cssW x cssH: the section it is designed against.
// copy: the box the copy column (with its scroll drift) must stay dark under, CSS px.
// feather: how far past that box the light takes to arrive, CSS px.
const COMPS = {
  desk: { w: 960, h: 1334, cssW: 1440, cssH: 2000, copy: [0, 0, 610, 1320], feather: 330, scale: 760 },
  phone: { w: 300, h: 1460, cssW: 390, cssH: 1900, copy: [0, 0, 390, 1010], feather: 300, scale: 470 },
};

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
const NAVY = hex("#02070A");
const ORANGE = hex("#FC734D");

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

// ---------- the variants ----------
// Each returns a function of (X, Y) in section CSS px that gives linear RGB. The copy column's
// calm part is not empty: the same field runs through it, held to the bottom of its ramp (CAP),
// so the type sits on deep navy and blue with the shapes still moving underneath.
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

const mixLin = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const VARIANTS = {
  // a: the logo's light. Navy under the copy; the further from it, the brighter, through deep
  // blue, Custodius blue and cyan; an orange glow rising from the bottom-right corner.
  a: {
    seed: 20261109,
    make(comp, seed) {
      const n1 = fbmOf(gradientNoise(seed), 3);
      const n2 = fbmOf(gradientNoise(seed + 1), 3);
      const calm = calmMask(comp, n2);
      const room = roomOf(comp, calm);
      const W = comp.cssW, H = comp.cssH, S = comp.scale;
      const blue = ramp([
        [0.0, "#02070A"], [0.16, "#021624"], [0.32, "#043D63"], [0.52, "#0373B0"],
        [0.7, "#0297DE"], [0.86, "#18B6EC"], [1.0, "#8AE2FC"],
      ]);
      const desk = comp === COMPS.desk;
      return (X, Y) => {
        // gentle warp, a fraction of the feature size
        const wx = X + 0.28 * S * n1(X / S * 0.8, Y / S * 0.8);
        const wy = Y + 0.28 * S * n1(X / S * 0.8 + 5.2, Y / S * 0.8 + 1.3);
        const u = wx / W, v = wy / H;
        // brightness grows from the top-left toward the bottom-right, like the logo
        const t = desk ? 0.78 * u + 0.62 * v - 0.18 : 0.28 * u + 0.95 * v - 0.3;
        const r = room(X, Y);
        const c = blue(clamp01(t + 0.06 * n2(X / S * 2.2, Y / S * 2.2)) * r);
        // the orange glow, centred on the bottom-right corner and rising up the side
        // (a tight edge, so the band where orange and cyan mix to mauve stays narrow)
        const ox = (wx - W * 1.01) / (W * (desk ? 0.36 : 0.62));
        const oy = (wy - H * (desk ? 0.97 : 1.0)) / (H * (desk ? 0.3 : 0.16));
        const o = smooth(0.12, 0.8, Math.exp(-(ox * ox + oy * oy) * 1.3)) * smooth(CAP, 1, r);
        return mixLin(c, ORANGE, o);
      };
    },
  },

  // b: currents. Domain-warped fBm, stretched along the flow, read as soft liquid blue and cyan
  // streaks over navy; one thin orange current follows the same warp across the open space.
  b: {
    seed: 7146,
    make(comp, seed) {
      const nq = fbmOf(gradientNoise(seed), 3, 0.45);
      const nr = fbmOf(gradientNoise(seed + 1), 3, 0.45);
      const nf = fbmOf(gradientNoise(seed + 2), 2, 0.35);
      const n2 = fbmOf(gradientNoise(seed + 3), 3);
      const calm = calmMask(comp, n2);
      const room = roomOf(comp, calm);
      const W = comp.cssW, H = comp.cssH;
      const desk = comp === COMPS.desk;
      const S = desk ? 1450 : 620;
      const blue = ramp([
        [0.0, "#02070A"], [0.18, "#021624"], [0.34, "#03304F"], [0.54, "#0373B0"],
        [0.74, "#0297DE"], [0.9, "#2CC3F0"], [1.0, "#B4EDFF"],
      ]);
      const ang = desk ? -0.38 : -1.05; // the flow: rising to the right on desktop, steeper on phones
      const ca = Math.cos(ang), sa = Math.sin(ang);
      return (X, Y) => {
        const px = (X * ca - Y * sa) / S, py = (X * sa + Y * ca) / (S * (desk ? 0.6 : 0.5));
        const qx = nq(px, py), qy = nq(px + 5.2, py + 1.3);
        const rx = nr(px + 2.4 * qx + 1.7, py + 2.4 * qy + 9.2), ry = nr(px + 2.4 * qx + 8.3, py + 2.4 * qy + 2.8);
        const f = 0.5 + 0.5 * nf(px + 2.2 * rx, py + 2.2 * ry);
        const lit = smooth(0.34, 0.82, f) * (0.7 + 0.3 * smooth(0.0, 0.5, Math.hypot(qx, qy)));
        const rm = room(X, Y);
        const c = blue(clamp01(lit * 1.05) * rm);
        // the current: one wavy line across the flow's cross-axis, bent by the same warp
        const across = py * (desk ? 0.6 : 0.5) - (desk ? 0.44 : 0.95) + 0.22 * (rx + 0.6 * qy);
        const wb = desk ? 0.008 : 0.011;
        const band = Math.exp(-((across / wb) ** 2)) + 0.18 * Math.exp(-((across / (wb * 4.5)) ** 2));
        const u = X / W, v = Y / H;
        const reach = desk ? smooth(0.44, 0.62, u) * (1 - smooth(0.9, 1.0, v)) : smooth(0.5, 0.6, v) * (1 - smooth(0.96, 1.03, v));
        const o = Math.min(1, band) * reach * smooth(CAP + 0.25, 1, rm) * 0.92;
        return mixLin(c, ORANGE, o);
      };
    },
  },

  // c: ember. Broad soft ribbons, a wave across a warped coordinate, burning from deep plum
  // through the site's orange to coral, with darker swirls through them; deep blue fills the
  // hollows between the ribbons.
  c: {
    seed: 5381,
    make(comp, seed) {
      const nq = fbmOf(gradientNoise(seed), 3, 0.45);
      const na = fbmOf(gradientNoise(seed + 1), 3);
      const n2 = fbmOf(gradientNoise(seed + 2), 3);
      const nb = fbmOf(gradientNoise(seed + 3), 2, 0.4);
      const calm = calmMask(comp, n2);
      const room = roomOf(comp, calm);
      const desk = comp === COMPS.desk;
      const S = desk ? 1000 : 560;
      const ember = ramp([
        [0.0, "#02070A"], [0.18, "#170A14"], [0.36, "#43161F"], [0.56, "#962F22"],
        [0.74, "#E25A37"], [0.88, "#FC734D"], [1.0, "#FFB89C"],
      ]);
      const deep = ramp([[0.0, "#02070A"], [0.5, "#032038"], [1.0, "#064F7C"]]);
      const ang = desk ? 0.5 : 1.15;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      return (X, Y) => {
        const px = X / S, py = Y / S;
        // a slow warp bends the ribbons into long S-curves
        const wx = px + 0.7 * nq(px * 0.45, py * 0.45), wy = py + 0.7 * nq(px * 0.45 + 5.2, py * 0.45 + 1.3);
        const t = (wx * dx + wy * dy) * 0.9;
        const along = -wx * dy + wy * dx;
        const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * t);
        // each ribbon swells and thins along its length, and darker swirls run through it
        const swell = smooth(-0.55, 0.45, na(along * 0.55 + 2, t * 0.35 - 4));
        const swirl = smooth(0.1, 0.65, nb(wx * 2.0 + 7, wy * 2.0 - 3));
        const ribbon = wave ** 2.6 * (0.4 + 0.6 * swell) * (1 - 0.4 * swirl);
        const rm = room(X, Y);
        // the warm light is held lower than the blue under the copy, so the copy sits on navy
        const warm = rm <= CAP ? rm * 0.6 : CAP * 0.6 + (rm - CAP) * (1 - CAP * 0.6) / (1 - CAP);
        const e = ember(clamp01(ribbon * 1.12) * warm);
        const b = deep(clamp01((1 - wave) * (0.5 + 0.5 * na(px + 9, py + 3))) * rm);
        const m = smooth(0.04, 0.35, ribbon * (0.4 + 0.6 * warm));
        return mixLin(b, e, m);
      };
    },
  },
};

// ---------- render ----------
async function render(key, compName) {
  const comp = COMPS[compName];
  const v = VARIANTS[key];
  const field = v.make(comp, v.seed + (compName === "phone" ? 101 : 0));
  const { w, h } = comp;
  const rgb = Buffer.alloc(w * h * 3);
  const dither = rng(v.seed ^ 0x9e3779b9);
  for (let j = 0; j < h; j++) {
    const Y = ((j + 0.5) / h * (1 + 2 * OVER_Y) - OVER_Y) * comp.cssH;
    for (let i = 0; i < w; i++) {
      const X = ((i + 0.5) / w * (1 + 2 * OVER_X) - OVER_X) * comp.cssW;
      const c = field(X, Y);
      for (let k = 0; k < 3; k++) {
        // triangular dither of under one level: breaks banding, too faint to read as grain
        const d = (dither() - dither()) * 0.75;
        rgb[(j * w + i) * 3 + k] = Math.max(0, Math.min(255, Math.round(toSrgb(clamp01(c[k])) * 255 + d)));
      }
    }
  }
  const img = sharp(rgb, { raw: { width: w, height: h, channels: 3 } });
  const webp = await img.clone().webp({ quality: Number(args.quality), smartSubsample: true, effort: 6 }).toBuffer();
  const name = `product-${key}-${compName}`;
  const out = resolve(args.out, `${name}.webp`);
  mkdirSync(resolve(args.out), { recursive: true });
  writeFileSync(out, webp);
  if (args.png) {
    mkdirSync(resolve(args.png), { recursive: true });
    await img.clone().png().toFile(resolve(args.png, `${name}.png`));
  }
  console.log(`${out}: ${w}x${h}, seed ${v.seed + (compName === "phone" ? 101 : 0)}, ${webp.length} bytes`);
}

for (const key of args.only ? args.only.split(",") : Object.keys(VARIANTS)) {
  if (!VARIANTS[key]) throw new Error(`no variant ${key}`);
  for (const compName of Object.keys(COMPS)) await render(key, compName);
}
