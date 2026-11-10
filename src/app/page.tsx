import type { Metadata } from "next";
import { SITE_URL } from "@/data/site";
import { yovasense } from "@/data/yovasense";
import Header, { Footer } from "@/components/yovasense/Header";
import Hero from "@/components/yovasense/Hero";
import Homepage from "@/components/yovasense/Homepage";
import FieldStill from "@/components/yovasense/FieldStill";
import ScrollField from "@/components/yovasense/ScrollField";
import ScrollReader from "@/components/yovasense/ScrollReader";

const TITLE = `${yovasense.name} — Autonomous operations for GPU infrastructure`;
const DESCRIPTION =
  "YovaSense correlates telemetry across GPUs, hosts, networking, schedulers and workloads to diagnose infrastructure incidents, run safe, approved recovery actions and verify that GPU capacity is healthy again, for training and inference.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: yovasense.founder, url: SITE_URL }],
  keywords: [
    "GPU infrastructure operations",
    "GPU fleet operations",
    "GPU incident diagnosis",
    "Xid 79",
    "GPU fallen off the bus",
    "InfiniBand",
    "NCCL",
    "RDMA",
    "Slurm",
    "Kubernetes",
    "DCGM",
    "straggler detection",
    "GPUBridge",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    siteName: yovasense.name,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** The homepage: signal layers converge into one diagnosis in the hero and become one luminous line that runs to the pilot call, over a light field that moves with the reader. */
export default function YovaSensePage() {
  return (
    <>
      <ScrollField>
        <FieldStill />
      </ScrollField>
      <ScrollReader />
      <div className="ys-page">
        <Header />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Homepage />
        </main>
        <Footer />
      </div>
    </>
  );
}
