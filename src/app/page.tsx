import type { Metadata } from "next";
import { SITE_URL } from "@/data/site";
import { yovasense } from "@/data/yovasense";
import Header, { Footer } from "@/components/yovasense/Header";
import Hero from "@/components/yovasense/Hero";
import Homepage from "@/components/yovasense/Homepage";

const TITLE = `${yovasense.name} — Find and fix the GPU slowing your training job`;
const DESCRIPTION =
  "YovaSense monitors distributed AI training while it runs, pinpoints the slow GPU, link, or host, fixes it within your policies, and verifies throughput recovered. For AI infrastructure teams, across NVIDIA and AMD, on owned or rented clusters.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: yovasense.founder, url: SITE_URL }],
  keywords: [
    "GPU performance regression",
    "straggler detection",
    "distributed training",
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

/** A short product introduction. Technical depth lives at /product/. */
export default function YovaSensePage() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Homepage />
      </main>
      <Footer />
    </>
  );
}
