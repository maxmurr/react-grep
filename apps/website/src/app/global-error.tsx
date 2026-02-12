"use client";

const GlobalError = ({ reset }: { reset: () => void }) => (
  <html lang="en">
    <body
      style={{
        background: "#050506",
        color: "#e4e4e7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1rem" }}>
        Something went wrong
      </h1>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "0.5rem 1.5rem",
          background: "#34d399",
          color: "#050506",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </body>
  </html>
);

export default GlobalError;
