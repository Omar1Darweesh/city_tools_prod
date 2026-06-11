import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OGImage() {
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
          background: "linear-gradient(135deg, #0f1923 0%, #1a2535 50%, #0f1923 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(192,22,27,0.2), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(192,22,27,0.15), transparent)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #C0161B, #e83030)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
              color: "white",
            }}
          >
            CT
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              City Tools
            </span>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              سيتي تولز
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 600,
            marginTop: 8,
          }}
        >
          Your Trusted Source for Professional Tools & Equipment
        </p>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 12,
          }}
        >
          {["⚡", "🔧", "🔩", "💧", "🛡️", "🏭"].map((emoji, i) => (
            <span key={i} style={{ fontSize: 24, opacity: 0.3 }}>
              {emoji}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
