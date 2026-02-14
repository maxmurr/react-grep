import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

const NotFound = () => (
  <main
    id="main"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      textAlign: "center",
    }}
  >
    <h1
      style={{
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: "3rem",
        fontWeight: 700,
        marginBottom: "1rem",
      }}
    >
      404
    </h1>
    <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Page not found.</p>
    <Link href="/" style={{ color: "var(--accent-text)" }}>
      Back to home
    </Link>
  </main>
);

export default NotFound;
