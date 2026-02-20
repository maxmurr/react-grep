import type { MetadataRoute } from "next";

const SITE_URL = "https://react-grep.com";

const robots = (): MetadataRoute.Robots => ({
  rules: [
    { userAgent: "*", allow: "/" },
    { userAgent: "GPTBot", allow: "/" },
    { userAgent: "ChatGPT-User", allow: "/" },
    { userAgent: "PerplexityBot", allow: "/" },
    { userAgent: "ClaudeBot", allow: "/" },
    { userAgent: "anthropic-ai", allow: "/" },
  ],
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
