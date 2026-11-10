// Makes the YovaSense logo files in public/brand/ from David's square YS
// artwork. The artwork is used as is: resized and compressed, nothing redrawn,
// recoloured or cropped. The source file never enters the repo; pass its path.
//
//   npm run brand -- --source ~/Downloads/ys-logo-1024.png
//
// What it writes, and where each file is used:
//   ys-logo-{26,52,78}.webp   site header and the /Demo brand link (26 px at 1x/2x/3x)
//   ys-logo-{24,48,72}.webp   the /Architecture brand link (24 px at 1x/2x/3x)
//   favicon-{32,48}.png       the browser-tab icon (Next metadata in src/app/layout.tsx)
//   apple-touch-icon.png      180 px home-screen icon, square: iOS rounds it itself.
//                             scripts/build-yovasense-og.mjs also draws the share
//                             card's logo from it.
// Every file but the apple-touch icon gets corners rounded at 6/32 of its size,
// like the old favicon tile, as transparent pixels.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const OUT = new URL("../public/brand/", import.meta.url).pathname;
const { values: args } = parseArgs({ options: { source: { type: "string" } } });
if (!args.source) {
  console.error("usage: npm run brand -- --source <square logo png, 1024 px or larger>");
  process.exit(2);
}
const source = resolve(args.source);
const meta = await sharp(source).metadata();
if (meta.width !== meta.height || meta.width < 512) {
  throw new Error(`${source}: expected a square image of at least 512 px, got ${meta.width}x${meta.height}`);
}

const scaled = (px) => sharp(source).resize(px, px, { kernel: "lanczos3" });
// Transparent corners: keep only the pixels under a rounded square.
const rounded = (px) =>
  scaled(px)
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" rx="${(px * 6) / 32}"/></svg>`,
        ),
        blend: "dest-in",
      },
    ]);

const files = {};
for (const px of [24, 26, 48, 52, 72, 78]) {
  files[`ys-logo-${px}.webp`] = await rounded(px).webp({ quality: 92, alphaQuality: 100, smartSubsample: true, effort: 6 }).toBuffer();
}
for (const px of [32, 48]) {
  files[`favicon-${px}.png`] = await rounded(px).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}
files["apple-touch-icon.png"] = await scaled(180).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();

mkdirSync(OUT, { recursive: true });
for (const [name, buf] of Object.entries(files)) {
  writeFileSync(OUT + name, buf);
  console.log(`public/brand/${name}: ${buf.length} bytes`);
}
