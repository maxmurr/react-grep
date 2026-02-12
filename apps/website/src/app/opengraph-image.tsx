import { ImageResponse } from "next/og";

export const alt = "react-grep — inspect React components in the browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OgImage = () =>
  new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#050506",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          marginBottom: 24,
        }}
      >
        <span style={{ color: "#e4e4e7" }}>react</span>
        <span style={{ color: "#34d399" }}>-grep</span>
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#a1a1aa",
          maxWidth: 600,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Hold Cmd to see React component names + file:line overlaid on any element
      </div>
    </div>,
    { ...size },
  );

export default OgImage;
