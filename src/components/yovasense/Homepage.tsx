import Link from "next/link";
import { yovasense, mailto } from "@/data/yovasense";
import { PILOT_SUBJECT } from "./Header";
import ProductShowcase from "./ProductShowcase";
import Workflow, { Spine } from "./Workflow";

const route = [
  { kind: "on", k: "First capability · prototype", t: "Straggler detection" },
  { kind: "planned", k: "Planned", t: "Cross-stack diagnosis" },
  { kind: "planned", k: "Planned", t: "Scheduled regression testing" },
  { kind: "dev", k: "In development", t: "Learned diagnosis model" },
  { kind: "aim", k: "The aim", t: "Autonomous GPU fleet operations" },
];

const classes = [
  { title: "GPU degradation", body: "Thermal throttling, power caps, clocks that stop boosting." },
  { title: "Communication", body: "A degraded port, link or switch path." },
  { title: "Host and input", body: "CPU contention, a data-loader or storage stall." },
  { title: "Change regressions", body: "A driver, communication library or configuration change." },
];

const studies = [
  { figure: "16 of 27", label: "large training jobs (512–1,024 GPUs) hit a fail-slow slowdown in one month" },
  { figure: "~10%", label: "of allocated GPU-hours lost to stragglers, estimated from one production cluster's traces" },
  { figure: "30+ min", label: "on average, and up to days, for engineers to manually find one faulty machine" },
];

function Ambition() {
  return (
    <section id="ambition" className="ys-sec" aria-labelledby="ambition-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-two ys-scrim">
          <div>
            <span className="ys-node" data-reader-mark aria-hidden="true" />
            <p className="ys-eyebrow">Where it goes</p>
            <h2 id="ambition-title" className="ys-display ys-h2">Fleet operations, starting with stragglers.</h2>
          </div>
          <div className="ys-sec-body">
            <p>Distributed training moves in lockstep: a step finishes when the slowest rank arrives. One degraded GPU, link or host sets the pace for the entire job, while utilization still looks busy and nothing raises an error.</p>
            <p>Straggler detection is the first capability. The aim is autonomous fleet operations: more useful training from the GPUs you already have, with less manual investigation. Vendor-independent by design: across NVIDIA and AMD, across GPU generations.</p>
          </div>
        </div>
        <div className="ys-route-wrap ys-scrim">
          <ol className="ys-route" aria-label="Capabilities, from the first to the aim">
            {route.map((r) => (
              <li key={r.t} className="ys-rt" data-kind={r.kind}>
                <span className="ys-rt-node" aria-hidden="true" />
                <span className="ys-rt-k ys-mono">{r.k}</span>
                <span className="ys-rt-t">{r.t}</span>
              </li>
            ))}
          </ol>
          <p className="ys-fine">A learned diagnosis model needs permitted incident data and held-out evaluation.</p>
        </div>
        <div className="ys-classes-wrap ys-scrim">
          <h3 className="ys-sub-h">Slowdowns it is built for</h3>
          <ul className="ys-classes">
            {classes.map((c) => (
              <li key={c.title}>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <figure className="ys-studies ys-scrim">
          <dl className="ys-studies-grid">
            {studies.map((s) => (
              <div key={s.figure}>
                <dt>{s.label}</dt>
                <dd className="ys-display">{s.figure}</dd>
              </div>
            ))}
          </dl>
          <figcaption className="ys-fine">
            Figures from published production-cluster studies, not YovaSense measurements:{" "}
            <a href="https://arxiv.org/abs/2410.12588">FALCON (arXiv:2410.12588)</a>,{" "}
            <a href="https://arxiv.org/abs/2505.05713">Lin et al. (arXiv:2505.05713)</a>,{" "}
            <a href="https://www.usenix.org/conference/nsdi25/presentation/deng">Minder, ByteDance (NSDI &apos;25)</a>.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Status() {
  return (
    <section id="status" className="ys-sec" aria-labelledby="status-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">Status</p>
          <h2 id="status-title" className="ys-display ys-h2">What exists, what&apos;s simulated, what&apos;s next.</h2>
          <p className="ys-lede">The full autonomous workflow is our product direction, not a claim that every capability is production-ready.</p>
        </div>
        <div className="ys-status-grid ys-scrim">
          <div className="ys-st-col">
            <p><span className="ys-chip" data-kind="exists">Exists today</span></p>
            <h3>GPUBridge, open source (MIT)</h3>
            <p>NVIDIA and AMD GPUs in one PyTorch job. It has run on V100, T4, L40S, A100, H200 and MI50.</p>
            <h3>Detector prototypes</h3>
            <p>Tested on one node of four V100s: 8 of 8 injected slowdowns flagged on the right rank. Counts are cases, not accuracy rates.</p>
            <a className="ys-link" href={yovasense.github}>GPUBridge on GitHub <span aria-hidden="true">↗</span></a>
          </div>
          <div className="ys-st-col">
            <p><span className="ys-chip" data-kind="simulated">Simulated</span></p>
            <h3>The fleet demo</h3>
            <p>Simulated from a frozen snapshot of the fleet service. Every GPU&apos;s benchmark history and service record is synthesized. No real hardware, cordon, restart or recovery.</p>
            <a className="ys-link" href="/Demo/">Open the simulated demo <span aria-hidden="true">→</span></a>
          </div>
          <div className="ys-st-col">
            <p><span className="ys-chip" data-kind="prototype">Prototype · in development</span></p>
            <h3>Next to prove</h3>
            <ul className="ys-ticks">
              <li>Detection beyond one node, and on AMD with RCCL</li>
              <li>RDMA across machines</li>
              <li>Real production workloads</li>
            </ul>
            <a className="ys-link" href="/Architecture/">Read the architecture <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pilot() {
  return (
    <section id="pilot" className="ys-sec ys-sec-end" aria-labelledby="pilot-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <span className="ys-terminal" data-reader-mark aria-hidden="true" />
        <div className="ys-pilot ys-scrim">
          <p className="ys-eyebrow">Pilot</p>
          <h2 id="pilot-title" className="ys-display ys-h1">Running GPU clusters? Tell us what slows you down.</h2>
          <p className="ys-lede">We&apos;re talking with infrastructure teams about the slowdowns that cost them the most. Those conversations set the roadmap.</p>
          <div className="ys-cta-row">
            <a className="ys-btn ys-btn-pilot ys-btn-lg" href={mailto(PILOT_SUBJECT)}>
              Talk to the founders <span aria-hidden="true">↗</span>
            </a>
            <Link className="ys-link" href="/product/">
              Inside YovaSense: the architecture and research <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="ys-fine ys-pilot-addr">
            Or write to <a href={mailto(PILOT_SUBJECT)}>{yovasense.email}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Everything after the hero. */
export default function Homepage() {
  return (
    <>
      <Workflow />
      <ProductShowcase />
      <Ambition />
      <Status />
      <Pilot />
    </>
  );
}
