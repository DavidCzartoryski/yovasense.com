#!/usr/bin/env python3
"""Capture the homepage's product shots from the simulated fleet demo.

    PW_PYTHON=/path/to/python-with-playwright npm run shots
    # or: /path/to/python-with-playwright scripts/capture-demo-shots.py [--no-build]

Builds the site (npm run build; --no-build reuses an existing out/), serves out/ on
127.0.0.1 (first free port in 4310-4399), drives /Demo/ in headless Chromium with
reduced motion (the demo's clock starts paused) and writes WebP images at 2x:

    public/demo-shots/overview.webp  story 3/12, the cluster at 05:00, 1280x800 viewport
    public/demo-shots/finding.webp   story 3/12, the incident's Diagnosis panel, to "... never the cause."
    public/demo-shots/evidence.webp  story 3/12, the incident's GPU readings
    public/demo-shots/approval.webp  story 9/12, the cooling ticket waiting for a person's approval

and src/data/demo-shots.json with each image's CSS size, which the homepage reads. The
crops are found by the demo's own headings and labels, not by its class names, so a
restyle of /Demo/ only needs this script re-run (then npm run build to publish).

Needs Python 3 with the playwright package and its Chromium (pip install playwright;
playwright install chromium). The browser and server are closed on exit.
"""
import argparse
import base64
import functools
import json
import pathlib
import socket
import subprocess
import sys
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
IMG_DIR = ROOT / "public" / "demo-shots"
DATA = ROOT / "src" / "data" / "demo-shots.json"
QUALITY = 82
DPR = 2  # image pixels per CSS pixel


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(directory):
    for port in range(4310, 4400):
        with socket.socket() as s:
            s.settimeout(0.2)
            if s.connect_ex(("127.0.0.1", port)) == 0:
                continue
        try:
            srv = ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Quiet, directory=str(directory)))
        except OSError:
            continue
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        return srv, port
    raise SystemExit("no free port in 4310-4399")


def settle(page, ms=500):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(ms)


def to_story(page, base, n):
    """Open /Demo/ and step the guide to story n (it opens on story 1)."""
    page.goto(base + "/Demo/", wait_until="networkidle")
    page.wait_for_selector("#guide-next", state="attached", timeout=10000)
    settle(page, 400)
    for _ in range(n - 1):
        page.evaluate("document.getElementById('guide-next').click()")
        page.wait_for_timeout(350)
    label = page.evaluate("(document.getElementById('rail') || document.body).innerText.split('\\n').slice(0, 2).join(' ')")
    if f"{n}/12" not in label:
        raise SystemExit(f"expected story {n}/12, the guide says: {label!r}")
    settle(page, 300)


def box_of(page, js_find):
    """Page-coordinate box of the element js_find returns (a JS expression)."""
    r = page.evaluate(
        """(src) => { const el = (new Function('return ' + src))(); if (!el) return null;
           el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
           return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; }""",
        js_find,
    )
    if not r:
        raise SystemExit(f"not found in the demo: {js_find}")
    return r


def heading_panel(title):
    return (
        "(() => { const h = Array.from(document.querySelectorAll('#main h2, #main h3'))"
        f".find((e) => e.textContent.trim() === {json.dumps(title)}); return h ? h.parentElement : null; }})()"
    )


def shot(page, clip, name, scale=1.0):
    # A clipped Page.captureScreenshot draws one image pixel per CSS pixel times the clip's
    # scale, not the context's device_scale_factor (which a detached CDP session can even
    # reset), so the 2x is in the clip's scale.
    scale *= DPR
    cdp = page.context.new_cdp_session(page)
    try:
        res = cdp.send("Page.captureScreenshot", {
            "format": "webp", "quality": QUALITY, "captureBeyondViewport": True,
            "clip": {"x": clip["x"], "y": clip["y"], "width": clip["width"], "height": clip["height"], "scale": scale},
        })
    finally:
        cdp.detach()
    data = base64.b64decode(res["data"])
    (IMG_DIR / f"{name}.webp").write_bytes(data)
    w, h = round(clip["width"]), round(clip["height"])
    print(f"  {name}.webp  {w}x{h} css px, {len(data) // 1024} KB")
    return {"src": f"/demo-shots/{name}.webp", "width": w, "height": h}


def pad(b, px, page_w=None):
    x = max(0, b["x"] - px)
    w = b["width"] + 2 * px
    if page_w:
        w = min(w, page_w - x)
    return {"x": x, "y": max(0, b["y"] - px), "width": w, "height": b["height"] + 2 * px}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--no-build", action="store_true", help="reuse the existing out/ instead of running npm run build")
    args = ap.parse_args()
    if not args.no_build:
        print("npm run build ...", flush=True)
        subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
    if not (OUT / "Demo" / "index.html").is_file():
        raise SystemExit("out/Demo/index.html is missing: run without --no-build")
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    srv, port = serve(OUT)
    base = f"http://127.0.0.1:{port}"
    shots = {}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            try:
                # The overview: the whole console at story 3, downscaled to 1600 px wide.
                ctx = browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=DPR, reduced_motion="reduce")
                page = ctx.new_page()
                to_story(page, base, 3)
                page.evaluate("scrollTo(0, 0)")
                shots["overview"] = {**shot(page, {"x": 0, "y": 0, "width": 1280, "height": 800}, "overview", scale=0.625),
                                     "story": "3/12", "title": "YovaSense diagnoses it"}
                ctx.close()

                # Detail crops at a 400 px viewport, readable at their display size on a phone.
                ctx = browser.new_context(viewport={"width": 400, "height": 900}, device_scale_factor=DPR, reduced_motion="reduce")
                page = ctx.new_page()
                to_story(page, base, 3)
                incident = page.evaluate("(() => { const a = document.querySelector('#rail a[href^=\"#/incident/\"], a[href^=\"#/incident/\"]'); return a ? a.getAttribute('href') : null; })()")
                if not incident:
                    raise SystemExit("story 3 has no link to its incident")
                page.goto(base + "/Demo/" + incident, wait_until="networkidle")
                settle(page)
                b = box_of(page, heading_panel("Diagnosis"))
                # The homepage crop ends after the third paragraph ("... never the cause."). The demo's
                # next line, about its scripted test model, stays in /Demo/; on the homepage it would sit
                # next to the Diagnose stage's description and read as the site contradicting itself.
                cut = page.evaluate(f"""(() => {{
                    const panel = {heading_panel("Diagnosis")};
                    const p = Array.from(panel.querySelectorAll('p, div')).find((e) => e.children.length === 0
                      && /never the cause\\.?$/.test(e.textContent.trim()));
                    if (!p) return null;
                    // stop just above the next line (the crop adds 6 px below the cut), else leave the panel's padding
                    const next = p.nextElementSibling, bottom = p.getBoundingClientRect().bottom;
                    const pb = parseFloat(getComputedStyle(panel).paddingBottom) || 16;
                    const end = next ? Math.min(bottom + pb, next.getBoundingClientRect().top - 8) : bottom + pb;
                    return end + scrollY; }})()""")
                if not cut:
                    raise SystemExit("the Diagnosis panel has no paragraph ending 'never the cause.'")
                shots["finding"] = {**shot(page, pad({**b, "height": min(b["height"], cut - b["y"])}, 6, 400), "finding"),
                                    "story": "3/12", "title": "The finding"}
                page.goto(base + "/Demo/" + incident.rstrip("/") + "/evidence", wait_until="networkidle")
                settle(page)
                b = box_of(page, heading_panel("GPU readings"))
                shots["evidence"] = {**shot(page, pad(b, 6, 400), "evidence"), "story": "3/12", "title": "The evidence"}

                # Story 9 ("Back to normal pace") is where the thermal incident's cooling ticket opens.
                to_story(page, base, 9)
                page.goto(base + "/Demo/#/tickets", wait_until="networkidle")
                settle(page)
                # the ticket whose title asks a person to approve a fix; its card is the list item around it
                card = box_of(page, """(() => {
                    const h = Array.from(document.querySelectorAll('#main h2, #main h3, #main h4'))
                      .find((e) => /^A person needs to approve/.test(e.textContent.trim()));
                    return h ? h.closest('li') : null; })()""")
                stop = page.evaluate("""(top) => {
                    const lab = Array.from(document.querySelectorAll('#main *')).find((e) => e.children.length === 0 && e.textContent.trim() === 'Who'
                      && e.getBoundingClientRect().top + scrollY > top);
                    return lab ? lab.getBoundingClientRect().top + scrollY : null; }""", card["y"])
                h = (stop - card["y"] - 6) if stop else card["height"]
                shots["approval"] = {**shot(page, pad({**card, "height": min(h, 560)}, 6, 400), "approval"),
                                     "story": "9/12", "title": "Waiting for approval"}
                ctx.close()
            finally:
                browser.close()
    finally:
        srv.shutdown()
        srv.server_close()
    DATA.write_text(json.dumps({
        "note": "Generated by scripts/capture-demo-shots.py from the simulated /Demo/. Do not edit by hand.",
        "captured": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
        "shots": shots,
    }, indent=2) + "\n")
    print(f"wrote {DATA.relative_to(ROOT)}; run npm run build to publish the new images")


if __name__ == "__main__":
    sys.exit(main())
