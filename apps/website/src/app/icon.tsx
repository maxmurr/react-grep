import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const ORBIT: CSSProperties = {
  position: "absolute",
  width: 28,
  height: 11,
  top: 10,
  left: 2,
  borderRadius: "50%",
  border: "1px solid rgba(52,211,153,0.35)",
};

const Icon = () =>
  new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0a1210, #050506)",
        borderRadius: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={ORBIT} />
      <div style={{ ...ORBIT, transform: "rotate(60deg)" }} />
      <div style={{ ...ORBIT, transform: "rotate(-60deg)" }} />
      <span
        style={{
          color: "#34d399",
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1,
          position: "relative",
        }}
      >
        g
      </span>
    </div>,
    { ...size },
  );

export default Icon;
