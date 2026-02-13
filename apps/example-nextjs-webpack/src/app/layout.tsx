import type { Metadata } from "next";
import { ReactGrepInit } from "./react-grep-init";

export const metadata: Metadata = {
  title: "react-grep + Next.js (Webpack)",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body>
      <ReactGrepInit />
      {children}
    </body>
  </html>
);

export default RootLayout;
