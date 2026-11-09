import type { Metadata } from "next";
import { SITE_URL } from "@/data/site";
import { yovasense } from "@/data/yovasense";
import Header, { Footer } from "@/components/yovasense/Header";
import Hero from "@/components/yovasense/Hero";
import Homepage from "@/components/yovasense/Homepage";
import FieldStill from "@/components/yovasense/FieldStill";
import ScrollField from "@/components/yovasense/ScrollField";
import ScrollReader from "@/components/yovasense/ScrollReader";

const TITLE = `${yovasense.name} — Find and fix the GPU slowing your training job`;
const DESCRIPTION =
  "YovaSense is building autonomous GPU fleet operations: it watches distributed training while it runs, finds the slow GPU, link or host, applies a supported fix within your policies and verifies throughput recovered. Detection is a prototype; the demo is simulated.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: yovasense.founder, url: SITE_URL }],
  keywords: [
    "GPU performance regression",
    "straggler detection",
    "distributed training",
    "GPU fleet operations",
    "NCCL",
    "RCCL",
    "RDMA",
    "InfiniBand",
    "mixed-vendor GPU training",
    "GPUBridge",
    "PyTorch",
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

/** The homepage: one luminous line from the hero's all-reduce to the pilot call, over a light field that moves with the reader. */
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
