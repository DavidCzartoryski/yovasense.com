import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { SITE_URL } from "@/data/site";
import Header, { Footer } from "@/components/yovasense/Header";
import GetAccessForm from "@/components/yovasense/GetAccessForm";

const title = "Get access · YovaSense";
const description =
  "Set up a call to see what YovaSense would find, fix and escalate on your GPU fleet.";
/** Setting openGraph or twitter replaces the root layout's, file-based images included, so name the site card here. */
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
  alternates: { canonical: "/get-access/" },
  openGraph: { title, description, url: `${SITE_URL}/get-access/`, siteName: "YovaSense", type: "website", images: [card("opengraph-image")] },
  twitter: { card: "summary_large_image", title, description, images: [card("twitter-image")] },
};

/** Where every "Get access" leads: a short intro and the form, on a calm glow. */
export default function GetAccessPage() {
  return (
    <div className="ys-page">
      <Header cta={false} />
      <main id="main" tabIndex={-1} className="ys-ga">
        <div className="ys-wrap ys-ga-wrap">
          <div className="ys-ga-head">
            <h1 className="ys-display ys-h1 ys-ga-title">Get access to YovaSense</h1>
            <p className="ys-lede ys-ga-lede">
              Share a few details about your fleet. We&apos;ll set up a call to walk through your clusters
              and show what YovaSense would find, fix and escalate.
            </p>
          </div>
          <GetAccessForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
