import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const Icon = () =>
  new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050506",
        borderRadius: 6,
      }}
    >
      <span style={{ color: "#34d399", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>g</span>
    </div>,
    { ...size },
  );

export default Icon;
