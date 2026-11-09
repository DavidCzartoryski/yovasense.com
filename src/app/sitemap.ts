import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/product/", "/Demo/", "/Architecture/"].map(path => ({ url: `https://yovasense.com${path}` }));
}
