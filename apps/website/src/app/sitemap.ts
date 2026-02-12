import type { MetadataRoute } from "next";

const SITE_URL = "https://react-grep.dev";

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  },
];

export default sitemap;
