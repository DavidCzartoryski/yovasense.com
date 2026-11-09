import { mailto } from "@/data/yovasense";
import { PILOT_SUBJECT } from "./Header";
import HeroPath from "./HeroPath";

/** A still of the hero path, shown before the canvas draws and without JS. */
function HeroStill() {
  const lanes = Array.from({ length: 8 }, (_, i) => 198 + i * 66);
  return (
    <svg className="ys-hero-still" viewBox="0 0 1440 828" preserveAspectRatio="xMinYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="ys-still-haze" cx="480" cy="414" r="520" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#043D63" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="#021624" stopOpacity="0.4" />
          <stop offset="1" stopColor="#02070A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ys-still-lane" x1="0" x2="480" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8FD3F7" stopOpacity="0.04" />
          <stop offset="0.6" stopColor="#8FD3F7" stopOpacity="0.22" />
          <stop offset="1" stopColor="#CFEBFA" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="ys-still-bloom">
          <stop offset="0" stopColor="#EBF8FF" />
          <stop offset="0.2" stopColor="#8FD3F7" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#0297DE" stopOpacity="0.25" />
          <stop offset="1" stopColor="#0297DE" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="828" fill="url(#ys-still-haze)" />
      {lanes.map((y, i) => (
        <path key={y} d={`M-30 ${y} C192 ${y} 346 ${414 + (y - 414) * 0.16} 480 414`} fill="none" stroke={i === 2 ? "#FC734D" : "url(#ys-still-lane)"} strokeOpacity={i === 2 ? 0.55 : 1} strokeWidth="1.2" />
      ))}
      <path d="M480 414 H550 a34 34 0 0 1 34 34 V724 a34 34 0 0 1 -34 34 H159 a34 34 0 0 0 -34 34 V840" fill="none" stroke="#0297DE" strokeOpacity="0.25" strokeWidth="9" />
      <path d="M480 414 H550 a34 34 0 0 1 34 34 V724 a34 34 0 0 1 -34 34 H159 a34 34 0 0 0 -34 34 V840" fill="none" stroke="#EBF8FF" strokeWidth="1.6" />
      <circle cx="480" cy="414" r="75" fill="url(#ys-still-bloom)" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="ys-hero" aria-labelledby="hero-title">
      <HeroPath />
      <HeroStill />
      <div className="ys-wrap ys-hero-grid">
        <span className="ys-spine-anchor" data-spine-anchor aria-hidden="true" />
        <div className="ys-hero-copy">
          <div className="ys-hero-copy-inner ys-scrim" data-hero-copy>
            <p className="ys-eyebrow ys-hero-eyebrow">Autonomous GPU fleet operations · in development</p>
            <h1 id="hero-title" className="ys-display ys-hero-title">
              One slow GPU holds the whole job back. <span className="ys-hero-title-2"><span className="ys-nowrap">Find it.</span> <span className="ys-nowrap">Fix it.</span> <span className="ys-nowrap">Verify it.</span></span>
            </h1>
            <p className="ys-hero-lede">
              That is the loop YovaSense is building: watch GPU jobs while they run, find the GPU, link or host that slowed them, apply a supported fix inside your policy, verify that throughput recovered, and escalate anything that needs an engineer.
            </p>
            <ul className="ys-maturity" aria-label="What exists today">
              <li><span className="ys-chip" data-kind="prototype">Prototype</span> Detection, tested on one node</li>
              <li><span className="ys-chip" data-kind="direction">Direction</span> The full workflow</li>
              <li><span className="ys-chip" data-kind="simulated">Simulated</span> The fleet demo</li>
            </ul>
            <div className="ys-cta-row">
              <a className="ys-btn ys-btn-primary" href="/Demo/">
                Open the simulated demo <span aria-hidden="true">→</span>
              </a>
              <a className="ys-btn ys-btn-pilot" href={mailto(PILOT_SUBJECT)}>
                Talk to the founders <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="ys-hero-meta">NVIDIA and AMD · Owned or rented clusters</p>
          </div>
        </div>
      </div>
      <div className="ys-hero-key">
        <p className="ys-eyebrow">Illustration, not live data</p>
        <ul>
          <li><span className="ys-key-mark" data-mark="lane" aria-hidden="true" />Eight ranks of one training job</li>
          <li><span className="ys-key-mark" data-mark="late" aria-hidden="true" />Rank 2 arrives late</li>
          <li><span className="ys-key-mark" data-mark="gate" aria-hidden="true" />All-reduce: every step waits for the last rank</li>
        </ul>
      </div>
    </section>
  );
}
