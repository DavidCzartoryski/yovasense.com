import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  // Only the landing page. /product/, /Demo/ and /Architecture/ are unlisted (noindex, unlinked).
  return ["/"].map(path => ({ url: `https://yovasense.com${path}` }));
}
