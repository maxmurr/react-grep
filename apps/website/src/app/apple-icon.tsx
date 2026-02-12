import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const AppleIcon = () =>
  new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050506",
        borderRadius: 36,
      }}
    >
      <span style={{ color: "#34d399", fontSize: 110, fontWeight: 700, lineHeight: 1 }}>g</span>
    </div>,
    { ...size },
  );

export default AppleIcon;
