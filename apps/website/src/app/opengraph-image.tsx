import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";

export const alt = "react-grep - inspect React components in the browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAME_STYLE: CSSProperties = { color: "#34d399", fontSize: 14, fontWeight: 600 };
const FILE_STYLE: CSSProperties = { color: "#52525b", fontSize: 12 };

const pill = (pos: CSSProperties, opacity: number): CSSProperties => ({
  position: "absolute",
  ...pos,
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(52,211,153,0.08)",
  border: "1px solid rgba(52,211,153,0.18)",
  borderRadius: 6,
  padding: "5px 12px",
  opacity,
});

const ORBIT: CSSProperties = {
  position: "absolute",
  width: 480,
  height: 190,
  top: 220,
  left: 360,
  borderRadius: "50%",
  border: "2px solid rgba(52,211,153,0.1)",
};

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
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={ORBIT} />
      <div style={{ ...ORBIT, transform: "rotate(60deg)" }} />
      <div style={{ ...ORBIT, transform: "rotate(-60deg)" }} />

      <div style={pill({ top: 48, left: 56 }, 0.55)}>
        <span style={NAME_STYLE}>NavBar</span>
        <span style={FILE_STYLE}>nav.tsx:8</span>
      </div>
      <div style={pill({ top: 48, right: 56 }, 0.35)}>
        <span style={NAME_STYLE}>SearchInput</span>
        <span style={FILE_STYLE}>search.tsx:23</span>
      </div>
      <div style={pill({ top: 172, left: 88 }, 0.25)}>
        <span style={NAME_STYLE}>Avatar</span>
        <span style={FILE_STYLE}>avatar.tsx:6</span>
      </div>
      <div style={pill({ top: 172, right: 120 }, 0.3)}>
        <span style={NAME_STYLE}>Header</span>
        <span style={FILE_STYLE}>header.tsx:12</span>
      </div>
      <div style={pill({ bottom: 120, left: 56 }, 0.45)}>
        <span style={NAME_STYLE}>Card</span>
        <span style={FILE_STYLE}>card.tsx:15</span>
      </div>
      <div style={pill({ bottom: 48, left: 280 }, 0.2)}>
        <span style={NAME_STYLE}>Sidebar</span>
        <span style={FILE_STYLE}>sidebar.tsx:3</span>
      </div>
      <div style={pill({ bottom: 120, right: 56 }, 0.5)}>
        <span style={NAME_STYLE}>Button</span>
        <span style={FILE_STYLE}>ui.tsx:42</span>
      </div>
      <div style={pill({ bottom: 48, right: 180 }, 0.28)}>
        <span style={NAME_STYLE}>Dialog</span>
        <span style={FILE_STYLE}>dialog.tsx:31</span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 82,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          <span style={{ color: "#e4e4e7" }}>react</span>
          <span style={{ color: "#34d399" }}>-grep</span>
        </div>

        <div
          style={{
            width: 140,
            height: 2,
            background: "linear-gradient(90deg, transparent, #34d399, transparent)",
            marginTop: 24,
            marginBottom: 28,
            borderRadius: 1,
          }}
        />

        <div
          style={{
            fontSize: 24,
            color: "#71717a",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          Hold Cmd to see React component names + file:line overlaid on any element
        </div>
      </div>
    </div>,
    { ...size },
  );

export default OgImage;
