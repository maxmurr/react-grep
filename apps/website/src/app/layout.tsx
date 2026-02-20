import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { FAQ_ITEMS } from "./faq-data";
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

const DESCRIPTION =
  "Hold Cmd to inspect React component names and source file locations on any element. Zero dependencies, ~5KB gzipped. Works with Vite, Next.js, Gatsby, and more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "react-grep - React Component Inspector",
    template: "%s | react-grep",
  },
  description: DESCRIPTION,
  keywords: [
    "react",
    "component inspector",
    "devtools",
    "react devtools",
    "debug",
    "fiber",
    "source map",
    "developer tools",
  ],
  authors: [{ name: "maxmurr", url: "https://github.com/maxmurr" }],
  openGraph: {
    title: "react-grep - React Component Inspector",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "react-grep",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "react-grep - React Component Inspector",
    description: DESCRIPTION,
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
      description: DESCRIPTION,
    },
    {
      "@type": "SoftwareApplication",
      name: "react-grep",
      url: SITE_URL,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      softwareVersion: "0.3.3",
      downloadUrl: "https://www.npmjs.com/package/react-grep",
      programmingLanguage: "TypeScript",
      codeRepository: "https://github.com/maxmurr/react-grep",
      author: { "@type": "Person", name: "maxmurr", url: "https://github.com/maxmurr" },
      license: "https://opensource.org/licenses/MIT",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: DESCRIPTION,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
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
