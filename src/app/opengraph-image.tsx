import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Know24 — Turn Your Expertise Into a Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            K
          </div>
          <span style={{ color: "white", fontSize: "48px", fontWeight: 700 }}>
            Know24
          </span>
        </div>
        <div
          style={{
            color: "#e2e8f0",
            fontSize: "32px",
            fontWeight: 500,
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Turn Your Expertise Into a Business
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "20px",
            marginTop: "16px",
            textAlign: "center",
          }}
        >
          From raw knowledge to a live storefront in under one hour
        </div>
      </div>
    ),
    { ...size }
  );
}
