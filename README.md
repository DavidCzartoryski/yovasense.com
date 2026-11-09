# YovaSense

Marketing website and explicitly simulated GPU fleet demo for YovaSense, formerly Artemis.

- Home: https://yovasense.com/
- Fleet demo: https://yovasense.com/Demo/
- Product: https://yovasense.com/product/
- Architecture explorer: https://yovasense.com/Architecture/

This repository contains public website code and simulated data, not the private GPU fleet service or customer telemetry. The demo does not connect to hardware or perform real remediation.

## Build

Use Node.js 24 or newer, then `npm ci` and `npm run build`. Next.js statically exports the site to `out/`. The static demo and architecture explorer live in `public/` and are copied by the build. `npm run og` regenerates the YovaSense share cards.

## Product shots

The homepage shows crops of the simulated demo (`public/demo-shots/*.webp`, sizes in `src/data/demo-shots.json`). After any change to `/Demo/`, regenerate them with one command:

```sh
PW_PYTHON=/path/to/python-with-playwright npm run shots
```

It builds the site, serves `out/` on 127.0.0.1, steps the demo's guide to the diagnosis (story 3/12) and the approval ticket (story 10/12) in headless Chromium, and writes WebP crops at 2x. `PW_PYTHON` is any Python 3 with the `playwright` package and its Chromium (`pip install playwright && playwright install chromium`); it defaults to `python3`. Pass `-- --no-build` to reuse an existing `out/`. Run `npm run build` afterwards to publish the new images.

GitHub Pages publishes the `gh-pages` branch. Publish the complete `out/` directory, including `_next`, `CNAME` and `.nojekyll`; retain the custom domain `yovasense.com`. The personal portfolio at davidczartoryski.com remains a separate site.

Branding changes do not turn prototype functionality or simulated results into production qualification. Preserve the simulation and development labels when updating the site.
