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
  "Built for GPU cloud providers and research computing teams. YovaSense finds the root cause, automates the fix and escalates what remains.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: yovasense.founder, url: SITE_URL }],
  keywords: [
    "GPU infrastructure operations",
    "autonomous GPU operations",
    "GPU incident response",
    "GPU cloud providers",
    "research computing",
    "Slurm",
    "Kubernetes",
    "Slack",
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

/** The landing page: signal layers converge into one diagnosis in the hero and become one luminous line that runs to the final call to action, over a light field that moves with the reader. */
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
