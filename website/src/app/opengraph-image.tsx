import { ImageResponse } from "next/og";
import { buildArabicOgText } from "@/lib/arabic-text-svg";
import { BrandOgContent } from "@/lib/og-brand-content";
import { getOgImageFonts, loadFontBase64, loadLogoSrc } from "@/lib/og-brand-image";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function OGImage() {
  const [logoSrc, fonts, fontBoldB64, fontRegularB64] = await Promise.all([
    loadLogoSrc(),
    getOgImageFonts(),
    loadFontBase64("NotoSansArabic-Bold.ttf"),
    loadFontBase64("NotoSansArabic-Regular.ttf"),
  ]);

  const arabic = buildArabicOgText(fontBoldB64, fontRegularB64, false);

  return new ImageResponse(<BrandOgContent logoSrc={logoSrc} arabic={arabic} />, {
    ...size,
    fonts,
  });
}
