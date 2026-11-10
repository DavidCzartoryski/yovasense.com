# YovaSense

The YovaSense landing page (YovaSense was formerly Artemis), plus an explicitly simulated GPU fleet demo.

- Home: https://yovasense.com/, a single landing page.
- Kept but unlisted: https://yovasense.com/product/, https://yovasense.com/Demo/ (the fleet demo) and https://yovasense.com/Architecture/ (the architecture explorer). They still load at their URLs, so links already sent keep working, but nothing on the landing page or the 404 links to them, each carries `<meta name="robots" content="noindex">`, and `sitemap.xml` lists only `/`.

This repository contains public website code and simulated data, not the private GPU fleet service or customer telemetry. The demo does not connect to hardware or perform real remediation.

## Build

Use Node.js 24 or newer, then `npm ci` and `npm run build`. Next.js statically exports the site to `out/`. The static demo and architecture explorer live in `public/` and are copied by the build. `npm run og` regenerates the YovaSense share cards. The YS logo files in `public/brand/` (header, favicons, apple-touch icon) and `public/favicon.ico` come from David's square artwork: `npm run brand -- --source <logo.png>` writes them; the artwork itself stays out of the repo. Run `npm run og` after it, since the share cards draw the logo from `public/brand/apple-touch-icon.png`.

GitHub Pages publishes the `gh-pages` branch. Publish the complete `out/` directory, including `_next`, `CNAME` and `.nojekyll`; retain the custom domain `yovasense.com`. The personal portfolio at davidczartoryski.com remains a separate site.

Demo data is always called a demo: /Demo keeps its simulated-fleet banner. Site copy describes the product as designed, in the present tense. It never invents customers, logos, savings, testimonials, funding or statistics; every number traces to the site, /product or the demo.
