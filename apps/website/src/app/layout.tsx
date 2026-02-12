import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "react-grep",
  description: "Hold CMD to see React component names + file:line overlaid on any element",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
  </html>
);

export default RootLayout;
