import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import Script from "next/script";
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
    default: "react-grep",
    template: "%s | react-grep",
  },
  description:
    "Hold ⌘ to see React component names + file:line overlaid on any element. Zero dependencies.",
  keywords: ["react", "devtools", "inspector", "debug", "component", "developer tools"],
  authors: [{ name: "maxmurr", url: "https://github.com/maxmurr" }],
  openGraph: {
    title: "react-grep",
    description: "Hold ⌘ to see React component names + file:line overlaid on any element",
    url: SITE_URL,
    siteName: "react-grep",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "react-grep",
    description: "Hold ⌘ to see React component names + file:line overlaid on any element",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className={`${mono.variable} ${sans.variable}`}>
    <body>
      <a href="#main" className="skip-link">
        Skip to Content
      </a>
      {children}
      <Script src="https://unpkg.com/react-grep/dist/index.global.js" strategy="lazyOnload" />
    </body>
  </html>
);

export default RootLayout;
