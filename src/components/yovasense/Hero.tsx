import { Fragment } from "react";
import { mailto } from "@/data/yovasense";
import ArrowUpRight from "./ArrowUpRight";
import { GET_ACCESS_SUBJECT } from "./Header";
import HeroPath from "./HeroPath";
import { BLUE, FAULT, LANES, MODES, SIZE, WARM, laneD, spriteGradient, stillScene } from "./heroGeometry";

/** The hero picture's text alternative (the picture shows no legend). */
const HERO_PICTURE_LABEL =
  "Illustration: signals from six layers (GPU, host, network, scheduler, storage and workload) converge into one diagnosis. The orange signal is the fault.";

/**
 * The hero picture that does not move: the haze, the six signal-layer lanes
 * meeting at the diagnosis gate, the single line they become (turning down the
 * hero and landing on the page's spine), its light at B. Server-rendered and laid
 * out by CSS (the --hx-* properties on .ys-hero), so it is in place before any
 * script runs and stays in place after the canvas starts drawing over it.
 * The lane boxes are scaled to B and the lanes keep a 1px stroke at any size.
 *
 * It is the one layer present at every width, with JS on and off, so it carries
 * the picture's text alternative; the canvas, the still and the tags drawn over
 * it stay hidden from assistive tech.
 */
function HeroArt() {
  return (
    <div className="ys-hero-art" role="img" aria-label={HERO_PICTURE_LABEL}>
      <i className="ys-art-haze" />
      <i className="ys-art-ticks" />
      <i className="ys-art-gate" />
      {MODES.map((m) => (
        <svg key={m} className="ys-lanebox ys-art-lanes" data-mode={m} viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`ys-lane-glow-${m}`} gradientUnits="userSpaceOnUse" x1="0" x2="1000" y1="0" y2="0">
              <stop offset="0" stopColor="#0297DE" stopOpacity="0" />
              <stop offset="0.45" stopColor="#0297DE" stopOpacity="0.05" />
              <stop offset="1" stopColor="#4DB8EE" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id={`ys-lane-core-${m}`} gradientUnits="userSpaceOnUse" x1="0" x2="1000" y1="0" y2="0">
              <stop offset="0" stopColor="#8FD3F7" stopOpacity="0.04" />
              <stop offset="0.6" stopColor="#8FD3F7" stopOpacity="0.2" />
              <stop offset="1" stopColor="#CFEBFA" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          {Array.from({ length: LANES }, (_, i) => (
            <g key={i}>
              <path d={laneD(m, i)} stroke={`url(#ys-lane-glow-${m})`} strokeWidth="7" />
              <path d={laneD(m, i)} stroke={`url(#ys-lane-core-${m})`} strokeWidth="1" />
            </g>
          ))}
        </svg>
      ))}
      {[0, 1, 2, 3, 4].map((l) => (
        <i key={l} className="ys-art-line" data-l={l}>
          <b data-p="top" />
          <b data-p="drop" />
          <b data-p="base" />
          <b data-p="spine" />
        </i>
      ))}
      <i className="ys-art-sprite" style={{ backgroundImage: spriteGradient(BLUE) }} />
      <i className="ys-art-mark" data-hx="b" />
      <i className="ys-art-mark" data-hx="turn" />
    </div>
  );
}

/**
 * What the canvas draws first, drawn without it: the pose at STILL (the healthy
 * signals in at the gate, the fault lane orange-rimmed and its signal nearly
 * in, the bloom swelling). Shown before hydration and without JS; hidden once the
 * canvas (HeroPath) is live.
 */
function HeroStill() {
  return (
    <div className="ys-hero-still" aria-hidden="true">
      {MODES.map((m) => {
        const s = stillScene(m);
        const fault = laneD(m, FAULT);
        return (
          <Fragment key={m}>
            <svg className="ys-lanebox" data-mode={m} style={{ transform: `translateY(${SIZE[m].rimDy}px)` }} viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <path d={fault} stroke="#FC734D" strokeOpacity={+(0.09 * s.rim).toFixed(4)} strokeWidth="7" />
              <path d={fault} stroke="#FC734D" strokeOpacity={+(0.55 * s.rim).toFixed(4)} strokeWidth="1.2" />
            </svg>
            <svg className="ys-lanebox" data-mode={m} viewBox="0 0 1000 1000" preserveAspectRatio="none">
              <defs>
                {s.trails.map((t, i) => {
                  const a = t.pts[0], b = t.pts[t.pts.length - 1];
                  return (
                    <linearGradient key={i} id={`ys-still-${m}-${i}`} gradientUnits="userSpaceOnUse" x1={a[0].toFixed(2)} y1={a[1].toFixed(2)} x2={b[0].toFixed(2)} y2={b[1].toFixed(2)}>
                      <stop offset="0" stopColor={`rgb(${t.rgb})`} stopOpacity="0" />
                      <stop offset="1" stopColor={`rgb(${t.rgb})`} stopOpacity={+t.a.toFixed(4)} />
                    </linearGradient>
                  );
                })}
              </defs>
              {s.trails.map((t, i) => (
                <polyline key={i} points={t.pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ")} stroke={`url(#ys-still-${m}-${i})`} strokeWidth={t.w} />
              ))}
            </svg>
            {s.dots.map((d, i) => (
              <i
                key={i}
                className="ys-still-dot"
                data-mode={m}
                style={{
                  left: `calc(var(--hx-bx) * ${+d.x.toFixed(5)})`,
                  top: `calc(var(--hx-lanes-h) * ${+d.y.toFixed(5)})`,
                  width: +d.s.toFixed(2),
                  height: +d.s.toFixed(2),
                  opacity: +d.a.toFixed(4),
                  backgroundImage: spriteGradient(d.warm ? WARM : BLUE),
                }}
              />
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="ys-hero" aria-labelledby="hero-title">
      <HeroArt />
      <HeroPath />
      <HeroStill />
      <div className="ys-hero-tags" aria-hidden="true">
        <span className="ys-hero-tag" data-tag="gate">diagnosis</span>
        <span className="ys-hero-tag ys-hero-tag-fault" data-tag="fault">gpu · xid 79</span>
      </div>
      <div className="ys-wrap ys-hero-grid">
        <span className="ys-spine-anchor" data-spine-anchor aria-hidden="true" />
        <div className="ys-hero-copy">
          <div className="ys-hero-copy-inner ys-scrim" data-hero-copy>
            <h1 id="hero-title" className="ys-display ys-hero-title">Autonomous operations for GPU infrastructure.</h1>
            <p className="ys-hero-lede">Built for GPU cloud providers and HPC operators.</p>
            <p className="ys-hero-sub">
              <span>Find the root cause.</span>{" "}
              <span>Automate the fix.</span>{" "}
              <span>Escalate what remains.</span>
            </p>
            <div className="ys-cta-row">
              <a className="ys-btn ys-btn-primary" href={mailto(GET_ACCESS_SUBJECT)}>
                Get access <ArrowUpRight />
              </a>
              <a className="ys-link" href="#slack">
                See it in Slack <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="ys-hero-meta">Slurm and Kubernetes · Training and inference · Owned or rented clusters</p>
          </div>
        </div>
      </div>
    </section>
  );
}
