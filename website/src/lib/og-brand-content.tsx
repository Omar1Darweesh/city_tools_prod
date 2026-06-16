import { type ArabicOgText } from "@/lib/arabic-text-svg";
import { BRAND } from "@/lib/og-brand-image";

type BrandOgContentProps = {
  logoSrc: string;
  arabic: ArabicOgText;
  compact?: boolean;
};

export function BrandOgContent({ logoSrc, arabic, compact = false }: BrandOgContentProps) {
  const logoHeight = compact ? 118 : 138;
  const logoWidth = compact ? 220 : 260;
  const titleImgHeight = compact ? 68 : 76;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(145deg, #080808 0%, ${BRAND.black} 45%, #1a0f10 100%)`,
        position: "relative",
        padding: compact ? 40 : 48,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.redLight} 50%, ${BRAND.red} 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -100,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,22,27,0.22), transparent 70%)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: compact ? 16 : 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: 20,
            padding: compact ? "16px 24px" : "20px 32px",
          }}
        >
          <div
            style={{
              width: logoWidth,
              height: logoHeight,
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={logoWidth} height={logoHeight + 20} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${BRAND.red})`,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={arabic.title} width={280} height={titleImgHeight} />
            <div
              style={{
                width: 48,
                height: 2,
                background: `linear-gradient(90deg, ${BRAND.red}, transparent)`,
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "NotoArabic",
              fontSize: compact ? 22 : 26,
              fontWeight: 700,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 2,
            }}
          >
            CITY TOOLS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "NotoArabic",
              fontSize: compact ? 18 : 22,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              textAlign: "center",
            }}
          >
            Your Trusted Source for Professional Tools and Equipment
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={arabic.tagline1} width={compact ? 520 : 720} height={compact ? 36 : 40} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={arabic.tagline2} width={compact ? 280 : 320} height={compact ? 36 : 40} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.redLight} 50%, ${BRAND.red} 100%)`,
        }}
      />
    </div>
  );
}
