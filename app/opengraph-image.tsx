import { ImageResponse } from "next/og";

export const alt = "Layoot — Desain selebaran dan majalah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0a0a0a,#4c1d95)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800 }}>Layoot</div>
        <div style={{ fontSize: 40, opacity: 0.85, marginTop: 16 }}>
          Desain selebaran dan majalah A4 & F4
        </div>
      </div>
    ),
    size
  );
}