import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  // The landing page and its form. /product/, /Demo/ and /Architecture/ are unlisted (noindex, unlinked).
  return ["/", "/get-access/"].map(path => ({ url: `https://yovasense.com${path}` }));
}
