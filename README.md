# YovaSense

Marketing website and explicitly simulated GPU fleet demo for YovaSense, formerly Artemis.

- Home: https://yovasense.com/
- Fleet demo: https://yovasense.com/Demo/
- Product: https://yovasense.com/product/
- Architecture explorer: https://yovasense.com/Architecture/

This repository contains public website code and simulated data, not the private GPU fleet service or customer telemetry. The demo does not connect to hardware or perform real remediation.

## Build

Use Node.js 24 or newer, then `npm ci` and `npm run build`. Next.js statically exports the site to `out/`. The static demo and architecture explorer live in `public/` and are copied by the build. `npm run og` regenerates the YovaSense share cards.

GitHub Pages publishes the `gh-pages` branch. Publish the complete `out/` directory, including `_next`, `CNAME` and `.nojekyll`; retain the custom domain `yovasense.com`. The personal portfolio at davidczartoryski.com remains a separate site.

Branding changes do not turn prototype functionality or simulated results into production qualification. Preserve the simulation and development labels when updating the site.
