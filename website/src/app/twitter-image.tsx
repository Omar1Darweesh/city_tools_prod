import { ImageResponse } from "next/og";
import { BrandOgContent } from "@/lib/og-brand-content";
import { getOgImageFonts, loadLogoSrc } from "@/lib/og-brand-image";

export const contentType = "image/png";
export const size = { width: 1200, height: 600 };

export default async function TwitterImage() {
  const [logoSrc, fonts] = await Promise.all([loadLogoSrc(), getOgImageFonts()]);

  return new ImageResponse(<BrandOgContent logoSrc={logoSrc} compact />, {
    ...size,
    fonts,
  });
}
