import Link from "next/link";
import { yovasense } from "@/data/yovasense";
import { Spine } from "./Workflow";

/**
 * Measured results, with the scope each one has on /product (src/data/yovasense.ts, evidence.items).
 * Kept here rather than read from that data, whose wording is /product's.
 */
const results = [
  {
    scope: "YovaSense · 4×V100",
    figure: "8 of 8",
    label: "injected slowdowns of about 10% and 20% flagged on the right rank, on one node of four V100s, with a tuned policy profile",
  },
  {
    scope: "YovaSense · 4×V100",
    figure: "+0.01%",
    label: "median change in step time with full detection on, across 9 matched pairs",
  },
  {
    scope: "YovaSense · 4×V100",
    figure: "+34.9%",
    label: "median samples per second after rebalancing work away from a slowed rank, across 3 matched pairs (a small MLP with one rank slowed by injected work)",
  },
  {
    scope: "GPUBridge · V100 + MI50",
    figure: "2.75×",
    label: "faster 1 GB all-reduce over TCP between a V100 and an MI50 with GPUBridge, using lossy fp8 on the bridge (1.67 s to 0.61 s)",
  },
];

/** Published production-cluster studies of stragglers (not YovaSense measurements; the caption says so and links them). */
const studies = [
  { figure: "16 of 27", label: "large training jobs (512–1,024 GPUs) hit a fail-slow slowdown in one month" },
  { figure: "~10%", label: "of allocated GPU-hours lost to stragglers, estimated from one production cluster's traces" },
  { figure: "30+ min", label: "on average, and up to days, for engineers to manually find one faulty machine" },
];

/** Where YovaSense comes from: the straggler research, GPUBridge and the measurements on real GPUs. */
export default function HomeResearch() {
  return (
    <section id="research" className="ys-sec" aria-labelledby="research-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <div className="ys-sec-head ys-scrim">
          <span className="ys-node" data-reader-mark aria-hidden="true" />
          <p className="ys-eyebrow">Research and engineering</p>
          <h2 id="research-title" className="ys-display ys-h2">Measured on real GPUs.</h2>
          <p className="ys-lede">
            YovaSense grew out of GPU reliability research on Northeastern&apos;s Explorer cluster. That work produced a straggler detector, tested on NVIDIA V100s with InfiniBand, and GPUBridge, an open-source PyTorch backend that runs NVIDIA and AMD GPUs in one job. Straggler detection is now one part of the performance degradation family.
          </p>
        </div>
        <div className="ys-results-wrap ys-scrim">
          <ul className="ys-results">
            {results.map((r) => (
              <li key={r.figure}>
                <p className="ys-res-scope ys-mono">{r.scope}</p>
                <p className="ys-res-figure ys-display">{r.figure}</p>
                <p className="ys-res-label">{r.label}</p>
              </li>
            ))}
          </ul>
          <p className="ys-fine ys-results-fine">
            Counts are cases, not accuracy rates. GPUBridge has run on six GPU models: V100, T4, L40S, A100, H200 and MI50.
          </p>
        </div>
        <figure className="ys-studies ys-scrim">
          <h3 className="ys-sub-h">Stragglers in production, from published studies</h3>
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
        <ul className="ys-research-links ys-scrim">
          <li>
            <Link className="ys-link" href="/product/#research-engineering">
              Read the research and measurements <span aria-hidden="true">→</span>
            </Link>
          </li>
          <li>
            <a className="ys-link" href={yovasense.github}>
              GPUBridge on GitHub <span aria-hidden="true">↗</span>
            </a>
          </li>
          <li>
            <a className="ys-link" href="/Architecture/">
              Read the architecture <span aria-hidden="true">→</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
