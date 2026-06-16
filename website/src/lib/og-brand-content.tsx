import { BRAND } from "@/lib/og-brand-image";

type BrandOgContentProps = {
  logoSrc: string;
  compact?: boolean;
};

export function BrandOgContent({ logoSrc, compact = false }: BrandOgContentProps) {
  const logoHeight = compact ? 118 : 138;
  const logoWidth = compact ? 220 : 260;

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
            <span
              style={{
                fontFamily: "NotoArabic",
                fontSize: compact ? 44 : 52,
                fontWeight: 700,
                color: "white",
              }}
            >
              سيتي تولز
            </span>
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
          <span
            style={{
              fontFamily: "NotoArabic",
              fontSize: compact ? 17 : 20,
              fontWeight: 400,
              color: "rgba(255,255,255,0.45)",
              textAlign: "center",
            }}
          >
            مصدرك الموثوق للأدوات والمعدات الاحترافية في مصر
          </span>
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
