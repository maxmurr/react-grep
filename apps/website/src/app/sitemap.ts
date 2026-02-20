import type { MetadataRoute } from "next";

const SITE_URL = "https://react-grep.com";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_URL,
    lastModified: "2026-02-20",
    changeFrequency: "monthly",
    priority: 1,
  },
];

export default sitemap;
