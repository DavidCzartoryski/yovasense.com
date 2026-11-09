import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/data/site";
import { yovasenseNav } from "@/data/yovasense";
import Header, { Footer } from "@/components/yovasense/Header";
import { Arrow, Container } from "@/components/yovasense/bits";
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
const description = "What YovaSense is, how it works, and where it is headed: distributed training diagnostics, GPUBridge, performance evidence, and the autonomous performance-engineering workflow.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/product/" },
  openGraph: { title, description, url: `${SITE_URL}/product/`, siteName: "YovaSense", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const workflow = [
  ["Observe and detect", "Build workload-aware baselines and find persistent slowdowns without confusing different hardware with faulty hardware."],
  ["Confirm the regression", "Repeat suspicious measurements and compare matched workloads, hardware, topology, and software configurations."],
  ["Diagnose the cause", "Connect evidence across the input pipeline, host, GPU, collectives, and network. Test an explanation before treating it as a cause."],
  ["Take permitted action", "Recommend a targeted fix or apply a supported correction within operator policy. Keep workload adaptation mathematically correct."],
  ["Verify recovery", "Measure whether useful throughput improved. Keep the evidence, support reversible rollback, and escalate what needs an engineer."],
];

export default function ProductPage() {
  return (
    <div className="ys-page">
      <Header current="product" />
      <main id="main" tabIndex={-1} className="outline-none">
        <section aria-labelledby="product-title" className="ys-intro">
          <div className="ys-intro-fold" aria-hidden="true">
            <span className="ys-intro-fold-face" />
            <span className="ys-intro-fold-edge" />
          </div>
          <Container className="py-14 md:py-24">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-[13px] text-ar-muted hover:text-ar-fg"><span aria-hidden="true">←</span> YovaSense home</Link>
            <p className="ys-eyebrow mt-8">What we are. What we&apos;re building.</p>
            <h1 id="product-title" className="ys-display mt-5 max-w-[900px] text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.04]">Performance engineering,<br /><span className="text-ar-data-ink">from signal to recovery.</span></h1>
            <p className="mt-7 max-w-[760px] text-[18px] leading-[1.7] text-ar-muted">YovaSense is an autonomous performance engineer for distributed AI training. We&apos;re building a system that connects continuous detection, evidence-backed diagnosis, performance-regression testing, and permitted correction in one closed loop.</p>
            <p className="mt-4 max-w-[760px] text-[16px] leading-[1.7] text-ar-muted">The goal: more useful training from the GPUs you already have, with less manual investigation. Built for teams running owned or rented clusters, across supported GPU vendors and generations.</p>
            <div className="ys-intro-note mt-9 max-w-[840px]">
              <h2 className="text-[16px] font-medium">An early product, with a clear destination.</h2>
              <p className="mt-2 text-[14px] leading-[1.7] text-ar-muted">The full autonomous workflow below is our product direction, not a claim that every capability is production-ready. Existing work includes GPUBridge and detector prototypes. Hardware results later on this page are historical, scoped experiments—not customer deployments or guarantees for the current build.</p>
            </div>
            <nav aria-label="Product contents" className="mt-10 flex flex-wrap gap-x-6 gap-y-1 border-y border-ar-line py-3 text-[13px] text-ar-muted">
              <a href="#workflow" className="inline-flex min-h-10 items-center hover:text-ar-fg">Product vision</a>
              {yovasenseNav.map((item) => <a key={item.id} href={`#${item.id}`} className="inline-flex min-h-10 items-center hover:text-ar-fg">{item.label}</a>)}
              <a href="#about" className="inline-flex min-h-10 items-center hover:text-ar-fg">Cofounders</a>
            </nav>
          </Container>
        </section>
        <section id="workflow" aria-labelledby="workflow-title" className="border-t border-ar-line py-16 md:py-24">
          <Container>
            <p className="ys-eyebrow">The product vision</p>
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
            <p className="mt-7 max-w-[800px] text-[15px] leading-[1.7] text-ar-muted">Cross-stack diagnosis and scheduled regression testing are planned work. A learned diagnosis model needs permitted incident data and held-out evaluation. The dedicated agent telemetry/control plane is separate from GPUBridge&apos;s training-data transport; RDMA support in one does not establish completion of the other.</p>
            <div className="mt-12"><HeroFigure /></div>
            <a href="#detector" className="mt-6 inline-flex min-h-11 items-center gap-2 text-[14px] text-ar-muted hover:text-ar-fg">Explore the detector architecture <Arrow /></a>
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
