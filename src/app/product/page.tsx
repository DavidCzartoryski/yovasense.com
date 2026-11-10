import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/data/site";
import { yovasenseNav } from "@/data/yovasense";
import Header, { Footer } from "@/components/yovasense/Header";
import { Arrow, Container, SectionHead } from "@/components/yovasense/bits";
import About from "@/components/yovasense/About";
import Bridge from "@/components/yovasense/Bridge";
import Detector from "@/components/yovasense/Detector";
import Evidence from "@/components/yovasense/Evidence";
import Feedback from "@/components/yovasense/Feedback";
import HeroFigure from "@/components/yovasense/HeroFigure";
import Problem from "@/components/yovasense/Problem";
import Research from "@/components/yovasense/Research";
import Story from "@/components/yovasense/Story";
import Transport from "@/components/yovasense/Transport";

const title = "Inside YovaSense · Product, architecture, and research";
const description = "How YovaSense runs GPU infrastructure operations: the incident loop from collection to verified recovery, the research behind it, GPUBridge, and measurements on real GPUs.";
/**
 * The site's share card (src/app/opengraph-image.png, twitter-image.png and their .alt.txt).
 * Setting openGraph or twitter here replaces the root layout's, file-based images included,
 * so this page names the root card itself.
 */
const card = (name: "opengraph-image" | "twitter-image") => ({
  url: `/${name}.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: readFileSync(join(process.cwd(), "src/app", `${name}.alt.txt`), "utf8").trim(),
});
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/product/" },
  openGraph: { title, description, url: `${SITE_URL}/product/`, siteName: "YovaSense", type: "website", images: [card("opengraph-image")] },
  twitter: { card: "summary_large_image", title, description, images: [card("twitter-image")] },
};

const workflow = [
  ["Collect", "Ingests GPU metrics, Xid and ECC errors, host and kernel logs, NIC and switch counters, scheduler state and job telemetry. Missing or stale sources are recorded as missing, never filled in."],
  ["Correlate", "Aligns events in time and maps every job to its GPUs, hosts, NICs, switches and racks, so one fault becomes one incident instead of a dozen alerts."],
  ["Diagnose", "Combines known failure signatures with AI reasoning to rank likely causes, each with the evidence for and against it. A cause stays a hypothesis until a check confirms it."],
  ["Remediate", "Executes policy-approved recovery actions: GPU resets, service recovery, node isolation or workload rescheduling. Actions outside policy wait for a person's approval, and a safety limit caps how much capacity it takes out of service on its own."],
  ["Verify", "Checks hardware health, scheduler availability and workload recovery before it closes an incident. If the capacity did not come back, the incident stays open."],
  ["Escalate", "Opens a prioritized ticket with the component's identity, the evidence and repair instructions for anything that needs a technician."],
];

export default function ProductPage() {
  return (
    <div className="ys-page">
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="product-title" className="ys-intro">
          <div className="ys-intro-fold" aria-hidden="true">
            <span className="ys-intro-fold-face" />
            <span className="ys-intro-fold-edge" />
          </div>
          <Container className="py-14 md:py-24">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-[13px] text-ar-muted hover:text-ar-fg"><span aria-hidden="true">←</span> YovaSense home</Link>
            <p className="ys-eyebrow mt-8">Inside YovaSense</p>
            <h1 id="product-title" className="ys-display mt-5 max-w-[15.5em] text-[clamp(2.4rem,4.4vw,3.75rem)] leading-[1.04]">GPU infrastructure operations,<br /><span className="text-ar-data-ink">from signal to verified recovery.</span></h1>
            <p className="mt-7 max-w-[760px] text-[18px] leading-[1.7] text-ar-muted">YovaSense runs autonomous operations for GPU infrastructure. It collects telemetry from GPUs, hosts, networking, schedulers and workloads, correlates it into one incident, diagnoses the likely cause, runs the recovery actions your policy allows and verifies that the capacity is healthy again.</p>
            <p className="mt-4 max-w-[760px] text-[16px] leading-[1.7] text-ar-muted">The result: more healthy, usable GPU capacity from the fleet you already run, and less manual investigation for your GPU infrastructure operations team. Built for owned or rented clusters running training and inference, on NVIDIA and AMD.</p>
            <nav aria-label="Product contents" className="mt-10 flex flex-wrap gap-x-6 gap-y-1 border-y border-ar-line py-3 text-[13px] text-ar-muted">
              <a href="#workflow" className="inline-flex min-h-10 items-center hover:text-ar-fg">How it works</a>
              <a href="#research-engineering" className="inline-flex min-h-10 items-center hover:text-ar-fg">Research</a>
              {yovasenseNav.map((item) => <a key={item.id} href={`#${item.id}`} className="inline-flex min-h-10 items-center hover:text-ar-fg">{item.label}</a>)}
              <a href="#about" className="inline-flex min-h-10 items-center hover:text-ar-fg">Cofounders</a>
            </nav>
          </Container>
        </section>
        <section id="workflow" aria-labelledby="workflow-title" className="border-t border-ar-line py-16 md:py-24">
          <Container>
            <p className="ys-eyebrow">How it works</p>
            <h2 id="workflow-title" className="ys-display mt-5 text-[clamp(1.9rem,3.5vw,3rem)] leading-tight">An engineer in the loop.<br />Not an engineer on every alert.</h2>
            <ol className="ys-pv mt-10">
              {workflow.map(([heading, body], i) => (
                <li key={heading} className="ys-pv-step grid gap-2 py-6 md:grid-cols-[40px_240px_1fr] md:gap-6">
                  <span className="ar-mono text-[12px] text-ar-data-ink">0{i + 1}</span>
                  <h3 className="text-[18px] font-medium">{heading}</h3>
                  <p className="max-w-[640px] text-[16px] leading-[1.65] text-ar-muted">{body}</p>
                </li>
              ))}
            </ol>
            <a href="#research-engineering" className="mt-8 inline-flex min-h-11 items-center gap-2 text-[14px] text-ar-muted hover:text-ar-fg">Read the research behind it <Arrow /></a>
          </Container>
        </section>
        <section id="research-engineering" aria-labelledby="research-engineering-title" className="border-t border-ar-line py-16 md:py-24">
          <Container>
            <SectionHead
              id="research-engineering-title"
              n=""
              eyebrow="Research and engineering"
              title="Where YovaSense comes from."
              lede="YovaSense started with one question about distributed training: which GPU is slowing this job down? Answering it meant building a straggler detector, a mixed-vendor training backend and an RDMA control channel, and measuring them on real NVIDIA and AMD GPUs. That work is below. Straggler detection is now one part of the performance degradation family."
            />
            <div className="mt-12"><HeroFigure /></div>
          </Container>
        </section>
        <Problem />
        <Story />
        <Bridge />
        <Transport />
        <Detector />
        <Evidence />
        <Research />
        <About />
        <Feedback />
      </main>
      <Footer />
    </div>
  );
}
