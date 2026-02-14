import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = "https://react-grep.com";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "react-grep — Inspect React Components in the Browser",
    template: "%s | react-grep",
  },
  description:
    "Hold Cmd to see React component names + file:line overlaid on any element. Zero dependencies.",
  authors: [{ name: "maxmurr", url: "https://github.com/maxmurr" }],
  openGraph: {
    title: "react-grep",
    description:
      "Hold Cmd to see React component names + file:line overlaid on any element. Zero dependencies.",
    url: SITE_URL,
    siteName: "react-grep",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "react-grep",
    description:
      "Hold Cmd to see React component names + file:line overlaid on any element. Zero dependencies.",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "react-grep",
      url: SITE_URL,
      description:
        "Hold Cmd to see React component names + file:line overlaid on any element. Zero dependencies.",
    },
    {
      "@type": "SoftwareApplication",
      name: "react-grep",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      author: { "@type": "Person", name: "maxmurr", url: "https://github.com/maxmurr" },
      license: "https://opensource.org/licenses/MIT",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Hold Cmd to see React component names + file:line overlaid on any element. Zero dependencies.",
    },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className={`${mono.variable} ${sans.variable}`}>
    <head>
      <link rel="dns-prefetch" href="https://unpkg.com" />
      <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </head>
    <body>
      <a href="#main" className="skip-link">
        Skip to Content
      </a>
      <Analytics />
      {children}
      <Script src="https://unpkg.com/react-grep/dist/index.global.js" strategy="lazyOnload" />
    </body>
  </html>
);

export default RootLayout;
