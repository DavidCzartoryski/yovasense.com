// Makes the YovaSense logo files in public/brand/, and public/favicon.ico, from David's square YS
// artwork. The artwork is used as is: resized and compressed, nothing redrawn,
// recoloured or cropped. The source file never enters the repo; pass its path.
//
//   npm run brand -- --source ~/Downloads/ys-logo-1024.png
//
// What it writes, and where each file is used:
//   ys-logo-{26,52,78}.webp   site header and the /Demo brand link (26 px at 1x/2x/3x)
//   ys-logo-{24,48,72}.webp   the /Architecture brand link (24 px at 1x/2x/3x)
//   favicon-{32,48}.png       the browser-tab icon (Next metadata in src/app/layout.tsx,
//                             and <link rel="icon"> in public/Demo/ and public/Architecture/)
//   apple-touch-icon.png      180 px home-screen icon, square: iOS rounds it itself.
//                             scripts/build-yovasense-og.mjs also draws the share
//                             card's logo from it.
//   ../favicon.ico            16, 32 and 48 px in one file, for anything that asks
//                             for /favicon.ico without reading the page's icon links.
// Every file but the apple-touch icon gets corners rounded at 6/32 of its size,
// like the old favicon tile, as transparent pixels.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";

const PUBLIC = new URL("../public/", import.meta.url).pathname;
const OUT = PUBLIC + "brand/";
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

// favicon.ico: an ICO directory around PNG images (every current browser reads
// PNG entries), 16 px made the same way as the two PNG favicons it reuses.
const icoImages = [
  [16, await rounded(16).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()],
  [32, files["favicon-32.png"]],
  [48, files["favicon-48.png"]],
];
const icoHeader = Buffer.alloc(6 + 16 * icoImages.length);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = icon
icoHeader.writeUInt16LE(icoImages.length, 4);
let icoOffset = icoHeader.length;
icoImages.forEach(([px, png], i) => {
  const entry = 6 + 16 * i;
  icoHeader.writeUInt8(px, entry); // width (all sizes here are under 256)
  icoHeader.writeUInt8(px, entry + 1); // height
  icoHeader.writeUInt8(0, entry + 2); // no palette
  icoHeader.writeUInt8(0, entry + 3); // reserved
  icoHeader.writeUInt16LE(1, entry + 4); // colour planes
  icoHeader.writeUInt16LE(32, entry + 6); // bits per pixel
  icoHeader.writeUInt32LE(png.length, entry + 8);
  icoHeader.writeUInt32LE(icoOffset, entry + 12);
  icoOffset += png.length;
});
const ico = Buffer.concat([icoHeader, ...icoImages.map(([, png]) => png)]);

mkdirSync(OUT, { recursive: true });
for (const [name, buf] of Object.entries(files)) {
  writeFileSync(OUT + name, buf);
  console.log(`public/brand/${name}: ${buf.length} bytes`);
}
writeFileSync(PUBLIC + "favicon.ico", ico);
console.log(`public/favicon.ico: ${ico.length} bytes`);
