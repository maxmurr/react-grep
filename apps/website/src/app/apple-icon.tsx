import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const ORBIT: CSSProperties = {
  position: "absolute",
  width: 140,
  height: 56,
  top: 62,
  left: 20,
  borderRadius: "50%",
  border: "2px solid rgba(52,211,153,0.25)",
};

const AppleIcon = () =>
  new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0a1210, #050506)",
        borderRadius: 36,
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
          fontSize: 72,
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

export default AppleIcon;
