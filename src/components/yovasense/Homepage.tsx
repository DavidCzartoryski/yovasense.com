import Link from "next/link";
import { yovasense, mailto } from "@/data/yovasense";
import CrossLayer from "./CrossLayer";
import Difference from "./Difference";
import Families from "./Families";
import HomeResearch from "./HomeResearch";
import ProductShowcase from "./ProductShowcase";
import Workflow, { Spine } from "./Workflow";

/** The pilot's mail subject (the header keeps the general PILOT_SUBJECT). */
const PILOT_WORKFLOW_SUBJECT = "YovaSense pilot: unavailable GPU nodes";

function Pilot() {
  return (
    <section id="pilot" className="ys-sec ys-sec-end" aria-labelledby="pilot-title">
      <div className="ys-wrap ys-rail">
        <Spine />
        <span className="ys-terminal" data-reader-mark aria-hidden="true" />
        <div className="ys-pilot ys-scrim">
          <p className="ys-eyebrow">Pilot</p>
          <h2 id="pilot-title" className="ys-display ys-h1">Start with unavailable GPU nodes.</h2>
          <p className="ys-lede">
            A pilot puts YovaSense on one measurable workflow: diagnosing unavailable GPU nodes and coordinating their recovery. It connects to your scheduler, nodes and GPU telemetry, you set what it may do on its own, and together we measure time to diagnosis, time to recovery and GPU capacity returned to service.
          </p>
          <div className="ys-cta-row">
            <a className="ys-btn ys-btn-pilot ys-btn-lg" href={mailto(PILOT_WORKFLOW_SUBJECT)}>
              Talk to the founders <span aria-hidden="true">↗</span>
            </a>
            <Link className="ys-link ys-link-wrap" href="/product/">
              Inside YovaSense: product, architecture and <span className="ys-nowrap">research <span aria-hidden="true">→</span></span>
            </Link>
          </div>
          <p className="ys-fine ys-pilot-addr">
            Or write to <a href={mailto(PILOT_WORKFLOW_SUBJECT)}>{yovasense.email}</a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Everything after the hero, in reading order. */
export default function Homepage() {
  return (
    <>
      <Difference />
      <Workflow />
      <CrossLayer />
      <Families />
      <ProductShowcase />
      <HomeResearch />
      <Pilot />
    </>
  );
}
