import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "react-grep",
  description: "Hold CMD to see React component names + file:line overlaid on any element",
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
      <Script src="https://unpkg.com/react-grep/dist/index.global.js" strategy="afterInteractive" />
    </body>
  </html>
);

export default RootLayout;
