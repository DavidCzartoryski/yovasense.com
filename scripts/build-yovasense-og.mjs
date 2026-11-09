// Draws the YovaSense share card in the site's identity: navy, the hero's
// eight rank trails meeting at the all-reduce and becoming one luminous line,
// a folded blue corner with an orange-lit crease, the crescent mark and the
// homepage headline. Writes
// src/app/opengraph-image.png and twitter-image.png (1200x630) and
// their .alt.txt files.
//
// The type is the page's own: Archivo (wdth 112 / wght 600 for the headline,
// wdth 125 for the wordmark) and Martian Mono (wdth 87.5). Pass the variable
// TTFs with --archivo <ttf> --mono <ttf>; without them the script downloads
// both from github.com/google/fonts into a fresh temp directory and deletes it
// afterwards. Font files never enter the repo.
//
//   npm run og
//   npm run og -- --archivo ~/fonts/Archivo.ttf --mono ~/fonts/MartianMono.ttf
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}src/app`;
const W = 1200, H = 630;
const ALT =
  "YovaSense: one slow GPU holds the whole job back. Find it, fix it, verify it: the loop YovaSense is building for GPU fleets. Eight rank trails meet at an all-reduce and become one line. In development; the demo is simulated.";

const FONT_URLS = {
  archivo: "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf",
  mono: "https://raw.githubusercontent.com/google/fonts/main/ofl/martianmono/MartianMono%5Bwdth,wght%5D.ttf",
};

const { values: args } = parseArgs({ options: { archivo: { type: "string" }, mono: { type: "string" } } });

// ── Fonts ────────────────────────────────────────────────────────────────────
// librsvg can't set variable axes from SVG, so a private fontconfig maps alias
// families onto exact axis values. It has to exist before sharp loads.
const work = mkdtempSync(join(tmpdir(), "yovasense-og-"));
try {
  for (const key of ["archivo", "mono"]) {
    const dest = join(work, `${key}.ttf`);
    if (args[key]) {
      copyFileSync(resolve(args[key]), dest);
    } else {
      const res = await fetch(FONT_URLS[key]);
      if (!res.ok) throw new Error(`${FONT_URLS[key]}: HTTP ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
  }
  const alias = (name, family, variations) => `
  <match target="pattern">
    <test name="family"><string>${name}</string></test>
    <edit name="family" mode="assign" binding="strong"><string>${family}</string></edit>
    <edit name="fontvariations" mode="assign"><string>${variations}</string></edit>
  </match>`;
  writeFileSync(
    join(work, "fonts.conf"),
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${work}</dir>
  <cachedir>${join(work, "cache")}</cachedir>${alias("AR Display", "Archivo", "wdth=112,wght=600")}${alias("AR Wide", "Archivo", "wdth=125,wght=600")}${alias("AR Mono", "Martian Mono", "wdth=87.5,wght=400")}${alias("AR Mono Bold", "Martian Mono", "wdth=87.5,wght=600")}
</fontconfig>`,
  );
  process.env.FONTCONFIG_FILE = join(work, "fonts.conf");
  // macOS builds of pango default to CoreText, which never sees these files.
  process.env.PANGOCAIRO_BACKEND = "fc";

  const { default: sharp } = await import("sharp");
  const png = await sharp(Buffer.from(card())).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${OUT}/opengraph-image.png`, png);
  writeFileSync(`${OUT}/twitter-image.png`, png);
  writeFileSync(`${OUT}/opengraph-image.alt.txt`, ALT);
  writeFileSync(`${OUT}/twitter-image.alt.txt`, ALT);
  console.log(`yovasense share card: ${(png.length / 1024).toFixed(0)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

// ── Card ─────────────────────────────────────────────────────────────────────
function card() {
  // eight lanes converge at the all-reduce (B); the late one (rank 2) carries the orange rim
  const B = { x: 958, y: 318 };
  const lanes = Array.from({ length: 8 }, (_, i) => {
    const y0 = 150 + i * 48;
    return `M700 ${y0} C${700 + (B.x - 700) * 0.4} ${y0} ${700 + (B.x - 700) * 0.72} ${B.y + (y0 - B.y) * 0.16} ${B.x} ${B.y}`;
  });
  const merged = `M${B.x} ${B.y} H1046 a34 34 0 0 1 34 34 V${H + 10}`;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="haze" cx="${B.x}" cy="${B.y}" r="520" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#043D63" stop-opacity="0.6"/>
      <stop offset="0.4" stop-color="#021624" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#02070A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lane" x1="700" x2="${B.x}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8FD3F7" stop-opacity="0.05"/>
      <stop offset="0.6" stop-color="#8FD3F7" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#CFEBFA" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="late" x1="700" x2="${B.x}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FC734D" stop-opacity="0"/>
      <stop offset="0.35" stop-color="#FC734D" stop-opacity="0.7"/>
      <stop offset="1" stop-color="#FF9A7A" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="bloom">
      <stop offset="0" stop-color="#EBF8FF"/>
      <stop offset="0.2" stop-color="#8FD3F7" stop-opacity="0.85"/>
      <stop offset="0.5" stop-color="#0297DE" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#0297DE" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lit" x1="1200" y1="0" x2="1010" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#CFEBFA"/>
      <stop offset="0.45" stop-color="#4DB8EE"/>
      <stop offset="1" stop-color="#0297DE"/>
    </linearGradient>
    <linearGradient id="edge" x1="900" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FC734D" stop-opacity="0"/>
      <stop offset="0.6" stop-color="#FC734D"/>
      <stop offset="1" stop-color="#FF9A7A"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
    <mask id="crescent"><rect width="32" height="32" fill="#fff"/><circle cx="21.5" cy="12.5" r="10.5" fill="#000"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#02070A"/>
  <rect width="${W}" height="${H}" fill="url(#haze)"/>
  <!-- the fold: a lit corner, a navy wedge under it, an orange-lit crease between -->
  <polygon points="930,0 1200,0 1200,150" fill="#021624"/>
  <polygon points="1010,0 1200,0 1200,206" fill="url(#lit)"/>
  <line x1="1010" y1="0" x2="1200" y2="206" stroke="url(#edge)" stroke-width="2.5"/>
  <line x1="1010" y1="0" x2="1200" y2="206" stroke="#FC734D" stroke-opacity="0.5" stroke-width="7" filter="url(#glow)"/>
  ${lanes.map((d, i) => `<path d="${d}" fill="none" stroke="${i === 2 ? "url(#late)" : "url(#lane)"}" stroke-width="${i === 2 ? 1.6 : 1.3}"/>`).join("")}
  <line x1="${B.x}" y1="${B.y - 120}" x2="${B.x}" y2="${B.y + 120}" stroke="#EAF2F5" stroke-opacity="0.22"/>
  <path d="${merged}" fill="none" stroke="#0297DE" stroke-opacity="0.35" stroke-width="14" filter="url(#glow)"/>
  <path d="${merged}" fill="none" stroke="#4DB8EE" stroke-opacity="0.7" stroke-width="4"/>
  <path d="${merged}" fill="none" stroke="#EBF8FF" stroke-width="1.6"/>
  <circle cx="${B.x}" cy="${B.y}" r="80" fill="url(#bloom)"/>
  <g transform="translate(64 52) scale(1.25)">
    <circle cx="16" cy="16" r="13.5" fill="#EAF2F5" mask="url(#crescent)"/>
    <circle cx="21" cy="13" r="3.2" fill="#FC734D"/>
  </g>
  <text x="118" y="81" font-family="AR Wide" font-size="22" letter-spacing="3.52" fill="#EAF2F5">YOVASENSE</text>
  <g font-family="AR Display" font-size="60" letter-spacing="-2.2" fill="#EAF2F5">
    <text x="60" y="226">One slow GPU holds</text>
    <text x="60" y="294">the whole job back.</text>
    <text x="60" y="380" fill="#4DB8EE">Find it. Fix it.</text>
    <text x="60" y="448" fill="#4DB8EE">Verify it.</text>
  </g>
  <text x="64" y="540" font-family="AR Mono" font-size="14" letter-spacing="1.6" fill="#A7B8C2">AUTONOMOUS GPU FLEET OPERATIONS · IN DEVELOPMENT</text>
  <text x="64" y="568" font-family="AR Mono" font-size="14" letter-spacing="1.6" fill="#FF9A7A">THE DEMO IS SIMULATED</text>
  <text x="${B.x - 40}" y="${B.y - 138}" font-family="AR Mono" font-size="12" letter-spacing="1.6" fill="#A7B8C2">ALL-REDUCE</text>
</svg>`;
}
