// Makes the grain tile for the homepage's blue product field:
// public/textures/grain.webp, a square of seeded white noise stored as
// gray + alpha. Each pixel is a white or a black speck at full or partial
// alpha, so the tile lightens and darkens whatever it lies on with plain
// alpha blending: no blend mode, so it composites as cheaply as any layer.
// The page sets how strong it reads with one opacity, --ys-grain in
// src/app/globals.css.
//
// The tile is drawn at half its pixel size (256 px at 128 CSS px), so one
// texel is one device pixel on a 2x screen; at 1x the browser shows every
// other texel (image-rendering: pixelated), still one device pixel.
//
// Noise does not compress, so the tile keeps few levels. The default, 2,
// makes every pixel a black or a white speck: the most even grain for its
// strength, with no outlier specks that read as dirt, in about 8 KB. More
// levels round a Gaussian sample (spread by --sigma) to that many steps
// between opaque black, clear and opaque white.
//
//   node scripts/build-grain-tile.mjs
//   node scripts/build-grain-tile.mjs --levels 5 --out /tmp/grain.webp
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname;
const { values: a } = parseArgs({
  options: {
    size: { type: "string", default: "256" },
    levels: { type: "string", default: "2" },
    sigma: { type: "string", default: "1" },
    seed: { type: "string", default: "20261109" },
    out: { type: "string", default: `${ROOT}public/textures/grain.webp` },
  },
});
const N = Number(a.size), LEVELS = Number(a.levels), SIGMA = Number(a.sigma);
if (!(N >= 16 && LEVELS >= 2 && SIGMA > 0)) throw new Error("bad --size, --levels or --sigma");

// xorshift32, so the same seed always makes the same tile
let s = Number(a.seed) >>> 0 || 1;
const rnd = () => {
  s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
  return (s + 0.5) / 4294967296;
};
const gauss = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());

// LEVELS steps from -1 (black, opaque) through 0 (clear) to +1 (white, opaque).
// With 2 levels every pixel is a black or a white speck.
const half = (LEVELS - 1) / 2;
const step = (g) => {
  if (LEVELS === 2) return g < 0 ? -1 : 1;
  const k = Math.max(-half, Math.min(half, Math.round(g * SIGMA * half / 2)));
  return k / half;
};

const px = Buffer.alloc(N * N * 2);
const hist = new Map();
for (let i = 0; i < N * N; i++) {
  const v = step(gauss());
  hist.set(v, (hist.get(v) ?? 0) + 1);
  px[i * 2] = v > 0 ? 255 : 0;
  px[i * 2 + 1] = Math.round(Math.abs(v) * 255);
}

const webp = await sharp(px, { raw: { width: N, height: N, channels: 2 } })
  .webp({ lossless: true, effort: 6 })
  .toBuffer();
const out = resolve(a.out);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, webp);

const share = [...hist].sort((x, y) => x[0] - y[0]).map(([v, n]) => `${v.toFixed(2)}:${((100 * n) / (N * N)).toFixed(1)}`);
console.log(`${out}: ${N}x${N}, ${LEVELS} levels, ${webp.length} bytes; level shares (value:percent) ${share.join(" ")}`);
