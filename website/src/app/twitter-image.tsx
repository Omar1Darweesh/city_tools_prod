import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 1200, height: 600 };

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1923 0%, #1a2535 50%, #0f1923 100%)",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: "linear-gradient(135deg, #C0161B, #e83030)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800,
                color: "white",
              }}
            >
              CT
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: "white", lineHeight: 1 }}>
                City Tools
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, color: "rgba(255,255,255,0.5)", lineHeight: 1.2 }}>
                سيتي تولز
              </span>
            </div>
          </div>
          <p style={{ fontSize: 22, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Professional Tools & Equipment in Egypt
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
